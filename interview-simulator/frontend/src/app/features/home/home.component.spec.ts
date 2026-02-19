import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HomeComponent } from './home.component';
import { InterviewStateService } from '@core/services/interview-state.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockState: Partial<InterviewStateService>;

  beforeEach(async () => {
    mockState = {
      error: vi.fn().mockReturnValue(null) as any,
      startInterview: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: InterviewStateService, useValue: mockState },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render hero heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent).toContain('Interview');
  });

  it('should render config form', () => {
    const form = fixture.nativeElement.querySelector('app-interview-config');
    expect(form).toBeTruthy();
  });

  it('should call startInterview on config submit', async () => {
    const config = { role: 'Dev', type: 'mixed' as const, difficulty: 'mid' as const, language: 'en' as const, totalQuestions: 8 };
    await component.onStart(config);
    expect(mockState.startInterview).toHaveBeenCalledWith(config);
  });
});
