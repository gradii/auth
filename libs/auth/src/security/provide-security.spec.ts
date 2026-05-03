/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTriSecurity } from './provide-security';
import { TRI_SECURITY_OPTIONS_TOKEN } from './security.options';
import { TriAccessChecker } from './services/access-checker.service';
import { TriAclService } from './services/acl.service';
import { TriRoleProvider } from './services/role.provider';

class FakeRoleProvider extends TriRoleProvider {
  override getRole(): Signal<string | string[]> {
    return signal('guest');
  }
}

describe('provideTriSecurity', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTriSecurity({
          accessControl: {
            guest: { view: '*' },
          },
        }),
        { provide: TriRoleProvider, useClass: FakeRoleProvider },
      ],
    });
  });

  it('registers TriAclService with the supplied options', () => {
    const acl = TestBed.inject(TriAclService);
    expect(acl).toBeInstanceOf(TriAclService);
    expect(acl.can('guest', 'view', 'something')).toBe(true);
  });

  it('registers TriAccessChecker', () => {
    expect(TestBed.inject(TriAccessChecker)).toBeInstanceOf(TriAccessChecker);
  });

  it('exposes the security options token', () => {
    const options = TestBed.inject(TRI_SECURITY_OPTIONS_TOKEN);
    expect(options.accessControl?.['guest']).toBeDefined();
  });
});
