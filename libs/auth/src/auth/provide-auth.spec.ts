/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  TRI_AUTH_INTERCEPTOR_HEADER,
  TRI_AUTH_OPTIONS,
  TRI_AUTH_STRATEGIES,
  TRI_AUTH_TOKENS,
  TRI_AUTH_TOKEN_INTERCEPTOR_FILTER,
} from './auth.options';
import { provideTriAuth } from './provide-auth';
import { TriAuthService } from './services/auth.service';
import { TRI_AUTH_FALLBACK_TOKEN } from './services/token/token-parceler';
import { TriTokenStorage } from './services/token/token-storage';
import { TriTokenService } from './services/token/token.service';
import { TriDummyAuthStrategy } from './strategies/dummy/dummy-strategy';
import type { TriAuthStrategy } from './strategies/auth-strategy';

describe('provideTriAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideTriAuth({
          strategies: [TriDummyAuthStrategy.setup({ name: 'dummy', delay: 0 })],
        }),
      ],
    });
  });

  it('registers all core auth services and tokens', () => {
    expect(TestBed.inject(TriAuthService)).toBeInstanceOf(TriAuthService);
    expect(TestBed.inject(TriTokenService)).toBeInstanceOf(TriTokenService);
    expect(TestBed.inject(TriTokenStorage)).toBeTruthy();
    expect(TestBed.inject(TRI_AUTH_FALLBACK_TOKEN)).toBeTruthy();
    expect(TestBed.inject(TRI_AUTH_INTERCEPTOR_HEADER)).toBe('Authorization');
    expect(typeof TestBed.inject(TRI_AUTH_TOKEN_INTERCEPTOR_FILTER)).toBe('function');
  });

  it('merges user options with defaultAuthOptions', () => {
    const options = TestBed.inject(TRI_AUTH_OPTIONS);
    expect(options.strategies?.length).toBe(1);
    expect(options.forms).toBeDefined();
  });

  it('builds strategy instances from setup() tuples', () => {
    const strategies = TestBed.inject(TRI_AUTH_STRATEGIES) as unknown as TriAuthStrategy[];
    expect(strategies.length).toBe(1);
    expect(strategies[0]).toBeInstanceOf(TriDummyAuthStrategy);
    expect(strategies[0].getName()).toBe('dummy');
  });

  it('collects token classes from registered strategies', () => {
    const tokens = TestBed.inject(TRI_AUTH_TOKENS);
    expect(tokens.length).toBe(1);
    expect(typeof tokens[0]).toBe('function');
  });
});
