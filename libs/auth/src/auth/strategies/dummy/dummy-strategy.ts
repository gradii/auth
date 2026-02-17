/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { Injectable } from '@angular/core';

import { Observable, of as observableOf } from 'rxjs';
import { delay } from 'rxjs/operators';

import { TriAuthStrategy } from '../auth-strategy';
import { TriAuthResult } from '../../services/auth-result';
import { TriDummyAuthStrategyOptions, dummyStrategyOptions } from './dummy-strategy-options';
import { TriAuthStrategyClass } from '../../auth.options';


/**
 * Dummy auth strategy. Could be useful for auth setup when backend is not available yet.
 *
 *
 * Strategy settings.
 *
 * ```ts
 * export class TriDummyAuthStrategyOptions extends TriAuthStrategyOptions {
 *   name = 'dummy';
 *   token = {
 *     class: TriAuthSimpleToken,
 *   };
 *   delay? = 1000;
 *   alwaysFail? = false;
 * }
 * ```
 */
@Injectable()
export class TriDummyAuthStrategy extends TriAuthStrategy {

  protected override defaultOptions: TriDummyAuthStrategyOptions = dummyStrategyOptions;

  static setup(options: TriDummyAuthStrategyOptions): [TriAuthStrategyClass, TriDummyAuthStrategyOptions] {
    return [TriDummyAuthStrategy, options];
  }

  authenticate(data?: any): Observable<TriAuthResult> {
    return observableOf(this.createDummyResult(data))
      .pipe(
        delay(this.getOption('delay')),
      );
  }

  register(data?: any): Observable<TriAuthResult> {
    return observableOf(this.createDummyResult(data))
      .pipe(
        delay(this.getOption('delay')),
      );
  }

  requestPassword(data?: any): Observable<TriAuthResult> {
    return observableOf(this.createDummyResult(data))
      .pipe(
        delay(this.getOption('delay')),
      );
  }

  resetPassword(data?: any): Observable<TriAuthResult> {
    return observableOf(this.createDummyResult(data))
      .pipe(
        delay(this.getOption('delay')),
      );
  }

  logout(data?: any): Observable<TriAuthResult> {
    return observableOf(this.createDummyResult(data))
      .pipe(
        delay(this.getOption('delay')),
      );
  }

  refreshToken(data?: any): Observable<TriAuthResult> {
    return observableOf(this.createDummyResult(data))
      .pipe(
        delay(this.getOption('delay')),
      );
  }

  protected createDummyResult(data?: any): TriAuthResult {

    if (this.getOption('alwaysFail')) {
      return new TriAuthResult(
        false,
        this.createFailResponse(data),
        null,
        ['Something went wrong.'],
      );
    }

    try {
      const token = this.createToken('test token', true);
      return new TriAuthResult(
        true,
        this.createSuccessResponse(data),
        '/',
        [],
        ['Successfully logged in.'],
        token,
      );
    } catch (err: any) {
      return new TriAuthResult(
        false,
        this.createFailResponse(data),
        null,
        [err.message],
      );
    }


  }
}
