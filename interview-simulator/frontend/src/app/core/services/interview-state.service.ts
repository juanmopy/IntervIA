import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { StorageService } from './storage.service';

/**
 * Interview configuration form data
 */
export interface InterviewConfig {
  role: string;
  type: 'technical' | 'behavioral' | 'mixed';
  difficulty: 'junior' | 'mid' | 'senior';
  language: 'en' | 'es';
  totalQuestions: number;
  resumeText?: string;
  jobDescription?: string;
  persona?: 'friendly' | 'strict' | 'casual';
}

/**
 * Backend response for starting an interview
 */
export interface StartInterviewResponse {
  sessionId: string;
  response: {
    messages: Array<{
      text: string;
      facialExpression: string;
      animation: string;
    }>;
    metadata: {
      questionNumber: number;
      totalQuestions: number;
      phase: string;
    };
  };
}

/**
 * Backend response for sending a message
 */
export interface SendMessageResponse {
  messages: Array<{
    text: string;
    facialExpression: string;
    animation: string;
  }>;
  metadata: {
    questionNumber: number;
    totalQuestions: number;
    phase: string;
    scoreHint?: number;
  };
}

/**
 * Backend response for ending an interview
 */
export interface EndInterviewResponse {
  report: {
    overallScore: number;
    strengths: string[];
    improvements: string[];
    questionScores: Array<{
      question: string;
      score: number;
      feedback: string;
    }>;
    suggestedResources: string[];
  };
}

export type SessionState = 'idle' | 'starting' | 'active' | 'ending' | 'completed' | 'error';

/**
 * InterviewStateService — Manages interview session state and backend communication.
 */
@Injectable({ providedIn: 'root' })
export class InterviewStateService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);

  /* ── Reactive state ─────────────────────────────────────────── */
  private readonly _config = signal<InterviewConfig | null>(null);
  private readonly _sessionId = signal<string | null>(null);
  private readonly _sessionState = signal<SessionState>('idle');
  private readonly _error = signal<string | null>(null);
  private readonly _report = signal<EndInterviewResponse['report'] | null>(null);
  private readonly _initialResponse = signal<SendMessageResponse | null>(null);

  readonly config = this._config.asReadonly();
  readonly sessionId = this._sessionId.asReadonly();
  readonly sessionState = this._sessionState.asReadonly();
  readonly error = this._error.asReadonly();
  readonly report = this._report.asReadonly();
  readonly initialResponse = this._initialResponse.asReadonly();
  readonly isActive = computed(() => this._sessionState() === 'active');
  readonly hasReport = computed(() => this._report() !== null);

  private readonly apiUrl = environment.apiUrl;

  /**
   * Store the interview configuration.
   */
  setConfig(config: InterviewConfig): void {
    this._config.set(config);
  }

  /**
   * Start a new interview session.
   */
  async startInterview(config?: InterviewConfig): Promise<StartInterviewResponse> {
    if (config) {
      this._config.set(config);
    }

    const cfg = this._config();
    if (!cfg) {
      throw new Error('Interview configuration not set');
    }

    this._sessionState.set('starting');
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.post<StartInterviewResponse>(`${this.apiUrl}/interview/start`, cfg),
      );

      this._sessionId.set(response.sessionId);
      this._initialResponse.set(response.response);
      this._sessionState.set('active');
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start interview';
      this._error.set(message);
      this._sessionState.set('error');
      throw err;
    }
  }

  /**
   * Send a message during the interview.
   */
  async sendMessage(message: string): Promise<SendMessageResponse> {
    const sessionId = this._sessionId();
    if (!sessionId) {
      throw new Error('No active session');
    }

    try {
      const envelope = await firstValueFrom(
        this.http.post<{ sessionId: string; response: SendMessageResponse }>(
          `${this.apiUrl}/interview/message`,
          { sessionId, message },
        ),
      );
      return envelope.response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      this._error.set(message);
      throw err;
    }
  }

  /**
   * End the interview and get the report.
   */
  async endInterview(): Promise<EndInterviewResponse> {
    const sessionId = this._sessionId();
    if (!sessionId) {
      throw new Error('No active session');
    }

    this._sessionState.set('ending');

    try {
      const response = await firstValueFrom(
        this.http.post<EndInterviewResponse>(`${this.apiUrl}/interview/end`, {
          sessionId,
        }),
      );

      this._report.set(response.report);
      this._sessionState.set('completed');
      this.saveToHistory(response.report);
      return response;
    } catch (err) {
      // If 400 and we already have a report, treat as success
      if (
        err &&
        typeof err === 'object' &&
        'status' in err &&
        (err as { status: number }).status === 400 &&
        this._report()
      ) {
        this._sessionState.set('completed');
        return { sessionId, report: this._report()! } as EndInterviewResponse;
      }
      const message = err instanceof Error ? err.message : 'Failed to end interview';
      this._error.set(message);
      this._sessionState.set('error');
      throw err;
    }
  }

  /**
   * Navigate to interview session page.
   */
  goToInterview(): void {
    this.router.navigate(['/interview', 'session']);
  }

  /**
   * Navigate to report page.
   */
  goToReport(): void {
    this.router.navigate(['/report']);
  }

  /**
   * Save the completed interview to localStorage history.
   */
  private saveToHistory(report: EndInterviewResponse['report']): void {
    const cfg = this._config();
    if (!cfg || !report) return;

    this.storage.save({
      id: this._sessionId() ?? crypto.randomUUID(),
      date: new Date().toISOString(),
      role: cfg.role,
      type: cfg.type,
      difficulty: cfg.difficulty,
      overallScore: report.overallScore,
      report,
    });
  }

  /**
   * Reset all state.
   */
  reset(): void {
    this._config.set(null);
    this._sessionId.set(null);
    this._sessionState.set('idle');
    this._error.set(null);
    this._report.set(null);
    this._initialResponse.set(null);
  }
}
