import { Injectable, signal, computed } from '@angular/core';

/**
 * Avatar loading/speaking states
 */
export type AvatarState = 'idle' | 'loading' | 'ready' | 'speaking' | 'error';

/**
 * Audio + lipsync payload from backend TTS
 */
export interface SpeakPayload {
  audio: string;          // base64 mp3
  lipsync?: {
    words: string[];
    wtimes: number[];
    wdurations: number[];
    visemes?: string[];
    vtimes?: number[];
    vdurations?: number[];
  };
}

/**
 * Expression/animation mapping from AI response
 */
export interface AvatarAction {
  facialExpression?: string;
  animation?: string;
}

/**
 * AvatarService — Thin Angular wrapper around the TalkingHead library.
 *
 * Responsibilities:
 *  - Lazy-load the TalkingHead ESM module
 *  - Manage lifecycle (init → loadAvatar → speak → dispose)
 *  - Expose reactive signals for component binding
 */
@Injectable({ providedIn: 'root' })
export class AvatarService {

  /* ── Reactive state ─────────────────────────────────────────── */
  private readonly _state = signal<AvatarState>('idle');
  private readonly _progress = signal<number>(0);
  private readonly _error = signal<string | null>(null);

  readonly state  = this._state.asReadonly();
  readonly progress = this._progress.asReadonly();
  readonly error  = this._error.asReadonly();
  readonly isReady = computed(() => this._state() === 'ready' || this._state() === 'speaking');

  /* ── Internal refs ──────────────────────────────────────────── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private head: any = null;

  /** Default avatar configuration */
  private readonly defaultAvatarConfig = {
    url: 'assets/avatars/interviewer.glb',
    body: 'F',
    avatarMood: 'neutral',
    lipsyncLang: 'en',
  };

  /** Map AI facialExpression names → TalkingHead mood names */
  private readonly moodMap: Record<string, string> = {
    'smile': 'happy',
    'happy': 'happy',
    'thinking': 'neutral',
    'thoughtful': 'neutral',
    'serious': 'neutral',
    'surprised': 'fear',
    'concerned': 'sad',
    'nodding': 'happy',
    'encouraging': 'happy',
    'neutral': 'neutral',
    'angry': 'angry',
    'sad': 'sad',
    'fear': 'fear',
    'disgust': 'disgust',
    'love': 'love',
    'sleep': 'sleep',
  };

  /** Default TalkingHead options */
  private readonly defaultHeadOptions = {
    ttsEndpoint: undefined,   // undefined = don't use built-in TTS at all
    ttsLang: 'en-US',
    lipsyncLang: 'en',
    lipsyncModules: [] as string[],  // Disabled: Vite can't resolve TalkingHead's dynamic lipsync imports
    cameraView: 'upper' as const,
    cameraRotateEnable: false,
    cameraPanEnable: false,
    cameraZoomEnable: false,
    modelFPS: 30,
    lightAmbientColor: 0xffffff,
    lightAmbientIntensity: 2,
    lightDirectColor: 0x8888aa,
    lightDirectIntensity: 30,
    lightDirectPhi: 1,
    lightDirectTheta: 2,
    lightSpotIntensity: 0,
    avatarMood: 'neutral',
    avatarIdleEyeContact: 0.6,
    avatarIdleHeadMove: 0.6,
    avatarSpeakingEyeContact: 0.8,
    avatarSpeakingHeadMove: 0.5,
  };

  /**
   * Initialise TalkingHead on a DOM element and load the avatar model.
   */
  async init(
    container: HTMLElement,
    avatarUrl?: string,
    language?: string,
  ): Promise<void> {
    if (this.head) {
      this.dispose();
    }

    this._state.set('loading');
    this._progress.set(0);
    this._error.set(null);

    try {
      // Lazy-import ESM module
      const { TalkingHead } = await import(
        /* @vite-ignore */
        '@met4citizen/talkinghead/modules/talkinghead.mjs'
      );

      const lang = language ?? 'en';
      const lipsyncLang = 'en'; // English lipsync works for both en/es
      const ttsLang = lang.startsWith('es') ? 'es-ES' : 'en-US';

      this.head = new TalkingHead(container, {
        ...this.defaultHeadOptions,
        lipsyncLang,
        ttsLang,
      });

      // Manually load lipsync module (Vite can't resolve TalkingHead's dynamic import)
      try {
        const { LipsyncEn } = await import(
          /* @vite-ignore */
          '@met4citizen/talkinghead/modules/lipsync-en.mjs'
        );
        this.head.lipsync = this.head.lipsync || {};
        this.head.lipsync['en'] = new LipsyncEn();
      } catch (e) {
        console.warn('[AvatarService] Lipsync module failed to load, proceeding without:', e);
      }

      const avatarConfig = {
        ...this.defaultAvatarConfig,
        ...(avatarUrl ? { url: avatarUrl } : {}),
        lipsyncLang,
      };

      await this.head.showAvatar(avatarConfig, (e: ProgressEvent) => {
        if (e.total > 0) {
          this._progress.set(Math.round((e.loaded / e.total) * 100));
        }
      });

      this._state.set('ready');
      this._progress.set(100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown avatar error';
      console.error('[AvatarService] Init failed:', message);
      this._error.set(message);
      this._state.set('error');
      throw err;
    }
  }

  /**
   * Make the avatar speak with audio + lipsync data from backend.
   */
  async speak(payload: SpeakPayload, actions?: AvatarAction): Promise<void> {
    if (!this.head) return;

    // Restore audio gain in case it was muted by a previous speakText fallback
    try { this.head.setMixerGain(1); } catch { /* ignore */ }

    // Apply facial expression / mood before speaking
    if (actions?.facialExpression) {
      this.setMood(actions.facialExpression);
    }

    // Play gesture if animation specified
    if (actions?.animation) {
      this.playGesture(actions.animation);
    }

    this._state.set('speaking');

    try {
      if (payload.lipsync) {
        // Use speakAudio with word-level lipsync data
        const audioData = await this.decodeBase64Audio(payload.audio);

        this.head.speakAudio({
          audio: audioData,
          words: payload.lipsync.words,
          wtimes: payload.lipsync.wtimes,
          wdurations: payload.lipsync.wdurations,
          ...(payload.lipsync.visemes ? {
            visemes: payload.lipsync.visemes,
            vtimes: payload.lipsync.vtimes,
            vdurations: payload.lipsync.vdurations,
          } : {}),
        });
      } else if (payload.audio) {
        // Audio only, let TalkingHead generate visemes from audio
        const audioData = await this.decodeBase64Audio(payload.audio);
        this.head.speakAudio({ audio: audioData });
      }

      // Wait for speech to finish
      await this.waitForSpeechEnd();
    } finally {
      if (this._state() === 'speaking') {
        this._state.set('ready');
      }
    }
  }

  /**
   * Make avatar speak using browser SpeechSynthesis for audio
   * with TalkingHead lip-sync animation in parallel.
   *
   * Strategy (based on TalkingHead docs):
   *  1. Generate viseme timing using TalkingHead's loaded lipsync-en module
   *     (wordsToVisemes gives multi-phoneme visemes per word — much better lip sync)
   *  2. Create a silent AudioBuffer so TalkingHead has a timeline to animate against
   *  3. Mute TalkingHead's audio output via setMixerGain(0) (animation keeps running)
   *  4. Play actual voice through browser SpeechSynthesis in parallel
   *  5. On speech end, stop avatar animation and restore audio gain
   *
   * We can't use head.speakText() because it requires a valid ttsEndpoint URL;
   * without one it tries fetch('') → gets HTML → SyntaxError on JSON.parse.
   */
  speakText(text: string, lang?: string): void {
    if (!this.head) return;

    const rawWords = text.split(/\s+/).filter(Boolean);
    if (rawWords.length === 0) return;

    this._state.set('speaking');

    const ttsLang = lang?.startsWith('es') ? 'es-ES' : 'en-US';

    // ── Generate visemes using TalkingHead's lipsync module ──
    // SpeechSynthesis at rate 1.0 speaks ~150 wpm ≈ 400 ms/word.
    // We intentionally overshoot so the animation never finishes before the voice;
    // cleanup() calls stopSpeaking() when SpeechSynthesis ends to cut it.
    const msPerWord = 450;
    const totalDurationMs = rawWords.length * msPerWord + 2000;

    const words: string[] = [];
    const wtimes: number[] = [];
    const wdurations: number[] = [];
    const visemes: string[] = [];
    const vtimes: number[] = [];
    const vdurations: number[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lipsyncModule: any = this.head.lipsync?.['en'];

    for (let i = 0; i < rawWords.length; i++) {
      const word = rawWords[i];
      const wordStart = i * msPerWord;

      words.push(word);
      wtimes.push(wordStart);
      wdurations.push(msPerWord);

      // Use TalkingHead's LipsyncEn.wordsToVisemes for accurate multi-phoneme visemes
      if (lipsyncModule) {
        try {
          const result = lipsyncModule.wordsToVisemes(word);
          if (result?.visemes?.length > 0) {
            // Scale the module's relative times to fit within the word's time slot
            const lastIdx = result.times.length - 1;
            const totalRelative = (result.times[lastIdx] ?? 0) + (result.durations[lastIdx] ?? 0);
            const scale = totalRelative > 0 ? msPerWord / totalRelative : 1;

            for (let j = 0; j < result.visemes.length; j++) {
              visemes.push(result.visemes[j]);
              vtimes.push(wordStart + (result.times[j] ?? 0) * scale);
              vdurations.push((result.durations[j] ?? 0) * scale);
            }
            continue;
          }
        } catch { /* fallback below */ }
      }

      // Fallback: silence viseme
      visemes.push('sil');
      vtimes.push(wordStart);
      vdurations.push(msPerWord);
    }

    // ── Feed silent audio + visemes to TalkingHead for lip animation ──
    try {
      const sampleRate = 22050;
      const numSamples = Math.max(Math.ceil((totalDurationMs / 1000) * sampleRate), 1);
      const silentAudio = new AudioBuffer({ length: numSamples, numberOfChannels: 1, sampleRate });

      // Mute TalkingHead's audio output (we play voice via SpeechSynthesis)
      this.head.setMixerGain(0);

      this.head.speakAudio(
        { audio: silentAudio, words, wtimes, wdurations, visemes, vtimes, vdurations },
        { lipsyncLang: 'en' },
      );
    } catch (err) {
      console.warn('[AvatarService] speakAudio with silent buffer failed:', err);
    }

    // ── Play actual voice via browser SpeechSynthesis ──
    const cleanup = () => {
      try { this.head?.stopSpeaking(); } catch { /* ignore */ }
      try { this.head?.setMixerGain(1); } catch { /* ignore */ }
      if (this._state() === 'speaking') this._state.set('ready');
    };

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = ttsLang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = cleanup;
      utterance.onerror = cleanup;
      window.speechSynthesis.speak(utterance);
    } else {
      // No SpeechSynthesis — let the silent buffer animation run, then clean up
      this.waitForSpeechEnd().then(cleanup);
    }
  }

  /**
   * Stop speaking immediately.
   */
  stopSpeaking(): void {
    this.head?.stopSpeaking();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this._state() === 'speaking') {
      this._state.set('ready');
    }
  }

  /**
   * Set avatar mood/expression.
   */
  setMood(mood: string): void {
    if (!this.head) return;
    const mapped = this.moodMap[mood.toLowerCase()] ?? 'neutral';
    try {
      this.head.setMood(mapped);
    } catch {
      console.warn(`[AvatarService] Unknown mood: ${mood} (mapped: ${mapped})`);
    }
  }

  /**
   * Play a hand gesture animation.
   */
  playGesture(name: string, duration = 3): void {
    if (!this.head) return;
    try {
      this.head.playGesture(name, duration);
    } catch {
      console.warn(`[AvatarService] Unknown gesture: ${name}`);
    }
  }

  /**
   * Set camera view: 'full' | 'mid' | 'upper' | 'head'
   */
  setView(view: 'full' | 'mid' | 'upper' | 'head'): void {
    this.head?.setView(view);
  }

  /**
   * Clean up TalkingHead instance and WebGL resources.
   */
  dispose(): void {
    if (this.head) {
      try {
        this.head.dispose();
      } catch {
        // Ignore disposal errors
      }
      this.head = null;
    }
    this._state.set('idle');
    this._progress.set(0);
    this._error.set(null);
  }

  /* ── Private helpers ────────────────────────────────────────── */

  /**
   * Decode base64 MP3 to AudioBuffer via OfflineAudioContext.
   */
  private async decodeBase64Audio(base64: string): Promise<AudioBuffer> {
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
    await audioCtx.close();
    return audioBuffer;
  }

  /**
   * Poll-based wait for speech to finish.
   */
  private waitForSpeechEnd(): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        if (!this.head || !this.head.isSpeaking) {
          resolve();
        } else {
          setTimeout(check, 200);
        }
      };
      // Give a small initial delay for speech to start
      setTimeout(check, 300);
    });
  }
}
