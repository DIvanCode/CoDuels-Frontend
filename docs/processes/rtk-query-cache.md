# RTK Query cache

## Purpose

Catalog endpoint/cache ownership, tag topology, manual WebSocket/mutation
patches, invalidation limits, and reconciliation expectations.

## Participants

Shared `apiSlice`, injected auth/user, duel/configuration/invitation, group,
tournament, task, run, submission endpoints, React subscribers, WebSocket
manager, redux-persist boundary, and Duely/Taski HTTP services.

## Entry points

Component query subscription, mutation, tag invalidation, manual
`updateQueryData`, socket open/event, reload, logout/login, arg/filter change,
cache eviction, and navigation.

## Preconditions

The API reducer/middleware are mounted. Auth header preparation reads current
Redux token. Endpoint args serialize into cache keys; tag invalidation affects
only active/provided matching tags and is not itself a domain-state update.

## Current behavior

The API slice is not persisted and uses normal RTK Query cache lifetime. Major
families are:

| Family         | Representative operations                       | Important provided keys                                 |
| -------------- | ----------------------------------------------- | ------------------------------------------------------- |
| Auth/user      | login/register/getMe/ticket                     | `User/ME`                                               |
| Configurations | list/detail/create/update/delete                | entity IDs, `DuelConfiguration/LIST`                    |
| Duels          | search/cancel/active/list/detail                | entity IDs, `Duel/LIST`, group-scoped keys              |
| Invitations    | direct/group/tournament membership/duel actions | entities, `DuelInvitation/LIST`, `GroupInvitation/LIST` |
| Groups         | list/detail/users/create/roles/leave/invite     | `Group/LIST`, group IDs                                 |
| Tournaments    | group list/detail/create/start/accept           | entity ID, `Tournament/GROUP-{id}`                      |
| Tasks          | task/statement/files                            | endpoint-argument caches                                |
| Runs           | start/status                                    | duel/task/run argument caches                           |
| Submissions    | create/list/detail                              | item IDs, `Submission/LIST-{duelId}`                    |

Mutations usually invalidate tags; several flows manually patch only caches that
already exist. `getDuel.fulfilled` also writes editor/session slices outside the
API cache. Every socket open invalidates each complete tag type rather than
inventing generic list IDs, so active entity, filtered, detail, and group-scoped
subscriptions refetch according to their actual provided tags. It also forces
the active-duel query for session reconciliation.

## Client state transitions

Queries move uninitialized/loading/success/error and retain data until eviction.
Invalidation marks matching entries and refetches active subscriptions. Manual
patches mutate snapshots synchronously but do not create absent query entries.
Reload drops all entries; new subscriptions refetch.

## Backend state assumptions

Backend is authoritative. Tags assume a mutation/event fully identifies every
projection made stale. Manual patches assume compatible DTO fields and event
order. Neither assumption is enforced by schema versions or normalized global
entities.

## State ownership

RTK owns received HTTP projections, request lifecycle, subscription/refetch, and
tag metadata. Domain ownership stays backend-side. Persisted workflow/editor
Redux and component/session state can outlive the API cache and disagree with a
fresh response.

## UI effects

Active pages render cached data immediately and may refetch later. Invalidation
does not guarantee immediate visible change: no matching tag/subscriber means no
request. Manual patches can make one filter/detail current while sibling caches
remain stale.

## Network effects

Subscriptions and matching invalidation issue HTTP requests; repeated broad
invalidation can fan out. Socket event patches avoid a request but lose unknown
entities. Logout does not dispatch `api.util.resetApiState`, so old-user cache
can remain until component teardown/eviction and potentially flash for a new user.

## Idempotency and duplicate handling

RTK deduplicates concurrent identical query keys. Repeated invalidation/refetch
is safe but costly. Manual patches implement their own item deduplication; lists
with distinct serialized args remain independent. Mutations have no generic
client idempotency.

## Ordering assumptions

HTTP responses, mutation invalidation, WebSocket patches, auth refresh/replay,
and navigation are unordered. A late query can overwrite a newer event patch.
The submission event path enforces `Queued -> Running -> Done` monotonicity and
invalidates the relevant list/detail tags when the event identifies an entry
that is absent from current caches. Normal HTTP merge/refetch still has no
server revision for comparison.

## Failure handling

Failed queries retain error/possibly prior data according to RTK behavior.
ProtectedRoute can display Loader indefinitely for non-401 `getMe` errors.
Known realtime payloads are runtime-validated before manual patches. A handler
exception is isolated by the router. HTTP payloads and late-response ordering
can still leave stale state without server entity revisions.

## Reload and multiple tabs

Reload and each new tab start an empty API cache. Tabs never share invalidation
or query responses. Persisted auth/session/editor can render decisions before
new cache reconciliation. A socket in one tab cannot patch another tab's cache.

## Implementation references

- `src/shared/api/api.ts`
- injected `*Api.ts` files under entities/features
- `src/features/duel-session/api/duelSessionApi.ts`
- `src/app/store.ts`
- endpoint call sites in pages/widgets/features

## Test coverage

- **Existing tests:** realtime connection/router integration covers reconnect
  invalidation entry, event isolation, and user-session replacement.
- **Needed integration:** endpoint-argument matrix, all provided/invalidated tag
  pairs, late HTTP versus event, absent-cache patching, and full auth cache reset.
- **Needed E2E:** reconnect while every page is open, reload, filtered submissions,
  tournament finish, group invitation, stale detail, and multi-tab divergence.

## Current guarantees

Identical active query args share requests/cache within one store; reload cannot
reuse stale API state; matching tag invalidation refetches active subscriptions;
normal manual patches update only explicitly selected existing entries.

## Open questions

Cache retention, global reset on logout, normalized entity/version policy,
reconnect reconciliation scope, tag naming convention, and acceptable request
fanout are not documented as product requirements.

## Proposed requirements

Create a tested endpoint/tag matrix; reset cache atomically on identity change;
version critical entities and HTTP merges; add MSW integration coverage before
relying on manual cache surgery.
