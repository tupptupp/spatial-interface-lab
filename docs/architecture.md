# Architecture

The semantic document owns navigation and descriptive content. The optional WebGL canvas is decorative and hidden from the accessibility tree. `App` lazy-imports the rendering module only when motion is allowed and still/failure mode is inactive. A React error boundary, a 30-second startup timeout and `webglcontextlost` switch to usable static content. Retry creates a fresh Canvas. No credentials or backend state exist.

## Data flow

Native page scroll → cached chapter offsets → `chapterProgress` → mutable progress ref → `sampleShot` in the render loop. Each pose is derived from explicit keyframes. Chapter offsets are recomputed on resize; browser anchor navigation and ordinary scrolling remain native. CSS gets the same progress for the footer rule. React receives chapter changes, control changes and quality changes; it does not receive a per-frame camera state.

Camera position and look target use smoothstep interpolation. Model rotation uses small bounded Euler angles which never cross an angle-wrap boundary. `lookAt` defines camera orientation without accumulated transforms. Quaternions would add little here because the authored shots have no camera roll; a future roll-based sequence should use quaternion interpolation.

Lab state is a three-number object, validated in `updateLab`. Lab values remain applied when returning to earlier chapters. Geometry is built once per quality resolution, shared by the three blade meshes and explicitly disposed when replaced/unmounted. React Three Fiber owns the remaining declarative GPU resources.

The scene uses a demand loop. The opening exposure reveal self-invalidates for a bounded 1.1 seconds. Scroll wakes a short active sampling window; it ends 140 ms after the last input. Render intervals are only sampled when the prior frame explicitly requested a continuation, avoiding classification of idle time or input-event cadence as render speed. Visibility changes clear continuation state. Input controls and resize invalidate through R3F property updates.

## Limitations and deliberate omissions

There is no pointer orbit competing with scrolling. Rotation uses a labeled native input, so scroll ownership is unambiguous. There are no custom shaders, texture downloads, postprocessing passes or autonomous idle animation. `World` currently owns lighting, camera application and lightweight diagnostics; splitting that further is justified only when additional compositions demand it.

The app integration suite substitutes a synthetic scene: it verifies the HTML lifecycle, not WebGL behavior. Resource disposal and context recovery still require the real-browser suite and manual GPU inspection.
