/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */


import { Injectable, inject } from '@angular/core';
import { TriRoleProvider } from './role.provider';
import { TriAclService } from './acl.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Access checker service.
 *
 * Injects `NbRoleProvider` to determine current user role, and checks access permissions using `TriAclService`
 */
@Injectable()
export class TriAccessChecker {
  protected roleProvider = inject(TriRoleProvider);
  protected acl = inject(TriAclService);

  /**
   * Checks whether access is granted or not
   *
   * @param {string} permission
   * @param {string} resource
   * @returns {Observable<boolean>}
   */
  isGranted(permission: string, resource: string): Observable<boolean> {
    return this.roleProvider.getRole().pipe(
      map((role: string | string[]) => (Array.isArray(role) ? role : [role])),
      map((roles: string[]) => {
        return roles.some((role) => this.acl.can(role, permission, resource));
      })
    );
  }
}
