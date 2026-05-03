/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { Injectable, inject } from '@angular/core';
import { TRI_AUTH_TOKEN_LOCAL_STORAGE_KEY } from '../../auth.options';

import { TriAuthToken } from './token';
import { TriAuthTokenParceler } from './token-parceler';

export abstract class TriTokenStorage {
  abstract get(): TriAuthToken;

  abstract set(token: TriAuthToken): void;

  abstract clear(): void;
}

/**
 * Service that uses browser localStorage as a storage.
 *
 * The token storage is provided into auth module the following way:
 * ```ts
 * { provide: TriTokenStorage, useClass: TriTokenLocalStorage },
 * ```
 *
 * If you need to change the storage behaviour or provide your own - just extend your class from basic `TriTokenStorage`
 * or `TriTokenLocalStorage` and provide in your `app.module`:
 * ```ts
 * { provide: TriTokenStorage, useClass: TriTokenCustomStorage },
 * ```
 *
 */
@Injectable()
export class TriTokenLocalStorage extends TriTokenStorage {
  protected key = inject(TRI_AUTH_TOKEN_LOCAL_STORAGE_KEY, { optional: true }) ?? 'auth_app_token';
  private parceler = inject(TriAuthTokenParceler);

  /**
   * Returns token from localStorage
   * @returns {TriAuthToken}
   */
  get(): TriAuthToken {
    const raw = localStorage.getItem(this.key);
    return this.parceler.unwrap(raw);
  }

  /**
   * Sets token to localStorage
   * @param {TriAuthToken} token
   */
  set(token: TriAuthToken) {
    const raw = this.parceler.wrap(token);
    localStorage.setItem(this.key, raw);
  }

  /**
   * Clears token from localStorage
   */
  clear() {
    localStorage.removeItem(this.key);
  }
}
