import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toastService = inject(ToastService);

  handleError(error: unknown): void {
    // Log to console for debugging
    console.error('[GlobalErrorHandler]', error);

    let message = 'An unexpected error occurred';

    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        message = 'Network error. Please check your connection.';
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        message = 'Request timed out. Please try again.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        message = 'Session expired. Please restart.';
      } else if (error.message.includes('429') || error.message.includes('Too Many')) {
        message = 'Too many requests. Please wait a moment.';
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        message = 'Server error. Please try again later.';
      }
    }

    this.toastService.error(message);
  }
}
