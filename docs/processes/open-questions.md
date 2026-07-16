# Frontend open questions and risks

The table separates observed behavior from intent. Entries marked confirmed are
code/contract discrepancies; they are not fixed by this documentation task.

| Area | Observation | Status / question |
| --- | --- | --- |
| Event cursor | `lastEventId` is persisted and parsed, but current Duely sends flat messages without it and reconnect never supplies it. | Confirmed unused with current backend; should replay/cursor support exist? |
| Socket close | Ticket/constructor failures retry after 3000 ms, but normal `onclose` only raises the interrupted modal. | Confirmed; is automatic reconnect intentionally disabled? |
| Reconnect button | It performs `window.location.reload()`. Closing the modal only clears the flag and leaves the socket closed. | Confirmed; what recovery UX is required? |
| Socket URL | Client forces `ws:` even when `VITE_BASE_URL` is HTTPS. | Confirmed compatibility risk; production scheme contract needs definition. |
| Multiple tabs | Duely accepts one socket/user, replaces the old one, then old-connection cleanup can remove the new registry entry and cancel pending duels. | Confirmed cross-layer race; see backend WebSocket docs. |
| Searching close | Any socket close changes local searching to idle before checking backend; backend disconnect cancels broader pending states. | Confirmed; should backend reconciliation precede UI reset? |
| Persisted search | Reload explicitly resets searching only for Navigation Timing `reload`; browser reopen/navigation can retain it after backend cleanup. | Confirmed stale-state risk. |
| Restore thunk | `getActiveDuel.matchFulfilled` calls the thunk creator inside a reducer without dispatch. The manager later dispatches it only when phase is idle. | Confirmed ineffective reducer call; are all phase/ID combinations intentionally covered? |
| Logout cache | Logout clears auth, session (through manager), editor (extra reducer), and anti-cheat queue through token lifecycle, but does not call `apiSlice.util.resetApiState`. | Confirmed old-user cache risk; which caches must be purged? |
| Logout browser state | Home/sessionStorage, result dismissal, run panel, and local configuration data are not cleared. | Confirmed cross-user/stale UI risk. |
| Editor ownership | Logout does clear editor Redux, but same-origin tabs are unsynchronized and can later rewrite shared persisted state. | Confirmed multi-tab caveat; should code be user-scoped? |
| Refresh trigger | Both 401 and `FETCH_ERROR` attempt refresh; any refresh network/validation failure logs out. | Confirmed offline logout behavior; was `FETCH_ERROR` intentional? |
| Refresh mutex | Waiters can return the captured old `state.auth.token`; retry headers read current store, but a stale/null return can suppress retry. Mutex is per tab. | Confirmed race surface; should state be re-read after wait? |
| Token security | Access and refresh tokens live in JavaScript-readable localStorage. | Confirmed XSS exposure; is cookie-based refresh desired? |
| Runtime validation | Login/user/duel/group/tournament/submission/WebSocket data use TypeScript casts; only refresh tokens and fetched test cases use Superstruct. | Confirmed contract-drift risk. |
| Early `DuelStarted` | Start/accept handlers set `searching` after HTTP success. An event arriving first sets active, then the late handler regresses phase to searching. | Confirmed ordering race. |
| Duplicate/old duel event | No event ID/order check exists. An old `DuelStarted` can reactivate a finished duel; an unrelated `DuelFinished` resets the current session. | Confirmed. |
| Backend event names | Frontend does not handle current `GroupDuelInvitation`, `GroupDuelInvitationCanceled`, or `CodeRunStatusUpdated`; it handles nonexistent current `DuelCanceled` and tournament-canceled aliases. | Confirmed contract mismatch. |
| Tournament cancel payload | Backend uses generic `DuelInvitationCanceled` without `tournament_id` in accept flow; Tournament matching requires that ID. | Confirmed potential stuck waiting state. |
| Invitation typing | Direct Friendly invitations are queried/transformed with client type `Ranked`; sender stores `Friendly`, receiver stores `Ranked`. | Confirmed semantic mismatch. |
| Group matching | Group waiting does not persist group ID/type; cancellation matching uses only opponent/config, so equal invitations across groups can collide. | Confirmed. |
| Submission-before-cache | Status events update only existing detail/list entries. Unknown submissions are ignored. | Confirmed lost manual update; what should be inserted/refetched? |
| Submission entries | Submit response updates only the exact filtered list arg; detail updates only unfiltered `{taskKey:null}` list. | Confirmed list/detail/filter divergence risk. |
| Terminal protection | WebSocket patches protect `Done`, but HTTP merge/detail/refetch can still replace cache data without the same conflict rule. | Confirmed incomplete guarantee. |
| Reconnect invalidation | On open invalidates `Submission:LIST`/`Tournament:LIST`, but their queries provide `LIST-{duelId}`, entity IDs, or `GROUP-{id}`. Duel/group entity caches are also not broadly covered. | Confirmed stale-cache mismatch and request fan-out risk for tags that do match. |
| Tournament bracket | Duel finish/invitation messages do not invalidate tournament detail/group tags. | Confirmed stale bracket risk. |
| Task types | Frontend Task model accepts only `write_code`; Taski also exposes `find_test` and `predict_output`. | Confirmed contract subset; are duel tasks guaranteed WriteCode? |
| Direct URLs | UI permission/read-only gates do not replace Duely authorization; invalid duel ID can still lead child widgets to query `/duels/NaN`. | Confirmed. |
| Active navigation | Socket manager changes Redux globally but only Home/session-button effects navigate. An event on another route can leave an active duel without navigation. | Confirmed. |
| Duel finish ordering | Listener resets the session before invalidation effects/refetch complete. | Confirmed; could UI/header lose needed context? |
| Editor conflict | Every successful duel fetch applies backend solutions over persisted local drafts; a pending 500 ms local debounce can then overwrite Redux again. | Confirmed race; define conflict winner. |
| Code sync scope | Interval checks privacy flag but not participant, duel status, or `phase`; spectators/finished pages can attempt sends that backend must reject. | Confirmed defense-in-depth gap. |
| Code sync delivery | Only selected task, full code, at most once per second/change; last edit can be lost at close and two tabs can send divergent versions. | Confirmed best-effort behavior. |
| Home persistence | Forms/modals/nickname/config/waiting/pending action IDs are per-tab, unversioned, not user-scoped. Reload mid-deny can leave a permanently disabled item. | Confirmed. |
| Run panel | Persisted `running` state contains no run ID, so reload cannot resume polling and can display stale running forever. | Confirmed. |
| Configuration local cache | `duel-configurations` duplicates backend configuration data, is unversioned/user-independent, and is not initialized from the server. | Confirmed stale/cross-user risk. |
| Sequential task snapshot | Snapshots/opened keys are memory-only. Reload establishes a new baseline and shows no newly-opened notification. | Confirmed; is that acceptable? |
| Anti-cheat delivery | Queue is memory-only; `finally` clears all events even on fetch rejection/non-2xx/`shouldSend=false`; no `sendBeacon`, ack, or retry. | Confirmed loss semantics. |
| Anti-cheat concurrency | Events added during a flush can be cleared with the sent queue; sequence counters reset after every flush and per tab. | Confirmed ordering/loss risk. |
| Spectator tracking | Auto-flush requires participant, but editor trackers are enabled only after participant check; code-sync interval itself is not participant-gated. | Mixed controls; require browser/backend E2E validation. |
| Corrupt/old persistence | Persist configs are version 1 but no migrations are supplied; custom storage hooks silently fall back on parse failure and then overwrite. | Confirmed; define migration/quarantine policy. |
| Protected network error | With a token, non-401 `getMe` failure displays Loader indefinitely; original URL is not saved across auth redirect. | Confirmed UX/recovery gap. |
| Group bulk invites | `Promise.allSettled` results are ignored, so forms close on partial or total invite failure. | Confirmed false-success UI risk. |

