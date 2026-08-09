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

| Domain           | Methods and paths consumed                                                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth/users       | `POST /users/register`, `/users/login`, `/users/refresh`; `GET /users/iam`, `/users/{id}`, `/users/nickname/{nickname}`; `POST /users/ticket`                                                                                       |
| Configurations   | `GET/POST /duels/configurations`, `GET/PUT/DELETE /duels/configurations/{id}`                                                                                                                                                       |
| Duels            | `GET /duels/{id}`, `/duels?userId=`, `/duels/active`, `/groups/{id}/duels`; `POST /duels/search`, `/duels/cancel`                                                                                                                   |
| Duel invitations | `GET/POST /duels/invitations`, `POST .../accept`, `.../deny`, `.../cancel`; `GET/POST /duels/group/invitations`, `POST .../accept`; `GET /duels/tournament/invitations`, `POST /tournaments/{id}/duels/accept`                      |
| Groups           | `GET/POST /groups`; `GET/PUT /groups/{id}`; `GET /groups/{id}/users`; `POST /groups/{id}/role`, `/groups/{id}/exclude`, `/groups/{id}/leave`; `GET/POST /groups/invitations`; `POST /groups/invitations/accept`, `/deny`, `/cancel` |
| Tournaments      | `GET /groups/{id}/tournaments`, `POST /tournaments`, `GET /tournaments/{id}`, `POST /tournaments/{id}/start`                                                                                                                        |
| Tasks/runs       | `GET /task/{id}`, `/task/{id}/{file}`, `/task/topics`; `POST /code-runs`, `GET /code-runs/{id}`                                                                                                                                     |
| Submissions      | `POST/GET /duels/{id}/submissions`, `GET /duels/{id}/submissions/{submissionId}`                                                                                                                                                    |
| Admin lists      | `GET /users/admin/{all,active}`, `/duels/admin/{pending,ranked-searchers,active,finished}`, `/duels/admin/submissions/{testing,all}`, `/groups/admin/all`, `/tournaments/admin/{active,finished}`                                   |
| Actions          | `POST /actions` with `{ actions: [...] }` through raw authenticated fetch                                                                                                                                                           |

Current incoming Duely message enum is `DuelStarted`, `DuelFinished`,
`DuelChanged`, `OpponentSolutionUpdated`, `DuelInvitation`,
`DuelInvitationCanceled`, `DuelInvitationDenied`, `SubmissionStatusUpdated`,
`CodeRunStatusUpdated`, `GroupInvitation`, `GroupInvitationCanceled`,
`GroupDuelInvitation`, `GroupDuelInvitationCanceled`, and
`TournamentDuelInvitation`. Sender serializes flat polymorphic JSON with `type`
and message fields; it does not currently include replay `lastEventId`.

Frontend normalizes event/type/name and data/payload/flat envelopes, snake/camel
cursor spellings, stringified payloads, and punctuation/case in event names.
Known event payloads are runtime-validated before typed routing. It handles the
duel, direct invitation, group membership, group-duel, tournament invitation,
opponent solution, and submission events listed above. `CodeRunStatusUpdated`
is validated but intentionally has no side effect because code-run state is
recovered by HTTP polling. Compatibility parsing still accepts `DuelCanceled`
and tournament-canceled aliases not emitted by current Duely.

Known DTO boundaries: login/register responses rely on TypeScript only; refresh
token pair and task test files use Superstruct. Submission list uses
`submission_id`, while create/detail uses `id`, and code adapts this explicitly.
Administrative submission-list items additionally expose `duel_id` and
`task_key` for task-aware detail links.
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

Compatible payloads render normal pages. Invalid known payloads and future event
names are isolated before domain side effects. Code-run state remains
polling-owned.

## Network effects

RTK attaches current token and refreshes selected failures. WebSocket URL derives
`ws:` from HTTP and `wss:` from HTTPS, avoiding mixed content. Ticket lookup then
clearing is not an atomic consume operation, and the backend stores one
process-local connection per user.
Outgoing `SolutionUpdated` sends full snake_case payload with duel/task/language/
solution; anti-cheat uses raw fetch and bypasses RTK refresh/status handling.

## Idempotency and duplicate handling

Queries tolerate repeats. Domain mutations generally have no client idempotency
key. Current backend events have no replay ID/revision, so duplicates and stale
messages cannot always be classified. Compatibility envelopes with a cursor are
deduplicated and numeric cursors are ordered; active-duel relevance and
submission monotonicity are protected without claiming replay. Anti-cheat UUIDs do not prevent
duplicates because Duely neither looks up `EventId` before insert nor enforces a
unique constraint.

## Ordering assumptions

The client assumes several HTTP successes precede their corresponding events.
The backend flat payload is accepted by the parser, but the optional cursor path
is currently inert. No schema revision or entity revision orders HTTP and socket
representations.

## Failure handling

HTTP status handling varies by feature. Refresh and task-test validation are
explicit; most HTTP DTOs are trusted. Unknown names and malformed known realtime
payloads are ignored before domain effects. Reconnect performs broad HTTP
reconciliation but does not replay missed events, so provider changes can still
become stale reads rather than an observable contract failure.

## Reload and multiple tabs

Each tab opens with an independent RTK cache and ticket. Backend's single
connection per user conflicts with Frontend's per-tab manager. Every open
performs HTTP reconciliation, but no cursor is sent and current messages do not
populate `lastEventId`, so reload/tab replacement cannot replay the exact gap.

## Implementation references

- `src/shared/api/api.ts` and all injected `*Api.ts` files
- frontend model/type files and Superstruct definitions
- `src/features/duel-session/api/duelSessionApi.ts`
- `src/features/anti-cheat`
- Backend Duely controllers/DTOs/WebSocket message enum/sender
- Backend Taski HTTP/task domain and Analyzer action schemas

## Test coverage

- **Existing frontend contract tests:** realtime parser/router tests cover flat
  and enveloped payloads, required fields, malformed/unknown events, cursor
  duplicates/order, and secure URL construction.
- **Needed consumer/provider tests:** every route method/body/response/error,
  snake_case/string enums, optional/null fields, every WebSocket event, task types.
- **Needed E2E:** Nginx HTTP/HTTPS socket URL, ticket reuse/replacement, refresh,
  missed events/reconnect, real Taski files, judging, and action ingestion.

## Current guarantees

Listed paths and current common DTO casing match normal source paths; the parser
runtime-validates current flat Duely events; HTTPS selects `wss:`; backend
re-authorizes operations; refresh token and task-test payloads have runtime
validation; browser is isolated from direct Exesh execution.

## Open questions

Schema/version governance, complete event envelope/cursor, multi-tab connection
policy, task-type compatibility, HTTP runtime-validation scope, and mutation
idempotency require cross-repository decisions.

## Proposed requirements

Publish versioned OpenAPI/event schemas and generate/validate consumers; add
provider/consumer contract tests; handle every enum member exhaustively; include
event/entity revisions and invitation IDs; and document backward-compatible
rollout order.
