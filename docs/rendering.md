# Rendering

## Original construction

`createBlade` sweeps a closed flattened elliptical tube along an open asymmetric arc. The radius varies sinusoidally, the cross-section twists, and the tips taper. A radial/vertical frame avoids Frenet flips. Ring vertices share an indexed surface; two end caps close it. Duplicate radial seam normals are averaged explicitly.

Three transformed copies form the assembly; reuse saves geometry memory. Crossings between the blades are deliberate assembly joints, not a promise that the combined sculpture is one boolean-unioned manifold. Tests verify the closure and nondegenerate faces of each individual blade. They do not establish collision-free assembly or photorealistic joint shading.

The generator exposes `fold`, `crescent` and `aperture` variants. The three offline studies in `docs/studies` were generated and inspected. Fold was selected for its open silhouette and clearer central negative space in the introductory projection. Review across all actual WebGL viewpoints is pending.

## Surface strategy

Chrome is Three.js `MeshStandardMaterial`: metalness 1, bounded roughness 0.06–0.48, a restrained neutral tint and environment intensity 1.2. The core is `MeshPhysicalMaterial` with transmission 0.92, IOR 1.48, finite thickness and pale absorption tint. No custom shader or ray tracing is claimed.

A procedural cubemap uses four broad/strip light forms and a very dark neutral surround to retain low-level reflected form. These are reflection cards, with one direct key spotlight and low ambient fill. The reflection environment is baked once, not re-rendered every frame. Changing key-light angle moves the direct light, not the baked reflection cards. This is a designed distinction and a perceptual limitation: a future preset could rebake the environment on committed changes if measured benefits justify the cost.

ACES filmic tone mapping uses a bounded exposure choreography. The application uses Three.js/R3F default sRGB display output and current color-management defaults. The first 1.1 seconds fade exposure from 55% to the shot value, then scrolling alone controls exposure. No bloom, chromatic aberration or color LUT is used.

## Cost and limitations

Physical transmission incurs extra rendering work. Its render-target scale is 0.5 in high quality and 0.35 in balanced quality, avoiding a full-resolution secondary scene pass. It is screen/environment-based, not path-traced glass; refraction, hidden surfaces, multiple layers and depth ordering may differ from physical optics. It requires real-device visual inspection. Chrome cannot reflect scene objects with true local parallax: the environment is a fixed reflection approximation, not a realtime scene cubemap.

The plinth and floor use rough PBR materials. There is no shadow-map pass or contact-shadow effect. This is inexpensive but the perceived suspension and architectural grounding need visual review.

High quality uses 256px cubemap faces; balanced uses 128px. Procedural area cards avoid raster texture compression and asset loading, but lower-resolution filtering may soften highlights at low roughness. Inspect both before accepting the visual gate.

## Static fallback and concept studies

The standalone fallback WebPs and docs/studies images come from the original-geometry CPU rasterizer in scripts/create-posters.mjs. They have interpolated normals, z-buffer visibility and analytic lighting, but are not actual WebGL screenshots and do not model transmission. Reproduce with npm run assets:generate. Sharp is an authoring-only dependency.

Actual UI screenshots from the reviewed CI checkpoint are kept in docs/screenshots and labeled with their source commit. A DOM element screenshot of the canvas rectangle also includes composited HTML overlays; those captures were rejected as fallback assets after visual inspection. The fallback remains a clean illustration with the live HTML rendered once on top.

## References consulted

- [Three.js materials](https://threejs.org/docs/)
- [R3F demand rendering and resource sharing](https://r3f.docs.pmnd.rs/advanced/scaling-performance)

These document library behavior; they are not verification of this application's appearance or speed.
