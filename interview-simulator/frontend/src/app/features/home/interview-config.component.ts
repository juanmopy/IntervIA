import {
  Component,
  Output,
  EventEmitter,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { type InterviewConfig } from '@core/services/interview-state.service';

@Component({
  selector: 'app-interview-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="onSubmit()"
      class="space-y-6"
    >
      <!-- Job Role -->
      <div>
        <label for="role" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Job Role <span class="text-red-500">*</span>
        </label>
        <input
          id="role"
          type="text"
          formControlName="role"
          list="role-suggestions"
          placeholder="e.g. Frontend Developer, Data Scientist..."
          class="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          [class]="form.get('role')?.invalid && form.get('role')?.touched
            ? 'border-red-400 dark:border-red-500'
            : 'border-slate-300 dark:border-slate-600'"
        />
        <datalist id="role-suggestions">
          <option value="Frontend Developer"></option>
          <option value="Backend Developer"></option>
          <option value="Full Stack Developer"></option>
          <option value="Data Scientist"></option>
          <option value="DevOps Engineer"></option>
          <option value="UX Designer"></option>
          <option value="Product Manager"></option>
          <option value="QA Engineer"></option>
          <option value="Mobile Developer"></option>
          <option value="Machine Learning Engineer"></option>
        </datalist>
        @if (form.get('role')?.invalid && form.get('role')?.touched) {
          <p class="mt-1 text-xs text-red-500" role="alert">Please enter a job role</p>
        }
      </div>

      <!-- Interview Type -->
      <div>
        <label id="type-label" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Interview Type <span class="text-red-500">*</span>
        </label>
        <div class="flex gap-3" role="radiogroup" aria-labelledby="type-label">
          @for (t of interviewTypes; track t.value) {
            <label
              class="flex-1 cursor-pointer"
            >
              <input
                type="radio"
                formControlName="type"
                [value]="t.value"
                class="sr-only peer"
              />
              <div class="px-3 py-2.5 text-center text-sm font-medium rounded-lg border transition-all
                          peer-checked:bg-primary-600 peer-checked:text-white peer-checked:border-primary-600
                          bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300
                          border-slate-300 dark:border-slate-600 hover:border-primary-400">
                {{ t.label }}
              </div>
            </label>
          }
        </div>
      </div>

      <!-- Difficulty -->
      <div>
        <label id="difficulty-label" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Difficulty <span class="text-red-500">*</span>
        </label>
        <div class="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden" role="radiogroup" aria-labelledby="difficulty-label">
          @for (d of difficulties; track d.value) {
            <label class="cursor-pointer">
              <input
                type="radio"
                formControlName="difficulty"
                [value]="d.value"
                class="sr-only peer"
              />
              <div class="px-5 py-2 text-sm font-medium transition-all
                          peer-checked:bg-primary-600 peer-checked:text-white
                          bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300
                          hover:bg-slate-50 dark:hover:bg-slate-700
                          border-r border-slate-300 dark:border-slate-600 last:border-r-0">
                {{ d.label }}
              </div>
            </label>
          }
        </div>
      </div>

      <!-- Language -->
      <div>
        <label for="language" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Language
        </label>
        <select
          id="language"
          formControlName="language"
          class="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                 text-slate-800 dark:text-slate-200"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      <!-- Number of Questions -->
      <div>
        <label for="totalQuestions" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Number of Questions: <span class="font-bold text-primary-600 dark:text-primary-400">{{ form.get('totalQuestions')?.value }}</span>
        </label>
        <input
          id="totalQuestions"
          type="range"
          formControlName="totalQuestions"
          min="5"
          max="15"
          step="1"
          class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div class="flex justify-between text-xs text-slate-400 mt-1">
          <span>5</span>
          <span>10</span>
          <span>15</span>
        </div>
      </div>

      <!-- Resume Upload (textarea for now) -->
      <div>
        <label for="resumeText" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Resume / CV <span class="text-xs text-slate-400">(optional — paste text)</span>
        </label>
        <textarea
          id="resumeText"
          formControlName="resumeText"
          rows="3"
          placeholder="Paste your resume text here..."
          class="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                 resize-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
        ></textarea>
      </div>

      <!-- Job Description -->
      <div>
        <label for="jobDescription" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Job Description <span class="text-xs text-slate-400">(optional)</span>
        </label>
        <textarea
          id="jobDescription"
          formControlName="jobDescription"
          rows="3"
          placeholder="Paste the job description here..."
          class="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                 resize-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
        ></textarea>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        [disabled]="form.invalid || isSubmitting"
        class="w-full py-3 px-4 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700
               disabled:bg-slate-400 disabled:cursor-not-allowed rounded-xl
               transition-all duration-200 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40
               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        @if (isSubmitting) {
          <span class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Starting Interview...
          </span>
        } @else {
          Start Interview
        }
      </button>
    </form>
  `,
})
export class InterviewConfigComponent {
  @Output() readonly configSubmitted = new EventEmitter<InterviewConfig>();

  private readonly fb = inject(FormBuilder);

  readonly interviewTypes = [
    { value: 'technical', label: 'Technical' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'mixed', label: 'Mixed' },
  ];

  readonly difficulties = [
    { value: 'junior', label: 'Junior' },
    { value: 'mid', label: 'Mid' },
    { value: 'senior', label: 'Senior' },
  ];

  isSubmitting = false;

  readonly form = this.fb.nonNullable.group({
    role: ['', [Validators.required, Validators.minLength(2)]],
    type: ['mixed' as 'technical' | 'behavioral' | 'mixed', Validators.required],
    difficulty: ['mid' as 'junior' | 'mid' | 'senior', Validators.required],
    language: ['en' as 'en' | 'es'],
    totalQuestions: [8],
    resumeText: [''],
    jobDescription: [''],
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSubmitting = true;

    const raw = this.form.getRawValue();
    const config: InterviewConfig = {
      role: raw.role,
      type: raw.type,
      difficulty: raw.difficulty,
      language: raw.language,
      totalQuestions: raw.totalQuestions,
      ...(raw.resumeText ? { resumeText: raw.resumeText } : {}),
      ...(raw.jobDescription ? { jobDescription: raw.jobDescription } : {}),
    };

    this.configSubmitted.emit(config);
  }
}
