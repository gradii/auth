/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TRI_AUTH_INTERCEPTOR_HEADER } from '../../auth.options';

import { TriAuthService } from '../auth.service';
import { TriAuthToken } from '../token/token';

@Injectable()
export class TriAuthSimpleInterceptor implements HttpInterceptor {
  private injector = inject(Injector);
  protected headerName =
    inject(TRI_AUTH_INTERCEPTOR_HEADER, { optional: true }) ?? 'Authorization';

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return this.authService.getToken().pipe(
      switchMap((token: TriAuthToken) => {
        if (token && token.getValue()) {
          req = req.clone({
            setHeaders: {
              [this.headerName]: token.getValue(),
            },
          });
        }
        return next.handle(req);
      })
    );
  }

  protected get authService(): TriAuthService {
    return this.injector.get(TriAuthService);
  }
}
