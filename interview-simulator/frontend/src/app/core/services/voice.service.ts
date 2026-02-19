import { Injectable, signal, computed, NgZone, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/**
 * Voice recognition result
 */
export interface VoiceResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

/**
 * VoiceService — Wraps the Web Speech API for speech-to-text input.
 *
 * Provides:
 *  - `startListening()` / `stopListening()` to control mic
 *  - `onResult$` observable for transcription results
 *  - `isSupported` signal for browser compatibility
 *  - `isListening` signal for UI state
 */
@Injectable({ providedIn: 'root' })
export class VoiceService {
  private readonly zone = inject(NgZone);

  /* ── Reactive state ─────────────────────────────────────────── */
  private readonly _isListening = signal(false);
  private readonly _isSupported = signal(false);
  private readonly _interimTranscript = signal('');
  private readonly _error = signal<string | null>(null);
  private readonly _audioLevel = signal(0);

  readonly isListening = this._isListening.asReadonly();
  readonly isSupported = this._isSupported.asReadonly();
  readonly interimTranscript = this._interimTranscript.asReadonly();
  readonly error = this._error.asReadonly();
  readonly audioLevel = this._audioLevel.asReadonly();
  readonly hasError = computed(() => this._error() !== null);

  /* ── Result stream ──────────────────────────────────────────── */
  private readonly _onResult = new Subject<VoiceResult>();
  readonly onResult$: Observable<VoiceResult> = this._onResult.asObservable();

  /* ── Internal refs ──────────────────────────────────────────── */
  private recognition: SpeechRecognition | null = null;
  private language = 'en-US';
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private levelAnimFrame: number | null = null;

  constructor() {
    this.checkSupport();
  }

  /**
   * Check if the Web Speech API is available.
   */
  private checkSupport(): void {
    const hasRecognition =
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    this._isSupported.set(hasRecognition);
  }

  /**
   * Set the recognition language.
   */
  setLanguage(lang: string): void {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * Start listening for speech input.
   */
  startListening(): void {
    if (!this._isSupported()) {
      this._error.set('Speech recognition is not supported in this browser');
      return;
    }

    if (this._isListening()) {
      return;
    }

    this._error.set(null);
    this._interimTranscript.set('');

    try {
      this.createRecognition();
      this.recognition!.start();
      this._isListening.set(true);
      this.startAudioLevel();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start speech recognition';
      this._error.set(message);
      this._isListening.set(false);
    }
  }

  /**
   * Stop listening.
   */
  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped
      }
    }
    this._isListening.set(false);
    this._interimTranscript.set('');
    this.stopAudioLevel();
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.stopListening();
    this.recognition = null;
    this._onResult.complete();
  }

  /* ── Private: Recognition setup ─────────────────────────────── */

  private createRecognition(): void {
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition: SpeechRecognitionConstructor }).webkitSpeechRecognition;

    const rec = new SpeechRecognitionCtor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = this.language;
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      this.zone.run(() => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            this._onResult.next({
              transcript: transcript.trim(),
              isFinal: true,
              confidence: result[0].confidence,
            });
            this._interimTranscript.set('');
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          this._interimTranscript.set(interim);
          this._onResult.next({
            transcript: interim,
            isFinal: false,
            confidence: 0,
          });
        }
      });
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.zone.run(() => {
        // 'no-speech' and 'aborted' are normal — don't treat as errors
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        this._error.set(`Speech recognition error: ${event.error}`);
        this._isListening.set(false);
        this.stopAudioLevel();
      });
    };

    rec.onend = () => {
      this.zone.run(() => {
        // Auto-restart if still supposed to be listening
        if (this._isListening()) {
          try {
            rec.start();
          } catch {
            this._isListening.set(false);
            this.stopAudioLevel();
          }
        }
      });
    };

    this.recognition = rec;
  }

  /* ── Private: Audio level meter ─────────────────────────────── */

  private async startAudioLevel(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioCtx = new AudioContext();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!this._isListening() || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
        const normalised = Math.min(1, avg / 128);

        this.zone.run(() => {
          this._audioLevel.set(normalised);
        });

        this.levelAnimFrame = requestAnimationFrame(updateLevel);
      };

      this.levelAnimFrame = requestAnimationFrame(updateLevel);
    } catch {
      // Mic access denied or not available — level meter won't work
    }
  }

  private stopAudioLevel(): void {
    if (this.levelAnimFrame !== null) {
      cancelAnimationFrame(this.levelAnimFrame);
      this.levelAnimFrame = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.analyser = null;
    this._audioLevel.set(0);
  }
}
