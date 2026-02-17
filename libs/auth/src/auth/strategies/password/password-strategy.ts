/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of as observableOf } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { TriAuthStrategyClass } from '../../auth.options';

import { TriAuthResult } from '../../services/auth-result';
import { TriAuthIllegalTokenError } from '../../services/token/token';
import { TriAuthStrategy } from '../auth-strategy';
import {
  passwordStrategyOptions,
  TriPasswordAuthStrategyOptions,
} from './password-strategy-options';

/**
 * The most common authentication provider for email/password strategy.
 *
 * Strategy settings. Note, there is no need to copy over the whole object to change the settings you need.
 * Also, this.getOption call won't work outside of the default options declaration
 * (which is inside of the `TriPasswordAuthStrategy` class), so you have to replace it with a custom helper function
 * if you need it.
 *
 * ```ts
 * export class TriPasswordAuthStrategyOptions extends TriAuthStrategyOptions {
 *  name: string;
 *  baseEndpoint? = '/api/auth/';
 *  login?: boolean | TriPasswordStrategyModule = {
 *    alwaysFail: false,
 *    endpoint: 'login',
 *    method: 'post',
 *    requireValidToken: true,
 *    redirect: {
 *      success: '/',
 *      failure: null,
 *    },
 *    defaultErrors: ['Login/Email combination is not correct, please try again.'],
 *    defaultMessages: ['You have been successfully logged in.'],
 *  };
 *  register?: boolean | TriPasswordStrategyModule = {
 *    alwaysFail: false,
 *    endpoint: 'register',
 *    method: 'post',
 *    requireValidToken: true,
 *    redirect: {
 *      success: '/',
 *      failure: null,
 *    },
 *    defaultErrors: ['Something went wrong, please try again.'],
 *    defaultMessages: ['You have been successfully registered.'],
 *  };
 *  requestPass?: boolean | TriPasswordStrategyModule = {
 *    endpoint: 'request-pass',
 *    method: 'post',
 *    redirect: {
 *      success: '/',
 *      failure: null,
 *    },
 *    defaultErrors: ['Something went wrong, please try again.'],
 *    defaultMessages: ['Reset password instructions have been sent to your email.'],
 *  };
 *  resetPass?: boolean | TriPasswordStrategyReset = {
 *    endpoint: 'reset-pass',
 *    method: 'put',
 *    redirect: {
 *      success: '/',
 *      failure: null,
 *    },
 *    resetPasswordTokenKey: 'reset_password_token',
 *    defaultErrors: ['Something went wrong, please try again.'],
 *    defaultMessages: ['Your password has been successfully changed.'],
 *  };
 *  logout?: boolean | TriPasswordStrategyReset = {
 *    alwaysFail: false,
 *    endpoint: 'logout',
 *    method: 'delete',
 *    redirect: {
 *      success: '/',
 *      failure: null,
 *    },
 *    defaultErrors: ['Something went wrong, please try again.'],
 *    defaultMessages: ['You have been successfully logged out.'],
 *  };
 *  refreshToken?: boolean | TriPasswordStrategyModule = {
 *    endpoint: 'refresh-token',
 *    method: 'post',
 *    requireValidToken: true,
 *    redirect: {
 *      success: null,
 *      failure: null,
 *    },
 *    defaultErrors: ['Something went wrong, please try again.'],
 *    defaultMessages: ['Your token has been successfully refreshed.'],
 *  };
 *  token?: TriPasswordStrategyToken = {
 *    class: TriAuthSimpleToken,
 *    key: 'data.token',
 *    getter: (module: string, res: HttpResponse<Object>, options: TriPasswordAuthStrategyOptions) => getDeepFromObject(
 *      res.body,
 *      options.token.key,
 *    ),
 *  };
 *  errors?: TriPasswordStrategyMessage = {
 *    key: 'data.errors',
 *    getter: (module: string, res: HttpErrorResponse, options: TriPasswordAuthStrategyOptions) => getDeepFromObject(
 *      res.error,
 *      options.errors.key,
 *      options[module].defaultErrors,
 *    ),
 *  };
 *  messages?: TriPasswordStrategyMessage = {
 *    key: 'data.messages',
 *    getter: (module: string, res: HttpResponse<Object>, options: TriPasswordAuthStrategyOptions) => getDeepFromObject(
 *      res.body,
 *      options.messages.key,
 *      options[module].defaultMessages,
 *    ),
 *  };
 *  validation?: {
 *    password?: {
 *      required?: boolean;
 *      minLength?: number | null;
 *      maxLength?: number | null;
 *      regexp?: string | null;
 *    };
 *    email?: {
 *      required?: boolean;
 *      regexp?: string | null;
 *    };
 *    fullName?: {
 *      required?: boolean;
 *      minLength?: number | null;
 *      maxLength?: number | null;
 *      regexp?: string | null;
 *    };
 *  };
 * }
 * ```
 */
@Injectable()
export class TriPasswordAuthStrategy extends TriAuthStrategy {
  protected http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  protected override defaultOptions: TriPasswordAuthStrategyOptions =
    passwordStrategyOptions;

  static setup(
    options: TriPasswordAuthStrategyOptions
  ): [TriAuthStrategyClass, TriPasswordAuthStrategyOptions] {
    return [TriPasswordAuthStrategy, options];
  }

  authenticate(data?: any): Observable<TriAuthResult> {
    const module = 'login';
    const method = this.getOption(`${module}.method`);
    const url = this.getActionEndpoint(module);
    const requireValidToken = this.getOption(`${module}.requireValidToken`);
    return this.http
      .request(method, url, {
        body: data,
        observe: 'response',
        headers: this.getHeaders(),
      })
      .pipe(
        map((res) => {
          if (this.getOption(`${module}.alwaysFail`)) {
            throw this.createFailResponse(data);
          }
          return res;
        }),
        map((res) => {
          return new TriAuthResult(
            true,
            res,
            this.getOption(`${module}.redirect.success`),
            [],
            this.getOption('messages.getter')(module, res, this.options),
            this.createToken(
              this.getOption('token.getter')(module, res, this.options),
              requireValidToken
            )
          );
        }),
        catchError((res) => {
          return this.handleResponseError(res, module);
        })
      );
  }

  register(data?: any): Observable<TriAuthResult> {
    const module = 'register';
    const method = this.getOption(`${module}.method`);
    const url = this.getActionEndpoint(module);
    const requireValidToken = this.getOption(`${module}.requireValidToken`);
    return this.http
      .request(method, url, {
        body: data,
        observe: 'response',
        headers: this.getHeaders(),
      })
      .pipe(
        map((res) => {
          if (this.getOption(`${module}.alwaysFail`)) {
            throw this.createFailResponse(data);
          }

          return res;
        }),
        map((res) => {
          return new TriAuthResult(
            true,
            res,
            this.getOption(`${module}.redirect.success`),
            [],
            this.getOption('messages.getter')(module, res, this.options),
            this.createToken(
              this.getOption('token.getter')('login', res, this.options),
              requireValidToken
            )
          );
        }),
        catchError((res) => {
          return this.handleResponseError(res, module);
        })
      );
  }

  requestPassword(data?: any): Observable<TriAuthResult> {
    const module = 'requestPass';
    const method = this.getOption(`${module}.method`);
    const url = this.getActionEndpoint(module);
    return this.http
      .request(method, url, {
        body: data,
        observe: 'response',
        headers: this.getHeaders(),
      })
      .pipe(
        map((res) => {
          if (this.getOption(`${module}.alwaysFail`)) {
            throw this.createFailResponse();
          }

          return res;
        }),
        map((res) => {
          return new TriAuthResult(
            true,
            res,
            this.getOption(`${module}.redirect.success`),
            [],
            this.getOption('messages.getter')(module, res, this.options)
          );
        }),
        catchError((res) => {
          return this.handleResponseError(res, module);
        })
      );
  }

  resetPassword(data: any = {}): Observable<TriAuthResult> {
    const module = 'resetPass';
    const method = this.getOption(`${module}.method`);
    const url = this.getActionEndpoint(module);
    const tokenKey = this.getOption(`${module}.resetPasswordTokenKey`);
    data[tokenKey] = this.route.snapshot.queryParams[tokenKey];
    return this.http
      .request(method, url, {
        body: data,
        observe: 'response',
        headers: this.getHeaders(),
      })
      .pipe(
        map((res) => {
          if (this.getOption(`${module}.alwaysFail`)) {
            throw this.createFailResponse();
          }

          return res;
        }),
        map((res) => {
          return new TriAuthResult(
            true,
            res,
            this.getOption(`${module}.redirect.success`),
            [],
            this.getOption('messages.getter')(module, res, this.options)
          );
        }),
        catchError((res) => {
          return this.handleResponseError(res, module);
        })
      );
  }

  logout(): Observable<TriAuthResult> {
    const module = 'logout';
    const method = this.getOption(`${module}.method`);
    const url = this.getActionEndpoint(module);

    return observableOf({}).pipe(
      switchMap((res: any) => {
        if (!url) {
          return observableOf(res);
        }
        return this.http.request(method, url, {
          observe: 'response',
          headers: this.getHeaders(),
        });
      }),
      map((res) => {
        if (this.getOption(`${module}.alwaysFail`)) {
          throw this.createFailResponse();
        }

        return res;
      }),
      map((res) => {
        return new TriAuthResult(
          true,
          res,
          this.getOption(`${module}.redirect.success`),
          [],
          this.getOption('messages.getter')(module, res, this.options)
        );
      }),
      catchError((res) => {
        return this.handleResponseError(res, module);
      })
    );
  }

  refreshToken(data?: any): Observable<TriAuthResult> {
    const module = 'refreshToken';
    const method = this.getOption(`${module}.method`);
    const url = this.getActionEndpoint(module);
    const requireValidToken = this.getOption(`${module}.requireValidToken`);

    const JWT = `Bearer ${data}`;

    let headers = this.getHeaders();
    headers = headers.append('Authorization', JWT);
    const body = method === 'get' || method === 'head' ? undefined : data;
    return this.http
      .request(method, url, {
        body,
        observe: 'response',
        headers: headers,
      })
      .pipe(
        map((res) => {
          if (this.getOption(`${module}.alwaysFail`)) {
            throw this.createFailResponse(data);
          }

          return res;
        }),
        map((res) => {
          return new TriAuthResult(
            true,
            res,
            this.getOption(`${module}.redirect.success`),
            [],
            this.getOption('messages.getter')(module, res, this.options),
            this.createToken(
              this.getOption('token.getter')(module, res, this.options),
              requireValidToken
            )
          );
        }),
        catchError((res) => {
          return this.handleResponseError(res, module);
        })
      );
  }

  protected handleResponseError(
    res: any,
    module: string
  ): Observable<TriAuthResult> {
    let errors = [];
    if (res instanceof HttpErrorResponse) {
      errors = this.getOption('errors.getter')(module, res, this.options);
    } else if (res instanceof TriAuthIllegalTokenError) {
      errors.push(res.message);
    } else {
      errors.push('Something went wrong.');
    }
    return observableOf(
      new TriAuthResult(
        false,
        res,
        this.getOption(`${module}.redirect.failure`),
        errors
      )
    );
  }
}
