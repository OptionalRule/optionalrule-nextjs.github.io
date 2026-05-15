# Companion Systems — Encroachment Fix + Debris Configuration Layer

**Status:** approved design, ready for implementation plan
**Date:** 2026-05-15
**Predecessor:** `docs/superpowers/specs/2026-05-11-companion-stars-design.md`,
`src/features/tools/star_system_generator/docs/BINARY_STABILITY_PLAN.md`

## Problem

Generated multi-star systems still show superjovians visually approaching the
companion star or other planets, even after the Holman-Wiegert (HW) stability
work shipped (`edc02b3`, `d96c668`, `ae7bf4e`, `a541285`). Beyond that, the
debris vocabulary the companion modes can produce is currently limited to (a)
the architecture-driven asteroid belt that any system might roll and (b) the
single `Contact Belt` emitted by `volatileSystem.ts` for volatile-mode systems.
Close and near binaries — the configurations that physically produce the most
distinctive debris — read at the table as undersized.

A four-agent specialist pass (orbital dynamics, GU theory, TTRPG gameplay,
empirical encroachment investigation) produced the following synthesis:

- The encroachment is **mostly a viewer rendering problem** with **one
  generator-side bug**: orbital-sibling sub-systems pass swapped mass
  arguments to `siblingOuterAuLimit`, so 46% of sub-systems generate at least
  one body past the true cutoff (sometimes by 2-3x).
- The companion modes the generator already produces (volatile, circumbinary,
  orbital-sibling, linked-independent, hierarchical-triple) map cleanly to a
  catalog of 10 physically- and lore-defensible debris configurations.
- A 10-archetype v1 catalog is the right calibration. Smaller dilutes the
  effect; larger over-prescribes for what is fundamentally a flavor layer.

This design closes the encroachment gaps and introduces a body-of-work-class
**debris configuration layer** that turns the existing companion-mode lines
("strong rhythmic metric tides," "rich Lagrange shear zones," "smuggler
gaps") into specific, anchorable, scene-anchoring places.

## Goals

- Eliminate visible encroachment of bodies/moons onto the companion star or
  other planets in the 3D viewer.
- Introduce a `DebrisField` first-class entity for companion-driven debris
  configurations. Settlements and ruins can anchor on them.
- Reuse the existing `SystemPhenomenon` infrastructure for transit/survey/
  conflict/anchor beats — debris fields auto-spawn a paired phenomenon
  rather than reinventing the prose pipeline.
- Ship 10 archetypes in v1; defer the remaining catalog with explicit
  triggers for v2.
- Preserve the deterministic seed contract — same seed produces same system
  except for the new fields appearing in JSON.

## Non-Goals

- A new `EntityKind` for debris fields in the narrative graph. The spawned
  phenomenon carries the field's narrative weight via existing graph rules.
- Eccentricity modeling at the binary level. HW continues to use `e = 0.3`.
- Time-varying debris (animated streams, rotating Trojans). Static
  spatial-extent only in v1.
- Public import UI for debris fields. Locked-import scaffolding is added
  for symmetry with bodies, but no UI exposure.
- Per-archetype custom shaders or new viewer dependencies. Renderers reuse
  the existing ring, particle, and line primitives.
- Figure-eight debris as a permanent feature (see §Catalog rationale).

## Findings From The Specialist Pass

### Encroachment root-cause taxonomy

Ranked by visible severity, from the empirical investigation across 1,152
sampled systems:

| Severity | Mechanism | Where | Type |
|---|---|---|---|
| Severe | Mass-arg swap in orbital-sibling sub-system cutoff | `lib/generator/index.ts:4419-4423` | Generator |
| Severe | Sub-system orbit rings drawn in companion-local frame | `viewer3d/lib/sceneGraph.ts:386-441` | Viewer |
| Moderate | `applyBodyOrbitClearance` pushes bodies past cutoff in scene space | `viewer3d/lib/sceneGraph.ts:279-289` | Viewer |
| Moderate | Moon-orbit envelopes use fixed scene radii ignoring neighbours | `viewer3d/lib/sceneGraph.ts:117-179` | Viewer |
| Cosmetic | Circumbinary keep-out ring drawn at `2 * sep` placeholder | `viewer3d/lib/sceneGraph.ts:374-376` | Viewer |

The HW math in `companionStability.ts` is correct. The primary's outer cutoff
and the circumbinary inner cutoff are applied correctly. The sub-system
cutoff is the only call site with swapped mass arguments. Everything else is
the viewer scene-graph builder never consulting the math during layout.

### Debris archetype synthesis

Four core archetypes scored highest across all three specialists:
mass-transfer stream, binary Trojan camp, hierarchical inner-pair halo,
common-envelope ejecta shell. Each produces a distinct gameplay shape
(corridor, settlement zone, two-tier conflict, legacy site) and maps to a
distinct companion mode. They are non-overlapping.

Six variety archetypes round out v1: polar circumbinary ring, Kozai-Lidov
scattered halo, Hill-sphere capture cone, resonance-pumped exocomet swarm,
accretion bridge, Gardener-quarantine cordon. The first five are
physics-defensible; the cordon is a GU-native addition that signals the
setting's tone.

The orbital-dynamics agent's red-flag analysis explicitly excluded the
figure-eight, horseshoe, L1/L2/L3 passive occupants, and polar S-type
rings as permanent features. The figure-eight specifically: true
Chenciner-Montgomery orbits are knife-edge unstable and dispersed within
~10^3 orbits, which contradicts the Gyr-old populated systems the generator
targets. If a future expansion wants the visual, it should land as a
transient variant gated behind a "recent disruption" trait, not as a
standalone permanent archetype.

## Data Model

### New types

```ts
type DebrisFieldShape =
  | 'polar-ring'
  | 'mass-transfer-stream'
  | 'common-envelope-shell'
  | 'inner-pair-halo'
  | 'trojan-camp'
  | 'kozai-scattered-halo'
  | 'hill-sphere-capture-cone'
  | 'exocomet-swarm'
  | 'accretion-bridge'
  | 'gardener-cordon'

type DebrisDensityBand =
  | 'dust'
  | 'sparse'
  | 'asteroid-fleet'
  | 'shell-dense'
  | 'stream'

type DebrisAnchorMode =
  | 'unanchorable'
  | 'transient-only'
  | 'edge-only'
  | 'embedded'

interface DebrisFieldSpatialExtent {
  innerAu: Fact<number>
  outerAu: Fact<number>
  inclinationDeg: Fact<number>      // 0 = in plane, 90 = polar, 180 = retrograde
  spanDeg: Fact<number>             // 360 = full ring, <180 = arc/tadpole/stream
  centerAngleDeg: Fact<number>      // azimuthal anchor for arcs/streams
}

interface DebrisField {
  id: string
  shape: Fact<DebrisFieldShape>
  archetypeName: Fact<string>           // GM-readable label
  companionId: string | null            // driving companion; null for triple-only archetypes
  spatialExtent: DebrisFieldSpatialExtent
  densityBand: Fact<DebrisDensityBand>
  anchorMode: Fact<DebrisAnchorMode>
  guCharacter: Fact<string>             // bleed / chiral / metric reading
  prize: Fact<string>                   // mineable / harvestable feature
  spawnedPhenomenonId: string | null
  whyHere: Fact<string>
}
```

### Existing-type extensions

- `Settlement.debrisFieldId?: string` — optional; mutually exclusive with
  `bodyId`/`moonId` in the same way they are mutually exclusive today
- `HumanRemnant.debrisFieldId?: string` — same pattern
- `GeneratedSystem.debrisFields: DebrisField[]` — top-level array

### Locked-import scaffolding

- `PartialKnownSystem.debrisFields?: DebrisField[]` — for symmetry with bodies
- Lock/merge helpers in `lib/import/locks.ts` extended to preserve locked
  debris-field facts. No public UI in v1.

### Why no narrative-graph `EntityKind`

A debris field's narrative weight is carried by its spawned `SystemPhenomenon`.
The graph already treats phenomena as entities with rich edge support. Adding
a parallel `EntityKind` would duplicate that surface without new affordance.

## Generation Pipeline

New stage `deriveDebrisFields` inserts after `generateSettlements` and before
`generateHumanRemnants`:

```
[11]  generateBodies                       (unchanged)
[12]  generateGuOverlay                    (unchanged)
[13]  generateSettlements                  (unchanged)
[13b] deriveDebrisFields            <- NEW
[13c] attachSettlementsToDebrisFields <- NEW (settlement re-pass)
[14]  generateHumanRemnants                (unchanged)
[14b] attachRuinsToDebrisFields     <- NEW (ruin re-pass)
[15]  generatePhenomena                    (unchanged; consumes
                                            debris-spawned phenomena via
                                            the field's spawnedPhenomenonId)
[16]  buildNarrativeFacts                  (unchanged)
[17]  buildRelationshipGraph               (unchanged)
[18]  derivePopulationLayer                (unchanged; reads anchored
                                            settlements as before)
[19]  runNoAlienGuard                      (unchanged)
```

### `deriveDebrisFields(rng, system) -> DebrisField[]`

1. **Eligibility filter.** Iterate `companions`. For each, compute
   `(mode, separationAu, massRatio mu, companionActivity, primaryAgeState,
   hierarchicalContext)`. Skip if no archetype is eligible.
2. **Archetype selection.** Per eligible companion, roll against the
   archetype catalog table (§Catalog). One archetype per companion is the
   default; hierarchical-triple may produce two (one inner, one outer-driven).
3. **Spatial extent.** Derived from the companion's separation, HW cutoffs
   already computed during body generation, and per-archetype geometry rules
   (polar-ring `inclinationDeg = 90`; trojan-camp `centerAngleDeg = +/- 60`,
   `spanDeg = 30`; stream `spanDeg ~ 5`; shell `spanDeg = 360`).
4. **Density band, anchor mode, GU character, prize, whyHere.** Authored per
   archetype in `data/debrisFields.json` with one slot of authored
   variability per field, picked via `rng.fork('debris-<id>')`.
5. **Spawn phenomenon.** For each `DebrisField`, generate one
   `SystemPhenomenon` via the existing prose pipeline with the archetype's
   `transit`, `survey`, `conflict`, `anchor` beats. Cross-link via
   `DebrisField.spawnedPhenomenonId` and a corresponding pointer on the
   phenomenon.

### Anchor passes

`attachSettlementsToDebrisFields(rng, settlements, debrisFields)` runs once
after settlement generation. For each `DebrisField`:

- `embedded`: ~30% of settlements on bodies whose `orbitAu` falls within the
  field's `[innerAu, outerAu]` move their anchor from `bodyId` to
  `debrisFieldId`. Habitation pattern must be compatible (see catalog table).
- `edge-only`: ~15% chance, same logic but only for settlements on bodies
  near the inner or outer rim.
- `transient-only`: only settlements with mobile habitation patterns
  (`Mobile site`, `Distributed swarm`) qualify; ~50% chance for matching
  candidates.
- `unanchorable`: no settlement attachment.

`attachRuinsToDebrisFields` follows the same pattern for `HumanRemnant`. Both
re-passes preserve deterministic ordering.

### RNG strategy

`rootRng.fork('debris-fields')` produces the parent RNG; each field forks
sub-RNGs from there. No new top-level RNG seeds. Existing seeds reproduce
existing systems except for `debrisFields[]` appearing in JSON, the spawned
phenomena being added to `phenomena[]`, and the small fraction of settlements
and ruins that gain `debrisFieldId` in place of `bodyId`.

## Catalog (v1)

| # | Archetype | Mode trigger | Gate (mu / activity / age) | Shape | Anchor | Compatible habitation patterns |
|---|---|---|---|---|---|---|
| 1 | Mass-transfer stream | volatile | any | stream | edge-only | Surface settlement, Asteroid or belt base |
| 2 | Common-envelope shell | volatile OR circumbinary | primary age = `Aging` or `Evolved` | shell | embedded | Surface settlement |
| 3 | Polar circumbinary ring | circumbinary (close OR tight) | mu >= 0.3 | ring 90 deg | edge-only | Deep-space platform |
| 4 | Binary Trojan camp | circumbinary (any) | mu <= 0.15 | tadpole arcs | embedded | Asteroid or belt base, Deep-space platform |
| 5 | Hierarchical inner-pair halo | hierarchical-triple | always | annulus | edge-only | Surface settlement, Deep-space platform |
| 6 | Kozai-Lidov scattered halo | hierarchical-triple OR orbital-sibling | companion activity = `Flare-prone`+ for sibling | scatter | transient-only | Mobile site |
| 7 | Hill-sphere capture cone | orbital-sibling (moderate / wide) | any | cone | transient-only | Mobile site, Asteroid or belt base |
| 8 | Resonance-pumped exocomet swarm | orbital-sibling OR hierarchical-triple | any | reservoir + plunge cone | unanchorable | n/a |
| 9 | Accretion bridge | volatile | primary OR companion age = `Evolved` | luminous bridge | unanchorable | n/a |
| 10 | Gardener-quarantine cordon | any mode | base rate ~3%, biased toward post-strike systems | ring or arc | unanchorable | n/a |

### Deferred to v2

- Holman edge / resonant pile-up (too similar to existing belt)
- Inter-system filament (linked-independent + very-wide only; long-tail)
- Eccentric cusp arc (requires eccentricity modeling)
- Mass-loss spiral (overlaps common-envelope shell visually)
- P-type Trojans (depends on circumbinary-giant detection)
- Polar plume, retrograde capture, secular resonance strips (flavor variants)
- Observerse-anchored saddle debris
- Forced-chiral bleed-aligned swarm
- Witness-core debris field
- Sol-shadowed quiet zone

Each carries a documented v2 revisit trigger in the orbital-dynamics and
GU-theory specialist reports archived alongside this spec.

### Figure-eight explicit exclusion

Permanent figure-eight orbits are mathematically unstable on populated-system
timescales. The "chaotic figure-eight transient" the user mentioned is
physically defensible only as a few-millennium post-disruption stream, which
contradicts the Gyr-old population the generator targets. If v2 wants this
visual, it should appear as a transient variant of `kozai-scattered-halo` or
`common-envelope-shell`, gated behind a `recent-disruption` system trait, not
as a standalone archetype.

## Rendering — 3D Viewer

New components under `viewer3d/scene/debris/`:

- `DebrisFieldRing.tsx` — ring or arc renderer; reads `innerAu`, `outerAu`,
  `inclinationDeg`, `centerAngleDeg`, `spanDeg`. Renders an arc-section of a
  torus using the existing ring primitives. Used by polar-ring, trojan-camp,
  inner-pair-halo, gardener-cordon.
- `DebrisFieldShell.tsx` — instanced particles in a thick spherical shell.
  Reuses the starfield particle infrastructure. Used by common-envelope-shell.
- `DebrisFieldStream.tsx` — narrow stream plus hot-spot terminus. Uses the
  existing line primitive with procedural color-temperature gradient. Used
  by mass-transfer-stream and accretion-bridge.
- `DebrisFieldHalo.tsx` — sparse scattered cloud with elevated inclination
  spread; same particle approach as the shell. Used by kozai-scattered-halo,
  hill-sphere-capture-cone, exocomet-swarm.

### Layer integration

All debris components are gated behind the existing layer toggles. Physical
layer for archetypes 1-9; human layer for archetype 10. Color tokens follow
existing conventions: physical = neutral-cool, GU = accent-cool, human =
accent-warm.

### Legend additions

One chip per shape class (ring, shell, stream, halo, cordon) — five chips
total. Tooltip exposes archetype label and density band.

### Picker

`viewer3d/scene/debris/pickDebris.ts` maps `(shape, densityBand)` to a
renderer plus visual parameters.

### Body detail panel

When a body has settlements that anchor to a debris field, the panel
includes a `Region:` line linking to the field. Clicking focuses the camera
on the field.

## Exports

### Markdown

`lib/export/markdown.ts`:
- New `## Debris Fields` section between `## Phenomena` and `## Settlements`.
- One subsection per field: shape, extent (inner/outer/inclination), density,
  prize, GU character, anchor mode, spawned phenomenon's four beats.
- Settlement and ruin entries gain a `Region: <archetypeName>` line when
  `debrisFieldId` is set.

### JSON

`lib/export/json.ts`:
- `debrisFields[]` passes through as authored.
- `settlements[].debrisFieldId` and `ruins[].debrisFieldId` pass through.

### Search index

`scripts/generate-search-index.ts` — no changes. Debris fields are inside the
tool, not in the blog content corpus.

## Encroachment Fix Bundle (Phase 0)

These ship as Phase 0, independent of the debris-catalog work.

### 0.1 Generator mass-arg swap

`lib/generator/index.ts:4419-4423`: swap to
`siblingOuterAuLimit(sep, subStar.massSolar.value, primary.massSolar.value)`.
Add `companion-sibling-mass-args.test.ts` that wires `generateSystem`
end-to-end and asserts every sub-body `orbitAu` is within the cutoff
computed with the correct mass order. Expected churn: snapshots of 46% of
orbital-sibling sub-systems refresh once.

### 0.2 Audit coverage extension

`scripts/audit-star-system-generator.ts`: extend `BINARY_STABILITY_CONFLICT`
to cover sub-system bodies. Guards against future regressions of 0.1 and
flags any other call site that's missing the correct argument order.

### 0.3 Viewer: cap sub-system scene extent

`viewer3d/lib/sceneGraph.ts:386-441`: when rendering a sub-system around a
companion, clamp the maximum sub-body scene radius to ~0.85 of the
companion's scene offset from the primary. Add geometric-invariant test.

### 0.4 Viewer: cap moon envelopes against neighbours

`viewer3d/lib/sceneGraph.ts:117-179`: when the outermost body has a neighbour
(next body or companion), clamp the total moon extent to fit within half the
gap. Inner bodies keep their existing moon shells. No semantic data change.

### 0.5 Viewer: cap clearance inflation against companion/cutoff

`viewer3d/lib/sceneGraph.ts:279-289`: when companions are in-scene, never
inflate a body's scene orbit past `companionSceneOffset - safetyMargin`. If
clearance cannot be satisfied, drop the outermost body from rendering and
emit a viewer-side warning trait rather than push past the companion.

### 0.6 Viewer: sync circumbinary keep-out ring with math

`viewer3d/lib/sceneGraph.ts:374-376`: replace `2 * separationToBucketAu(...)`
with `auToScene(circumbinaryInnerAuLimit(sepAu, primaryMass, companionMass))`.
Affects 96% of circumbinary systems cosmetically.

### Phase 0 acceptance

- `npm run audit:star-system-generator:deep` reports zero
  `BINARY_STABILITY_CONFLICT` findings on a fresh 1,152-system corpus.
- Manual smoke: 3 orbital-sibling, 3 circumbinary, 3 hierarchical-triple
  seeds in the 3D viewer; no body or moon visually crosses the companion or
  the keep-out ring.
- Existing snapshot tests refresh deliberately; reviewers expect ~46% of
  orbital-sibling system snapshots to shift.

## Testing

### Phase 0 tests (already enumerated above)

- `companion-sibling-mass-args.test.ts`
- `viewer3d/scene-companion-extent.test.ts`
- `viewer3d/sceneGraph-keepOut.test.ts`

### Phase 1+ debris-catalog tests

- `debrisField-eligibility.test.ts` — for each
  `(companion mode, mu band, activity, age)` cell, the expected archetype
  set is selectable. Includes a deterministic 30-system corpus probe.
- `debrisField-spatial-extent.test.ts` — each archetype's spatial extent
  respects HW cutoffs (no field intersects a planet's orbit or the
  circumbinary keep-out).
- `debrisField-determinism.test.ts` — same seed produces same debris fields
  across 20 sample runs.
- `debrisField-attachment.test.ts` — settlement and ruin attachment respects
  `anchorMode`; no `unanchorable` field receives a settlement; habitation
  pattern compatibility enforced.
- `debrisField-phenomenon-spawn.test.ts` — every debris field has exactly
  one spawned phenomenon with all four beats populated.
- `viewer3d/scene/debris/__tests__/pickDebris.test.ts` — picker covers all
  ten archetypes.
- `viewer3d/scene/debris/__tests__/DebrisField-rendering.test.ts` — every
  shape variant renders without scene-graph errors.

### Audit additions

`scripts/audit-star-system-generator.ts` gains:

- `DEBRIS_FIELD_MISSING` — companion modes that should produce a field
  (mass-transfer for volatile, hierarchical-inner for hierarchical-triple)
  but did not.
- `DEBRIS_FIELD_GEOMETRY_INVALID` — extent intersects a planet's orbit or
  the keep-out radius.
- `DEBRIS_FIELD_ANCHOR_VIOLATION` — settlement or ruin attached to an
  `unanchorable` field, or attached with an incompatible habitation pattern.
- `DEBRIS_FIELD_PHENOMENON_ORPHAN` — bidirectional link between a debris
  field and its spawned phenomenon is broken.

### Manual sample review (Phase 5)

20 systems across distribution x tone x gu x density, biased toward
orbital-sibling and circumbinary companion modes. Reviewer confirms each
archetype appears across the sample, looks plausible in the 3D viewer, and
the spawned phenomena read naturally.

## Rollout Phases

Each phase is independently shippable. No phase removes capability until
validated in Phase 5.

| Phase | Work | Effort |
|---|---|---|
| 0 | Encroachment fix bundle (1 generator fix + 4 viewer caps + audit extension + 3 tests) | 1 day |
| 1 | Types, generator pipeline (`deriveDebrisFields`, anchor passes), `data/debrisFields.json` skeleton, unit tests for selection/determinism | 2 days |
| 2 | UI surfaces: body detail panel `Region:` line, orbital table tweaks (no row, just adjacency hint), Markdown + JSON export, display helpers | 1 day |
| 3 | 3D viewer: ring/shell/stream/halo renderers, picker, legend chips, layer gating | 1.5 days |
| 4 | Authored prose pools: per-archetype `whyHere`, `prize`, `guCharacter` pools, and the four phenomenon beats — populated to gameplay-agent specifications, including settlement-attachment vocabulary review | 1 day |
| 5 | New audit checks, 20-system sample review, distribution validation, snapshot refresh, full-site verification | 0.5-1 day |

**Total: ~7 days** of focused work. Phase 0 is shippable as a standalone
patch within 1 day.

## Risk Mitigation

- **Determinism risk.** No new top-level RNG. The only seed-equivalence break
  is the appearance of `debrisFields[]` in JSON and the small fraction of
  settlements/ruins that gain `debrisFieldId` instead of `bodyId`. Snapshot
  files regenerate once.
- **Snapshot churn.** Documented per phase. Phase 0 expects ~46% of
  orbital-sibling snapshots to shift. Phase 1+ adds new fields without
  removing existing ones; only the small attachment-relocation cases change
  existing field values.
- **Tone risk.** v1 archetype mix is 9 physics-grounded + 1 GU-native
  (`gardener-cordon`). The setting-tone bias is preserved through low rates
  on the cordon (~3%) and through reuse of existing GU vocabulary. Sample
  review (Phase 5) verifies empirically.
- **Visual risk in 3D viewer.** All debris components reuse existing
  primitives (ring, particle, line). No new shaders. All gated behind
  existing layer toggles with established color tokens. Legend chips
  expose what's present.
- **Settlement-attachment regression.** The anchor re-pass moves a settlement
  from `bodyId` to `debrisFieldId` in some cases. The population layer
  consumes settlement anchors for body-level population derivation; it must
  continue to count debris-anchored settlements toward their host body's
  band where applicable. Verified by a new test in
  `debrisField-attachment.test.ts`.
- **Audit drift risk.** Four new audit checks land in Phase 5 with explicit
  pass conditions. Pre-Phase-5 PRs do not enforce them.

## Quality Bars Per Phase

Every phase must, before merging:

- All existing tests pass.
- New tests for the phase's surface present and passing.
- `npm run audit:star-system-generator:quick` passes.
- `npm run audit:star-system-data` passes.
- `npm run lint` and `npm run build` pass.
- For Phase 3: visual review of 5 generated systems in the 3D viewer across
  companion modes.
- For Phase 5: manual review of 20 generated systems and full-site
  `npm run test`.

## Acceptance Criteria

- Every generated system with a qualifying companion mode includes a
  `debrisFields: DebrisField[]` array. Systems without qualifying companions
  have an empty array.
- Every `DebrisField` has a non-null `spawnedPhenomenonId` and the linked
  phenomenon contains all four beats.
- `band` of settlements anchored to a debris field still counts toward the
  host body's population layer band where applicable.
- 3D viewer renders all ten archetype shape classes without errors and
  without any body or moon visually crossing the companion or the keep-out
  ring.
- Phase 0 audit reports zero `BINARY_STABILITY_CONFLICT` findings on a
  1,152-system corpus.
- Phase 5 audit reports zero `DEBRIS_FIELD_*` errors on the same corpus.
- Same seed produces same debris fields across 20 sample runs.
- Markdown and JSON exports include the new fields appropriately.
- `npm run lint`, `npm run test`, `npm run build` pass before each phase
  merge.
- Manual review of 20 sample systems shows the binary modes now read as
  having distinctive, gameable debris context.

## Out of Scope

- Time-varying debris (animated streams, rotating Trojans).
- Eccentricity modeling at the binary level.
- New `EntityKind` for debris fields in the narrative graph.
- Public import UI for debris fields (locked-import scaffolding only).
- Custom shaders or new viewer dependencies.
- Figure-eight as a permanent feature.
- Per-archetype custom narrative-graph edges (existing edges via the
  spawned phenomenon are sufficient).
- v2 catalog expansion (saddle debris, forced-chiral swarm, witness-core
  field, Sol-shadowed zone, Holman edge, inter-system filament, eccentric
  cusp arc, mass-loss spiral, P-type Trojans, polar plume, retrograde
  capture, secular resonance strips).
- LLM-generated prose for debris field text. Client-only static export
  continues to prefer authored procedural pools.

## References

- `src/features/tools/star_system_generator/docs/BINARY_STABILITY_PLAN.md`
  — the Holman-Wiegert stability work this design builds on.
- `src/features/tools/star_system_generator/docs/PRD.md` — established the
  layered architecture (physical / GU / human) and confidence labels.
- `src/features/tools/star_system_generator/docs/SOURCE_WRITEUP.md` —
  canonical MASS-GU procedure; section 18 (settlement scale + location)
  drives the anchor-mode vocabulary; binary separation table at line 96.
- `src/features/tools/star_system_generator/docs/POPULATION_LAYER_PLAN.md`
  — the pattern this design mirrors for phased rollout, JSON-shape
  preservation, and pure-derivation philosophy where applicable.
- `src/features/tools/star_system_generator/docs/background/GU_SETTING_PRIMER.md`
  — frontier/core-world tone, Gardener constraints, Iggygate anchor
  vocabulary.
- `src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md`
  — canonical GU vocabulary used in archetype `guCharacter` fields.
- `src/features/tools/star_system_generator/lib/generator/companionStability.ts`
  — HW math substrate.
- `src/features/tools/star_system_generator/lib/generator/companionMode.ts`,
  `companionGeometry.ts`, `companionStar.ts`,
  `volatileSystem.ts` — existing companion infrastructure.
- `data/settlements.json`, `data/narrative.json` — existing vocabulary the
  catalog references; no new entries added to these.
