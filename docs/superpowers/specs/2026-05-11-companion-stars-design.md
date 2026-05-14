# Companion Stars Design

**Date:** 2026-05-11
**Status:** Draft — awaiting plan
**Scope:** Star System Generator (`src/features/tools/star_system_generator/`)

## Problem

The Star System Generator lumps all companion stars into a single flat list with one "Multiple-Star Context" panel. Whether the companion is touching the primary, sharing a barycenter with circumbinary planets, holding its own sibling system, or sitting far enough away to be a separate system entirely — they all render the same way: a floating star at a hash-derived angle, a paragraph of consequence text, no orbital dynamics, no clickable links, no bodies of its own.

Two distinct user-facing capabilities are missing:

1. **Independent companion systems** (e.g., Proxima Centauri-style) should be linked sibling pages, reachable by a deterministic seed so any seed always returns the same group. In the viewer they should appear as a distant, clickable star.
2. **Orbital companions** (close, tight, moderate, wide binaries) have real consequences for the system's bodies and need treatment that's either physically faithful (circumbinary planets, no inner zone) or productive for GM use (companion gets its own bodies/settlements/gates).

## Goals

- Companions classified by relationship mode, with mode driving data, report, and viewer behavior.
- Multi-companion support (`Hierarchical triple` emits two companion entries — one inner, one outer).
- Linked-independent companions have deterministic derived seeds; visiting either seed surfaces the link to the other.
- Orbital-sibling companions get their own bodies, settlements, gates, ruins, and phenomena, scoped to a sub-system block in the report and rendered as a second sub-graph in the 3D viewer.
- Circumbinary configurations push the inner edge outward and orbit bodies around the barycenter.
- Volatile (contact / near-contact) configurations strip the inner system and produce a hazard belt + GU phenomenon instead of habitable bodies.

## Non-Goals

- No support for higher-order multiples beyond Hierarchical triple (current generator caps at one or two companions).
- No eager generation of linked-independent companion systems — they're generated on visit via their derived seed.
- No new known-system data path (`PartialKnownSystem`) for companions.
- No per-body `parentStarId` field on `OrbitingBody`; array membership encodes anchoring.
- No second reachability roll for linked-independent companions in this system's data (they compute their own when visited).
- No backwards-compatibility shim for old generator output — companions array semantics change.

## Classification Model

A companion's `separation` value maps deterministically to one of four relationship modes. Mode is computed in the generator and stored on each `StellarCompanion`.

| `separation` value | `mode` | Behavior |
|---|---|---|
| `Contact / near-contact` | `volatile` | No bodies generated in this system. Replaced by a hazard belt body + a GU phenomenon. Companion shares the primary's position with a merged-bloom visual. |
| `Close binary`, `Tight binary` | `circumbinary` | Bodies in this system orbit the barycenter. Inner edge pushed outward by ~2× binary separation. Companion has no bodies of its own. Zones computed from combined luminosity. |
| `Moderate binary`, `Wide binary` | `orbital-sibling` | Companion has its own bodies, settlements, gates, ruins, and phenomena, scoped to it. Rendered in the same scene as a second star with its own sub-graph of bodies. |
| `Very wide` | `linked-independent` | Companion is its own system. Derived seed `<primary-seed>:c<n>`. Clickable link in chrome and as a distant star at the scene edge. Not generated eagerly. |
| `Hierarchical triple` | **two entries**: `orbital-sibling` (inner pair) + `linked-independent` (outer star) | Generator emits two companions. Inner renders in-scene with its own bodies; outer is a distant clickable marker. |

Separation strings stay user-visible (rendered in cards and chrome). `mode` is the structural label everything downstream switches on.

## Data Model

### `StellarCompanion` (changed)

```ts
export type CompanionRelationshipMode =
  | 'volatile'
  | 'circumbinary'
  | 'orbital-sibling'
  | 'linked-independent'

export interface StellarCompanion {
  id: string
  companionType: Fact<string>
  separation: Fact<string>
  planetaryConsequence: Fact<string>
  guConsequence: Fact<string>
  rollMargin: Fact<number>
  mode: CompanionRelationshipMode      // NEW
  star: Star                            // NEW — companions are full stars (name, spectral, mass, etc.)
  linkedSeed?: Fact<string>             // NEW — present iff mode === 'linked-independent'
  subSystem?: CompanionSubSystem        // NEW — present iff mode === 'orbital-sibling'
}
```

### `CompanionSubSystem` (new)

```ts
export interface CompanionSubSystem {
  zones: SystemZones
  bodies: OrbitingBody[]
  settlements: Settlement[]
  gates: Gate[]
  ruins: HumanRemnant[]
  phenomena: SystemPhenomenon[]
}
```

### `GeneratedSystem` semantics (changed but no field rename)

- `companions: StellarCompanion[]` length: 0, 1, or 2.
- `zones`: describes barycenter zones when any companion is `circumbinary`; otherwise describes the primary.
- `bodies`: primary's bodies for `orbital-sibling`; circumbinary bodies for `circumbinary`; empty (plus the synthetic hazard belt) for `volatile`. Always "bodies anchored to the primary or barycenter."
- `settlements`, `gates`, `ruins`, `phenomena` (top-level): anchored to top-level bodies only. Companion-anchored siblings live in `companion.subSystem.*`.

### No new fields on `OrbitingBody`, `Settlement`, `Gate`, `HumanRemnant`, `SystemPhenomenon`

Anchoring to the companion is expressed by array membership (`system.bodies` vs `companion.subSystem.bodies`). A `parentStarId` field would only ever take two values and would create a new failure mode (wrong star id silently bypassing logic).

## Generator Changes

### Multi-companion emission (`generateStellarCompanions`)

1. Roll existence + separation as today.
2. Compute `mode` from `separation`.
3. Build a real `Star` for the companion via a new `generateCompanionStar(rng, primary)`:
   - Mass biased smaller than primary (M dwarf bias for G/K primaries, brown-dwarf bias for M primaries, etc.).
   - Age inherits from primary (coeval).
   - Spectral class, luminosity, metallicity, activity rolled with the existing star primitives under those constraints.
   - Uses a forked RNG `companions.star1`.
4. If mode is `linked-independent`, set `linkedSeed = '<primarySeed>:c1'` and emit a single entry with no `subSystem`.
5. If mode is `volatile` / `circumbinary`, emit a single entry with `star` set and no `subSystem`.
6. If mode is `orbital-sibling`, emit a single entry with `star` and `subSystem` populated (see below).
7. If `separation === 'Hierarchical triple'`: the first entry's mode is `orbital-sibling` (with sub-system). Additionally emit a second entry: `mode: 'linked-independent'`, `linkedSeed: '<primarySeed>:c2'`, no `subSystem`, with its own generated `star` (via `companions.star2`).

### Companion sub-system generation (`orbital-sibling` only)

Run the existing body / settlement / gate / ruin / phenomenon generators against the companion star context. Required refactor: each of these generators takes an explicit `(star, zones, bodies)` context argument instead of reading `system.primary` / `system.zones` / `system.bodies` implicitly. The top-level generator runs them with the primary's context as today; the sub-system runs them with the companion's context into `subSystem.*` fields.

Forked RNGs: `companions.sub1`, `companions.sub1.bodies`, `companions.sub1.settlements`, `companions.sub1.gates`, `companions.sub1.ruins`, `companions.sub1.phenomena`.

### Circumbinary zones

When any companion has `mode === 'circumbinary'`:

- `system.zones` is computed from `primary.luminositySolar + companion.star.luminositySolar`.
- Inner-edge orbit budget for body generation starts at `2 * binarySeparationAu` (using a separation-bucket → AU table; the existing `COMPANION_AU` table in `sceneGraph.ts` is the canonical bucket map and should be lifted to a shared module).
- Bodies orbit the barycenter (semantic only — the AU values are computed from the new zones).

### Volatile mode

- Skip the standard body generator entirely.
- Inject one synthetic `OrbitingBody` of `category: 'belt'` at an orbit just outside the binary contact zone, named "Binary contact debris belt." Carries hazard traits.
- Inject one `SystemPhenomenon` ("Binary contact zone") with appropriate travel-effect / survey-question / conflict-hook text.
- Settlements, gates, ruins: none in this system (no bodies to anchor to). The `Settlement` density option is honored only insofar as it can attach to the hazard belt; default is none.

### Linked-independent mode

Nothing extra in this system's data. The derived `linkedSeed` is the only structural change. Visiting `?seed=<primarySeed>:c1` re-runs the full generator on that seed string, which deterministically produces the companion's system.

**Preview-vs-linked consistency.** The parent system's `companion.star` (used to render the spectral chip and mass in the Multiple-Star Context card) must match the primary star of the system generated at the derived seed. This is achieved by using the derived seed string itself as the RNG source for the companion's star generation in *both* contexts:

- Parent generator at seed `foo`: companion star is rolled from `RNG('foo:c1')`.
- Visit at seed `foo:c1`: primary star is rolled from `RNG('foo:c1')` (the existing star path).

Both paths use the same seed string for the same star, so the preview is guaranteed to match. The companion's `star` field in the parent system is therefore a *correct preview*, not a teaser that diverges from the linked page.

### Reachability

Stays a single roll for the whole system. The `+1 major reachable system` modifier already exists per companion and remains. No new reachability roll for linked-independent companions in this system; they compute their own when visited.

### Determinism guarantee

All forked RNGs are named (`companions`, `companions.star1`, `companions.star2`, `companions.sub1`, etc.). Linked seeds derive purely from the parent seed string + index. There is no back-pointer stored in the linked system; the convention is that any seed containing `:c<n>` knows its parent is the prefix. Visiting `?seed=foo:c1` always yields the same companion system regardless of how the user got there.

## Report / UI Changes

### `SystemOverview` — Multiple-Star Context panel

Today shows `companions[0]` only. Rewritten to iterate over `system.companions` and render one card per entry, switching on `mode`:

- **`linked-independent`**: companion type, separation, spectral chip, mass; **link button** "Open linked system →" with href `?seed=<linkedSeed>` (using the existing query-state hook). Caption: "Generated independently. This system gains +1 reachable system."
- **`orbital-sibling`**: companion type, separation, spectral chip + mass; one-line body summary (e.g., "3 rocky planets, 1 belt") with caption "Generated below."
- **`circumbinary`**: companion type, separation; note "Bodies in this system orbit the binary's barycenter. Inner edge: X AU."
- **`volatile`**: companion type, separation; note "Stars are contact-touching. No planets formed; hazardous debris and intense GU bleed dominate the inner system."

The "Multiplicity" row in the top stats grid becomes a short summary (e.g., `"Binary · orbital sibling"`, `"Triple · inner sibling + linked outer"`).

**Parent-link affordance.** When the current seed contains `:c<n>` (the system is itself a linked companion), the panel includes a "Return to parent system →" card linking to the prefix seed. This makes navigation between linked siblings bidirectional without needing any data stored in either system.

### New `CompanionSubSystem` section

Rendered only when a companion has `mode === 'orbital-sibling'`. Sits below the primary's bodies, separated by a divider. Collapsed by default. Visually subordinate (thinner header, muted accent) so it reads as part of the same system, not a peer.

Contents:

- Scaled-down header: companion star name, spectral chip, mass, age. Zones rendered inline.
- `BodyList` / `BodyDetailPanel` (same components as primary) fed `subSystem.bodies`.
- Settlements, gates, ruins, phenomena sections, same components, scoped to `subSystem.*`.

### Aggregations and counts

Section headers that show counts ("3 settlements") sum the primary's and companion's counts when an `orbital-sibling` is present. Display format: `"5 settlements (3 primary, 2 companion)"`. Same principle as commit `1bf2477`'s moon-anchored fix — careful with cross-array aggregation.

### Markdown export

`lib/export/markdown.ts` gets a parallel "Companion System" section for `orbital-sibling`. For `linked-independent`, the export includes a "Linked system" line with the derived seed and the URL convention, but does not embed the linked system's contents.

### `StarDetailCard` (3D viewer chrome)

Companions list becomes mode-aware:
- `volatile` / `circumbinary` / `orbital-sibling`: `"Companion · <type> · <separation>"` + spectral chip.
- `linked-independent`: same, plus "Open linked system" link.

## 3D Viewer Changes

### Scene graph

`viewer3d/lib/sceneGraph.ts` `buildCompanion` is rewritten to switch on `mode`:

- **`volatile`**: companion at very small offset from primary so they read as a touching pair, with a shared bloom. No inner orbits rendered; the hazard belt body renders as today.
- **`circumbinary`**: companion at a small offset, on a slow orbital path around the scene origin (both stars dance around the barycenter). Bodies render around the origin. A faint "no-go" ring marks the inner-edge keep-out zone derived from the companion's offset.
- **`orbital-sibling`**: companion at a larger offset on its own slow orbital path around the origin. Its bodies render as a **second sub-graph** with orbit centers and visuals following the companion star's position. Body orbit rings use a slightly different stroke (dashed, lower opacity) so a reader can tell at a glance which star they belong to.
- **`linked-independent`**: rendered as a `DistantStarMarker` — a small bright point with a label, placed at a fixed multiple of the outermost orbit so it's near the edge of frame at any zoom. Not orbiting anything. An HTML overlay in the chrome layer places a clickable "→" affordance next to the marker; clicking navigates to `?seed=<linkedSeed>` via the existing query-state hook.

### Scene graph type changes

`SceneGraph` extended with:

```ts
interface SceneGraph {
  // ...existing fields...
  subSystems: Array<{
    star: StarVisual
    bodies: BodyVisual[]
    orbits: OrbitVisual[]
  }>
  distantMarkers: Array<{
    id: string
    visual: StarVisual         // dim variant
    label: string
    linkedSeed: string
  }>
}
```

Scene render walks top-level orbits, each sub-system's orbits, and emits the distant-marker overlay.

### Clickability and accessibility

The distant-link marker is the only clickable thing among companions. Other modes' companion stars are non-clickable but still surface in `StarDetailCard`. Keyboard accessibility is provided by the chrome's "Open linked system" link; the 3D marker is a visual reinforcement, not the primary affordance.

### Camera

No auto-fit changes for `orbital-sibling` (companion bodies sit close enough that existing fit-to-content handles them). For `linked-independent`, the distant marker's fixed multiple of outermost orbit means it never pushes the camera further out — it's always already near frame edge.

### Hierarchical triple

Falls out of the existing rules: inner `orbital-sibling` entry renders its sub-graph; outer `linked-independent` entry renders its distant marker. Both visible at once.

## Testing

- **`generator-determinism.test.ts`**: extend to assert that companions are deterministic across mode (including the second entry for Hierarchical triple), and that `linkedSeed` values are stable for a given primary seed.
- **New test** `companion-modes.test.ts`: for each separation value, assert that the generator emits the right number of companions, the right modes, and the right shape (sub-system present iff orbital-sibling, linkedSeed present iff linked-independent).
- **New test** `companion-subsystem-generation.test.ts`: orbital-sibling produces bodies/settlements/gates/ruins/phenomena scoped to the companion; counts are non-zero when settlement density permits; nothing leaks into top-level arrays.
- **New test** `companion-volatile.test.ts`: volatile mode produces zero bodies in `system.bodies` apart from the synthetic hazard belt, and produces the binary-contact phenomenon.
- **New test** `companion-circumbinary.test.ts`: zones inner edge is pushed out by ~2× separation AU; bodies' innermost orbit is outside the no-go zone.
- **New test** `companion-linked-seed.test.ts`: visiting `?seed=foo:c1` deterministically produces the same system every time, and that system's properties differ from the parent system at `?seed=foo`. The parent's `companion.star` matches the linked system's `primary` (preview-vs-linked consistency).
- **Viewer tests** (`visualProfiles.test.ts` extension): `DistantStarMarker` is emitted iff a linked-independent companion exists; sub-system bodies are emitted iff orbital-sibling exists; touching-pair offset for volatile is below the threshold for keep-out rendering.
- **Aggregation tests**: extend the moon-anchored count tests from commit `1bf2477` to also assert that companion-anchored settlements/gates are summed correctly into the top-level header counts and shown with the split format.

## Migration

- No on-disk data to migrate (everything is generated from the seed at view time).
- Cached generator output in `.next/`, `out/`, browser history are stale-but-harmless; users with old URLs continue to see whatever the old generator produced until they re-roll.
- `StarSystemGenerator.test.tsx` snapshots and any fixture tests will need updating to reflect new companion shapes and the new Multiple-Star Context panel structure.

## Open Risks

- **Refactor of body / settlement / gate generators** to take an explicit `(star, zones, bodies)` context touches a lot of the generator. Mitigation: do this refactor as the first commit, before any companion behavior change, so it's a pure no-op test pass.
- **Visual hierarchy in the report** when a system has *both* an orbital-sibling and a linked-independent (Hierarchical triple) needs care so the reader doesn't lose track of which "system" they're reading about. The collapsed-by-default sub-system section and the separate Multiple-Star Context card per companion are the levers.
- **Determinism of derived seeds**: the `:c<n>` convention is namespace-shared with user-typed seeds. Decision: accept any seed string as-is — a user-typed `foo:c1` is treated as an already-derived seed whose parent system is at seed `foo`. The Multiple-Star Context card on a system with a `:c<n>` seed shows a "Return to parent system" link (mirror image of the "Open linked system" affordance) pointing at the prefix.
- **3D performance** when rendering two sub-graphs simultaneously: shouldn't be material (the sub-graph is structurally the same as the primary, just smaller), but worth measuring.
