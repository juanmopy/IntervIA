import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { TtsRequest, TtsResponse, LipsyncData } from './interfaces';
import { wordsToVisemes, estimateWordTimings } from './viseme-mapper';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly apiKey: string;
  private readonly baseUrl =
    'https://texttospeech.googleapis.com/v1/text:synthesize';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_TTS_API_KEY', '');
  }

  /**
   * Synthesize speech from text with word-level lipsync data.
   * Falls back to text-only mode if Google TTS is unavailable.
   */
  async synthesize(request: TtsRequest): Promise<TtsResponse> {
    const { text, language = 'en-US', gender = 'male' } = request;

    try {
      return await this.synthesizeWithGoogle(text, language, gender);
    } catch (err) {
      this.logger.warn(
        `Google TTS failed, returning text-only fallback: ${(err as Error).message}`,
      );
      return this.createFallbackResponse(text);
    }
  }

  // ── Google Cloud TTS ──────────────────────────────────────

  private async synthesizeWithGoogle(
    text: string,
    language: string,
    gender: string,
  ): Promise<TtsResponse> {
    // Build SSML with <mark> tags for word boundaries
    const ssml = this.buildSsml(text);

    const voiceName = this.getVoiceName(language, gender);

    const response = await axios.post(
      `${this.baseUrl}?key=${this.apiKey}`,
      {
        input: { ssml },
        voice: {
          languageCode: language,
          name: voiceName,
          ssmlGender: gender.toUpperCase(),
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0,
          effectsProfileId: ['headphone-class-device'],
        },
        enableTimePointing: ['SSML_MARK'],
      },
      { timeout: 30_000 },
    );

    const audioContent: string = response.data.audioContent;
    const timepoints: Array<{
      markName: string;
      timeSeconds: number;
    }> = response.data.timepoints || [];

    const lipsync = this.timepointsToLipsync(text, timepoints);

    this.logger.log(
      `TTS synthesized: ${text.length} chars → ${lipsync.mouthCues.length} visemes`,
    );

    return {
      audio: audioContent,
      audioMimeType: 'audio/mpeg',
      lipsync,
      fallback: false,
    };
  }

  // ── SSML builder ──────────────────────────────────────────

  /**
   * Build SSML with <mark> tags before each word for timepointing.
   */
  private buildSsml(text: string): string {
    const words = text.split(/\s+/).filter(Boolean);
    const markedWords = words
      .map((word, i) => `<mark name="w${i}"/>${word}`)
      .join(' ');

    return `<speak>${markedWords}</speak>`;
  }

  // ── Timepoint → Lipsync conversion ───────────────────────

  private timepointsToLipsync(
    text: string,
    timepoints: Array<{ markName: string; timeSeconds: number }>,
  ): LipsyncData {
    const words = text.split(/\s+/).filter(Boolean);

    if (timepoints.length === 0) {
      // No timepoints returned → estimate
      const estimated = estimateWordTimings(text);
      const cues = wordsToVisemes(estimated);
      return {
        mouthCues: cues,
        duration: cues.length > 0 ? cues[cues.length - 1].end : 0,
      };
    }

    // Map timepoints to word timings
    const wordTimings = timepoints.map((tp, i) => {
      const wordIndex = parseInt(tp.markName.replace('w', ''), 10);
      const word = words[wordIndex] || '';
      const startTime = tp.timeSeconds;
      const endTime =
        i < timepoints.length - 1
          ? timepoints[i + 1].timeSeconds
          : startTime + 0.3; // last word gets 300ms

      return { word, startTime, endTime };
    });

    const cues = wordsToVisemes(wordTimings);
    const duration =
      cues.length > 0 ? cues[cues.length - 1].end : 0;

    return { mouthCues: cues, duration };
  }

  // ── Voice selection ───────────────────────────────────────

  private getVoiceName(language: string, gender: string): string {
    const voices: Record<string, Record<string, string>> = {
      'en-US': {
        male: 'en-US-Neural2-J',
        female: 'en-US-Neural2-F',
      },
      'es-ES': {
        male: 'es-ES-Neural2-B',
        female: 'es-ES-Neural2-A',
      },
    };

    return voices[language]?.[gender] || 'en-US-Neural2-J';
  }

  // ── Fallback ──────────────────────────────────────────────

  private createFallbackResponse(text: string): TtsResponse {
    const estimated = estimateWordTimings(text);
    const cues = wordsToVisemes(estimated);

    return {
      audio: '',
      audioMimeType: '',
      lipsync: {
        mouthCues: cues,
        duration: cues.length > 0 ? cues[cues.length - 1].end : 0,
      },
      fallback: true,
    };
  }
}
