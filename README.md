# BEYOND THE SURFACE

**Spatial Interface Lab / Experiment 001 — Chrome Sculpture**

An original interactive study of folded chrome, optical glass and spatial perception. A single procedural sculpture is explored through scroll-driven camera compositions, followed by a small keyboard-accessible material lab.

**Status: draft implementation, not a visually verified release candidate.** Local TypeScript, lint, unit/integration tests and production compilation pass. Local browser verification is blocked; remote Chromium verification has started. The first run exposed startup, narrow-layout and accessible-name defects, which are being corrected. The public [repository](https://github.com/tupptupp/spatial-interface-lab) and `feature/chrome-sculpture` branch are now published. [Draft PR #1](https://github.com/tupptupp/spatial-interface-lab/pull/1) is open. Remote CI verification is in progress; the first run passed 3 of 11 browser scenarios. No Vercel deployment exists.

![Offline study of the selected folded geometry](docs/studies/fold.png)

_Offline CPU illustration of the original geometry. This is not a screenshot of the WebGL application. Actual WebGL screenshots are being collected through CI; approved portfolio captures remain a release requirement._

## The experience

- A bounded 1.1-second exposure reveal introduces the sculpture.
- Native scrolling moves through three authored viewpoints and a final inspection shot; reverse scrolling derives exactly the same transforms.
- The material lab changes chrome roughness, sculpture rotation and the key-light angle. Native range inputs support keyboard and touch; reset restores all three values.
- Reduced motion, rendering failures and optional still mode use a compact static illustration with complete HTML content.
- The renderer sleeps after the introduction and 140 ms after scroll activity. It resumes for user input, resize or visibility changes.

## Run locally

Node **22.18+** (tested with Node 24.19.0).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Serve the build; do not open `dist/index.html` directly.

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run preview
```

For the prepared browser suite:

```sh
npx playwright install --with-deps chromium
npm run test:e2e
```

For actual screenshots and profiling evidence, start `npm run preview` on port 4173, then run `npm run evidence:capture`. `PREVIEW_URL` may point to an authorized preview. No authentication headers, tokens or secrets are required by the application.

## Architecture and trade-offs

| Layer             | Responsibility                                                                   |
| ----------------- | -------------------------------------------------------------------------------- |
| `src/app`         | Semantic document, rendering lifecycle, fallback, lab UI                         |
| `src/animation`   | Pure camera keyframes, easing, chapter-to-progress mapping                       |
| `src/scene`       | Original BufferGeometry, PBR materials, procedural environment, render loop      |
| `src/interaction` | Clamped control parameters and live motion preference subscription               |
| `src/performance` | Bounded quality configuration and downgrade hysteresis                           |
| `tests`           | Geometry, choreography, state, lifecycle, deployment guard and browser scenarios |

React + strict TypeScript + Vite, Three.js, React Three Fiber and selected Drei environment helpers. No backend, database, authentication, AI service, external model, font download or third-party texture. No GSAP or custom GLSL: the pure scroll mapping and built-in PBR materials meet the current requirements without those additions.

The optional scene is split from the HTML/UI bundle. It is still a large dependency payload (~973 kB minified, ~263 kB gzip in the recorded build); lazy loading avoids it in reduced-motion mode but does not eliminate its download cost for 3D visitors.

## Evidence and review

30 local unit/integration/guard tests pass. Eleven Playwright scenarios are authored. The first remote run passed 3 and failed 8, exposing startup timing, a small-screen control position and accessible-name issues. Local browser launch remains blocked. This is **not** a passing browser suite. Safari, Firefox, physical mobile devices, accessibility in a real browser, actual GPU resource cleanup and visual quality are unverified. No FPS or Lighthouse claim is made.

See [verification](docs/verification.md), [performance](docs/performance.md), [rendering](docs/rendering.md), [architecture](docs/architecture.md), [design decisions](docs/design-decisions.md), [development](docs/development.md) and [engineering review](docs/review.md).

## Authorship and assets

The owner supplied the concept, brief, constraints and portfolio goals. Implementation, tests, documentation and the procedural illustration tool were AI-assisted. Verification claims describe only checks actually run. This is a portfolio study, not a claim of professional production experience.

Geometry, illustrations and page styling were created for this project. Dependencies retain their respective licenses. No commercial studio code, shaders, artwork, textures or fonts, and no private Formodo assets, are included. No outbound analytics or application data collection is implemented. A distribution license for the original project has not been selected by the owner.

## Release boundary

Development belongs on `feature/chrome-sculpture`. `main` contains only the minimal working foundation. Do not merge or promote to production without explicit owner approval. The feature build actively rejects `VERCEL_ENV=production`. Repository creation and a separate Vercel Preview connection remain external setup tasks; [handoff](docs/handoff.md) describes them.
