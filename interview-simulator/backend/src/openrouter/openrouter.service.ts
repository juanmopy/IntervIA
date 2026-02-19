import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  ChatMessage,
  InterviewerResponse,
  InterviewerResponseSchema,
  OpenRouterResponseSchema,
} from './schemas';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly client: AxiosInstance;
  private readonly model: string;

  // ── Rate-limit queue ──────────────────────────────────────
  private queue: Array<{
    resolve: (value: string) => void;
    reject: (reason: unknown) => void;
    messages: ChatMessage[];
  }> = [];
  private processing = false;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    this.model = this.configService.get<string>('OPENROUTER_MODEL') ?? 'arcee-ai/trinity-large-preview:free';

    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://interview-simulator.app',
        'X-Title': 'Interview Simulator',
        'Content-Type': 'application/json',
      },
      timeout: 60_000,
    });
  }

  // ── Public API ────────────────────────────────────────────

  /**
   * Send a chat completion request and return the raw assistant content.
   * Automatically retries on transient errors and queues on 429.
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    return this.enqueue(messages);
  }

  /**
   * Send a chat request and parse the response as a structured
   * InterviewerResponse validated by Zod.
   */
  async chatStructured(messages: ChatMessage[]): Promise<InterviewerResponse> {
    const raw = await this.chat(messages);
    return this.parseInterviewerResponse(raw);
  }

  // ── Rate-limit queue ──────────────────────────────────────

  private enqueue(messages: ChatMessage[]): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, messages });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      try {
        const result = await this.executeWithRetry(item.messages);
        item.resolve(result);
      } catch (err) {
        item.reject(err);
      }
    }

    this.processing = false;
  }

  // ── Retry logic with exponential backoff ──────────────────

  private async executeWithRetry(
    messages: ChatMessage[],
    maxRetries = 3,
  ): Promise<string> {
    const delays = [1000, 2000, 4000];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.execute(messages);
      } catch (err) {
        const isLast = attempt === maxRetries;
        const axiosErr = err as AxiosError;
        const status = axiosErr?.response?.status;

        // Rate limited → wait and retry
        if (status === 429 && !isLast) {
          const retryAfter =
            Number(axiosErr.response?.headers?.['retry-after']) || delays[attempt];
          this.logger.warn(
            `Rate limited (429). Retrying in ${retryAfter}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await this.sleep(retryAfter);
          continue;
        }

        // Transient server errors → retry
        if (status && status >= 500 && !isLast) {
          this.logger.warn(
            `Server error (${status}). Retrying in ${delays[attempt]}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await this.sleep(delays[attempt]);
          continue;
        }

        // Non-retryable or last attempt → throw
        this.logger.error(
          `OpenRouter request failed after ${attempt + 1} attempts: ${axiosErr.message}`,
        );
        throw err;
      }
    }

    throw new Error('Unexpected: exceeded retry loop');
  }

  // ── Core HTTP call ────────────────────────────────────────

  private async execute(messages: ChatMessage[]): Promise<string> {
    this.logger.log(
      `Sending chat request — ${messages.length} messages, model: ${this.model}`,
    );

    const { data } = await this.client.post('/chat/completions', {
      model: this.model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    // Validate OpenRouter envelope
    const parsed = OpenRouterResponseSchema.parse(data);
    const content = parsed.choices[0].message.content;

    this.logger.log(
      `Response received — tokens: ${parsed.usage?.total_tokens ?? 'N/A'}`,
    );

    return content;
  }

  // ── JSON response parsing ─────────────────────────────────

  private parseInterviewerResponse(raw: string): InterviewerResponse {
    // Try to extract JSON from the response (handles markdown code blocks)
    let jsonStr = raw.trim();

    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return InterviewerResponseSchema.parse(parsed);
    } catch (err) {
      this.logger.error(`Failed to parse interviewer response: ${raw}`);
      throw new Error(
        `Invalid interviewer response format: ${(err as Error).message}`,
      );
    }
  }

  // ── Helpers ───────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
