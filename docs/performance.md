# Performance evidence

Recorded 2026-10-16 in a Linux 6.18.44 x86_64 container, Node 24.19.0. The local container had no browser. Remote Chromium/SwiftShader verification subsequently became available; see the dated checkpoint below. These are build measurements and geometry calculations, not runtime benchmarks.

## Measured build output

| Resource         |  Minified | Gzip reported by Vite |
| ---------------- | --------: | --------------------: |
| HTML/UI JS       | 231.00 kB |              72.70 kB |
| Lazy 3D scene JS | 974.62 kB |             263.94 kB |
| CSS              |   8.24 kB |               2.62 kB |

The 3D chunk exceeds Vite's 500 kB warning threshold. The warning is retained, not suppressed. Lazy loading avoids requesting it in reduced-motion mode; it does not reduce the cost for visitors who enter 3D. Most of it is the renderer and its React bridge. Further chunk splitting should be evaluated with a measured loading waterfall rather than claimed as an automatic speed improvement.

The committed static posters are compact CPU-study WebPs (see actual file sizes in the checkout); the concept-study CPU rasterizer is not shipped to browsers. No HDR, font or model download is required.

## Calculated scene budgets

| Setting                                                        |   High | Balanced |
| -------------------------------------------------------------- | -----: | -------: |
| Maximum DPR                                                    |    1.6 |      1.0 |
| Longitudinal blade segments                                    |    160 |       96 |
| Blade cross-section segments                                   |     24 |       24 |
| Cubemap face resolution                                        |    256 |      128 |
| Scene triangles, excluding preprocessing/multipass duplication | 23,638 |   14,422 |

Counts include three blades, the core, plinth, floor and five background fins. Transmission, environment capture and PMREM preprocessing add rendering work. `gl.info` reports renderer-pass counters, not total wall-clock GPU cost. Do not report these budget calculations as measured draw-call totals or GPU memory usage.

## Adaptive strategy

DPR starts at min(devicePixelRatio, 1.6). Three consecutive windows of 90 active frame intervals with median above 30 ms downgrade to balanced quality. A healthy window resets the slow streak. Three consecutive intervals above 250ms also downgrade immediately, allowing severe GPU load to be recognized without waiting for 270 frames. There is no automatic upgrade and thus no repeated quality oscillation. Inactive time and tab transitions are excluded. Intervals above 1000 ms are ignored as discontinuities; this means extreme stalls can be underrepresented and need separate manual inspection.

Rendering is demand-driven after the bounded reveal and short activity window. There is no sustained idle animation. The adaptive strategy is unit tested; its visual and device behavior is unverified.

## Prepared runtime evidence collection

`npm run evidence:capture` saves actual desktop/mobile screenshots and `docs/browser-evidence.json` after a successful browser launch. It records the browser version, viewport, canvas pixel dimensions, DPR, quality, last-pass renderer counters, navigation timings, errors, active-frame sample count, median and p95 during an eight-second RAF scroll workload.

The initial pipeline sampled CPU/browser scheduling. The current bounded pipeline records CPU update/submission plus GPU-fence completion latency for each completed draw: an upper bound including polling and scheduling, not disjoint GPU timer queries or presentation FPS. At most one main frame may be pending. The original software-runner screenshot stalled for approximately 30s after all material assertions passed; this is documented evidence of a queue/readback problem, not a hardware benchmark. Software SwiftShader is useful for reproducibility but not representative of a physical GPU. Page-ready timing is relative to navigation time origin, not a Web Vital. No such results have been recorded yet. No Lighthouse, FPS, GPU-memory, Safari or physical-device result is claimed.

## Reviewed remote checkpoint

Run 38956443595: Chromium 156.0.8078.4 on Ubuntu/SwiftShader, 1440×1000 viewport and render pixels, DPR 1, high quality. Ready was observed at 4941.8ms relative to navigation time origin; no JavaScript errors were recorded. All eleven browser scenarios passed. The old activity filter produced zero interval samples, so median and p95 were null. This is an instrumentation limitation, not a 60 FPS result. The latest patch makes sampling follow input-active GPU submissions and rejects an empty capture. Its measured results will be reported only after inspection.

The fourth CI run again passed every functional/browser check, but its evidence step rejected an empty sample set. The final sampler removes the activity heuristic entirely and measures each completed draw directly, excluding visibility-disrupted samples. The buffer is reset immediately before the scroll workload. The strict non-empty assertion is retained.
