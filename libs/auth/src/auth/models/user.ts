/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

export class TriUser {

  constructor(public id?: number,
              public email?: string,
              public password?: string,
              public rememberMe?: boolean,
              public terms?: boolean,
              public confirmPassword?: string,
              public fullName?: string) {
  }
}
