/**
 * Interfaces for TTS responses and lipsync data.
 */

export interface MouthCue {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Viseme identifier compatible with Oculus/TalkingHead blend shapes */
  viseme: string;
  /** The word being spoken */
  word?: string;
}

export interface LipsyncData {
  mouthCues: MouthCue[];
  /** Duration of the audio in seconds */
  duration: number;
}

export interface TtsResponse {
  /** Base64-encoded audio data */
  audio: string;
  /** Audio MIME type */
  audioMimeType: string;
  /** Word-level lipsync timing data */
  lipsync: LipsyncData;
  /** Whether this came from the fallback (text-only) */
  fallback: boolean;
}

export interface TtsRequest {
  /** Text to synthesize */
  text: string;
  /** Language code */
  language?: 'en-US' | 'es-ES';
  /** Voice gender preference */
  gender?: 'male' | 'female';
}
