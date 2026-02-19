import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HistoryComponent } from './history.component';
import { StorageService, type StoredInterview } from '@core/services/storage.service';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;
  let mockStorage: Record<string, any>;
  let router: Router;

  const mockInterviews: StoredInterview[] = [
    {
      id: '1', date: '2026-02-15T10:00:00Z', role: 'Frontend Dev',
      type: 'technical', difficulty: 'mid', overallScore: 82,
      report: { overallScore: 82, strengths: ['a'], improvements: ['b'], questionScores: [], suggestedResources: [] },
    },
    {
      id: '2', date: '2026-02-10T10:00:00Z', role: 'Backend Dev',
      type: 'behavioral', difficulty: 'senior', overallScore: 65,
      report: { overallScore: 65, strengths: ['c'], improvements: ['d'], questionScores: [], suggestedResources: [] },
    },
  ];

  beforeEach(async () => {
    mockStorage = {
      history: vi.fn().mockReturnValue(mockInterviews) as any,
      delete: vi.fn(),
      clearAll: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        provideRouter([]),
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display interview count', () => {
    expect(fixture.nativeElement.textContent).toContain('2 past interviews');
  });

  it('should display interview roles', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Frontend Dev');
    expect(text).toContain('Backend Dev');
  });

  it('should display scores', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('82');
    expect(text).toContain('65');
  });

  it('should delete interview on button click', () => {
    component.deleteInterview(new Event('click'), '1');
    expect(mockStorage['delete']).toHaveBeenCalledWith('1');
  });

  it('should navigate to report on click', () => {
    const spy = vi.spyOn(router, 'navigate');
    component.viewReport(mockInterviews[0]);
    expect(spy).toHaveBeenCalledWith(['/history', '1']);
  });

  it('should show empty state when no history', () => {
    mockStorage['history'] = vi.fn().mockReturnValue([]);
    fixture = TestBed.createComponent(HistoryComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No interviews yet');
  });

  it('should require confirmation for clear all', () => {
    expect(component.showClearConfirm()).toBe(false);
    component.confirmClearAll(); // first click
    expect(component.showClearConfirm()).toBe(true);
    component.confirmClearAll(); // second click
    expect(mockStorage['clearAll']).toHaveBeenCalled();
  });
});
