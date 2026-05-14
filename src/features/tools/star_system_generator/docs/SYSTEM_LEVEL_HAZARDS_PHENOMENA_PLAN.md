# System-Level Hazards And Phenomena Side Rail Plan

Status: implemented (commits 6f3d0a1, a9819e0, fc62e53, 0072e0c, 42ea370, plus Phase 6 cleanup).

## Purpose

The 3D viewer currently mixes two semantically different categories of data into the same in-scene rendering surface:

- **System-level facts** that have no real spatial location — `SystemPhenomenon` (narrative-only fields, no `bodyId`/anchor) and a subset of hazards that the classifier resolves to a system-wide anchor (e.g. stellar flares, CMEs, radiation/metric storms, systemic cascades, unclassified fallbacks). These currently render either as a giant translucent volume centered on the origin or as invented glyph positions in the orbit ring.
- **Location-based features** that legitimately belong somewhere in 3D space — body-anchored hazards (radiation belts, regolith hazards, surface effects), `Settlement` and `Gate` (which already carry `bodyId`/`moonId`), and `HumanRemnant` entries whose location text implies a body.

Mixing these makes the 3D scene noisier than it needs to be, forces the viewer to invent positions for phenomena, and gives system-wide hazards an artificially huge volume just so they read as present. This plan introduces a side rail HUD for system-level items, keeps location-based items in 3D, and lightly classifies `HumanRemnant` so unattached ones either anchor to a body or fall through to the rail.

## Findings

- `SystemPhenomenon` has no `bodyId`, `moonId`, or anchor fields — its shape is purely narrative (`phenomenon`, `note`, `travelEffect`, `surveyQuestion`, `conflictHook`, `sceneAnchor`). The viewer currently builds a `PhenomenonMarker` with an invented position around the orbit ring.
- `hazardClassifier.classifyHazard` already returns an `anchorDescription` and `unclassified` flag. The system-level outcomes are:
  - `anchorDescription === 'system-wide'` (from `systemic cascade`)
  - `anchorDescription === 'stellar'` (flares, CME, coronal, radiation/metric storm)
  - `unclassified === true` (no rule matched; fallback center is origin with radius 0)
- Body-anchored hazard rules already produce a real `bodyAnchor` and stay legible in 3D. No change needed for that path.
- `HumanRemnant` has only `location: Fact<string>` — no `bodyId`. Today `RuinPins` filters by `!attachedBodyId` and renders unattached ones at invented positions in the scene.
- `Settlement` and `Gate` are already body/moon-anchored. No rail treatment needed.
- The side rail surface does not exist in `viewer3d/chrome/` yet. The nearest pattern is `ViewerModal` and the legend overlay; the rail should follow the same theming.

## Design

### Side Rail

A vertical, collapsible HUD strip docked to the right edge of the viewer (or below the legend on narrow widths). Each entry is a chip:

- **Icon column** — small glyph per category (phenomenon, stellar hazard, system-wide hazard, unattached ruin).
- **Label** — short phenomenon/hazard name, truncated.
- **Hover behavior** — expanded tooltip with the full narrative fields (the same content currently shown when clicking a phenomenon/hazard volume in 3D).
- **Click behavior** — opens the same detail panel that the in-scene markers open today; the panel content is identical.
- **No spatial pretense** — chips are sorted by category, then by deterministic id-based order. They never imply a location.

### What Moves To The Rail

| Source | Today | After |
|---|---|---|
| `SystemPhenomenon` (all entries) | `PhenomenonMarker` placed near orbit ring with hashed angle/radius | Rail chip |
| Hazards with `anchorDescription === 'system-wide'` | Translucent volume centered on origin, radius ~1.2 × snowline | Rail chip |
| Hazards with `anchorDescription === 'stellar'` | Volume centered on origin, radius 28 | Rail chip; star body keeps a small visual badge (see below) |
| Hazards with `unclassified === true` | Invisible (radius 0) | Rail chip; surfaces previously-hidden items |
| `HumanRemnant` unattached after light classification | `RuinPin` at invented position | Rail chip (only if classifier finds no body anchor) |
| Body-anchored hazards | In-scene volume | Unchanged |
| `Settlement`, `Gate` | In-scene marker on body/moon | Unchanged |

### Star-Badge Treatment For Stellar Hazards

`stellar` hazards (flares, CME) are conceptually attached to the primary star, not a freely-floating volume. Render a single small badge near the primary star when one or more stellar hazards exist, hover-linkable to the corresponding rail chips. The badge is decorative; the chip is the source of truth.

### HumanRemnant Light Classifier

A keyword pass over `HumanRemnant.location.value`, in the spirit of `hazardClassifier`:

- `asteroid|belt` → nearest belt body
- `gas giant|giant moon` → nearest gas/ice giant
- `inner|hot world|melted` → innermost rocky body
- `outer|outer reaches|dark` → outermost body
- `derelict route|drift|transit|cloud` → keep unattached; rail chip
- fallback → rail chip

Anchored remnants render as `RuinPin` on or near the chosen body. Unanchored remnants go to the rail. Determinism via `hashToUnit("ruin-anchor#" + id)` where any random choice is needed (e.g. one of multiple matching bodies).

## Implementation Plan

### Phase 1 — Scene Graph Partition

Update `buildSceneGraph` (`viewer3d/lib/sceneGraph.ts`) and `SystemSceneGraph` (`viewer3d/types.ts`):

- Add `systemLevelPhenomena: PhenomenonMarker[]` and `systemLevelHazards: HazardVisual[]` partitions on `SystemSceneGraph`. The existing `phenomena` and `hazards` arrays only carry body-anchored entries.
- Hazard classifier still produces the same `HazardVisual`, but the scene graph routes `anchorDescription` of `'system-wide'` / `'stellar'` and any `unclassified` entry to the new partition. The 3D scene stops rendering those volumes.
- All phenomena go to the new partition. The `PhenomenonGlyph` 3D render path is removed; the existing fallback dispersion code becomes dead and gets deleted.
- Sub-systems get the same partition shape.

### Phase 2 — Side Rail Chrome

New component `viewer3d/chrome/SystemLevelRail.tsx`:

- Vertical chip list, right-docked, collapsed-by-default on mobile widths.
- Categories: phenomena, stellar hazards, system-wide hazards, unanchored ruins. Group headers within the rail.
- Reuse existing detail-panel components (`PhenomenonGlyph` already has the hover/click panel logic — extract the panel body into a presentational `PhenomenonDetail` and `HazardDetail` so the rail and any remaining 3D anchors can both use them).
- Theming mirrors the existing legend overlay; no new color tokens.

### Phase 3 — Stellar Badge

In `Star.tsx`, render a small icon badge offset from the star body when the scene graph reports one or more stellar hazards. Hovering the badge highlights the corresponding rail chips. The badge does not open its own panel; clicking it focuses the first matching rail chip.

### Phase 4 — HumanRemnant Classifier

New module `viewer3d/lib/ruinClassifier.ts`:

- Pure function `classifyRuin(remnant, system) => { attachedBodyId?, attachedMoonId? } | null`.
- Keyword rules per the design above.
- Deterministic tie-breaking via `hashToUnit`.
- Unit tests covering each keyword family plus the fallback.

Wire it into `buildSceneGraph`:

- For every `HumanRemnant` without an existing attachment, run the classifier.
- If anchored, build a `RuinMarker` with `attachedBodyId`/`attachedMoonId` and add to the existing in-scene partition.
- If not anchored, add to a new `systemLevelRuins: HumanRemnant[]` partition (or fold into the rail chip data shape).

### Phase 5 — Test Updates

- Snapshot tests on `buildSceneGraph` need refreshed snapshots for the partition split (deliberate, recorded in the commit message).
- New tests:
  - `sceneGraph` routes system-wide / stellar / unclassified hazards to `systemLevelHazards`.
  - `sceneGraph` routes all `SystemPhenomenon` entries to `systemLevelPhenomena`.
  - `ruinClassifier` keyword families.
- Remove or update any tests that asserted `PhenomenonMarker` positions, since those positions no longer exist.

### Phase 6 — Cleanup

- Delete the phenomenon position-dispersion code in `sceneGraph` (was added in commit `5ef4f70`).
- Delete the system-wide hazard volume rendering branches in `HazardVolume.tsx` after confirming nothing else feeds them.
- Update the in-scene legend to drop "system-wide hazard" / "phenomenon" glyph entries and reference the rail instead.

## Verification

- Focused viewer tests: `npm run test -- viewer3d`.
- Star System Generator audit corpus: run `audit-star-system-generator.ts` and confirm no regression in counts of phenomena/hazards reaching the user (they should still all appear — just in the rail).
- Manual viewer pass on a known stellar-flare seed and a known systemic-cascade seed to verify badge + rail behavior.
- `npm run lint` and `npm run build` once viewer surface is touched.

## Non-Goals

- Restructuring the underlying `SystemPhenomenon` data model. Phenomena remain narrative-only; this plan only changes how they're surfaced.
- Adding spatial fields to phenomena or rewriting hazard keyword classification beyond the existing categories.
- Touching `Settlement`/`Gate` rendering — both remain body-anchored.
- Animations or transitions for the rail beyond the existing modal/panel patterns.
