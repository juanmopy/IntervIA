import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { InterviewComponent } from './interview.component';
import { InterviewStateService } from '@core/services/interview-state.service';
import { AvatarService } from '@core/services/avatar.service';

describe('InterviewComponent', () => {
  let component: InterviewComponent;
  let fixture: ComponentFixture<InterviewComponent>;
  let mockState: Record<string, any>;
  let mockAvatar: Record<string, any>;
  let router: Router;

  beforeEach(async () => {
    mockState = {
      sessionId: vi.fn().mockReturnValue('session-123') as any,
      config: vi.fn().mockReturnValue({ language: 'en', role: 'Dev', type: 'mixed', difficulty: 'mid', totalQuestions: 8 }) as any,
      sessionState: vi.fn().mockReturnValue('active') as any,
      error: vi.fn().mockReturnValue(null) as any,
      report: vi.fn().mockReturnValue(null) as any,
      isActive: vi.fn().mockReturnValue(true) as any,
      sendMessage: vi.fn().mockResolvedValue({
        messages: [{ text: 'Hello!', facialExpression: 'smile', animation: 'idle' }],
        metadata: { questionNumber: 1, totalQuestions: 8, phase: 'greeting' },
      }),
      endInterview: vi.fn().mockResolvedValue({
        report: { overallScore: 85, strengths: [], improvements: [], questionScores: [], suggestedResources: [] },
      }),
      goToReport: vi.fn(),
    };

    mockAvatar = {
      state: vi.fn().mockReturnValue('idle') as any,
      progress: vi.fn().mockReturnValue(0) as any,
      error: vi.fn().mockReturnValue(null) as any,
      isReady: vi.fn().mockReturnValue(false) as any,
      init: vi.fn().mockResolvedValue(undefined),
      speak: vi.fn().mockResolvedValue(undefined),
      speakText: vi.fn(),
      stopSpeaking: vi.fn(),
      setMood: vi.fn(),
      setView: vi.fn(),
      dispose: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [InterviewComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: InterviewStateService, useValue: mockState },
        { provide: AvatarService, useValue: mockAvatar },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(InterviewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should redirect to home if no session', () => {
    mockState['sessionId'] = vi.fn().mockReturnValue(null);
    const spy = vi.spyOn(router, 'navigate');
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/']);
  });

  it('should fetch greeting on init', async () => {
    fixture.detectChanges();
    // Wait for the async greeting fetch
    await vi.waitFor(() => {
      expect(mockState['sendMessage']).toHaveBeenCalledWith('__greeting__');
    });
  });

  it('should add user message on onUserMessage', async () => {
    fixture.detectChanges();
    // Wait for greeting to complete
    await vi.waitFor(() => expect(mockState['sendMessage']).toHaveBeenCalled());

    await component.onUserMessage('My answer');
    const msgs = component.messages();
    const candidateMsg = msgs.find(m => m.role === 'candidate' && m.text === 'My answer');
    expect(candidateMsg).toBeTruthy();
  });

  it('should add interviewer response after user message', async () => {
    fixture.detectChanges();
    await vi.waitFor(() => expect(mockState['sendMessage']).toHaveBeenCalled());

    mockState['sendMessage'] = vi.fn().mockResolvedValue({
      messages: [{ text: 'Good answer!', facialExpression: 'smile', animation: 'nod' }],
      metadata: { questionNumber: 2, totalQuestions: 8, phase: 'questioning' },
    });

    await component.onUserMessage('Some answer');
    const msgs = component.messages();
    const interviewerMsg = msgs.find(m => m.text === 'Good answer!');
    expect(interviewerMsg).toBeTruthy();
  });

  it('should update progress from backend response', async () => {
    fixture.detectChanges();
    await vi.waitFor(() => expect(mockState['sendMessage']).toHaveBeenCalled());

    expect(component.progress()).toEqual({
      questionNumber: 1,
      totalQuestions: 8,
      phase: 'greeting',
    });
  });

  it('should show error toast on API failure', async () => {
    fixture.detectChanges();
    await vi.waitFor(() => expect(mockState['sendMessage']).toHaveBeenCalled());

    mockState['sendMessage'] = vi.fn().mockRejectedValue(new Error('Network error'));
    await component.onUserMessage('test');
    expect(component.errorMsg()).toBeTruthy();
  });

  it('should dismiss error', () => {
    component.showError('test error');
    expect(component.errorMsg()).toBe('test error');
    component.dismissError();
    expect(component.errorMsg()).toBeNull();
  });

  it('should end interview', async () => {
    fixture.detectChanges();
    await vi.waitFor(() => expect(mockState['sendMessage']).toHaveBeenCalled());

    await component.endInterview();
    expect(mockState['endInterview']).toHaveBeenCalled();
    expect(mockState['goToReport']).toHaveBeenCalled();
  });

  it('should set webglFailed on avatar error', () => {
    fixture.detectChanges();
    component.onAvatarError('WebGL not supported');
    expect(component.webglFailed()).toBe(true);
  });

  it('should not process empty messages', async () => {
    fixture.detectChanges();
    await vi.waitFor(() => expect(mockState['sendMessage']).toHaveBeenCalled());

    const callsBefore = (mockState['sendMessage'] as any).mock.calls.length;
    await component.onUserMessage('   ');
    expect((mockState['sendMessage'] as any).mock.calls.length).toBe(callsBefore);
  });
});
