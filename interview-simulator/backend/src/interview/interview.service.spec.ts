import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { OpenRouterService } from '../openrouter/openrouter.service';

describe('InterviewService', () => {
  let service: InterviewService;
  let openRouterService: Partial<OpenRouterService>;

  const mockInterviewerResponse = {
    messages: [
      {
        text: 'Welcome! I am Alex, your interviewer today.',
        facialExpression: 'smile' as const,
        animation: 'Waving' as const,
        emotion: 'happy' as const,
      },
    ],
    metadata: {
      questionNumber: 0,
      totalQuestions: 8,
      phase: 'greeting' as const,
    },
  };

  beforeEach(async () => {
    openRouterService = {
      chat: jest.fn().mockResolvedValue(
        JSON.stringify({
          overallScore: 75,
          strengths: ['Good communication'],
          improvements: ['More examples needed'],
          questionScores: [
            {
              question: 'Tell me about yourself',
              answer: 'I am a developer',
              score: 7,
              feedback: 'Good overview',
            },
          ],
          suggestedResources: ['STAR Method Guide'],
        }),
      ),
      chatStructured: jest.fn().mockResolvedValue(mockInterviewerResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewService,
        { provide: OpenRouterService, useValue: openRouterService },
      ],
    }).compile();

    service = module.get<InterviewService>(InterviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startInterview()', () => {
    it('should create a session and return first response', async () => {
      const result = await service.startInterview({
        role: 'Software Engineer',
        type: 'technical',
        difficulty: 'mid',
      });

      expect(result.sessionId).toBeDefined();
      expect(result.response).toEqual(mockInterviewerResponse);
      expect(openRouterService.chatStructured).toHaveBeenCalledTimes(1);
    });

    it('should pass config options to the prompt builder', async () => {
      await service.startInterview({
        role: 'Frontend Developer',
        type: 'behavioral',
        difficulty: 'senior',
        language: 'es',
        totalQuestions: 10,
        persona: 'strict',
      });

      const callArgs = (openRouterService.chatStructured as jest.Mock).mock
        .calls[0][0] as Array<{ role: string; content: string }>;
      const systemPrompt = callArgs.find((m) => m.role === 'system')!.content;

      expect(systemPrompt).toContain('Frontend Developer');
      expect(systemPrompt).toContain('senior');
      expect(systemPrompt).toContain('Spanish');
      expect(systemPrompt).toContain('Strict');
    });
  });

  describe('sendMessage()', () => {
    it('should send a message and return AI response', async () => {
      const start = await service.startInterview({
        role: 'QA Engineer',
        type: 'mixed',
        difficulty: 'junior',
      });

      const nextResponse = {
        messages: [
          {
            text: 'Great answer! Next question...',
            facialExpression: 'smile' as const,
            animation: 'Nodding' as const,
            emotion: 'encouraging' as const,
          },
        ],
        metadata: {
          questionNumber: 1,
          totalQuestions: 8,
          phase: 'warmup' as const,
          scoreHint: 7,
        },
      };

      (openRouterService.chatStructured as jest.Mock).mockResolvedValueOnce(
        nextResponse,
      );

      const result = await service.sendMessage(
        start.sessionId,
        'I have 3 years of experience in QA',
      );

      expect(result.response).toEqual(nextResponse);
    });

    it('should throw NotFoundException for invalid session', async () => {
      await expect(
        service.sendMessage('nonexistent-uuid', 'hello'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for ended session', async () => {
      const start = await service.startInterview({
        role: 'Developer',
        type: 'technical',
        difficulty: 'mid',
      });

      await service.endInterview(start.sessionId);

      await expect(
        service.sendMessage(start.sessionId, 'test'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('endInterview()', () => {
    it('should generate an evaluation report', async () => {
      const start = await service.startInterview({
        role: 'Backend Dev',
        type: 'technical',
        difficulty: 'mid',
      });

      const result = await service.endInterview(start.sessionId);

      expect(result.report.overallScore).toBe(75);
      expect(result.report.strengths).toContain('Good communication');
      expect(openRouterService.chat).toHaveBeenCalledTimes(1);
    });

    it('should throw if ending an already ended interview', async () => {
      const start = await service.startInterview({
        role: 'Dev',
        type: 'mixed',
        difficulty: 'junior',
      });

      await service.endInterview(start.sessionId);

      await expect(
        service.endInterview(start.sessionId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSessionState()', () => {
    it('should return session state', async () => {
      const start = await service.startInterview({
        role: 'DevOps',
        type: 'technical',
        difficulty: 'senior',
      });

      const state = service.getSessionState(start.sessionId);

      expect(state.id).toBe(start.sessionId);
      expect(state.config.role).toBe('DevOps');
      expect(state.ended).toBe(false);
    });
  });

  describe('parseResume()', () => {
    it('should throw BadRequestException on invalid buffer', async () => {
      const emptyBuf = Buffer.from('not a pdf');
      await expect(service.parseResume(emptyBuf)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
