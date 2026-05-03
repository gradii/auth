/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { inject, Injectable, signal, type Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';

import { TriAuthToken } from './token';
import { TriTokenStorage } from './token-storage';

/**
 * Service that allows you to manage authentication token - get, set, clear and also listen to token changes over time.
 *
 * v1.0.0 — backed by an Angular signal. The `tokenChange` Observable is preserved
 * via `toObservable` rxjs interop so existing rxjs consumers keep working.
 */
@Injectable()
export class TriTokenService {
  protected tokenStorage = inject(TriTokenStorage);

  private readonly _token = signal<TriAuthToken | null>(null);

  /**
   * Reactive token state.
   * @returns {Signal<TriAuthToken | null>}
   */
  readonly token: Signal<TriAuthToken | null> = this._token.asReadonly();

  /**
   * Publishes token when it changes.
   * @returns {Observable<TriAuthToken | null>}
   */
  readonly tokenChange: Observable<TriAuthToken | null> = toObservable(this._token);

  constructor() {
    this.publishStoredToken();
  }

  /**
   * Sets a token into the storage. This method is used by the TriAuthService automatically.
   *
   * @param {TriAuthToken} token
   */
  set(token: TriAuthToken): void {
    this.tokenStorage.set(token);
    this.publishStoredToken();
  }

  /**
   * Returns the current token synchronously.
   * @returns {TriAuthToken | null}
   */
  get(): TriAuthToken | null {
    return this.tokenStorage.get();
  }

  /**
   * Removes the token and publishes the new (empty) token value.
   */
  clear(): void {
    this.tokenStorage.clear();
    this.publishStoredToken();
  }

  protected publishStoredToken(): void {
    this._token.set(this.tokenStorage.get());
  }
}
