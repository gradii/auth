/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { TRI_SECURITY_OPTIONS_TOKEN } from '../security.options';
import { TriAccessChecker } from './access-checker.service';
import { TriAclService } from './acl.service';
import { TriRoleProvider } from './role.provider';

class FakeRoleProvider extends TriRoleProvider {
  readonly role = signal<string | string[]>('guest');
  override getRole(): Signal<string | string[]> {
    return this.role;
  }
}

describe('TriAccessChecker', () => {
  let checker: TriAccessChecker;
  let roleProvider: FakeRoleProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TRI_SECURITY_OPTIONS_TOKEN,
          useValue: {
            accessControl: {
              guest: { view: '*' },
              user: { parent: 'guest', create: 'comments' },
            },
          },
        },
        TriAclService,
        { provide: TriRoleProvider, useClass: FakeRoleProvider },
        TriAccessChecker,
      ],
    });
    checker = TestBed.inject(TriAccessChecker);
    roleProvider = TestBed.inject(TriRoleProvider) as FakeRoleProvider;
  });

  it('returns a Signal that reflects ACL for the current role', () => {
    const canCreate = checker.isGranted('create', 'comments');
    expect(typeof canCreate).toBe('function');
    expect(canCreate()).toBe(false);

    roleProvider.role.set('user');
    expect(canCreate()).toBe(true);
  });

  it('reacts to role changes from a single role to multiple roles', () => {
    const canRemove = checker.isGranted('remove', 'posts');
    expect(canRemove()).toBe(false);

    roleProvider.role.set(['guest', 'user']);
    expect(canRemove()).toBe(false);

    roleProvider.role.set(['guest', 'user', 'admin']);
    // admin not declared in ACL → still false; this asserts the array-handling path
    expect(canRemove()).toBe(false);
  });

  it('honors wildcard resources via the parent chain', () => {
    const canView = checker.isGranted('view', 'anything');
    roleProvider.role.set('user');
    expect(canView()).toBe(true);
  });
});
