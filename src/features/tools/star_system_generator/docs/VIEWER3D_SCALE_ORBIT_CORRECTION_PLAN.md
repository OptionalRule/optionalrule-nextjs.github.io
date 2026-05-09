# Viewer 3D Scale And Orbit Correction Plan

## Purpose

Correct three related Star System Generator issues:

- generated orbital gaps are too often extremely tight in absolute AU;
- viewer body sizes are category buckets instead of physical-radius-informed visual sizes;
- moons use uniform display loops rather than scale- and parent-aware orbital behavior.

The goal is not true astronomical scale. The viewer still needs readable symbolic scaling, but that scaling should respect generated physical facts and avoid misleading packed layouts.

## Findings

- The generator currently allows adjacent generated orbits as close as `0.015 AU`, with the minimum separation set by `orbitSeparation()`.
- The viewer uses logarithmic AU projection, which compresses neighboring orbits in outer bands and can make already-close pairs look stacked.
- Body visuals use fixed category buckets, so a Mercury-scale rocky planet renders the same size as a much larger rocky planet.
- Moon orbit periods are assigned as short display loops of roughly 4-12 seconds, independent of parent body or moon scale.

## Implementation Plan

### 1. Tighten Generated Orbit Spacing

Raise the generator's absolute and relative minimum orbital separation.

- Keep compact systems compact, but reduce the frequency of `<0.05 AU` adjacent pairs.
- Preserve locked imported orbits.
- Update orbit-refinement tests to assert a stronger minimum spacing contract.

### 2. Add Physical-Radius-Informed Viewer Body Sizes

Replace category-only `bodyVisualSize(category)` use in the viewer with a function that accepts an orbiting body.

- Use `physical.radiusEarth` when available.
- Keep category-specific clamps for readability.
- Make Mercury-scale rocky bodies visibly smaller than Earth-scale rocky bodies.
- Keep gas giants, ice giants, belts, anomalies, and dwarfs legible.

### 3. Add Viewer-Space Orbit Clearance

Keep AU labels and generated AU data unchanged, but improve the 3D projection.

- Build initial scene radii from `auToScene()`.
- Enforce minimum visual clearance between adjacent non-belt bodies based on their visual sizes.
- Preserve monotonic orbital order.
- Let very wide systems remain wide, but prevent close visual stacking.

### 4. Improve Moon Visualization

Replace uniform moon display loops with scale- and parent-aware visual mechanics.

- Map moon scale strings to visual size factors.
- Space moons farther around larger parent bodies.
- Derive visual period from moon orbit radius and parent category/size using a Kepler-like display approximation.
- Keep periods slow enough for mouseover/readability and deterministic per seed.

### 5. Verify

Run:

- focused scale, motion, scene graph, and viewer tests;
- Star System Generator tests;
- lint and typecheck;
- production build if touched surface warrants it.

## Non-Goals

- True solar-system scale rendering.
- Adding bitmap textures.
- Reworking source RPG tables.
- Changing locked catalog/known-system orbit behavior.
