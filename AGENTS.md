# Frontend agent guide

## Stack and structure

- Use Node.js 24 and pnpm 10, matching Docker and GitHub Actions.
- The app uses React 19, TypeScript 5.9, Vite 7, Redux Toolkit/RTK Query, redux-persist, Monaco Editor, and SCSS.
- Preserve Feature-Sliced Design boundaries: `app` -> `pages` -> `widgets` -> `features` -> `entities` -> `shared`. Use public `index.ts` exports and configured aliases instead of reaching into another slice's internals.

## Data and realtime rules

- Add HTTP endpoints by injecting into the shared RTK Query `apiSlice`; keep authentication refresh in `shared/api`.
- Keep the authenticated WebSocket lifecycle and duel event cache updates in `features/duel-session/api/duelSessionApi.ts`. Do not create a second competing socket.
- Keep API payload names compatible with backend JSON contracts. Update runtime validation (`superstruct`) where an affected response already uses it.
- Anti-cheat actions must stay synchronized with Duely and Analyzer. Use `$coduels-anticheat` for changes to editor/action tracking.
- Persist only state that must survive reloads; review the redux-persist whitelists when adding persisted fields.
- Co-locate SCSS with the owning component and follow the existing Prettier configuration.

## Verification

- Install with `pnpm install --frozen-lockfile`.
- Run `pnpm lint`, `pnpm fsd:lint`, and `pnpm build` for source changes.
- There is currently no `test` script in `package.json`; do not claim a Frontend unit test suite ran.
- Set `VITE_BASE_URL=http://localhost/api` for the normal local Nginx-backed environment.
- This repository has no production deployment workflow. After a validated change is merged here, release it by advancing the `Frontend` submodule in a pull request to root `CoDuels`.
