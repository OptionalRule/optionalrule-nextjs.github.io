# Viewer 3D Render Optimization Plan

Status: implemented. Shipped in commits 9248445 (shared render asset catalog) and f0f8aad (instanced marker batches). Object-pooling deliberately deferred per the plan; revisit when the viewer gains transient effects. Note: the PhenomenonGlyph reference in Step 4 below is historical — phenomena no longer render in 3D following the system-level rail work (see SYSTEM_LEVEL_HAZARDS_PHENOMENA_PLAN.md).

## Purpose

Improve the Star System Generator 3D viewer's render architecture by reducing avoidable Three.js allocation churn, formalizing reusable visual archetypes, and applying browser-native equivalents of Unity-style clone and instancing patterns where they fit the existing React Three Fiber implementation.

## Findings

- Belts already use `THREE.InstancedMesh`, which is the right optimization for thousands of repeated particles.
- Planets, moons, stars, hazards, markers, and orbits currently create repeated geometry inline.
- `Orbit` creates a `THREE.Line` during render and does not own cleanup for the line object lifecycle.
- Per-body shader materials intentionally carry unique uniforms, so forcing all bodies through one shared material would reduce visual fidelity unless the shader is redesigned around per-instance attributes.
- Classic Unity-style object pooling is not yet justified because the viewer mounts a generated system and then animates stable objects. Pooling becomes useful only if the viewer gains many short-lived effects.

## Implementation Order

### 1. Baseline The Viewer

Record the current behavior before renderer changes:

- Run focused viewer tests.
- Inspect representative object counts for bodies, belts, moons, rings, markers, hazards, and orbit lines.
- Preserve existing scene graph output and layer visibility behavior.

### 2. Fix Orbit Allocation

Update `viewer3d/scene/Orbit.tsx` so it does not instantiate `new THREE.Line(...)` during render.

- Memoize geometry, material, and the line object.
- Compute dashed line distances only when needed.
- Dispose geometry and material on unmount or dependency change.

### 3. Add A Shared Render Asset Catalog

Create a small render asset boundary such as `viewer3d/scene/renderAssets.ts`.

Shared geometry candidates:

- `bodySphere32`
- `starSphere24`
- `moonSphere16`
- `hazardSphere24`
- `guBleedSphere32`
- `beltParticleIcosahedron`
- `phenomenonIcosahedron`
- `ruinOctahedron`
- reusable unit orbit circle helpers where appropriate

Shared material candidates:

- fixed moon material
- marker materials
- invisible hit-test material
- simple fixed-color non-shader materials where no per-object uniforms are needed

Planet shader materials should remain per body for now because they carry unique uniforms.

### 4. Migrate Scene Primitives To Shared Assets

Update low-risk components to consume the catalog:

- `Body`
- `Moon`
- `Star`
- `Belt`
- `HazardVolume`
- `GuBleedVolume`
- `PhenomenonGlyph`
- `RuinPin`
- `Scene` star hit target

Use unit geometry plus mesh scale where possible instead of constructing size-specific geometry instances.

### 5. Formalize Visual Archetypes

Add a render-facing archetype layer around the existing `BodyShadingKey` classification.

Initial archetypes:

- `rocky`
- `earthlike`
- `desert`
- `sub-neptune`
- `gas-giant`
- `ice-giant`
- `dwarf`
- `anomaly`
- `belt`
- `ruin-marker`
- `phenomenon-marker`

Keep generated system data dynamic. The archetype layer should only describe how generated data maps onto reusable render assets and future visual variants.

### 6. Instance Repeated Simple Markers Where Safe

Convert obvious repeated simple markers to instanced meshes when interaction behavior can remain clear.

Start with low-risk repeated non-body markers:

- unattached ruins
- GU phenomena glyphs

Preserve hover and click selection by using `instanceId` to map back to marker IDs.

### 7. Document Object Pooling Decision

Do not implement object pooling in this pass.

Document that pooling should be revisited only when the viewer adds transient effects such as scan pulses, debris, comet trails, selection bursts, animated hazard particles, or frequent scene regeneration without a full remount.

### 8. Profile After Structural Cleanup

After the structural work:

- Compare geometry count, material count, and draw-call shape conceptually from the component tree.
- Run focused tests.
- Run lint or broader tests when the touched surface justifies it.

Expected benefits are cleaner resource lifetime, less allocation churn, and a better foundation for richer assets. Large FPS gains are expected mainly in systems with many repeated markers, moons, or belts.

### 9. Add Regression Coverage

Add or update tests for:

- scene graph archetype output
- marker instancing behavior where feasible
- body layer visibility behavior
- stable orbit component lifecycle where practical
- unchanged scene graph snapshots unless a deliberate render-only field is added

### 10. Later Visual Asset Library

After the render architecture is stable, add richer visual assets as a separate polish pass:

- alternate asteroid poly shapes
- gas giant variants
- anomaly glyph variants
- belt particle variants
- ring presets

This is a visual-quality pass, not a prerequisite for the performance cleanup.
