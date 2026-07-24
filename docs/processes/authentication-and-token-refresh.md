# Authentication and token refresh

## Purpose

Authenticate/register a user, persist tokens/current user, serialize access-
token refresh within one tab, and end the local session on logout/failure.

## Participants

User, AuthPage/forms, auth RTK endpoints/slice, shared base query, refresh mutex,
localStorage/redux-persist, ProtectedRoute/getMe, DuelSessionManager, editor and
anti-cheat features, and Duely user endpoints.

## Entry points

Login/register form submit, protected API request, 401 or `FETCH_ERROR`, cold
rehydration, explicit Header logout, invalid refresh response, or network loss.

## Preconditions

Login fields satisfy Superstruct form rules. Refresh needs a persisted refresh
token. Authenticated requests use the current Redux access token in Authorization.

## Current behavior

Login posts snake-case-compatible `{nickname,password}` but trusts the response
as `TokenPair` at runtime; the fulfilled matcher stores both tokens, invalidates
User tags, then navigation goes to `/`. ProtectedRoute calls `getMe`, whose
fulfilled matcher stores the current user. Registration first creates the user,
then performs the same login. The previous/original URL is not restored.

For each API request, `prepareHeaders` reads the current store token. On 401 or
`FETCH_ERROR` (except `/users/refresh`) with a refresh token, refresh waits for a
module-level mutex. The owner calls raw `fetch POST /users/refresh` with
`refresh_token`, validates exact token fields using Superstruct, dispatches
`setTokens`, releases, and the base query retries the original request, whose
headers are rebuilt from current store. A second retry 401 logs out. A waiter
can use a captured old state and returns its old token after another refresh;
the return only gates retry, while headers themselves re-read Redux. Mutex and
state are not cross-tab.

Any non-OK refresh, invalid JSON/shape, or thrown fetch logs out. Consequently a
temporary offline `FETCH_ERROR` can turn into logout. Refresh itself is excluded
from recursive refresh.

Header logout only dispatches `auth/logout`. Code editor also listens and clears;
manager derives its realtime identity from both token and user ID, so logout or
a missing token stops the socket and a later valid token starts it; user changes
also reset duel session. Token change clears the anti-cheat queue. RTK
Query cache, Home/run/code-tab sessionStorage,
result flags, and local configuration cache are not explicitly cleared. Theme
survives.

```mermaid
sequenceDiagram
    participant A as Request A
    participant B as Request B
    participant Q as baseQuery/mutex
    participant D as Duely
    participant S as Redux
    A->>D: request with expired access token
    B->>D: request with expired access token
    D-->>A: 401
    D-->>B: 401
    A->>Q: acquire mutex
    A->>D: POST /users/refresh
    B->>Q: waitForUnlock
    D-->>A: access_token + refresh_token
    A->>S: setTokens
    A->>Q: release
    A->>D: replay with token read from Redux
    B->>D: replay only if captured return is truthy; headers read Redux
```

## Client state transitions

`auth: anonymous -> tokens/no user -> tokens+user`; refresh `old tokens -> new
tokens` or `old tokens -> null`; logout `user/tokens -> null`, followed by duel
session/editor/queue cleanup through separate observers/reducers.

## Backend state assumptions

Duely is authoritative for credentials, refresh validity, and current user.
Tokens restored from disk are untrusted until `getMe`; no proactive expiry
decode exists. Backend logout/revocation endpoint is not called.

## State ownership

| State                 | Owner/source of truth    | Redux       | RTK Query      | local state  | sessionStorage | localStorage   | Survives reload                 |
| --------------------- | ------------------------ | ----------- | -------------- | ------------ | -------------- | -------------- | ------------------------------- |
| Access/refresh token  | Duely-issued/client held | auth        | No             | No           | No             | `persist:auth` | Yes                             |
| Current user snapshot | Duely `iam`              | auth        | getMe cache    | No           | No             | `persist:auth` | Yes                             |
| Refresh lock          | one JS module/tab        | No          | No             | module mutex | No             | No             | No                              |
| Login form/status     | component                | No          | mutation state | Yes          | No             | No             | No                              |
| Old API data          | backend snapshots        | API reducer | Yes            | No           | No             | No             | Until page refresh/cache expiry |

## UI effects

Forms disable during their mutations and display mapped errors. Success goes to
home. Protected 401 redirects to auth; non-401 error is an indefinite Loader.
Logout on a protected page causes redirect after state change. No cross-tab
logout notice or "session expired/offline" distinction exists.

## Network effects

Login/register/getMe use RTK base query. Refresh uses raw fetch and one replay.
Login/register broadly invalidate User tags. Logout sends nothing and resets no
API cache. Socket closes through manager effect cleanup after its authenticated
realtime identity clears or changes.

## Idempotency and duplicate handling

Form loading generally prevents a second submit after mutation starts. Same-tab
refresh is serialized; cross-tab refreshes can rotate tokens concurrently.
Register retry can encounter an already-created user. Logout is locally
idempotent but asynchronous persistence can race another tab's writes.

## Ordering assumptions

Login token matcher must run before protected navigation/getMe. Refresh waiters
assume mutex owner updated shared Redux, but use captured state for their return.
Logout cleanup happens in multiple effects/reducers with no single atomic reset.

## Failure handling

Login/register errors remain anonymous and show a banner. Refresh failure clears
credentials, including on offline exceptions. Invalid login response has no
runtime guard and may store undefined fields; invalid refresh response is
guarded and logs out. Old RTK/browser data can remain visible after user switch.

## Reload and multiple tabs

Tokens/user rehydrate from shared localStorage. Tabs keep independent Redux and
mutexes; writes do not dispatch logout/token changes to peers. One tab can use
or rewrite stale credentials after another logs out/refreshes. sessionStorage
forms remain independent; shared code/tokens use last-writer-wins persistence.

## Implementation references

- `src/features/auth/{api/authApi,model/authSlice,model/authStruct}.ts`
- `src/features/auth/ui/{LoginForm,RegisterForm}`
- `src/shared/api/{api,token/refreshAuthToken}.ts`
- `src/app/store.ts`, `src/app/router/ProtectedRoute.tsx`
- `src/widgets/header/ui/Header.tsx`
- Backend `UsersController`, token DTO/refresh use cases

## Test coverage

- **Existing tests/MSW:** none.
- **Needed unit/integration:** form validation/mapping, login response validation,
  all base-query refresh branches, mutex waiters, replay headers, logout reset.
- **Needed browser/E2E:** expired token with parallel requests, offline versus
  401, invalid refresh, reload, same-tab user switch, two-tab refresh/logout,
  cache/code leakage, and socket shutdown.

## Current guarantees

Current access token is read for every base-query header; refresh response is
runtime-validated; one tab has at most one mutex-owner refresh at a time;
original request is replayed at most once by this wrapper; logout clears auth
and editor/session through current component wiring; realtime starts only when
token and user are both ready.

## Open questions

Why `FETCH_ERROR` refreshes/logs out, token storage policy, cross-tab session
coordination, full logout reset scope, and login runtime validation are unresolved.

## Proposed requirements

Validate all auth responses, distinguish offline from invalid refresh, re-read
state after mutex wait, coordinate token rotation/logout across tabs, atomically
reset user-owned cache/storage/session, consider HttpOnly refresh storage, and
E2E-test concurrent expiry and user switching.
