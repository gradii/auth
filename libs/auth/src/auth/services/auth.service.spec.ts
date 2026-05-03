/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideTriAuth } from '../provide-auth';
import { TriDummyAuthStrategy } from '../strategies/dummy/dummy-strategy';
import { TriAuthResult } from './auth-result';
import { TriAuthService } from './auth.service';
import { TriAuthSimpleToken, type TriAuthToken } from './token/token';
import { TriTokenService } from './token/token.service';

describe('TriAuthService', () => {
  let service: TriAuthService;
  let tokenService: TriTokenService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideTriAuth({
          strategies: [
            TriDummyAuthStrategy.setup({
              name: 'dummy',
              delay: 0,
            }),
          ],
        }),
      ],
    });
    service = TestBed.inject(TriAuthService);
    tokenService = TestBed.inject(TriTokenService);
  });

  it('exposes the current token as a Signal', () => {
    expect(typeof service.token).toBe('function');
    expect(service.token()!.isValid()).toBe(false);
  });

  it('exposes isAuthenticated as a derived Signal', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('authenticate() returns an Observable<TriAuthResult> and stores the token', async () => {
    const result = await firstValueFrom(service.authenticate('dummy'));

    expect(result.isSuccess()).toBe(true);
    expect(result.getToken()!.getValue()).toBe('test token');
    expect(service.token()!.getValue()).toBe('test token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('logout() clears the stored token', async () => {
    await firstValueFrom(service.authenticate('dummy'));
    expect(service.isAuthenticated()).toBe(true);

    const result = await firstValueFrom(service.logout('dummy'));
    expect(result.isSuccess()).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(tokenService.get()!.isValid()).toBe(false);
  });

  it('isAuthenticatedOrRefresh() resolves false when no valid token', async () => {
    expect(await firstValueFrom(service.isAuthenticatedOrRefresh())).toBe(false);
  });

  it('throws when authenticating against an unknown strategy', () => {
    expect(() => service.authenticate('does-not-exist')).toThrow(TypeError);
  });

  it('isAuthenticatedOrRefresh() dedupes concurrent refreshes via shareReplay/finalize', async () => {
    const expiredToken = {
      getValue: () => 'expired-value',
      isValid: () => false,
      getOwnerStrategyName: () => 'dummy',
    } as TriAuthToken;
    vi.spyOn(service, 'getToken').mockReturnValue(expiredToken);

    const refreshedToken = new TriAuthSimpleToken('fresh-value', 'dummy');
    const refreshSpy = vi
      .spyOn(service, 'refreshToken')
      .mockReturnValue(
        of(new TriAuthResult(true, null, null, [], [], refreshedToken)).pipe(delay(20)),
      );

    const [a, b, c] = await Promise.all([
      firstValueFrom(service.isAuthenticatedOrRefresh()),
      firstValueFrom(service.isAuthenticatedOrRefresh()),
      firstValueFrom(service.isAuthenticatedOrRefresh()),
    ]);

    // strategy.refreshToken should have been triggered exactly once for the three concurrent calls
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    // all callers receive the same boolean
    expect([a, b, c]).toEqual([a, a, a]);

    // after the in-flight refresh has settled, a follow-up call rebuilds the pipeline
    await firstValueFrom(service.isAuthenticatedOrRefresh());
    expect(refreshSpy).toHaveBeenCalledTimes(2);
  });
});
