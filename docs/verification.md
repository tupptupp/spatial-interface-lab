# Verification record — 2026-10-16

## Completed locally

- Node 24.19.0, strict TypeScript compile: pass.
- ESLint, including React hooks rules: pass.
- Unit/integration/production-guard suite: **30 tests pass**.
- Vite production compilation: pass; the large 3D chunk warning remains.
- `npm audit`: completed, zero known advisories reported by the registry at the time of the check. This is not a comprehensive security guarantee.
- Offline CPU geometry illustrations: generated, opened and compared. These are not application screenshots.
- Main foundation compiled before feature work; only the minimal foundation remains on main. Substantive work is on the local feature branch.

The pure tests cover keyframe endpoints, finite clamping, exact reverse travel, continuity, mobile viewing distance, easing, section mapping, topology validity, triangle area, seam normals and mesh closure after welding coincident seam positions. Quality tests cover hysteresis, isolated spikes, idle gaps and recovery of a healthy sample window. UI tests cover range updates/reset, static mode, renderer lifecycle, synthetic failure/retry and reduced-motion mount behavior. Four deployment tests exercise the build guard in preview/development/local and production environments.

## Browser attempt — blocked, not passed

`npx playwright install chromium` was denied network access to `https://cdn.playwright.dev:443` by this environment's policy. No alternate download, policy bypass or sandbox escalation was attempted.

`npm run test:e2e -- --workers=1 --max-failures=1` discovered eleven scenarios but failed at the first browser launch because the Chromium headless executable was absent. Ten remaining scenarios did not run. Zero browser assertions were reached. The generated failure trace is a launch failure, not a recording of the application.

The prepared suite covers rendering startup, scroll/reverse, keyboard range manipulation, three responsive sizes, reduced-motion bundle avoidance, mode switching, genuine context loss where the extension exists, axe accessibility scanning, keyboard skipping and JavaScript-disabled fallback. The existence of these tests is not evidence of their passing.

## Remote state — update after owner created the repository

The owner created the public `tupptupp/spatial-interface-lab` repository. It was inspected as empty before writing. The minimal foundation has been published on main, followed by feature/chrome-sculpture and separate geometry/experience milestones. The connected tools recreated these commits from identical Git blob contents; remote commit IDs differ from the original local history. The Git bundle from the initial delivery remains a record of that earlier local history, not a replacement for the published remote.

A Draft PR and remote CI review are being prepared. The workflow now collects actual browser screenshots and frame-interval diagnostics when the browser checks pass. These outputs remain unverified until a run completes and is inspected.

No Vercel project or deployment has been created. No other repository or existing deployment has been changed.

## Release blockers

Actual desktop/mobile visual inspection, browser test results, realistic GPU profiling, context-loss recovery and resource-disposal inspection remain required. Chromium compatibility is unverified; Firefox, Safari and physical mobile devices are also unverified. No automated accessibility scan has run in a browser. Do not call this a completed portfolio release or a reviewed production candidate.
