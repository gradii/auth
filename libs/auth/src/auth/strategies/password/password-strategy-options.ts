/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { getDeepFromObject } from '../../helpers';
import {
  TriAuthSimpleToken,
  TriAuthTokenClass,
} from '../../services/token/token';
import { TriAuthStrategyOptions } from '../auth-strategy-options';

export interface TriPasswordStrategyModule {
  alwaysFail?: boolean;
  endpoint?: string;
  method?: string;
  redirect?: {
    success?: string | null;
    failure?: string | null;
  };
  requireValidToken?: boolean;
  defaultErrors?: string[];
  defaultMessages?: string[];
}

export interface TriPasswordStrategyReset extends TriPasswordStrategyModule {
  resetPasswordTokenKey?: string;
}

export interface TriPasswordStrategyToken {
  class?: TriAuthTokenClass;
  key?: string;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  getter?: Function;
}

export interface TriPasswordStrategyMessage {
  key?: string;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  getter?: Function;
}

export class TriPasswordAuthStrategyOptions extends TriAuthStrategyOptions {
  baseEndpoint?: string = '/api/auth/';
  login?: boolean | TriPasswordStrategyModule = {
    alwaysFail: false,
    endpoint: 'login',
    method: 'post',
    requireValidToken: true,
    redirect: {
      success: '/',
      failure: null,
    },
    defaultErrors: [
      'Login/Email combination is not correct, please try again.',
    ],
    defaultMessages: ['You have been successfully logged in.'],
  };
  register?: boolean | TriPasswordStrategyModule = {
    alwaysFail: false,
    endpoint: 'register',
    method: 'post',
    requireValidToken: true,
    redirect: {
      success: '/',
      failure: null,
    },
    defaultErrors: ['Something went wrong, please try again.'],
    defaultMessages: ['You have been successfully registered.'],
  };
  requestPass?: boolean | TriPasswordStrategyModule = {
    endpoint: 'request-pass',
    method: 'post',
    redirect: {
      success: '/',
      failure: null,
    },
    defaultErrors: ['Something went wrong, please try again.'],
    defaultMessages: [
      'Reset password instructions have been sent to your email.',
    ],
  };
  resetPass?: boolean | TriPasswordStrategyReset = {
    endpoint: 'reset-pass',
    method: 'put',
    redirect: {
      success: '/',
      failure: null,
    },
    resetPasswordTokenKey: 'reset_password_token',
    defaultErrors: ['Something went wrong, please try again.'],
    defaultMessages: ['Your password has been successfully changed.'],
  };
  logout?: boolean | TriPasswordStrategyReset = {
    alwaysFail: false,
    endpoint: 'logout',
    method: 'delete',
    redirect: {
      success: '/',
      failure: null,
    },
    defaultErrors: ['Something went wrong, please try again.'],
    defaultMessages: ['You have been successfully logged out.'],
  };
  refreshToken?: boolean | TriPasswordStrategyModule = {
    endpoint: 'refresh-token',
    method: 'post',
    requireValidToken: true,
    redirect: {
      success: null,
      failure: null,
    },
    defaultErrors: ['Something went wrong, please try again.'],
    defaultMessages: ['Your token has been successfully refreshed.'],
  };
  override token?: TriPasswordStrategyToken = {
    class: TriAuthSimpleToken,
    key: 'data.token',
    getter: (
      module: string,
      res: HttpResponse<object>,
      options: TriPasswordAuthStrategyOptions
    ) => getDeepFromObject(res.body, options.token.key),
  };
  errors?: TriPasswordStrategyMessage = {
    key: 'data.errors',
    getter: (
      module: keyof TriPasswordAuthStrategyOptions,
      res: HttpErrorResponse,
      options: TriPasswordAuthStrategyOptions
    ) =>
      getDeepFromObject(
        res.error,
        options.errors.key,
        (options[module] as TriPasswordStrategyModule).defaultErrors
      ),
  };
  messages?: TriPasswordStrategyMessage = {
    key: 'data.messages',
    getter: (
      module: keyof TriPasswordAuthStrategyOptions,
      res: HttpResponse<object>,
      options: TriPasswordAuthStrategyOptions
    ) =>
      getDeepFromObject(
        res.body,
        options.messages.key,
        (options[module] as TriPasswordStrategyModule).defaultMessages
      ),
  };
  validation?: {
    password?: {
      required?: boolean;
      minLength?: number | null;
      maxLength?: number | null;
      regexp?: string | null;
    };
    email?: {
      required?: boolean;
      regexp?: string | null;
    };
    fullName?: {
      required?: boolean;
      minLength?: number | null;
      maxLength?: number | null;
      regexp?: string | null;
    };
  };
}

export const passwordStrategyOptions: TriPasswordAuthStrategyOptions =
  new TriPasswordAuthStrategyOptions();
