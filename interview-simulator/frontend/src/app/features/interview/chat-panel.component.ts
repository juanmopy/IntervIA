import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { DatePipe } from '@angular/common';

/**
 * Chat message model
 */
export interface ChatMessage {
  id: string;
  role: 'interviewer' | 'candidate';
  text: string;
  timestamp: Date;
}

/**
 * Interview progress info
 */
export interface InterviewProgress {
  questionNumber: number;
  totalQuestions: number;
  phase: string;
}

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-panel flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <!-- Progress header -->
      @if (progress()) {
        <div class="px-4 py-2.5 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-950 dark:to-accent-950 border-b border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wide">
              {{ progress()!.phase }}
            </span>
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">
              Question {{ progress()!.questionNumber }} of {{ progress()!.totalQuestions }}
            </span>
          </div>
          <!-- Progress bar -->
          <div class="mt-1.5 w-full h-1 bg-primary-100 dark:bg-primary-900 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary-500 rounded-full transition-all duration-500"
              [style.width.%]="progressPercent()"
            ></div>
          </div>
        </div>
      }

      <!-- Messages list -->
      <div
        #scrollContainer
        class="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth"
      >
        @for (msg of messages(); track msg.id) {
          <div
            class="flex gap-2.5"
            [class]="msg.role === 'interviewer' ? 'justify-start' : 'justify-end'"
          >
            <!-- Interviewer avatar -->
            @if (msg.role === 'interviewer') {
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                <svg class="w-4 h-4 text-primary-600 dark:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            }

            <!-- Message bubble -->
            <div
              class="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
              [class]="msg.role === 'interviewer'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                : 'bg-primary-600 text-white rounded-tr-sm'"
            >
              <p class="whitespace-pre-wrap">{{ msg.text }}</p>
              <span
                class="block mt-1 text-[10px] opacity-60"
                [class]="msg.role === 'interviewer'
                  ? 'text-slate-500 dark:text-slate-400'
                  : 'text-primary-100'"
              >
                {{ msg.timestamp | date:'HH:mm' }}
              </span>
            </div>

            <!-- User avatar -->
            @if (msg.role === 'candidate') {
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-800 flex items-center justify-center">
                <svg class="w-4 h-4 text-accent-600 dark:text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            }
          </div>
        }

        <!-- Typing indicator -->
        @if (isTyping()) {
          <div class="flex gap-2.5 justify-start">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
              <svg class="w-4 h-4 text-primary-600 dark:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm">
              <div class="flex gap-1">
                <span class="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]"></span>
                <span class="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-[bounce_1.4s_ease-in-out_0.2s_infinite]"></span>
                <span class="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-[bounce_1.4s_ease-in-out_0.4s_infinite]"></span>
              </div>
            </div>
          </div>
        }

        <!-- Empty state -->
        @if (messages().length === 0 && !isTyping()) {
          <div class="flex flex-col items-center justify-center h-full text-center py-8">
            <svg class="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p class="text-sm text-slate-400 dark:text-slate-500">
              Interview will start shortly...
            </p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `],
})
export class ChatPanelComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLDivElement>;

  /** Chat messages to display */
  @Input({ required: true }) messages = signal<ChatMessage[]>([]);

  /** Whether the AI is currently generating a response */
  @Input() isTyping = signal(false);

  /** Interview progress info */
  @Input() progress = signal<InterviewProgress | null>(null);

  /** Computed progress percentage */
  readonly progressPercent = computed(() => {
    const p = this.progress();
    if (!p || p.totalQuestions === 0) return 0;
    return Math.round((p.questionNumber / p.totalQuestions) * 100);
  });

  private shouldScroll = true;

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.scrollContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch {
      // Ignore scroll errors
    }
  }
}
