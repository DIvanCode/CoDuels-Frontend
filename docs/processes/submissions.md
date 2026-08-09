# Submissions

## Purpose

Describe solution submission, navigation, RTK list/detail representations, and
reconciliation of asynchronous judging statuses delivered by WebSocket.

## Participants

Submit button/feature, CodePanel, task/submission pages, submission RTK API,
duel-session WebSocket handlers, Duely, Taski/Exesh behind Duely, participant,
and spectator.

## Entry points

Click submit, open submissions list or detail, change task filter, receive
`SubmissionStatusUpdated`, reconnect/reload, revisit a duel, finish it, or follow
an administrative submission deep-link.

## Preconditions

The client has duel ID, task key (fallback `A`), nonempty solution, mapped
language, and known participant permissions. Backend validates duel/task/user
and owns acceptance. Downstream judging is asynchronous.

## Current behavior

Clicking submit first invokes `onSubmissionStart`, which navigates to submissions,
then records anti-cheat actions and posts
`POST /duels/:id/submissions` with `solution`, `language`, `task_key`. The awaited
`.unwrap()` is not caught in the component handler. On fulfilled response, RTK
manually prepends to the exact currently existing `{duelId, taskKey}` list and
deduplicates by response `id`; this is post-response, not optimistic.

List DTOs identify items as `submission_id`; detail/create use `id`. Cache keys
separate filtered and unfiltered args. A validated WebSocket update iterates
active list caches for the duel and patches a known ID plus detail. Event
updates enforce `Queued -> Running -> Done`, so a delayed queued/running event
cannot regress newer state. If no current cache contains the submission, its
duel-list and detail tags are invalidated instead of dropping the update. Normal
HTTP list/detail merges apply the same nondecreasing status order, so a response
started before a terminal event cannot restore `Queued`/`Running`. There is no
server revision guard between responses with the same status. Detail fetch
updates only the unfiltered list. While a visible list or detail remains
`Queued`/`Running`, it refetches every two seconds and stops at `Done`; WebSocket
remains the fast path. Duel change/finish events also invalidate active
submission projections.

```mermaid
sequenceDiagram
    participant U as Participant
    participant UI as Submit UI
    participant D as Duely
    participant C as RTK caches
    participant J as Taski/Exesh
    U->>UI: Submit
    UI->>UI: Navigate + anti-cheat action
    UI->>D: POST solution
    D->>J: Start asynchronous judging
    D-->>UI: Submission(id, Queued/Running)
    UI->>C: Prepend only matching existing list
    J-->>D: Status result
    D-->>C: SubmissionStatusUpdated
    alt Known cached ID
        C->>C: Patch lists/detail; do not regress status
    else Event before list/create response
        C->>C: Invalidate matching list/detail tags
    end
```

## Client state transitions

Judging states are `Queued -> Running -> Done` in expected flow. Submit navigates
before acceptance. Fulfilled create adds a cache item where present. Events
patch existing items. Opening detail can recover its current state. RTK cache is
lost on reload and reconstructed by queries.

## Backend state assumptions

Duely owns submission identity/access and exposes testing status derived from
Taski/Exesh. The backend may accept a submission even if its response is lost.
Status events may precede/follow any browser query. Terminal verdict/status is
authoritative and should not regress.

## State ownership

Submission records/status belong to backend. RTK list/detail entries are
independent projections keyed by endpoint arguments. Component mutation state
owns the transient button. Editor owns submitted source before request; browser
does not persist a submission outbox.

## UI effects

Participant is immediately moved to the submissions page. Empty/loading state
disables normal repeats, although very fast duplicates are possible. Lists show
status/verdict; detail is hidden from ordinary spectators in UI, while
list/authors remain visible. An administrator may open any submission detail and
the admin dashboard links directly to `/duel/:duelId/submissions/:submissionId`
with the owning task in the query string. Failed submit after navigation can
leave the target list unchanged.

## Network effects

One authenticated POST creates; list/detail queries fetch; WebSocket drives
status. Reconnect invalidates the complete `Submission` tag type, so active
filtered, unfiltered, and detail projections refetch through their actual tags.

## Idempotency and duplicate handling

No client idempotency key accompanies submission. Rapid/two-tab retries can
create multiple real submissions. Cache insertion deduplicates known response
ID. WebSocket duplicate events are safe for status progression; filtered caches
are all enumerated or invalidated.

## Ordering assumptions

The implementation assumes create response populates cache before status event.
HTTP and event paths share terminal protection, but detail/list response order
within the same status and filtered caches are not versioned.

## Failure handling

A rejected `.unwrap()` is not caught locally. Lost successful response leaves no
cache insertion but later list fetch can recover. Missed/early events invalidate
matching projections, while reconnect invalidates all active submission
projections. Bounded pending-status polling repairs a silently missed socket
event without F5. There is still no server status revision.

## Reload and multiple tabs

Reload loses submission cache and in-flight mutation knowledge; a fresh list can
recover accepted items. Code draft survives. Tabs keep separate caches and can
submit duplicates or display different statuses until independently refreshed.

## Implementation references

- submit-code feature under `src/features`
- submission API/entity/pages/widgets under `src/entities/submission`
- `src/features/duel-session/api/duelSessionApi.ts`
- duel/task navigation widgets
- Duely submission controllers/WebSocket messages

## Test coverage

- **Existing tests:** parser/router tests cover submission envelope validation,
  malformed payload rejection, duplicate cursor isolation, and handler safety.
- **Needed integration:** all DTO ID shapes, filters/cache keys, status-before-
  create, duplicates, terminal regression, unknown ID, reconnect invalidation.
- **Needed E2E:** success/failure/response loss, reload/in-flight, ordinary
  spectator versus administrator detail access, multiple tasks/tabs, delayed
  judging, and out-of-order statuses.

## Current guarantees

Normal accepted response is shown when the exact list cache exists; known
WebSocket events update all enumerated active lists for that duel; event-only
patching cannot move status backward; absent entries and reconnects invalidate
matching backend projections; backend remains authoritative.

## Open questions

Submission idempotency, status revision/order, polling/reconnect strategy,
filtered-cache normalization, spectator detail policy, and post-navigation error
experience are not fully specified.

## Proposed requirements

Use an idempotency key and normalized entity cache; version statuses and enforce
terminal monotonicity for every response path; upsert unknown events or
invalidate; align reconnect tags; catch/show create failures; test reordering.
