# Design decisions

Owner direction: an original premium chrome sculpture in a dark architectural setting, a coherent three-act narrative, minimal editorial content and a useful final material lab.

Implementation decisions: warm charcoal, pale mineral green typography, quiet monospaced annotations, a circular low plinth, procedural reflection cards and a central faceted glass core. Four sections express three acts: reveal; two exploration viewpoints; lab. No decorative particles, glow or postprocessing are used.

Three geometry variants were compared through a reproducible offline projection. The `fold` version opens a larger negative space around the core; `crescent` and `aperture` produce more overlapping bands in that projection. This is a preliminary shape selection, not multi-angle rendered validation.

The public structure and content at [Lusion's About page](https://lusion.co/about/) were consulted as a reference for concise hierarchy and staged presentation. No source code or assets were copied. The animated site itself was not visually inspected in this environment. Neither affiliation nor equivalent execution quality is implied.

Native scrolling was retained because keyboard navigation, touch scrolling, reverse travel and history behavior matter more than inertia effects. The lab uses rotation as a slider rather than pointer orbit, keeping scroll ownership simple. System fonts avoid external requests, licensing uncertainty and font layout shifts.

## Acceptance gates still open

1. Actual first-frame chrome appearance, exposure and typography at desktop and 320/390/768px widths.
2. All camera views, forward/reverse rapid scrolling, and section-boundary transitions.
3. Joint/cap shading, highlight filtering and transmission on more than one GPU.
4. Mobile placement of the artwork relative to the heading and inspector; the mobile camera increases distance but may need a lower look target after rendered review.
5. Keyboard focus, contrast over actual artwork, real touch use and reduced-motion behavior.
6. Profiling on hardware, lifecycle resource disposal and preview verification.

Compilation and offline pictures cannot close these gates. The present implementation is deliberately labeled draft.
