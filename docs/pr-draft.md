# Beyond the Surface: original chrome sculpture and interactive material study

Draft implementation of a procedural chrome sculpture experience. Native scrolling derives camera compositions from explicit keyframes; a final material lab controls roughness, bounded rotation and direct-light angle. Semantic HTML remains usable in static/reduced-motion and rendering-failure modes.

The implementation includes original closed blade geometry, shared resources, procedural reflection lighting, bounded exposure reveal, demand rendering and quality hysteresis. No backend, AI API, commercial assets or private-project assets are used. A Vercel production-build guard preserves the preview-only boundary.

Validation: strict TypeScript, ESLint, 30 unit/integration/deployment tests, production compilation and registry dependency audit passed locally. Browser suite is authored but BLOCKED: Chromium installation was denied by the authoring environment, so no browser assertions, actual screenshots, axe results, GPU performance or mobile visual checks are claimed. See docs/verification.md and docs/review.md.

Keep this PR Draft. Actual WebGL visual review, browser tests, hardware profiling and feature-preview verification are still release gates. Do not merge or promote to production without explicit owner approval. Implementation and documentation are AI-assisted under the owner's brief.
