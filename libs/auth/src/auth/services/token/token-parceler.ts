/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { Injectable, InjectionToken, inject } from '@angular/core';

import { triAuthCreateToken, TriAuthToken, TriAuthTokenClass } from './token';
import { TRI_AUTH_TOKENS } from '../../auth.options';

export interface TriTokenPack {
  name: string;
  ownerStrategyName: string;
  createdAt: number;
  value: string;
}

export const TRI_AUTH_FALLBACK_TOKEN = new InjectionToken<TriAuthTokenClass>(
  'Auth Options'
);

/**
 * Creates a token parcel which could be stored/restored
 */
@Injectable()
export class TriAuthTokenParceler {
  private fallbackClass = inject<TriAuthTokenClass>(TRI_AUTH_FALLBACK_TOKEN);
  private tokenClasses = inject<TriAuthTokenClass[]>(TRI_AUTH_TOKENS);

  wrap(token: TriAuthToken): string {
    const createdAt = token.getCreatedAt();

    return JSON.stringify({
      name: token.getName(),
      ownerStrategyName: token.getOwnerStrategyName(),
      createdAt: createdAt ? createdAt.getTime() : 0,
      value: token.toString(),
    });
  }

  unwrap(value: string | null | undefined): TriAuthToken {
    let tokenClass: TriAuthTokenClass = this.fallbackClass;
    let tokenValue = '';
    let tokenOwnerStrategyName = '';
    let tokenCreatedAt: Date | null = null;
    let tokenPack: TriTokenPack | null = null;
    if (value != undefined) {
      tokenPack = this.parseTokenPack(value);
    }
    if (tokenPack) {
      tokenClass = this.getClassByName(tokenPack.name) || this.fallbackClass;
      tokenValue = tokenPack.value;
      tokenOwnerStrategyName = tokenPack.ownerStrategyName;
      tokenCreatedAt = new Date(Number(tokenPack.createdAt));
    }

    return triAuthCreateToken(
      tokenClass,
      tokenValue,
      tokenOwnerStrategyName,
      tokenCreatedAt || undefined
    );
  }

  protected getClassByName(name: string): TriAuthTokenClass | undefined {
    return this.tokenClasses.find(
      (tokenClass: TriAuthTokenClass) => tokenClass.NAME === name
    );
  }

  protected parseTokenPack(value: string): TriTokenPack | null {
    try {
      return JSON.parse(value!) as any;
    } catch (e) {}
    return null;
  }
}
