import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { InterviewConfigComponent } from './interview-config.component';

describe('InterviewConfigComponent', () => {
  let component: InterviewConfigComponent;
  let fixture: ComponentFixture<InterviewConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewConfigComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InterviewConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default form values', () => {
    const val = component.form.getRawValue();
    expect(val.role).toBe('');
    expect(val.type).toBe('mixed');
    expect(val.difficulty).toBe('mid');
    expect(val.language).toBe('en');
    expect(val.totalQuestions).toBe(8);
  });

  it('should be invalid when role is empty', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('should be valid when role is filled', () => {
    component.form.patchValue({ role: 'Frontend Developer' });
    expect(component.form.valid).toBe(true);
  });

  it('should emit configSubmitted on valid submit', () => {
    const spy = vi.spyOn(component.configSubmitted, 'emit');
    component.form.patchValue({ role: 'Backend Developer' });
    component.onSubmit();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'Backend Developer',
        type: 'mixed',
        difficulty: 'mid',
        language: 'en',
        totalQuestions: 8,
      }),
    );
  });

  it('should not emit on invalid submit', () => {
    const spy = vi.spyOn(component.configSubmitted, 'emit');
    component.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should set isSubmitting to true on submit', () => {
    component.form.patchValue({ role: 'Dev' });
    component.onSubmit();
    expect(component.isSubmitting).toBe(true);
  });

  it('should exclude empty optional fields from emitted config', () => {
    const spy = vi.spyOn(component.configSubmitted, 'emit');
    component.form.patchValue({ role: 'Dev', resumeText: '', jobDescription: '' });
    component.onSubmit();
    const emitted = spy.mock.calls[0][0];
    expect(emitted).not.toHaveProperty('resumeText');
    expect(emitted).not.toHaveProperty('jobDescription');
  });

  it('should include optional fields when provided', () => {
    const spy = vi.spyOn(component.configSubmitted, 'emit');
    component.form.patchValue({ role: 'Dev', resumeText: 'My resume', jobDescription: 'Build things' });
    component.onSubmit();
    const emitted = spy.mock.calls[0]?.[0];
    expect(emitted).toBeDefined();
    expect(emitted!.resumeText).toBe('My resume');
    expect(emitted!.jobDescription).toBe('Build things');
  });

  it('should render all interview type options', () => {
    const labels = fixture.nativeElement.querySelectorAll('input[type="radio"][formControlName="type"]');
    expect(labels.length).toBe(3);
  });

  it('should render difficulty options', () => {
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"][formControlName="difficulty"]');
    expect(radios.length).toBe(3);
  });
});
