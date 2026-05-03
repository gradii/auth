/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { TRI_SECURITY_OPTIONS_TOKEN } from '../security.options';
import { TriAclService } from './acl.service';

describe('TriAclService', () => {
  let acl: TriAclService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TRI_SECURITY_OPTIONS_TOKEN,
          useValue: {
            accessControl: {
              guest: { view: '*' },
              user: { parent: 'guest', create: 'comments' },
              admin: { parent: 'user', remove: ['posts', 'comments'] },
            },
          },
        },
        TriAclService,
      ],
    });
    acl = TestBed.inject(TriAclService);
  });

  it('grants permissions declared on a role', () => {
    expect(acl.can('user', 'create', 'comments')).toBe(true);
  });

  it('grants permissions inherited from a parent role', () => {
    expect(acl.can('user', 'view', 'anything')).toBe(true);
    expect(acl.can('admin', 'view', 'anything')).toBe(true);
    expect(acl.can('admin', 'create', 'comments')).toBe(true);
  });

  it('denies permissions a role does not have', () => {
    expect(acl.can('guest', 'create', 'comments')).toBe(false);
    expect(acl.can('user', 'remove', 'posts')).toBe(false);
  });

  it('supports adding new abilities at runtime via allow()', () => {
    acl.allow('editor', 'edit', 'posts');
    expect(acl.can('editor', 'edit', 'posts')).toBe(true);
    expect(acl.can('editor', 'edit', 'comments')).toBe(false);
  });

  it('rejects empty/bulk resource placeholders on can()', () => {
    expect(() => acl.can('user', 'create', '*')).toThrow();
    expect(() => acl.can('user', 'create', '')).toThrow();
  });
});
