import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenRouterService } from './openrouter.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OpenRouterService', () => {
  let service: OpenRouterService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        OPENROUTER_API_KEY: 'test-api-key',
      };
      return config[key];
    }),
  };

  const mockPost = jest.fn();

  beforeEach(async () => {
    mockedAxios.create.mockReturnValue({
      post: mockPost,
    } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenRouterService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OpenRouterService>(OpenRouterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat()', () => {
    it('should send messages and return assistant content', async () => {
      const mockResponse = {
        data: {
          id: 'gen-123',
          choices: [
            {
              message: {
                role: 'assistant',
                content: '{"messages":[{"text":"Hello"}]}',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await service.chat([
        { role: 'user', content: 'Hello' },
      ]);

      expect(result).toBe('{"messages":[{"text":"Hello"}]}');
      expect(mockPost).toHaveBeenCalledWith('/chat/completions', {
        model: 'arcee-ai/arcee-blitz',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      });
    });

    it('should retry on 500 errors', async () => {
      const serverError = {
        response: { status: 500 },
        message: 'Internal Server Error',
      };

      const mockResponse = {
        data: {
          id: 'gen-456',
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'recovered',
              },
            },
          ],
        },
      };

      mockPost
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce(mockResponse);

      const result = await service.chat([
        { role: 'user', content: 'test' },
      ]);

      expect(result).toBe('recovered');
      expect(mockPost).toHaveBeenCalledTimes(2);
    }, 15000);

    it('should throw after max retries', async () => {
      const serverError = {
        response: { status: 500, headers: {} },
        message: 'Internal Server Error',
      };

      mockPost
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError);

      await expect(
        service.chat([{ role: 'user', content: 'test' }]),
      ).rejects.toBeDefined();

      expect(mockPost).toHaveBeenCalledTimes(4);
    }, 30000);
  });

  describe('chatStructured()', () => {
    it('should parse valid JSON interviewer response', async () => {
      const interviewerResponse = {
        messages: [
          {
            text: 'Welcome to the interview!',
            facialExpression: 'smile',
            animation: 'Waving',
            emotion: 'happy',
          },
        ],
        metadata: {
          questionNumber: 0,
          totalQuestions: 8,
          phase: 'greeting',
        },
      };

      const mockResponse = {
        data: {
          id: 'gen-789',
          choices: [
            {
              message: {
                role: 'assistant',
                content: JSON.stringify(interviewerResponse),
              },
            },
          ],
        },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await service.chatStructured([
        { role: 'user', content: 'Start interview' },
      ]);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].text).toBe('Welcome to the interview!');
      expect(result.metadata.phase).toBe('greeting');
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      const json = JSON.stringify({
        messages: [
          {
            text: 'Hello!',
            facialExpression: 'default',
            animation: 'Idle',
            emotion: 'neutral',
          },
        ],
        metadata: {
          questionNumber: 1,
          totalQuestions: 8,
          phase: 'warmup',
        },
      });

      const mockResponse = {
        data: {
          id: 'gen-abc',
          choices: [
            {
              message: {
                role: 'assistant',
                content: '```json\n' + json + '\n```',
              },
            },
          ],
        },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await service.chatStructured([
        { role: 'user', content: 'test' },
      ]);

      expect(result.messages[0].text).toBe('Hello!');
    });

    it('should throw on invalid response structure', async () => {
      const mockResponse = {
        data: {
          id: 'gen-bad',
          choices: [
            {
              message: {
                role: 'assistant',
                content: '{"invalid": true}',
              },
            },
          ],
        },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      await expect(
        service.chatStructured([{ role: 'user', content: 'test' }]),
      ).rejects.toThrow('Invalid interviewer response format');
    });
  });
});
