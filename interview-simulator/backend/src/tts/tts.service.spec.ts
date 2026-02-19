import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TtsService } from './tts.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TtsService', () => {
  let service: TtsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TtsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => {
              if (key === 'GOOGLE_TTS_API_KEY') return 'test-key';
              return fallback;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TtsService>(TtsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('synthesize()', () => {
    it('should return audio and lipsync data from Google TTS', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          audioContent: 'base64audiocontent==',
          timepoints: [
            { markName: 'w0', timeSeconds: 0.0 },
            { markName: 'w1', timeSeconds: 0.4 },
            { markName: 'w2', timeSeconds: 0.7 },
          ],
        },
      });

      const result = await service.synthesize({
        text: 'Hello my friend',
        language: 'en-US',
      });

      expect(result.audio).toBe('base64audiocontent==');
      expect(result.audioMimeType).toBe('audio/mpeg');
      expect(result.fallback).toBe(false);
      expect(result.lipsync.mouthCues).toHaveLength(3);
      expect(result.lipsync.mouthCues[0].word).toBe('Hello');
      expect(result.lipsync.mouthCues[0].viseme).toBeDefined();
    });

    it('should fall back to text-only when Google TTS fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API key invalid'));

      const result = await service.synthesize({
        text: 'Hello world',
      });

      expect(result.fallback).toBe(true);
      expect(result.audio).toBe('');
      expect(result.lipsync.mouthCues).toHaveLength(2);
      expect(result.lipsync.mouthCues[0].word).toBe('Hello');
      expect(result.lipsync.mouthCues[1].word).toBe('world');
    });

    it('should generate estimated timings when no timepoints returned', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          audioContent: 'somebase64==',
          timepoints: [],
        },
      });

      const result = await service.synthesize({
        text: 'Test sentence here',
      });

      expect(result.fallback).toBe(false);
      expect(result.lipsync.mouthCues).toHaveLength(3);
      // Estimated timings should be sequential
      expect(result.lipsync.mouthCues[0].start).toBeLessThan(
        result.lipsync.mouthCues[1].start,
      );
    });

    it('should support Spanish language', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          audioContent: 'audioes==',
          timepoints: [
            { markName: 'w0', timeSeconds: 0.0 },
            { markName: 'w1', timeSeconds: 0.5 },
          ],
        },
      });

      const result = await service.synthesize({
        text: 'Hola amigo',
        language: 'es-ES',
        gender: 'female',
      });

      expect(result.lipsync.mouthCues[0].word).toBe('Hola');
      // Verify correct voice was requested
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('texttospeech.googleapis.com'),
        expect.objectContaining({
          voice: expect.objectContaining({
            languageCode: 'es-ES',
            name: 'es-ES-Neural2-A',
          }),
        }),
        expect.any(Object),
      );
    });
  });
});
