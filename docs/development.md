# Development

## Setup

Use Node 22.18+ and the committed npm lockfile. Run `npm ci`, `npm run dev`; default host is loopback only. Use `npm run dev -- --host 0.0.0.0` only when deliberately exposing the local server to a test device.

`npm run build` type-checks and compiles to `dist`; `npm run preview` serves on 127.0.0.1:4173. Browser tests run against a production build, not the Vite development graph.

## Checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Playwright uses Chromium/SwiftShader with one worker to limit software-rendering contention. Treat its results as emulation, not hardware performance or Safari compatibility. Real-device checks remain required. Do not update tests to accept missing rendering or to hide a failure.

`npm run assets:generate` regenerates two fallback WebPs and three CPU concept PNGs from the original geometry. The geometry resolution in the offline tool differs from the runtime; illumination is approximate. These are committed assets, so end users need no authoring software.

`npm run evidence:capture` requires a reachable preview (default localhost:4173). The script captures actual screenshots and frame-interval diagnostics. Run it only against this project or an authorized preview URL. It accepts no credentials; never put secrets in `PREVIEW_URL`.

## CI and review workflow

The workflow runs lockfile install, type/lint/format/tests/build and, when a Playwright config exists, browser installation/tests. Browser evidence is retained as an Actions artifact for seven days. On the foundation-only main branch, browser steps are skipped because that optional suite does not yet exist.

Work belongs on `feature/chrome-sculpture`. Keep the eventual PR Draft while the open visual gates remain. Commits distinguish the foundation, geometry/choreography, experience/UI and verification tooling. AI-assisted authorship is explicit; do not present it as unaided production experience.

No merge, production deployment, paid service, other repository mutation or private-project asset reuse is authorized by this workflow.
