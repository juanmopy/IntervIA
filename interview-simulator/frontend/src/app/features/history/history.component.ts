import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { StorageService, type StoredInterview } from '@core/services/storage.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [DatePipe, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50
                dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 py-8 px-4">

      <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Interview History</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {{ storage.history().length }} past {{ storage.history().length === 1 ? 'interview' : 'interviews' }}
            </p>
          </div>

          @if (storage.history().length > 0) {
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400
                     bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50
                     border border-red-200 dark:border-red-800 rounded-lg transition-colors"
              (click)="confirmClearAll()"
            >
              {{ showClearConfirm() ? 'Confirm Clear All?' : 'Clear All' }}
            </button>
          }
        </div>

        <!-- Interview list -->
        @if (storage.history().length > 0) {
          <div class="space-y-3">
            @for (interview of storage.history(); track interview.id) {
              <div class="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700
                          p-4 flex items-center gap-4 group hover:border-primary-300 dark:hover:border-primary-700
                          transition-colors cursor-pointer"
                   (click)="viewReport(interview)">

                <!-- Score badge -->
                <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold"
                     [class]="scoreBg(interview.overallScore)">
                  {{ interview.overallScore }}
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-800 dark:text-white truncate">
                    {{ interview.role }}
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ interview.date | date:'MMM d, yyyy HH:mm' }} · {{ interview.difficulty | titlecase }} · {{ interview.type | titlecase }}
                  </p>
                </div>

                <!-- Delete button -->
                <button
                  type="button"
                  class="p-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500
                         dark:hover:text-red-400 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                  (click)="deleteInterview($event, interview.id)"
                  aria-label="Delete interview"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            }
          </div>
        } @else {
          <!-- Empty state -->
          <div class="text-center py-20">
            <svg class="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-slate-400 dark:text-slate-500 mb-4">No interviews yet</p>
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700
                     dark:text-primary-400 dark:hover:text-primary-300"
              (click)="startNew()"
            >
              Start your first interview
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class HistoryComponent {
  readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  readonly showClearConfirm = signal(false);

  scoreBg(score: number): string {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300';
    if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300';
    return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
  }

  viewReport(interview: StoredInterview): void {
    // Navigate to a dedicated history report view
    this.router.navigate(['/history', interview.id]);
  }

  deleteInterview(event: Event, id: string): void {
    event.stopPropagation();
    this.storage.delete(id);
  }

  confirmClearAll(): void {
    if (this.showClearConfirm()) {
      this.storage.clearAll();
      this.showClearConfirm.set(false);
    } else {
      this.showClearConfirm.set(true);
      // Auto-reset after 3 seconds
      setTimeout(() => this.showClearConfirm.set(false), 3000);
    }
  }

  startNew(): void {
    this.router.navigate(['/']);
  }
}
