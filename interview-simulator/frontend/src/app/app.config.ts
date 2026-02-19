import { ApplicationConfig, provideBrowserGlobalErrorListeners, ErrorHandler } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { GlobalErrorHandler } from '@core/services/global-error-handler';

import { routes } from './app.routes';

const SUPPORTED_LANGS = ['en', 'es'];

function detectBrowserLang(): string {
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = navigator.language?.split('-')[0];
  return SUPPORTED_LANGS.includes(browserLang) ? browserLang : 'en';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideTranslateService({
      fallbackLang: 'en',
      lang: detectBrowserLang(),
    }),
    // Must come AFTER provideTranslateService so the HTTP loader
    // overrides the default NoOp loader registered internally.
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json',
    }),
  ]
};
