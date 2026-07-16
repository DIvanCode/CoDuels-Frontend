# Duel session lifecycle

## Purpose

Coordinate local `idle`, `searching`, and `active` UI workflow with backend
pending/active duels across HTTP, socket events, logout, disconnect, and reload.

## Participants

Duel-session slice/thunk/manager/button, Home/Group pages, RTK duel endpoints,
redux-persist, WebSocket handlers, router, and Duely pending/active duel state.

## Entry points

Start/accept/cancel click, `DuelStarted`/finished/canceled/invitation events,
`getActiveDuel` response, reload/browser reopen, direct duel URL, socket close,
logout, or persisted rehydration.

## Preconditions

Authenticated user for backend operations. `searching` should correspond to a
backend pending state; `active`/ID should correspond to an InProgress duel, but
reducers do not enforce these invariants.

## Current behavior

Exact phases are `idle`, `searching`, `active`. `setPhase("idle")` clears active
ID, matching fields, and task snapshots; other values do not validate required
fields. `setActiveDuelId(non-null)` changes searching/idle to active, clears
matching/task notification state; null clears event/task state but does not
itself set phase.

`resetDuelSession` clears every field including unpersisted interrupted/task
state. Logout manager invokes it. Socket close resets searching to idle and
marks interrupted; finish resets before invalidating duel/user. Direct duel
route does not set phase/ID.

Home subscribes to `getActiveDuel`. Fulfillment writes `activeDuelId` but the
extra reducer merely calls `restoreDuelSession(...)` as a function, creating a
thunk action object that is not dispatched. Manager later dispatches restore
only when `user && activeDuelId && phase==idle`; it GETs the duel and sets active
only if `InProgress`, otherwise resets. If persisted phase is already active or
searching, that manager check does not run. A 404 active query resets only when
phase is currently active.

On Navigation Timing `reload`, manager converts persisted searching/no active ID
to idle without calling cancel. Browser reopen/history navigation is not treated
as reload. Navigation from searching to active happens only in mounted Home
waiting effect or DuelSessionButton; events received on another page only update
Redux.

```mermaid
sequenceDiagram
    participant B as Browser reload
    participant S as persisted duelSession
    participant M as Manager
    participant H as Home/getActiveDuel
    participant D as Duely
    B->>S: rehydrate phase/activeDuelId
    S-->>M: provisional session
    alt phase idle + activeDuelId
        M->>D: GET /duels/:id via restore thunk
        D-->>M: InProgress/finished/error
        M->>S: active or reset
    else Home mounted
        H->>D: GET /duels/active
        D-->>H: active or 404
        H->>S: set ID; reducer's thunk call is not dispatched
    end
```

## Client state transitions

- Ranked/friendly/accept success: `idle -> searching`.
- `DuelStarted`: `idle|searching -> active`, non-null active ID.
- cancel success/socket close while searching: `searching -> idle`.
- finish/logout/reset: `active|searching|idle -> idle`, ID null.
- `getActiveDuel` can create `phase unchanged + activeDuelId non-null`, including
  inconsistent `searching + ID`.

## Backend state assumptions

Backend pending types and active Duel are authoritative. `GET /duels/active` and
`GET /duels/:id` are partial reconciliation. Disconnect cancels pending states.
No endpoint verifies "searching" directly, and persisted matching fields are
not compared with backend pending rows.

## State ownership

| State | Owner/source of truth | Redux | RTK Query | local state | sessionStorage | localStorage | Survives reload |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pending/search | Duely; client phase cache | duelSession | invitation lists | No | waiting flag | `persist:duelSession` | Yes, conditionally reset |
| Active duel | Duely | ID/phase | active/detail | No | No | persisted ID/phase | Yes |
| Matching fields | client correlation | duelSession | invitation DTOs | No | No | persisted | Yes |
| Interrupted/task notifications | client | duelSession | Duel data | manager/modals | No | Not whitelisted | No |

## UI effects

Home shows idle controls or search loader; session button starts/cancels/navigates.
Canceled/denied opens modal. Active event can navigate only where workflow effects
are mounted. Direct active/finished pages render independently of phase. Socket
close can show idle Home plus blocking interruption modal.

## Network effects

Start/cancel/accept mutations precede most local phase changes. Manager/ Home
perform active/detail GETs. Socket events invalidate duel data. No pending-state
polling, replay, or automatic post-close socket reconnect exists.

## Idempotency and duplicate handling

Repeated assignments are syntactically allowed, but duplicate/old events are
not identified. Multiple HTTP requests can create/cancel competing backend
state. Reset is idempotent locally. Persisted state has no generation/user ID.

## Ordering assumptions

HTTP mutation success is assumed before related socket event. Early start can
be overwritten by later `setPhase(searching)`. Finish is assumed to concern the
current active duel. Home navigation assumes phase transition occurs after the
watcher mounts.

## Failure handling

Mutation errors generally leave prior phase. Lost success response leaves
backend changed/local unchanged. Missed start leaves searching; missed finish
leaves active. A stale active ID may be repaired only in specific Home/idle/404
paths. Searching can exist indefinitely after browser reopen.

## Reload and multiple tabs

ID/phase/matching persist in shared localStorage; each tab has independent Redux
and socket. Reload searching resets local idle, while backend old-socket cleanup
also cancels pending. Browser reopen may retain stale search. One tab's start/
finish/logout does not update another except through backend events/storage races.

## Implementation references

- `src/features/duel-session/model/{duelSessionSlice,thunks,types}.ts`
- `src/features/duel-session/ui/{DuelSessionManager,DuelSessionButton}`
- `src/pages/home/ui/HomePage.tsx`
- `src/entities/duel/api/duelApi.ts`
- Backend docs: `../../../Backend/docs/processes/duel-lifecycle.md`

## Test coverage

- **Existing tests/MSW:** none.
- **Needed unit/integration:** every reducer invariant, ineffective thunk call,
  active query/restore matrix, duplicate/out-of-order events, early start.
- **Needed browser/E2E:** all three phases, reload/reopen/direct URL, response
  loss, missed start/finish, logout/disconnect, active event on other page, and
  two tabs.

## Current guarantees

Only three phase strings compile; whitelisted session fields survive reload;
non-null active ID via its reducer promotes idle/searching to active; reset
clears all session fields; Home supplies the only active-duel query on its mount.

## Open questions

Phase invariants, global navigation, pending reconciliation, restore trigger,
browser-reopen behavior, event relevance, and multi-tab authority are undefined.

## Proposed requirements

Represent backend-verified session generation/type; reconcile active and pending
state globally after rehydration/reconnect; dispatch restore correctly; make
transitions event/order safe; navigate by an explicit global policy; and test
every persisted/inconsistent state.

