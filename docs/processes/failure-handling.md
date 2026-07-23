# Failure handling

## Purpose

Consolidate degraded-path behavior across bootstrap, authentication, HTTP cache,
WebSocket, duel workflows, storage, editor, judging, and anti-cheat delivery.

## Participants

ErrorBoundary/Fallback/Loader, protected routes, RTK base query and refresh
mutex, duel-session manager, pages/features, browser storage/lifecycle, Duely,
Taski/Exesh/Analyzer, and user.

## Entry points

Render exception, network/offline error, `401/403/404/409/5xx`, malformed DTO or
event, timeout/disconnect, lost response, reload/crash, storage failure, stale
cache/event, duplicate/out-of-order action, and downstream judging delay.

## Preconditions

Failures can occur before or after backend mutation. HTTP status, transport
failure, parse failure, and domain rejection must be distinguished; current
paths do this inconsistently.

## Current behavior

Root router/error boundary renders Fallback for selected rendering/routing
errors. ProtectedRoute redirects only explicit `401`; non-401 `getMe` errors can
leave Loader indefinitely. Base query tries refresh on `401` and also
`FETCH_ERROR`, so offline can cause logout; it retries the original request once.
Many pages show local errors, with special cases such as duel/group `403/404`
and friendly invitation `409`.

Ticket, constructor, established socket, timeout, and ready-state health
failures retry with bounded exponential backoff and jitter. The modal exposes
immediate retry without reloading the page. Known realtime payloads are
runtime-validated; unknown/malformed events and individual handler exceptions
are isolated. Every open broadly invalidates domain projections and force-reads
the active duel. Storage writes still fail silently. Submission `.unwrap()`
rejection is not locally caught. Anti-cheat non-2xx/rejection clears events.
Code sync retries a failed socket send after reconnect but has no server
acknowledgement or durable queue.

## Client state transitions

Errors often retain prior Redux/cache/form state. Refresh failure logs out;
logout resets auth/session and editor but not RTK or all browser keys. Socket
close resets searching to idle, sets interruption for the current user, and
enters automatic retry. Reconnect reconciles safe reads without discarding the
page runtime.

## Backend state assumptions

The backend can have committed a start/accept/submit even when response is lost.
Duely and downstream services remain authoritative, but Frontend lacks mutation
receipts/status queries for several ambiguous outcomes. Status/event delivery is
not assumed reliable enough to reconstruct every state.

## State ownership

Transport/error UI belongs to the initiating layer. Domain outcome belongs to
backend. Persisted/client cache cannot decide ambiguous success. There is no
central error model correlating requests, WebSocket events, storage, and
downstream execution identifiers.

## UI effects

Effects range from loader, inline/modal error, disabled/stale control, redirect,
reconnect prompt, or no visible feedback. Similar failures receive different
treatment. Some stale states look successful: ignored group invites, partial
batch invitations, non-delivered actions, or stale tournament/submission status.

## Network effects

RTK may refresh/replay, refetch matching tags, or keep prior data. The socket
lifecycle retries ticket and established failures and immediately retries when
the browser reports online. No general circuit breaker or offline queue covers
mutations. Lifecycle raw fetches bypass refresh logic.

## Idempotency and duplicate handling

Retrying a query is safe; retrying start/accept/create/submit may duplicate
effects because client idempotency keys are absent. Current code sometimes does
not retry ambiguous mutations and leaves reconciliation to later queries/events.

## Ordering assumptions

A response can be lost after commit, an event can precede it, and a late HTTP
snapshot can follow an event. Most workflows lack revisions/generations. Error
handlers therefore cannot reliably infer whether prior local state is newer.

## Failure handling

Classify recovery as: retry safe reads; refresh once for expired auth; query
backend status for ambiguous mutation; reconcile critical entities after socket
loss; preserve unsent user drafts; never clear telemetry as delivered without
acknowledgement; show actionable and bounded error UI.

Current implementation only satisfies parts of this model and should not be
described as guaranteeing delivery or exactly-once behavior.

## Reload and multiple tabs

Reload is no longer socket recovery. Another tab may still mutate with old auth/session or
replace the socket. No shared offline/identity/session coordinator fences it.

## Implementation references

- app providers/router/error components
- `src/shared/api/api.ts`
- auth and duel-session APIs/managers
- storage hooks and persisted slice configurations
- submit/editor/anti-cheat implementations
- process-specific documents in this directory

## Test coverage

- **Existing automated tests:** realtime tests cover retry/backoff, owned cleanup,
  malformed/unknown/duplicate/order isolation, reconnect, logout/user
  replacement, and publisher retry/deduplication.
- **Needed integration:** status/error matrix per endpoint, refresh/replay,
  malformed contracts, lost response, event reorder, tag recovery, storage faults.
- **Needed E2E/chaos:** offline/online, socket drop, backend restart, slow/duplicate
  responses, downstream judging delay, reload/crash, two tabs, user switch.

## Current guarantees

React has a top-level fallback; explicit protected `401` redirects; refresh is
mutexed per tab and original request is replayed at most once; backend remains
authorization/domain authority; selected page errors and socket interruption are
visible.

## Open questions

Global error taxonomy/UX, retry budgets, ambiguous-mutation status endpoints,
offline support, reconnect SLA, telemetry loss budget, stale-cache tolerance,
and multi-tab policy are undefined.

## Proposed requirements

Adopt typed/versioned errors and runtime DTO validation; add idempotency/status
receipts; reconnect with backoff and full reconciliation; make states monotonic;
atomically reset identity data; observe failures/loss; test fault matrices.
