import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { OpenRouterService } from '../openrouter/openrouter.service';
import { buildInterviewerSystemPrompt } from '../openrouter/prompts';
import { EVALUATOR_SYSTEM_PROMPT } from '../openrouter/prompts';
import { ChatMessage, InterviewerResponse, InterviewReportSchema } from '../openrouter/schemas';
import { StartInterviewDto } from './dto';
import { PromptInjectionGuard } from './guards';
import {
  InterviewSession,
  InterviewReport,
  InterviewResponseDto,
} from './interfaces';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);
  private readonly sessions = new Map<string, InterviewSession>();

  constructor(
    private readonly openRouter: OpenRouterService,
    private readonly injectionGuard: PromptInjectionGuard,
  ) {
    // Cleanup expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  // ── Start a new interview ─────────────────────────────────

  async startInterview(dto: StartInterviewDto): Promise<InterviewResponseDto> {
    const sessionId = randomUUID();
    const languageMap = { en: 'English', es: 'Spanish' } as const;

    const session: InterviewSession = {
      id: sessionId,
      config: {
        role: dto.role,
        type: dto.type,
        difficulty: dto.difficulty,
        language: dto.language ?? 'en',
        totalQuestions: dto.totalQuestions ?? 8,
        persona: dto.persona ?? 'friendly',
        resumeText: dto.resumeText,
        jobDescription: dto.jobDescription,
      },
      history: [],
      currentQuestion: 0,
      phase: 'greeting',
      ended: false,
      lastActivity: Date.now(),
      createdAt: Date.now(),
    };

    // Build system prompt
    const systemPrompt = buildInterviewerSystemPrompt({
      role: dto.role,
      difficulty: dto.difficulty,
      persona: dto.persona ?? 'friendly',
      totalQuestions: dto.totalQuestions ?? 8,
      language: languageMap[dto.language ?? 'en'],
      resumeContext: dto.resumeText,
      jobDescription: dto.jobDescription,
    });

    session.history.push({ role: 'system', content: systemPrompt });

    // Send initial message to get the greeting
    const startMessage: ChatMessage = {
      role: 'user',
      content:
        'Please start the interview. Greet me and ask your first question.',
    };
    session.history.push(startMessage);

    const response = await this.openRouter.chatStructured(session.history);

    // Store assistant response in history
    session.history.push({
      role: 'assistant',
      content: JSON.stringify(response),
    });

    // Update session state from response metadata
    session.currentQuestion = response.metadata.questionNumber;
    session.phase = response.metadata.phase;

    this.sessions.set(sessionId, session);
    this.logger.log(`Interview started: ${sessionId} — role: ${dto.role}`);

    return { sessionId, response };
  }

  // ── Send a candidate message ──────────────────────────────

  async sendMessage(
    sessionId: string,
    message: string,
  ): Promise<InterviewResponseDto> {
    const session = this.getSession(sessionId);

    if (session.ended) {
      throw new BadRequestException('Interview session has already ended');
    }

    session.lastActivity = Date.now();

    // ── Prompt-injection defence: validate & sanitize ───────
    const sanitizedMessage = this.injectionGuard.validateAndSanitize(message);

    // Add sanitized candidate message to history
    session.history.push({ role: 'user', content: sanitizedMessage });

    // Get AI response
    const response = await this.openRouter.chatStructured(session.history);

    // Store assistant response
    session.history.push({
      role: 'assistant',
      content: JSON.stringify(response),
    });

    // Update session state
    session.currentQuestion = response.metadata.questionNumber;
    session.phase = response.metadata.phase;

    this.logger.log(
      `Message processed: ${sessionId} — Q${response.metadata.questionNumber}/${response.metadata.totalQuestions} — phase: ${response.metadata.phase}`,
    );

    return { sessionId, response };
  }

  // ── End interview and get evaluation ──────────────────────

  async endInterview(sessionId: string): Promise<{
    sessionId: string;
    report: InterviewReport;
  }> {
    const session = this.getSession(sessionId);

    // Idempotent: if already evaluated, return existing report
    if (session.ended && session.report) {
      this.logger.log(`Interview already evaluated: ${sessionId} — returning cached report`);
      return { sessionId, report: session.report };
    }

    if (session.ended) {
      throw new BadRequestException('Interview has already been evaluated but no report exists');
    }

    session.ended = true;
    session.lastActivity = Date.now();

    // Build the transcript for the evaluator
    const transcript = session.history
      .filter((msg) => msg.role !== 'system')
      .map((msg) => {
        const role =
          msg.role === 'user' ? 'Candidate' : 'Interviewer';
        let content = msg.content;
        // Parse assistant JSON to get readable text
        if (msg.role === 'assistant') {
          try {
            const parsed = JSON.parse(msg.content);
            content = parsed.messages.map((m: any) => m.text).join(' ');
          } catch {
            // keep raw content
          }
        }
        return `${role}: ${content}`;
      })
      .join('\n\n');

    const evaluationMessages: ChatMessage[] = [
      { role: 'system', content: EVALUATOR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `
Please evaluate the following interview transcript.

**Position**: ${session.config.role}
**Difficulty**: ${session.config.difficulty}
**Interview Type**: ${session.config.type}

## Transcript
${transcript}
`.trim(),
      },
    ];

    const rawReport = await this.openRouter.chat(evaluationMessages);

    // Parse and validate the evaluation report with Zod
    let report: InterviewReport;
    try {
      let jsonStr = rawReport.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      const parsed = JSON.parse(jsonStr);
      report = InterviewReportSchema.parse(parsed);
    } catch (err) {
      this.logger.error(`Failed to parse/validate evaluation report: ${rawReport}`);
      throw new BadRequestException('Failed to generate evaluation report');
    }

    session.report = report;

    this.logger.log(
      `Interview evaluated: ${sessionId} — score: ${report.overallScore}`,
    );

    return { sessionId, report };
  }

  // ── Get session state ─────────────────────────────────────

  getSessionState(sessionId: string) {
    const session = this.getSession(sessionId);
    return {
      id: session.id,
      config: session.config,
      currentQuestion: session.currentQuestion,
      phase: session.phase,
      ended: session.ended,
      messageCount: session.history.filter((m) => m.role === 'user').length,
      createdAt: new Date(session.createdAt).toISOString(),
      report: session.report,
    };
  }

  // ── Parse resume PDF ───────────────────────────────────────

  async parseResume(buffer: Buffer): Promise<{ text: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const result = await pdfParse(buffer);
      const text = (result.text as string).trim();

      if (!text) {
        throw new BadRequestException('PDF contains no extractable text');
      }

      this.logger.log(`Resume parsed: ${text.length} characters extracted`);
      return { text };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Failed to parse PDF: ${err}`);
      throw new BadRequestException('Failed to parse PDF file');
    }
  }

  // ── Helpers ───────────────────────────────────────────────

  private getSession(sessionId: string): InterviewSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(
        `Interview session not found: ${sessionId}`,
      );
    }

    // Check timeout
    if (Date.now() - session.lastActivity > SESSION_TIMEOUT_MS) {
      this.sessions.delete(sessionId);
      throw new BadRequestException(
        'Interview session has expired due to inactivity',
      );
    }

    return session;
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
        this.sessions.delete(id);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired sessions`);
    }
  }
}
