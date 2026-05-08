# 3D System Viewer — Design Spec

**Date:** 2026-05-08
**Feature:** Player-facing 3D visualization of a generated star system
**Surface:** `src/features/tools/star_system_generator/`
**Scope:** Polished v1 (recommended Option 2)

---

## 1. Problem

The Star System Generator produces rich procedural systems — stars, bodies, moons, rings, settlements, ruins, GU overlays, hazards, phenomena — but the current UI surfaces all of this as text and tables. There is no way for a player at the table to *see* the system as a place. We want a player-facing visual that is fun to open, useful at the table for spatial context, and consistent with the tool's "compact operational TTRPG" aesthetic.

## 2. Goals

- A button on the existing tool page opens a modal with a realistic 3D rendering of the current system.
- The viewer is a tactical/ops map — function-first, click-to-inspect, optimized for scanning at the table during play.
- The three semantic layers established by the existing tool (Physical / GU / Human) are preserved as toggleable overlays.
- Players can hover bodies for a preview tooltip and click them to open a detail sidebar that reuses existing detail components.
- Bodies revolve along their orbits at a slow ambient rate, honoring `prefers-reduced-motion`.
- The 3D engine and scene assets do not impact the main page bundle for users who never open the viewer.

## 3. Non-goals (v1)

- Time scrubber, play/pause, speed multiplier — slow ambient is enough.
- Dedicated `/tools/star_system_generator/3d/` sub-route — deferred to v2.
- Sound or SFX.
- Photorealistic textures — shaders only (bundle, iteration speed).
- Caustic / volumetric raymarching for GU bleeds — simple alpha pulse only.
- Animated orbit trails.
- Mobile-first redesign of the modal layout (modal works on mobile but is not redesigned for it).
- Screenshot / share buttons.
- Drag-to-simulate or any "what-if" interaction.

## 4. Locked design decisions (from brainstorming)

| Axis | Choice |
|---|---|
| Experience | Tactical/ops map — clean, click-to-inspect, scan-friendly |
| Visual direction | Realistic 3D — textured-looking spheres, glowing star with corona, particle belts, dark space, TTRPG layers as overlays |
| Engine | `react-three-fiber` + `@react-three/drei` + `three` |
| Surface | Modal in v1 (button on the main page); sub-route deferred to v2 |
| Motion | Slow ambient revolve (~30s per in-game year, stylized); honors `prefers-reduced-motion` |
| Click model | Hover preview tooltip; click opens right-side sidebar with full detail |
| Layer toggles | Three pills — Physical / GU / Human — all-on by default |
| Scale | Logarithmic AU; bodies sized by category bucket, not literal radius |
| Body shading | Per-category `ShaderMaterial` variants — no texture assets |
| Hazard / GU placement | Volumetric (sphere with radial alpha falloff), placed by classifier on free-form `Fact<string>` text; floating chip fallback for unclassifiable strings |

## 5. Architecture & module layout

```
src/features/tools/star_system_generator/
├── components/
│   ├── (existing files)
│   └── SystemViewer3DButton.tsx         ← lightweight; lives in main bundle
├── viewer3d/                             ← entire dir lazy-loaded
│   ├── index.tsx                         ← <SystemViewer3DModal/> default export
│   ├── scene/
│   │   ├── Scene.tsx                     ← <Canvas/> root, lighting, camera
│   │   ├── Star.tsx                      ← star + corona + companions
│   │   ├── Body.tsx                      ← one body (planet/dwarf), with moons + rings
│   │   ├── Belt.tsx                      ← instanced asteroid belt
│   │   ├── Orbit.tsx                     ← single tilted orbit line
│   │   ├── Zones.tsx                     ← habitable band + snow line
│   │   ├── HazardVolume.tsx              ← red volumetric haze
│   │   ├── GuBleedVolume.tsx             ← purple shader haze, gentle pulse
│   │   ├── SettlementPin.tsx             ← warm-orange marker on body
│   │   └── RuinPin.tsx                   ← dimmed pin
│   ├── chrome/
│   │   ├── ViewerModal.tsx               ← portal, focus trap, esc/close
│   │   ├── LayerToggles.tsx              ← three pills: Physical/GU/Human
│   │   ├── HoverTooltip.tsx              ← billboard tooltip near cursor
│   │   ├── DetailSidebar.tsx             ← right-side panel; reuses existing panels
│   │   ├── StarDetailCard.tsx            ← new compact star detail
│   │   ├── HazardCard.tsx                ← new compact hazard detail
│   │   ├── PhenomenonCard.tsx            ← new compact phenomenon detail
│   │   └── ViewerLegend.tsx              ← bottom legend chips
│   ├── lib/
│   │   ├── sceneGraph.ts                 ← pure: GeneratedSystem → SystemSceneGraph
│   │   ├── scale.ts                      ← log-AU mapping, body size buckets
│   │   ├── stellarColor.ts               ← spectralType → hex + corona params
│   │   ├── bodyShading.ts                ← BodyCategory → shader uniforms
│   │   ├── hazardClassifier.ts           ← hazard text → placement
│   │   ├── guBleedClassifier.ts          ← bleed text → placement
│   │   └── motion.ts                     ← deterministic phase-by-id, ω scaling
│   └── types.ts                          ← SystemSceneGraph, BodyVisual, etc.
└── (existing) index.tsx                  ← adds the viewer button only
```

### Boundary rules

- **Lazy boundary at `viewer3d/index.tsx`** — main page imports it via `next/dynamic` with `{ ssr: false, loading: <ViewerSkeleton/> }`. `three`, `@react-three/fiber`, and `@react-three/drei` are imported only from inside `viewer3d/`.
- **Pure scene-graph layer (`lib/sceneGraph.ts`)** — `buildSceneGraph(system: GeneratedSystem): SystemSceneGraph` is a pure function. Unit-testable, deterministic, zero r3f imports.
- **`chrome/` is DOM, `scene/` is r3f.** Strict separation prevents accidentally putting DOM nodes inside `<Canvas/>`.
- **One file per scene primitive.** Matches the existing pattern of single-purpose components.
- **ESLint rule** — forbid `import three`, `import @react-three/fiber`, `import @react-three/drei` outside `viewer3d/`. Prevents accidental main-bundle leaks. Implemented via `no-restricted-imports` in the existing eslint config.

## 6. Data flow & scene model

### `SystemSceneGraph` (in `viewer3d/types.ts`)

```typescript
export interface SystemSceneGraph {
  star: StarVisual
  companions: StarVisual[]
  zones: { habitableInner: number; habitable: number; snowLine: number }  // scene units
  bodies: BodyVisual[]
  belts: BeltVisual[]
  hazards: HazardVisual[]
  guBleeds: GuBleedVisual[]
  phenomena: PhenomenonMarker[]
  ruins: RuinMarker[]
}

export interface StarVisual {
  id: string
  coreColor: string
  coronaColor: string
  coronaRadius: number
  rayCount: number
  bloomStrength: number
  position: [number, number, number]
}

export interface BodyVisual {
  id: string                            // matches OrbitingBody.id for click→detail lookup
  orbitRadius: number                   // log-mapped scene units
  orbitTiltY: number                    // small per-body inclination, deterministic from id
  phase0: number                        // starting angular position [0, 2π), seeded by id+seed
  angularSpeed: number                  // rad/s; from period or category fallback
  visualSize: number                    // bucket by category, NOT physical radius
  shading: BodyShadingKey
  rings?: RingVisual
  moons: MoonVisual[]
  guAccent: boolean                     // gu-fractured bodies get violet rim
  hasSettlements: boolean
  settlementIds: string[]               // for sidebar lookup
  ruinIds: string[]
}

export interface MoonVisual {
  id: string
  parentBodyId: string
  parentRelativeOrbit: number           // scene units, parent-relative
  phase0: number
  angularSpeed: number
  visualSize: number
  shading: BodyShadingKey
}

export interface RingVisual {
  innerRadius: number; outerRadius: number
  tilt: number                          // radians, seeded by parent id
  bandCount: number
  color: string
}

export interface BeltVisual {
  id: string
  innerRadius: number; outerRadius: number
  particleCount: number                 // ramped down on low-DPR / mobile
  jitter: number
  color: string
}

export interface HazardVisual {
  id: string
  center: [number, number, number]
  radius: number
  intensity: number                     // 0..1
  sourceText: string                    // for sidebar
  anchorDescription: string             // "near Bessel III", etc.
  unclassified: boolean                 // true → render as footer chip instead of volume
}

export interface GuBleedVisual {
  id: string
  center: [number, number, number]
  radius: number
  pulsePhase: number                    // start phase, seeded
  pulsePeriodSec: number
  intensity: number                     // 0..1, scales radius and color saturation
  unclassified: boolean
}

export interface PhenomenonMarker {
  id: string
  position: [number, number, number]
  kind: string
}

export interface RuinMarker {
  id: string
  attachedBodyId?: string
  attachedMoonId?: string
  position: [number, number, number]    // computed when no body anchor
}
```

### `buildSceneGraph` flow

1. Compute scene radius from `max(orbits)` and `system.zones.snowLineAu`.
2. Build `star` from `system.primary` via `stellarColor.ts`. Place at origin.
3. Build `companions` from `system.companions[]` — each gets a placement offset based on `separation: Fact<string>` mapped through a small bucket table (close → 4 units offset, wide → 12 units, etc.).
4. Map `system.zones` to scene units via `auToScene(au)`.
5. For each `OrbitingBody`:
   - Skip belt-category bodies; collect them for `belts[]` (rendered as particle scatters).
   - Compute `orbitRadius = auToScene(body.orbitAu)`, `visualSize = bodyVisualSize(body.category)`, `shading = chooseShading(body.category, body.detail, body.physical)`.
   - Seed `phase0 = hashToUnit(body.id + system.seed) * 2π`.
   - `angularSpeed = orbitalSpeedFromAu(body.orbitAu)` (Kepler-flavored: `2π / (year_seconds * (au)^1.5)` with `year_seconds = 30`, capped to a max for inner planets).
   - Build moons recursively (parent-relative).
   - Build rings if `body.rings` present.
   - Set `guAccent = true` if body's traits or filterNotes mention GU fracture.
   - Collect `settlementIds`, `ruinIds` by lookup against `system.settlements` and `system.ruins`.
6. For each entry in `system.majorHazards`, run `classifyHazard(text, system)` → `HazardVisual`.
7. For `system.guOverlay`, run `classifyGuBleed(guOverlay, system)` → `GuBleedVisual`.
8. For each `system.phenomena`, place a small floating glyph deterministically (corner of relevant zone or near an anchor body).
9. For each `system.ruins`, attach to a body if `location` text classifies, else float at a deterministic position outside the outermost orbit.

### Classifier strategy

`hazardClassifier.ts` and `guBleedClassifier.ts` each export a single function that returns the corresponding scene-graph visual type:

```typescript
classifyHazard(hazard: Fact<string>, system: GeneratedSystem): HazardVisual
classifyGuBleed(guOverlay: GuOverlay, system: GeneratedSystem): GuBleedVisual
```

Implementation: a hand-written keyword-to-anchor mapping (radiation/belt → near gas giants; pinch/route → near outermost orbit; fault/fracture → GU bleed center; etc.). Anchors resolve to body IDs in the current system, then to scene positions. If no keyword matches, returns `{unclassified: true}` — caller renders a footer chip.

The classifier is small, lookup-based, and **easy to extend** as the data adds new hazard/bleed phrases.

## 7. Visual system

### Palette (extends existing site tokens, no new vars)

| Element | Token | Approx hex |
|---|---|---|
| Orbit lines, habitable band, snow line | `--accent` | `#5fb6e8` family |
| GU bleed haze, gu-fractured rim | `--accent-mystical` | `#a880ff` family |
| Settlement pins, ruin pins | `--accent-warm` | `#ff9d4a` family |
| Hazards | new shader constant | `#ff5773` |
| Star core / corona | derived from spectralType | dynamic |
| Background | dark navy | `#02040a` → radial gradient out |

The three semantic layers map exactly to the existing site language. No new design tokens are introduced.

### Star — `stellarColor.ts`

```typescript
spectralVisuals(spectralType: string, activityRoll: number): {
  coreColor: string         // G2V → '#fff8d8'
  coronaColor: string       // G2V → '#ffd97a'
  coronaRadius: number      // scene units; activity bumps this
  rayCount: number          // 6 (low) → 12 (high activity)
  bloomStrength: number     // 0.4 → 1.2
}
```

A 7-stop hand-tuned letter ramp (O→M) plus a class modifier (V/IV/III/II/I) for size. Companions render with their own visuals.

### Body shading — `bodyShading.ts`

Custom textures balloon the bundle. We use one shared `ShaderMaterial` with per-body uniforms to synthesize the look:

```typescript
export type BodyShadingKey =
  | 'rocky-warm'      | 'rocky-cool'      | 'earthlike'    | 'desert'
  | 'sub-neptune'     | 'gas-giant'       | 'ice-giant'    | 'dwarf'
  | 'anomaly'

shaderUniforms(category: BodyCategory, body: OrbitingBody): UniformSet
```

Each variant uses cheap fbm noise + gradient shading. Picked per `BodyCategory` plus trait modifiers from the body's existing fields (`physical.volatileEnvelope` boosts atmosphere haze; `physical.closeIn` adds heat tint; `traits[]` containing GU-fracture markers triggers a violet rim regardless of category).

### Rings, moons, belts

- **Rings** — `RingGeometry` with a tilt seeded by parent id. 2-3 procedural bands.
- **Moons** — small spheres with their own shader, parent-relative orbit, slow ambient motion (faster than parent's). Capped at 4 visible moons per body in 3D (rest listed in sidebar).
- **Belts** — `THREE.InstancedMesh` of small tetrahedrons (~800-2000 instances depending on belt density and DPR). Positions sampled within the orbital ring with deterministic jitter.

### Volumetric overlays (hazards + GU)

Both rendered as `<Sphere>` meshes with a custom shader:

- Radial alpha falloff (center solid → edge transparent)
- Slight angular noise for cloud edge
- GU bleed: slow opacity pulse (sin-wave, period ~6s)
- Hazards: static
- `prefers-reduced-motion` freezes the GU pulse at mid-opacity

### Habitable zone & snow line

- Habitable zone — thin tilted ellipse band, low-opacity `--accent`. From `system.zones.habitableInnerAu` and `habitableOuterAu`.
- Snow line — dotted orbit line at `system.zones.snowLineAu`.

### Default camera

| Setting | Value |
|---|---|
| Position | `[0, sceneRadius * 0.35, sceneRadius * 0.95]` |
| Target | origin |
| FOV | 45° |
| OrbitControls | `enableDamping=true`, `dampingFactor=0.08`, `minDistance` and `maxDistance` clamped to scene radius |
| Polar angle | clamped softly (allow under-plane view but with damping) |

## 8. Interactivity & modal chrome

### Modal lifecycle

```
Main page (always loaded, lightweight):
  <SystemViewer3DButton system={system}/>
    └─ on click → setOpen(true)
    └─ open  → dynamic-imports viewer3d/index.tsx
    └─ open  → renders <SystemViewer3DModal system={system} onClose={...}/>

Modal:
  - React Portal into document.body
  - Hand-rolled focus trap (no new dependency)
  - Esc closes; click outside closes; X button closes
  - Locks page scroll while open (overflow:hidden on <body>)
  - prefers-reduced-motion: skip the open/close fade
  - Suspense fallback during dynamic-import = small loading skeleton
  - First frame after Canvas mounts = 200ms fade-in on the scene
```

### Modal layout

```
┌───────────────────────────────────────────────────────────────────┐
│  [system name · spectral · body count]   [Physical] [GU] [Human]  │  header (~48px)
│                                                            [X]    │
├──────────────────────────────────────────────────┬────────────────┤
│                                                  │                │
│                                                  │ DetailSidebar  │
│                3D Canvas                         │ (only when a   │
│              (fills available)                   │  body is       │
│                                                  │  selected;     │
│                                                  │  slides in     │
│                                                  │  from right)   │
│                                                  │                │
│                                                  │  ~360px wide   │
│                                                  │                │
├──────────────────────────────────────────────────┴────────────────┤
│  legend chips · scale indicator              [Frame system]       │  footer (~36px)
└───────────────────────────────────────────────────────────────────┘
```

- Header reuses `SectionHeader` typography rhythm from the existing tool.
- Three layer pills use `--accent` / `--accent-mystical` / `--accent-warm` tokens — outlined when off, filled when on.
- Sidebar slides in (250ms) when a body / settlement / hazard / phenomenon is clicked; canvas viewport tightens. Closing the sidebar returns the canvas to full width.

### Hover tooltip

drei `<Html occlude>` billboarded near the hovered object:

```
┌──────────────────────┐
│ ii · Marrow          │
│ rocky-planet · habit │
│ 2 settlements        │
└──────────────────────┘
```

- Shows on body / moon / settlement / hazard / GU bleed hover
- Suppressed during camera drag
- 16ms throttle

### Click → sidebar

| Clicked thing | Sidebar contents |
|---|---|
| Body | `<BodyDetailPanel body={...} />` (existing) + moon list + settlement list |
| Moon | Reuses `BodyDetailPanel` scoped to moon facts |
| Settlement pin | `<SettlementCard settlement={...} />` (existing) + "view body" link |
| Star | New `StarDetailCard` — spectralType, mass, age, activity, companions list |
| Hazard volume | New `HazardCard` — `Fact<string>` text + "anchored to: X" hint |
| GU bleed | `<GuOverlayPanel system={...} compact/>` (existing) |
| Phenomenon glyph | New `PhenomenonCard` reusing `SystemPhenomenon` fields |

Existing detail panels work unchanged in a 360px sidebar. If readability is poor in implementation, we add a `compact` prop in a follow-up; not v1 scope.

### Three layer toggles

| Pill | Hides when off |
|---|---|
| Physical | Orbit lines, habitable zone, snow line, hazard volumes, ring systems |
| GU | GU bleed volumes, gu-fractured rim accents on bodies, phenomenon markers |
| Human | Settlement pins, ruin pins |

The star, bodies, and moons remain visible across all toggle states.

### Camera controls

- drei `OrbitControls` with damping and clamped distances.
- Scroll-zoom on desktop, pinch-zoom on touch.
- "Frame system" button in footer — smooth tween to default camera.
- Click body → camera fly-to over 800ms eased; cancellable by drag.

### Keyboard

- Tab: layer toggles → invisible focusable body list (DOM order) → close button.
- Arrow keys (canvas focused): rotate camera (yaw / pitch).
- `Esc`: close sidebar if open, otherwise close modal.
- `1` / `2` / `3`: toggle Physical / GU / Human layers.
- The main page's `OrbitalTable` remains the canonical accessible reading view.

## 9. Performance, accessibility, edge cases

### Performance budget

| Concern | Strategy |
|---|---|
| Bundle | r3f (~30KB) + three (~150KB) + drei selectively (~30KB) ≈ 210KB gzip in lazy chunk. Main page bundle unchanged. |
| Loading | `next/dynamic(() => import('./viewer3d'), { ssr: false, loading: <ViewerSkeleton/> })` |
| Frame loop | `frameloop="always"` while modal open; entire `viewer3d` tree unmounts on close. `prefers-reduced-motion` switches to `frameloop="demand"`. |
| Belt particles | `THREE.InstancedMesh` (one draw call per belt for ~2000 instances). Density ramped down on low-DPR / mobile. |
| Moons | Capped at 4 per body in 3D; remainder in sidebar text. |
| GU shader | Cheap radial alpha + sin-pulse — single draw per bleed. |
| Body shaders | Single shared `ShaderMaterial`; per-body uniforms updated via `onBeforeRender`. |
| Anti-aliasing | `dpr={[1, 2]}`, `antialias=true`. Lower to `[1, 1.5]` if budget tight. |

We do not optimize beyond these upfront design choices until measured.

### Accessibility

- The existing `OrbitalTable` is the canonical accessible reading surface. The viewer is supplemental.
- `prefers-reduced-motion`: ambient orbit motion freezes; GU pulse stops; modal fade skipped; camera fly-to is instant.
- Keyboard navigation as described above.
- ARIA: modal `role="dialog"` `aria-modal="true"` `aria-labelledby="<system-name-id>"`. Layer pills `<button aria-pressed>`. Sidebar `role="region" aria-label="Body detail"`.
- Hazard red passes contrast on dark backdrop. Layer dots have text labels — no color-only signaling.
- Sidebar reuses existing panels which already meet the project's a11y standards.

### Edge cases

| Case | Behavior |
|---|---|
| 0 bodies | Modal opens, shows just the star + text overlay "no major bodies in this system." Layer toggles still work. |
| 1 body | Single orbit; default camera zooms in slightly. |
| Multi-star companions | Each rendered as a smaller star; separation `Fact<string>` mapped to a placement bucket. A faint curved arc connects companion to primary. |
| Anomaly body | `'anomaly'` shader (dark + violet rim + pulse). Click reveals `whyInteresting`. |
| Belt with no major bodies | Standalone particle ring; settlement pins ride on the ring at deterministic angles. |
| Hazard text we can't classify | Floating chip in footer (not silently dropped). |
| GU bleed `fracture` intensity | Bleed volume larger and pulses faster (still capped, never strobing). |
| WebGL unsupported / context lost | Modal shows fallback message + "scroll to orbital table" button. No crash. |
| Body with locked imported facts | Renders identically in scene (layer doesn't care about confidence). Existing `ConfidenceBadge` does its job in sidebar. |
| Very large systems (>10 bodies) | Outermost orbits scaled down via log function; default camera zooms out. |

## 10. Testing

| Test | Tool | Coverage |
|---|---|---|
| `sceneGraph.test.ts` | vitest | `buildSceneGraph(system)` snapshots on 5-6 representative seeds (frontier + realistic, single + multi-star, sparse + dense). Verifies body count, scale, hazard placement, fallbacks. |
| `scale.test.ts` | vitest | Log-AU mapping monotonic and produces sane spacing across 0.1 → 100 AU. |
| `stellarColor.test.ts` | vitest | Each spectral letter maps to expected hex bucket; class modifier scales corona. |
| `motion.test.ts` | vitest | Phase-by-id deterministic from `(bodyId, seed)`. Same seed → same opening positions. |
| `hazardClassifier.test.ts` | vitest | Common hazard phrases map to expected anchors; unknown text returns `unclassified=true`. |
| `guBleedClassifier.test.ts` | vitest | Common bleed phrases anchor correctly; unknown returns `unclassified=true`. |
| `ViewerModal.test.tsx` | vitest + RTL | Skeleton during dynamic load, `onClose` on Esc, focus trap, layer toggle clicks update context. |
| `LayerToggles.test.tsx` | vitest + RTL | Three pills toggle right state; `1`/`2`/`3` keyboard works. |
| Visual / scene rendering | NOT unit-tested | We rely on the pure scene-graph being correct + manual review. |

### Audit integration

- Existing `audit:star-system-generator` audits do not change — the viewer is a pure consumer.
- New eslint `no-restricted-imports` rule forbids `three` / `@react-three/fiber` / `@react-three/drei` outside `viewer3d/`.

## 11. Build sequence (informational; detailed plan comes later)

The implementation plan will be authored as a follow-up. At a high level:

1. Add dependencies (`three`, `@react-three/fiber`, `@react-three/drei`), eslint `no-restricted-imports` rule, `viewer3d/` skeleton.
2. Implement `lib/sceneGraph.ts` + classifiers + scale + motion + stellarColor + bodyShading. Unit tests for each. (Pure layer first, no rendering.)
3. Build `<ViewerModal/>` chrome shell (header, layer toggles, footer, sidebar slot, close behavior). No 3D yet — placeholder canvas.
4. Build `<Scene/>` core: `<Star/>`, `<Orbit/>`, `<Body/>` (no shaders yet, `<meshStandardMaterial/>` placeholders), `<Zones/>`. Verify the system reads correctly in 3D.
5. Add per-category `bodyShader` variants. Replace placeholders.
6. Add `<Belt/>` instanced particles, `<RingVisual/>`, moons.
7. Add hazard volumes and GU bleed shader. Wire classifier results.
8. Add hover tooltip + click-to-select wiring + camera fly-to.
9. Wire `DetailSidebar` to existing components (`BodyDetailPanel`, `SettlementCard`, `GuOverlayPanel`) and new ones (`StarDetailCard`, `HazardCard`, `PhenomenonCard`).
10. Accessibility pass: keyboard nav, focus trap, reduced motion, ARIA, fallback.
11. Performance pass: measure bundle, frame budget on a mid-tier laptop and a phone; tune DPR, particle count, moon cap as needed.
12. Polish: settlement pin styling, star corona rays scaled by activity, fade-in on first scene mount, "Frame system" button.
