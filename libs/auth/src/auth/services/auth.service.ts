/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { Injectable, inject } from '@angular/core';

import { Observable, of as observableOf } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

import { TriAuthStrategy } from '../strategies/auth-strategy';
import { TRI_AUTH_STRATEGIES } from '../auth.options';
import { TriAuthResult } from './auth-result';
import { TriTokenService } from './token/token.service';
import { TriAuthToken } from './token/token';

/**
 * Common authentication service.
 * Should be used to as an interlayer between UI Components and Auth Strategy.
 */
@Injectable()
export class TriAuthService {
  protected tokenService = inject(TriTokenService);
  protected strategies = inject<TriAuthStrategy[]>(TRI_AUTH_STRATEGIES);

  /**
   * Retrieves current authenticated token stored
   * @returns {Observable<any>}
   */
  getToken(): Observable<TriAuthToken> {
    return this.tokenService.get();
  }

  /**
   * Returns true if auth token is present in the token storage
   * @returns {Observable<boolean>}
   */
  isAuthenticated(): Observable<boolean> {
    return this.getToken().pipe(map((token: TriAuthToken) => token.isValid()));
  }

  /**
   * Returns true if valid auth token is present in the token storage.
   * If not, calls the strategy refreshToken, and returns isAuthenticated() if success, false otherwise
   * @returns {Observable<boolean>}
   */
  isAuthenticatedOrRefresh(): Observable<boolean> {
    return this.getToken().pipe(
      switchMap((token) => {
        if (token.getValue() && !token.isValid()) {
          return this.refreshToken(token.getOwnerStrategyName(), token).pipe(
            switchMap((res) => {
              if (res.isSuccess()) {
                return this.isAuthenticated();
              } else {
                return observableOf(false);
              }
            })
          );
        } else {
          return observableOf(token.isValid());
        }
      })
    );
  }

  /**
   * Returns tokens stream
   * @returns {Observable<TriAuthSimpleToken>}
   */
  onTokenChange(): Observable<TriAuthToken> {
    return this.tokenService.tokenChange();
  }

  /**
   * Returns authentication status stream
   * @returns {Observable<boolean>}
   */
  onAuthenticationChange(): Observable<boolean> {
    return this.onTokenChange().pipe(
      map((token: TriAuthToken) => token.isValid())
    );
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
      .pipe(
        switchMap((result: TriAuthResult) => {
          return this.processResultToken(result);
        })
      );
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
      .pipe(
        switchMap((result: TriAuthResult) => {
          return this.processResultToken(result);
        })
      );
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
        switchMap((result: TriAuthResult) => {
          if (result.isSuccess()) {
            this.tokenService.clear().pipe(map(() => result));
          }
          return observableOf(result);
        })
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
      .pipe(
        switchMap((result: TriAuthResult) => {
          return this.processResultToken(result);
        })
      );
  }

  /**
   * Get registered strategy by name
   *
   * Example:
   * getStrategy('email')
   *
   * @param {string} provider
   * @returns {TriAbstractAuthProvider}
   */
  protected getStrategy(strategyName: string): TriAuthStrategy {
    const found = this.strategies.find(
      (strategy: TriAuthStrategy) => strategy.getName() === strategyName
    );

    if (!found) {
      throw new TypeError(
        `There is no Auth Strategy registered under '${strategyName}' name`
      );
    }

    return found;
  }

  private processResultToken(result: TriAuthResult) {
    if (result.isSuccess() && result.getToken()) {
      return this.tokenService.set(result.getToken()!).pipe(
        map((token: TriAuthToken | null) => {
          return result;
        })
      );
    }

    return observableOf(result);
  }
}
