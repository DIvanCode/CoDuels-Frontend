# Groups

## Purpose

Describe group discovery, creation, membership invitations, member/role
management, leave behavior, and navigation among group sections.

## Participants

Groups page, Group page/layout/redirect, group entity APIs, create/invite/edit
forms, authenticated user, Creator/Manager/Member roles, Duely, and RTK cache.

## Entry points

`/groups`, `/groups/:groupId`, members/duels/tournaments child routes, create
group, invite users, accept/deny membership, edit role, remove/leave group, and
open a shared/deep URL.

## Preconditions

Authentication is required. Route ID must identify a group the backend permits
the user to inspect. Mutations require backend membership/role authorization;
client `canManage` and hidden controls are convenience only.

## Current behavior

The groups list supports create and leave. Creation first creates the group,
then sends selected invitations concurrently with `Promise.allSettled`; failures
are ignored and the form closes, allowing partial success to look complete.
Existing-group invitation behaves similarly. `/groups/:id` redirects to
`members`; the page loads group and users, renders members/duels/tournaments,
and shows modal/status handling for selected `403/404` errors. Roles are exactly
`Creator`, `Manager`, `Member`; membership statuses include `Active`, `Pending`.
Creators can edit non-creators; managers can edit members; self-edit is hidden.
Pending memberships are labeled separately from active members, and an inviter
with permission gets an explicit cancel-invitation action instead of an
exclude-member action.

## Client state transitions

Lists/details change through RTK responses and invalidation. Forms and selected
invitees are component state and disappear on unmount/reload. Successful leave
navigates to `/groups`. Role/member mutation success refetches tagged group data;
there is no persisted group workflow slice.

## Backend state assumptions

Duely owns membership, unique roles, invitation state, and permission checks.
The client assumes its group/user DTO fields and role strings are current.
Another tab/user can change access at any time, so cached `canManage` is not an
authorization guarantee.

## State ownership

Group domain state belongs to Duely and is cached in RTK Query. Route owns the
selected group/section. Component state owns modals/forms. Home sessionStorage
owns only aggregated invitation presentation, not group membership truth.

## UI effects

Role and status determine action visibility. Group load `403/404` receives
special feedback; other failures are less specific. Leaving redirects; remote
removal or role downgrade does not proactively redirect or close already-open
forms until a request/event/refetch exposes it.

## Network effects

Queries fetch group lists/details/users. Mutations create, invite, accept/deny,
change role, remove member, and leave. Tag sharing around group ID drives
refetch. Membership and group-duel WebSocket handlers invalidate invitation and
group projections but do not carry a fully authoritative replacement group.

## Idempotency and duplicate handling

No invitation batch transaction or idempotency key spans the create-plus-invite
sequence. `Promise.allSettled` permits partial completion. Duplicate mutation
requests rely on backend conflict/transition handling. Cache invalidation is
repeatable but can refetch multiple active subscriptions.

## Ordering assumptions

Create must finish before invitations. Parallel invites have no client-defined
order. Role/member changes can race with each other, leave, remote removal, or
navigation; later responses/refetches determine visible cache state.

## Failure handling

Create failure prevents invites. Individual invite failures after create are
not summarized or retried by the form. Mutation errors generally keep local
forms available. Remote access loss surfaces on the next failed request; there
is no group-specific real-time exclusion handler.

## Reload and multiple tabs

Reload reconstructs group data from HTTP and loses form state. Tabs have
independent RTK caches and can show different roles/members until invalidation or
refetch. Logout does not explicitly purge sessionStorage invitation UI keys.

## Implementation references

- `src/pages/groups`
- `src/pages/group`
- `src/entities/group`
- group creation/invitation/member-management features
- `src/app/router/router.tsx`

## Test coverage

- **Existing tests:** none.
- **Needed integration:** permissions matrix, tag coverage, partial batch invites,
  access loss, duplicate mutations, `403/404` and generic failures.
- **Needed E2E:** create/invite/accept, role changes, leave/removal, deep routes,
  reload mid-form, concurrent manager tabs, and cross-user changes.

## Current guarantees

Backend endpoints remain the authority; successful create returns a real group
before invitations begin; normal leave navigates away; direct `/groups/:id`
lands on members; UI hides known-disallowed actions based on current DTO roles.

## Open questions

Whether invitation batches should be atomic, how partial success is presented,
how revoked access is pushed, which role changes may race, and whether a group
selection should persist are not specified.

## Proposed requirements

Return per-invite outcomes and expose retry; model permission failures globally;
version role/status contracts; invalidate or push access changes consistently;
and test backend authorization independently of visible UI controls.
