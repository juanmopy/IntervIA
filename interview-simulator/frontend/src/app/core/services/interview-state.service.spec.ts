import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { InterviewStateService } from './interview-state.service';
import { environment } from '@env/environment';

describe('InterviewStateService', () => {
  let service: InterviewStateService;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockConfig = {
    role: 'Frontend Developer',
    type: 'technical' as const,
    difficulty: 'mid' as const,
    language: 'en' as const,
    totalQuestions: 8,
  };

  const mockStartResponse = {
    sessionId: 'session-123',
    message: {
      messages: [{ text: 'Hello!', facialExpression: 'smile', animation: 'idle' }],
      metadata: { questionNumber: 1, totalQuestions: 8, phase: 'greeting' },
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InterviewStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(InterviewStateService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start in idle state', () => {
    expect(service.sessionState()).toBe('idle');
    expect(service.config()).toBeNull();
    expect(service.sessionId()).toBeNull();
  });

  it('should store config', () => {
    service.setConfig(mockConfig);
    expect(service.config()).toEqual(mockConfig);
  });

  it('should start interview and update state', async () => {
    const promise = service.startInterview(mockConfig);
    expect(service.sessionState()).toBe('starting');

    const req = httpMock.expectOne(`${environment.apiUrl}/interview/start`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockConfig);
    req.flush(mockStartResponse);

    const result = await promise;
    expect(result.sessionId).toBe('session-123');
    expect(service.sessionId()).toBe('session-123');
    expect(service.sessionState()).toBe('active');
    expect(service.isActive()).toBe(true);
  });

  it('should handle start error', async () => {
    const promise = service.startInterview(mockConfig);

    const req = httpMock.expectOne(`${environment.apiUrl}/interview/start`);
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });

    await expect(promise).rejects.toThrow();
    expect(service.sessionState()).toBe('error');
    expect(service.error()).toBeTruthy();
  });

  it('should throw if starting without config', async () => {
    await expect(service.startInterview()).rejects.toThrow('Interview configuration not set');
  });

  it('should send message', async () => {
    // Start first
    const startPromise = service.startInterview(mockConfig);
    httpMock.expectOne(`${environment.apiUrl}/interview/start`).flush(mockStartResponse);
    await startPromise;

    const msgResponse = {
      messages: [{ text: 'Good answer!', facialExpression: 'smile', animation: 'nod' }],
      metadata: { questionNumber: 2, totalQuestions: 8, phase: 'questioning' },
    };

    const msgPromise = service.sendMessage('My answer');
    const req = httpMock.expectOne(`${environment.apiUrl}/interview/message`);
    expect(req.request.body).toEqual({ sessionId: 'session-123', message: 'My answer' });
    req.flush(msgResponse);

    const result = await msgPromise;
    expect(result.messages[0].text).toBe('Good answer!');
  });

  it('should throw on sendMessage without session', async () => {
    await expect(service.sendMessage('test')).rejects.toThrow('No active session');
  });

  it('should end interview', async () => {
    // Start first
    const startPromise = service.startInterview(mockConfig);
    httpMock.expectOne(`${environment.apiUrl}/interview/start`).flush(mockStartResponse);
    await startPromise;

    const endResponse = {
      report: {
        overallScore: 85,
        strengths: ['Good structure'],
        improvements: ['More examples'],
        questionScores: [],
        suggestedResources: [],
      },
    };

    const endPromise = service.endInterview();
    expect(service.sessionState()).toBe('ending');

    const req = httpMock.expectOne(`${environment.apiUrl}/interview/end`);
    req.flush(endResponse);

    await endPromise;
    expect(service.sessionState()).toBe('completed');
    expect(service.report()?.overallScore).toBe(85);
    expect(service.hasReport()).toBe(true);
  });

  it('should reset all state', () => {
    service.setConfig(mockConfig);
    service.reset();
    expect(service.config()).toBeNull();
    expect(service.sessionId()).toBeNull();
    expect(service.sessionState()).toBe('idle');
    expect(service.error()).toBeNull();
    expect(service.report()).toBeNull();
  });

  it('should navigate to interview', () => {
    const spy = vi.spyOn(router, 'navigate');
    service.goToInterview();
    expect(spy).toHaveBeenCalledWith(['/interview', 'session']);
  });

  it('should navigate to report', () => {
    const spy = vi.spyOn(router, 'navigate');
    service.goToReport();
    expect(spy).toHaveBeenCalledWith(['/report']);
  });
});
