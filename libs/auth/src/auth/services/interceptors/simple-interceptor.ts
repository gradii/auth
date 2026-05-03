/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  type HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { TRI_AUTH_INTERCEPTOR_HEADER } from '../../auth.options';
import { TriAuthService } from '../auth.service';

/**
 * Functional simple interceptor — module-less.
 *
 * Register via `withInterceptors([triAuthSimpleInterceptor])` in `provideHttpClient`.
 */
export const triAuthSimpleInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(TriAuthService);
  const headerName =
    inject(TRI_AUTH_INTERCEPTOR_HEADER, { optional: true }) ?? 'Authorization';

  const token = authService.getToken();
  if (token && token.getValue()) {
    req = req.clone({
      setHeaders: { [headerName]: token.getValue() },
    });
  }
  return next(req);
};
