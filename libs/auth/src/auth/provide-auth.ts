/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { HttpRequest } from '@angular/common/http';
import {
  EnvironmentProviders,
  Injector,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';

import {
  defaultAuthOptions,
  TRI_AUTH_INTERCEPTOR_HEADER,
  TRI_AUTH_OPTIONS,
  TRI_AUTH_STRATEGIES,
  TRI_AUTH_TOKEN_INTERCEPTOR_FILTER,
  TRI_AUTH_TOKENS,
  TRI_AUTH_USER_OPTIONS,
  TriAuthOptions,
  TriAuthStrategyClass,
} from './auth.options';

import { deepExtend } from './helpers';

import { TriAuthService } from './services/auth.service';
import { TriAuthSimpleToken, TriAuthTokenClass } from './services/token/token';
import {
  TRI_AUTH_FALLBACK_TOKEN,
  TriAuthTokenParceler,
} from './services/token/token-parceler';
import {
  TriTokenLocalStorage,
  TriTokenStorage,
} from './services/token/token-storage';
import { TriTokenService } from './services/token/token.service';
import { TriAuthStrategy } from './strategies/auth-strategy';
import { TriAuthStrategyOptions } from './strategies/auth-strategy-options';
import { TriDummyAuthStrategy } from './strategies/dummy/dummy-strategy';
import { TriOAuth2AuthStrategy } from './strategies/oauth2/oauth2-strategy';
import { TriPasswordAuthStrategy } from './strategies/password/password-strategy';

export function strategiesFactory(
  options: TriAuthOptions,
  injector: Injector,
): TriAuthStrategy[] {
  const strategies: TriAuthStrategy[] = [];
  options.strategies!.forEach(
    ([strategyClass, strategyOptions]: [
      TriAuthStrategyClass,
      TriAuthStrategyOptions,
    ]) => {
      const strategy: TriAuthStrategy = injector.get(strategyClass);
      strategy.setOptions(strategyOptions);

      strategies.push(strategy);
    },
  );
  return strategies;
}

export function tokensFactory(
  strategies: TriAuthStrategy[],
): TriAuthTokenClass[] {
  const tokens: TriAuthTokenClass[] = [];
  strategies.forEach((strategy: TriAuthStrategy) => {
    tokens.push(strategy.getOption('token.class'));
  });
  return tokens;
}

export function optionsFactory(options: any) {
  return deepExtend(defaultAuthOptions, options);
}

export function noopInterceptorFilter(req: HttpRequest<any>): boolean {
  return true;
}

/**
 * Standalone provider for `@gradii/auth`.
 *
 * Replaces the legacy `TriAuthModule.forRoot(...)` NgModule API.
 *
 * Usage:
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideTriAuth({
 *       strategies: [
 *         TriPasswordAuthStrategy.setup({ name: 'email' }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
export function provideTriAuth(options: TriAuthOptions): EnvironmentProviders {
  const providers: Provider[] = [
    { provide: TRI_AUTH_USER_OPTIONS, useValue: options },
    {
      provide: TRI_AUTH_OPTIONS,
      useFactory: optionsFactory,
      deps: [TRI_AUTH_USER_OPTIONS],
    },
    {
      provide: TRI_AUTH_STRATEGIES,
      useFactory: strategiesFactory,
      deps: [TRI_AUTH_OPTIONS, Injector],
    },
    {
      provide: TRI_AUTH_TOKENS,
      useFactory: tokensFactory,
      deps: [TRI_AUTH_STRATEGIES],
    },
    { provide: TRI_AUTH_FALLBACK_TOKEN, useValue: TriAuthSimpleToken },
    { provide: TRI_AUTH_INTERCEPTOR_HEADER, useValue: 'Authorization' },
    {
      provide: TRI_AUTH_TOKEN_INTERCEPTOR_FILTER,
      useValue: noopInterceptorFilter,
    },
    { provide: TriTokenStorage, useClass: TriTokenLocalStorage },

    TriAuthTokenParceler,
    TriAuthService,
    TriTokenService,
    TriDummyAuthStrategy,
    TriPasswordAuthStrategy,
    TriOAuth2AuthStrategy,
  ];
  return makeEnvironmentProviders(providers);
}
