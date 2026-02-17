/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { Injectable, inject } from '@angular/core';
import {
  TRI_SECURITY_OPTIONS_TOKEN,
  TriAccessControl,
  TriAclOptions,
  TriAclRole,
} from '../security.options';

const shallowObjectClone = (o: any) => ({ ...o });
const shallowArrayClone = (a: any[]) => [...a];
const popParent = (abilities: any) => {
  const parent = abilities['parent'];
  delete abilities['parent'];
  return parent;
};

/**
 * Common acl service.
 */
@Injectable()
export class TriAclService {
  protected settings =
    inject<TriAclOptions>(TRI_SECURITY_OPTIONS_TOKEN, { optional: true })! ??
    {};

  private static readonly ANY_RESOURCE = '*';

  private state: TriAccessControl = {};

  constructor() {
    const settings = this.settings;

    if (settings.accessControl) {
      this.setAccessControl(settings.accessControl);
    }
  }

  /**
   * Set/Reset ACL list
   * @param {TriAccessControl} list
   */
  setAccessControl(list: TriAccessControl) {
    for (const [role, value] of Object.entries(list)) {
      const abilities = shallowObjectClone(value);
      const parent = popParent(abilities);
      this.register(role, parent, abilities);
    }
  }

  /**
   * Register a new role with a list of abilities (permission/resources combinations)
   * @param {string} role
   * @param {string} parent
   * @param {[permission: string]: string|string[]} abilities
   */
  register(
    role: string,
    parent?: string,
    abilities: { [permission: string]: string | string[] } = {}
  ) {
    this.validateRole(role);

    this.state[role] = {
      parent: parent,
    };

    for (const [permission, value] of Object.entries(abilities)) {
      const resources = typeof value === 'string' ? [value] : value;
      this.allow(role, permission, shallowArrayClone(resources));
    }
  }

  /**
   * Allow a permission for specific resources to a role
   * @param {string} role
   * @param {string} permission
   * @param {string | string[]} resource
   */
  allow(role: string, permission: string, resource: string | string[]) {
    this.validateRole(role);

    if (!this.getRole(role)) {
      this.register(role, undefined, {});
    }

    resource = typeof resource === 'string' ? [resource] : resource;

    let resources = shallowArrayClone(this.getRoleResources(role, permission));
    resources = resources.concat(resource);

    this.state[role][permission] = resources.filter(
      (item, pos) => resources.indexOf(item) === pos
    );
  }

  /**
   * Check whether the role has a permission to a resource
   * @param {string} role
   * @param {string} permission
   * @param {string} resource
   * @returns {boolean}
   */
  can(role: string, permission: string, resource: string): boolean {
    this.validateResource(resource);

    const parentRole = this.getRoleParent(role);
    const parentCan =
      parentRole && this.can(this.getRoleParent(role), permission, resource);
    return parentCan || this.exactCan(role, permission, resource);
  }

  private getRole(role: string): TriAclRole {
    return this.state[role];
  }

  private validateRole(role: string) {
    if (!role) {
      throw new Error('TriAclService: role name cannot be empty');
    }
  }

  private validateResource(resource: string) {
    if (!resource || [TriAclService.ANY_RESOURCE].includes(resource)) {
      throw new Error(
        `TriAclService: cannot use empty or bulk '*' resource placeholder with 'can' method`
      );
    }
  }

  private exactCan(role: string, permission: string, resource: string) {
    const resources = this.getRoleResources(role, permission);
    return (
      resources.includes(resource) ||
      resources.includes(TriAclService.ANY_RESOURCE)
    );
  }

  private getRoleResources(role: string, permission: string): string[] {
    return this.getRoleAbilities(role)[permission] || [];
  }

  private getRoleAbilities(role: string): { [permission: string]: string[] } {
    const abilities = shallowObjectClone(this.state[role] || {});
    popParent(shallowObjectClone(this.state[role] || {}));
    return abilities;
  }

  private getRoleParent(role: string): string | undefined {
    return this.state[role] ? this.state[role]['parent'] : undefined;
  }
}
