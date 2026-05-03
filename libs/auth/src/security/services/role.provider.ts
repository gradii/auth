/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import type { Signal } from '@angular/core';

export abstract class TriRoleProvider {

  /**
   * Returns current user role
   * @returns {Signal<string | string[]>}
   */
  abstract getRole(): Signal<string | string[]>;
}
