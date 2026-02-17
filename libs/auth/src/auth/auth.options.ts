/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { HttpRequest } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import { TriAuthToken, TriAuthTokenClass } from './services/token/token';
import { TriAuthStrategy } from './strategies/auth-strategy';
import { TriAuthStrategyOptions } from './strategies/auth-strategy-options';

export type TriAuthStrategyClass = new (...params: any[]) => TriAuthStrategy;

export type TriAuthStrategies = [TriAuthStrategyClass, TriAuthStrategyOptions][];

export interface TriAuthOptions {
  forms?: any;
  strategies?: TriAuthStrategies;
  storageKey?: string
}

export interface TriAuthSocialLink {
  link?: string;
  url?: string;
  target?: string;
  title?: string;
  icon?: string;
}

const socialLinks: TriAuthSocialLink[] = [];

export const defaultAuthOptions: any = {
  strategies: [],
  forms     : {
    login          : {
      redirectDelay: 500, // delay before redirect after a successful login, while success message is shown to the user
      strategy     : 'email',  // provider id key. If you have multiple strategies, or what to use your own
      rememberMe   : true,   // whether to show or not the `rememberMe` checkbox
      showMessages : {     // show/not show success/error messages
        success: true,
        error  : true,
      },
      socialLinks  : socialLinks, // social links at the bottom of a page
    },
    register       : {
      redirectDelay: 500,
      strategy     : 'email',
      showMessages : {
        success: true,
        error  : true,
      },
      terms        : true,
      socialLinks  : socialLinks,
    },
    requestPassword: {
      redirectDelay: 500,
      strategy     : 'email',
      showMessages : {
        success: true,
        error  : true,
      },
      socialLinks  : socialLinks,
    },
    resetPassword  : {
      redirectDelay: 500,
      strategy     : 'email',
      showMessages : {
        success: true,
        error  : true,
      },
      socialLinks  : socialLinks,
    },
    logout         : {
      redirectDelay: 500,
      strategy     : 'email',
    },
    validation     : {
      password: {
        required : true,
        minLength: 4,
        maxLength: 50,
      },
      email   : {
        required: true,
      },
      fullName: {
        required : false,
        minLength: 4,
        maxLength: 50,
      },
    },
  },
};

export const TRI_AUTH_OPTIONS = new InjectionToken<TriAuthOptions>('Auth Options');

export const TRI_AUTH_USER_OPTIONS =
               new InjectionToken<TriAuthOptions>('Nebular User Auth Options');

export const TRI_AUTH_STRATEGIES = new InjectionToken<TriAuthStrategies>('Auth Strategies');

export const TRI_AUTH_TOKENS = new InjectionToken<TriAuthTokenClass<TriAuthToken>[]>('Auth Tokens');

export const TRI_AUTH_INTERCEPTOR_HEADER = new InjectionToken<string>('Simple Interceptor Header');

export const TRI_AUTH_TOKEN_INTERCEPTOR_FILTER =
               new InjectionToken<(req: HttpRequest<any>) => boolean>('Interceptor Filter');

export const TRI_AUTH_TOKEN_LOCAL_STORAGE_KEY = new InjectionToken<string>('auth token local storage key')