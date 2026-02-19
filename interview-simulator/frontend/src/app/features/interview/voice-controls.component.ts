import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { VoiceService } from '@core/services/voice.service';

export type InputMode = 'voice' | 'text';

@Component({
  selector: 'app-voice-controls',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="voice-controls flex flex-col gap-3">
      <!-- Mode toggle -->
      <div class="flex items-center justify-center gap-2">
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-medium rounded-l-lg border transition-colors"
          [class]="mode() === 'voice'
            ? 'bg-primary-600 text-white border-primary-600'
            : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'"
          (click)="setMode('voice')"
        >
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Voice
          </span>
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-medium rounded-r-lg border transition-colors"
          [class]="mode() === 'text'
            ? 'bg-primary-600 text-white border-primary-600'
            : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'"
          (click)="setMode('text')"
        >
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Text
          </span>
        </button>
      </div>

      <!-- Voice mode -->
      @if (mode() === 'voice') {
        <div class="flex flex-col items-center gap-3">
          <!-- Mic button -->
          <button
            type="button"
            class="relative w-16 h-16 rounded-full transition-all duration-200 focus:outline-none focus:ring-4"
            [class]="voiceService.isListening()
              ? 'bg-red-500 hover:bg-red-600 focus:ring-red-200 dark:focus:ring-red-800 shadow-lg shadow-red-500/30'
              : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 dark:focus:ring-primary-800 shadow-lg shadow-primary-500/30'"
            (click)="toggleMic()"
            [disabled]="disabled"
            [attr.aria-label]="voiceService.isListening() ? 'Stop recording' : 'Start recording'"
          >
            <!-- Pulsing ring when recording -->
            @if (voiceService.isListening()) {
              <span class="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30"></span>
            }

            <!-- Mic icon -->
            <svg class="w-7 h-7 text-white mx-auto relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              @if (voiceService.isListening()) {
                <!-- Stop icon -->
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
              } @else {
                <!-- Mic icon -->
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              }
            </svg>
          </button>

          <!-- Audio waveform bars -->
          @if (voiceService.isListening()) {
            <div class="flex items-end gap-0.5 h-6">
              @for (bar of waveformBars; track $index) {
                <div
                  class="w-1 bg-primary-500 dark:bg-primary-400 rounded-full transition-all duration-75"
                  [style.height.px]="3 + (voiceService.audioLevel() * 20 * bar)"
                ></div>
              }
            </div>
          }

          <!-- Real-time transcript -->
          @if (voiceService.interimTranscript()) {
            <div class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p class="text-sm text-slate-500 dark:text-slate-400 italic">
                {{ voiceService.interimTranscript() }}
              </p>
            </div>
          }

          <!-- Browser not supported -->
          @if (!voiceService.isSupported()) {
            <p class="text-xs text-amber-600 dark:text-amber-400 text-center">
              Voice input is not supported in this browser. Use text mode instead.
            </p>
          }

          <!-- Error message -->
          @if (voiceService.hasError()) {
            <p class="text-xs text-red-500 dark:text-red-400 text-center">
              {{ voiceService.error() }}
            </p>
          }
        </div>
      }

      <!-- Text mode -->
      @if (mode() === 'text') {
        <div class="flex gap-2">
          <textarea
            class="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   resize-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            rows="2"
            placeholder="Type your response..."
            [(ngModel)]="textInput"
            (keydown.enter)="onTextEnter($event)"
            [disabled]="disabled"
          ></textarea>
          <button
            type="button"
            class="self-end px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white text-sm font-medium
                   rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            (click)="sendText()"
            [disabled]="disabled || !textInput.trim()"
            aria-label="Send message"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class VoiceControlsComponent implements OnInit, OnDestroy {
  /** Whether controls are disabled (e.g. while avatar is speaking) */
  @Input() disabled = false;

  /** Interview language: 'en' | 'es' */
  @Input() set language(lang: string) {
    const map: Record<string, string> = {
      en: 'en-US',
      es: 'es-ES',
    };
    this.voiceService.setLanguage(map[lang] ?? 'en-US');
  }

  /** Emitted when user sends a message (voice or text) */
  @Output() readonly messageSent = new EventEmitter<string>();

  readonly voiceService = inject(VoiceService);

  /** Current input mode */
  readonly mode = signal<InputMode>('voice');

  /** Text input model */
  textInput = '';

  /** Waveform bar multipliers for visual effect */
  readonly waveformBars = [0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.7, 0.4];

  private resultSub?: Subscription;

  ngOnInit(): void {
    // Auto-fallback to text mode if voice not supported
    if (!this.voiceService.isSupported()) {
      this.mode.set('text');
    }

    // Subscribe to final voice results
    this.resultSub = this.voiceService.onResult$.subscribe((result) => {
      if (result.isFinal && result.transcript.trim()) {
        this.messageSent.emit(result.transcript.trim());
        // Stop after getting a final result
        this.voiceService.stopListening();
      }
    });
  }

  ngOnDestroy(): void {
    this.resultSub?.unsubscribe();
    this.voiceService.stopListening();
  }

  setMode(newMode: InputMode): void {
    if (newMode === this.mode()) return;

    // Stop listening if switching away from voice
    if (this.mode() === 'voice') {
      this.voiceService.stopListening();
    }

    this.mode.set(newMode);
  }

  toggleMic(): void {
    if (this.voiceService.isListening()) {
      this.voiceService.stopListening();
    } else {
      this.voiceService.startListening();
    }
  }

  sendText(): void {
    const text = this.textInput.trim();
    if (!text) return;
    this.messageSent.emit(text);
    this.textInput = '';
  }

  onTextEnter(event: Event): void {
    // Send on Enter (without Shift)
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      this.sendText();
    }
  }
}
