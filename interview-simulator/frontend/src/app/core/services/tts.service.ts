import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import type { SpeakPayload } from './avatar.service';

/**
 * Backend TTS response shape.
 */
interface TtsBackendResponse {
  audio: string;           // base64 MP3
  audioMimeType: string;
  lipsync: {
    mouthCues: Array<{
      start: number;
      end: number;
      viseme: string;
      word?: string;
    }>;
    duration: number;
  };
  fallback: boolean;
}

/**
 * TtsService — Calls the backend /api/tts/synthesize endpoint
 * and converts the response into an AvatarService-compatible SpeakPayload.
 */
@Injectable({ providedIn: 'root' })
export class TtsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Synthesize speech for the given text and return a SpeakPayload
   * ready to be consumed by AvatarService.speak().
   *
   * @returns SpeakPayload with audio + viseme-level lipsync data,
   *          or null if synthesis fails (caller should fall back to Web Speech).
   */
  async synthesize(
    text: string,
    language: 'en' | 'es' = 'en',
    gender: 'male' | 'female' = 'female',
  ): Promise<SpeakPayload | null> {
    const langCode = language === 'es' ? 'es-ES' : 'en-US';

    try {
      const response = await firstValueFrom(
        this.http.post<TtsBackendResponse>(`${this.apiUrl}/tts/synthesize`, {
          text,
          language: langCode,
          gender,
        }),
      );

      // If the backend returned a fallback (no audio), we can't use it
      if (response.fallback || !response.audio) {
        return null;
      }

      return this.toSpeakPayload(response);
    } catch (err) {
      console.warn('[TtsService] Synthesis failed, falling back to Web Speech:', err);
      return null;
    }
  }

  /**
   * Convert backend TTS response to SpeakPayload format
   * expected by AvatarService.speak().
   */
  private toSpeakPayload(response: TtsBackendResponse): SpeakPayload {
    const { mouthCues } = response.lipsync;

    const words: string[] = [];
    const wtimes: number[] = [];
    const wdurations: number[] = [];
    const visemes: string[] = [];
    const vtimes: number[] = [];
    const vdurations: number[] = [];

    for (const cue of mouthCues) {
      const durationMs = (cue.end - cue.start) * 1000;

      // Word-level data
      words.push(cue.word ?? '');
      wtimes.push(cue.start * 1000);   // convert s → ms
      wdurations.push(durationMs);

      // Viseme-level data (same timing, one viseme per word)
      visemes.push(cue.viseme);
      vtimes.push(cue.start * 1000);
      vdurations.push(durationMs);
    }

    return {
      audio: response.audio,
      lipsync: { words, wtimes, wdurations, visemes, vtimes, vdurations },
    };
  }
}
