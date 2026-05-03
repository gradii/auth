/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { TriAuthSimpleToken } from './token';
import { TRI_AUTH_FALLBACK_TOKEN, TriAuthTokenParceler } from './token-parceler';
import { TriTokenLocalStorage, TriTokenStorage } from './token-storage';
import { TriTokenService } from './token.service';
import { TRI_AUTH_TOKENS } from '../../auth.options';

describe('TriTokenService', () => {
  let service: TriTokenService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: TRI_AUTH_FALLBACK_TOKEN, useValue: TriAuthSimpleToken },
        { provide: TRI_AUTH_TOKENS, useValue: [TriAuthSimpleToken] },
        TriAuthTokenParceler,
        { provide: TriTokenStorage, useClass: TriTokenLocalStorage },
        TriTokenService,
      ],
    });
    service = TestBed.inject(TriTokenService);
  });

  it('exposes the token as a Signal', () => {
    expect(typeof service.token).toBe('function');
    // initial published token has empty value
    const initial = service.token();
    expect(initial).toBeTruthy();
    expect(initial!.getValue()).toBe('');
    expect(initial!.isValid()).toBe(false);
  });

  it('updates the signal when set() is called', () => {
    const token = new TriAuthSimpleToken('abc.def', 'email', new Date());
    service.set(token);

    expect(service.token()!.getValue()).toBe('abc.def');
    expect(service.token()!.isValid()).toBe(true);
    expect(service.get()!.getValue()).toBe('abc.def');
  });

  it('clears the token from storage and signal', () => {
    service.set(new TriAuthSimpleToken('xyz', 'email'));
    expect(service.token()!.isValid()).toBe(true);

    service.clear();
    expect(service.token()!.getValue()).toBe('');
    expect(service.token()!.isValid()).toBe(false);
  });
});
