/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */

import { TriAuthToken } from './token/token';

export class TriAuthResult {
  protected token: TriAuthToken | null;
  protected errors: string[] = [];
  protected messages: string[] = [];

  constructor(
    protected success: boolean,
    protected response?: any,
    protected redirect?: any,
    errors?: any,
    messages?: any,
    token: TriAuthToken | null = null
  ) {
    this.errors = this.errors.concat([errors]);
    if (errors instanceof Array) {
      this.errors = errors;
    }

    this.messages = this.messages.concat([messages]);
    if (messages instanceof Array) {
      this.messages = messages;
    }

    this.token = token;
  }

  getResponse(): any {
    return this.response;
  }

  getToken(): TriAuthToken | null {
    return this.token;
  }

  getRedirect(): string {
    return this.redirect;
  }

  getErrors(): string[] {
    return this.errors.filter((val) => !!val);
  }

  getMessages(): string[] {
    return this.messages.filter((val) => !!val);
  }

  isSuccess(): boolean {
    return this.success;
  }

  isFailure(): boolean {
    return !this.success;
  }
}
