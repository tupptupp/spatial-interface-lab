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

[Draft PR #1](https://github.com/tupptupp/spatial-interface-lab/pull/1) is open. [Quality CI](https://github.com/tupptupp/spatial-interface-lab/actions/runs/38954053397) has started; results are pending. The workflow now collects actual browser screenshots and frame-interval diagnostics when the browser checks pass. These outputs remain unverified until a run completes and is inspected.

No Vercel project or deployment has been created. No other repository or existing deployment has been changed.

## Release blockers

Actual desktop/mobile visual inspection, browser test results, realistic GPU profiling, context-loss recovery and resource-disposal inspection remain required. Chromium compatibility is unverified; Firefox, Safari and physical mobile devices are also unverified. No automated accessibility scan has run in a browser. Do not call this a completed portfolio release or a reviewed production candidate.

## First remote browser run — defects found, fixes in review

[Run 38954053397](https://github.com/tupptupp/spatial-interface-lab/actions/runs/38954053397), Node 22.23.3 / Ubuntu 24.04.5 / Chromium with SwiftShader: typecheck, lint, format, 30 unit/integration tests and build passed. Browser results: **3 passed, 8 failed**. The material-control scenario, 390px responsive scenario and JavaScript-disabled fallback passed. Failures included cold startup exceeding the 15s assertion budget, first-slider placement below the 320px viewport and chapter accessible names omitting the visible numbers.

Actual artifact screenshots of the desktop lab, 768px composition and static/reduced-motion presentation were opened and reviewed. The portrait tablet artwork clipped at the right edge. A subsequent patch uses aspect-aware portrait framing, compacts the inspector spacing on short/narrow screens, includes visible numbers in chapter link names, halves transmission render-target resolution, retains the poster until a real frame arrives, and begins the reveal clock after frame submission. The software-runner startup budget is explicitly 30s, still requiring a real ready scene; no fallback acceptance or assertions were removed. A second run is required.

The first screenshots show actual WebGL but do not demonstrate release-level motion, GPU performance, resource reclamation or Safari compatibility. The core reads dark in these images and needs further material review.

## Second remote run and next correction

[Run 38955054916](https://github.com/tupptupp/spatial-interface-lab/actions/runs/38955054916): **9 browser scenarios passed, 2 failed**. Startup, forward/reverse camera, all three responsive widths, reduced-motion axe, mode switching, real context loss and noscript passed. The material scenario completed every functional assertion but timed out collecting its full-resolution screenshot. The keyboard skip target did not reach the viewport during CSS smooth scroll.

Trace inspection showed a roughly 30s screenshot readback, consistent with queued work on SwiftShader. The next patch removes animated anchor scrolling and adds non-blocking WebGL2 fence backpressure, limiting main rendering to one in-flight frame. Five new unit tests cover admission, zero-timeout polling, both completion statuses and cleanup/failure. Rendering is now marked ready only after the first GPU fence completes. The screenshot test retains all behavioral assertions; independent startup budgets are kept consistent on retry/context recovery. Reverification is required before this patch is accepted.

## Green browser checkpoint and current evidence refinement

[Run 38956443595](https://github.com/tupptupp/spatial-interface-lab/actions/runs/38956443595), source `2929571bce07af133a35c71cc745c8cc24f1d422`: **all 35 unit/integration/guard tests and all 11 Chromium scenarios passed**, along with typecheck, lint, formatting, build and evidence capture. The actual desktop reveal, desktop lab and mobile reveal PNGs were opened and reviewed. The canvas-rectangle captures contained composited HTML overlays and were rejected after inspection; the clean standalone CPU illustration remains the fallback. Their provenance is preserved below the README image.

The capture reported Chromium 156.0.8078.4, 1440×1000 render pixels at DPR 1/high quality, ready time 4941.8ms, no JavaScript errors, but **zero frame-interval samples**. Therefore no median, p95 or FPS can be claimed from that run. Its navigation/ready time is a software-runner observation, not a hardware target. The latest patch marks input-active submissions when they enter the GPU queue, includes long completed-frame intervals, resets timing at input-burst boundaries and fails capture if samples are empty or rendering falls back. Three consecutive >250ms completion intervals trigger a one-way severe-load downgrade. A new test brings the local total to 36. The refinement needs a fresh green CI run.

## Vercel state

A new, separate project named spatial-interface-lab was created. Git linking was rejected because the Vercel GitHub integration lacks access. Direct file upload was then rejected with HTTP 403 for workspace tupptupp1337-3910. No upload was accepted and no deployment was created. No existing project was modified. Workspace authorization must be resolved by the owner; the block was not bypassed.

## Measurement follow-up

Run 38957762929 passed all **36 unit/integration tests and 11 browser scenarios**, but the stricter evidence step correctly failed because the activity/interval filter still yielded zero samples. The next correction removes that heuristic: each completed draw records CPU update/submission time plus its non-blocking fence completion latency, with visibility-disrupted samples excluded. There are no idle draws, so no wall-clock idle interval is mixed into those measurements. The workload resets the sample buffer before starting. These are completion-latency upper bounds, not presentation FPS or GPU timer-query results.
