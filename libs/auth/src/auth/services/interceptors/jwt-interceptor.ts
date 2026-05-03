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
import { switchMap } from 'rxjs/operators';

import { TRI_AUTH_TOKEN_INTERCEPTOR_FILTER } from '../../auth.options';
import { TriAuthService } from '../auth.service';

/**
 * Functional JWT interceptor — module-less.
 *
 * Register via `withInterceptors([triAuthJwtInterceptor])` in `provideHttpClient`.
 */
export const triAuthJwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(TriAuthService);
  const filter: (req: HttpRequest<any>) => boolean = inject(
    TRI_AUTH_TOKEN_INTERCEPTOR_FILTER,
  );

  if (filter(req)) {
    return next(req);
  }

  return authService.isAuthenticatedOrRefresh().pipe(
    switchMap((authenticated) => {
      if (!authenticated) {
        return next(req);
      }
      const token = authService.getToken();
      if (!token) {
        return next(req);
      }
      const cloned = req.clone({
        setHeaders: { Authorization: `Bearer ${token.getValue()}` },
      });
      return next(cloned);
    }),
  );
};
