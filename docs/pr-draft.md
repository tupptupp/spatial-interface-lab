# Beyond the Surface: original chrome sculpture and interactive material study

An original procedural chrome sculpture with deterministic scroll camera choreography and a keyboard/touch material lab for roughness, bounded rotation and light angle. Semantic HTML, reduced-motion/still mode and a static failure fallback keep the experience readable without WebGL.

The rendering pipeline uses built-in PBR materials, procedural reflection lighting, a bounded reveal, one GPU frame in flight and demand rendering with one-way quality reduction. Geometry is reproducible and tested. No backend, AI service, commercial/private assets or paid services are used. A production-build guard enforces the preview-only development boundary.

Validation: [runtime CI 38958637142](https://github.com/tupptupp/spatial-interface-lab/actions/runs/38958637142), source `65ac022da192cddd8e81796a3f4712f1f67eb6fc`, passed strict TypeScript, lint, formatting, 36 unit/integration/guard tests, build, all 11 Chromium scenarios and strict evidence capture. Actual desktop/mobile screenshots were opened and reviewed. Browser checks include scroll/reverse, keyboard controls/reset, 320/390/768px layouts, reduced motion, context loss/remount, axe, keyboard skipping and noscript. See docs/verification.md for the earlier failures and fixes.

Performance remains a release gate: forced SwiftShader recorded four completed-draw latency samples, median 1593.9ms and p95 3442.1ms, final balanced quality/DPR 1 at 1440×1000. This is slow CPU-submission/GPU-fence polling latency, not FPS or a hardware benchmark. Ready was observed at 4275ms; no JavaScript errors. Raw evidence is committed in docs/evidence.

A separate empty Vercel project exists, but an explicit project read still returns HTTP 403 for workspace `tupptupp1337-3910` after the owner connected the integrations. Source upload was denied; no preview deployment succeeded. Workspace access must be resolved before preview verification. No existing project was modified.

Keep this PR Draft. Main remains the minimal foundation. Do not merge or promote to production. Remaining review includes physical GPU/phone performance, Safari/Firefox, manual touch/focus, GPU resource reclamation, and material polish (dark glass core and limited local reflections/contact shadows). This is ready for manual code review as a draft, not a recruitment-ready release claim. Implementation and documentation are AI-assisted under the owner's brief.
