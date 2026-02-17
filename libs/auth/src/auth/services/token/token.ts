/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { urlBase64Decode } from '../../helpers';

export abstract class TriAuthToken {
  protected payload: any = null;

  abstract getValue(): string;

  abstract isValid(): boolean;

  // the strategy name used to acquire this token (needed for refreshing token)
  abstract getOwnerStrategyName(): string;

  abstract getCreatedAt(): Date | null;

  abstract toString(): string;

  getName(): string {
    return (this.constructor as TriAuthTokenClass).NAME;
  }

  getPayload(): any {
    return this.payload;
  }
}

export class TriAuthTokenNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TriAuthIllegalTokenError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TriAuthEmptyTokenError extends TriAuthIllegalTokenError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TriAuthIllegalJWTTokenError extends TriAuthIllegalTokenError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface TriAuthRefreshableToken {
  getRefreshToken(): string;

  setRefreshToken(refreshToken: string): void;
}

export interface TriAuthTokenClass<T = TriAuthToken> {
  NAME: string;

  new (raw: any, strategyName: string, expDate?: Date): T;
}

export function triAuthCreateToken<T extends TriAuthToken>(
  tokenClass: TriAuthTokenClass<T>,
  token: any,
  ownerStrategyName: string,
  createdAt?: Date
) {
  return new tokenClass(token, ownerStrategyName, createdAt);
}

export function decodeJwtPayload(payload: string): any {
  if (payload.length === 0) {
    throw new TriAuthEmptyTokenError('Cannot extract from an empty payload.');
  }

  const parts = payload.split('.');

  if (parts.length !== 3) {
    throw new TriAuthIllegalJWTTokenError(
      `The payload ${payload} is not valid JWT payload and must consist of three parts.`
    );
  }

  let decoded: string;
  try {
    decoded = urlBase64Decode(parts[1]);
  } catch (e) {
    throw new TriAuthIllegalJWTTokenError(
      `The payload ${payload} is not valid JWT payload and cannot be parsed.`
    );
  }

  if (!decoded) {
    throw new TriAuthIllegalJWTTokenError(
      `The payload ${payload} is not valid JWT payload and cannot be decoded.`
    );
  }
  return JSON.parse(decoded) as any;
}

/**
 * Wrapper for simple (text) token
 */
export class TriAuthSimpleToken extends TriAuthToken {
  static NAME = 'tri:auth:simple:token';

  protected createdAt: Date;

  constructor(
    protected readonly token: any,
    protected readonly ownerStrategyName: string,
    createdAt?: Date
  ) {
    super();
    try {
      this.parsePayload();
    } catch (err) {
      if (!(err instanceof TriAuthTokenNotFoundError)) {
        // token is present but has got a problem, including illegal
        throw err;
      }
    }
    this.createdAt = this.prepareCreatedAt(createdAt);
  }

  protected parsePayload(): any {
    this.payload = null;
  }

  protected prepareCreatedAt(date: Date) {
    return date ? date : new Date();
  }

  /**
   * Returns the token's creation date
   * @returns {Date}
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Returns the token value
   * @returns string
   */
  getValue(): string {
    return this.token;
  }

  getOwnerStrategyName(): string {
    return this.ownerStrategyName;
  }

  /**
   * Is non empty and valid
   * @returns {boolean}
   */
  isValid(): boolean {
    return !!this.getValue();
  }

  /**
   * Validate value and convert to string, if value is not valid return empty string
   * @returns {string}
   */
  toString(): string {
    return !!this.token ? this.token : '';
  }
}

/**
 * Wrapper for JWT token with additional methods.
 */
export class TriAuthJWTToken extends TriAuthSimpleToken {
  static override NAME = 'tri:auth:jwt:token';

  /**
   * for JWT token, the iat (issued at) field of the token payload contains the creation Date
   */
  protected override prepareCreatedAt(date: Date) {
    const decoded = this.getPayload();
    return decoded && decoded.iat
      ? new Date(Number(decoded.iat) * 1000)
      : super.prepareCreatedAt(date);
  }

  /**
   * Returns payload object
   * @returns any
   */
  protected override parsePayload(): void {
    if (!this.token) {
      throw new TriAuthTokenNotFoundError('Token not found. ');
    }
    this.payload = decodeJwtPayload(this.token);
  }

  /**
   * Returns expiration date
   * @returns Date
   */
  getTokenExpDate(): Date | null {
    const decoded = this.getPayload();
    if (decoded && !decoded.hasOwnProperty('exp')) {
      return null;
    }
    const date = new Date(0);
    date.setUTCSeconds(decoded.exp); // 'cause jwt token are set in seconds
    return date;
  }

  /**
   * Is data expired
   * @returns {boolean}
   */
  override isValid(): boolean {
    return (
      super.isValid() &&
      (!this.getTokenExpDate() || new Date() < this.getTokenExpDate()!)
    );
  }
}

const prepareOAuth2Token = (data: string | any) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as any;
    } catch (e) {}
  }
  return data;
};

/**
 * Wrapper for OAuth2 token whose access_token is a JWT Token
 */
export class TriAuthOAuth2Token extends TriAuthSimpleToken {
  static override NAME = 'tri:auth:oauth2:token';

  constructor(
    data: { [key: string]: string | number } | string = {},
    ownerStrategyName: string,
    createdAt?: Date
  ) {
    // we may get it as string when retrieving from a storage
    super(prepareOAuth2Token(data), ownerStrategyName, createdAt);
  }

  /**
   * Returns the token value
   * @returns string
   */
  override getValue(): string {
    return this.token.access_token;
  }

  /**
   * Returns the refresh token
   * @returns string
   */
  getRefreshToken(): string {
    return this.token.refresh_token;
  }

  /**
   *  put refreshToken in the token payload
   * @param refreshToken
   */
  setRefreshToken(refreshToken: string) {
    this.token.refresh_token = refreshToken;
  }

  /**
   * Parses token payload
   * @returns any
   */
  protected override parsePayload(): void {
    if (!this.token) {
      throw new TriAuthTokenNotFoundError('Token not found.');
    } else {
      if (!Object.keys(this.token).length) {
        throw new TriAuthEmptyTokenError(
          'Cannot extract payload from an empty token.'
        );
      }
    }
    this.payload = this.token;
  }

  /**
   * Returns the token type
   * @returns string
   */
  getType(): string {
    return this.token.token_type;
  }

  /**
   * Is data expired
   * @returns {boolean}
   */
  override isValid(): boolean {
    return (
      super.isValid() &&
      (!this.getTokenExpDate() || new Date() < this.getTokenExpDate())
    );
  }

  /**
   * Returns expiration date
   * @returns Date
   */
  getTokenExpDate(): Date | null {
    if (!this.token.hasOwnProperty('expires_in')) {
      return null;
    }
    return new Date(
      this.createdAt.getTime() + Number(this.token.expires_in) * 1000
    );
  }

  /**
   * Convert to string
   * @returns {string}
   */
  override toString(): string {
    return JSON.stringify(this.token);
  }
}

/**
 * Wrapper for OAuth2 token embedding JWT tokens
 */
export class TriAuthOAuth2JWTToken extends TriAuthOAuth2Token {
  static override NAME = 'tri:auth:oauth2:jwt:token';

  protected accessTokenPayload: any;

  protected override parsePayload(): void {
    super.parsePayload();
    this.parseAccessTokenPayload();
  }

  protected parseAccessTokenPayload(): any {
    const accessToken = this.getValue();
    if (!accessToken) {
      throw new TriAuthTokenNotFoundError('access_token key not found.');
    }
    this.accessTokenPayload = decodeJwtPayload(accessToken);
  }

  /**
   * Returns access token payload
   * @returns any
   */
  getAccessTokenPayload(): any {
    return this.accessTokenPayload;
  }

  /**
   * for Oauth2 JWT token, the iat (issued at) field of the access_token payload
   */
  protected override prepareCreatedAt(date: Date) {
    const payload = this.accessTokenPayload;
    return payload && payload.iat
      ? new Date(Number(payload.iat) * 1000)
      : super.prepareCreatedAt(date);
  }

  /**
   * Is token valid
   * @returns {boolean}
   */
  override isValid(): boolean {
    return this.accessTokenPayload && super.isValid();
  }

  /**
   * Returns expiration date :
   * - exp if set,
   * - super.getExpDate() otherwise
   * @returns Date
   */
  override getTokenExpDate(): Date {
    if (
      this.accessTokenPayload &&
      this.accessTokenPayload.hasOwnProperty('exp')
    ) {
      const date = new Date(0);
      date.setUTCSeconds(this.accessTokenPayload.exp);
      return date;
    } else {
      return super.getTokenExpDate();
    }
  }
}
