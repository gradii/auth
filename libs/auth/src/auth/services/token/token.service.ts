/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of as observableOf } from 'rxjs';
import { filter, share } from 'rxjs/operators';

import { TriTokenStorage } from './token-storage';
import { TriAuthToken } from './token';

/**
 * Service that allows you to manage authentication token - get, set, clear and also listen to token changes over time.
 */
@Injectable()
export class TriTokenService {
  protected tokenStorage = inject(TriTokenStorage);

  protected token$: BehaviorSubject<TriAuthToken | null> = new BehaviorSubject<TriAuthToken | null>(
    null
  );

  constructor() {
    this.publishStoredToken();
  }

  /**
   * Publishes token when it changes.
   * @returns {Observable<TriAuthToken>}
   */
  tokenChange(): Observable<TriAuthToken> {
    return this.token$.pipe(
      filter((value) => !!value),
      share()
    );
  }

  /**
   * Sets a token into the storage. This method is used by the TriAuthService automatically.
   *
   * @param {TriAuthToken} token
   * @returns {Observable<any>}
   */
  set(token: TriAuthToken): Observable<null> {
    this.tokenStorage.set(token);
    this.publishStoredToken();
    return observableOf(null);
  }

  /**
   * Returns observable of current token
   * @returns {Observable<TriAuthToken>}
   */
  get(): Observable<TriAuthToken> {
    const token = this.tokenStorage.get();
    return observableOf(token);
  }

  /**
   * Removes the token and published token value
   *
   * @returns {Observable<any>}
   */
  clear(): Observable<null> {
    this.tokenStorage.clear();
    this.publishStoredToken();
    return observableOf(null);
  }

  protected publishStoredToken() {
    this.token$.next(this.tokenStorage.get());
  }
}
