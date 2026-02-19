import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { InterviewStateService } from '@core/services/interview-state.service';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50
                dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 py-8 px-4">

      <div class="max-w-3xl mx-auto">

        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Interview Report</h1>
          <p class="text-slate-500 dark:text-slate-400">
            {{ state.config()?.role ?? 'Interview' }} — {{ state.config()?.difficulty ?? '' | titlecase }} Level
          </p>
        </div>

        @if (report(); as r) {
          <!-- Overall Score -->
          <div class="flex justify-center mb-10">
            <div class="relative w-40 h-40">
              <!-- Background circle -->
              <svg class="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" stroke-width="10"
                        class="fill-none stroke-slate-200 dark:stroke-slate-700" />
                <circle cx="80" cy="80" r="70" stroke-width="10"
                        stroke-linecap="round"
                        class="fill-none transition-all duration-1000 ease-out"
                        [class]="scoreColor(r.overallScore)"
                        [attr.stroke-dasharray]="circumference"
                        [attr.stroke-dashoffset]="circumference - (circumference * r.overallScore / 100)" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-4xl font-bold text-slate-800 dark:text-white">{{ r.overallScore }}</span>
                <span class="text-xs text-slate-400 uppercase tracking-wide">Score</span>
              </div>
            </div>
          </div>

          <!-- Strengths & Improvements -->
          <div class="grid md:grid-cols-2 gap-4 mb-8">
            <!-- Strengths -->
            <div class="bg-white dark:bg-slate-800/60 rounded-xl border border-green-200 dark:border-green-800/50 p-5">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 class="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Strengths</h3>
              </div>
              <ul class="space-y-2">
                @for (s of r.strengths; track s) {
                  <li class="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span class="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                    {{ s }}
                  </li>
                }
              </ul>
            </div>

            <!-- Improvements -->
            <div class="bg-white dark:bg-slate-800/60 rounded-xl border border-amber-200 dark:border-amber-800/50 p-5">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 class="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Areas to Improve</h3>
              </div>
              <ul class="space-y-2">
                @for (i of r.improvements; track i) {
                  <li class="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span class="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                    {{ i }}
                  </li>
                }
              </ul>
            </div>
          </div>

          <!-- Question Breakdown -->
          @if (r.questionScores && r.questionScores.length > 0) {
            <div class="mb-8">
              <h2 class="text-lg font-semibold text-slate-800 dark:text-white mb-4">Question Breakdown</h2>
              <div class="space-y-3">
                @for (q of r.questionScores; track $index) {
                  <div class="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div class="flex items-start justify-between gap-3 mb-2">
                      <p class="text-sm font-medium text-slate-800 dark:text-white flex-1">{{ q.question }}</p>
                      <span class="shrink-0 px-2 py-0.5 text-xs font-bold rounded-full"
                            [class]="scoreBadge(q.score)">
                        {{ q.score }}/10
                      </span>
                    </div>
                    <!-- Score bar -->
                    <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mb-2 overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                           [class]="scoreBarColor(q.score)"
                           [style.width.%]="q.score * 10"></div>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400">{{ q.feedback }}</p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Suggested Resources -->
          @if (r.suggestedResources && r.suggestedResources.length > 0) {
            <div class="mb-8">
              <h2 class="text-lg font-semibold text-slate-800 dark:text-white mb-3">Suggested Resources</h2>
              <div class="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <ul class="space-y-2">
                  @for (res of r.suggestedResources; track res) {
                    <li class="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
                      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {{ res }}
                    </li>
                  }
                </ul>
              </div>
            </div>
          }

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              class="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700
                     rounded-xl shadow-lg shadow-primary-500/20 transition-all"
              (click)="tryAgain()"
            >
              Try Again
            </button>
            <button
              type="button"
              class="px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300
                     bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600
                     hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
              (click)="downloadPdf()"
            >
              Download PDF
            </button>
          </div>
        } @else {
          <!-- No report state -->
          <div class="text-center py-16">
            <p class="text-slate-400 dark:text-slate-500">No report available.</p>
            <button
              type="button"
              class="mt-4 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              (click)="tryAgain()"
            >
              Start a new interview
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class ReportComponent {
  readonly state = inject(InterviewStateService);
  private readonly router = inject(Router);

  readonly report = this.state.report;
  readonly circumference = 2 * Math.PI * 70; // r=70

  scoreColor(score: number): string {
    if (score >= 80) return 'stroke-green-500';
    if (score >= 60) return 'stroke-amber-500';
    return 'stroke-red-500';
  }

  scoreBadge(score: number): string {
    if (score >= 8) return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300';
    if (score >= 5) return 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300';
    return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
  }

  scoreBarColor(score: number): string {
    if (score >= 8) return 'bg-green-500';
    if (score >= 5) return 'bg-amber-500';
    return 'bg-red-500';
  }

  tryAgain(): void {
    this.state.reset();
    this.router.navigate(['/']);
  }

  downloadPdf(): void {
    window.print();
  }
}
