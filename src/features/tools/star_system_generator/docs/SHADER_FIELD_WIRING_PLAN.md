# Shader Field Wiring Plan

**Status:** Phase 1 in progress (open questions resolved 2026-05-11)
**Scope:** Surface this session's 24-field `PlanetaryDetail` data into the 3D viewer's shader pipeline. Currently the body shader only consumes the original 6 fields (atmosphere/hydrosphere/geology/climate/radiation/biosphere) plus body class names. The 18 new fields are invisible to the renderer.

---

## Current shader architecture (reference)

Three concentric shader layers per body, all in `src/features/tools/star_system_generator/viewer3d/`:

```
┌─ AtmosphereShell ─ slightly-larger sphere (BackSide, MeshBasicMaterial)
│  └─ Simple transparent tinted halo. Color/opacity from uniforms.
│  └─ scene/BodyShells.tsx
│
├─ CloudShell ─ sphere at 1.035× size, transparent ShaderMaterial
│  └─ Independent rotating shader. Own FBM noise. uTime advances each frame.
│  └─ scene/BodyShells.tsx
│
└─ Body ─ main sphere at 1.0× size, custom ShaderMaterial
   └─ The big one. Procedural surface from ~20 uniforms.
   └─ scene/bodyShader.ts (~140 lines GLSL)
```

The body fragment shader (`bodyShader.ts`) already does:

| Feature | Uniform | How |
|---|---|---|
| Continents / terrain | uBaseColor / uSecondaryColor | FBM noise blend |
| Water coverage | uAccentColor, uWaterCoverage | Threshold-mask noise |
| Ice caps | uIceCoverage | Polar latitude bias + noise mask |
| Craters | uCraterStrength | High-frequency noise threshold |
| Volcanic patches | uVolcanicStrength | Noise threshold blend to red |
| Storm bands | uStormStrength | Latitude-stretched noise |
| Gas-giant bands | uBandStrength, uBandFrequency | Sinusoidal bands |
| Heat tint | uHeatTint | Orange tint blend |
| Atmosphere glow | uAtmosphere, uGuAccent | Fresnel × atm strength |
| City night-lights | uNightLightStrength, uCityLightColor | Inverse-light mask × noise |
| Relief / bump | uReliefStrength | Normal perturbation |

Uniform values come from `viewer3d/lib/bodyShading.ts:shaderUniforms()`, which reads a lowercased concatenation of body fields and pattern-matches keywords.

---

## Triage by visual impact

### High visual value (8 fields) — wire fully

| Field | What it changes |
|---|---|
| **mineralComposition** | Surface palette — Mars-red iron, dark carbon, yellow sulfide, salt white, chiral shimmer |
| **magneticField** | Aurora overlay (especially Aurora-belt / GU monopole) |
| **atmosphericTraces** | Cloud color — tholin orange, SO2 yellow, smog brown, ozone hint |
| **topography** | Visible features — hemispheric dichotomy, sand-sea stripes, glassy patches |
| **surfaceHazards** | Surface tints — perchlorate ochre, sulfuric acid yellow, mercury silver |
| **axialTilt** | Polar ice-cap asymmetry, seasonal snow line |
| **skyPhenomena** | New scene elements — ring shadows, belt arcs, persistent stellar plume |
| **biosphereDistribution** | Where life patches show — equatorial belt / polar refugia / sterile |

### Medium visual value (4 fields) — wire with restraint

| Field | What it changes |
|---|---|
| **windRegime** | Cloud band intensity multiplier, cloud rotation speed |
| **rotationProfile + dayLength** | Cloud rotation speed scalar |
| **atmosphericPressure** | Atmosphere shell opacity scalar |
| **surfaceLight** | Ambient light / brightness adjustment for the body |

### Skip (6 fields)

- **acousticEnvironment** — sound, no visual equivalent
- **resourceAccess** — economic abstraction
- **seismicActivity** — dynamic process, static render misses it
- **hydrology flow patterns** — would need flow-map textures, GPU-heavy
- **tidalRegime** — tidal forces are invisible without time progression
- Spectroscopic **atmosphericTraces** subset (He-3, methane biosignature, carbon isotope) — invisible to the eye, but the field stays in export/sidebar

These stay as text-only fields. Fine for adventure flavor.

---

## Pattern choices

Three architectural patterns:

**(A) Add uniforms to existing `bodyShader.ts`** — cheapest. New fragment-shader logic, ~30 new uniforms total.
**(B) Add a new transparent shell mesh** — separate ShaderMaterial, independent rotation, depth ordering. Good for things that move independently.
**(C) Add scene-level objects** — not part of any body's shader at all. New meshes in `Scene.tsx`.

Per field:

| Field | Pattern | Reason |
|---|---|---|
| mineralComposition | A | Surface tint belongs on body shader |
| topography | A | Surface albedo features |
| surfaceHazards | A | Tint overlay pass |
| biosphereDistribution | A | Surface vegetation patches with latitude bias |
| axialTilt | A | Modifies ice-cap latitude bias |
| atmosphericTraces | A | CloudShell already exists |
| windRegime | A | CloudShell uniforms |
| atmosphericPressure | A | AtmosphereShell uniform |
| rotationProfile / dayLength | A | CloudShell uTime multiplier |
| surfaceLight | A | Body shader ambient term |
| **magneticField** | **B** | New AuroraShell — rotates with magnetic axis |
| **skyPhenomena** | **C** | Ring shadows / corona / belt arcs at scene level |

Most fields fit Pattern A (more uniforms). Magnetic field and sky phenomena warrant new mesh layers.

---

## Phased implementation

### Phase 1 — Surface palette + features
**Fields:** mineralComposition, topography, surfaceHazards
**Pattern:** A — ~10 new uniforms on body shader

**Files to modify:**
- `viewer3d/scene/bodyShader.ts` — new uniforms + GLSL logic
- `viewer3d/lib/bodyShading.ts` — derive uniform values from new fields
- `viewer3d/lib/visualProfiles.ts` — propagate values

**New uniforms:**
- `uMineralTint` (vec3), `uMineralBlend` (float 0-1)
- `uTopographyMode` (int enum), `uTopographyStrength` (float)
- `uHazardTint` (vec3), `uHazardBlend` (float 0-1)

**Mappings (representative, not exhaustive — distinctive blend ranges):**
- `Iron-rich (red oxide)` → `uMineralTint = #b6603d`, `uMineralBlend = 0.55`
- `Carbon-rich (diamond precursor)` → `#2a2528`, blend 0.55
- `Sulfide ore-dominant` → `#caa84a`, blend 0.45
- `Salt / evaporite-rich` → `#e8e2c8`, blend 0.50
- `Chiral organics in soil` → `#a880ff`, blend 0.40 + fresnel-additive shimmer 0.25 on rim
- `Programmable-matter substrate` → `#5e6ad8`, blend 0.50 + fresnel-additive 0.25
- `Highland-continent dichotomy` topography → enum 1, strength 0.5
- `Sand seas / dune fields` → enum 2 (banded bright/dark)
- `Glassy / vitrified surface` → enum 3 (reflective patches)
- `Perchlorate-laden soil` → `uHazardTint = #c9a35a`, blend 0.30
- `Sulfuric acid pools` → `#d9c450`, blend 0.32
- `Mercury vapor pockets` → `#c9c8b8`, blend 0.25
- `Programmable-matter contamination` → `#5e6ad8`, blend 0.35 + shimmer

**GLSL outline:**
- Apply `uMineralTint` multiplicatively to base after the noise blend
- Topography mode switches between feature masks (dichotomy = hemispheric albedo split via `unitPos.y` sign; dune fields = stretched noise; glassy = high specular patches)
- Hazard tint applies as final overlay before light calc

**Phase 1 also trims:** carbon/chiral and iron/metal regex branches in `bodyShading.ts:colorsFor()` — those palette overrides are superseded by the new explicit `mineralComposition` tint pass. Family-level regex (earthlike-ocean detection, desert-iron classification) stays — that still drives the palette base.

**Estimated:** 1-2 commits, moderate GLSL work.

---

### Phase 2 — Atmosphere/cloud chemistry
**Fields:** atmosphericTraces, windRegime, atmosphericPressure, rotationProfile + dayLength
**Pattern:** A — CloudShell + AtmosphereShell uniforms

**Files to modify:**
- `viewer3d/scene/BodyShells.tsx` — extend CloudShell and AtmosphereShell shaders
- `viewer3d/lib/bodyShading.ts` or `visualProfiles.ts` — derive new cloud uniforms

**CloudShell uniforms to add:**
- `uCloudTraceTint` (vec3) — color shift from atmospheric traces
- `uCloudTraceBlend` (float)
- `uCloudRotationMultiplier` (float) — derived from rotationProfile/dayLength
- `uCloudBandStrength` (float) — derived from windRegime

**AtmosphereShell:**
- Already uses `MeshBasicMaterial`; convert to `ShaderMaterial` OR adjust `opacity` from `atmosphericPressure`
- Easier: keep MeshBasicMaterial, compute opacity from pressure tier (Hard vacuum → 0, Supercritical → 0.4)

**Mappings:**
- `Tholin photochemistry` → cloud tint `#d49a52` (orange)
- `Volcanic SO2 plumes` → `#e2cf68` (yellow plumes)
- `Industrial pollutant signatures` → `#7c5a45` (brown smog)
- `Ozone layer present` → subtle `#7ac7e0` shift
- `Halogen mix` → `#a8c879` (greenish tinge)
- `Hypercane / supersonic jet streams` wind → cloud band strength × 1.8
- `Stratified zonal jets` → cloud band strength × 1.5
- `Storm-prone with high gusts` → cloud strength × 1.4
- `Tidally locked` rotationProfile → cloud rotation × 0.05 (nearly static)
- `Fast rotation` → cloud rotation × 2.5
- Pressure: Hard vacuum 0, Near-vacuum 0.05, Thin 0.18, Standard 0.28, Dense 0.36, High-pressure 0.42, Crushing 0.45, Supercritical 0.5

**Estimated:** 1 commit.

---

### Phase 3 — Lighting + biosphere + axial tilt
**Fields:** surfaceLight, biosphereDistribution, axialTilt
**Pattern:** A — body shader

**New body shader uniforms:**
- `uAmbientLevel` (float 0-1) — surfaceLight tier (Glassy 1.2, Bright 1.0, Dim 0.6, Polar night 0.3, Dark sector 0.2)
- `uVegetationMask` (float) — biosphereDistribution presence
- `uVegetationLatitudeBias` (float -1 to 1) — equatorial (eyeball) +1, polar (refugia) -1
- `uVegetationColor` (vec3) — green default, chiral biosphere → purple-tinged
- `uIceCapAsymmetry` (float -1 to 1) — axialTilt-driven, shifts ice caps toward one pole

**GLSL outline:**
- After base/water/tint, apply `uVegetationMask` × latitude-biased blend to `uVegetationColor`
- Modify existing ice-cap calc to bias by `uIceCapAsymmetry`
- `uAmbientLevel` scales the final lit color

**Mappings:**
- `Sterile / not applicable` → uVegetationMask 0
- `Surface-wide coverage` → mask 0.5
- `Equatorial belt only` → mask 0.6, latitude bias +0.8
- `Polar refugia only` → mask 0.4, latitude bias -0.9
- `Subsurface only` / `Cave / karst-bound` → mask 0 (invisible from orbit)
- `Wetland-bound around standing water` → mask 0.5 only where water mask > 0.3
- `Coastal margins` → mask 0.4 at water/land boundary noise
- `Chimeric chiral biosphere` overrides color → `#9d7be8`
- `Photosynthetic microbial mats` → mask 0.6, vivid green tint

**Axial tilt:**
- `Vertical / locked tilt (no seasons)` → asymmetry 0
- `Mild tilt (Earth-like seasons)` → asymmetry 0.15 (subtle)
- `Steep tilt (extreme seasons)` → asymmetry 0.5
- `Polar tipping (~90°)` → asymmetry 0.85 (one cap massive, opposite cap tiny)

**Estimated:** 1 commit.

---

### Phase 4 — Aurora shell
**Field:** magneticField
**Pattern:** B — new mesh layer

**New file:** `viewer3d/scene/AuroraShell.tsx` (modeled on CloudShell)

**Shader concept:**
- Sphere at 1.045× body size, transparent + additive blending
- Latitude-band intensity (centered near magnetic pole, falls off at equator)
- Subtle FBM modulation along bands
- Color varies by magnetic field type
- Rotates on its own axis offset 15-30° from rotation axis (magnetic pole tilt)

**Mappings (revised intensity ceilings, fresnel-weighted, night-biased):**
- `No field (naked)` / `Weak crustal remnant` → AuroraShell not rendered
- `Earth-like dipole` → subtle yellow-green bands, intensity 0.15
- `Strong dipole shield` → vivid green/red bands, intensity 0.35
- `Aurora-belt dominated` → strong dual-band display, intensity 0.50
- `Pulsing / flickering` → time-modulated intensity using `uTime` (slow ~5s cycle)
- `Multipolar chaos` → splotchy noise pattern instead of latitude bands
- `Twin-pole shifting` → bands offset further toward equator
- `Crustal magnetic stripes` → narrow longitudinal bands
- `GU monopole anomaly` → single-pole violet cap glow, intensity 0.60 (loudest treatment)

All intensities are pre-modulation. Final shader: `intensity * fresnel * (0.4 + 0.6 * night)` — brightest at the limb, dim on the sunlit side. Aurora effectively invisible at sub-observer point on day side.

**Wire-in (`Body.tsx`):**
```tsx
{body.surface ? (
  <>
    <AtmosphereShell body={body} />
    <CloudShell body={body} />
    <AuroraShell body={body} />   // new
  </>
) : null}
```

**Estimated:** 1-2 commits, new shader file.

---

### Phase 5 — Scene-level sky phenomena
**Field:** skyPhenomena
**Pattern:** C — Scene.tsx and accessory meshes

**Files:** `Scene.tsx`, possibly new `SceneSkyAccessories.tsx`

**Per-value treatment:**
- `Ring system overhead` — already partly visible if body has rings; add subtle shadow band on body
- `Persistent stellar plume / corona view` — boost the existing Star bloom for `Extreme activity` stars; selection-dependent rendering
- `Belt-glittering arc` — render adjacent belt particles as a visible band (already handled in belt rendering, ensure body is close enough)
- `Eclipse-frequent (close moon)` — render-time moon-shadow on body (raycast moon position onto body)
- `Twin moons visible`, `Sister planet rises` — naturally visible in the scene without code
- `Dark-sector visible nullzones` — body-level dim spots; could fit Pattern A as a uniform
- `Charged-particle sky glow` — pairs with AuroraShell (Phase 4)

**Estimated:** 1 commit, scene-level only. Opportunistic — some entries need no code.

---

## Suggested execution order

1. **Phase 1** — biggest visual payoff, all in body shader, low risk
2. **Phase 2** — second biggest, isolated to CloudShell/AtmosphereShell
3. **Phase 3** — body shader refinements
4. **Phase 4** — most novel, mirrors CloudShell pattern
5. **Phase 5** — opportunistic; some entries may already be visible

Total: ~5-7 commits across the phased plan.

---

## Tradeoffs

**Risk: visual chaos.** Layering 5+ effects on every body can make every world look "busy." Direction is **distinctive over subtle** — blends pushed to the upper end of plausible (mineral 0.45-0.60, hazard 0.25-0.35). Earth-like and anomaly worlds are the priority showcase. Chiral/GU treatments get the loudest fresnel-additive shimmer. Risk mitigation is taste-checks per phase, not blend timidity.

**Risk: shader compilation cost.** Each new uniform/branch adds compilation time. On a 9-body system that's still under 1s; on cheap hardware it could spike. Pattern A (single shader, more uniforms) is cheaper than Pattern B/C. Recommend keeping ~80% of new wiring in Pattern A.

**Visual-test cadence.** Phase 1 alone changes every body's appearance. Worth a pinchtab visual check after each phase. Snapshot tests for the shader-driver code are easy; visual regressions only show up in the live viewer.

---

## Verification approach per phase

- `npx tsc --noEmit` — type safety after each phase
- `npm run lint` — code style
- `npm run test -- --run` — no regressions in the 1270 existing tests
- `npm run dev` + pinchtab screenshot of the 3D viewer on at least 2-3 seeded systems
- For new shader code: hot-reload in `npm run dev` and check 4-5 representative worlds (iron-rich, carbon-rich, GU-tagged, water-ocean, tidally-locked)

---

## Resolved decisions (2026-05-11)

1. **Color discipline → multiplicative with `mix()` weight.** `vec3 tinted = base * uMineralTint; base = mix(base, tinted, uMineralBlend);` Preserves FBM detail and day/night shading; pure additive blows out highlights; pure replace flattens noise into solid color. Exception: chiral / programmable-matter get a fresnel-additive shimmer on the rim (`lit += uMineralTint * fresnel * 0.25`) — that's what distinguishes "shimmer" from "iron oxide."

2. **Aurora intensity → distinctive ceilings, night-biased.** Aurora-belt 0.50, GU monopole 0.60, Strong dipole 0.35, Earth-like dipole 0.15. All multiplied by `fresnel * (0.4 + 0.6 * night)` so they read as ring-at-limb on the night side and fade to nothing on the day side. Pulsing classes use a slow `sin(uTime * 1.2)` cycle (~5s); faster reads as flicker, reserved for the literal "flickering" entry.

3. **Vegetation falloff → smooth with non-zero floor.** Equatorial: `equatorial = 1.0 - smoothstep(0.0, 0.85, abs(unitPos.y))`, masked with `max(0.15, equatorial)` so polar refugia stay visible even on tropical-belt worlds. Multiply by `smoothstep(0.0, 0.4, 1.0 - waterMask)` so vegetation lands on coasts/continents, not open ocean.

4. **Performance → reuse existing FBM samples.** 55 uniforms is far under hardware limits — the real cost is FBM calls. Body shader currently does 5; mineral/hazard masks reuse the existing `n` and `detail` samples (different thresholds, same noise field). New FBM only for things that genuinely need different frequencies — dune fields (stretched), glassy patches (high frequency), vegetation (lower frequency). Realistic total: ~6 FBM calls.

5. **Class-regex → trim where superseded.** `mineralComposition` is the canonical source for surface tint, so the carbon/chiral and iron/metal palette overrides in `bodyShading.ts:colorsFor()` are deleted in Phase 1. Family-level regex (earthlike-ocean detection, desert-iron classification) stays — that still drives the palette **base** that the new tints layer on top of.

**Aesthetic direction:** distinctive over subtle. Earth-like and anomaly worlds are the priority showcase — tune palettes against those two first each phase, sanity-check the rest after.
