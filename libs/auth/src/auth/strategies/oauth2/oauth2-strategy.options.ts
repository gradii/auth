/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import {
  TriAuthOAuth2Token,
  TriAuthTokenClass,
} from '../../services/token/token';
import { TriAuthStrategyOptions } from '../auth-strategy-options';

export const enum TriOAuth2ResponseType {
  CODE = 'code',
  TOKEN = 'token',
}

export const enum TriOAuth2GrantType {
  AUTHORIZATION_CODE = 'authorization_code',
  PASSWORD = 'password',
  REFRESH_TOKEN = 'refresh_token',
}

export const enum TriOAuth2ClientAuthMethod {
  NONE = 'none',
  BASIC = 'basic',
  REQUEST_BODY = 'request-body',
}

export class TriOAuth2AuthStrategyOptions extends TriAuthStrategyOptions {
  baseEndpoint?: string = '';
  clientId = '';
  clientSecret?: string = '';
  clientAuthMethod?: string = TriOAuth2ClientAuthMethod.NONE;
  redirect?: { success?: string; failure?: string } = {
    success: '/',
    failure: null,
  };
  defaultErrors?: any[] = ['Something went wrong, please try again.'];
  defaultMessages?: any[] = ['You have been successfully authenticated.'];
  authorize?: {
    endpoint?: string;
    redirectUri?: string;
    responseType?: string;
    requireValidToken?: boolean; // used only with TriOAuth2ResponseType.TOKEN
    scope?: string;
    state?: string;
    params?: { [key: string]: string };
  } = {
    endpoint: 'authorize',
    responseType: TriOAuth2ResponseType.CODE,
    requireValidToken: true,
  };
  override token?: {
    endpoint?: string;
    grantType?: string;
    redirectUri?: string;
    scope?: string; // Used only with 'password' grantType
    requireValidToken?: boolean;
    class: TriAuthTokenClass;
  } = {
    endpoint: 'token',
    grantType: TriOAuth2GrantType.AUTHORIZATION_CODE,
    requireValidToken: true,
    class: TriAuthOAuth2Token,
  };
  refresh?: {
    endpoint?: string;
    grantType?: string;
    scope?: string;
    requireValidToken?: boolean;
  } = {
    endpoint: 'token',
    grantType: TriOAuth2GrantType.REFRESH_TOKEN,
    requireValidToken: true,
  };
}

export const auth2StrategyOptions: TriOAuth2AuthStrategyOptions =
  new TriOAuth2AuthStrategyOptions();
