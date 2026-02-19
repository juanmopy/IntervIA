import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { AvatarService, type SpeakPayload, type AvatarAction } from '@core/services/avatar.service';

@Component({
  selector: 'app-avatar-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="avatar-wrapper relative w-full h-full min-h-[300px] bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden">
      <!-- Loading skeleton -->
      @if (avatarService.state() === 'loading') {
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm">
          <div class="avatar-skeleton w-32 h-32 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 dark:from-primary-700 dark:to-primary-900 animate-pulse"></div>
          <div class="flex flex-col items-center gap-2">
            <p class="text-sm font-medium text-primary-700 dark:text-primary-300">Loading avatar...</p>
            <div class="w-48 h-2 bg-primary-100 dark:bg-primary-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary-500 rounded-full transition-all duration-300"
                [style.width.%]="avatarService.progress()"
              ></div>
            </div>
            <span class="text-xs text-primary-500 dark:text-primary-400">{{ avatarService.progress() }}%</span>
          </div>
        </div>
      }

      <!-- Error state -->
      @if (avatarService.state() === 'error') {
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-surface-light dark:bg-surface-dark">
          <svg class="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p class="text-sm text-red-500 dark:text-red-400 text-center px-4">
            {{ avatarService.error() || 'Failed to load avatar' }}
          </p>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            (click)="retryLoad()"
          >
            Retry
          </button>
        </div>
      }

      <!-- Speaking indicator -->
      @if (avatarService.state() === 'speaking') {
        <div class="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-accent-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
          <span class="flex gap-0.5">
            <span class="w-1 h-3 bg-white rounded-full animate-[soundbar_0.6s_ease-in-out_infinite]"></span>
            <span class="w-1 h-3 bg-white rounded-full animate-[soundbar_0.6s_ease-in-out_0.1s_infinite]"></span>
            <span class="w-1 h-3 bg-white rounded-full animate-[soundbar_0.6s_ease-in-out_0.2s_infinite]"></span>
          </span>
          Speaking
        </div>
      }

      <!-- 3D Canvas container -->
      <div
        #avatarContainer
        class="w-full h-full"
      ></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .avatar-wrapper :deep(canvas) {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }

    @keyframes soundbar {
      0%, 100% { transform: scaleY(0.4); }
      50% { transform: scaleY(1); }
    }
  `]
})
export class AvatarCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('avatarContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  /** URL to the GLB avatar model */
  @Input() avatarUrl?: string;

  /** Language for lipsync: 'en' | 'es' */
  @Input() language = 'en';

  /** Emits when avatar finishes loading */
  @Output() readonly avatarReady = new EventEmitter<void>();

  /** Emits when avatar loading fails */
  @Output() readonly avatarError = new EventEmitter<string>();

  readonly avatarService = inject(AvatarService);

  async ngAfterViewInit(): Promise<void> {
    await this.loadAvatar();
  }

  ngOnDestroy(): void {
    this.avatarService.dispose();
  }

  /**
   * Load (or reload) the avatar.
   */
  async loadAvatar(): Promise<void> {
    try {
      await this.avatarService.init(
        this.containerRef.nativeElement,
        this.avatarUrl,
        this.language,
      );
      this.avatarReady.emit();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load avatar';
      this.avatarError.emit(message);
    }
  }

  /**
   * Make the avatar speak with audio from backend.
   */
  async speak(payload: SpeakPayload, actions?: AvatarAction): Promise<void> {
    await this.avatarService.speak(payload, actions);
  }

  /**
   * Fallback: speak with built-in TTS.
   */
  speakText(text: string): void {
    this.avatarService.speakText(text, this.language);
  }

  /**
   * Stop speaking immediately.
   */
  stopSpeaking(): void {
    this.avatarService.stopSpeaking();
  }

  /**
   * Set avatar mood/expression.
   */
  setMood(mood: string): void {
    this.avatarService.setMood(mood);
  }

  /**
   * Retry loading after error.
   */
  retryLoad(): void {
    this.loadAvatar();
  }
}
