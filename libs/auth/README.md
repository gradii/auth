# @gradii/auth

> **v1.0.0 — module-less, signal-aware authentication & ACL for modern Angular (≥21).**

A standalone-friendly authentication and access-control toolkit for Angular apps. Provides token storage, pluggable strategies (Password, OAuth2, Dummy), HTTP interceptors, and an ACL with directive-level guarding — all wired through `provide…` functions, with reactive state exposed as Angular **Signals** while imperative actions remain idiomatic **rxjs Observables**.

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideTriAuth,
  provideTriSecurity,
  triAuthJwtInterceptor,
  TriPasswordAuthStrategy,
  TriAuthJWTToken,
} from '@gradii/auth';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([triAuthJwtInterceptor])),
    provideTriAuth({
      strategies: [
        TriPasswordAuthStrategy.setup({
          name: 'email',
          baseEndpoint: '/api/auth/',
          token: { class: TriAuthJWTToken, key: 'data.token' },
        }),
      ],
    }),
    provideTriSecurity({
      accessControl: {
        guest: { view: '*' },
        user:  { parent: 'guest', create: 'comments' },
        admin: { parent: 'user', remove: ['posts', 'comments'] },
      },
    }),
  ],
});
```

---

## Table of Contents

- [Why v1.0.0?](#why-v100)
- [Install](#install)
- [Quick start](#quick-start)
- [Public API contract](#public-api-contract)
- [Authentication](#authentication)
  - [`provideTriAuth(options)`](#providetriauthoptions)
  - [`TriAuthService`](#triauthservice)
  - [`TriTokenService`](#tritokenservice)
  - [Strategies](#strategies)
    - [`TriPasswordAuthStrategy`](#tripasswordauthstrategy)
    - [`TriOAuth2AuthStrategy`](#trioauth2authstrategy)
    - [`TriDummyAuthStrategy`](#tridummyauthstrategy)
  - [Tokens](#tokens)
  - [HTTP interceptors](#http-interceptors)
- [Security / ACL](#security--acl)
  - [`provideTriSecurity(options)`](#providetrisecurityoptions)
  - [`TriAclService`](#triaclservice)
  - [`TriAccessChecker`](#triaccesschecker)
  - [`TriRoleProvider`](#trirroleprovider)
  - [`*triIsGranted` directive](#triisgranted-directive)
- [Concurrent refresh dedup](#concurrent-refresh-dedup)
- [Recipes](#recipes)
- [Building & testing](#building--testing)
- [License](#license)

---

## Why v1.0.0?

| Old (`0.x`)                                               | v1.0.0                                                                |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| `TriAuthModule.forRoot(...)`, `TriSecurityModule.forRoot` | `provideTriAuth(...)`, `provideTriSecurity(...)` — **no NgModules**   |
| Class interceptors via `HTTP_INTERCEPTORS`                | Functional interceptors via `withInterceptors([...])`                 |
| `Observable<TriAuthToken>` for state accessors            | `Signal<TriAuthToken \| null>` for state                              |
| `isAuthenticated(): Observable<boolean>`                  | `isAuthenticated: Signal<boolean>` (computed)                         |
| `tokenChange()` / `onTokenChange()` (Observable)          | Observable via `toObservable` rxjs interop (still a stream)           |
| Concurrent `isAuthenticatedOrRefresh()` triggered N HTTP refreshes | One in-flight refresh shared by all callers (`shareReplay(1)`) |

Public action functions (`authenticate`, `register`, `logout`, `requestPassword`, `resetPassword`, `refreshToken`, `isAuthenticatedOrRefresh`) **still return rxjs `Observable<TriAuthResult>`** — they are imperative HTTP-bound mutations and rxjs remains the right primitive there.

---

## Install

```bash
pnpm add @gradii/auth
# or
npm i @gradii/auth
```

Peer requirements: `@angular/common ^21`, `@angular/core ^21`, `rxjs ^7.8`.

---

## Quick start

### 1. Provide auth + security in your bootstrap

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import {
  provideTriAuth,
  provideTriSecurity,
  triAuthJwtInterceptor,
  TriPasswordAuthStrategy,
  TriAuthJWTToken,
} from '@gradii/auth';

import { AppComponent } from './app/app.component';
import { routes } from './app/routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([triAuthJwtInterceptor])),
    provideTriAuth({
      strategies: [
        TriPasswordAuthStrategy.setup({
          name: 'email',
          baseEndpoint: '/api/auth/',
          login:    { endpoint: 'login',    method: 'post' },
          register: { endpoint: 'register', method: 'post' },
          logout:   { endpoint: 'logout',   method: 'delete' },
          refreshToken: { endpoint: 'refresh-token', method: 'post' },
          token: { class: TriAuthJWTToken, key: 'data.token' },
        }),
      ],
    }),
    provideTriSecurity({
      accessControl: {
        guest: { view: '*' },
        user:  { parent: 'guest', create: 'comments' },
        admin: { parent: 'user', remove: ['posts', 'comments'] },
      },
    }),
  ],
});
```

### 2. Use `TriAuthService` from a component

```ts
import { Component, inject } from '@angular/core';
import { TriAuthService } from '@gradii/auth';

@Component({
  selector: 'login-page',
  template: `
    @if (auth.isAuthenticated()) {
      <p>Welcome back, {{ auth.token()?.getPayload()?.name }}</p>
      <button (click)="logout()">Sign out</button>
    } @else {
      <button (click)="login()">Sign in</button>
    }
  `,
})
export class LoginPageComponent {
  protected auth = inject(TriAuthService);

  login() {
    this.auth.authenticate('email', { email: 'a@b.c', password: 'pw' })
      .subscribe(result => {
        if (result.isSuccess()) console.log('redirect to', result.getRedirect());
        else console.warn(result.getErrors());
      });
  }

  logout() {
    this.auth.logout('email').subscribe();
  }
}
```

### 3. Guard UI with `*triIsGranted`

```ts
import { Component } from '@angular/core';
import { TriIsGrantedDirective } from '@gradii/auth';

@Component({
  selector: 'comments-list',
  imports: [TriIsGrantedDirective],
  template: `
    <ul>…comments…</ul>
    <button *triIsGranted="['create', 'comments']">Add comment</button>
  `,
})
export class CommentsListComponent {}
```

You must also provide a `TriRoleProvider` implementation — see [`TriRoleProvider`](#trirroleprovider) below.

---

## Public API contract

| Surface                       | Shape                               | Notes                                 |
| ----------------------------- | ----------------------------------- | ------------------------------------- |
| `TriAuthService.token`        | `Signal<TriAuthToken \| null>`      | Reactive token state                  |
| `TriAuthService.isAuthenticated` | `Signal<boolean>`                | Derived (computed) signal             |
| `TriAuthService.onTokenChange` | `Observable<TriAuthToken \| null>` | Stream — via `toObservable` interop   |
| `TriAuthService.onAuthenticationChange` | `Observable<boolean>`     | Stream — via `toObservable` interop   |
| `TriAuthService.getToken()`   | `TriAuthToken \| null`              | Sync helper — equivalent to `token()` |
| `TriAuthService.authenticate / register / logout / requestPassword / resetPassword / refreshToken / isAuthenticatedOrRefresh` | `Observable<TriAuthResult>` (or `Observable<boolean>`) | Imperative actions stay rxjs |
| `TriTokenService.token`       | `Signal<TriAuthToken \| null>`      | Single source of truth                |
| `TriTokenService.tokenChange` | `Observable<TriAuthToken \| null>`  | `toObservable` of the signal          |
| `TriAccessChecker.isGranted`  | `(p, r) => Signal<boolean>`         | Reactive — recomputes on role change  |
| `TriRoleProvider.getRole()`   | `Signal<string \| string[]>`        | Implement in your app                 |

---

## Authentication

### `provideTriAuth(options)`

Returns `EnvironmentProviders`. Replaces the legacy `TriAuthModule.forRoot(...)`.

```ts
provideTriAuth({
  strategies: [
    TriPasswordAuthStrategy.setup({ name: 'email', ... }),
    TriOAuth2AuthStrategy.setup({   name: 'google', ... }),
  ],
  forms: { /* optional UI defaults — login redirect, validation, etc. */ },
});
```

What it registers:

- `TriAuthService`, `TriTokenService`, `TriAuthTokenParceler`
- `TriTokenStorage` → `TriTokenLocalStorage` by default
- `TRI_AUTH_OPTIONS` (merged with `defaultAuthOptions`)
- `TRI_AUTH_USER_OPTIONS` (your raw input)
- `TRI_AUTH_STRATEGIES` (resolved instances)
- `TRI_AUTH_TOKENS` (token classes harvested from each strategy)
- `TRI_AUTH_FALLBACK_TOKEN` = `TriAuthSimpleToken`
- `TRI_AUTH_INTERCEPTOR_HEADER` = `'Authorization'`
- `TRI_AUTH_TOKEN_INTERCEPTOR_FILTER` = noop (intercepts every request)

### `TriAuthService`

```ts
class TriAuthService {
  readonly token: Signal<TriAuthToken | null>;
  readonly isAuthenticated: Signal<boolean>;
  readonly onTokenChange: Observable<TriAuthToken | null>;
  readonly onAuthenticationChange: Observable<boolean>;

  getToken(): TriAuthToken | null;

  authenticate(strategyName: string, data?: any): Observable<TriAuthResult>;
  register(strategyName: string, data?: any): Observable<TriAuthResult>;
  logout(strategyName: string): Observable<TriAuthResult>;
  requestPassword(strategyName: string, data?: any): Observable<TriAuthResult>;
  resetPassword(strategyName: string, data?: any): Observable<TriAuthResult>;
  refreshToken(strategyName: string, data?: any): Observable<TriAuthResult>;

  isAuthenticatedOrRefresh(): Observable<boolean>;
}
```

`isAuthenticatedOrRefresh()` dedupes concurrent calls — see [Concurrent refresh dedup](#concurrent-refresh-dedup).

### `TriTokenService`

Manages persisted token state.

```ts
class TriTokenService {
  readonly token: Signal<TriAuthToken | null>;
  readonly tokenChange: Observable<TriAuthToken | null>;
  set(token: TriAuthToken): void;
  get(): TriAuthToken | null;
  clear(): void;
}
```

You can swap storage:

```ts
import { TriTokenStorage } from '@gradii/auth';

class TriSessionStorage extends TriTokenStorage { /* ... */ }

bootstrapApplication(AppComponent, {
  providers: [
    provideTriAuth({ strategies: [...] }),
    { provide: TriTokenStorage, useClass: TriSessionStorage },
  ],
});
```

You can also override the local-storage key:

```ts
import { TRI_AUTH_TOKEN_LOCAL_STORAGE_KEY } from '@gradii/auth';

{ provide: TRI_AUTH_TOKEN_LOCAL_STORAGE_KEY, useValue: 'my_app_auth_token' }
```

### Strategies

A strategy implements the abstract `TriAuthStrategy` and is registered through `setup()`:

```ts
strategies: [TriPasswordAuthStrategy.setup({ name: 'email', ...overrides })]
```

`setup()` returns a `[StrategyClass, StrategyOptions]` tuple — `provideTriAuth` resolves it through Angular DI so each strategy can `inject(HttpClient)` and friends.

#### `TriPasswordAuthStrategy`

Email/password (or any credential body) over HTTP. Default endpoints:

| Action          | Method | Path             |
| --------------- | ------ | ---------------- |
| `authenticate`  | POST   | `login`          |
| `register`      | POST   | `register`       |
| `logout`        | DELETE | `logout`         |
| `requestPassword` | POST | `request-pass`   |
| `resetPassword` | PUT    | `reset-pass`     |
| `refreshToken`  | POST   | `refresh-token`  |

All paths are relative to `baseEndpoint` (defaults to `/api/auth/`). Token extraction is configurable:

```ts
TriPasswordAuthStrategy.setup({
  name: 'email',
  baseEndpoint: '/api/auth/',
  token: {
    class: TriAuthJWTToken,
    key: 'data.token',                       // path inside response body
    getter: (module, res, options) => res.body?.data?.token,
  },
  errors:   { key: 'data.errors',   getter: ... },
  messages: { key: 'data.messages', getter: ... },
});
```

#### `TriOAuth2AuthStrategy`

Standards-track OAuth2 with `code` / `token` / `password` grant types and Basic / request-body client-auth methods.

```ts
import {
  TriOAuth2AuthStrategy,
  TriOAuth2GrantType,
  TriOAuth2ResponseType,
  TriAuthOAuth2JWTToken,
} from '@gradii/auth';

TriOAuth2AuthStrategy.setup({
  name: 'google',
  baseEndpoint: 'https://accounts.google.com/o/oauth2/',
  clientId: '…',
  authorize: {
    endpoint: 'auth',
    redirectUri: 'http://localhost:4200/callback',
    responseType: TriOAuth2ResponseType.CODE,
    scope: 'openid email profile',
  },
  token: {
    endpoint: 'token',
    grantType: TriOAuth2GrantType.AUTHORIZATION_CODE,
    class: TriAuthOAuth2JWTToken,
  },
  redirect: { success: '/', failure: '/login' },
});
```

`refreshToken(token)` accepts a `TriAuthRefreshableToken` and re-uses the existing refresh token if the server doesn't return a fresh one. `register / requestPassword / resetPassword` throw — these aren't supported by OAuth2.

#### `TriDummyAuthStrategy`

Useful when the backend isn't ready yet. Resolves all actions after `delay` ms, optionally always-fails:

```ts
TriDummyAuthStrategy.setup({ name: 'dummy', delay: 500, alwaysFail: false });
```

### Tokens

| Class                    | NAME                          | Notes                                       |
| ------------------------ | ----------------------------- | ------------------------------------------- |
| `TriAuthSimpleToken`     | `tri:auth:simple:token`       | Wraps any string; valid iff value present.  |
| `TriAuthJWTToken`        | `tri:auth:jwt:token`          | Decodes payload; `isValid` honors `exp`.    |
| `TriAuthOAuth2Token`     | `tri:auth:oauth2:token`       | Wraps `{access_token, refresh_token, ...}`. |
| `TriAuthOAuth2JWTToken`  | `tri:auth:oauth2:jwt:token`   | OAuth2 wrapper whose access_token is JWT.   |

Tokens persist via `TriAuthTokenParceler` (JSON `{name, ownerStrategyName, createdAt, value}`). On read, the parceler picks the registered token class by `NAME`, falling back to `TRI_AUTH_FALLBACK_TOKEN` (default `TriAuthSimpleToken`).

Errors:

- `TriAuthTokenNotFoundError` — no token in storage when one is required.
- `TriAuthIllegalTokenError` — token class refused the supplied data.
- `TriAuthEmptyTokenError`, `TriAuthIllegalJWTTokenError` — sub-classes for specific failures.

### HTTP interceptors

Two functional interceptors, both register-once via `withInterceptors([...])`.

- `triAuthJwtInterceptor` — calls `isAuthenticatedOrRefresh()`, attaches `Authorization: Bearer <token>` for any non-filtered request.
- `triAuthSimpleInterceptor` — sync; if a token is present, sends its raw value under `TRI_AUTH_INTERCEPTOR_HEADER` (default `Authorization`).

```ts
provideHttpClient(withInterceptors([triAuthJwtInterceptor]))
```

Skip auth for specific URLs:

```ts
{
  provide: TRI_AUTH_TOKEN_INTERCEPTOR_FILTER,
  useValue: (req: HttpRequest<any>) => /\/public\//.test(req.url),
}
```

The filter returns `true` to **skip** the auth header.

---

## Security / ACL

### `provideTriSecurity(options)`

```ts
provideTriSecurity({
  accessControl: {
    guest: { view: '*' },
    user:  { parent: 'guest', create: 'comments' },
    admin: { parent: 'user',  remove: ['posts', 'comments'] },
  },
});
```

Registers `TriAclService`, `TriAccessChecker`, and binds `TRI_SECURITY_OPTIONS_TOKEN`.

### `TriAclService`

Imperative ACL helpers (sync — pure data layer):

```ts
acl.setAccessControl({...});               // bulk replace
acl.register('editor', 'user', { edit: 'posts' });
acl.allow('editor', 'edit', 'comments');   // append abilities
acl.can('editor', 'edit', 'posts');        // boolean
```

`'*'` is a wildcard resource at definition time; it cannot be passed to `can()` (throws).

### `TriAccessChecker`

Reactive bridge between current role and ACL:

```ts
class TriAccessChecker {
  isGranted(permission: string, resource: string): Signal<boolean>;
}
```

`isGranted` returns a `computed` signal that re-derives whenever the role provider's signal changes.

### `TriRoleProvider`

Abstract — you implement it:

```ts
import { Injectable, signal, type Signal } from '@angular/core';
import { TriRoleProvider } from '@gradii/auth';

@Injectable({ providedIn: 'root' })
export class MyRoleProvider extends TriRoleProvider {
  private _role = signal<string | string[]>('guest');
  override getRole(): Signal<string | string[]> { return this._role; }
  setRole(role: string | string[]) { this._role.set(role); }
}
```

Wire it in your providers:

```ts
provideTriSecurity({...}),
{ provide: TriRoleProvider, useExisting: MyRoleProvider },
```

### `*triIsGranted` directive

Structural directive that mounts/unmounts content based on the current role's permissions. Uses Angular signal `input()` + a single `effect()` — re-evaluates when the binding or the role signal changes.

```html
<button *triIsGranted="['create', 'comments']">Add comment</button>
<a    *triIsGranted="['view',   'admin-panel']" routerLink="/admin">Admin</a>
```

```ts
import { TriIsGrantedDirective } from '@gradii/auth';
@Component({ imports: [TriIsGrantedDirective], ... })
```

---

## Concurrent refresh dedup

`TriAuthService.isAuthenticatedOrRefresh()` is the choke-point used by `triAuthJwtInterceptor`. When several requests fire simultaneously and the access token has just expired, you don't want N parallel refresh-token round-trips.

The service holds an in-flight `activeRefresh$` and shares it across callers via `shareReplay(1)`; `finalize` clears the cache once the request settles, so the next call after that builds a fresh pipeline.

```ts
// Inside TriAuthService
private activeRefresh$: Observable<boolean> | null = null;

isAuthenticatedOrRefresh(): Observable<boolean> {
  const token = this.getToken();
  if (token && token.getValue() && !token.isValid()) {
    if (this.activeRefresh$) return this.activeRefresh$;
    this.activeRefresh$ = this.refreshToken(token.getOwnerStrategyName(), token).pipe(
      map(res => res.isSuccess() && this.isAuthenticated()),
      finalize(() => { this.activeRefresh$ = null; }),
      shareReplay(1),
    );
    return this.activeRefresh$;
  }
  return of(!!token && token.isValid());
}
```

This is the exact pattern from `sixgod-auth.service.ts`, brought into the core service so every consumer benefits without extending.

---

## Recipes

### Reading the current user from the JWT payload

```ts
@Component({...})
class HeaderComponent {
  private auth = inject(TriAuthService);

  // computed signal — recomputes when token signal updates
  readonly userName = computed(() => {
    const t = this.auth.token();
    return t?.getPayload()?.name ?? 'guest';
  });
}
```

### A route guard

```ts
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { map } from 'rxjs';
import { TriAuthService } from '@gradii/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(TriAuthService);
  const router = inject(Router);
  return auth.isAuthenticatedOrRefresh().pipe(
    map(ok => ok || router.parseUrl('/login')),
  );
};
```

### Bridging an Observable to a Signal in templates

```ts
import { toSignal } from '@angular/core/rxjs-interop';

readonly tokenStream = toSignal(this.auth.onTokenChange, { initialValue: null });
```

(Or just use `auth.token()` directly — that's already a signal.)

### Reactive role updates after login

```ts
this.auth.authenticate('email', creds).subscribe(res => {
  if (res.isSuccess()) {
    this.roleProvider.setRole(res.getToken()!.getPayload()?.role ?? 'user');
  }
});
```

### Skip auth on public endpoints

```ts
import { HttpRequest } from '@angular/common/http';
import { TRI_AUTH_TOKEN_INTERCEPTOR_FILTER } from '@gradii/auth';

{
  provide: TRI_AUTH_TOKEN_INTERCEPTOR_FILTER,
  useValue: (req: HttpRequest<any>) =>
    req.url.startsWith('/api/public/') || req.url.includes('/health'),
}
```

---

## Building & testing

```bash
pnpm nx build auth     # produce FESM + DTS bundle in dist/libs/auth
pnpm nx test  auth     # run vitest specs (jsdom)
pnpm nx lint  auth     # ESLint + Angular template lint
```

Shipped specs (vitest):

- `token.service.spec.ts` — signal updates on `set/clear`.
- `auth.service.spec.ts` — token signal, `isAuthenticated`, `authenticate`/`logout`, **concurrent refresh dedup**.
- `provide-auth.spec.ts` — DI smoke test for every token registered by `provideTriAuth`.
- `acl.service.spec.ts` — role/parent/wildcard semantics, runtime `allow()`.
- `access-checker.service.spec.ts` — `isGranted` signal reacts to role changes.
- `provide-security.spec.ts` — DI smoke test for `provideTriSecurity` (with a `FakeRoleProvider`).

---

## License

MIT.
