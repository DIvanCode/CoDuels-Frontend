# Local Windows/WSL development and verification

## Purpose

Use this runbook when Frontend work runs from WSL but the available Node.js,
pnpm, Chrome, and Playwright tools are Windows binaries supplied by Codex. Native
Linux Node 24 and pnpm 10 remain the simpler path when they are already present.

## Reliable setup

1. Load the Codex workspace dependencies and use the returned Node executable.
   Do not assume `node` or the `pnpm` shell wrapper is usable from WSL.
2. Put isolated worktrees on a Windows-mounted drive, for example
   `/mnt/d/CoDuels/.worktrees/frontend-issue-64`. Windows Node cannot reliably
   run pnpm scripts from a WSL-only `/tmp` worktree because `cmd.exe` rejects the
   UNC working directory.
3. Invoke the Windows pnpm CLI through the bundled Node executable. The pnpm CLI
   argument must use a Windows path such as
   `C:\Users\<user>\AppData\Roaming\npm\node_modules\pnpm\bin\pnpm.cjs`.
4. Install the locked dependencies in a Windows-readable layout:

    ```text
    <node.exe> <pnpm.cjs> install --frozen-lockfile --node-linker=hoisted --force
    ```

    A regular pnpm install launched from WSL can create Linux absolute symlinks
    inside `node_modules`; Windows Vite/Vitest then cannot resolve packages such
    as `monaco-editor`. The hoisted layout avoids those links. A Husky
    `not a git repository: (NULL)` message is non-blocking only when pnpm still
    exits successfully; always confirm `git status` afterward.

5. Run `test`, `lint`, `fsd:lint`, and `build` through the same Node/pnpm pair.
   The FSD check currently has repository-wide pre-existing findings; confirm the
   changed files add none and record the remaining baseline instead of silently
   calling the check successful.

## Production environment and browser smoke test

- Set `VITE_BASE_URL` inside the Windows process. A Linux prefix such as
  `VITE_BASE_URL=/api node.exe ...` may not cross the WSL-to-Windows boundary.
  Use `cmd.exe /C` (or PowerShell) to set the variable and run the build in one
  Windows command, then verify the built application requests the expected
  `/api` prefix.
- Serve the generated `dist` with `pnpm preview`; a Vite development server is
  not a production-bundle smoke test.
- Launch installed Chrome directly when needed, normally from
  `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- If bundled `playwright` cannot find `playwright-core`, locate the bundled
  `.pnpm/playwright-core@<version>/node_modules/playwright-core` directory and
  require that package directly. Discover the installed version rather than
  hard-coding it in product code.
- For authenticated smoke tests, use local fake Redux/browser state and
  intercepted API/WebSocket responses. Check a non-empty `#root`, no page error
  or application error-boundary entry, and the primary changed flow. Clean up
  temporary smoke scripts and stop the preview server afterward.

## Quick troubleshooting

| Symptom                                                  | Action                                                                                          |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `node` missing or pnpm reports `node: Permission denied` | Load bundled dependencies and invoke `node.exe` directly.                                       |
| `CMD.EXE ... UNC paths`                                  | Recreate the worktree under `/mnt/c` or `/mnt/d`, not `/tmp`.                                   |
| Vitest/Vite cannot resolve an installed package          | Reinstall with `--node-linker=hoisted --force`; verify the package is not a Linux symlink.      |
| Built requests omit the intended `/api` prefix           | Pass `VITE_BASE_URL` through `cmd.exe`/PowerShell and rebuild.                                  |
| `Cannot find module 'playwright-core'`                   | Require the bundled direct `playwright-core` path.                                              |
| Windows executable or Chrome is blocked by the sandbox   | Request the narrow execution approval; do not replace the browser gate with a dev-server check. |
