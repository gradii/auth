/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { deepExtend, getDeepFromObject } from '../helpers';
import { TriAuthResult } from '../services/auth-result';
import {
  triAuthCreateToken,
  TriAuthIllegalTokenError,
  TriAuthToken,
} from '../services/token/token';
import { TriAuthStrategyOptions } from './auth-strategy-options';

export abstract class TriAuthStrategy {
  protected defaultOptions: TriAuthStrategyOptions;
  protected options: TriAuthStrategyOptions;

  // we should keep this any and validation should be done in `register` method instead
  // otherwise it won't be possible to pass an empty object
  setOptions(options: any): void {
    this.options = deepExtend({}, this.defaultOptions, options);
  }

  getOption(key: string): any {
    return getDeepFromObject(this.options, key, null);
  }

  createToken<T extends TriAuthToken>(
    value: any,
    failWhenInvalidToken?: boolean
  ): T {
    const token = triAuthCreateToken<T>(
      this.getOption('token.class'),
      value,
      this.getName()
    );
    // At this point, triAuthCreateToken failed with TriAuthIllegalTokenError which MUST be intercepted by strategies
    // Or token is created. It MAY be created even if backend did not return any token, in this case it is !Valid
    if (failWhenInvalidToken && !token.isValid()) {
      // If we require a valid token (i.e. isValid), then we MUST throw TriAuthIllegalTokenError so that the strategies
      // intercept it
      throw new TriAuthIllegalTokenError('Token is empty or invalid.');
    }
    return token;
  }

  getName(): string {
    return this.getOption('name');
  }

  abstract authenticate(data?: any): Observable<TriAuthResult>;

  abstract register(data?: any): Observable<TriAuthResult>;

  abstract requestPassword(data?: any): Observable<TriAuthResult>;

  abstract resetPassword(data?: any): Observable<TriAuthResult>;

  abstract logout(): Observable<TriAuthResult>;

  abstract refreshToken(data?: any): Observable<TriAuthResult>;

  protected createFailResponse(data?: any): HttpResponse<Object> {
    return new HttpResponse<Object>({ body: {}, status: 401 });
  }

  protected createSuccessResponse(data?: any): HttpResponse<Object> {
    return new HttpResponse<Object>({ body: {}, status: 200 });
  }

  protected getActionEndpoint(action: string): string {
    const actionEndpoint: string = this.getOption(`${action}.endpoint`);
    const baseEndpoint: string = this.getOption('baseEndpoint');
    return actionEndpoint ? baseEndpoint + actionEndpoint : '';
  }

  protected getHeaders(): HttpHeaders {
    const customHeaders: TriAuthStrategyOptions['headers'] =
      this.getOption('headers') ?? {};
    if (customHeaders instanceof HttpHeaders) {
      return customHeaders;
    }

    let headers = new HttpHeaders();
    Object.entries(customHeaders).forEach(([key, value]) => {
      headers = headers.append(key, value);
    });
    return headers;
  }
}
