# Group duels

## Purpose

Document manager-created duels between two group members, their invitations,
acceptance, visibility, and transition into the normal duel session.

## Participants

Group duels section, group managers, two active members, group-duel RTK API,
Home aggregated invitations, duel-session manager, Duely, and WebSocket.

## Entry points

Open `/groups/:groupId/duels`, create a duel, receive/accept its invitation from
the group page or Home, open active/finished duel, cancel a pending flow, reload,
or receive group-duel WebSocket events.

## Preconditions

The creator is authorized by Duely and selects two distinct active members plus
a permitted configuration. The accepting user still belongs to the group and
the invitation remains pending.

## Current behavior

The manager form posts the selected pair/configuration and invalidates the
group-duel list plus invitation data. Pending rows can be accepted; active and
finished rows link to the duel. Accepting on the group page stores opponent and
configuration plus the `Group` invitation type (the event contract has no stable
group ID), sets
`home.waitingForStart=true` in sessionStorage, changes phase to searching, and
navigates Home. Home has a parallel group-duel acceptance path. Frontend exposes
no group-duel-specific cancellation mutation even though backend behavior has a
cancel concept; the generic session cancel is separate.

```mermaid
sequenceDiagram
    participant M as Manager
    participant D as Duely
    participant U as Group member
    participant H as Home/session state
    M->>D: Create group duel(member A, member B, config)
    D-->>M: Created; invalidate group list
    D-->>U: GroupDuelInvitation
    Note over U: Current socket handler does not recognize it
    U->>D: Accept from fetched list
    D-->>U: Success
    U->>H: searching + waitingForStart
    D-->>U: DuelStarted
    U->>H: active duel
```

## Client state transitions

Creation updates only cached lists. Acceptance moves local session to searching;
`DuelStarted` activates it. A cancellation must match the stored `Group` family,
opponent, and configuration before clearing the pending session, so it cannot
reset an otherwise-identical direct invitation. The lack of a stable group ID in
the event still prevents distinguishing identical invitations from two groups.
Finished duels remain list entries and open through the common duel route.

## Backend state assumptions

Duely owns group membership, manager permission, invitation status, both
participants, configuration, and created duel. Client member filtering and
button visibility cannot prove authorization or freshness.

## State ownership

Group-duel records are backend state cached under a group-specific RTK tag.
Accepted-waiting projection is split between persisted duelSession and Home
sessionStorage. Route/component state owns form selection; it is not durable.

## UI effects

Managers see creation controls; members see pending acceptance when returned by
the query. Active/finished rows are navigable. Pushed group-duel invitation and
cancellation events invalidate the invitation and group projections.

## Network effects

HTTP loads, creates, and accepts group duels. Mutations invalidate `Duel` group
and invitation tags. Current `GroupDuelInvitation` and
`GroupDuelInvitationCanceled` payloads are runtime-validated and routed to the
invitation/group handlers; reconnect broadly refreshes both projections.

## Idempotency and duplicate handling

No client request ID covers create/accept. Duplicate clicks/tabs rely on Duely
to reject repeated transitions. List invalidation is safe to repeat. Supplied
event cursors are deduplicated, but current cursorless starts are not tied to a
group-duel invitation generation.

## Ordering assumptions

Acceptance still assumes navigation to Home occurs before the local
`waitingForStart` watcher is needed. An early `DuelStarted` can no longer be
overwritten by a late `searching` assignment, but can still miss that local
navigation watcher.

## Failure handling

Mutation errors remain on the form/list. A lost successful accept response can
leave a created duel without local waiting state. Reconnect refreshes group and
invitation caches. Generic cancel may reset local state without proving the
group-duel invitation was canceled.

## Reload and multiple tabs

Group form state is lost. Persisted opponent/configuration survives; waiting
flag survives only same-tab sessionStorage. Tabs have separate list caches and
sockets, so one may accept while another keeps a pending row or sends a repeat.

## Implementation references

- group duel UI/features under `src/pages/group` and `src/entities/group`
- `src/pages/home/ui/HomePage.tsx`
- `src/features/duel-session/model/duelSessionSlice.ts`
- `src/features/duel-session/api/duelSessionApi.ts`
- Duely group-duel controllers/use cases and WebSocket message enum

## Test coverage

- **Existing tests:** realtime parser/router/session tests cover event isolation,
  duplicate/unknown handling, reconnect, and lifecycle cleanup.
- **Needed integration:** roles/members, create/accept duplicates, tag coverage,
  exact group WebSocket types, response/event ordering, cancel semantics.
- **Needed E2E:** manager plus two member browsers, reload during acceptance,
  Home versus group-page accept, two groups with same pair/config, two tabs.

## Current guarantees

The current normal HTTP path uses Duely authorization; successful creation
invalidates the relevant group list; successful acceptance enters the common
duel waiting flow; active/finished records reuse the standard duel page.

## Open questions

Invitation identity, reject/cancel UI, group ID in events/session state, exact
manager permissions, expiration, and navigation after acceptance need a single
contract.

## Proposed requirements

Persist an immutable group-duel invitation ID/context, make accept/cancel
idempotent, define navigation independent of page-local watchers, and publish a
server event revision.
