import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { InterviewConfigComponent } from './interview-config.component';
import {
  InterviewStateService,
  type InterviewConfig,
} from '@core/services/interview-state.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [InterviewConfigComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50
                dark:from-slate-950 dark:via-slate-900 dark:to-slate-800"
         role="main">

      <!-- Hero Section -->
      <section class="pt-16 pb-8 px-4 text-center" aria-label="Hero">
        <div class="max-w-2xl mx-auto">
          <div class="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium
                      bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">
            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            AI-Powered Mock Interviews
          </div>

          <h1 class="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
            Practice Your Next
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
              Interview
            </span>
          </h1>

          <p class="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10">
            Get realistic interview practice with an AI interviewer, 3D avatar, and real-time voice interaction.
            Receive instant feedback to improve your skills.
          </p>
        </div>
      </section>

      <!-- Config Form -->
      <section class="px-4 pb-20" aria-label="Interview configuration">
        <div class="max-w-lg mx-auto bg-white dark:bg-slate-800/60 backdrop-blur
                    rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/30
                    border border-slate-200 dark:border-slate-700/60 p-6 md:p-8">

          <h2 class="text-xl font-semibold text-slate-800 dark:text-white mb-1">Configure Your Session</h2>
          <p class="text-sm text-slate-400 dark:text-slate-500 mb-6">Set up your mock interview preferences</p>

          <app-interview-config (configSubmitted)="onStart($event)" />

          @if (state.error()) {
            <div class="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800
                        text-red-700 dark:text-red-300 rounded-lg text-sm">
              {{ state.error() }}
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class HomeComponent {
  readonly state = inject(InterviewStateService);

  async onStart(config: InterviewConfig): Promise<void> {
    await this.state.startInterview(config);
    this.state.goToInterview();
  }
}
