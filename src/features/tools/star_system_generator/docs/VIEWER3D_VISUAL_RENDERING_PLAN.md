# 3D Viewer Visual Rendering Plan

## Goal

Improve the solar system display so generated systems are more visually distinct, physically legible, deterministic for the same seed, and still performant on typical browser hardware.

## Principles

- All visual choices must derive from generated facts, stable ids, and the system seed.
- Do not use `Math.random()` for visual generation.
- Prefer structured generated data over prose matching; use prose keyword fallback only when structured fields are not available.
- Keep procedural rendering as the default path. Generated bitmap textures may be added later for inspection mode, but should not be required for the overview scene.
- Preserve shared geometries, instancing, low draw-call counts, and adaptive quality options.

## Implementation Order

1. Add deterministic visual profiles for bodies, moons, rings, belts, stars, hazards, GU bleed volumes, and phenomenon markers.
2. Wire body profiles into shader uniforms so surface variety remains data-driven and testable.
3. Give moons their own deterministic profiles instead of the current single gray material.
4. Improve rings and belts with physical palettes, deterministic gaps, clumps, arcs, inclination, and per-instance color.
5. Add atmosphere and cloud shells for bodies whose generated facts justify them.
6. Improve star and companion visuals with companion-aware spectral mapping and cheap flare/ray elements.
7. Improve hazard and GU volume shapes so not every volume is a sphere.
8. Add selected-body emphasis and camera/interaction polish without making the overview harder to read.
9. Add adaptive rendering quality controls for particle density, DPR, and expensive visual layers.

## Verification

- Unit-test visual profile determinism.
- Keep scene graph determinism tests passing.
- Run targeted viewer tests after each rendering phase.
- Run typecheck and lint before final handoff.
