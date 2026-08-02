# Client state ownership

## Purpose

Catalog every durable and ephemeral client state so changes have explicit
owners, reset triggers, reload behavior, tab scope, and reconciliation rules.

## Participants

Redux slices, redux-persist/localStorage, RTK Query, component state,
sessionStorage hooks, browser URL/history, Duely/Taski, pages/widgets, and tabs.

## Entry points

Store creation/rehydration, query/mutation/event, user interaction, navigation,
reload, logout, tab duplication/open, cache eviction, and backend refetch.

## Preconditions

Same-origin browser storage is available; otherwise storage hooks silently keep
memory state and redux-persist may fall back/error according to library behavior.

## Current behavior

| State                                                                                           | Owner/source of truth                     | Storage/lifetime                         | Reset trigger                                        | Reload / tab behavior                             | Main stale risk                          |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------- | ---------------------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| auth user/access/refresh                                                                        | Duely, cached client                      | persisted Redux                          | logout/new responses                                 | reload yes; shared storage, independent tab state | invalid/old token/user, cross-user cache |
| `activeDuelId`, `activeDuelUserId`, `phase`, `lastEventId`, search matching, canceled dialog    | backend-derived/client workflow           | persisted duelSession                    | reset/idle/logout/events                             | reload/shared storage; no live sync               | persisted search/active mismatch         |
| `sessionInterrupted`, `pendingStartedInCurrentRuntime`, task snapshots, opened keys/status flag | client manager                            | unpersisted Redux                        | socket open/session reset/modal                      | lost on reload, tab-local                         | missed notifications                     |
| own code/language by `${duelId}:${taskId}`                                                      | local draft, overwritten by Duel response | persisted codeEditor                     | logout only                                          | reload/shared storage, independent writers        | backend fetch overwrite/cross-tab race   |
| opponent code/language                                                                          | backend socket/Duel response              | unpersisted codeEditor                   | session/code not fully pruned                        | lost reload then refetch                          | stale if event/cache missed              |
| RTK Query cache                                                                                 | latest received HTTP/manual patch         | API Redux only                           | eviction/invalidation/app reload                     | lost reload, tab-local                            | old-user/missed-event/filter divergence  |
| route and task selection                                                                        | URL/browser history                       | pathname + `?task=`                      | navigation                                           | survives copied URL; browser history              | locked/changed task fallback             |
| Home forms/modals/config/waiting/pending IDs                                                    | UI                                        | sessionStorage                           | selected handlers/phase changes                      | reload same tab; not user-scoped                  | stale modal/disabled action              |
| code panel `my/opponent` tab                                                                    | UI                                        | sessionStorage per duel ID               | manual/privacy effect                                | same tab reload                                   | cross-user stale selection               |
| run input/draft/run status                                                                      | UI                                        | sessionStorage per duel/task             | new run/manual edit                                  | same tab reload                                   | stale `running`, no run ID               |
| pending duel result                                                                             | terminal event/reconnect validation       | persisted duelSession with user ID       | acknowledge/reset/new active duel                    | reload/shared storage; server-revalidated         | stale candidate until reconciliation     |
| result acknowledged                                                                             | UI acknowledgement                        | versioned localStorage per user and duel | user closes; legacy keys removed                     | shared tabs, user-isolated, live storage event    | per-duel key accumulation                |
| local configuration copy                                                                        | feature UI                                | `duel-configurations` localStorage       | local create/update/delete                           | shared/unversioned                                | diverges from backend                    |
| auth/group/tournament forms/modals                                                              | component except Home                     | React state                              | unmount/close                                        | lost reload/tab-local                             | partial request ambiguity                |
| theme                                                                                           | client preference                         | persisted Redux                          | toggle                                               | shared storage, independent tab state             | last-writer wins                         |
| anti-cheat queue/sequence/flush flag                                                            | browser process                           | module memory                            | successful/failed/disabled flush, token loss, reload | lost reload, per tab                              | silent loss/duplicate stream IDs         |

Persist whitelists are exact: auth (`user`, `token`, `refreshToken`), duelSession
(`activeDuelId`, `activeDuelUserId`, `lastEventId`, `phase`, `searchNickname`,
`searchConfigurationId`, `searchInvitationType`, `searchTournamentId`,
`duelCanceled`, `duelCanceledOpponentNickname`, `pendingResult`), codeEditor
(`codeByTaskKey`, `languageByTaskKey`), theme (`mode`). All are version 1 with no
configured migration. RTK Query and opponent/snapshot/interrupted state are not
persisted.

## Client state transitions

State changes are process-specific. The important ownership transition is
`backend response/event -> RTK/Redux snapshot -> optional local persistence`;
reload reverses it as `localStorage -> Redux provisional state -> selective
backend refetch`. Component/sessionStorage state is not globally reconciled.

## Backend state assumptions

Backend is authoritative for user, duel, invitation, group, tournament,
submission, tasks, and permissions. Persisted Redux/browser UI is a cache. Some
states are checked (`getMe`, `getActiveDuel`, `getDuel`); an active-duel 404
clears rehydrated searching but preserves pending work started in the current
runtime. Forms, submission caches, and configuration local copies can remain
unsynchronized.

## State ownership

| State                          | Owner/source of truth   | Redux       | RTK Query              | local state   | sessionStorage        | localStorage          | Survives reload |
| ------------------------------ | ----------------------- | ----------- | ---------------------- | ------------- | --------------------- | --------------------- | --------------- |
| Auth                           | Duely                   | Yes         | getMe                  | No            | No                    | `persist:auth`        | Yes             |
| Duel session workflow          | Duely + client          | Yes         | duel queries           | No            | waiting flag separate | `persist:duelSession` | Partial         |
| Editor                         | client/backend snapshot | Yes         | Duel supplies solution | Monaco mirror | code tab/run separate | `persist:codeEditor`  | Own code yes    |
| Groups/tournaments/submissions | Duely                   | API reducer | Yes                    | forms         | Home only             | No                    | No cache        |
| Theme                          | client                  | Yes         | No                     | No            | No                    | `persist:theme`       | Yes             |

## UI effects

Pages render a mixture of sources: persisted phase drives Home immediately,
RTK data drives domain lists/details, local state controls forms/modals, and URL
drives duel task/tab routes. These can disagree until a query/event/effect wins;
some disagreements have no visible recovery control.

## Network effects

Redux workflow fields do not automatically call backend. RTK subscriptions
fetch on mount/invalidation. Manual WebSocket patches touch existing cache only.
Most storage writes cause no network reconciliation and no cross-tab Redux
action. Result acknowledgement listens for its scoped storage key and clears the
matching pending result in each live tab.

## Idempotency and duplicate handling

Persistence is last-write-wins. Reducers generally tolerate repeated assignments
but workflow events have no IDs. RTK cache keys separate endpoint args. Browser
form/pending flags are not idempotency keys and cannot prove backend outcome.

## Ordering assumptions

Rehydration precedes UI, but backend reconciliation can complete after several
components act on persisted state. Debounced editor writes, Duel refetches,
socket events, localStorage writes, and other-tab actions have no total order.

## Failure handling

Custom hooks catch parse/write errors and use initial/memory value; no user
warning or migration. Redux/cache conflicts remain until reset/refetch. Storage
quota can silently prevent new writes. Sensitive tokens/source code remain in
localStorage when not explicitly cleared.

## Reload and multiple tabs

Reload restores whitelisted state and per-tab sessionStorage, but not RTK cache,
opponent code, task snapshots, or anti-cheat queue. Tabs share localStorage
bytes, not live Redux; sessionStorage is independent. Concurrent persist writes
can overwrite logout, tokens, code, theme, and phase.

## Implementation references

- `src/app/store.ts`
- Slice type/reducer files in `features/auth`, `features/duel-session`,
  `widgets/code-panel`, `features/theme`
- `src/shared/lib/use{Local,Session}Storage.tsx`
- Home, DuelInfo, CodePanel, TaskDescription call sites
- `src/shared/api/api.ts`

## Test coverage

- **Existing tests/MSW:** result state/reset ownership, acknowledgement scoping,
  and legacy dismissal cleanup.
- **Needed unit/integration:** every whitelist/reset, corrupt/versioned storage,
  code/server conflict, session-key hydration, cache isolation, queue lifetime.
- **Needed browser/E2E:** reload at every phase, logout/login another user,
  storage quota/corruption, two-tab last-writer races, stale forms/run state, and
  missed-event reconciliation.

## Current guarantees

PersistGate completes before child render; only listed fields persist; editor
logout reducer returns empty maps; RTK cache and anti-cheat queue do not survive
reload; sessionStorage hooks isolate keys per tab under normal browser behavior.

## Open questions

Required retention/user scoping, conflict winners, schema migrations, tab
coordination, sensitive-storage policy, and cleanup after duel completion remain
undefined.

## Proposed requirements

Give every persisted key a schema/migration/user scope/TTL/reset policy; treat
backend reconciliation as explicit state; atomically purge user data; coordinate
tabs; version editor/session formats; and test storage/reload/conflict matrices.
