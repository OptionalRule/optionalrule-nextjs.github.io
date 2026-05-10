# HUD Overlay Symbology — Design Spec

**Date:** 2026-05-09
**Feature:** Unified cartographic-style SVG glyph system for non-physical-body markers in the 3D Star System Viewer
**Surface:** `src/features/tools/star_system_generator/viewer3d/`
**Scope:** Replace the current orange-sphere settlement pin and update existing ruin/phenomenon markers with a coherent SVG-based overlay; promote `Gate` to a first-class object type.

---

## 1. Problem

The 3D System Viewer currently represents every settlement as the same orange sphere on a stem (`SettlementPin`), regardless of whether it is a 50-person dome on an ice moon or a 10-million-resident orbital ring. Ruins (`RuinPins`) and phenomena (`PhenomenonGlyphs`) use their own visual idioms with no shared design language. Hazard volumes and GU bleed volumes have no marker label at all and float unidentified in the scene.

The data model already carries rich subtype information — `Settlement.habitationPattern` (20+ enum values), `Settlement.population` (10 tiers), `Settlement.aiSituation`, `HumanRemnant.remnantType`, etc. — but none of it surfaces visually.

We want a unified data-overlay symbol language for everything that isn't a physical body, so a player can scan a system at a glance and tell what kind of thing is where, what state it's in, and how big it is — without reading a single tooltip.

## 2. Goals

- Every non-physical-body object in the scene renders as an SVG glyph in a unified cartographic style.
- A glyph's *shape* tells you what kind of thing it is.
- A glyph's *hue* tells you status (for human-layer objects) or domain (for non-human).
- Settlements pick one of twelve glyph variants (3 surface · 1 belt/rock · 1 drift · 7 orbital) based on `habitationPattern` (family) and `population` (scale within family).
- `Gate` is promoted to a first-class object type alongside `Settlement` / `HumanRemnant` / `SystemPhenomenon`.
- Existing `Hazard` and GU bleed volumes get a small companion marker glyph so they read as part of the overlay family.
- The scene stays cleanly readable when the camera pulls back — glyphs are world-space billboards that scale with distance, never tilt, and don't mush at small size.

## 3. Non-goals (v1)

- Beacons as a first-class object type — deferred (data model not ready).
- Routes / jump lanes between gates — deferred (no geometry primitives for lines yet).
- Faction / authority claim regions — deferred (no system-level claim data).
- Contested and Hostile status states — the visual system supports them, but the generator does not emit them in v1 (no driving data).
- Per-habitation-pattern glyphs — we cluster 20+ patterns into 10 variants on purpose; one-to-one would be visual noise.
- Animated glyphs (pulsing, rotation) — static SVG only.
- Custom glyph rendering library (SVG-to-Three.Line) — we use drei `<Html>`.

## 4. Locked design decisions (from brainstorming)

| Axis | Choice |
|---|---|
| Scope | All overlays unified — human-layer + GU + phenomena share one symbol language |
| Rendering | World-space billboards (camera-facing, scale with distance) |
| Visual style | Cartographic / Survey Chart — thin line glyphs, no fills, scout-chart aesthetic |
| Data scope | Promote `Gate` to first-class type; `Beacon` deferred |
| Glyph granularity | Anchor-based clusters; Surface (3 variants) and Orbital (7 variants) sub-divide by built form |
| Color encoding | **Hue = status** for human-layer; **Hue = domain** for non-human |
| Mapping rule | `habitationPattern` picks the family/subtype; `population` picks scale within family |
| Status scope (v1) | Active / Abandoned / Automated only — derived from existing fields. Contested / Hostile deferred. |
| Integration | Replace `SettlementPin`, redraw `RuinPins` and `PhenomenonGlyphs` in new style, add companion labels to `HazardVolume` and `GuBleedVolume` |
| Rendering tech | drei `<Html>` overlay with `distanceFactor` |
| Label policy | Hover or selection only |
| Hover/select treatment | Subtle scale (1.15×) + outer glow on hover; persistent outline ring + label below on selection |

## 5. Glyph catalog

Seventeen distinct glyphs across two registers (14 human-layer + 3 non-human).

### 5.1 Human-layer (hue = status)

| ID | Name | What it represents | Notes |
|---|---|---|---|
| A1 | Surface · City skyline | Large-population surface settlement | Tower + dome + secondary tower + low building on horizon arc |
| A2 | Surface · Outpost cluster | Small-population surface settlement, sky platform, tethered tower | Main pressure dome with comm mast + secondary dome + prefab |
| A3 | Surface · Dome habitat | Sealed arcology, dome colony | Large structured pressurized dome with airlock to secondary |
| BR | Belt/Rock base | Asteroid base, hollow asteroid, belt cluster, moon base | Irregular rock silhouette with mounted base structure |
| DR | Drift habitat | Drift colony, distributed swarm, generation ship, deep-space platform | 5 modular hex pods linked, no anchor body |
| B1 | Orbital · Coriolis | Large orbital station, hub complex (mid-range) | Octagonal hull, central docking slot, radial antennas |
| B2 | Orbital · Orbis | Ring station, large hub | Wide flat ring transected by central spindle, end-cap dishes |
| B3 | Orbital · Citadel | Hub complex (massive), capital station | Asymmetric fortress hull, dorsal spires, attached side platform |
| B4 | Orbital · Industrial gantry | Modular island station (industrial), refinery | Vertical spine threading stacked platform discs |
| B5 | Orbital · Modular cross | Orbital station (mid), modular island station | Octagonal core with cross-arrangement of modules |
| B6 | Orbital · T-platform outpost | Orbital station (small), deep-space platform | Cross truss with single habitat module + side dock |
| B7 | Orbital · Module cluster | Smallest orbital, research/mining outpost | Tiny core with bolt-on cylinder pod, supply tank, solar array |
| GT | Gate | Route node (first-class) | Outer ring + dashed inner aperture + cardinal struts |
| RU | Ruin | `HumanRemnant` | Standing fragment with broken roof + smaller collapsed structure + debris |

### 5.2 Non-human / phenomenal layer (hue = domain)

| ID | Name | Hue | What it represents |
|---|---|---|---|
| PH | Phenomenon | Magenta `#ff7fb5` | `SystemPhenomenon` — stellar oddity, anomaly |
| HZ | Hazard label | Orange `#ff8a4a` | Companion glyph for `HazardVolume` |
| GU | GU bleed label | Violet-pink `#a884ff` | Companion glyph for `GuBleedVolume` |

### 5.3 Approved glyph mockups

The visual catalog approved during brainstorming lives in `.superpowers/brainstorm/29530-1778380971/content/`:
- `glyph-rework-orbital.html` — final A1/A2/A3 + B1–B7
- `glyph-catalog-v2.html` — Belt/Rock, Drift, Gate, Ruin
- `glyph-catalog.html` — Phenomenon, Hazard, GU bleed (section B)

The implementation will lift the SVG markup directly from these mockups into individual React components.

## 6. State palette (human-layer only)

| State | Stroke color | Stroke style | Derivation rule |
|---|---|---|---|
| Active | `#f4b860` (amber) | Solid | Default for any settlement not matching another rule |
| Abandoned | `#7a8088` (muted gray) | Dashed `3 2.5` | `habitationPattern === 'Abandoned'` |
| Automated | `#5fc9b8` (cool teal) | Solid + dashed orbit ring | `habitationPattern === 'Automated'` OR `aiSituation` text indicates AI-run (heuristic — see §9.2) |
| Contested *(deferred)* | Split amber/rose gradient | Solid | No data driver in v1 |
| Hostile *(deferred)* | `#ff5a5a` (red) | Solid + diagonal hatch | No data driver in v1 |

Domain hues (Gate violet, Ruin gray, Phenomenon magenta, Hazard orange, GU violet-pink) do not vary by state — they always render in their fixed hue.

## 7. Data-to-glyph mapping

### 7.1 Settlement → glyph variant

`habitationPattern` picks the family; `population` picks the scale within family.

```
function pickSettlementGlyph(s: Settlement): GlyphId {
  const pattern = s.habitationPattern.value
  const popTier = populationTier(s.population.value)  // small | medium | large

  // Surface family
  if (pattern === 'Sealed arcology' || pattern === 'Underground city') return 'A3'
  if (pattern === 'Surface settlement' || pattern === 'Sky platform' || pattern === 'Tethered tower') {
    return popTier === 'large' ? 'A1' : 'A2'
  }

  // Belt/Rock family
  if (pattern === 'Asteroid or belt base' || pattern === 'Hollow asteroid' ||
      pattern === 'Belt cluster' || pattern === 'Moon base') return 'BR'

  // Drift family
  if (pattern === 'Distributed swarm' || pattern === 'Drift colony' ||
      pattern === 'Generation ship' || pattern === 'Deep-space platform') return 'DR'

  // Orbital family — pattern hints at subtype, population tunes scale
  if (pattern === 'Ring station' || pattern === "O'Neill cylinder")
    return popTier === 'large' ? 'B2' : 'B5'
  if (pattern === 'Hub complex')
    return popTier === 'large' ? 'B3' : popTier === 'medium' ? 'B1' : 'B5'
  if (pattern === 'Modular island station')
    return popTier === 'large' ? 'B4' : 'B5'
  if (pattern === 'Orbital station')
    return popTier === 'large' ? 'B1' : popTier === 'medium' ? 'B5' : popTier === 'small' ? 'B6' : 'B7'

  // Special / fallthrough
  if (pattern === 'Gate or route node') return 'GT'  // legacy data — should be migrated
  return 'B7'  // safe fallback: smallest orbital
}
```

`populationTier` buckets the 10 enum values:
- **small**: `Minimal (<5)`, `1-20`, `21-100`, `101-1,000`, `Unknown`
- **medium**: `1,001-10,000`, `10,001-100,000`
- **large**: `100,001-1 million`, `1-10 million`, `10+ million`

### 7.2 Settlement → status

```
function pickSettlementStatus(s: Settlement): GlyphStatus {
  if (s.habitationPattern.value === 'Abandoned') return 'abandoned'
  if (s.habitationPattern.value === 'Automated') return 'automated'
  if (isAiRun(s.aiSituation.value)) return 'automated'  // see §9.2
  return 'active'
}
```

### 7.3 Other objects

| Object | Glyph | Status |
|---|---|---|
| `HumanRemnant` | RU | Always cold gray (definitionally abandoned) |
| `Gate` (new type) | GT | Always violet |
| `SystemPhenomenon` | PH | Always magenta |
| `HazardVolume` | HZ | Always orange |
| `GuBleedVolume` | GU | Always violet-pink |

## 8. Data model changes

### 8.1 New type: `Gate`

Add to `src/features/tools/star_system_generator/types.ts`:

```ts
export interface Gate {
  id: string
  name: Fact<string>
  bodyId?: string         // anchor body if any (gates can be free-floating or in orbit)
  orbitAu?: Fact<number>  // when free-floating in the system
  routeNote: Fact<string>
  pinchDifficulty: Fact<string>
}
```

`GeneratedSystem` gains a `gates: Gate[]` field.

### 8.2 Migration

The settlement generator currently emits settlements with `habitationPattern: 'Gate or route node'`. After this change:
- The generator emits a `Gate` instead of a `Settlement` for these cases.
- The `'Gate or route node'` enum value remains in the type for backward compatibility but is never produced fresh.
- The viewer's `pickSettlementGlyph` keeps a fallback that maps any leftover `'Gate or route node'` settlement to the `GT` glyph, so old persisted state still renders correctly.

### 8.3 No new Settlement fields

Status is derived from existing fields (`habitationPattern`, `aiSituation`). No schema change to `Settlement`.

## 9. Architecture & module layout

### 9.1 New files

```
src/features/tools/star_system_generator/viewer3d/scene/overlay/
├── OverlayMarker.tsx              ← shared <Html> billboard wrapper
├── glyphRegistry.ts               ← maps GlyphId → component
├── statusPalette.ts               ← stroke colors / dash arrays per status
├── pickGlyph.ts                   ← pickSettlementGlyph + pickSettlementStatus
└── glyphs/
    ├── SurfaceCity.tsx            ← A1
    ├── SurfaceOutpost.tsx         ← A2
    ├── SurfaceDome.tsx            ← A3
    ├── BeltRockBase.tsx           ← BR
    ├── DriftHabitat.tsx           ← DR
    ├── OrbitalCoriolis.tsx        ← B1
    ├── OrbitalOrbis.tsx           ← B2
    ├── OrbitalCitadel.tsx         ← B3
    ├── OrbitalGantry.tsx          ← B4
    ├── OrbitalModular.tsx         ← B5
    ├── OrbitalTPlatform.tsx       ← B6
    ├── OrbitalCluster.tsx         ← B7
    ├── Gate.tsx                   ← GT
    ├── Ruin.tsx                   ← RU
    ├── Phenomenon.tsx             ← PH
    ├── HazardLabel.tsx            ← HZ
    └── GuBleedLabel.tsx           ← GU
```

### 9.2 `OverlayMarker` — shared billboard wrapper

A single component that handles the world-space → screen-space projection, hover/select wiring, and label rendering. Each individual glyph component is a pure SVG.

```tsx
// OverlayMarker.tsx (sketch)
import { Html } from '@react-three/drei'

export function OverlayMarker({
  position, kind, id, children, label, status,
}: OverlayMarkerProps) {
  const { hover, select, hovered, selected } = useSelectionActions()
  const isHovered = hovered?.kind === kind && hovered?.id === id
  const isSelected = selected?.kind === kind && selected?.id === id

  return (
    <Html
      position={position}
      center
      distanceFactor={8}              // world-scale: bigger close, smaller far
      occlude={false}
      zIndexRange={[10, 0]}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className={`overlay-marker ${isHovered ? 'is-hovered' : ''} ${isSelected ? 'is-selected' : ''}`}
        onPointerOver={() => hover({ kind, id })}
        onPointerOut={() => hover(null)}
        onClick={() => select({ kind, id })}
      >
        <div className="glyph" data-status={status}>
          {children}
        </div>
        {(isHovered || isSelected) && label ? (
          <div className="overlay-label">{label}</div>
        ) : null}
      </div>
    </Html>
  )
}
```

CSS in the same module handles hover scale (`transform: scale(1.15)`) and outer glow (`filter: drop-shadow(0 0 4px var(--status-color))`). Selection adds a persistent outline ring (`outline: 1px solid var(--status-color); outline-offset: 4px`) around the glyph.

`distanceFactor={8}` is a starting value — to be tuned during implementation against the existing camera setup.

### 9.3 Existing files modified

| File | Change |
|---|---|
| `viewer3d/scene/SettlementPin.tsx` | **Deleted** — replaced by overlay system. |
| `viewer3d/scene/Body.tsx` | Stops rendering `<SettlementPin>`. New code renders settlements via `OverlayMarker` from a higher level (Scene.tsx) so all overlay markers live together. |
| `viewer3d/scene/MarkerInstances.tsx` | `RuinPins` and `PhenomenonGlyphs` rewritten as overlay-style components using `OverlayMarker` + `Ruin.tsx` / `Phenomenon.tsx` glyph components. Lose `InstancedMesh` (DOM-based now). |
| `viewer3d/scene/HazardVolume.tsx` | Adds a small `<HazardLabel>` companion marker at the volume's center. |
| `viewer3d/scene/GuBleedVolume.tsx` | Adds a small `<GuBleedLabel>` companion marker at the volume's center. |
| `viewer3d/scene/Scene.tsx` | New `<OverlayLayer>` group renders all markers (settlements, gates, ruins, phenomena, hazard/GU labels) in one place, gated by existing `useLayers()` toggles. |
| `viewer3d/scene/renderAssets.ts` | `settlementPinHeadGeometry`, `settlementPinStemGeometry`, `settlementPinMaterial`, `phenomenonGeometry`, `ruinGeometry`, `ruinMaterial` — **deleted**. |
| `viewer3d/scene/HoverTooltip.tsx` | No change — already handles all four kinds; still receives selection events from the new components. |
| `types.ts` | Adds `Gate` interface; `GeneratedSystem` gains `gates: Gate[]`. |
| `lib/generator/...` | Generator emits `Gate` for route-node settlements instead of a `Settlement` with `habitationPattern: 'Gate or route node'`. |
| `lib/export/markdown.ts` | Adds a "Gates" section to the export. |

### 9.4 `isAiRun` heuristic

`Settlement.aiSituation` is a free-form `Fact<string>`. We treat a settlement as automated (cool teal) when:
- `habitationPattern === 'Automated'`, OR
- `aiSituation.value` matches `/\b(automated|fully autonomous|no crew|ai-run|machine-tended)\b/i`

This is a starting heuristic; the full keyword set is to be tuned during implementation against real generator output.

## 10. Layer toggle integration

The viewer already has three layer toggles via `useLayers()` — `physical`, `gu`, `human`. The new overlay markers obey them as follows:

| Glyph | Layer toggle |
|---|---|
| A1, A2, A3, BR, DR, B1–B7, RU | `human` |
| GT (Gate) | `human` (humans built them) |
| PH | `gu` |
| HZ | `physical` |
| GU | `gu` |

No new toggles are introduced.

## 11. Interaction

- **Default**: glyph rendered in its category hue/status.
- **Hover**: `transform: scale(1.15)` + soft outer glow; cursor changes to pointer; `useSelectionActions().hover()` fires; existing `HoverTooltip` shows.
- **Selection**: persistent outline ring + label (settlement/gate/ruin/phenomenon name) appears below the glyph; `useSelectionActions().select()` fires (existing sidebar opens).
- **Click-elsewhere**: deselects, label disappears.

## 12. Testing

- **Unit tests** (Vitest):
  - `pickSettlementGlyph` returns the expected `GlyphId` for each `(habitationPattern, populationTier)` combination — exhaustive coverage of the 20+ patterns.
  - `pickSettlementStatus` handles the three status branches and the `aiSituation` heuristic.
  - `populationTier` correctly buckets every enum value.
- **Component tests** (React Testing Library):
  - `OverlayMarker` toggles `is-hovered` / `is-selected` classes and shows label only when active.
  - Each glyph component renders its SVG with the correct stroke color for each status.
- **Snapshot tests**:
  - One snapshot per glyph component to lock in the SVG output.
- **Generator tests**:
  - The `Gate` migration: a system that previously had a `'Gate or route node'` settlement now has a `Gate` in `gates[]` and not a `Settlement` for the same anchor.
  - `noAlienCheck` and `narrativeFacts` continue to work with the new `Gate` type.

No new e2e tests — manual smoke check in the viewer modal.

## 13. Open implementation questions

These are detail decisions deferred to implementation; they don't change the spec but want to be flagged:

1. **`distanceFactor` tuning** — `8` is a starting value; needs tuning so glyphs read at default camera distance and don't dominate the screen when zoomed close.
2. **Gate generation rules** — the generator currently produces gates as a side-effect of settlement habitation pattern. Promoting Gate to first-class means the generator needs an explicit "should this system have a gate?" decision. Default: ports any existing settlement with that pattern, no new generation logic in v1.
3. **Population tier mapping for `Unknown`** — bucketed as `small` because most generated systems with unknown population are frontier outposts. Open to revisit if it produces wrong-looking pickings.
4. **DOM count** — at ~30–40 markers per system, drei `<Html>` performance is fine. If a future feature pushes this past ~150, switch the implementation to SVG-to-CanvasTexture sprites without changing the public component API.

## 14. Future work (out of scope for v1)

- Beacons as a first-class type.
- Routes / jump lanes drawn as 3D curves between `Gate` instances.
- Faction-claim hull regions over groups of settlements.
- Contested / Hostile status — needs new generator data.
- Per-habitation-pattern glyphs (deeper subdivision of the 10-variant catalog).
- Settlement glyph animation (gentle pulse for active, slow drift for abandoned).
