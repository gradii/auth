/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */


import { computed, inject, Injectable, type Signal } from '@angular/core';
import { TriAclService } from './acl.service';
import { TriRoleProvider } from './role.provider';

/**
 * Access checker service.
 *
 * Injects `TriRoleProvider` to determine current user role, and checks access permissions using `TriAclService`.
 *
 * v1.0.0 — Signal-based API.
 */
@Injectable()
export class TriAccessChecker {
  protected roleProvider = inject(TriRoleProvider);
  protected acl = inject(TriAclService);

  /**
   * Checks whether access is granted or not.
   *
   * Returns a reactive {@link Signal} — recomputes whenever the user's role changes.
   *
   * @param {string} permission
   * @param {string} resource
   * @returns {Signal<boolean>}
   */
  isGranted(permission: string, resource: string): Signal<boolean> {
    const role$ = this.roleProvider.getRole();
    return computed(() => {
      const role = role$();
      const roles = Array.isArray(role) ? role : [role];
      return roles.some((r) => this.acl.can(r, permission, resource));
    });
  }
}
