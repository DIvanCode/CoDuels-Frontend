# Frontend agent guide

## Stack and structure

- Use Node.js 24 and pnpm 10, matching Docker and GitHub Actions.
- The app uses React 19, TypeScript 5.9, Vite 7, Redux Toolkit/RTK Query, redux-persist, Monaco Editor, and SCSS.
- Preserve Feature-Sliced Design boundaries: `app` -> `pages` -> `widgets` -> `features` -> `entities` -> `shared`. Use public `index.ts` exports and configured aliases instead of reaching into another slice's internals.

## Data and realtime rules

- Add HTTP endpoints by injecting into the shared RTK Query `apiSlice`; keep authentication refresh in `shared/api`.
- Keep one authenticated WebSocket lifecycle in `features/duel-session`. Compose it in `api/duelSessionApi.ts`, keep business-agnostic connection mechanics under `api/realtime/transport.ts`, and keep validated domain effects under `api/realtime/domain`. Do not create a second competing socket or import domain caches into the transport.
- Keep API payload names compatible with backend JSON contracts. Update runtime validation (`superstruct`) where an affected response already uses it.
- Anti-cheat actions must stay synchronized with Duely and Analyzer. Use `$coduels-anticheat` for changes to editor/action tracking.
- Persist only state that must survive reloads; review the redux-persist whitelists when adding persisted fields.
- Co-locate SCSS with the owning component and follow the existing Prettier configuration.

## Verification

- Install with `pnpm install --frozen-lockfile`.
- Run `pnpm lint`, `pnpm fsd:lint`, and `pnpm build` for source changes.
- Run `pnpm test` for the Vitest unit/integration suite when the affected behavior has coverage.
- Set `VITE_BASE_URL=http://localhost/api` for the normal local Nginx-backed environment.
- The pull-request workflow runs ESLint, reports FSD lint without blocking on it, builds and pushes the pull-request image, and deploys it automatically without a GitHub Environment approval. The deploy job checks out its playbook from the trusted base revision while keeping the image tag at the pull-request `github.sha`. Pushes to `master` do not deploy Frontend.
- Pushing to an open same-repository Frontend pull request can start its production deployment. Do it only when the user explicitly authorizes the push and its deployment effect.

## Frontend process documentation

- Before changing a user process, read its document in `docs/processes`.
- Do not analyze a React component independently of Redux, RTK Query, browser storage, and backend events.
- For every duel-flow change, check the HTTP request, WebSocket event, Redux transition, cache update, navigation, reload behavior, and multiple-tab behavior.
- The backend is the source of truth for duel, invitation, group, tournament, and submission state.
- Persisted Redux must not automatically be treated as current backend state.
- When adding a persisted field, document its owner, reset trigger, schema version, user-switch behavior, and tab behavior.
- Keep one authenticated WebSocket lifecycle composed by `features/duel-session/api/duelSessionApi.ts` when changing realtime behavior; extend the typed parser/router and owning domain handler rather than adding another event switch or socket.
- Do not create a second competing user WebSocket.
- A WebSocket-event change requires corresponding frontend handler, applicable runtime validation, process documentation, backend contract documentation, and tests.
- Matchmaking changes must account for disconnect and backend cleanup of pending duels.
- Invitation-flow changes must treat Friendly, Group, and Tournament types separately.
- An RTK Query endpoint change must account for every cache entry and manual cache update that represents the affected state.
- Do not treat cache invalidation as equivalent to an immediate UI change.
- Submission-flow changes must account for out-of-order and duplicate WebSocket events.
- A terminal submission state must not be replaced by an older non-terminal state.
- Code-editor state changes must account for reload, logout, user switch, and multiple tabs.
- Code-sync changes must account for privacy configuration and `should_show_opponent_solution`.
- Anti-cheat tracking changes must remain synchronized with Duely and Analyzer.
- Do not claim reliable delivery from browser lifecycle events without evidence.
- UI permission checks do not replace backend authorization.
- If documentation and code differ, report the mismatch explicitly.
- Current behavior must not automatically be treated as the correct product requirement.
- Keep `Proposed requirements` separate from `Current behavior`.
- When a process changes, update or add tests for state transitions, reload, multiple tabs, duplicate events, out-of-order events, HTTP failure, WebSocket failure, cache reconciliation, permission errors, and persisted state.
