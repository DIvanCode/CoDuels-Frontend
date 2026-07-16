# Frontend process glossary

| Term | Meaning in current implementation |
| --- | --- |
| Auth state | Persisted Redux `user`, access `token`, and `refreshToken`. |
| `phase` | Persisted duel-session value: exactly `idle`, `searching`, or `active`. |
| Active duel | Backend `Duel` with `status="InProgress"`; the local `activeDuelId` is only a cached pointer. |
| RTK Query cache | Process/tab-local normalized-by-endpoint cache. It is not included in redux-persist. |
| redux-persist | Writes four reducer subtrees to shared-origin localStorage keys `persist:*`. |
| `lastEventId` | Persisted client field supported by the parser, but current Duely WebSocket messages contain no event ID and reconnect sends none. |
| Direct invitation | Backend Friendly pending duel. Home queries it with the client argument/type label `Ranked`. |
| Group invitation | Membership invitation, distinct from a group duel invitation. |
| Group duel invitation | Pending duel owned by a group with two selected participants. |
| Tournament duel invitation | Pending duel for a tournament match. |
| Task key | Duel slot such as `A`; distinct from Taski's 40-hex task ID. |
| Editor key | `${duelId}:${taskId}`; code is not keyed by user or task key. |
| Submission ID | Duely integer returned as `id` in detail/create and `submission_id` in list/events. |
| Terminal submission | Status exactly `Done`; WebSocket manual updates refuse to replace it with a nonterminal status. |
| Session storage | Per-tab browser storage; cloned in some browser tab-duplication flows but not live-synchronized. |
| Local storage | Shared by same-origin tabs; Redux instances do not automatically reconcile from later writes. |
| Conceptual socket state | Documentation labels such as requesting-ticket/connecting; Redux stores only `sessionInterrupted`, not a socket-state enum. |
| Current guarantee | Behavior established by current code/contracts, not an approved product promise. |

