import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggleComponent } from './theme-toggle.component';
import { TranslateModule } from '@ngx-translate/core';
import { ConnectionService } from '@core/services/connection.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ThemeToggleComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex items-center justify-between h-14">

          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2 group">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700
                        flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg class="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span class="text-sm font-bold text-slate-800 dark:text-white hidden sm:inline">
              IntervIA
            </span>
          </a>

          <!-- Desktop nav links -->
          <div class="hidden md:flex items-center gap-1">
            <a
              routerLink="/"
              routerLinkActive="bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
              [routerLinkActiveOptions]="{ exact: true }"
              class="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400
                     hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
            >
              {{ 'NAV.HOME' | translate }}
            </a>
            <a
              routerLink="/interview/session"
              routerLinkActive="bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
              class="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400
                     hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
            >
              {{ 'NAV.INTERVIEW' | translate }}
            </a>
            <a
              routerLink="/history"
              routerLinkActive="bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
              class="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400
                     hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
            >
              {{ 'NAV.HISTORY' | translate }}
            </a>
          </div>

          <!-- Right side: connection + theme toggle + mobile menu -->
          <div class="flex items-center gap-1">
            <!-- Connection status -->
            @if (!connection.isOnline()) {
              <span class="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 mr-1"
                    role="status" aria-live="polite">
                <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                <span class="hidden sm:inline">Offline</span>
              </span>
            }

            <app-theme-toggle />

            <!-- Mobile hamburger -->
            <button
              type="button"
              class="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              (click)="mobileMenuOpen.set(!mobileMenuOpen())"
              [attr.aria-expanded]="mobileMenuOpen()"
              aria-label="Toggle menu"
            >
              @if (mobileMenuOpen()) {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              }
            </button>
          </div>
        </div>

        <!-- Mobile menu -->
        @if (mobileMenuOpen()) {
          <div class="md:hidden border-t border-slate-200 dark:border-slate-800 py-2 space-y-1">
            <a
              routerLink="/"
              routerLinkActive="bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
              [routerLinkActiveOptions]="{ exact: true }"
              class="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              (click)="mobileMenuOpen.set(false)"
            >
              {{ 'NAV.HOME' | translate }}
            </a>
            <a
              routerLink="/interview/session"
              routerLinkActive="bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
              class="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              (click)="mobileMenuOpen.set(false)"
            >
              {{ 'NAV.INTERVIEW' | translate }}
            </a>
            <a
              routerLink="/history"
              routerLinkActive="bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
              class="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              (click)="mobileMenuOpen.set(false)"
            >
              {{ 'NAV.HISTORY' | translate }}
            </a>
          </div>
        }
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  readonly connection = inject(ConnectionService);
  readonly mobileMenuOpen = signal(false);
}
