/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */


import { Observable } from 'rxjs';

export abstract class TriRoleProvider {

  /**
   * Returns current user role
   * @returns {Observable<string | string[]>}
   */
  abstract getRole(): Observable<string|string[]>;
}
