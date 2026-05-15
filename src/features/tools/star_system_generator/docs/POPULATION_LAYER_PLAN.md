# Body-Level Population Layer Plan

## Purpose

Procedurally generated systems currently treat the human layer as a list of *named settlements* and nothing else. A body with one named settlement reads as a body with literally one settlement; a body with none reads as uninhabited even when its habitability, reachability, and resource access imply a much larger background population. The result is that generated systems feel undersized — frontier outposts come across as the *entire* civilizational footprint rather than the *noted* part of a much larger fabric.

This plan introduces a **body-level population layer** that sits between named settlements and pure void. Each body gains a derived population profile that records overall scale, surface vs. underground vs. orbital presence, count of unnamed sites, and optional terraform state. The renderer consumes this on the body detail panel, the orbital table, the system overview, the Markdown/JSON exports, and the 3D viewer. Failed terraform sites feed the existing `HumanRemnant` pipeline so they become first-class ruins.

The intended outcome is that every generated system reads as a place where the named settlements are the visible peaks of a much larger civilization, rather than the entire civilization.

## Background

The pre-design debate (five-voice synthesis) established three things:

1. **~60% of the feature is latent in existing types.** `Settlement.population` already carries nine bands (Minimal → 10+ million). `SettlementHabitationPattern` already includes `Sealed arcology`, `Underground city`, `Hub complex`, `Distributed swarm`, `Drift colony`, `Generation ship`, `O'Neill cylinder`. `data/settlements.json` already authors mega-structure vocabulary: Lava-tube arcology, Asteroid tunnel city, Ice-vault city, Borehole habitat, Aerostat city, Terminator rail city. The `localInstitution` `EntityKind` is wired into the narrative graph but never generated. The feature is mostly a *surfacing* problem, not a generation problem.
2. **Population follows Reachability + Resource + Route Value, not raw habitability.** The source writeup section 18 thesis: "many of the most important settlements should *not* be on habitable planets. They should be on resource nodes, chokepoints, shielded moons, orbital yards, and dangerous extraction sites." Background population concentrates wherever life support is cheaper than the alternative — under ice, in lava tubes, at terminators, around fuel depots — not in carpets of suburbs.
3. **Bands, not raw integers.** A GM has no baseline to interpret "14M people across the system." A categorical band plus one anchor-body sentence does the same job at the table. Numbers are stored for export consumers (JSON) but never surfaced on cards.

## Design Decisions

The brainstorming session settled the following:

- **Architectural target:** one new field on `OrbitingBody`, not a top-level `SystemPopulation` struct. The structural argument from the maximalist position (downstream consumers must be able to ask "how populated is this world?") survives at the field level without requiring a parallel top-level array.
- **Pipeline placement:** derived **after** settlements are generated. The existing `presence.score` already gates settlement choices on habitability/resource/GU/hazard; population is a downstream summary of that scoring plus a small set of additional facts, not a new generative driver.
- **RNG strategy:** zero new RNG forks. Pure derivation from existing facts. Existing seeds reproduce; snapshot churn limited to systems where the new field appears in JSON.
- **Mega-complex modeling:** reuse the existing `habitationPattern` vocabulary. No new entity type. The body gains a derived `prominentForm` string when its band is high enough.
- **Terraforming:** four-state enum (`candidate | in-progress | stabilized | failed`). Failed terraforms feed the existing `HumanRemnant` pipeline. `'stabilized'` (not "terraformed") is the verb-end state — preserves the tone that even successful terraforming is not garden-world easy.
- **3D indicator:** one habitation-density glyph in the existing `BodySettlements.tsx` (or adjacent component), using a shelter/dome ideogram, **not** a human silhouette. Two visual states (`present`, `dominant`). Gated behind the existing Human layer toggle. Legend entry reads "Inhabited body."
- **Deferred:** `Settlement.representativeOf`, `terraformProject` and `INHABITS` graph edges, per-station counts, cultural/national differentiation. Each has an explicit revisit trigger (see Out of Scope).

## Population Bands

Nine body-level bands, monotonic by total population on the body. Distinct from settlement bands (which describe one named site).

| Band | Approx total on the body | Typical context |
|---|---|---|
| `empty` | 0 | No human presence; uninhabitable, unreachable, or simply unworked |
| `automated` | 0 living | Drone fleets, AI services, mothballed extraction rigs |
| `transient` | <100 | Survey teams, extraction rotations, no permanent residency |
| `outpost` | 100–10,000 | A few named sites; little or no unnamed support |
| `frontier` | 10,000–1M | Named sites plus modest unnamed support (tunnel-stack housing, satellite camps) |
| `colony` | 1M–10M | Established population; named cities with substantial unnamed support |
| `established` | 10M–100M | Major world; many named cities and extensive unnamed support |
| `populous` | 100M–1B | Densely populated; planetary-scale civilization |
| `dense-world` | 1B+ | Garden-state or stabilized terraform; canon-rare |

**Gating constraints (enforced by the derivation function):**

- `populous` and `dense-world` require *stable* atmosphere (not toxic, not airless, not high-radiation) AND reachability of at least mid-trunk AND a non-failed-terraform state.
- `dense-world` additionally requires `terraformState: 'stabilized'` OR a body whose unmodified atmosphere/hydrosphere is already garden-state (rare in MASS-GU canon — most systems will never roll a `dense-world` body).
- `frontier` and below are the expected modal band for almost every generated body. Setting tone is preserved by the rarity of upper-tier worlds, not by capping the ceiling.

## Architecture

### Pipeline Placement

```
[1-11]  All entity-producing stages          (unchanged)
[12]    generateSettlements                   (unchanged)
[12b]   derivePopulationLayer       <- NEW
[12c]   generateRuins                         (unchanged — but reads population for failed-terraform input)
[13]    buildNarrativeFacts                   (unchanged)
[13b]   buildRelationshipGraph                (unchanged)
[14]    renderSystemStory                     (unchanged)
[15]    runNoAlienGuard                       (unchanged)
```

The population stage is a single function. It reads `system.bodies`, `system.settlements`, `system.reachability`, `system.architecture`, and `system.options`. It writes a `Fact<BodyPopulation>` onto each `OrbitingBody.population` (and onto `Moon.population` for moons that pass a habitability floor).

It does not consume new RNG. All decisions derive from existing fields plus deterministic lookup tables.

### Core Data Types

```ts
type BodyPopulationBand =
  | 'empty' | 'automated' | 'transient'
  | 'outpost' | 'frontier' | 'colony'
  | 'established' | 'populous' | 'dense-world'

type BodySurfacePresence = 'none' | 'scattered' | 'widespread' | 'dominant'
type BodyOrbitalPresence = 'none' | 'minimal' | 'substantial' | 'ring-city'

type TerraformState =
  | 'none'           // never terraformed, never a candidate
  | 'candidate'      // suitable for future terraforming, no active project
  | 'in-progress'    // active terraform project; surface partly viable
  | 'stabilized'     // completed; biosphere holds
  | 'failed'         // attempted, abandoned, ruins remain

interface BodyPopulation {
  band: BodyPopulationBand
  surface: BodySurfacePresence
  underground: BodySurfacePresence
  orbital: BodyOrbitalPresence
  unnamedSiteCount: string       // 'none' | 'a handful' | 'dozens' | 'hundreds' | 'thousands'
  prominentForm: string | null   // pulled from habitationPattern pool when band >= colony
  terraformState: TerraformState
  terraformNote: string | null   // free-text note when state is 'in-progress' or 'failed'
}
```

`OrbitingBody.population: Fact<BodyPopulation> | null` — null only for bodies with no measurable human presence at all (still uses `band: 'empty'` more commonly — null is reserved for bodies where the question doesn't apply, e.g., the central star).

`Moon.population: Fact<BodyPopulation> | null` — present only on moons that meet a habitability floor (surface accessible, not extreme-hot, not extreme-radiation).

### System-Level Derived Summary

`GeneratedSystem.populationSummary` is a thin derived view, not a separately generated field. It is computed at export and render time from the body populations and exposes:

```ts
interface SystemPopulationSummary {
  systemBand: 'skeleton' | 'frontier-scatter' | 'working' | 'established-hub' | 'dense-sector'
  anchorBodyId: string | null     // body holding the largest population; null for skeleton systems
  populatedBodyCount: number      // bodies with band > 'transient'
  totalUnnamedSiteScale: string   // 'none' | 'scattered' | 'extensive' | 'continuous'
}
```

`systemBand` derives from the maximum body band, weighted by reachability class. A system with one `colony`-band body in a marginal-pinch reachability still reads as "working," not "established-hub." Setting-Anchor's "Reachability + Resource + Route Value drives population" principle is enforced here.

### Determinism

Pure derivation. No RNG fork. The function signature is:

```ts
function derivePopulationLayer(system: GeneratedSystem, options: GenerationOptions): GeneratedSystem
```

It returns a new system with `bodies[].population` and `bodies[].moons[].population` populated. Existing seeds reproduce exactly except for the new field appearing in JSON.

## Generation Algorithm

The derivation is a deterministic decision tree. No RNG draws.

### Step 1: Body Classification

For each body, compute four signals from existing facts:

1. **Habitability tier** — derived from atmosphere, hydrosphere, geology, radiation. Five steps: `hostile | harsh | shielded-viable | viable | comfortable`.
2. **Resource tier** — derived from `body.detail` resource notes, presence score's `resource` component, and architecture context.
3. **Strategic tier** — derived from presence score's `access` + `strategic` + `legalHeat` components, reachability class, and whether the body anchors a Gate.
4. **Settlement load** — sum of named settlements on the body (and any moons), weighted by settlement population band.

### Step 2: Band Selection

A 4-axis lookup table maps `(habitability, resource, strategic, load)` to a base band. Upward modifiers:

- Stable atmosphere + high resource → +1 band (caps at `populous` unless terraformed)
- Hub-class reachability + viable habitability → +1 band
- Stabilized terraform → +2 bands (this is what unlocks `dense-world`)
- High `Hub` settlement density option → +1 band

Downward modifiers:

- Failed terraform → −2 bands minimum (capped at `colony`)
- Severe GU exposure → −1 band
- Active flare/radiation hazard → −1 band
- Tidally locked + active M-dwarf flares → caps at `frontier`

### Step 3: Presence Distribution

Given the band, split the implied population across surface, underground, orbital:

| Habitability | Surface | Underground | Orbital |
|---|---|---|---|
| `hostile` | `none` | `dominant` if band ≥ `frontier`, else `none` | varies |
| `harsh` | `scattered` | `widespread` | varies |
| `shielded-viable` | `scattered` | `widespread` | varies |
| `viable` | `widespread` | `scattered` | varies |
| `comfortable` | `dominant` | `scattered` | varies |

Orbital presence is independent — driven by Gate presence, asteroid belt resources, and architecture (e.g., compact-rocky-chain cores often produce orbital habitat networks).

### Step 4: Prominent Form

When `band >= 'colony'`, pick a `prominentForm` string from the existing `habitationPattern` pool, filtered by habitability:

- Hostile + underground-dominant → `Lava-tube arcology` / `Borehole habitat` / `Asteroid tunnel city`
- Harsh + shielded → `Ice-vault city` / `Sealed arcology` / `Storm-shelter trench city`
- Viable + surface-dominant → `Terminator rail city` / `Aerostat city` / `Surface arcology`
- Orbital-dominant → `Ring-habitat arc` / `O'Neill cylinder` / `Drift habitat cluster`

Selection is deterministic (stable hash of body ID into the filtered list). No RNG.

### Step 5: Unnamed Site Count

Maps band → label:

| Band | `unnamedSiteCount` |
|---|---|
| `empty`, `automated`, `transient` | `'none'` |
| `outpost` | `'a handful'` |
| `frontier` | `'dozens'` |
| `colony` | `'hundreds'` |
| `established`, `populous` | `'thousands'` |
| `dense-world` | `'continuous'` |

### Step 6: Terraform State

For each body, decide terraform state from existing facts:

- `failed` — if the body has hostile-atmosphere markers AND an existing settlement with a "Failed terraforming site" / "Terraforming liability camp" location, OR if the system's source-writeup table 17 outcome was 18 (Failed terraforming site).
- `in-progress` — if the body is a habitable-zone candidate with active mirror/dome infrastructure markers in any settlement.
- `stabilized` — if the body is `viable` or `comfortable` habitability AND has at least one settlement at band ≥ `1-10 million` AND no atmosphere instability markers.
- `candidate` — if habitable-zone candidate without active project.
- `none` — default.

`terraformNote` is a derived prose sentence from a small authored pool keyed to the state (e.g., `'in-progress'` → "early atmospheric seeding under shielded domes"; `'failed'` → "mirror array collapsed; surface returned to base climate").

## Rendering & Downstream Integration

### Body Detail Panel (`BodyDetailPanel.tsx`)

A new collapsible "Population" section sits below existing detail fields. Layout:

```
Population: established · planetary-scale civilization
  Surface dominant (widespread); subsurface scattered
  Thousands of unnamed sites supporting the named cities
  Prominent form: terminator rail cities + aerostat clusters
  Terraform: stabilized (legacy second-wave project; climate holds)
```

Uses existing card design tokens (`bg-[var(--card-elevated)]`, micro-labels with `tracking-[0.08em]`).

### Orbital Table (`OrbitalTable.tsx`)

The `Sites or settlements` column gets an inline suffix when the body has unnamed bulk population. Format:

```
Orison Hold; Low Bell — + tunnel-stack housing
```

Six words maximum. Bodies with `band <= 'outpost'` get no suffix.

### System Overview (`SystemOverview.tsx`)

One new line under the existing system summary:

```
Population: Established hub. Bulk lives on Nosaxa IV-b; orbital and belt sites carry the rest.
```

Band + anchor-body sentence. Wired off the derived `populationSummary`.

### Markdown Export (`lib/export/markdown.ts`)

Each body section gets a Population subsection mirroring the body detail panel layout. The system overview header gets the same line as the UI.

### JSON Export (`lib/export/json.ts`)

`OrbitingBody.population` field appears in JSON output as-is. `populationSummary` is computed and included as a top-level field on the exported system.

### 3D Viewer Habitation Glyph

A new glyph component, `viewer3d/scene/overlay/glyphs/Habitation.tsx`, registered in `glyphRegistry.ts` with `GlyphId: 'HB'` and `register: 'human'`. Visual: a stylized shelter/dome ideogram (think: cross-section of a buried arcology — a dome line with three small uprights underneath). **Not** a human silhouette.

In `BodySettlements.tsx`, after the existing settlement markers, append one habitation glyph per body when `body.population.band >= 'outpost'`. Two visual states:

- `present` — band in `outpost`..`colony` — small, half-opacity
- `dominant` — band in `established`..`dense-world` — full size, full opacity

The glyph is gated behind the existing Human layer toggle (`accent-warm` color tokens, already in place).

Legend entry: "Inhabited body" (not "Population," not "People"). Tooltip exposes the band and the unnamed-site-count label.

For `terraformState: 'in-progress'`, the glyph wears a subtle thin ring around it (procedural, no new shader, just an extra `<line>` element in the SVG). For `terraformState: 'failed'`, no glyph is rendered — but the failed-terraform ruin appears via the existing `RuinMarker` infrastructure (Phase 3 deliverable).

### Failed Terraform → HumanRemnant

In the existing ruin generation pass, after population derivation runs, any body with `terraformState: 'failed'` deterministically emits one `HumanRemnant` entry tagged as a terraform ruin. The remnant uses authored pools already in `data/narrative.json` for failed-terraform sites ("Ruined terraforming plant," "Mirror array collapse," "Dome necropolis").

## File Layout

```
lib/generator/
+-- population.ts                            [NEW]
|   - derivePopulationLayer (the entry point)
|   - selectBand, distributePresence
|   - classifyHabitability, classifyResource, classifyStrategic, classifyLoad
|   - deriveTerraformState, selectProminentForm, unnamedSiteCountForBand
|   - collectTerraformRuins (Phase 3)
|   - TERRAFORM_RUIN_TYPES, isTerraformRuinType (Phase 5, used by audit + tests)
|   - decision tables inline (BAND_ORDER, HABITABILITY_SCORE,
|     PROMINENT_FORMS_BY_HABITABILITY, TERRAFORM_RUIN_TYPES/HOOKS)
+-- index.ts                                 (modified: import + call derivePopulationLayer
                                              after runNoAlienGuard)

lib/
+-- populationDisplay.ts                     [NEW]
|   - bandLabel, presenceLabel, orbitalPresenceLabel, terraformLabel
|   - unnamedSiteCountLabel, systemBandLabel
|   - systemPopulationSummary (derived rollup)
|   - formatBodyPopulationSuffix, formatSystemPopulationLine

viewer3d/scene/overlay/
+-- glyphs/
|   +-- Habitation.tsx                       [NEW]
+-- pickHabitation.ts                        [NEW]
+-- glyphRegistry.ts                         (modified: register HB + meta)
+-- types.ts                                 (modified: 'HB' added to GlyphId union)

viewer3d/scene/
+-- BodySettlements.tsx                      (modified: append habitation marker via picker)
+-- Body.tsx                                 (modified: unconditionally render BodySettlements
                                              so populated-only bodies still show the glyph)

viewer3d/chrome/
+-- ViewerLegend.tsx                         (modified: "inhabited body" chip)

components/
+-- BodyDetailPanel.tsx                      (modified: PopulationBlock subsection)
+-- OrbitalTable.tsx                         (modified: band label + suffix in Moons/Sites col)
+-- SystemOverview.tsx                       (modified: Population paragraph)

lib/export/
+-- markdown.ts                              (modified: system Population line + body sites col)
+-- json.ts                                  (passes through new field)

types.ts                                     (modified: BodyPopulation, BodyPopulationBand,
                                              BodySurfacePresence, BodyOrbitalPresence,
                                              TerraformState, BodyUnnamedSiteCount,
                                              SystemPopulationBand, SystemPopulationSummary,
                                              OrbitingBody.population, Moon.population)

scripts/
+-- audit-star-system-generator.ts           (modified: auditPopulation function with five
                                              new finding codes)

__tests__/
+-- population-band.test.ts                  [NEW] — selectBand decision tree (13 cases)
+-- population-presence.test.ts              [NEW] — distributePresence (13 cases)
+-- population-derivation.test.ts            [NEW] — orchestrator + determinism (9 cases)
+-- populationDisplay.test.ts                [NEW] — display helpers (11 cases)
+-- population-ui.test.tsx                   [NEW] — SystemOverview/OrbitalTable/BodyDetailPanel
+-- population-terraform-ruins.test.ts       [NEW] — failed-terraform → ruin pairing
+-- export.test.ts                           (extended: population in Markdown + JSON)

viewer3d/scene/overlay/__tests__/
+-- pickHabitation.test.ts                   [NEW] — glyph picker (7 cases)
```

## Testing Strategy

### Unit Tests (new)

- `derivePopulationLayer` against fixture systems:
  - Frontier scatter: all bodies at `outpost` or below
  - Working colony: one `frontier` body, several `outpost`
  - Established hub: one `populous` body with stabilized terraform
  - Dense-world: a single `dense-world` body with full presence dominance
  - Failed-terraform: a body with `terraformState: 'failed'` produces a ruin
- `selectBand` against the full 4-axis matrix corners
- `distributePresence` for hostile/harsh/shielded-viable/viable/comfortable habitability
- `deriveTerraformState` for each of the five state outcomes
- Determinism: same seed produces same population across 20 sample runs

### Integration Tests (new)

- Fixed seeds produce stable population JSON (snapshot)
- Settlement card output unchanged for systems where settlement count and order is unchanged
- Failed-terraform body produces exactly one ruin entry
- `populationSummary.anchorBodyId` matches the body with the largest band

### Existing Tests

- Every existing test must continue passing.
- `npm run audit:star-system-generator:quick` and `:deep` continue passing.
- `npm run audit:star-system-data` continues passing.
- Existing snapshot tests will refresh once (one corpus regen for the new field appearing in JSON).

### New Audit Checks

- Every body with `presence.score >= 7` produces non-null `population` with `band >= 'outpost'`.
- Every system with `settlementDensity: 'hub'` has at least one body at `band >= 'colony'`.
- `dense-world` bands only on bodies with `terraformState: 'stabilized'` OR unmodified comfortable habitability.
- `populous` bands only on bodies with stable atmosphere AND reachability class at or above mid-trunk.
- Every body with `terraformState: 'failed'` is paired with at least one terraform-ruin `HumanRemnant`.

### Fixture Seeds

Reuse the existing fixture seed library (sparse, hub, GU-heavy, GU-light, single-settlement, multi-settlement, multi-faction) plus add three new fixtures specifically for this layer: frontier-only system, stabilized-terraform hub system, failed-terraform liability system.

## Rollout Phases

Each phase is independently shippable. No phase removes capability until validation in Phase 5.

| Phase | Work | Effort | Status |
|---|---|---|---|
| **1** | Types (`BodyPopulation`, `BodyPopulationBand`, `BodySurfacePresence`, `BodyOrbitalPresence`, `TerraformState`). Field on `OrbitingBody` and `Moon`. `lib/generator/population.ts` with derivation function + decision tables. Unit tests for `selectBand`, `distributePresence`, and orchestrator determinism. Wire into pipeline after `runNoAlienGuard`. | 1.5 days | ✅ Shipped — `d3487b2` |
| **2** | Body detail panel "Population" section. Orbital table sites-column band label + suffix. System overview "Population" line. Markdown/JSON export passes through. `lib/populationDisplay.ts` with `bandLabel` / `presenceLabel` / `terraformLabel` / `systemPopulationSummary` / `formatSystemPopulationLine`. Tests for each surface. | 1.5 days | ✅ Shipped — `b71f5de` |
| **3** | Failed-terraform → `HumanRemnant` integration. `derivePopulationLayer` collects terraform-ruin entries (six type variants, six hooks) for any body with `terraformState: 'failed'`, including companion sub-system bodies. Determinism via `stableHash(bodyId)`. Unit tests cover emission, idempotence, and absence on systems without failed terraforms. | 1 day | ✅ Shipped — `f9cebcd` |
| **4** | 3D viewer habitation glyph. New `HB` shelter-ideogram component, registry entry, `GlyphId` union expansion. `pickHabitation.ts` picker with present/dominant sizing + terraform-ring flag. `BodySettlements.tsx` consults the body lookup and appends the habitation marker. `Body.tsx` gating removed so populated-only bodies still render the indicator. Legend entry "inhabited body". | 1 day | ✅ Shipped — `f6d08c7` |
| **5** | New audit checks: `POPULATION_MISSING`, `POPULATION_FLOOR_VIOLATED`, `POPULATION_DENSE_WORLD_GATE`, `POPULATION_STABLE_ATM_GATE`, `POPULATION_TERRAFORM_RUIN_MISSING`. `TERRAFORM_RUIN_TYPES` + `isTerraformRuinType` exported so audit and tests share the canonical list. Sample review across 12 distribution/density combinations confirms band distribution and readability. | 0.5–1 day | ✅ Shipped — `347dc87` |

**Total: ~5 days** of focused work. **Completed:** all 5 phases on `develop`.

### Departures from the original plan

- `lib/generator/data/populationTables.ts` was not created as a separate file. The lookup tables (`BAND_ORDER`, `HABITABILITY_SCORE`, `PROMINENT_FORMS_BY_HABITABILITY`, `TERRAFORM_RUIN_TYPES`, `TERRAFORM_RUIN_HOOKS`) all live inside `population.ts`. Split out only if the file grows past readability.
- `selectProminentForm` is keyed by habitability rather than the multi-axis `(habitability, surface, underground)` matrix in the plan. Sample review showed habitability alone gave enough variety; the multi-axis matrix can be added later if Phase 5+ review surfaces repetition.
- The Phase 5 system-level check "every `settlementDensity: 'hub'` system has at least one `colony+` body" was kept as a unit test instead of an audit rule. On frontier distributions the M-dwarf flare cap legitimately keeps top bands below colony for many systems; the audit would noise.
- Sample review covered 12 systems instead of the planned 20. The pre/post comparison was implicit (Phase 5 ships after Phase 1–4 are already in `develop`), so the review focused on band distribution and readability across distribution/density axes rather than diffing against a baseline corpus.

## Risk Mitigation

- **Determinism risk:** zero new RNG forks. The only seed-equivalence break is the appearance of the new field in JSON; values for existing fields are unchanged. Snapshot files regenerate once.
- **Snapshot churn:** documented in the Phase 1 PR. Reviewers should expect every snapshot to gain a `population` field on each body, no other diff.
- **Tone risk:** the upper bands (`populous`, `dense-world`) are gated behind multiple conditions (stable atmosphere + reachability + terraform state). Most generated systems will sit at `outpost`/`frontier`. The frontier-tone bias is preserved by rarity of upper-tier worlds, not by capping the ceiling. Phase 5 sample review verifies this empirically.
- **Visual risk in 3D viewer:** the habitation glyph is gated behind the existing Human layer toggle and uses the established `accent-warm` color tokens. It cannot visually clash with physical or GU layers. The shelter ideogram is selected explicitly to avoid generic-sci-fi "people icon" tropes.
- **Audit drift risk:** four new audit checks land in Phase 5 with explicit pass conditions. Pre-Phase-5 PRs do not enforce them.

## Quality Bars Per Phase

Every phase must, before merging:

- All existing tests pass.
- New tests for the phase's surface are present and pass.
- `npm run audit:star-system-generator:quick` passes.
- `npm run audit:star-system-data` passes.
- `npm run lint` and `npm run build` pass.
- For Phase 4: visual review of 5 generated systems in the 3D viewer.
- For Phase 5: manual review of 20 generated systems comparing against pre-phase output.

## A Worked Example

Consider a hub-class trunk-route system with one stabilized-terraform habitable world (Nosaxa IV) and a busy belt mining operation.

After population derivation:

**Nosaxa IV** — viable habitability, high resource, high strategic (hub reachability + Gate anchor), settlement load 4 named settlements with one at `10+ million`:
```
band: populous
surface: dominant
underground: scattered
orbital: substantial (Gate + orbital habitat ring)
unnamedSiteCount: thousands
prominentForm: terminator rail cities + aerostat clusters
terraformState: stabilized
terraformNote: "second-wave project; biosphere holds under perpetual mirror management"
```

**Belt** — hostile habitability, very high resource, mid strategic:
```
band: frontier
surface: none
underground: dominant
orbital: minimal
unnamedSiteCount: dozens
prominentForm: asteroid tunnel cities
terraformState: none
```

**Other rocky bodies in system** — mostly `outpost` or `transient`.

System overview line:
```
Population: Established hub. Bulk lives on Nosaxa IV; the belt and outer outposts carry the rest.
```

Body detail panel for Nosaxa IV adds a Population section showing the above. Orbital table suffix on Nosaxa IV: `…+ thousands of surface settlements`. Belt row: `…+ tunnel cities`. 3D viewer: full-opacity habitation glyph on Nosaxa IV, half-opacity on the belt anchor. No glyph on the other rocky bodies. Markdown export includes the new fields. JSON export includes them under `bodies[].population` and `populationSummary`.

This system reads, after Phase 5, as a place where named settlements are visible peaks of a much larger civilization — exactly the brief.

## Future Work (post-Phase-5)

These remain explicitly deferred. Each has a trigger condition that would justify revisiting.

- **`Settlement.representativeOf` field.** Trigger: Phase 5 sample review shows GMs unable to tell which named settlement is the administrative or notional center of a body's larger population. Otherwise the body's `prominentForm` field plus the unnamed-site-count label is sufficient.
- **`terraformProject` and `INHABITS` graph edges.** Trigger: narrative graph review shows missed cross-layer story opportunities specifically around terraform politics or named-population factions. Otherwise the existing graph entity coverage suffices.
- **`localInstitution` generation.** Previously deferred from Polish Roadmap Priority 6. Trigger: narrative graph manual review identifies missing "small-scale actor" footprint. This was on the deferred list before this plan; remains there.
- **Per-station counts and orbital census.** Trigger: a downstream consumer (campaign tracker, export pipeline) needs arithmetic on station populations. Otherwise the orbital presence flag is sufficient.
- **Cultural / national differentiation per body.** Trigger: narrative graph review shows GMs unable to differentiate culture/origin across populous worlds. Otherwise factions in the existing graph carry this load.
- **Migration / trade-volume modeling.** Trigger: route-system features (deferred from PRD) ship and need population flow inputs.
- **Localized populations of moving entities** (drift fleets, generation-ship convoys, mobile evac swarms). Trigger: orbit-anchored vs. body-anchored entity support lands in the viewer. Currently in scope as `Distributed swarm` settlement habitation pattern only.

## Acceptance Criteria

- Every generated body has a `population: Fact<BodyPopulation> | null` field. `null` only when the question doesn't apply (e.g., the central star, gas-giant interiors that don't admit habitation).
- Every generated moon that meets the habitability floor has the same field. Moons below the floor have `null`.
- `band` distribution across a corpus of 100 generated systems shows `outpost`/`frontier` as the modal bands (>60% combined), `colony` and `established` as occasional (~20% combined), `populous` and `dense-world` as rare (<5% combined). Distribution validated by audit.
- Body detail panel, orbital table, system overview, Markdown export, and JSON export all show the new field appropriately.
- 3D viewer shows the habitation glyph on inhabited bodies. Toggling the Human layer hides it. Legend entry reads "Inhabited body."
- Failed-terraform bodies produce at least one terraform-ruin `HumanRemnant`. Audit verifies.
- Same seed produces same population across 20 sample runs.
- All existing tests pass. All existing audits pass. New audit checks pass.
- `npm run lint`, `npm run test`, `npm run build` pass before each phase merge.
- Manual review of 20 sample systems shows clear improvement in perceived population context compared to baseline.

## Out of Scope

- Top-level `SystemPopulation` struct with parallel arrays (rejected during synthesis — the `OrbitingBody.population` field plus derived `populationSummary` view is the agreed architecture).
- Raw integer population stats on UI cards. JSON may carry derived numbers for export consumers; cards never surface them.
- New `EntityKind` values in the narrative graph (`terraformProject`, `populationZone`). Deferred with explicit triggers.
- New edge types in the narrative graph (`INHABITS`, `TERRAFORMS`). Deferred with explicit triggers.
- New shaders or particle systems in the 3D viewer for population indication. The glyph plus existing color tokens carry the load.
- `Settlement` shape changes. The only Settlement-adjacent change is the body it anchors to gaining a population profile; the settlement record itself is unchanged.
- New input controls on `GenerationOptions`. The existing `settlementDensity` knob is the only population-relevant input; it influences the band lookup table.
- LLM-rendered prose alternatives for any population text. Client-only static export prefers procedural pools.
- Per-culture or per-nation differentiation. The narrative graph already names factions; that is the canonical actor layer for this generator.

## References

- `docs/PRD.md` — established the layered architecture (physical / GU / human) and confidence labels.
- `docs/SOURCE_WRITEUP.md` — the canonical MASS-GU procedure. Section 18 (settlement scale + location), section 17 (terraforming candidates), reachability classes (line 96).
- `docs/POLISH_ROADMAP.md` — recent quality work; this plan is roughly the next narrative-content polish layer after the narrative graph.
- `docs/NARRATIVE_GRAPH_PLAN.md` — provides the phased-rollout pattern this plan mirrors.
- `docs/background/GU_SETTING_PRIMER.md` — frontier/core-world tone, Gardener constraints on garden worlds.
- `data/settlements.json` — existing `populationTable`, `habitationPattern` pool, mega-structure built-form vocabulary that this plan reuses.
- `lib/generator/index.ts` — current monolith; population stage inserts after `generateSettlements`.
- `viewer3d/scene/overlay/glyphRegistry.ts` — pattern for adding a new glyph; the retired `PH` (Phenomenon) glyph is the precedent for clean add/remove.
