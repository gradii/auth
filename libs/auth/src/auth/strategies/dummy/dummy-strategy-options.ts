/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */


import { TriAuthStrategyOptions, TriStrategyToken } from '../auth-strategy-options';
import { TriAuthSimpleToken } from '../../services/token/token';

export class TriDummyAuthStrategyOptions extends TriAuthStrategyOptions {
  override token?: TriStrategyToken = {
    class: TriAuthSimpleToken,
  };
  delay?: number = 1000;
  alwaysFail?: boolean = false;
}

export const dummyStrategyOptions: TriDummyAuthStrategyOptions = new TriDummyAuthStrategyOptions();
