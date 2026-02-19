declare module '@met4citizen/talkinghead/modules/talkinghead.mjs' {
  export class TalkingHead {
    isSpeaking: boolean;
    isRunning: boolean;
    stateName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lipsync: Record<string, any>;

    constructor(node: HTMLElement, opt?: Partial<TalkingHeadOptions>);

    showAvatar(
      avatar: AvatarConfig,
      onprogress?: ((event: ProgressEvent) => void) | null,
      onpreprocess?: ((gltf: unknown) => void) | null,
    ): Promise<void>;

    speakText(
      text: string,
      opt?: Record<string, unknown> | null,
      onsubtitles?: ((subtitle: string) => void) | null,
      excludes?: number[][] | null,
    ): void;

    speakAudio(
      data: SpeakAudioData,
      opt?: Record<string, unknown> | null,
      onsubtitles?: ((subtitle: string) => void) | null,
    ): void;

    speakEmoji(emoji: string): Promise<void>;
    speakBreak(ms: number): Promise<void>;
    speakMarker(onmarker: () => void): Promise<void>;

    startSpeaking(force?: boolean): Promise<void>;
    stopSpeaking(): void;
    pauseSpeaking(): void;

    setMood(mood: string): void;
    getMood(): string;
    getMoodNames(): string[];

    setView(view: 'full' | 'mid' | 'upper' | 'head', opt?: Record<string, unknown> | null): void;
    getView(): string;
    getViewNames(): string[];

    playGesture(name: string, dur?: number, mirror?: boolean, ms?: number): void;
    playAnimation(url: string, onprogress?: ((event: ProgressEvent) => void) | null, dur?: number, ndx?: number, scale?: number): Promise<void>;

    lookAt(x: number, y: number, t: number): void;
    setMixerGain(speech: number | null, background?: number | null, fadeSecs?: number): void;
    setLighting(opt: Record<string, unknown>): void;

    start(): void;
    stop(): void;
    dispose(): void;

    getMorphTargetNames(): string[];
  }

  export interface TalkingHeadOptions {
    jwtGet: (() => Promise<string>) | null;
    ttsEndpoint: string;
    ttsApikey: string | null;
    ttsTrimStart: number;
    ttsTrimEnd: number;
    ttsLang: string;
    ttsVoice: string;
    ttsRate: number;
    ttsPitch: number;
    ttsVolume: number;
    mixerGainSpeech: number | null;
    mixerGainBackground: number | null;
    lipsyncLang: string;
    lipsyncModules: string[];
    pcmSampleRate: number;
    audioCtx: AudioContext | null;
    modelRoot: string;
    modelPixelRatio: number;
    modelFPS: number;
    modelMovementFactor: number;
    cameraView: 'full' | 'mid' | 'upper' | 'head';
    dracoEnabled: boolean;
    dracoDecoderPath: string;
    cameraDistance: number;
    cameraX: number;
    cameraY: number;
    cameraRotateX: number;
    cameraRotateY: number;
    cameraRotateEnable: boolean;
    cameraPanEnable: boolean;
    cameraZoomEnable: boolean;
    lightAmbientColor: number;
    lightAmbientIntensity: number;
    lightDirectColor: number;
    lightDirectIntensity: number;
    lightDirectPhi: number;
    lightDirectTheta: number;
    lightSpotIntensity: number;
    lightSpotColor: number;
    lightSpotPhi: number;
    lightSpotTheta: number;
    lightSpotDispersion: number;
    avatarMood: string;
    avatarMute: boolean;
    avatarIdleEyeContact: number;
    avatarIdleHeadMove: number;
    avatarSpeakingEyeContact: number;
    avatarSpeakingHeadMove: number;
    avatarIgnoreCamera: boolean;
    avatarOnly: boolean;
    avatarOnlyScene: unknown;
    avatarOnlyCamera: unknown;
    statsNode: HTMLElement | null;
    statsStyle: string | null;
    update: (() => void) | null;
  }

  export interface AvatarConfig {
    url: string;
    body?: 'M' | 'F';
    avatarMood?: string;
    lipsyncLang?: string;
    ttsLang?: string;
    ttsVoice?: string;
    ttsRate?: number;
    ttsPitch?: number;
    ttsVolume?: number;
    retarget?: Record<string, unknown>;
    modelDynamicBones?: unknown;
    baseline?: Record<string, number>;
    skeletonHelper?: boolean;
  }

  export interface SpeakAudioData {
    audio?: AudioBuffer;
    words?: string[];
    wtimes?: number[];
    wdurations?: number[];
    visemes?: string[];
    vtimes?: number[];
    vdurations?: number[];
    markers?: (() => void)[];
    mtimes?: number[];
    anim?: Record<string, unknown>;
  }
}

declare module '@met4citizen/talkinghead/modules/lipsync-en.mjs' {
  export class LipsyncEn {
    constructor();
    preProcessText(s: string): string;
    wordsToVisemes(word: string): unknown;
  }
}
