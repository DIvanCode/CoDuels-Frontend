# Duel page and task navigation

## Purpose

Describe duel-route authorization, nested pages, task selection, sequential
task visibility, participant/spectator UI, and navigation recovery.

## Participants

Router, DuelPage split layout, CodePanel, TaskPanel/description/submissions,
DuelInfo, duel/task RTK APIs, duelSession snapshots, authenticated user, Duely,
and Taski-served task artifacts.

## Entry points

`/duel/:duelId`, nested description/submissions/detail routes, `?task=<key>`,
session navigation, group/tournament duel links, browser reload/back/deep link,
and `DuelChanged`/`DuelFinished` events.

## Preconditions

The route ID must be numeric and the backend must allow viewing. Tasks come from
the duel DTO; task content/files are fetched from Taski-facing endpoints.
Participants and spectators receive different editing/submission capabilities.

## Current behavior

DuelPage validates a finite numeric ID for its own query and shows special
`403` output. Other errors/invalid IDs can still render child panels; child
queries can call `/duels/NaN` because their skip condition checks only a nonempty
string. Nested index redirects to description while preserving task selection.
Tasks sort by key. `?task` selects a valid visible task; invalid/missing selection
is replaced with the first, and legacy `task_id` falls back to key `A`. A task
with null ID is locked. Participant status controls write/run/submit and
anti-cheat enabling; spectator UI is read-only, while backend remains authority.

## Client state transitions

The URL owns task/child-page choice. On each duel response, duelSession compares
current tasks with unpersisted `lastTasksByDuelId`. The first snapshot creates no
alert; a later `null -> id` marks newly opened task keys and raises
`duelStatusChanged`. Removing/changing tasks has no equivalent alert. Result and
opened-task modals have separate dismissal state.

## Backend state assumptions

Duely owns viewer access, participant identity, privacy, duel status/result,
task plan and visible solutions. Taski owns task statement/files/types. Frontend
models only the `write_code` task path although Taski supports additional task
types; unsupported DTOs need an explicit compatibility rule.

## State ownership

Backend duel/task DTOs are RTK cache truth for the rendered page. URL owns
navigation. Unpersisted duelSession owns task-opening comparison. localStorage
`duel:{id}:resultDismissed` owns result-modal preference; editor/run/panel state
has separate documented owners.

## UI effects

The split view renders code and task panes. Spectators cannot edit/run/submit
and cannot open submission detail, though they can view submission lists/authors.
Newly opened tasks can raise DuelInfo modal. Result dismissal is shared across
users/tabs due to an unscoped localStorage key.

## Network effects

Parent and child components fetch duel, task, statement, visible test files, and
submission data based on route/task. `DuelChanged` invalidates or patches duel
data; `DuelFinished` invalidates duel/user. Invalid route propagation can issue
malformed requests before an error boundary/response resolves.

## Idempotency and duplicate handling

Repeated navigation/query is RTK-deduplicated per cache key. Task snapshot
reducers use key sets to avoid repeating opened alerts in one runtime. Reload
loses those sets, and first fetched snapshot intentionally suppresses alerts.

## Ordering assumptions

URL normalization assumes task list is loaded. Duel responses can arrive around
navigation and editor debounce. A refetched duel can overwrite locally persisted
solution/language before later editor state writes. Task-opening detection
depends on observing both old and new snapshots in one tab runtime.

## Failure handling

`403` has explicit UI; other parent errors are not uniformly terminal for child
rendering. Missing task ID produces locked UI. Task/file errors render local
loading/error states. There is no general route-level recovery from deleted
duels, unsupported task types, or stale persisted active session.

## Reload and multiple tabs

Reload restores route/task and code, loses RTK cache/task snapshots, and treats
the first current task set as baseline. Result dismissal is shared localStorage;
selected code tab/run state is sessionStorage. Tabs may observe different duel
versions and task-opening alerts.

## Implementation references

- `src/app/router/router.tsx`
- duel page under `src/pages/duel`
- `src/widgets/code-panel`
- task panel/description/submission widgets and task entity API
- `src/features/duel-session/model/duelSessionSlice.ts`

## Test coverage

- **Existing tests:** none.
- **Needed integration:** invalid/forbidden/deleted IDs, task query normalization,
  task open transitions, task DTO variants, participant/spectator capabilities.
- **Needed E2E:** all nested/deep routes, reload/back, sequential task opening,
  result modal scoping, task errors, spectator attempts, and two tabs.

## Current guarantees

A valid accessible duel normally renders its current backend tasks; a valid task
query is shareable; editing controls are hidden/readonly for known spectators;
the backend still decides access; first-load task snapshot does not falsely
announce every already-open task.

## Open questions

Canonical invalid-route handling, unsupported task types, sequential-change
revision, modal scoping, spectator submission policy, and post-finish navigation
are not explicit contracts.

## Proposed requirements

Validate route IDs once before rendering children; version/validate duel/task
DTOs; make task opening an explicit backend event/revision; scope preferences by
user; and test route, permission, reload, and task-type matrices.

