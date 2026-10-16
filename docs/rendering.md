# Rendering

## Original construction

`createBlade` sweeps a closed flattened elliptical tube along an open asymmetric arc. The radius varies sinusoidally, the cross-section twists, and the tips taper. A radial/vertical frame avoids Frenet flips. Ring vertices share an indexed surface; two end caps close it. Duplicate radial seam normals are averaged explicitly.

Three transformed copies form the assembly; reuse saves geometry memory. Crossings between the blades are deliberate assembly joints, not a promise that the combined sculpture is one boolean-unioned manifold. Tests verify the closure and nondegenerate faces of each individual blade. They do not establish collision-free assembly or photorealistic joint shading.

The generator exposes `fold`, `crescent` and `aperture` variants. The three offline studies in `docs/studies` were generated and inspected. Fold was selected for its open silhouette and clearer central negative space in the introductory projection. Review across all actual WebGL viewpoints is pending.

## Surface strategy

Chrome is Three.js `MeshStandardMaterial`: metalness 1, bounded roughness 0.06–0.48, a restrained neutral tint and environment intensity 1.2. The core is `MeshPhysicalMaterial` with transmission 0.92, IOR 1.48, finite thickness and pale absorption tint. No custom shader or ray tracing is claimed.

A procedural cubemap uses four broad/strip light forms. These are reflection cards, with one direct key spotlight and low ambient fill. The reflection environment is baked once, not re-rendered every frame. Changing key-light angle moves the direct light, not the baked reflection cards. This is a designed distinction and a perceptual limitation: a future preset could rebake the environment on committed changes if measured benefits justify the cost.

ACES filmic tone mapping uses a bounded exposure choreography. The application uses Three.js/R3F default sRGB display output and current color-management defaults. The first 1.1 seconds fade exposure from 55% to the shot value, then scrolling alone controls exposure. No bloom, chromatic aberration or color LUT is used.

## Cost and limitations

Physical transmission incurs extra rendering work. It is screen/environment-based, not path-traced glass; refraction, hidden surfaces, multiple layers and depth ordering may differ from physical optics. It requires real-device visual inspection. Chrome cannot reflect scene objects with true local parallax: the environment is a fixed reflection approximation, not a realtime scene cubemap.

The plinth and floor use rough PBR materials. There is no shadow-map pass or contact-shadow effect. This is inexpensive but the perceived suspension and architectural grounding need visual review.

High quality uses 256px cubemap faces; balanced uses 128px. Procedural area cards avoid raster texture compression and asset loading, but lower-resolution filtering may soften highlights at low roughness. Inspect both before accepting the visual gate.

## Static illustration

`scripts/create-posters.mjs` is a separate CPU rasterizer for the same original geometry: projected triangles, z-buffer visibility, interpolated normals and an analytic lighting approximation. It creates the committed WebP fallback assets and PNG concept studies reproducibly with Sharp. It is not the Three.js render pipeline and does not model transmission; the core is represented as tinted geometry. The illustrations were inspected as static assets only. They must never be labeled application screenshots.

Regenerate with `npm run assets:generate` (Node 22.18+). Sharp is an authoring-only development dependency and is excluded from browser output.

## References consulted

- [Three.js materials](https://threejs.org/docs/)
- [R3F demand rendering and resource sharing](https://r3f.docs.pmnd.rs/advanced/scaling-performance)

These document library behavior; they are not verification of this application's appearance or speed.
