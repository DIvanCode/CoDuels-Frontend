# Duel invitations

## Purpose

Document direct friendly, group-membership, group-duel, and tournament-duel
invitations, including the distinct acceptance and cancellation semantics.

## Participants

Home panels, group pages, invitation RTK endpoints, duel-session Redux,
sessionStorage waiting fields, Duely HTTP/WebSocket producers, invitee/inviter,
group managers, and tournament scheduler.

## Entry points

Create a friendly invitation, receive/open invitation lists, accept or deny,
accept group membership, accept a group/tournament duel, cancel from another
client, reload Home, and receive invitation WebSocket messages.

## Preconditions

The user is authenticated. Duely verifies users, roles, group membership,
configuration access, tournament state, and whether an invitation remains
pending. UI visibility is not authorization.

## Current behavior

Direct creation is owned by the `friendly-duel` widget. Its explicit client state
machine is `idle -> configuring -> pending -> matched|canceled|error`. It calls
`POST /duels/invitations`; while the request is in flight, it stores the
nickname/configuration/type `Friendly` in `duelSession` and enters searching so
an early `DuelStarted` can still be accepted. User cancellation calls the
direct-invitation cancel endpoint with the same nickname and configuration,
rather than the generic matchmaking cancel endpoint. The selected rules and
nickname remain in the widget after a cancellation, ready for another attempt.
Configuration queries mount only while the configuration scenario is open.

Home queries direct pending invitations using argument `Ranked`, although the
backend domain calls them friendly; its transform labels the returned item
`Ranked`. Direct accept,
group-duel accept, and tournament accept wait for HTTP success, persist selected
matching fields, set Home's `waitingForStart`, and wait for `DuelStarted`.
Group-duel acceptance from either Home or the group page records the `Group`
pending type so a group cancellation cannot clear a simultaneous direct flow.
Only direct invitations expose deny on Home. Group membership accept/deny updates
membership caches but accept does not navigate to the group.

```mermaid
sequenceDiagram
    participant A as Inviter
    participant D as Duely
    participant B as Invitee Home
    participant S as duelSession
    A->>D: POST /duels/invitations
    D-->>B: DuelInvitation + list invalidation
    B->>D: Accept invitation
    D-->>B: Success
    B->>S: Store opponent/config/type; searching
    D-->>B: DuelStarted
    B->>S: Store duel; active
    alt Deny/cancel
        B->>D: Deny direct invitation
        D-->>A: denied/canceled event
        A->>S: Reset only if persisted fields match
    end
```

## Client state transitions

Friendly creation moves its widget through `configuring -> pending`; the
corresponding session moves `idle -> searching`. `DuelStarted` moves a pending
session to `active`, and the widget to `matched`. A `DuelStarted` received after
an already-cancelled session is ignored instead of reviving that duel.

Successful user cancellation moves the widget to `canceled` with reason `user`.
Cancellation from the server and an established socket disconnect also reach
`canceled`, but retain distinct reasons for the UI. A creation error moves the
widget to `error`; a cancellation error leaves the pending invitation visible
and re-enables its cancel button.

Other create/accept flows move `idle -> searching`; `DuelStarted` moves to `active`.
Cancellation/denial returns to idle only when event nickname/configuration and,
for tournaments, tournament ID match persisted fields. Cancellation additionally
requires the pending invitation family to match (`Friendly`/`Ranked`, `Group`,
or `Tournament`). Group events still expose a group name rather than a stable
group invitation ID, so otherwise-identical invitations from two groups remain
ambiguous. The HTTP/event ordering race is the same as ranked matchmaking.

## Backend state assumptions

Duely is authoritative for pending invitations and creates the duel. Direct,
group-duel, tournament-duel, and group-membership invitations are separate
domain concepts even when the UI aggregates them. A generic backend tournament
accept cancellation message lacks `tournament_id`, so the frontend's tournament
matching rule may not reset the inviter.

## State ownership

Invitation lists are RTK snapshots. Pending outgoing/accepted matching values
are persisted in duelSession. The friendly widget keeps its configuration/nickname
in non-persisted Redux state, restores its pending projection from the matching
session fields after reload, and clears it after matching or explicit close.
Home's pending invitation IDs and `waitingForStart` remain sessionStorage values,
not backend facts and not user-scoped. Duely owns invitation existence and
acceptance.

## UI effects

Home aggregates direct, group-duel, tournament-duel, and group-membership cards.
The friendly widget owns its configuration panels, pending cancel control, and
matched/canceled/error UI; it does not share stale panel flags with Home. Its
buttons are serialized while a create/cancel request is pending. Group/tournament
duel invitations offer accept but no symmetric deny in the current UI.

## Network effects

RTK mutations create/accept/deny invitations. Runtime-validated WebSocket
handlers recognize direct, group-membership, group-duel, and tournament-duel
invitation events. They invalidate their owning invitation projection;
group-duel events also refresh groups, and tournament events refresh tournament
projections. Every reconnect broadly invalidates all active invitation/group/
tournament projections.

## Idempotency and duplicate handling

No action sends a client idempotency key. Some buttons use mutation loading,
but repeated clicks or multiple tabs can submit the same accept/deny. Backend
must reject or make repeated transitions safe. Repeated list invalidation is
safe. Supplied event cursors are deduplicated; current cursorless cancellation
effects still require matching pending nickname/configuration/tournament data.

## Ordering assumptions

Acceptance assumes HTTP success arrives before `DuelStarted`. Cancellation
matching assumes stored fields already describe that invitation. Events arriving
before local state, after another invitation starts, or without matching fields
can be ignored or reset the wrong flow.

## Failure handling

HTTP errors remain local; `409` has special friendly-create messaging. A failed
friendly create returns to an actionable error state; a failed cancel does not
leave its control disabled. A lost success response can leave a backend-accepted
invitation while UI remains idle.
Unknown/malformed WebSocket events are isolated. Every reconnect fetches the
active duel and all active invitation lists, but the backend still exposes no
single query for the precise outgoing pending workflow.

## Reload and multiple tabs

Persisted matching survives reload and is shared through localStorage bytes;
Home waiting/panel flags survive only in the same tab's sessionStorage. Tabs do
not broadcast accepted/canceled state. Old session keys survive logout and can
be presented to another user in the same tab.

## Implementation references

- `src/widgets/friendly-duel/`
- `src/pages/home/ui/HomePage.tsx`
- invitation APIs under `src/entities/duel-invitation`
- group invitation and group-duel APIs under `src/entities/group`
- tournament API under `src/entities/tournament`
- `src/features/duel-session/api/duelSessionApi.ts`

## Test coverage

- **Existing tests:** friendly state-machine tests cover transitions, duplicate
  cancellation, late match after cancellation, mutation recovery, and conditional
  configuration loading; parser/router tests cover typed event isolation, and
  realtime integration covers duplicate/unknown events and reconnect lifecycle.
- **Needed integration:** all four invitation families, exact event types/fields,
  accept/event order permutations, duplicate accepts, cancellation matching.
- **Needed E2E:** inviter/invitee browsers, reload and logout during wait,
  two same-opponent invitations, group/tournament updates, and two tabs.

## Current guarantees

Normal successful direct create/accept records enough fields to match direct
cancel/deny; direct list mutations invalidate their cache; backend remains the
authorization boundary; `DuelStarted` can activate an accepted duel.

## Open questions

Invitation type vocabulary, a common invitation ID, group ID in cancellation,
deny behavior for every family, expiration, post-accept navigation, and
cross-tab ownership require an explicit contract.

## Proposed requirements

Use a versioned discriminated invitation payload with immutable ID/type/context;
support idempotent accept/deny/cancel; handle every backend event; reconcile
pending state on load/reconnect; and remove identity from ad hoc nickname fields.
