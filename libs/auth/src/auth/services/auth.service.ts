/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { computed, inject, Injectable, type Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of as observableOf } from 'rxjs';
import { finalize, map, shareReplay, switchMap } from 'rxjs/operators';

import { TRI_AUTH_STRATEGIES } from '../auth.options';
import { TriAuthStrategy } from '../strategies/auth-strategy';
import { TriAuthResult } from './auth-result';
import { TriAuthToken } from './token/token';
import { TriTokenService } from './token/token.service';

/**
 * Common authentication service.
 * Should be used to as an interlayer between UI Components and Auth Strategy.
 *
 * v1.0.0 — module-less. State accessors (`token`, `isAuthenticated`) are exposed
 * as Signals. Public action functions (`authenticate`, `register`, `logout`, …)
 * still return rxjs `Observable`. Change streams (`onTokenChange`,
 * `onAuthenticationChange`) are exposed as Observables via `toObservable` interop.
 */
@Injectable()
export class TriAuthService {
  protected tokenService = inject(TriTokenService);
  protected strategies = inject<TriAuthStrategy[]>(TRI_AUTH_STRATEGIES);

  /**
   * Current token signal — null when no token is stored.
   * @returns {Signal<TriAuthToken | null>}
   */
  readonly token: Signal<TriAuthToken | null> = this.tokenService.token;

  /**
   * Reactive authentication state derived from the current token.
   * @returns {Signal<boolean>}
   */
  readonly isAuthenticated: Signal<boolean> = computed(() => {
    const token = this.token();
    return !!token && token.isValid();
  });

  /**
   * Returns tokens stream
   * @returns {Observable<TriAuthToken | null>}
   */
  readonly onTokenChange: Observable<TriAuthToken | null> = this.tokenService.tokenChange;

  /**
   * Returns authentication status stream
   * @returns {Observable<boolean>}
   */
  readonly onAuthenticationChange: Observable<boolean> = toObservable(
    computed(() => {
      const token = this.token();
      return !!token && token.isValid();
    }),
  );

  /**
   * Retrieves current authenticated token stored.
   *
   * Sync helper; equivalent to reading the `token` signal once.
   * @returns {TriAuthToken | null}
   */
  getToken(): TriAuthToken | null {
    return this.tokenService.get();
  }

  /**
   * In-flight refresh request shared across concurrent callers.
   * Cleared by `finalize` once the underlying HTTP refresh completes (success or error).
   */
  private activeRefresh$: Observable<boolean> | null = null;

  /**
   * Returns true if valid auth token is present in the token storage.
   * If not, calls the strategy refreshToken, and returns isAuthenticated() if success, false otherwise.
   *
   * Concurrent calls dedupe: if a refresh is already in-flight, all subsequent callers
   * receive the same shared `Observable<boolean>` until the request settles.
   *
   * @returns {Observable<boolean>}
   */
  isAuthenticatedOrRefresh(): Observable<boolean> {
    const token = this.getToken();
    if (token && token.getValue() && !token.isValid()) {
      // 1. If a refresh is already in progress, return the existing shared observable.
      if (this.activeRefresh$) {
        return this.activeRefresh$;
      }

      // 2. Otherwise, build a new refresh pipeline that…
      this.activeRefresh$ = this.refreshToken(token.getOwnerStrategyName(), token).pipe(
        map((res) => res.isSuccess() && this.isAuthenticated()),
        // 3. clears the in-flight cache once the HTTP request settles (next or error), and
        finalize(() => {
          this.activeRefresh$ = null;
        }),
        // 4. multicasts the execution and replays the last value to late subscribers.
        shareReplay(1),
      );
      return this.activeRefresh$;
    }
    return observableOf(!!token && token.isValid());
  }

  /**
   * Authenticates with the selected strategy
   * Stores received token in the token storage
   *
   * Example:
   * authenticate('email', {email: 'email@example.com', password: 'test'})
   *
   * @param strategyName
   * @param data
   * @returns {Observable<TriAuthResult>}
   */
  authenticate(strategyName: string, data?: any): Observable<TriAuthResult> {
    return this.getStrategy(strategyName)
      .authenticate(data)
      .pipe(switchMap((result: TriAuthResult) => this.processResultToken(result)));
  }

  /**
   * Registers with the selected strategy
   * Stores received token in the token storage
   *
   * Example:
   * register('email', {email: 'email@example.com', name: 'Some Name', password: 'test'})
   *
   * @param strategyName
   * @param data
   * @returns {Observable<TriAuthResult>}
   */
  register(strategyName: string, data?: any): Observable<TriAuthResult> {
    return this.getStrategy(strategyName)
      .register(data)
      .pipe(switchMap((result: TriAuthResult) => this.processResultToken(result)));
  }

  /**
   * Sign outs with the selected strategy
   * Removes token from the token storage
   *
   * Example:
   * logout('email')
   *
   * @param strategyName
   * @returns {Observable<TriAuthResult>}
   */
  logout(strategyName: string): Observable<TriAuthResult> {
    return this.getStrategy(strategyName)
      .logout()
      .pipe(
        map((result: TriAuthResult) => {
          if (result.isSuccess()) {
            this.tokenService.clear();
          }
          return result;
        }),
      );
  }

  /**
   * Sends forgot password request to the selected strategy
   *
   * Example:
   * requestPassword('email', {email: 'email@example.com'})
   *
   * @param strategyName
   * @param data
   * @returns {Observable<TriAuthResult>}
   */
  requestPassword(strategyName: string, data?: any): Observable<TriAuthResult> {
    return this.getStrategy(strategyName).requestPassword(data);
  }

  /**
   * Tries to reset password with the selected strategy
   *
   * Example:
   * resetPassword('email', {newPassword: 'test'})
   *
   * @param strategyName
   * @param data
   * @returns {Observable<TriAuthResult>}
   */
  resetPassword(strategyName: string, data?: any): Observable<TriAuthResult> {
    return this.getStrategy(strategyName).resetPassword(data);
  }

  /**
   * Sends a refresh token request
   * Stores received token in the token storage
   *
   * Example:
   * refreshToken('email', {token: token})
   *
   * @param {string} strategyName
   * @param data
   * @returns {Observable<TriAuthResult>}
   */
  refreshToken(strategyName: string, data?: any): Observable<TriAuthResult> {
    return this.getStrategy(strategyName)
      .refreshToken(data)
      .pipe(switchMap((result: TriAuthResult) => this.processResultToken(result)));
  }

  /**
   * Get registered strategy by name
   *
   * Example:
   * getStrategy('email')
   *
   * @param {string} strategyName
   * @returns {TriAuthStrategy}
   */
  protected getStrategy(strategyName: string): TriAuthStrategy {
    const found = this.strategies.find(
      (strategy: TriAuthStrategy) => strategy.getName() === strategyName,
    );

    if (!found) {
      throw new TypeError(
        `There is no Auth Strategy registered under '${strategyName}' name`,
      );
    }

    return found;
  }

  private processResultToken(result: TriAuthResult): Observable<TriAuthResult> {
    if (result.isSuccess() && result.getToken()) {
      this.tokenService.set(result.getToken()!);
    }

    return observableOf(result);
  }
}
