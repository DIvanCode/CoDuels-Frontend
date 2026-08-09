# Admin dashboard

## Purpose

Give an administrator a read-only overview of users, pending and completed
work, groups, and tournaments at `/admin`.

## Participants

Administrator, protected router, admin page, domain RTK Query endpoints, Duely,
and the ordinary profile/group/tournament/duel pages used by dashboard links.

## Entry points

Direct navigation to `/admin`, reload, opening or closing a dashboard section,
following an entity link, or an authenticated non-admin opening the route.

## Preconditions

The browser has a valid authenticated session. Duely remains responsible for
authorization through `OnlyAdmin`; the route's normal authentication guard does
not replace that backend policy.

## Current behavior

The page first reads the `is_admin` claim from the access token. An authenticated
non-admin stays on `/admin`, sees the dedicated access-denied screen, and starts
no admin list queries. For an administrator, the page starts all eleven admin
list queries when it mounts. Users are displayed as active users followed by all
remaining users. Pending duels are split into
friendly, group, and tournament subsections, while ranked searchers have a live
waiting duration. Testing submissions are followed by the `Done` subset of the
all-submissions response. Testing rows use a yellow status, `Accepted` uses
green, and every other terminal verdict uses red. Each submission number links
to its detail inside the owning duel and selects the row's task through the URL.
Groups are sorted by the backend, and group names are used to enrich tournament
rows when that query is available.

All five main sections use accessible native `details` controls and start open.
Their open state is local to the page. Each data block has independent loading,
empty, and failure output. Any admin query returning 403 replaces the dashboard
with the same access-denied screen. This remains the fallback when a token claims
admin access but Duely rejects it. User, group, tournament, and duel links use
the existing application routes.

The current backend `DuelDto` does not identify whether an active or finished
duel originated as Friendly, Group, or Tournament and does not include related
group/tournament references. Those two lists therefore expose rated versus
unrated mode but cannot reproduce the requested type grouping. The current
`TournamentDto` contains `created_at`, not a tournament start time, so the table
labels and shows creation time.

## Client state transitions

Each query independently moves from uninitialized/loading to data, empty, or
error. The page derives inactive users, completed submissions, pending-duel type
groups, group-name lookup, and aggregate counts without persisting them.
Collapsible state resets to open when the page remounts.

## Backend state assumptions

Admin endpoints return creation-time ordering except groups, which are ordered
by name. `/users/admin/all` includes active users, so the client subtracts IDs
returned by `/users/admin/active`. `/duels/admin/submissions/all` includes both
testing and finished submissions, so the client keeps `Done` entries for the
completed subsection. Administrative submission rows expose `duel_id` and
`task_key`; the corresponding regular duel/detail endpoints must allow an admin
to read that duel and submission.

## State ownership

All displayed domain records belong to Duely. RTK Query owns their in-tab cache;
the page owns only collapsible state and a one-second clock used to render ranked
search wait time. No dashboard state is persisted.

## Failure handling

A missing or false `is_admin` access-token claim is treated as an authorization
failure before admin requests start. A 403 from any admin query is also treated
as an authorization failure. Other request failures remain local to the affected
data block, allowing other lists to stay usable. Missing group lookup data falls
back to `Группа #id`. Missing or invalid dates render an em dash.

## Reload and multiple tabs

Reload and each additional tab issue fresh admin queries because RTK cache is
not persisted. Tabs keep independent list snapshots and clocks; backend data is
not streamed into the dashboard.

## Implementation references

- `src/pages/admin`
- admin query endpoints under `src/entities/{user,duel,submission,group,tournament}`
- `src/app/router/router.tsx`, `src/shared/config/routes/appRoutes.ts`

## Test coverage

Helper tests cover access-token admin-claim parsing, active-user subtraction,
terminal-submission selection and status tones, submission deep-link building,
pending-duel grouping, waiting duration, and invalid dates. The publication
smoke test covers admin and non-admin authenticated cold startup at `/admin` and
the admin transition from a submission row to its detail inside the duel page.

## Current guarantees

The dashboard never grants authorization by itself; client-side claim parsing
only avoids known-forbidden requests, while Duely's `OnlyAdmin` policy remains
authoritative. It displays only data accepted by that policy, excludes active
users from the second user list, excludes non-terminal submissions from the
completed list, and keeps all entity links on declared application routes.

## Open questions

The backend contract still needs an explicit active/finished duel origin and its
group/tournament references, plus a tournament start-time field, before the UI
can exactly match the requested type grouping and time column.
