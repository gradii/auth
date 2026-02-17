/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import {
  HttpEvent,
  HttpHandler,
  HttpHandlerFn,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TRI_AUTH_TOKEN_INTERCEPTOR_FILTER } from '../../auth.options';
import { TriAuthService } from '../auth.service';
import { TriAuthToken } from '../token/token';

@Injectable()
export class TriAuthJWTInterceptor implements HttpInterceptor {
  private injector = inject(Injector);
  protected filter = inject<(req: HttpRequest<unknown>) => boolean>(
    TRI_AUTH_TOKEN_INTERCEPTOR_FILTER
  );

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (!this.filter(req)) {
      return this.authService.isAuthenticatedOrRefresh().pipe(
        switchMap((authenticated) => {
          if (authenticated) {
            return this.authService.getToken().pipe(
              switchMap((token: TriAuthToken) => {
                const JWT = `Bearer ${token.getValue()}`;
                req = req.clone({
                  setHeaders: {
                    Authorization: JWT,
                  },
                });
                return next.handle(req);
              })
            );
          } else {
            return next.handle(req);
          }
        })
      );
    } else {
      return next.handle(req);
    }
  }

  protected get authService(): TriAuthService {
    return this.injector.get(TriAuthService);
  }
}

export function triAuthJwtInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const authService = inject(TriAuthService);
  const filter: (req: HttpRequest<any>) => boolean = inject(
    TRI_AUTH_TOKEN_INTERCEPTOR_FILTER
  );

  if (!filter(req)) {
    return authService.isAuthenticatedOrRefresh().pipe(
      switchMap((authenticated) => {
        if (authenticated) {
          return authService.getToken().pipe(
            switchMap((token: TriAuthToken) => {
              const JWT = `Bearer ${token.getValue()}`;
              req = req.clone({
                setHeaders: {
                  Authorization: JWT,
                },
              });
              return next(req);
            })
          );
        } else {
          return next(req);
        }
      })
    ) as Observable<HttpEvent<unknown>>;
  } else {
    return next(req);
  }
}
