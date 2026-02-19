import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'interview/session',
    loadComponent: () =>
      import('@features/interview/interview.component').then(m => m.InterviewComponent),
  },
  {
    path: 'report',
    loadComponent: () =>
      import('@features/report/report.component').then(m => m.ReportComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('@features/history/history.component').then(m => m.HistoryComponent),
  },
  {
    path: 'history/:id',
    loadComponent: () =>
      import('@features/history/history-report.component').then(m => m.HistoryReportComponent),
  },
  { path: '**', redirectTo: '' },
];
