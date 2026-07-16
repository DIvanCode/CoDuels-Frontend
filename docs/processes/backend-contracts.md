# Backend contracts

## Purpose

Inventory the HTTP/WebSocket contracts consumed by Frontend and identify known
field, event, validation, and cache-compatibility gaps against current backend.

## Participants

Frontend RTK/raw fetch/WebSocket parser, Duely controllers/DTOs/message sender,
Taski task file routes, Exesh/Analyzer indirectly, Nginx base URL, and TypeScript
or Superstruct models.

## Entry points

Every API query/mutation, token refresh, anti-cheat raw batch, task file fetch,
ticket/socket open, outgoing solution message, and incoming backend event.

## Preconditions

`VITE_BASE_URL` identifies the API prefix (normally `/api` via Nginx). JSON uses
the backend's snake_case/casing strings. Authorization headers and the stored
socket ticket value are valid. The ticket is intended for one use, but its
backend read and clearing are not atomic. Backend code is the operational source
of truth.

## Current behavior

HTTP route catalog from injected endpoints:

| Domain | Methods and paths consumed |
| --- | --- |
| Auth/users | `POST /users/register`, `/users/login`, `/users/refresh`; `GET /users/iam`, `/users/{id}`, `/users/nickname/{nickname}`; `POST /users/ticket` |
| Configurations | `GET/POST /duels/configurations`, `GET/PUT/DELETE /duels/configurations/{id}` |
| Duels | `GET /duels/{id}`, `/duels?userId=`, `/duels/active`, `/groups/{id}/duels`; `POST /duels/search`, `/duels/cancel` |
| Duel invitations | `GET/POST /duels/invitations`, `POST .../accept`, `.../deny`, `.../cancel`; `GET/POST /duels/group/invitations`, `POST .../accept`; `GET /duels/tournament/invitations`, `POST /tournaments/{id}/duels/accept` |
| Groups | `GET/POST /groups`; `GET/PUT /groups/{id}`; `GET /groups/{id}/users`; `POST /groups/{id}/role`, `/groups/{id}/exclude`, `/groups/{id}/leave`; `GET/POST /groups/invitations`; `POST /groups/invitations/accept`, `/deny`, `/cancel` |
| Tournaments | `GET /groups/{id}/tournaments`, `POST /tournaments`, `GET /tournaments/{id}`, `POST /tournaments/{id}/start` |
| Tasks/runs | `GET /task/{id}`, `/task/{id}/{file}`, `/task/topics`; `POST /code-runs`, `GET /code-runs/{id}` |
| Submissions | `POST/GET /duels/{id}/submissions`, `GET /duels/{id}/submissions/{submissionId}` |
| Actions | `POST /actions` with `{ actions: [...] }` through raw authenticated fetch |

Current incoming Duely message enum is `DuelStarted`, `DuelFinished`,
`DuelChanged`, `OpponentSolutionUpdated`, `DuelInvitation`,
`DuelInvitationCanceled`, `DuelInvitationDenied`, `SubmissionStatusUpdated`,
`CodeRunStatusUpdated`, `GroupInvitation`, `GroupInvitationCanceled`,
`GroupDuelInvitation`, `GroupDuelInvitationCanceled`, and
`TournamentDuelInvitation`. Sender serializes flat polymorphic JSON with `type`
and message fields; it does not currently include replay `lastEventId`.

Frontend normalizes event/type/name and data/payload/flat envelopes, snake/camel
cursor spellings, stringified payloads, and punctuation/case in event names, but
casts payloads without runtime validation. It handles most duel/direct/group-
membership/submission/tournament-invite events. It does not handle current
`GroupDuelInvitation`, `GroupDuelInvitationCanceled`, or `CodeRunStatusUpdated`.
It handles `DuelCanceled` and tournament-canceled aliases not emitted by the
current backend. Code-run state is recovered by HTTP polling.

Known DTO boundaries: login/register responses rely on TypeScript only; refresh
token pair and task test files use Superstruct. Submission list uses
`submission_id`, while create/detail uses `id`, and code adapts this explicitly.
Frontend task model/UI focuses on `write_code`, a subset of Taski task types.
Direct friendly invitations are queried/labeled with client type `Ranked`.

## Client state transitions

HTTP responses populate RTK and sometimes extra reducers. WebSocket events
patch/invalidate existing state. Without version/event ID, transition ordering
is arrival-based. Contract mismatches typically become ignored events, undefined
fields, stale cache, wrong matching, or render/request errors.

## Backend state assumptions

Duely owns identity/domain DTOs and emits browser events. Taski serves task
packages/files and derives judging through Duely; browser does not consume
Taski/Exesh status histories directly. Analyzer consumes persisted actions after
duel completion, not browser responses.

## State ownership

Backend schemas/event definitions own wire truth. Frontend TypeScript types are
compile-time consumer projections; Superstruct schemas provide runtime truth
only where called. Documentation records current compatibility, not permission
to change either side independently.

## UI effects

Compatible payloads render normal pages. Unknown events are silent; malformed
JSON warns; structurally malformed known payloads can create stale/incorrect UI.
Missing event handling delays invitations, code-run state, tournament/group
changes, and recovery until a later query.

## Network effects

RTK attaches current token and refreshes selected failures. Raw WebSocket URL is
built with `ws:` even when the page/base may require `wss:`, risking mixed
content. Ticket lookup then clearing is not an atomic consume operation, and the
backend stores one process-local connection per user.
Outgoing `SolutionUpdated` sends full snake_case payload with duel/task/language/
solution; anti-cheat uses raw fetch and bypasses RTK refresh/status handling.

## Idempotency and duplicate handling

Queries tolerate repeats. Domain mutations generally have no client idempotency
key. Events have no current replay ID/generation, so duplicates/stale messages
cannot be reliably classified. Anti-cheat UUIDs do not currently prevent
duplicates because Duely neither looks up `EventId` before insert nor enforces a
unique constraint.

## Ordering assumptions

The client assumes several HTTP successes precede their corresponding events.
The backend flat payload is accepted by the parser, but the optional cursor path
is currently inert. No schema revision or entity revision orders HTTP and socket
representations.

## Failure handling

HTTP status handling varies by feature. Refresh and task-test validation are
explicit; most DTOs are trusted. Unknown event names are ignored and reconnect
does not replay missed events. Contract changes can therefore fail silently
rather than fail closed with observable telemetry.

## Reload and multiple tabs

Each tab reopens with a fresh RTK cache and ticket. Backend's single connection
per user conflicts with Frontend's per-tab manager. No cursor is sent on open,
and stored `lastEventId` is not populated by current messages, so reload/tab
replacement cannot replay the gap.

## Implementation references

- `src/shared/api/api.ts` and all injected `*Api.ts` files
- frontend model/type files and Superstruct definitions
- `src/features/duel-session/api/duelSessionApi.ts`
- `src/features/anti-cheat`
- Backend Duely controllers/DTOs/WebSocket message enum/sender
- Backend Taski HTTP/task domain and Analyzer action schemas

## Test coverage

- **Existing frontend contract tests/MSW:** none.
- **Needed consumer/provider tests:** every route method/body/response/error,
  snake_case/string enums, optional/null fields, every WebSocket event, task types.
- **Needed E2E:** Nginx HTTP/HTTPS socket URL, ticket reuse/replacement, refresh,
  missed events/reconnect, real Taski files, judging, and action ingestion.

## Current guarantees

Listed paths and current common DTO casing match normal source paths; the parser
accepts current flat Duely events; backend re-authorizes operations; refresh token
and task-test payloads have runtime validation; browser is isolated from direct
Exesh execution.

## Open questions

Schema/version governance, complete event envelope/cursor, secure socket URL,
multi-tab connection policy, task-type compatibility, runtime validation scope,
and mutation idempotency require cross-repository decisions.

## Proposed requirements

Publish versioned OpenAPI/event schemas and generate/validate consumers; add
provider/consumer contract tests; handle every enum member exhaustively; include
event/entity revisions and invitation IDs; use `wss:` under HTTPS; align tags and
document backward-compatible rollout order.
