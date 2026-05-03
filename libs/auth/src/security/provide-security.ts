/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';

import { TRI_SECURITY_OPTIONS_TOKEN, TriAclOptions } from './security.options';
import { TriAccessChecker } from './services/access-checker.service';
import { TriAclService } from './services/acl.service';

/**
 * Standalone provider for `@gradii/auth` security ACL.
 *
 * Replaces the legacy `TriSecurityModule.forRoot(...)` NgModule API.
 *
 * Usage:
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideTriSecurity({
 *       accessControl: {
 *         guest: { view: '*' },
 *         user: { parent: 'guest', create: 'comments' },
 *       },
 *     }),
 *   ],
 * });
 * ```
 */
export function provideTriSecurity(
  triSecurityOptions?: TriAclOptions,
): EnvironmentProviders {
  const providers: Provider[] = [
    { provide: TRI_SECURITY_OPTIONS_TOKEN, useValue: triSecurityOptions },
    TriAclService,
    TriAccessChecker,
  ];
  return makeEnvironmentProviders(providers);
}
