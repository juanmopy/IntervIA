import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { Router } from '@angular/router';
import { AvatarCanvasComponent } from './avatar-canvas.component';
import { ChatPanelComponent, type ChatMessage, type InterviewProgress } from './chat-panel.component';
import { VoiceControlsComponent } from './voice-controls.component';
import { InterviewStateService, type SendMessageResponse } from '@core/services/interview-state.service';
import { AvatarService } from '@core/services/avatar.service';

let messageIdCounter = 0;

@Component({
  selector: 'app-interview',
  standalone: true,
  imports: [AvatarCanvasComponent, ChatPanelComponent, VoiceControlsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="interview-layout h-[calc(100dvh-3.5rem)] flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden"
         role="main" aria-label="Interview session">

      <!-- Screen reader live region for announcements -->
      <div class="sr-only" aria-live="polite" aria-atomic="true">
        {{ srAnnouncement() }}
      </div>

      <!-- Top bar -->
      <header class="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800
                      border-b border-slate-200 dark:border-slate-700 shrink-0"
              role="banner">
        <div class="flex items-center gap-2" aria-live="polite">
          <div class="w-2 h-2 rounded-full animate-pulse"
               [class]="isProcessing() ? 'bg-amber-500' : 'bg-green-500'"
               [attr.aria-label]="isProcessing() ? 'Processing response' : 'Interview active'"></div>
          <span class="text-sm font-medium text-slate-600 dark:text-slate-300">
            {{ isProcessing() ? 'Processing...' : 'Interview Active' }}
          </span>
        </div>

        <!-- End Interview button moved to bottom controls -->
      </header>

      <!-- Main content -->
      <div class="flex-1 flex flex-col lg:flex-row min-h-0">

        <!-- Left: Avatar (60% on desktop, top on mobile) -->
        <div class="lg:w-[60%] h-[40vh] lg:h-full shrink-0">
          @if (!webglFailed()) {
            <app-avatar-canvas
              [language]="language"
              (avatarReady)="onAvatarReady()"
              (avatarError)="onAvatarError($event)"
            />
          } @else {
            <!-- Text-only fallback when WebGL fails -->
            <div class="w-full h-full flex flex-col items-center justify-center gap-3
                        bg-slate-50 dark:bg-slate-850 rounded-none">
              <div class="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <svg class="w-10 h-10 text-primary-600 dark:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p class="text-sm text-slate-500 dark:text-slate-400 text-center px-4">
                3D avatar unavailable — text-only mode
              </p>
            </div>
          }
        </div>

        <!-- Right: Chat + Controls (40% on desktop, bottom on mobile) -->
        <div class="flex-1 flex flex-col min-h-0 border-l-0 lg:border-l border-slate-200 dark:border-slate-700">

          <!-- Chat panel -->
          <div class="flex-1 min-h-0">
            <app-chat-panel
              [messages]="messages"
              [isTyping]="isTyping"
              [progress]="progress"
            />
          </div>

          <!-- Voice / text controls -->
          <div class="shrink-0 p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <div class="flex flex-col gap-2">
              <app-voice-controls
                [disabled]="isProcessing()"
                [language]="language"
                (messageSent)="onUserMessage($event)"
              />
              <button
                type="button"
                class="w-full mt-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors"
                [class]="isClosingPhase()
                  ? 'text-white bg-primary-600 hover:bg-primary-700 border border-primary-600 animate-pulse'
                  : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800'"
                (click)="endInterview()"
                [disabled]="isEnding()"
                aria-label="End interview"
              >
                {{ isEnding() ? 'Ending...' : isClosingPhase() ? '✓ Finish Interview' : 'End Interview' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error toast -->
      @if (errorMsg()) {
        <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4" role="alert" aria-live="assertive">
          <div class="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/80 text-red-700 dark:text-red-200
                      border border-red-200 dark:border-red-800 rounded-xl shadow-lg">
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span class="text-sm flex-1">{{ errorMsg() }}</span>
            <button (click)="dismissError()" class="text-red-500 hover:text-red-700 dark:hover:text-red-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
  `],
})
export class InterviewComponent implements OnInit, OnDestroy {
  @ViewChild(AvatarCanvasComponent) private avatarCanvas?: AvatarCanvasComponent;

  private readonly stateService = inject(InterviewStateService);
  private readonly avatarService = inject(AvatarService);
  private readonly router = inject(Router);

  /* ── Signals for template ──────────────────────────────── */
  readonly messages = signal<ChatMessage[]>([]);
  readonly isTyping = signal(false);
  readonly progress = signal<InterviewProgress | null>(null);
  readonly isProcessing = signal(false);
  readonly isEnding = signal(false);
  readonly isClosingPhase = signal(false);
  readonly webglFailed = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly srAnnouncement = signal('');

  get language(): string {
    return this.stateService.config()?.language ?? 'en';
  }

  private errorTimeout?: ReturnType<typeof setTimeout>;

  /* ── Lifecycle ─────────────────────────────────────────── */

  ngOnInit(): void {
    // Guard: redirect if no active session
    if (!this.stateService.sessionId()) {
      this.router.navigate(['/']);
      return;
    }

    // Process the initial greeting from startInterview response
    this.processInitialGreeting();
  }

  ngOnDestroy(): void {
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
  }

  /* ── Avatar events ─────────────────────────────────────── */

  onAvatarReady(): void {
    // Avatar loaded; if there are already interviewer messages, speak the last one
    try {
      const msgs = this.messages();
      const lastInterviewer = [...msgs].reverse().find(m => m.role === 'interviewer');
      if (lastInterviewer && this.avatarCanvas) {
        this.avatarCanvas.speakText(lastInterviewer.text);
      }
    } catch (err) {
      console.warn('[Interview] Avatar speakText on ready failed:', err);
    }
  }

  onAvatarError(message: string): void {
    console.warn('[Interview] Avatar failed, falling back to text-only:', message);
    this.webglFailed.set(true);
  }

  /* ── Interview flow ────────────────────────────────────── */

  /**
   * Process the initial greeting that came from the startInterview response.
   */
  private processInitialGreeting(): void {
    const cached = this.stateService.initialResponse();
    if (cached) {
      this.handleBackendResponse(cached);
    } else {
      // Fallback: if no cached response, show generic welcome
      this.addMessage('interviewer', 'Hello! Welcome to your interview. Let\'s get started.');
    }
  }

  /**
   * User sends a message (voice or text).
   */
  async onUserMessage(text: string): Promise<void> {
    if (!text.trim() || this.isProcessing() || this.isEnding()) return;

    // Add user message to chat
    this.addMessage('candidate', text);

    // Show typing indicator
    this.isTyping.set(true);
    this.isProcessing.set(true);

    try {
      const response = await this.stateService.sendMessage(text);
      this.handleBackendResponse(response);
    } catch (err: unknown) {
      console.error('[Interview] sendMessage failed:', err);

      // Provide a more descriptive error message
      let errorText = 'Failed to get response. Please try again.';
      if (err && typeof err === 'object' && 'status' in err) {
        const status = (err as { status: number }).status;
        if (status === 404) {
          errorText = 'Session expired. Please start a new interview.';
        } else if (status === 400) {
          errorText = 'Interview session has ended.';
        } else if (status === 429) {
          errorText = 'Rate limited. Please wait a moment and try again.';
        } else if (status === 0 || status >= 500) {
          errorText = 'Server error. Please check the backend is running.';
        }
      }
      this.showError(errorText);
    } finally {
      this.isTyping.set(false);
      this.isProcessing.set(false);
    }
  }

  /**
   * Handle backend response: add messages, update progress, speak via avatar.
   */
  private handleBackendResponse(response: SendMessageResponse): void {
    // Update progress
    if (response.metadata) {
      this.progress.set({
        questionNumber: response.metadata.questionNumber,
        totalQuestions: response.metadata.totalQuestions,
        phase: response.metadata.phase,
      });
    }

    // Add interviewer messages
    for (const msg of response.messages) {
      this.addMessage('interviewer', msg.text);

      // Screen reader announcement
      this.srAnnouncement.set(`Interviewer says: ${msg.text}`);

      // Speak via avatar (or TTS fallback)
      if (this.avatarCanvas && !this.webglFailed()) {
        this.avatarCanvas.speakText(msg.text);
        if (msg.facialExpression) {
          this.avatarCanvas.setMood(msg.facialExpression);
        }
      }
    }

    // Check if closing — show End Interview button prominently
    // Do NOT auto-end; let the user respond to the closing question first
    if (response.metadata?.phase === 'closing') {
      this.isClosingPhase.set(true);
    }
  }

  /**
   * End the interview and navigate to report.
   */
  async endInterview(): Promise<void> {
    if (this.isEnding()) return;
    this.isEnding.set(true);

    try {
      await this.stateService.endInterview();
      this.stateService.goToReport();
    } catch (err: unknown) {
      console.error('[Interview] endInterview failed:', err);

      // If 400 "already evaluated", the report may already exist — navigate anyway
      if (err && typeof err === 'object' && 'status' in err) {
        const status = (err as { status: number }).status;
        if (status === 400 && this.stateService.hasReport()) {
          this.stateService.goToReport();
          return;
        }
        if (status === 400) {
          // Session ended but no report cached — go home
          this.showError('Interview session ended. Redirecting...');
          setTimeout(() => this.router.navigate(['/']), 1500);
          return;
        }
        if (status === 404) {
          this.showError('Session expired. Please start a new interview.');
          this.isEnding.set(false);
          return;
        }
        if (status === 0 || status >= 500) {
          this.showError('Server error generating evaluation. Please try again.');
          this.isEnding.set(false);
          return;
        }
      }
      this.showError('Failed to end interview. Please try again.');
      this.isEnding.set(false);
    }
  }

  /* ── Keyboard shortcuts ────────────────────────────────── */

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    // Space = toggle mic (only when not in a text input)
    if (event.code === 'Space' && !this.isTextInput(event)) {
      event.preventDefault();
      // Trigger mic toggle through the voice controls component
      // This is handled by VoiceControlsComponent internally
    }
  }

  private isTextInput(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  }

  /* ── Helpers ───────────────────────────────────────────── */

  private addMessage(role: 'interviewer' | 'candidate', text: string): void {
    const msg: ChatMessage = {
      id: `msg-${++messageIdCounter}`,
      role,
      text,
      timestamp: new Date(),
    };
    this.messages.update(msgs => [...msgs, msg]);
  }

  showError(message: string): void {
    this.errorMsg.set(message);
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.errorTimeout = setTimeout(() => this.errorMsg.set(null), 5000);
  }

  dismissError(): void {
    this.errorMsg.set(null);
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
  }
}
