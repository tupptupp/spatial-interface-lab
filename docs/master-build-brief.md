# MASTER BUILD BRIEF — SPATIAL INTERFACE LAB

## Project 01: CHROME SCULPTURE

### Autonomous Creative Engineering, Implementation & Quality Assurance

**Mission:** Build an original, visually exceptional, technically rigorous interactive 3D web experience that demonstrates advanced creative development, WebGL engineering, interaction design, performance optimization, accessibility, and software craftsmanship.

**Repository owner:** `tupptupp`

**New repository:** `tupptupp/spatial-interface-lab`

**Project name:** Spatial Interface Lab

**Experience title:** BEYOND THE SURFACE

**Visual concept:** Chrome Sculpture

**Primary goal:** Create a flagship technical portfolio project capable of attracting serious attention from experienced Design Engineers, Creative Developers, Frontend Engineers, and technical reviewers at leading international studios and technology companies.

---

# 1. YOUR ROLE

Operate as a coordinated team of:

- Principal Creative Developer
- Senior Three.js / WebGL Engineer
- Senior React and TypeScript Engineer
- Technical Art Director
- Shader Developer
- Interaction and Motion Designer
- Rendering Performance Engineer
- Accessibility Engineer
- QA Automation Engineer
- Technical Documentation Reviewer

You must work independently and iteratively.

Do not stop after producing a plan, mockup, or initial prototype.

Carry out the implementation, examine the results in a browser, identify weaknesses, improve them, write tests, measure performance, and prepare a deployable preview.

Your work should demonstrate strong engineering judgment rather than unnecessary complexity.

**A small number of exceptional, thoroughly implemented features is more valuable than many superficial features.**

---

# 2. PROJECT ISOLATION AND GIT RULES

Create a new public GitHub repository:

`tupptupp/spatial-interface-lab`

If the repository already exists, inspect it first. Do not overwrite existing work.

Follow this process:

1. Initialize the repository with a minimal, working foundation.
2. Create an initial `main` branch containing only this foundation.
3. Create `feature/chrome-sculpture`.
4. Perform all substantive development on the feature branch.
5. Open a Draft Pull Request against `main`.
6. Commit logical, independently reviewable milestones.
7. Set up continuous integration.
8. Prepare a Vercel Preview deployment for the feature branch.
9. Perform technical and visual quality assurance.
10. Leave the PR in Draft until all requirements have been reviewed.

**Hard restrictions:**

- Never merge into `main` without explicit user approval.
- Never deploy the finished experience to production without explicit user approval.
- Never change repositories other than the new Spatial Interface Lab repository.
- Never copy source code, artwork, textures, fonts, models, or proprietary assets from Lusion or other commercial studios.
- Never use assets belonging to private Formodo projects.
- Never expose environment variables, credentials, access tokens, or other secrets.
- Do not enable paid services or create financial commitments without approval.
- Do not bypass security blocks, authentication, or deployment restrictions.
- Use only original assets, appropriately licensed assets, or procedurally generated artwork.

A public repository is authorized for this new standalone project, not for existing private projects.

---

# 3. CREATIVE VISION

## BEYOND THE SURFACE

An interactive study of material, light, perception and spatial movement.

The visitor enters a vast, almost completely dark architectural environment.

At its center floats an original, precisely crafted sculptural object combining polished chrome and controlled glass-like details.

One carefully positioned light source reveals the sculpture's silhouette.

Subtle camera movement establishes scale.

As the visitor scrolls, the scene transitions through a choreographed sequence of spatial compositions, revealing the object's geometry, surface qualities and internal reflections.

The final composition allows the user to interact with the sculpture and experiment with selected rendering properties.

The result should feel like a digital installation commissioned by a premium creative studio.

## Visual standards

Prioritize:

- Physically plausible materials.
- Carefully controlled reflections.
- High-quality lighting.
- Strong art direction.
- Cinematic framing.
- Architectural depth.
- Sophisticated material contrast.
- Original geometry.
- Precise movement.
- Minimal, confident typography.
- Strong visual hierarchy.
- Exceptional detail consistency.

Avoid:

- Generic AI-looking compositions.
- Random particles.
- Overused glowing gradients.
- Unmotivated bloom.
- Excessive chromatic aberration.
- Low-resolution environment maps.
- Plastic-looking chrome.
- Inconsistent reflections.
- Unnecessary lens effects.
- Large blocks of meaningless marketing copy.
- Generic SaaS dashboards.
- Visual clutter.
- Low-quality motion presets.

The experience must look convincing in still screenshots as well as during animation.

---

# 4. REFERENCE STUDY AND ORIGINALITY

Study exemplary creative development work, including:

https://lusion.co/about

Use public websites only for inspiration and legitimate technical learning.

Analyze principles such as:

- Camera composition.
- Scroll choreography.
- Spatial transitions.
- Rendering efficiency.
- Visual hierarchy.
- Interaction feedback.
- Responsive behavior.
- Purposeful animation.
- Artistic restraint.

Do not attempt a pixel-perfect reproduction.

Do not reuse proprietary code, shaders, source files, or visual assets.

The final visual identity must be distinctly original.

Document major creative influences without implying affiliation with those studios.

---

# 5. CORE EXPERIENCE — THREE ACTS

Build one coherent experience, not three disconnected scenes.

## ACT I — THE REVEAL

The opening scene is nearly black.

The sculpture is barely visible.

A controlled lighting transition gradually reveals the object's silhouette.

A slow, intentional camera movement establishes depth.

The composition should remain elegant and restrained.

Requirements:

- Visually compelling opening frame.
- Accurate loading states.
- No visible asset popping.
- No sudden layout shifts.
- No uncontrolled exposure changes.
- Subtle interaction feedback.
- A clear indication that the experience continues through scrolling.

The opening should communicate quality immediately.

## ACT II — THE EXPLORATION

Scrolling transitions the camera around the sculpture.

Three distinctive cinematic viewpoints reveal different material and geometric characteristics.

Potential viewpoints:

1. Overall silhouette and spatial form.
2. Close-up of chrome reflections and curvature.
3. Glass/chrome intersection with carefully controlled lighting.

Requirements:

- Deterministic camera positioning based on scroll progress.
- Consistent behavior when scrolling backward.
- No accumulating transform errors.
- Smooth transitions across section boundaries.
- No sudden camera jumps.
- Stable clipping and depth behavior.
- Well-controlled lighting changes.
- No unnecessary React rerenders per animation frame.

Camera movement should be physically and compositionally deliberate.

## ACT III — THE MATERIAL LAB

The final act transitions from a cinematic presentation into a controlled interactive inspection environment.

Users can investigate selected properties.

Possible controls:

- Rotation/orbit within safe camera limits.
- Material roughness.
- Lighting angle.
- Reflection intensity within physically meaningful bounds.
- Comparison between carefully authored lighting presets.

Implement only controls that meaningfully improve the experience.

Requirements:

- Immediate and consistent visual feedback.
- Clear boundaries for permitted parameter values.
- Keyboard-operable controls.
- Touch support.
- Reset-to-default capability.
- Predictable interaction between orbit controls and scrolling.
- No accidental loss of scroll control.
- No memory leaks during scene transitions.

Avoid turning the experience into an overwhelming configuration interface.

---

# 6. TECHNICAL STACK

Preferred foundation:

- Vite
- React
- TypeScript with strict settings
- Three.js
- React Three Fiber
- @react-three/drei where justified
- GSAP where justified
- Custom GLSL shaders where justified
- Vitest
- Playwright
- GitHub Actions
- Vercel Preview Deployments

Use the smallest sensible dependency set.

Do not introduce a backend, database, authentication system, or AI API unless a genuine project requirement demands it.

Use package versions compatible with one another and verify the actual build.

Do not claim a shader, material or rendering effect is custom if it relies entirely on an unmodified library implementation.

---

# 7. SOFTWARE ARCHITECTURE

Establish clear separation between:

**Application layer**

- Routing or page composition.
- Text content.
- Accessible interface.
- Navigation.
- Loading states.
- Fallback behavior.

**Scene layer**

- Three.js scene configuration.
- Geometry and materials.
- Lighting.
- Camera.
- Render pipeline.
- Postprocessing.

**Animation layer**

- Timeline definitions.
- Scroll-to-scene mapping.
- Easing.
- Camera interpolation.
- Scene transitions.

**Interaction layer**

- Pointer and touch input.
- Keyboard input.
- Material controls.
- Interaction state.
- User preference handling.

**Performance layer**

- Quality configuration.
- Device capability detection.
- Resource lifecycle.
- Frame timing.
- Adaptive rendering decisions.

**Testing layer**

- Pure mathematical calculations.
- State transitions.
- Camera choreography.
- UI interactions.
- Responsive behavior.
- Accessibility.
- Rendering smoke tests.

Document component responsibilities and module boundaries.

Avoid premature abstractions and overengineered state management.

Rendering updates should occur in the render loop or through efficient Three.js mechanisms rather than unnecessary React state updates.

---

# 8. ORIGINAL SCULPTURE DESIGN

The central object is the defining visual asset.

Treat it as a piece of carefully art-directed digital sculpture.

Do not settle for a generic torus knot or stock geometry with a metallic material.

Develop and compare several original geometry concepts before selecting the final design.

Possible techniques:

- Parametric surfaces.
- Procedural geometry generation.
- Custom BufferGeometry.
- Carefully modeled high-quality geometry.
- Controlled asymmetric shapes.
- Multiple coordinated material surfaces.

Evaluate the silhouette from every intended camera angle.

Requirements:

- Smooth normals.
- Appropriate topology.
- No visible self-intersection unless intentional.
- No distracting shading artifacts.
- Reasonable geometry complexity.
- Appropriate mesh organization.
- Documented construction process.
- Deterministic geometry generation where applicable.

If Blender is useful and available, use it for asset creation or optimization. Do not make the project depend on Blender being installed by the end user.

Generated assets must be committed or otherwise reproducibly provided.

---

# 9. MATERIALS, SHADERS AND LIGHTING

Chrome must appear premium and physically convincing.

Investigate:

- Physically based rendering.
- Metalness and roughness.
- Reflection environment quality.
- Tone mapping.
- Color management.
- Controlled specular highlights.
- Surface curvature.
- Reflection filtering.
- Environment-map resolution.

Understand the performance implications of real-time reflections versus precomputed environments.

Use custom shaders only where they provide distinctive behavior that cannot be achieved cleanly using established materials.

For glass-like elements, prioritize convincing appearance and stable rendering.

Document compromises involving:

- Transmission.
- Refraction.
- Render order.
- Depth sorting.
- Transparency.
- Screen-space artifacts.
- Environment reflections.

Avoid expensive effects that offer little visual improvement.

Use controlled postprocessing only when it measurably benefits the scene.

---

# 10. ADVANCED MOTION ENGINEERING

Implement an animation system with consistent, predictable behavior.

Prefer a single authoritative mapping between user scroll progress and cinematic scene state.

Camera choreography should be designed through:

- Explicit keyframes.
- Interpolation curves.
- Quaternion-based orientation where appropriate.
- Stable easing.
- Deterministic state derivation.
- Appropriate damping.

Avoid:

- Competing animation systems writing to the same properties.
- Uncontrolled timelines.
- Transform accumulation.
- Race conditions between UI input and scene movement.
- Animation resources surviving unmount.
- Scroll behavior that breaks browser history or accessibility.

Handle:

- Scroll interruption.
- Rapid scrolling.
- Reverse scrolling.
- Browser resize.
- Touch interaction.
- Reduced-motion settings.
- Tab visibility changes.

Document the rationale behind the animation architecture.

---

# 11. PERFORMANCE ENGINEERING

High visual quality is mandatory, but not at the expense of unusable performance.

Implement measurable performance-conscious behavior.

Investigate:

- Draw calls.
- Triangle counts.
- Shader complexity.
- GPU overdraw.
- Texture sizes.
- Environment-map memory.
- Pixel ratio.
- Render target allocation.
- Postprocessing cost.
- Scene traversal.
- Loading waterfalls.
- Garbage collection pressure.

Develop an adaptive quality strategy.

Possible quality levels:

**High**

Full visual fidelity for sufficiently capable devices.

**Balanced**

Reduced pixel ratio and selective rendering costs while preserving the artistic intent.

**Fallback**

A polished HTML/static representation when WebGL is unavailable, reduced motion is requested, or rendering is not viable.

Do not aggressively lower fidelity solely based on user-agent detection.

Prefer measured capability and actual performance signals.

Prevent repeated quality switching caused by short frame-time spikes.

Handle WebGL context loss when technically reasonable.

Dispose of GPU resources correctly.

Do not create a permanent high-cost render loop if the scene can render on demand during inactive periods.

### Performance evidence

Record:

- Test device or environment.
- Browser version.
- Viewport.
- Render resolution.
- Quality level.
- Scene and asset complexity.
- Frame-time distribution.
- Loading performance.
- Memory measurements if reliably available.
- Known limitations.

Where measurements are meaningful, include median, p95 and sample counts.

Do not invent benchmark results.

Do not claim stable 60 FPS or a specific Lighthouse score unless actually measured.

---

# 12. MOBILE EXPERIENCE

Mobile must be a first-class experience.

Do not simply shrink the desktop composition.

Design mobile camera framing independently where needed.

Requirements:

- Strong first visual impression.
- No horizontal page overflow.
- Readable typography.
- Comfortable touch controls.
- Correct canvas sizing.
- No unexpectedly trapped scrolling.
- Appropriate camera clipping.
- Stable performance.
- Responsive inspector controls.
- Graceful handling of low GPU capability.

Test common small-screen viewport sizes.

Use real-device testing where available, but distinguish emulated testing from physical-device verification.

Never claim Safari compatibility based only on Chromium testing.

---

# 13. ACCESSIBILITY AND PROGRESSIVE ENHANCEMENT

The artistic experience must not exclude users who cannot interact with WebGL.

Implement:

- Semantic HTML structure.
- Meaningful headings.
- Sufficient text contrast.
- Visible keyboard focus.
- Keyboard-accessible interactive controls.
- Reduced-motion support.
- Accessible control names.
- Meaningful fallback content.
- No essential information exclusively inside the canvas.
- Clear descriptions of the experience for assistive technologies.

Ensure the site remains understandable if WebGL fails.

Provide a high-quality static fallback rather than an empty black screen.

Do not claim full WCAG conformance solely because an automated test passes.

---

# 14. TEST STRATEGY

Implement a professional testing strategy.

## Unit tests

Test pure logic including:

- Scroll progress mapping.
- Camera interpolation.
- Boundary conditions.
- Quality-selection logic.
- Parameter clamping.
- State transitions.
- Geometry invariants where applicable.

## Integration tests

Verify:

- UI control state.
- Inspector interaction.
- Reduced-motion behavior.
- Loading and fallback states.
- Interaction lifecycle.
- Cleanup.

## Browser tests

Use Playwright to test:

- Initial loading.
- Successful scene initialization.
- Scroll progression.
- Reverse scrolling.
- Material controls.
- Keyboard navigation.
- Mobile layout.
- No unwanted page overflow.
- Recovery from supported rendering failures.
- Fallback behavior.
- Accessibility checks.

Include visual regression testing where it is practical and deterministic.

Do not depend on pixel-perfect screenshots across different GPUs without accounting for expected rendering variability.

## Quality checks

Include:

- Strict TypeScript checks.
- ESLint.
- Prettier.
- Unit tests.
- Browser tests.
- Production build.
- Dependency checks where appropriate.

Never weaken tests solely to make CI green.

Fix underlying issues or transparently document unresolved limitations.

---

# 15. DESIGN REVIEW PROCESS

Use the available browser/computer tools to inspect the actual application.

At each meaningful milestone:

1. Run the application.
2. Open it in a browser.
3. Inspect desktop rendering.
4. Inspect mobile rendering.
5. Capture screenshots.
6. Inspect animations and transitions.
7. Identify visual weaknesses.
8. Improve the implementation.
9. Repeat.

Review especially:

- First impression.
- Silhouette quality.
- Material credibility.
- Lighting consistency.
- Camera choreography.
- Motion smoothness.
- Visual hierarchy.
- Typography.
- Composition.
- Mobile framing.
- Overall creative coherence.

Do not mark a visual milestone complete based only on successful compilation.

If browser verification is blocked, clearly report the blocker.

Do not fabricate a visual review.

---

# 16. DEPLOYMENT

Connect the new GitHub repository to Vercel if the available integration and permissions allow it.

Set up automatic preview deployments for the feature branch.

Verify:

- Successful build.
- Correct asset paths.
- No missing textures or models.
- No console errors.
- Correct navigation and fallback.
- Expected mobile layout.
- Reasonable loading behavior.

Use only approved free-tier services where possible.

Do not change any existing Vercel projects.

Do not promote the preview to production.

If Vercel requires user authentication or configuration, stop at that step and request the necessary action.

Do not request private tokens in chat.

---

# 17. DOCUMENTATION AND PORTFOLIO PRESENTATION

Create a professional GitHub README.

Include:

- Project summary.
- Live preview link when available.
- Screenshots from the actual rendered project.
- Technical architecture overview.
- Original visual concept.
- Technologies.
- Installation instructions.
- Test commands.
- Performance evidence.
- Accessibility strategy.
- Known limitations.
- Development methodology.

Also create appropriate documentation such as:

`docs/architecture.md`

`docs/rendering.md`

`docs/performance.md`

`docs/design-decisions.md`

`docs/verification.md`

`docs/development.md`

Explain significant implementation decisions.

Include diagrams only when useful.

Avoid generic technical prose that does not describe the actual code.

### Authorship transparency

This project is developed using AI-assisted engineering tools.

The documentation should accurately distinguish:

- Project direction and visual decisions made by the owner.
- AI-assisted implementation.
- Independently verified results.
- Unverified limitations.

Do not falsely imply that the project was implemented without AI or that it represents professional production experience.

---

# 18. IMPLEMENTATION PHASES

Work through these phases autonomously.

## Phase 0 — Discovery and architecture

- Inspect available repository, deployment and development tools.
- Confirm dependency compatibility.
- Create a practical architecture.
- Establish the visual design specification.
- Define measurable acceptance criteria.
- Identify key technical risks.

Deliverable: architecture and implementation plan.

## Phase 1 — Repository foundation

- Create repository.
- Establish branches.
- Configure TypeScript and tooling.
- Add linting, formatting and tests.
- Set up CI.
- Create Draft PR.

Deliverable: clean, tested foundation.

## Phase 2 — Visual prototype

- Develop original sculpture geometry.
- Establish cinematic lighting.
- Build the initial composition.
- Validate material appearance.
- Inspect rendered screenshots.
- Refine until the visual direction is coherent.

Deliverable: credible art-directed 3D scene.

## Phase 3 — Cinematic experience

- Implement scroll-to-scene mapping.
- Choreograph three acts.
- Establish intentional transitions.
- Ensure reverse scrolling behaves correctly.
- Implement motion accessibility.

Deliverable: deterministic spatial storytelling.

## Phase 4 — Interactive material lab

- Build selected controls.
- Integrate scene state.
- Implement interaction boundaries.
- Verify reset and responsive behavior.

Deliverable: functional interactive experience.

## Phase 5 — Performance and mobile

- Profile rendering costs.
- Reduce unnecessary GPU work.
- Implement adaptive quality where justified.
- Verify mobile composition and interaction.
- Implement fallback experience.

Deliverable: optimized cross-device presentation.

## Phase 6 — Testing and hardening

- Expand unit and browser tests.
- Handle edge cases.
- Inspect lifecycle cleanup.
- Validate accessibility.
- Run production builds.
- Resolve important CI failures.

Deliverable: documented, reproducibly verified quality.

## Phase 7 — Portfolio polish

- Final typography and motion refinements.
- Screenshot capture.
- README and technical documentation.
- Independent self-review.
- Final preview verification.

Deliverable: recruitment-ready release candidate.

---

# 19. QUALITY GATES

Do not proceed as though a phase is finished unless its primary requirements have been demonstrated.

Evaluate each phase using evidence.

A successful compile is not visual acceptance.

An attractive screenshot is not proof of responsive performance.

A passing unit test is not proof that GPU rendering works.

A successful Vercel deployment is not proof that the page functions in the browser.

If necessary, repeat a phase until the result meets the intended standard.

Focus efforts where the improvements provide the greatest visual or technical benefit.

---

# 20. FINAL ENGINEERING REVIEW

Before stopping, conduct a critical review as though the code were submitted to a senior engineering interview panel.

Review:

**Architecture**

Is the system understandable, modular and appropriately complex?

**Rendering**

Are materials, lighting and shaders implemented sensibly?

**Animation**

Is camera movement deterministic and interruption-safe?

**Performance**

Are resource usage and rendering costs measured and reasonably controlled?

**Accessibility**

Does the experience remain usable without the cinematic rendering layer?

**Code quality**

Are components, hooks, render loops, state transitions and cleanup correct?

**Testing**

Do tests verify meaningful behavior instead of implementation trivia?

**Documentation**

Do recorded claims match actual results?

**Visual quality**

Does the experience offer a distinctive, polished artistic direction?

Identify and fix issues justified by this review.

Do not invent praise or claim that the result is award-winning without independent evidence.

---

# 21. FINAL REPORT

At completion provide:

### A. Repository and preview

- GitHub repository link.
- Feature branch.
- Draft PR.
- Vercel preview link.
- Latest commit SHA.

### B. Implemented experience

- What was actually built.
- Visual description.
- User interactions.
- Supported browsers and devices.

### C. Engineering decisions

- Major architectural decisions.
- Shader/material strategy.
- Animation strategy.
- Rendering performance strategy.
- Trade-offs.

### D. Verification

- Test results.
- CI run links.
- Actual browser checks.
- Desktop and mobile results.
- Real performance measurements where available.

### E. Known limitations

- Unverified environments.
- Rendering limitations.
- Performance limitations.
- Accessibility limitations.
- Browser compatibility concerns.

### F. Quality assessment

Assess honestly how the project compares with professional creative development work.

Explain:

- What would impress an experienced Creative Developer.
- What would impress a Design Engineer.
- What a senior code reviewer might criticize.
- Which remaining improvements would have the highest value.

### G. Release readiness

State whether the project is ready for manual review.

Do not merge the PR or deploy to production.

---

# 22. AUTONOMY AND CONTINUATION

You are authorized to proceed autonomously with reversible development work inside the new repository and its feature branch.

Do not ask for confirmation after every implementation step.

Make well-justified technical decisions independently.

Continue the cycle:

**Research → Design → Implement → Render → Inspect → Test → Profile → Refine → Verify**

Repeat until the release candidate reaches a genuinely strong standard or an external blocker requires user involvement.

Preserve context through commits, documentation and concise progress reports.

Optimize tool use, but do not sacrifice essential testing or visual review to reduce token consumption.

If a task cannot be performed with available tools, report the limitation and continue with the remaining work.

**Never claim to have performed a test, deployment or visual inspection that did not actually occur.**

---

# FINAL DIRECTIVE

Build something that demonstrates serious creative engineering.

The goal is not simply to create a beautiful Three.js website.

The goal is to create an original interactive 3D experience whose source code, architecture, rendering strategy, interaction design, tests and documentation withstand close professional scrutiny.

The result should make an experienced developer want to inspect how it was built.

Prioritize elegance over complexity, correctness over novelty, and coherent art direction over visual excess.

**Begin by creating the isolated GitHub repository and technical foundation, then continue independently through implementation and verification. Stop before merging into `main` or promoting any deployment to production.**
