import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ReportComponent } from './report.component';
import { InterviewStateService } from '@core/services/interview-state.service';

describe('ReportComponent', () => {
  let component: ReportComponent;
  let fixture: ComponentFixture<ReportComponent>;
  let mockState: Record<string, any>;
  let router: Router;

  const mockReport = {
    overallScore: 78,
    strengths: ['Good communication', 'Strong technical skills'],
    improvements: ['Provide more examples'],
    questionScores: [
      { question: 'Tell me about yourself', answer: 'I am a dev', score: 7, feedback: 'Good overview' },
      { question: 'What is a closure?', answer: 'A function...', score: 9, feedback: 'Excellent' },
    ],
    suggestedResources: ['STAR Method Guide', 'System Design Primer'],
  };

  beforeEach(async () => {
    mockState = {
      report: vi.fn().mockReturnValue(mockReport) as any,
      config: vi.fn().mockReturnValue({ role: 'Frontend Dev', difficulty: 'mid', language: 'en' }) as any,
      reset: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReportComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: InterviewStateService, useValue: mockState },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display overall score', () => {
    const scoreText = fixture.nativeElement.textContent;
    expect(scoreText).toContain('78');
  });

  it('should display strengths', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Good communication');
    expect(text).toContain('Strong technical skills');
  });

  it('should display improvements', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Provide more examples');
  });

  it('should display question scores', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Tell me about yourself');
    expect(text).toContain('7/10');
    expect(text).toContain('9/10');
  });

  it('should display suggested resources', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('STAR Method Guide');
    expect(text).toContain('System Design Primer');
  });

  it('should navigate home on try again', () => {
    const spy = vi.spyOn(router, 'navigate');
    component.tryAgain();
    expect(mockState['reset']).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(['/']);
  });

  it('should return correct score color', () => {
    expect(component.scoreColor(85)).toContain('green');
    expect(component.scoreColor(65)).toContain('amber');
    expect(component.scoreColor(40)).toContain('red');
  });

  it('should show no-report state when report is null', () => {
    mockState['report'] = vi.fn().mockReturnValue(null);
    fixture = TestBed.createComponent(ReportComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('No report available');
  });
});
