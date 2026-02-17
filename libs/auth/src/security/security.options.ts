/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { InjectionToken } from '@angular/core';

export interface TriAclRole {
  parent?: string;
  [permission: string]: string|string[]|undefined;
}

export interface TriAccessControl {
  [role: string]: TriAclRole;
}

export interface TriAclOptions {
  accessControl?: TriAccessControl;
}

export const TRI_SECURITY_OPTIONS_TOKEN = new InjectionToken<TriAclOptions>('Nebular Security Options');
