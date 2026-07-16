# Frontend open questions and risks

The table separates evidence from impact and intent. Classifications mean:

- **Confirmed behavior:** directly observed in current code without asserting
  that it is correct or incorrect.
- **Confirmed defect:** current code cannot reliably achieve the operation it
  already attempts to perform.
- **Confirmed contract mismatch:** current producer and consumer contracts
  demonstrably disagree.
- **Potential risk:** the consequence depends on timing, environment, data, or
  user behavior and is not asserted as an observed production failure.
- **Product decision required:** current behavior is known, but the desired
  product rule is not defined.

| Area | Confirmed observation | Classification | Remaining question or possible impact |
| --- | --- | --- | --- |
| Event cursor | `lastEventId` is persisted and parsed, but current Duely sends flat messages without it and reconnect never supplies it. | Confirmed contract mismatch | Should replay/cursor support exist, or should the unused client state be removed? |
| Socket close | Ticket/constructor failures retry after 3000 ms, but established-socket `onclose` only raises the interrupted modal. | Confirmed behavior | Is automatic reconnect intentionally disabled? |
| Reconnect button | It performs `window.location.reload()`; clearing the modal flag alone leaves the socket closed. | Confirmed behavior | What recovery UX is required? |
| Socket URL | Client forces `ws:` even when `VITE_BASE_URL` is HTTPS. | Potential risk | An HTTPS deployment may reject mixed content; the production scheme contract needs definition. |
| Multiple tabs | Duely keeps one process-local socket/user; old-handler cleanup is not generation-aware. | Potential risk | An old handler can remove a newer registration or cancel newer pending state if the timing overlaps. |
| Backend close cleanup | The ordinary `finally` path attempts close, map removal, and `CancelPendingDuels`, but current-socket `CloseAsync` is not caught. | Potential risk | A close exception or process termination can prevent later cleanup; cleanup is not guaranteed for every termination. |
| Searching close | Any frontend socket close changes local searching to idle before backend reconciliation. | Product decision required | Should backend status be checked before the UI transition? |
| Persisted search | Reload explicitly resets searching only for Navigation Timing `reload`; browser reopen/navigation can retain it. | Potential risk | Persisted state can outlive backend pending-state cleanup. |
| Restore thunk | `getActiveDuel.matchFulfilled` calls a thunk creator inside a reducer without dispatching the thunk. | Confirmed defect | The manager covers only `phase=idle`; other persisted phase/ID combinations remain unreconciled. |
| Logout cache | Logout does not call `apiSlice.util.resetApiState`. | Potential risk | Old-user cache can remain until teardown/eviction and should have an explicit purge policy. |
| Logout browser state | Home/sessionStorage, result dismissal, run panel, and local configuration keys are not cleared. | Potential risk | These unscoped values can appear for a later user in the same browser/tab. |
| Editor ownership | Logout clears editor Redux, but tabs are unsynchronized and can later rewrite shared persisted state. | Potential risk | Should drafts be user-scoped and stale writers fenced? |
| Refresh trigger | Both `401` and `FETCH_ERROR` attempt refresh; refresh network/validation failure dispatches logout. | Confirmed behavior | Was offline logout intended? |
| Refresh mutex | Waiters return the token from a captured pre-wait state; the mutex is per tab. | Potential risk | A stale/null return can suppress replay even though retry headers otherwise read current Redux. |
| Token storage | Access and refresh tokens are stored in JavaScript-readable localStorage. | Potential risk | Define the accepted XSS threat model and whether cookie-based refresh is required. |
| Runtime validation | Most HTTP/WebSocket DTOs use TypeScript casts; refresh tokens and fetched test cases use Superstruct. | Potential risk | Contract drift can become silent state corruption; define required runtime-validation coverage. |
| Early `DuelStarted` | An event can set `active`, then a later successful start/accept handler writes `searching`. | Confirmed defect | Transitions need a request/session generation or order-independent reducer rule. |
| Duplicate/old duel event | Duel events have no client event ID or generation check. | Potential risk | A delayed start/finish can affect a later session if delivery is reordered or duplicated. |
| Backend event names | Frontend ignores current `GroupDuelInvitation`, `GroupDuelInvitationCanceled`, and `CodeRunStatusUpdated`, while handling event aliases not emitted by current Duely. | Confirmed contract mismatch | Align the exhaustive event registry and compatibility policy. |
| Tournament cancel payload | Current generic `DuelInvitationCanceled` can omit `tournament_id`, while frontend tournament matching requires it. | Confirmed contract mismatch | Define an immutable invitation/tournament identity in every cancellation. |
| Invitation typing | Direct Friendly invitations are queried/transformed as client type `Ranked`; sender and receiver persist different type labels. | Confirmed contract mismatch | Align domain vocabulary and migration/compatibility behavior. |
| Group matching | Waiting state does not retain group ID/type and matches opponent/configuration only. | Potential risk | Equal invitations across groups can collide if they overlap. |
| Submission-before-cache | Status events update only existing detail/list entries; unknown submissions are ignored. | Confirmed behavior | Should the event upsert or invalidate a matching list? |
| Submission entries | Create updates only the exact filtered list arg; detail updates only the unfiltered `{taskKey:null}` list. | Confirmed behavior | Define normalization/reconciliation across all filters. |
| Terminal protection | WebSocket patches protect `Done`; normal HTTP merge/detail/refetch does not apply the same rule. | Potential risk | A late HTTP snapshot can regress displayed terminal state without a revision. |
| Reconnect invalidation | Socket open invalidates `Submission:LIST` and `Tournament:LIST`, but queries provide different IDs. | Confirmed defect | The intended reconnect reconciliation does not target those cache entries. |
| Tournament bracket | Duel finish/invitation events do not invalidate tournament entity/group tags. | Potential risk | An already-cached bracket can remain stale until another refetch trigger. |
| Task types | Frontend models only `write_code`; Taski also defines `find_test` and `predict_output`. | Product decision required | Are duel tasks contractually restricted to `write_code`? |
| UI permissions | Read-only/hidden controls do not replace Duely authorization. | Confirmed behavior | Backend authorization must remain the security boundary. |
| Invalid duel URL | Child widgets can issue `/duels/NaN` after an invalid route parameter. | Confirmed defect | Validate the route once before rendering/querying children. |
| Active navigation | Socket manager updates Redux globally, but only Home/session-button effects navigate. | Product decision required | Should every `DuelStarted` force navigation from every route? |
| Duel finish ordering | Listener resets the session before invalidation/refetch completes. | Product decision required | Define which context must remain visible until result data is loaded. |
| Editor conflict | Duel hydration and a pending local debounce both write the same persisted draft without revisions. | Potential risk | Define the conflict winner and acknowledgement model. |
| Code sync scope | Interval gates on privacy/socket state, not participant, duel status, or local phase; Duely performs final authorization. | Confirmed behavior | Is stricter client gating required for traffic/UX, without treating it as security? |
| Code sync delivery | Only the selected task is sent, at most once per second/change, without acknowledgement or final flush. | Confirmed behavior | Define acceptable loss/conflict behavior at close and across tabs. |
| Home persistence | Forms, selected configuration, waiting state, and pending IDs are per-tab, unversioned, and not user-scoped. | Potential risk | Reload or user switch can retain stale/disabled UI. |
| Run panel | Persisted `running` state has no run ID, so reload cannot resume its polling. | Confirmed defect | A reloaded panel can remain in an unrecoverable local running state. |
| Configuration local cache | `duel-configurations` duplicates backend data and is unversioned/user-independent. | Potential risk | Define whether it is a draft cache, a durable source, or should be removed. |
| Sequential task snapshot | Open-task snapshots are memory-only and reload establishes a new baseline without a notification. | Product decision required | Is suppressing historical open-task notifications after reload intended? |
| Anti-cheat delivery | Queue is memory-only and `finally` clears it after rejection, non-2xx resolution, or `shouldSend=false`; there is no ack/retry. | Confirmed behavior | Define acceptable loss rate and delivery/retention requirements. |
| Anti-cheat concurrency | Events added during a flush share mutable queue cleanup; sequence counters reset after every flush and per tab. | Potential risk | Events can be lost or streams can have ambiguous order under overlap. |
| Anti-cheat backend validation | Duely checks payload `UserId` against the authenticated user and filters missing/finished duels, but does not verify duel participation or task existence. | Confirmed behavior | Should participation and task membership be required at ingestion? |
| Anti-cheat duplicates | `EventId` has no unique constraint and the save handler does not look it up. | Confirmed behavior | Reposting a batch can create duplicates; decide whether `EventId` is an idempotency key. |
| Spectator tracking | Editor tracking is participant-gated, while code-sync interval itself is not participant-gated. | Product decision required | Validate desired browser behavior separately from backend authorization. |
| Corrupt/old persistence | Persist configs are version 1 without migrations; custom hooks fall back on parse failure and later overwrite. | Potential risk | Define migration, quarantine, and recovery policy. |
| Protected network error | With a token, non-401 `getMe` failure leaves Loader; auth redirect does not preserve the original URL. | Confirmed behavior | Define bounded error/offline and return-navigation UX. |
| Group bulk invites | `Promise.allSettled` results are ignored and forms close after the batch settles. | Confirmed behavior | Define how partial/total invite failure should be reported and retried. |
