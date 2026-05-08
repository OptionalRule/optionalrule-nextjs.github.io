# 3D System Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a player-facing 3D modal to the Star System Generator that visualizes the current generated system — star, bodies, moons, rings, settlements, hazards, GU bleeds — using react-three-fiber.

**Architecture:** New `src/features/tools/star_system_generator/viewer3d/` directory, lazy-loaded via `next/dynamic` so r3f / three / drei never reach the main bundle. A pure scene-graph projection layer turns `GeneratedSystem` into a render-friendly `SystemSceneGraph`; r3f scene primitives consume that graph.

**Tech Stack:** `three@^0.184`, `@react-three/fiber@^9.6`, `@react-three/drei@^10.7`, React 19.2, TypeScript 6, vitest 4, RTL 16, TailwindCSS v4.

**Spec:** `docs/superpowers/specs/2026-05-08-3d-system-viewer-design.md`

---

## Phase A — Foundation (3 tasks)

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install three, r3f, drei**

Run from project root:

```bash
npm install three@^0.184.0 @react-three/fiber@^9.6.1 @react-three/drei@^10.7.7
npm install --save-dev @types/three@^0.184.0
```

- [ ] **Step 2: Verify install and React 19 peer compatibility**

Run:

```bash
npm ls three @react-three/fiber @react-three/drei
```

Expected: no `UNMET PEER DEPENDENCY` warnings. R3F 9.x peer is `react >=19 <19.3`, drei 10.x peer is `@react-three/fiber ^9.0.0` — both satisfied by the project's `react@^19.2.4`.

- [ ] **Step 3: Type check**

Run:

```bash
npm run typecheck
```

Expected: PASS (no usage yet, just dependencies installed).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(star-gen): add three, r3f, drei for 3D viewer"
```

---

### Task 2: ESLint guard — engine isolation

Forbid importing `three`, `@react-three/fiber`, `@react-three/drei` outside `viewer3d/`. Prevents accidental main-bundle leaks.

**Files:**
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Add no-restricted-imports rule**

Edit `eslint.config.mjs`. After the existing rules block, append a new override block scoped to all `.ts`/`.tsx` files **outside** `viewer3d/`:

```javascript
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/features/tools/star_system_generator/viewer3d/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "three", message: "Import three only inside viewer3d/." },
            { name: "@react-three/fiber", message: "Import @react-three/fiber only inside viewer3d/." },
            { name: "@react-three/drei", message: "Import @react-three/drei only inside viewer3d/." },
          ],
          patterns: [
            { group: ["three/*"], message: "Import three only inside viewer3d/." },
            { group: ["@react-three/*"], message: "Import @react-three/* only inside viewer3d/." },
          ],
        },
      ],
    },
  },
```

- [ ] **Step 2: Verify the guard fires**

Temporarily add to `src/app/layout.tsx`:

```typescript
import * as THREE from 'three'
console.log(THREE)
```

Run:

```bash
npm run lint
```

Expected: FAIL with `no-restricted-imports` error on the THREE import.

Revert the change.

- [ ] **Step 3: Verify lint passes after revert**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add eslint.config.mjs
git commit -m "chore(star-gen): forbid three/r3f imports outside viewer3d"
```

---

### Task 3: Scaffold viewer3d directory + types

Create the empty directory structure and the `SystemSceneGraph` types — the contract between the pure projection layer and the scene primitives.

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/types.ts`
- Create: `src/features/tools/star_system_generator/viewer3d/index.tsx` (placeholder export)
- Create: `src/features/tools/star_system_generator/viewer3d/scene/.gitkeep`
- Create: `src/features/tools/star_system_generator/viewer3d/chrome/.gitkeep`
- Create: `src/features/tools/star_system_generator/viewer3d/lib/.gitkeep`

- [ ] **Step 1: Write `viewer3d/types.ts`**

```typescript
import type { BodyCategory } from '../types'

export type SceneVec3 = [number, number, number]

export type BodyShadingKey =
  | 'rocky-warm'
  | 'rocky-cool'
  | 'earthlike'
  | 'desert'
  | 'sub-neptune'
  | 'gas-giant'
  | 'ice-giant'
  | 'dwarf'
  | 'anomaly'

export interface StarVisual {
  id: string
  coreColor: string
  coronaColor: string
  coronaRadius: number
  rayCount: number
  bloomStrength: number
  position: SceneVec3
}

export interface RingVisual {
  innerRadius: number
  outerRadius: number
  tilt: number
  bandCount: number
  color: string
}

export interface MoonVisual {
  id: string
  parentBodyId: string
  parentRelativeOrbit: number
  phase0: number
  angularSpeed: number
  visualSize: number
  shading: BodyShadingKey
}

export interface BodyVisual {
  id: string
  orbitRadius: number
  orbitTiltY: number
  phase0: number
  angularSpeed: number
  visualSize: number
  shading: BodyShadingKey
  category: BodyCategory
  rings?: RingVisual
  moons: MoonVisual[]
  guAccent: boolean
  hasSettlements: boolean
  settlementIds: string[]
  ruinIds: string[]
}

export interface BeltVisual {
  id: string
  innerRadius: number
  outerRadius: number
  particleCount: number
  jitter: number
  color: string
}

export interface HazardVisual {
  id: string
  center: SceneVec3
  radius: number
  intensity: number
  sourceText: string
  anchorDescription: string
  unclassified: boolean
}

export interface GuBleedVisual {
  id: string
  center: SceneVec3
  radius: number
  pulsePhase: number
  pulsePeriodSec: number
  intensity: number
  unclassified: boolean
}

export interface PhenomenonMarker {
  id: string
  position: SceneVec3
  kind: string
}

export interface RuinMarker {
  id: string
  attachedBodyId?: string
  attachedMoonId?: string
  position: SceneVec3
}

export interface SystemSceneGraph {
  star: StarVisual
  companions: StarVisual[]
  zones: { habitableInner: number; habitable: number; snowLine: number }
  bodies: BodyVisual[]
  belts: BeltVisual[]
  hazards: HazardVisual[]
  guBleeds: GuBleedVisual[]
  phenomena: PhenomenonMarker[]
  ruins: RuinMarker[]
  sceneRadius: number
}

export type LayerKey = 'physical' | 'gu' | 'human'

export interface LayerVisibility {
  physical: boolean
  gu: boolean
  human: boolean
}

export const ALL_LAYERS_ON: LayerVisibility = { physical: true, gu: true, human: true }
```

- [ ] **Step 2: Write `viewer3d/index.tsx` placeholder**

```tsx
'use client'

import type { GeneratedSystem } from '../types'

export interface SystemViewer3DModalProps {
  system: GeneratedSystem
  onClose: () => void
}

export default function SystemViewer3DModal(_props: SystemViewer3DModalProps) {
  return null
}
```

- [ ] **Step 3: Create the empty subdirectories**

```bash
mkdir -p src/features/tools/star_system_generator/viewer3d/scene
mkdir -p src/features/tools/star_system_generator/viewer3d/chrome
mkdir -p src/features/tools/star_system_generator/viewer3d/lib
touch src/features/tools/star_system_generator/viewer3d/scene/.gitkeep
touch src/features/tools/star_system_generator/viewer3d/chrome/.gitkeep
touch src/features/tools/star_system_generator/viewer3d/lib/.gitkeep
```

- [ ] **Step 4: Verify type check + lint**

```bash
npm run typecheck
npm run lint
```

Expected: PASS for both.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d
git commit -m "feat(star-gen): scaffold viewer3d directory + scene-graph types"
```

---

## Phase B — Pure-functional layer (TDD)

This phase implements `viewer3d/lib/*` with full TDD. Every task produces a tested module that can be reused by Phase D scene components.

---

### Task 4: `scale.ts` — log AU mapping + body size buckets

**Files:**
- Test: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/scale.test.ts`
- Create: `src/features/tools/star_system_generator/viewer3d/lib/scale.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { auToScene, bodyVisualSize, SCENE_UNIT } from '../scale'

describe('auToScene', () => {
  it('places 0 AU at the origin', () => {
    expect(auToScene(0)).toBe(0)
  })

  it('is monotonically increasing', () => {
    const samples = [0.1, 0.4, 1, 5, 10, 30, 100]
    for (let i = 1; i < samples.length; i++) {
      expect(auToScene(samples[i])).toBeGreaterThan(auToScene(samples[i - 1]))
    }
  })

  it('compresses outer-system spacing logarithmically', () => {
    const inner = auToScene(1) - auToScene(0.4)
    const outer = auToScene(40) - auToScene(30)
    expect(inner).toBeGreaterThan(outer)
  })

  it('uses SCENE_UNIT as its multiplier', () => {
    expect(auToScene(1)).toBeCloseTo(Math.log10(2) * SCENE_UNIT, 5)
  })
})

describe('bodyVisualSize', () => {
  it('returns category-bucketed sizes', () => {
    expect(bodyVisualSize('gas-giant')).toBeGreaterThan(bodyVisualSize('rocky-planet'))
    expect(bodyVisualSize('rocky-planet')).toBeGreaterThan(bodyVisualSize('dwarf-body'))
    expect(bodyVisualSize('ice-giant')).toBeGreaterThan(bodyVisualSize('sub-neptune'))
  })

  it('returns a stable size for unknown-but-typed categories', () => {
    expect(bodyVisualSize('belt')).toBeGreaterThan(0)
    expect(bodyVisualSize('anomaly')).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/scale.test.ts
```

Expected: FAIL with module-not-found on `../scale`.

- [ ] **Step 3: Implement `scale.ts`**

```typescript
import type { BodyCategory } from '../../types'

export const SCENE_UNIT = 60

export function auToScene(au: number): number {
  if (au <= 0) return 0
  return Math.log10(1 + au) * SCENE_UNIT
}

const VISUAL_SIZE_BY_CATEGORY: Record<BodyCategory, number> = {
  'gas-giant': 3.5,
  'ice-giant': 3.0,
  'sub-neptune': 1.8,
  'super-earth': 1.4,
  'rocky-planet': 1.0,
  'dwarf-body': 0.6,
  'rogue-captured': 0.9,
  belt: 0.4,
  anomaly: 1.2,
}

export function bodyVisualSize(category: BodyCategory): number {
  return VISUAL_SIZE_BY_CATEGORY[category]
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/scale.test.ts
```

Expected: PASS, all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/scale.ts \
        src/features/tools/star_system_generator/viewer3d/lib/__tests__/scale.test.ts
git commit -m "feat(star-gen): viewer3d log-AU scale + body size buckets"
```

---

### Task 5: `motion.ts` — deterministic phase + angular speed

**Files:**
- Test: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/motion.test.ts`
- Create: `src/features/tools/star_system_generator/viewer3d/lib/motion.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { hashToUnit, phase0ForBody, angularSpeedFromAu, AMBIENT_YEAR_SECONDS } from '../motion'

describe('hashToUnit', () => {
  it('returns a value in [0, 1)', () => {
    for (const s of ['a', 'body-3', 'b1#seed42', '']) {
      const n = hashToUnit(s)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
    }
  })

  it('is deterministic', () => {
    expect(hashToUnit('seed42#body-3')).toBe(hashToUnit('seed42#body-3'))
  })

  it('produces different outputs for different inputs', () => {
    expect(hashToUnit('a')).not.toBe(hashToUnit('b'))
  })
})

describe('phase0ForBody', () => {
  it('is deterministic per (bodyId, seed)', () => {
    expect(phase0ForBody('body-3', 'seed42')).toBe(phase0ForBody('body-3', 'seed42'))
  })

  it('returns a radian value in [0, 2π)', () => {
    const p = phase0ForBody('body-3', 'seed42')
    expect(p).toBeGreaterThanOrEqual(0)
    expect(p).toBeLessThan(2 * Math.PI)
  })

  it('differs when seed changes', () => {
    expect(phase0ForBody('body-3', 'seedA')).not.toBe(phase0ForBody('body-3', 'seedB'))
  })
})

describe('angularSpeedFromAu', () => {
  it('uses AMBIENT_YEAR_SECONDS for 1 AU baseline', () => {
    expect(angularSpeedFromAu(1)).toBeCloseTo((2 * Math.PI) / AMBIENT_YEAR_SECONDS, 5)
  })

  it('inner orbits move faster than outer', () => {
    expect(angularSpeedFromAu(0.4)).toBeGreaterThan(angularSpeedFromAu(5))
    expect(angularSpeedFromAu(5)).toBeGreaterThan(angularSpeedFromAu(30))
  })

  it('caps inner-orbit speed so close-in bodies do not strobe', () => {
    expect(angularSpeedFromAu(0.01)).toBeLessThan(angularSpeedFromAu(0.001) * 10)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/motion.test.ts
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `motion.ts`**

```typescript
export const AMBIENT_YEAR_SECONDS = 30
const MAX_ANGULAR_SPEED = (2 * Math.PI) / (AMBIENT_YEAR_SECONDS * 0.25)

export function hashToUnit(input: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return (h >>> 0) / 0x100000000
}

export function phase0ForBody(bodyId: string, seed: string): number {
  return hashToUnit(`${seed}#${bodyId}`) * Math.PI * 2
}

export function angularSpeedFromAu(au: number): number {
  if (au <= 0) return MAX_ANGULAR_SPEED
  const speed = (2 * Math.PI) / (AMBIENT_YEAR_SECONDS * Math.pow(au, 1.5))
  return Math.min(speed, MAX_ANGULAR_SPEED)
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/motion.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/motion.ts \
        src/features/tools/star_system_generator/viewer3d/lib/__tests__/motion.test.ts
git commit -m "feat(star-gen): viewer3d deterministic phase + Kepler-style ω"
```

---

### Task 6: `stellarColor.ts` — spectral type → core/corona visuals

**Files:**
- Test: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/stellarColor.test.ts`
- Create: `src/features/tools/star_system_generator/viewer3d/lib/stellarColor.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { spectralVisuals } from '../stellarColor'

describe('spectralVisuals', () => {
  it('returns warm yellow for G-type', () => {
    const v = spectralVisuals('G2V', 50)
    expect(v.coreColor).toMatch(/^#fff/i)
    expect(v.coronaColor).toMatch(/^#ff[cd]/i)
  })

  it('returns deep red for M-type', () => {
    const v = spectralVisuals('M5V', 50)
    expect(v.coreColor.toLowerCase()).not.toBe('#ffffff')
    expect(v.coronaColor.toLowerCase()).toMatch(/^#(ff|f[0-9a-f]){1}/i)
  })

  it('returns blue-white for O/B-type', () => {
    const v = spectralVisuals('O5V', 50)
    expect(v.coreColor.toLowerCase()).not.toEqual(spectralVisuals('M5V', 50).coreColor.toLowerCase())
  })

  it('falls back to G-type defaults for unknown spectral strings', () => {
    const fallback = spectralVisuals('???', 50)
    const g = spectralVisuals('G2V', 50)
    expect(fallback.coreColor).toBe(g.coreColor)
  })

  it('scales corona radius with luminosity class (giants > dwarfs)', () => {
    const dwarf = spectralVisuals('G2V', 50)
    const giant = spectralVisuals('G2III', 50)
    expect(giant.coronaRadius).toBeGreaterThan(dwarf.coronaRadius)
  })

  it('scales rayCount and bloom with activityRoll', () => {
    const calm = spectralVisuals('G2V', 10)
    const active = spectralVisuals('G2V', 95)
    expect(active.rayCount).toBeGreaterThan(calm.rayCount)
    expect(active.bloomStrength).toBeGreaterThan(calm.bloomStrength)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/stellarColor.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `stellarColor.ts`**

```typescript
export interface StellarVisuals {
  coreColor: string
  coronaColor: string
  coronaRadius: number
  rayCount: number
  bloomStrength: number
}

const LETTER_RAMP: Record<string, { core: string; corona: string }> = {
  O: { core: '#cfe0ff', corona: '#7fa6ff' },
  B: { core: '#dbe8ff', corona: '#9ec0ff' },
  A: { core: '#f0f4ff', corona: '#cdd9ff' },
  F: { core: '#fff5e0', corona: '#ffe9b8' },
  G: { core: '#fff8d8', corona: '#ffd97a' },
  K: { core: '#ffd6a8', corona: '#ff9d4a' },
  M: { core: '#ffb38a', corona: '#ff6b3a' },
}

const CLASS_RADIUS: Record<string, number> = {
  V: 38,
  IV: 44,
  III: 56,
  II: 70,
  I: 88,
}

const CLASS_PATTERN = /(Ia|Ib|II|III|IV|V)/

export function spectralVisuals(spectralType: string, activityRoll: number): StellarVisuals {
  const letter = (spectralType.match(/^[OBAFGKM]/i)?.[0] ?? 'G').toUpperCase()
  const ramp = LETTER_RAMP[letter] ?? LETTER_RAMP.G
  const classMatch = spectralType.match(CLASS_PATTERN)?.[0] ?? 'V'
  const normalizedClass = classMatch === 'Ia' || classMatch === 'Ib' ? 'I' : classMatch
  const coronaRadius = CLASS_RADIUS[normalizedClass] ?? CLASS_RADIUS.V
  const activityT = Math.min(Math.max(activityRoll, 0), 100) / 100

  return {
    coreColor: ramp.core,
    coronaColor: ramp.corona,
    coronaRadius,
    rayCount: Math.round(6 + activityT * 6),
    bloomStrength: 0.4 + activityT * 0.8,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/stellarColor.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/stellarColor.ts \
        src/features/tools/star_system_generator/viewer3d/lib/__tests__/stellarColor.test.ts
git commit -m "feat(star-gen): spectral-type → star core/corona visuals"
```

---

### Task 7: `bodyShading.ts` — category → shading key + uniforms

**Files:**
- Test: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/bodyShading.test.ts`
- Create: `src/features/tools/star_system_generator/viewer3d/lib/bodyShading.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import type { OrbitingBody } from '../../../types'
import { chooseShading, shaderUniforms } from '../bodyShading'

function fakeBody(category: OrbitingBody['category']['value'], overrides: Partial<OrbitingBody> = {}): OrbitingBody {
  return {
    id: 'b1',
    orbitAu: { value: 1, confidence: 'derived' },
    name: { value: 'Test', confidence: 'derived' },
    category: { value: category, confidence: 'derived' },
    massClass: { value: '', confidence: 'derived' },
    bodyClass: { value: '', confidence: 'derived' },
    whyInteresting: { value: '', confidence: 'derived' },
    thermalZone: { value: 'temperate', confidence: 'derived' },
    physical: {
      radiusEarth: { value: 1, confidence: 'derived' },
      massEarth: { value: 1, confidence: 'derived' },
      surfaceGravityG: { value: 1, confidence: 'derived' },
      gravityLabel: { value: '1g', confidence: 'derived' },
      periodDays: { value: 365, confidence: 'derived' },
      closeIn: { value: false, confidence: 'derived' },
      volatileEnvelope: { value: false, confidence: 'derived' },
    },
    detail: {
      atmosphere: { value: '', confidence: 'derived' },
      hydrosphere: { value: '', confidence: 'derived' },
      geology: { value: '', confidence: 'derived' },
      climate: [],
      radiation: { value: '', confidence: 'derived' },
      biosphere: { value: '', confidence: 'derived' },
    },
    moons: [],
    filterNotes: [],
    traits: [],
    sites: [],
    ...overrides,
  } as OrbitingBody
}

describe('chooseShading', () => {
  it('maps gas-giant to gas-giant shading', () => {
    expect(chooseShading(fakeBody('gas-giant'))).toBe('gas-giant')
  })

  it('maps ice-giant to ice-giant shading', () => {
    expect(chooseShading(fakeBody('ice-giant'))).toBe('ice-giant')
  })

  it('maps sub-neptune to sub-neptune shading', () => {
    expect(chooseShading(fakeBody('sub-neptune'))).toBe('sub-neptune')
  })

  it('maps anomaly to anomaly shading', () => {
    expect(chooseShading(fakeBody('anomaly'))).toBe('anomaly')
  })

  it('maps dwarf-body to dwarf shading', () => {
    expect(chooseShading(fakeBody('dwarf-body'))).toBe('dwarf')
  })

  it('routes rocky-planet by thermal hint: hot → desert, cold → rocky-cool, habitable hydrosphere → earthlike', () => {
    const hot = fakeBody('rocky-planet', {
      thermalZone: { value: 'inner-hot', confidence: 'derived' },
      physical: { ...fakeBody('rocky-planet').physical, closeIn: { value: true, confidence: 'derived' } },
    })
    const cold = fakeBody('rocky-planet', { thermalZone: { value: 'outer-cold', confidence: 'derived' } })
    const habitable = fakeBody('rocky-planet', {
      detail: {
        ...fakeBody('rocky-planet').detail,
        hydrosphere: { value: 'liquid water oceans', confidence: 'derived' },
      },
    })
    expect(chooseShading(hot)).toBe('desert')
    expect(chooseShading(cold)).toBe('rocky-cool')
    expect(chooseShading(habitable)).toBe('earthlike')
  })

  it('falls through to rocky-warm for unspecified rocky planets', () => {
    expect(chooseShading(fakeBody('rocky-planet'))).toBe('rocky-warm')
  })
})

describe('shaderUniforms', () => {
  it('returns a baseColor and a noiseScale for every shading key', () => {
    const u = shaderUniforms(fakeBody('rocky-planet'))
    expect(u.baseColor).toBeDefined()
    expect(u.noiseScale).toBeGreaterThan(0)
  })

  it('boosts atmosphere haze when volatileEnvelope is true', () => {
    const dry = shaderUniforms(fakeBody('rocky-planet'))
    const hazy = shaderUniforms(
      fakeBody('rocky-planet', {
        physical: { ...fakeBody('rocky-planet').physical, volatileEnvelope: { value: true, confidence: 'derived' } },
      }),
    )
    expect(hazy.atmosphereStrength).toBeGreaterThan(dry.atmosphereStrength)
  })

  it('boosts heat tint when closeIn is true', () => {
    const cool = shaderUniforms(fakeBody('rocky-planet'))
    const hot = shaderUniforms(
      fakeBody('rocky-planet', {
        physical: { ...fakeBody('rocky-planet').physical, closeIn: { value: true, confidence: 'derived' } },
      }),
    )
    expect(hot.heatTint).toBeGreaterThan(cool.heatTint)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/bodyShading.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `bodyShading.ts`**

```typescript
import type { OrbitingBody } from '../../types'
import type { BodyShadingKey } from '../types'

export interface ShaderUniformSet {
  baseColor: string
  noiseScale: number
  atmosphereStrength: number
  heatTint: number
  bandStrength: number
}

const SHADING_BASE: Record<BodyShadingKey, ShaderUniformSet> = {
  'rocky-warm':  { baseColor: '#a87a5a', noiseScale: 4.0, atmosphereStrength: 0.2, heatTint: 0.0, bandStrength: 0.0 },
  'rocky-cool':  { baseColor: '#7e8a96', noiseScale: 4.0, atmosphereStrength: 0.15, heatTint: 0.0, bandStrength: 0.0 },
  earthlike:     { baseColor: '#3a7e9a', noiseScale: 3.0, atmosphereStrength: 0.4, heatTint: 0.0, bandStrength: 0.0 },
  desert:        { baseColor: '#d6a96b', noiseScale: 3.5, atmosphereStrength: 0.15, heatTint: 0.3, bandStrength: 0.1 },
  'sub-neptune': { baseColor: '#9ec8c2', noiseScale: 2.5, atmosphereStrength: 0.5, heatTint: 0.0, bandStrength: 0.2 },
  'gas-giant':   { baseColor: '#b08a52', noiseScale: 2.0, atmosphereStrength: 0.6, heatTint: 0.0, bandStrength: 0.8 },
  'ice-giant':   { baseColor: '#5e92aa', noiseScale: 2.5, atmosphereStrength: 0.5, heatTint: 0.0, bandStrength: 0.4 },
  dwarf:         { baseColor: '#8a8a82', noiseScale: 5.0, atmosphereStrength: 0.05, heatTint: 0.0, bandStrength: 0.0 },
  anomaly:       { baseColor: '#1a0d2a', noiseScale: 6.0, atmosphereStrength: 0.0, heatTint: 0.0, bandStrength: 0.0 },
}

export function chooseShading(body: OrbitingBody): BodyShadingKey {
  const cat = body.category.value
  switch (cat) {
    case 'gas-giant': return 'gas-giant'
    case 'ice-giant': return 'ice-giant'
    case 'sub-neptune': return 'sub-neptune'
    case 'anomaly': return 'anomaly'
    case 'dwarf-body': return 'dwarf'
    case 'belt': return 'dwarf'
    case 'rogue-captured': return 'rocky-cool'
    case 'super-earth':
    case 'rocky-planet': {
      const hydro = body.detail.hydrosphere.value.toLowerCase()
      if (hydro.includes('water') || hydro.includes('ocean')) return 'earthlike'
      const closeIn = body.physical.closeIn.value
      const thermal = body.thermalZone.value.toLowerCase()
      if (closeIn || thermal.includes('hot')) return 'desert'
      if (thermal.includes('cold') || thermal.includes('frozen')) return 'rocky-cool'
      return 'rocky-warm'
    }
    default: return 'rocky-warm'
  }
}

export function shaderUniforms(body: OrbitingBody): ShaderUniformSet {
  const key = chooseShading(body)
  const base = SHADING_BASE[key]
  const volatileBoost = body.physical.volatileEnvelope.value ? 0.25 : 0
  const heatBoost = body.physical.closeIn.value ? 0.4 : 0
  return {
    ...base,
    atmosphereStrength: base.atmosphereStrength + volatileBoost,
    heatTint: base.heatTint + heatBoost,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/bodyShading.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/bodyShading.ts \
        src/features/tools/star_system_generator/viewer3d/lib/__tests__/bodyShading.test.ts
git commit -m "feat(star-gen): body-shading category mapping + uniforms"
```

---

### Task 8: `hazardClassifier.ts` — hazard text → volumetric placement

**Files:**
- Test: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/hazardClassifier.test.ts`
- Create: `src/features/tools/star_system_generator/viewer3d/lib/hazardClassifier.ts`

The classifier turns free-form `Fact<string>` hazard text into a `HazardVisual`. It uses a keyword table to anchor the hazard to a body, an orbit, or a zone in the current system. If no keyword matches, the visual is returned with `unclassified: true` so the caller renders a footer chip rather than dropping it.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import type { Fact, GeneratedSystem } from '../../../types'
import { classifyHazard } from '../hazardClassifier'

function fact<T>(value: T): Fact<T> { return { value, confidence: 'derived' } }

const minimalSystem = {
  id: 'sys-1',
  seed: 'test',
  zones: { habitableInnerAu: fact(0.8), habitableCenterAu: fact(1), habitableOuterAu: fact(1.5), snowLineAu: fact(5) },
  bodies: [
    { id: 'b-jovian',  orbitAu: fact(5.2),  category: fact('gas-giant'),    name: fact('Bessel') },
    { id: 'b-rocky',   orbitAu: fact(1.0),  category: fact('rocky-planet'), name: fact('Marrow') },
    { id: 'b-outer',   orbitAu: fact(28),   category: fact('ice-giant'),    name: fact('Ostara') },
  ],
} as unknown as GeneratedSystem

describe('classifyHazard', () => {
  it('anchors radiation hazards near gas giants', () => {
    const v = classifyHazard(fact('Severe magnetospheric radiation belt'), minimalSystem)
    expect(v.unclassified).toBe(false)
    expect(v.anchorDescription).toMatch(/Bessel/)
  })

  it('anchors pinch/route hazards at the outer edge', () => {
    const v = classifyHazard(fact('Pinch field along outer route'), minimalSystem)
    expect(v.unclassified).toBe(false)
    expect(v.anchorDescription).toMatch(/outer/i)
  })

  it('returns unclassified=true for unmatched text', () => {
    const v = classifyHazard(fact('Some entirely unforeseen hazard text'), minimalSystem)
    expect(v.unclassified).toBe(true)
  })

  it('preserves the source text for sidebar display', () => {
    const v = classifyHazard(fact('Severe magnetospheric radiation belt'), minimalSystem)
    expect(v.sourceText).toBe('Severe magnetospheric radiation belt')
  })

  it('returns intensity in [0,1]', () => {
    const v = classifyHazard(fact('Severe magnetospheric radiation belt'), minimalSystem)
    expect(v.intensity).toBeGreaterThanOrEqual(0)
    expect(v.intensity).toBeLessThanOrEqual(1)
  })

  it('produces deterministic ids per text+system', () => {
    const a = classifyHazard(fact('Severe magnetospheric radiation belt'), minimalSystem)
    const b = classifyHazard(fact('Severe magnetospheric radiation belt'), minimalSystem)
    expect(a.id).toBe(b.id)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/hazardClassifier.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `hazardClassifier.ts`**

```typescript
import type { Fact, GeneratedSystem, OrbitingBody } from '../../types'
import type { HazardVisual, SceneVec3 } from '../types'
import { auToScene } from './scale'
import { hashToUnit } from './motion'

interface AnchorRule {
  keywords: string[]
  resolve: (system: GeneratedSystem) => { center: SceneVec3; radius: number; anchorDescription: string } | null
}

function findFirstBody(system: GeneratedSystem, predicate: (b: OrbitingBody) => boolean): OrbitingBody | undefined {
  return system.bodies.find(predicate)
}

function bodyAnchor(body: OrbitingBody, radius: number, label: string): { center: SceneVec3; radius: number; anchorDescription: string } {
  const r = auToScene(body.orbitAu.value)
  const angle = hashToUnit(body.id) * Math.PI * 2
  return {
    center: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
    radius,
    anchorDescription: `${label}: ${body.name.value}`,
  }
}

const RULES: AnchorRule[] = [
  {
    keywords: ['radiation belt', 'magnetosphere', 'magnetospheric'],
    resolve: (system) => {
      const giant = findFirstBody(system, (b) => b.category.value === 'gas-giant' || b.category.value === 'ice-giant')
      return giant ? bodyAnchor(giant, 18, 'near') : null
    },
  },
  {
    keywords: ['pinch', 'route', 'choke', 'transit corridor'],
    resolve: (system) => {
      const outermost = system.bodies.reduce<OrbitingBody | undefined>(
        (acc, b) => (acc && acc.orbitAu.value > b.orbitAu.value ? acc : b),
        undefined,
      )
      if (!outermost) return null
      const r = auToScene(outermost.orbitAu.value) * 1.15
      return {
        center: [r, 0, 0],
        radius: 22,
        anchorDescription: 'outer route',
      }
    },
  },
  {
    keywords: ['stellar flare', 'cme', 'coronal'],
    resolve: () => ({ center: [0, 0, 0], radius: 28, anchorDescription: 'stellar' }),
  },
  {
    keywords: ['debris', 'wreckage', 'asteroid swarm'],
    resolve: (system) => {
      const inner = findFirstBody(system, (b) => b.category.value === 'belt')
      return inner ? bodyAnchor(inner, 20, 'within') : null
    },
  },
]

function intensityFromText(text: string): number {
  const t = text.toLowerCase()
  if (t.includes('severe') || t.includes('lethal') || t.includes('extreme')) return 0.95
  if (t.includes('major') || t.includes('high')) return 0.75
  if (t.includes('moderate')) return 0.55
  if (t.includes('mild') || t.includes('low')) return 0.35
  return 0.6
}

export function classifyHazard(hazard: Fact<string>, system: GeneratedSystem): HazardVisual {
  const text = hazard.value
  const lower = text.toLowerCase()
  const id = `hz-${hashToUnit(`${system.id}#${text}`).toString(36).slice(2, 10)}`

  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      const placement = rule.resolve(system)
      if (placement) {
        return {
          id,
          center: placement.center,
          radius: placement.radius,
          intensity: intensityFromText(text),
          sourceText: text,
          anchorDescription: placement.anchorDescription,
          unclassified: false,
        }
      }
    }
  }

  return {
    id,
    center: [0, 0, 0],
    radius: 0,
    intensity: intensityFromText(text),
    sourceText: text,
    anchorDescription: '',
    unclassified: true,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/hazardClassifier.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/hazardClassifier.ts \
        src/features/tools/star_system_generator/viewer3d/lib/__tests__/hazardClassifier.test.ts
git commit -m "feat(star-gen): viewer3d hazard placement classifier"
```

---

### Task 9: `guBleedClassifier.ts` — GU overlay → volumetric placement

**Files:**
- Test: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/guBleedClassifier.test.ts`
- Create: `src/features/tools/star_system_generator/viewer3d/lib/guBleedClassifier.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import type { Fact, GeneratedSystem, GuOverlay } from '../../../types'
import { classifyGuBleed } from '../guBleedClassifier'

function fact<T>(value: T): Fact<T> { return { value, confidence: 'gu-layer' } }

function makeSystem(): GeneratedSystem {
  return {
    id: 'sys-1',
    seed: 'test',
    zones: { habitableInnerAu: fact(0.8), habitableCenterAu: fact(1), habitableOuterAu: fact(1.5), snowLineAu: fact(5) },
    bodies: [
      { id: 'b-rocky',  orbitAu: fact(1.0),  category: fact('rocky-planet'), name: fact('Marrow') },
      { id: 'b-outer',  orbitAu: fact(28),   category: fact('ice-giant'),    name: fact('Ostara') },
    ],
    guOverlay: {
      intensity: fact('moderate'),
      bleedLocation: fact('near outer system'),
      bleedBehavior: fact('caustic'),
      resource: fact(''),
      hazard: fact(''),
      intensityRoll: fact(50),
      intensityModifiers: [],
    } as GuOverlay,
  } as unknown as GeneratedSystem
}

describe('classifyGuBleed', () => {
  it('places outer-system bleeds near the outermost orbit', () => {
    const sys = makeSystem()
    const v = classifyGuBleed(sys.guOverlay, sys)
    expect(v.unclassified).toBe(false)
    expect(Math.abs(v.center[0]) + Math.abs(v.center[2])).toBeGreaterThan(0)
  })

  it('returns unclassified=true for an unrecognizable bleed location', () => {
    const sys = makeSystem()
    const guOverlay: GuOverlay = { ...sys.guOverlay, bleedLocation: fact('quizzical undefined hand-wave') }
    const v = classifyGuBleed(guOverlay, sys)
    expect(v.unclassified).toBe(true)
  })

  it('scales intensity with the intensity word', () => {
    const sys = makeSystem()
    const calm = classifyGuBleed({ ...sys.guOverlay, intensity: fact('low') }, sys)
    const fracture = classifyGuBleed({ ...sys.guOverlay, intensity: fact('fracture') }, sys)
    expect(fracture.intensity).toBeGreaterThan(calm.intensity)
    expect(fracture.radius).toBeGreaterThan(calm.radius)
  })

  it('produces deterministic ids', () => {
    const sys = makeSystem()
    expect(classifyGuBleed(sys.guOverlay, sys).id).toBe(classifyGuBleed(sys.guOverlay, sys).id)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/guBleedClassifier.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `guBleedClassifier.ts`**

```typescript
import type { GeneratedSystem, GuOverlay, OrbitingBody } from '../../types'
import type { GuBleedVisual, SceneVec3 } from '../types'
import { auToScene } from './scale'
import { hashToUnit } from './motion'

interface AnchorMatch {
  center: SceneVec3
  radius: number
}

const INTENSITY_LEVELS: Record<string, { intensity: number; radius: number }> = {
  low:       { intensity: 0.3,  radius: 36 },
  normal:    { intensity: 0.55, radius: 50 },
  moderate:  { intensity: 0.55, radius: 50 },
  high:      { intensity: 0.75, radius: 70 },
  severe:    { intensity: 0.85, radius: 84 },
  fracture:  { intensity: 1.0,  radius: 100 },
}

function intensityFromOverlay(overlay: GuOverlay): { intensity: number; radius: number } {
  const text = overlay.intensity.value.toLowerCase()
  for (const [keyword, value] of Object.entries(INTENSITY_LEVELS)) {
    if (text.includes(keyword)) return value
  }
  return INTENSITY_LEVELS.normal
}

function bodyAnchor(body: OrbitingBody): AnchorMatch {
  const r = auToScene(body.orbitAu.value)
  const angle = hashToUnit(`gu#${body.id}`) * Math.PI * 2
  return {
    center: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
    radius: 0,
  }
}

function resolveAnchor(overlay: GuOverlay, system: GeneratedSystem): AnchorMatch | null {
  const text = overlay.bleedLocation.value.toLowerCase()
  if (!text) return null

  if (text.includes('outer') || text.includes('kuiper') || text.includes('edge')) {
    const outermost = system.bodies.reduce<OrbitingBody | undefined>(
      (acc, b) => (acc && acc.orbitAu.value > b.orbitAu.value ? acc : b),
      undefined,
    )
    if (!outermost) return null
    return bodyAnchor(outermost)
  }

  if (text.includes('inner') || text.includes('close')) {
    const inner = system.bodies.reduce<OrbitingBody | undefined>(
      (acc, b) => (acc && acc.orbitAu.value < b.orbitAu.value ? acc : b),
      undefined,
    )
    if (!inner) return null
    return bodyAnchor(inner)
  }

  if (text.includes('habitable') || text.includes('temperate')) {
    const r = auToScene(system.zones.habitableCenterAu.value)
    return { center: [r, 0, 0], radius: 0 }
  }

  if (text.includes('belt') || text.includes('asteroid')) {
    const belt = system.bodies.find((b) => b.category.value === 'belt')
    return belt ? bodyAnchor(belt) : null
  }

  for (const body of system.bodies) {
    if (text.includes(body.name.value.toLowerCase())) return bodyAnchor(body)
  }

  return null
}

export function classifyGuBleed(overlay: GuOverlay, system: GeneratedSystem): GuBleedVisual {
  const id = `gu-${hashToUnit(`${system.id}#${overlay.bleedLocation.value}#${overlay.intensity.value}`).toString(36).slice(2, 10)}`
  const sized = intensityFromOverlay(overlay)
  const anchor = resolveAnchor(overlay, system)
  const pulsePeriodSec = sized.intensity >= 0.95 ? 4 : 6

  if (!anchor) {
    return {
      id,
      center: [0, 0, 0],
      radius: 0,
      pulsePhase: hashToUnit(`gu-phase#${id}`) * Math.PI * 2,
      pulsePeriodSec,
      intensity: sized.intensity,
      unclassified: true,
    }
  }

  return {
    id,
    center: anchor.center,
    radius: sized.radius,
    pulsePhase: hashToUnit(`gu-phase#${id}`) * Math.PI * 2,
    pulsePeriodSec,
    intensity: sized.intensity,
    unclassified: false,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/guBleedClassifier.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/guBleedClassifier.ts \
        src/features/tools/star_system_generator/viewer3d/lib/__tests__/guBleedClassifier.test.ts
git commit -m "feat(star-gen): viewer3d GU bleed placement classifier"
```

---

### Task 10: `sceneGraph.ts` — `buildSceneGraph(system)` projection

**Files:**
- Test: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph.test.ts`
- Create: `src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts`

This is the core projection: `GeneratedSystem` → `SystemSceneGraph`. It composes scale, motion, stellarColor, bodyShading, and the two classifiers. It is pure and deterministic.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'

const seed = 'plan-test-001'

describe('buildSceneGraph', () => {
  const system = generateSystem({ seed, distribution: 'realistic', tone: 'balanced', gu: 'normal', settlements: 'normal' })
  const graph = buildSceneGraph(system)

  it('produces a star with non-empty colors and a positive corona radius', () => {
    expect(graph.star.coreColor).toMatch(/^#/)
    expect(graph.star.coronaColor).toMatch(/^#/)
    expect(graph.star.coronaRadius).toBeGreaterThan(0)
  })

  it('renders one BodyVisual per non-belt OrbitingBody', () => {
    const expected = system.bodies.filter((b) => b.category.value !== 'belt').length
    expect(graph.bodies.length).toBe(expected)
  })

  it('renders one BeltVisual per belt OrbitingBody', () => {
    const expected = system.bodies.filter((b) => b.category.value === 'belt').length
    expect(graph.belts.length).toBe(expected)
  })

  it('orbit radii are monotonic when bodies are sorted by AU', () => {
    const sorted = [...graph.bodies].sort((a, b) => a.orbitRadius - b.orbitRadius)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].orbitRadius).toBeGreaterThanOrEqual(sorted[i - 1].orbitRadius)
    }
  })

  it('is deterministic for the same seed', () => {
    const a = buildSceneGraph(system)
    const b = buildSceneGraph(system)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('produces one HazardVisual per major hazard', () => {
    expect(graph.hazards.length).toBe(system.majorHazards.length)
  })

  it('produces exactly one GuBleedVisual per system', () => {
    expect(graph.guBleeds.length).toBe(1)
  })

  it('marks a body with gu-fracture trait as guAccent', () => {
    const fractured = graph.bodies.find((b) =>
      system.bodies.find((sb) => sb.id === b.id)?.traits.some((t) => /gu|fracture/i.test(t.value)),
    )
    if (fractured) expect(fractured.guAccent).toBe(true)
  })

  it('sceneRadius is at least the outermost orbit radius', () => {
    const maxOrbit = Math.max(...graph.bodies.map((b) => b.orbitRadius), 0)
    expect(graph.sceneRadius).toBeGreaterThanOrEqual(maxOrbit)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph.test.ts
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `sceneGraph.ts`**

```typescript
import type { GeneratedSystem, OrbitingBody, Moon, StellarCompanion } from '../../types'
import type {
  BeltVisual,
  BodyVisual,
  MoonVisual,
  PhenomenonMarker,
  RingVisual,
  RuinMarker,
  SceneVec3,
  StarVisual,
  SystemSceneGraph,
} from '../types'
import { auToScene, bodyVisualSize } from './scale'
import { angularSpeedFromAu, hashToUnit, phase0ForBody } from './motion'
import { spectralVisuals } from './stellarColor'
import { chooseShading } from './bodyShading'
import { classifyHazard } from './hazardClassifier'
import { classifyGuBleed } from './guBleedClassifier'

const COMPANION_OFFSETS: Record<string, number> = {
  close:    auToScene(0.5),
  near:     auToScene(2),
  moderate: auToScene(8),
  wide:     auToScene(40),
  distant:  auToScene(80),
}

function companionOffset(separation: string): number {
  const lower = separation.toLowerCase()
  for (const [keyword, offset] of Object.entries(COMPANION_OFFSETS)) {
    if (lower.includes(keyword)) return offset
  }
  return COMPANION_OFFSETS.moderate
}

function buildStar(system: GeneratedSystem): StarVisual {
  const visuals = spectralVisuals(system.primary.spectralType.value, system.primary.activityRoll.value)
  return {
    id: system.primary.id,
    coreColor: visuals.coreColor,
    coronaColor: visuals.coronaColor,
    coronaRadius: visuals.coronaRadius,
    rayCount: visuals.rayCount,
    bloomStrength: visuals.bloomStrength,
    position: [0, 0, 0],
  }
}

function buildCompanion(companion: StellarCompanion, primary: StarVisual): StarVisual {
  const visuals = spectralVisuals('G2V', 50)
  const offset = companionOffset(companion.separation.value)
  const angle = hashToUnit(`companion#${companion.id}`) * Math.PI * 2
  return {
    id: companion.id,
    coreColor: visuals.coreColor,
    coronaColor: visuals.coronaColor,
    coronaRadius: visuals.coronaRadius * 0.7,
    rayCount: visuals.rayCount,
    bloomStrength: visuals.bloomStrength * 0.7,
    position: [Math.cos(angle) * offset, 0, Math.sin(angle) * offset],
  }
}

function ringFor(body: OrbitingBody, parentSize: number): RingVisual | undefined {
  if (!body.rings) return undefined
  const tilt = (hashToUnit(`ring#${body.id}`) - 0.5) * 0.6
  return {
    innerRadius: parentSize * 1.4,
    outerRadius: parentSize * 2.1,
    tilt,
    bandCount: 3,
    color: '#d6a96b',
  }
}

function moonsFor(body: OrbitingBody, seed: string, parentSize: number): MoonVisual[] {
  const cap = 4
  return body.moons.slice(0, cap).map((moon: Moon, idx: number) => {
    const orbit = parentSize * (1.8 + idx * 0.7)
    return {
      id: moon.id,
      parentBodyId: body.id,
      parentRelativeOrbit: orbit,
      phase0: phase0ForBody(moon.id, seed),
      angularSpeed: (Math.PI * 2) / 6,
      visualSize: parentSize * 0.18,
      shading: 'dwarf',
    }
  })
}

function bodyHasGuFracture(body: OrbitingBody): boolean {
  if (body.category.value === 'anomaly') return true
  const traitText = body.traits.map((t) => t.value).join(' ').toLowerCase()
  if (traitText.includes('gu-fracture') || traitText.includes('gu fracture') || traitText.includes('fractured')) return true
  const filterText = body.filterNotes.map((t) => t.value).join(' ').toLowerCase()
  return filterText.includes('gu') && filterText.includes('fracture')
}

function buildBody(body: OrbitingBody, system: GeneratedSystem): BodyVisual {
  const size = bodyVisualSize(body.category.value)
  const settlementIds = system.settlements
    .filter((s) => s.bodyId === body.id || body.moons.some((m) => m.id === s.moonId))
    .map((s) => s.id)
  const ruinIds = system.ruins
    .filter((r) => r.location.value.toLowerCase().includes(body.name.value.toLowerCase()))
    .map((r) => r.id)
  return {
    id: body.id,
    orbitRadius: auToScene(body.orbitAu.value),
    orbitTiltY: (hashToUnit(`tilt#${body.id}`) - 0.5) * 0.12,
    phase0: phase0ForBody(body.id, system.seed),
    angularSpeed: angularSpeedFromAu(body.orbitAu.value),
    visualSize: size,
    shading: chooseShading(body),
    category: body.category.value,
    rings: ringFor(body, size),
    moons: moonsFor(body, system.seed, size),
    guAccent: bodyHasGuFracture(body),
    hasSettlements: settlementIds.length > 0,
    settlementIds,
    ruinIds,
  }
}

function buildBelt(body: OrbitingBody): BeltVisual {
  const r = auToScene(body.orbitAu.value)
  return {
    id: body.id,
    innerRadius: r * 0.92,
    outerRadius: r * 1.08,
    particleCount: 1500,
    jitter: r * 0.04,
    color: '#a4a48f',
  }
}

function buildPhenomenon(phen: GeneratedSystem['phenomena'][number], system: GeneratedSystem): PhenomenonMarker {
  const angle = hashToUnit(`phen#${phen.id}`) * Math.PI * 2
  const rAu = (system.zones.habitableCenterAu.value + system.zones.snowLineAu.value) / 2
  const r = auToScene(rAu)
  return {
    id: phen.id,
    position: [Math.cos(angle) * r * 1.3, 0, Math.sin(angle) * r * 1.3],
    kind: phen.phenomenon.value,
  }
}

function buildRuin(ruin: GeneratedSystem['ruins'][number], system: GeneratedSystem, bodies: BodyVisual[]): RuinMarker {
  const locationLower = ruin.location.value.toLowerCase()
  const matched = bodies.find((b) => locationLower.includes(b.id.toLowerCase()))
  if (matched) {
    return {
      id: ruin.id,
      attachedBodyId: matched.id,
      position: [0, 0, 0],
    }
  }
  const outer = bodies.reduce<BodyVisual | undefined>(
    (acc, b) => (acc && acc.orbitRadius > b.orbitRadius ? acc : b),
    undefined,
  )
  const baseR = (outer ? outer.orbitRadius : auToScene(system.zones.snowLineAu.value)) * 1.2
  const angle = hashToUnit(`ruin#${ruin.id}`) * Math.PI * 2
  return {
    id: ruin.id,
    position: [Math.cos(angle) * baseR, 0, Math.sin(angle) * baseR],
  }
}

export function buildSceneGraph(system: GeneratedSystem): SystemSceneGraph {
  const star = buildStar(system)
  const companions = system.companions.map((c) => buildCompanion(c, star))

  const nonBelt = system.bodies.filter((b) => b.category.value !== 'belt')
  const beltBodies = system.bodies.filter((b) => b.category.value === 'belt')

  const bodies = nonBelt.map((b) => buildBody(b, system))
  const belts = beltBodies.map(buildBelt)

  const hazards = system.majorHazards.map((h) => classifyHazard(h, system))
  const guBleeds = [classifyGuBleed(system.guOverlay, system)]
  const phenomena = system.phenomena.map((p) => buildPhenomenon(p, system))
  const ruins = system.ruins.map((r) => buildRuin(r, system, bodies))

  const maxBodyOrbit = Math.max(...bodies.map((b) => b.orbitRadius), 0)
  const maxBeltOrbit = Math.max(...belts.map((b) => b.outerRadius), 0)
  const sceneRadius = Math.max(maxBodyOrbit, maxBeltOrbit, auToScene(system.zones.snowLineAu.value)) * 1.15

  const zones = {
    habitableInner: auToScene(system.zones.habitableInnerAu.value),
    habitable: auToScene(system.zones.habitableCenterAu.value),
    snowLine: auToScene(system.zones.snowLineAu.value),
  }

  return {
    star,
    companions,
    zones,
    bodies,
    belts,
    hazards,
    guBleeds,
    phenomena,
    ruins,
    sceneRadius,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts \
        src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph.test.ts
git commit -m "feat(star-gen): buildSceneGraph projection — pure data layer complete"
```

---

## Phase C — Modal chrome shell

The DOM-side wrapper. After this phase the engineer can click a button and see a modal with an empty canvas. Phase D fills the canvas.

---

### Task 11: `SystemViewer3DButton` — main-bundle entry point

**Files:**
- Create: `src/features/tools/star_system_generator/components/__tests__/SystemViewer3DButton.test.tsx`
- Create: `src/features/tools/star_system_generator/components/SystemViewer3DButton.tsx`

The button stays in the main bundle. It dynamic-imports the `viewer3d` module on click.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { GeneratedSystem } from '../../types'
import { SystemViewer3DButton } from '../SystemViewer3DButton'

vi.mock('next/dynamic', () => ({
  default: () => function MockedModal({ onClose }: { onClose: () => void }) {
    return (
      <div role="dialog" aria-label="3D system viewer">
        Mocked viewer
        <button onClick={onClose}>close-mock</button>
      </div>
    )
  },
}))

const fakeSystem = {} as unknown as GeneratedSystem

describe('SystemViewer3DButton', () => {
  it('renders a button with an accessible label', () => {
    render(<SystemViewer3DButton system={fakeSystem} />)
    expect(screen.getByRole('button', { name: /3d viewer|view in 3d|open 3d/i })).toBeInTheDocument()
  })

  it('opens the modal when clicked', async () => {
    const user = userEvent.setup()
    render(<SystemViewer3DButton system={fakeSystem} />)
    await user.click(screen.getByRole('button', { name: /3d/i }))
    expect(await screen.findByRole('dialog', { name: /3d system viewer/i })).toBeInTheDocument()
  })

  it('closes the modal via onClose', async () => {
    const user = userEvent.setup()
    render(<SystemViewer3DButton system={fakeSystem} />)
    await user.click(screen.getByRole('button', { name: /3d/i }))
    await user.click(await screen.findByText('close-mock'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test -- --run src/features/tools/star_system_generator/components/__tests__/SystemViewer3DButton.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `SystemViewer3DButton.tsx`**

```tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Orbit } from 'lucide-react'
import type { GeneratedSystem } from '../types'

const SystemViewer3DModal = dynamic(() => import('../viewer3d'), {
  ssr: false,
  loading: () => (
    <div
      role="dialog"
      aria-label="3D system viewer loading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 text-[var(--text-secondary)]"
    >
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-6 py-4 text-sm">
        Loading 3D viewer…
      </div>
    </div>
  ),
})

export interface SystemViewer3DButtonProps {
  system: GeneratedSystem
  className?: string
}

export function SystemViewer3DButton({ system, className }: SystemViewer3DButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-md border border-[var(--accent)]/40 bg-[var(--accent-light)] px-3 py-1.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${className ?? ''}`}
        aria-label="Open 3D viewer"
      >
        <Orbit className="h-4 w-4" aria-hidden="true" />
        Open 3D viewer
      </button>
      {open ? <SystemViewer3DModal system={system} onClose={() => setOpen(false)} /> : null}
    </>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test -- --run src/features/tools/star_system_generator/components/__tests__/SystemViewer3DButton.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/components/SystemViewer3DButton.tsx \
        src/features/tools/star_system_generator/components/__tests__/SystemViewer3DButton.test.tsx
git commit -m "feat(star-gen): viewer3d entry button (lazy-loaded)"
```

---

### Task 12: `ViewerContext` + layer-visibility state

A small context that holds layer visibility, selection state, and reduced-motion. Used by chrome and scene alike.

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/chrome/ViewerContext.tsx`

- [ ] **Step 1: Write `ViewerContext.tsx`**

```tsx
'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { LayerVisibility } from '../types'
import { ALL_LAYERS_ON } from '../types'

export type SelectionKind = 'body' | 'moon' | 'settlement' | 'star' | 'hazard' | 'gu-bleed' | 'phenomenon' | null

export interface SelectionTarget {
  kind: NonNullable<SelectionKind>
  id: string
}

export interface ViewerContextValue {
  layers: LayerVisibility
  toggleLayer: (k: keyof LayerVisibility) => void
  selection: SelectionTarget | null
  select: (target: SelectionTarget | null) => void
  hovered: SelectionTarget | null
  hover: (target: SelectionTarget | null) => void
  prefersReducedMotion: boolean
}

const ViewerContext = createContext<ViewerContextValue | null>(null)

export function ViewerContextProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<LayerVisibility>(ALL_LAYERS_ON)
  const [selection, setSelection] = useState<SelectionTarget | null>(null)
  const [hovered, setHovered] = useState<SelectionTarget | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const value = useMemo<ViewerContextValue>(
    () => ({
      layers,
      toggleLayer: (k) => setLayers((prev) => ({ ...prev, [k]: !prev[k] })),
      selection,
      select: setSelection,
      hovered,
      hover: setHovered,
      prefersReducedMotion,
    }),
    [layers, selection, hovered, prefersReducedMotion],
  )

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>
}

export function useViewerContext(): ViewerContextValue {
  const ctx = useContext(ViewerContext)
  if (!ctx) throw new Error('useViewerContext used outside ViewerContextProvider')
  return ctx
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/chrome/ViewerContext.tsx
git commit -m "feat(star-gen): viewer3d context (layers + selection + reduced-motion)"
```

---

### Task 13: `LayerToggles` — three layer pills

**Files:**
- Test: `src/features/tools/star_system_generator/viewer3d/chrome/__tests__/LayerToggles.test.tsx`
- Create: `src/features/tools/star_system_generator/viewer3d/chrome/LayerToggles.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayerToggles } from '../LayerToggles'
import { ViewerContextProvider, useViewerContext } from '../ViewerContext'

function ProbeLayers() {
  const { layers } = useViewerContext()
  return <div data-testid="probe">{`${layers.physical}|${layers.gu}|${layers.human}`}</div>
}

function renderWithProvider() {
  return render(
    <ViewerContextProvider>
      <LayerToggles />
      <ProbeLayers />
    </ViewerContextProvider>,
  )
}

describe('LayerToggles', () => {
  it('renders three pills, all pressed by default', () => {
    renderWithProvider()
    expect(screen.getByRole('button', { name: /physical/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /gu/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /human/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('toggles a layer off when clicked', async () => {
    const user = userEvent.setup()
    renderWithProvider()
    await user.click(screen.getByRole('button', { name: /physical/i }))
    expect(screen.getByRole('button', { name: /physical/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('probe').textContent).toBe('false|true|true')
  })

  it('toggles all three independently', async () => {
    const user = userEvent.setup()
    renderWithProvider()
    await user.click(screen.getByRole('button', { name: /gu/i }))
    await user.click(screen.getByRole('button', { name: /human/i }))
    expect(screen.getByTestId('probe').textContent).toBe('true|false|false')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/chrome/__tests__/LayerToggles.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `LayerToggles.tsx`**

```tsx
'use client'

import type { LayerKey } from '../types'
import { useViewerContext } from './ViewerContext'

interface PillSpec {
  key: LayerKey
  label: string
  dotClass: string
  pressedClass: string
}

const PILLS: PillSpec[] = [
  { key: 'physical', label: 'Physical', dotClass: 'bg-[var(--accent)]',          pressedClass: 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]' },
  { key: 'gu',       label: 'GU',       dotClass: 'bg-[var(--accent-mystical)]', pressedClass: 'border-[var(--accent-mystical)] bg-[var(--accent-mystical-light)] text-[var(--accent-mystical)]' },
  { key: 'human',    label: 'Human',    dotClass: 'bg-[var(--accent-warm)]',     pressedClass: 'border-[var(--accent-warm)] bg-[var(--accent-warm-light)] text-[var(--accent-warm)]' },
]

export function LayerToggles() {
  const { layers, toggleLayer } = useViewerContext()
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Layer visibility">
      {PILLS.map((p) => {
        const pressed = layers[p.key]
        return (
          <button
            key={p.key}
            type="button"
            aria-pressed={pressed}
            onClick={() => toggleLayer(p.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              pressed ? p.pressedClass : 'border-[var(--border)] bg-transparent text-[var(--text-tertiary)]'
            }`}
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${p.dotClass}`} aria-hidden="true" />
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/chrome/__tests__/LayerToggles.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/chrome/LayerToggles.tsx \
        src/features/tools/star_system_generator/viewer3d/chrome/__tests__/LayerToggles.test.tsx
git commit -m "feat(star-gen): viewer3d layer toggle pills"
```

---

### Task 14: `ViewerModal` — portal, focus trap, esc/X close

**Files:**
- Test: `src/features/tools/star_system_generator/viewer3d/chrome/__tests__/ViewerModal.test.tsx`
- Create: `src/features/tools/star_system_generator/viewer3d/chrome/ViewerModal.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewerModal } from '../ViewerModal'

describe('ViewerModal', () => {
  it('renders into a portal with role=dialog and aria-modal', () => {
    render(<ViewerModal title="Test System" onClose={() => undefined}><p>body</p></ViewerModal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Test System')
  })

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ViewerModal title="X" onClose={onClose}><p>body</p></ViewerModal>)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ViewerModal title="X" onClose={onClose}><p>body</p></ViewerModal>)
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('locks page scroll while open and restores on unmount', () => {
    const original = document.body.style.overflow
    const { unmount } = render(<ViewerModal title="X" onClose={() => undefined}><p>body</p></ViewerModal>)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe(original)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/chrome/__tests__/ViewerModal.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `ViewerModal.tsx`**

```tsx
'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export interface ViewerModalProps {
  title: string
  onClose: () => void
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function ViewerModal({ title, onClose, header, footer, children }: ViewerModalProps) {
  const titleId = useId()
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !containerRef.current) return
      const focusables = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [onClose])

  useEffect(() => {
    const focusables = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
    focusables?.[0]?.focus()
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex flex-col bg-[#02040a]/95"
    >
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2">
        <h2 id={titleId} className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
        <div className="flex items-center gap-3">
          {header}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--card-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Close 3D viewer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="relative flex flex-1 overflow-hidden">{children}</div>
      {footer ? <footer className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-xs text-[var(--text-tertiary)]">{footer}</footer> : null}
    </div>,
    document.body,
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/chrome/__tests__/ViewerModal.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/chrome/ViewerModal.tsx \
        src/features/tools/star_system_generator/viewer3d/chrome/__tests__/ViewerModal.test.tsx
git commit -m "feat(star-gen): viewer3d modal shell (portal, focus trap, esc)"
```

---

### Task 15: `ViewerLegend` — bottom legend chips

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/chrome/ViewerLegend.tsx`

- [ ] **Step 1: Implement `ViewerLegend.tsx`**

```tsx
'use client'

interface LegendChipSpec {
  color: string
  label: string
}

const CHIPS: LegendChipSpec[] = [
  { color: 'bg-[var(--accent)]',          label: 'orbit / habitable / snow line' },
  { color: 'bg-[var(--accent-mystical)]', label: 'GU bleed' },
  { color: 'bg-[#ff5773]',                label: 'hazard zone' },
  { color: 'bg-[var(--accent-warm)]',     label: 'settlement' },
]

export interface ViewerLegendProps {
  scaleNote: string
  onFrame: () => void
}

export function ViewerLegend({ scaleNote, onFrame }: ViewerLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <ul className="flex flex-wrap items-center gap-3" aria-label="Legend">
        {CHIPS.map((chip) => (
          <li key={chip.label} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${chip.color}`} aria-hidden="true" />
            <span>{chip.label}</span>
          </li>
        ))}
      </ul>
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{scaleNote}</span>
      <button
        type="button"
        onClick={onFrame}
        className="ml-auto inline-flex items-center rounded border border-[var(--border)] bg-transparent px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] hover:bg-[var(--card-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        Frame system
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/chrome/ViewerLegend.tsx
git commit -m "feat(star-gen): viewer3d footer legend"
```

---

### Task 16: `DetailSidebar` shell — slot for selection-driven detail

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/chrome/DetailSidebar.tsx`

- [ ] **Step 1: Implement `DetailSidebar.tsx`**

```tsx
'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useViewerContext } from './ViewerContext'

export interface DetailSidebarProps {
  children: ReactNode
}

export function DetailSidebar({ children }: DetailSidebarProps) {
  const { selection, select } = useViewerContext()
  const open = selection !== null

  return (
    <aside
      role="region"
      aria-label="Body detail"
      aria-hidden={!open}
      className={`flex h-full shrink-0 flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--card)] transition-[width] duration-200 ease-out ${
        open ? 'w-[360px]' : 'w-0'
      }`}
    >
      {open ? (
        <>
          <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
              Detail
            </span>
            <button
              type="button"
              onClick={() => select(null)}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--card-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label="Close detail"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">{children}</div>
        </>
      ) : null}
    </aside>
  )
}
```

- [ ] **Step 2: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/chrome/DetailSidebar.tsx
git commit -m "feat(star-gen): viewer3d detail sidebar shell"
```

---

### Task 17: New compact detail cards (Star, Hazard, Phenomenon)

These are the only new detail components for the sidebar; bodies / settlements / GU reuse existing components.

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/chrome/StarDetailCard.tsx`
- Create: `src/features/tools/star_system_generator/viewer3d/chrome/HazardCard.tsx`
- Create: `src/features/tools/star_system_generator/viewer3d/chrome/PhenomenonCard.tsx`

- [ ] **Step 1: Implement `StarDetailCard.tsx`**

```tsx
'use client'

import type { GeneratedSystem } from '../../types'

export function StarDetailCard({ system }: { system: GeneratedSystem }) {
  const star = system.primary
  return (
    <article className="space-y-2 text-sm">
      <header>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{star.name.value}</h3>
        <p className="text-xs text-[var(--text-tertiary)]">Primary star</p>
      </header>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-[var(--text-tertiary)]">Spectral</dt><dd>{star.spectralType.value}</dd>
        <dt className="text-[var(--text-tertiary)]">Mass</dt><dd>{star.massSolar.value} M☉</dd>
        <dt className="text-[var(--text-tertiary)]">Luminosity</dt><dd>{star.luminositySolar.value} L☉</dd>
        <dt className="text-[var(--text-tertiary)]">Age</dt><dd>{star.ageState.value}</dd>
        <dt className="text-[var(--text-tertiary)]">Activity</dt><dd>{star.activity.value}</dd>
      </dl>
      {system.companions.length > 0 ? (
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Companions</p>
          <ul className="mt-1 space-y-1 text-xs">
            {system.companions.map((c) => (
              <li key={c.id} className="rounded border border-[var(--border)] bg-[var(--card-elevated)] px-2 py-1">
                {c.companionType.value} · {c.separation.value}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
```

- [ ] **Step 2: Implement `HazardCard.tsx`**

```tsx
'use client'

import type { HazardVisual } from '../types'

export function HazardCard({ hazard }: { hazard: HazardVisual }) {
  return (
    <article className="space-y-2 text-sm">
      <header>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Hazard</h3>
        <p className="text-xs text-[var(--text-tertiary)]">
          {hazard.unclassified ? 'unanchored' : hazard.anchorDescription}
        </p>
      </header>
      <p className="rounded border border-[#ff5773]/30 bg-[#ff5773]/5 px-2 py-1.5 text-xs text-[var(--text-primary)]">
        {hazard.sourceText}
      </p>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-[11px] text-[var(--text-secondary)]">
        <dt className="text-[var(--text-tertiary)]">Intensity</dt><dd>{Math.round(hazard.intensity * 100)} / 100</dd>
      </dl>
    </article>
  )
}
```

- [ ] **Step 3: Implement `PhenomenonCard.tsx`**

```tsx
'use client'

import type { GeneratedSystem } from '../../types'

export function PhenomenonCard({ phenomenonId, system }: { phenomenonId: string; system: GeneratedSystem }) {
  const phen = system.phenomena.find((p) => p.id === phenomenonId)
  if (!phen) return null
  return (
    <article className="space-y-2 text-sm">
      <header>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{phen.phenomenon.value}</h3>
        <p className="text-xs text-[var(--text-tertiary)]">System phenomenon</p>
      </header>
      <p className="text-xs text-[var(--text-secondary)]">{phen.note.value}</p>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-[11px] text-[var(--text-secondary)]">
        <dt className="text-[var(--text-tertiary)]">Travel effect</dt><dd>{phen.travelEffect.value}</dd>
        <dt className="text-[var(--text-tertiary)]">Conflict hook</dt><dd>{phen.conflictHook.value}</dd>
        <dt className="text-[var(--text-tertiary)]">Scene anchor</dt><dd>{phen.sceneAnchor.value}</dd>
      </dl>
    </article>
  )
}
```

- [ ] **Step 4: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/chrome/StarDetailCard.tsx \
        src/features/tools/star_system_generator/viewer3d/chrome/HazardCard.tsx \
        src/features/tools/star_system_generator/viewer3d/chrome/PhenomenonCard.tsx
git commit -m "feat(star-gen): viewer3d compact detail cards (star/hazard/phenomenon)"
```

---

### Task 18: Wire `viewer3d/index.tsx` to compose chrome around the canvas

This replaces the placeholder in Task 3 with the full modal that includes empty `<Scene/>` from Task 19's contract. We import `Scene` lazily here too so this file can compile without scene primitives yet (`Scene` will be a stub created in Task 19).

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/index.tsx`
- Create: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx` (stub — full impl in Task 19)

- [ ] **Step 1: Create `scene/Scene.tsx` stub**

```tsx
'use client'

import type { SystemSceneGraph } from '../types'

export interface SceneProps {
  graph: SystemSceneGraph
}

export function Scene(_props: SceneProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#02040a] text-[var(--text-tertiary)]">
      <span className="text-xs uppercase tracking-[0.1em]">Canvas placeholder — Task 19</span>
    </div>
  )
}
```

- [ ] **Step 2: Replace `viewer3d/index.tsx` with the composed modal**

```tsx
'use client'

import { useMemo } from 'react'
import type { GeneratedSystem } from '../types'
import { buildSceneGraph } from './lib/sceneGraph'
import { ViewerContextProvider } from './chrome/ViewerContext'
import { ViewerModal } from './chrome/ViewerModal'
import { LayerToggles } from './chrome/LayerToggles'
import { DetailSidebar } from './chrome/DetailSidebar'
import { ViewerLegend } from './chrome/ViewerLegend'
import { Scene } from './scene/Scene'
import { formatStellarClass } from '../lib/stellarLabels'

export interface SystemViewer3DModalProps {
  system: GeneratedSystem
  onClose: () => void
}

function makeScaleNote(system: GeneratedSystem): string {
  const orbits = system.bodies.map((b) => b.orbitAu.value)
  const inner = orbits.length ? Math.min(...orbits).toFixed(1) : '0'
  const outer = orbits.length ? Math.max(...orbits).toFixed(1) : '0'
  return `log scale · ${inner} — ${outer} AU`
}

export default function SystemViewer3DModal({ system, onClose }: SystemViewer3DModalProps) {
  const graph = useMemo(() => buildSceneGraph(system), [system])
  const title = `${system.name.value} · ${formatStellarClass(system.primary.spectralType.value)} · ${system.bodies.length} bodies`

  return (
    <ViewerContextProvider>
      <ViewerModal
        title={title}
        onClose={onClose}
        header={<LayerToggles />}
        footer={
          <ViewerLegend
            scaleNote={makeScaleNote(system)}
            onFrame={() => window.dispatchEvent(new CustomEvent('viewer3d:frame-system'))}
          />
        }
      >
        <div className="relative flex-1">
          <Scene graph={graph} />
        </div>
        <DetailSidebar>
          <SidebarContent system={system} graph={graph} />
        </DetailSidebar>
      </ViewerModal>
    </ViewerContextProvider>
  )
}

function SidebarContent({ system: _system, graph: _graph }: { system: GeneratedSystem; graph: ReturnType<typeof buildSceneGraph> }) {
  return (
    <p className="text-xs text-[var(--text-tertiary)]">
      Click a body, settlement, or hazard to see details. (Wiring lands in Task 30.)
    </p>
  )
}
```

- [ ] **Step 3: Wire `SystemViewer3DButton` into `index.tsx` page**

Modify `src/features/tools/star_system_generator/index.tsx` — add the button to the `SystemSummaryStrip` row. Locate the existing `<SystemSummaryStrip system={system} />` line and add a sibling button container above it:

```tsx
import { SystemViewer3DButton } from './components/SystemViewer3DButton'
```

Then, inside the `<main>` block, between `<section id="controls" ...>` and `<SystemSummaryStrip system={system} />`, insert:

```tsx
        <div className="flex justify-end">
          <SystemViewer3DButton system={system} />
        </div>
```

- [ ] **Step 4: Manually verify in dev server**

```bash
npm run dev
```

Open `http://localhost:3000/tools/star_system_generator/`. Click the "Open 3D viewer" button. Expected:
1. Modal opens after a brief loading flicker.
2. Header shows the system name + spectral class + body count.
3. Three layer toggle pills, all pressed.
4. Empty placeholder canvas in the middle showing "Canvas placeholder — Task 19".
5. Footer legend chips and "Frame system" button.
6. Esc and X both close the modal. Page scroll is locked while open.

- [ ] **Step 5: Verify all tests + lint**

```bash
npm run test
npm run lint
npm run typecheck
```

Expected: PASS for all.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/index.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx \
        src/features/tools/star_system_generator/index.tsx
git commit -m "feat(star-gen): wire viewer3d modal end-to-end (canvas placeholder)"
```

---

## Phase D — Scene primitives

Each task in this phase replaces or extends the placeholder `Scene.tsx`. r3f scene rendering is **not unit-tested** (per spec Section 10). Verification is via `npm run dev` and visual inspection.

---

### Task 19: `Scene.tsx` — Canvas root, lighting, OrbitControls

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`
- Create: `src/features/tools/star_system_generator/viewer3d/scene/CameraRig.tsx`

- [ ] **Step 1: Implement `CameraRig.tsx`**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'

export interface CameraRigProps {
  sceneRadius: number
}

export function CameraRig({ sceneRadius }: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, sceneRadius * 0.35, sceneRadius * 0.95)
    camera.lookAt(0, 0, 0)
  }, [camera, sceneRadius])

  useEffect(() => {
    function handle() {
      if (!controlsRef.current) return
      const start = camera.position.clone()
      const target = new THREE.Vector3(0, sceneRadius * 0.35, sceneRadius * 0.95)
      const startTime = performance.now()
      const duration = 600

      function step(t: number) {
        const k = Math.min(1, (t - startTime) / duration)
        const eased = 1 - Math.pow(1 - k, 3)
        camera.position.lerpVectors(start, target, eased)
        camera.lookAt(0, 0, 0)
        controlsRef.current?.update()
        if (k < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
    window.addEventListener('viewer3d:frame-system', handle)
    return () => window.removeEventListener('viewer3d:frame-system', handle)
  }, [camera, sceneRadius])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={sceneRadius * 0.2}
      maxDistance={sceneRadius * 2.5}
      makeDefault
    />
  )
}
```

- [ ] **Step 2: Implement `Scene.tsx`**

```tsx
'use client'

import { Canvas } from '@react-three/fiber'
import type { SystemSceneGraph } from '../types'
import { CameraRig } from './CameraRig'

export interface SceneProps {
  graph: SystemSceneGraph
}

export function Scene({ graph }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 45, near: 0.1, far: graph.sceneRadius * 6, position: [0, graph.sceneRadius * 0.35, graph.sceneRadius * 0.95] }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: 'radial-gradient(ellipse at center, #0a1424 0%, #02040a 75%)' }}
    >
      <ambientLight intensity={0.05} />
      <pointLight position={[0, 0, 0]} intensity={2.5} distance={graph.sceneRadius * 4} decay={0.6} />
      <CameraRig sceneRadius={graph.sceneRadius} />
    </Canvas>
  )
}
```

- [ ] **Step 3: Manually verify in dev server**

```bash
npm run dev
```

Click "Open 3D viewer". Expected: black-navy radial gradient fills the canvas area. No bodies yet. Drag to orbit (camera rotates around origin). Scroll to zoom. "Frame system" button returns the camera to default.

- [ ] **Step 4: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/CameraRig.tsx
git commit -m "feat(star-gen): viewer3d Canvas + camera rig + OrbitControls"
```

---

### Task 20: `Star.tsx` — primary star + corona rays + companions

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/Star.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`

- [ ] **Step 1: Implement `Star.tsx`**

```tsx
'use client'

import * as THREE from 'three'
import { useMemo } from 'react'
import type { StarVisual } from '../types'

export interface StarProps {
  star: StarVisual
}

export function Star({ star }: StarProps) {
  const coreSize = Math.max(8, star.coronaRadius * 0.35)
  const rays = useMemo(() => {
    const out: Array<[number, number]> = []
    for (let i = 0; i < star.rayCount; i++) {
      const angle = (i / star.rayCount) * Math.PI * 2
      out.push([Math.cos(angle), Math.sin(angle)])
    }
    return out
  }, [star.rayCount])

  return (
    <group position={star.position}>
      <mesh>
        <sphereGeometry args={[coreSize, 24, 24]} />
        <meshBasicMaterial color={new THREE.Color(star.coreColor)} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[star.coronaRadius, 24, 24]} />
        <meshBasicMaterial
          color={new THREE.Color(star.coronaColor)}
          transparent
          opacity={0.18 * star.bloomStrength}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {rays.map(([x, y], idx) => (
        <mesh key={idx} position={[x * star.coronaRadius * 1.05, 0, y * star.coronaRadius * 1.05]}>
          <sphereGeometry args={[1.5, 8, 8]} />
          <meshBasicMaterial color={new THREE.Color(star.coronaColor)} transparent opacity={0.45} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
```

- [ ] **Step 2: Modify `Scene.tsx` to render `<Star/>` for primary + companions**

Inside `Scene.tsx`, after the `<CameraRig sceneRadius={...}/>` element, append:

```tsx
      <Star star={graph.star} />
      {graph.companions.map((c) => (
        <Star key={c.id} star={c} />
      ))}
```

Add the import at the top:

```tsx
import { Star } from './Star'
```

- [ ] **Step 3: Manually verify in dev server**

```bash
npm run dev
```

Click "Open 3D viewer". Expected: a glowing star at the origin with corona rays around it, color matching the spectral class (G-type → yellow, M-type → orange-red, etc.). Companion stars (if present) appear at offset positions.

- [ ] **Step 4: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/Star.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx
git commit -m "feat(star-gen): viewer3d star + corona rays + companions"
```

---

### Task 21: `Orbit.tsx` + `Zones.tsx` — orbit lines + habitable / snow-line bands

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/Orbit.tsx`
- Create: `src/features/tools/star_system_generator/viewer3d/scene/Zones.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`

- [ ] **Step 1: Implement `Orbit.tsx`**

```tsx
'use client'

import * as THREE from 'three'
import { useMemo } from 'react'

export interface OrbitProps {
  radius: number
  tiltY?: number
  color: string
  opacity?: number
  dashed?: boolean
}

export function Orbit({ radius, tiltY = 0, color, opacity = 0.55, dashed = false }: OrbitProps) {
  const points = useMemo(() => {
    const out: THREE.Vector3[] = []
    const segments = 128
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      out.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
    }
    return out
  }, [radius])

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])
  const material = useMemo(() => {
    const mat = dashed
      ? new THREE.LineDashedMaterial({ color: new THREE.Color(color), dashSize: 1.2, gapSize: 1.5, transparent: true, opacity })
      : new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity })
    return mat
  }, [color, opacity, dashed])

  return (
    <group rotation={[tiltY, 0, 0]}>
      <primitive object={new THREE.Line(geometry, material)} onUpdate={(line: THREE.Line) => {
        if (dashed) line.computeLineDistances()
      }} />
    </group>
  )
}
```

- [ ] **Step 2: Implement `Zones.tsx`**

```tsx
'use client'

import * as THREE from 'three'
import { useMemo } from 'react'

export interface ZonesProps {
  habitableInner: number
  habitableOuter: number
  snowLine: number
}

export function Zones({ habitableInner, habitableOuter, snowLine }: ZonesProps) {
  const habitableMesh = useMemo(() => {
    const inner = habitableInner
    const outer = habitableOuter
    const geo = new THREE.RingGeometry(inner, outer, 64)
    geo.rotateX(-Math.PI / 2)
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#5fb6e8'),
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    return new THREE.Mesh(geo, mat)
  }, [habitableInner, habitableOuter])

  const snowLineRing = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = 192
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(a) * snowLine, 0, Math.sin(a) * snowLine))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineDashedMaterial({
      color: new THREE.Color('#5fb6e8'),
      dashSize: 0.8,
      gapSize: 2.4,
      transparent: true,
      opacity: 0.45,
    })
    const line = new THREE.Line(geo, mat)
    line.computeLineDistances()
    return line
  }, [snowLine])

  return (
    <>
      <primitive object={habitableMesh} />
      <primitive object={snowLineRing} />
    </>
  )
}
```

- [ ] **Step 3: Modify `Scene.tsx` to render orbits + zones**

After the companion `<Star/>` mapping, append:

```tsx
      <Zones
        habitableInner={graph.zones.habitableInner}
        habitableOuter={graph.zones.habitable * 1.4}
        snowLine={graph.zones.snowLine}
      />
      {graph.bodies.map((body) => (
        <Orbit key={`orbit-${body.id}`} radius={body.orbitRadius} tiltY={body.orbitTiltY} color="#5fb6e8" />
      ))}
```

Add imports:

```tsx
import { Orbit } from './Orbit'
import { Zones } from './Zones'
```

- [ ] **Step 4: Manually verify in dev server**

```bash
npm run dev
```

Click "Open 3D viewer". Expected: tilted orbit ellipses at each body's `orbitRadius`, a faint blue habitable zone band, and a dashed snow-line ring. The orbits should look like the mockup (subtle, blue, slightly tilted relative to each other).

- [ ] **Step 5: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/Orbit.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Zones.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx
git commit -m "feat(star-gen): viewer3d orbit lines + habitable/snow-line zones"
```

---

### Task 22: `Body.tsx` — bodies with placeholder material + ambient motion

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/Body.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`

- [ ] **Step 1: Implement `Body.tsx`**

```tsx
'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BodyVisual } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

export interface BodyProps {
  body: BodyVisual
}

export function Body({ body }: BodyProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const { prefersReducedMotion } = useViewerContext()
  const placeholderColor = useMemo(() => {
    return new THREE.Color(['gas-giant', 'ice-giant'].includes(body.shading) ? '#b08a52' : '#7e8a96')
  }, [body.shading])

  useFrame((_state, delta) => {
    if (!groupRef.current) return
    const speed = prefersReducedMotion ? 0 : body.angularSpeed
    groupRef.current.rotation.y -= speed * delta
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.3
  })

  return (
    <group ref={groupRef} rotation={[body.orbitTiltY, body.phase0, 0]}>
      <mesh ref={meshRef} position={[body.orbitRadius, 0, 0]}>
        <sphereGeometry args={[body.visualSize, 32, 32]} />
        <meshStandardMaterial color={placeholderColor} roughness={0.85} metalness={0.05} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Modify `Scene.tsx` to render bodies**

After the orbit-line mapping, append:

```tsx
      {graph.bodies.map((body) => (
        <Body key={`body-${body.id}`} body={body} />
      ))}
```

Add import:

```tsx
import { Body } from './Body'
```

- [ ] **Step 3: Manually verify**

Click "Open 3D viewer". Expected: bodies appear as small spheres on their orbit lines, slowly revolving around the star at their `angularSpeed`. Inner bodies move noticeably faster than outer ones. With `prefers-reduced-motion: reduce` set in OS settings, bodies are stationary.

- [ ] **Step 4: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/Body.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx
git commit -m "feat(star-gen): viewer3d bodies (placeholder material, ambient motion)"
```

---

### Task 23: `bodyShader.ts` + replace placeholder material in `Body.tsx`

A single shared `ShaderMaterial` synthesizes textured-looking spheres from per-body uniforms. No external textures; bundle stays lean.

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/bodyShader.ts`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Body.tsx`

- [ ] **Step 1: Implement `bodyShader.ts`**

```typescript
import * as THREE from 'three'
import type { BodyVisual } from '../types'

export const bodyVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPos;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPos = position;
  gl_Position = projectionMatrix * mv;
}
`

export const bodyFragment = /* glsl */ `
uniform vec3 uBaseColor;
uniform float uNoiseScale;
uniform float uAtmosphere;
uniform float uHeatTint;
uniform float uBandStrength;
uniform float uGuAccent;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPos;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 p = normalize(vPos) * uNoiseScale;
  float n = fbm(p);

  float bands = sin(vPos.y * 4.0 + n * 2.0);
  float bandFactor = mix(1.0, 0.7 + 0.3 * bands, uBandStrength);

  vec3 base = uBaseColor;
  base = mix(base * 0.6, base * 1.3, n);
  base *= bandFactor;
  base = mix(base, vec3(1.0, 0.55, 0.3), uHeatTint * 0.4);

  float light = clamp(dot(vNormal, normalize(vec3(0.6, 0.4, 0.5))), 0.0, 1.0);
  vec3 lit = base * (0.25 + 0.85 * light);

  float fresnel = pow(1.0 - clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.0);
  vec3 atmo = mix(vec3(0.6, 0.8, 1.0), vec3(0.6, 0.4, 1.0), uGuAccent);
  lit = mix(lit, lit + atmo, fresnel * uAtmosphere * 0.6);

  if (uGuAccent > 0.5) {
    lit = mix(lit, lit + vec3(0.4, 0.2, 0.7), fresnel * 0.6);
  }

  gl_FragColor = vec4(lit, 1.0);
}
`

export function makeBodyMaterial(body: BodyVisual): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: bodyVertex,
    fragmentShader: bodyFragment,
    uniforms: {
      uBaseColor: { value: new THREE.Color() },
      uNoiseScale: { value: 0 },
      uAtmosphere: { value: 0 },
      uHeatTint: { value: 0 },
      uBandStrength: { value: 0 },
      uGuAccent: { value: body.guAccent ? 1 : 0 },
      uTime: { value: 0 },
    },
  })
}
```

- [ ] **Step 2: Modify `Body.tsx` to use the shader**

Replace the `placeholderColor` memoization and the `<meshStandardMaterial>` element with:

```tsx
import { makeBodyMaterial } from './bodyShader'
import { shaderUniforms } from '../lib/bodyShading'
import { useGeneratedBodyLookup } from './bodyLookup'  // see Step 3

// inside the component:
const lookup = useGeneratedBodyLookup()
const orbitingBody = lookup(body.id)
const material = useMemo(() => {
  const mat = makeBodyMaterial(body)
  if (orbitingBody) {
    const u = shaderUniforms(orbitingBody)
    mat.uniforms.uBaseColor.value.set(u.baseColor)
    mat.uniforms.uNoiseScale.value = u.noiseScale
    mat.uniforms.uAtmosphere.value = u.atmosphereStrength
    mat.uniforms.uHeatTint.value = u.heatTint
    mat.uniforms.uBandStrength.value = u.bandStrength
  }
  return mat
}, [body, orbitingBody])

// in JSX, replace meshStandardMaterial with:
<primitive object={material} attach="material" />
```

- [ ] **Step 3: Create a body lookup hook so `Body.tsx` can read shader uniforms from the source `OrbitingBody`**

Create `src/features/tools/star_system_generator/viewer3d/scene/bodyLookup.tsx`:

```tsx
'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { GeneratedSystem, OrbitingBody } from '../../types'

const Ctx = createContext<((id: string) => OrbitingBody | undefined) | null>(null)

export function BodyLookupProvider({ system, children }: { system: GeneratedSystem; children: ReactNode }) {
  const lookup = (id: string) => system.bodies.find((b) => b.id === id)
  return <Ctx.Provider value={lookup}>{children}</Ctx.Provider>
}

export function useGeneratedBodyLookup(): (id: string) => OrbitingBody | undefined {
  const lookup = useContext(Ctx)
  if (!lookup) throw new Error('useGeneratedBodyLookup outside BodyLookupProvider')
  return lookup
}
```

Modify `viewer3d/index.tsx` — wrap the `<Scene/>` and `<DetailSidebar/>` in `<BodyLookupProvider system={system}>`. Add the import:

```tsx
import { BodyLookupProvider } from './scene/bodyLookup'
```

Wrap accordingly:

```tsx
<BodyLookupProvider system={system}>
  <div className="relative flex-1">
    <Scene graph={graph} />
  </div>
  <DetailSidebar>...</DetailSidebar>
</BodyLookupProvider>
```

- [ ] **Step 4: Manually verify**

Click "Open 3D viewer". Expected: bodies now look textured — gas giants have horizontal banding, ice giants are pale blue with subtle bands, earthlike bodies are blue with terminator shading, dwarfs are mottled grey, anomalies are dark with a violet rim. GU-fractured bodies have a purple fresnel glow.

- [ ] **Step 5: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/bodyShader.ts \
        src/features/tools/star_system_generator/viewer3d/scene/Body.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/bodyLookup.tsx \
        src/features/tools/star_system_generator/viewer3d/index.tsx
git commit -m "feat(star-gen): viewer3d body shader (procedural textured spheres)"
```

---

### Task 24: `Belt.tsx` — instanced asteroid particle scatter

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/Belt.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`

- [ ] **Step 1: Implement `Belt.tsx`**

```tsx
'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BeltVisual } from '../types'
import { hashToUnit } from '../lib/motion'
import { useViewerContext } from '../chrome/ViewerContext'

export interface BeltProps {
  belt: BeltVisual
}

export function Belt({ belt }: BeltProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const { prefersReducedMotion } = useViewerContext()

  const instancedMesh = useMemo(() => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1
    const count = Math.round(belt.particleCount * (dpr < 1.5 ? 0.5 : 1))
    const geo = new THREE.TetrahedronGeometry(0.45, 0)
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(belt.color), roughness: 1, metalness: 0 })
    const mesh = new THREE.InstancedMesh(geo, mat, count)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const a = (i / count + hashToUnit(`${belt.id}#${i}`) * 0.5) * Math.PI * 2
      const r = belt.innerRadius + (belt.outerRadius - belt.innerRadius) * hashToUnit(`r#${belt.id}#${i}`)
      const jitterY = (hashToUnit(`y#${belt.id}#${i}`) - 0.5) * belt.jitter
      dummy.position.set(Math.cos(a) * r, jitterY, Math.sin(a) * r)
      dummy.rotation.set(hashToUnit(`rx#${belt.id}#${i}`) * Math.PI, hashToUnit(`ry#${belt.id}#${i}`) * Math.PI, 0)
      const scale = 0.6 + hashToUnit(`s#${belt.id}#${i}`) * 0.8
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    return mesh
  }, [belt])

  useFrame((_state, delta) => {
    if (!groupRef.current) return
    if (!prefersReducedMotion) {
      groupRef.current.rotation.y -= delta * 0.02
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={instancedMesh} />
    </group>
  )
}
```

- [ ] **Step 2: Render belts in `Scene.tsx`**

After the body mapping, append:

```tsx
      {graph.belts.map((b) => (
        <Belt key={`belt-${b.id}`} belt={b} />
      ))}
```

Add import:

```tsx
import { Belt } from './Belt'
```

- [ ] **Step 3: Manually verify**

If the generated system contains a belt-category body, expect a ring of small grey-tan tetrahedral particles at the belt's orbit, drifting very slowly. On a low-DPR or mobile profile, particle count is roughly halved.

- [ ] **Step 4: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/Belt.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx
git commit -m "feat(star-gen): viewer3d instanced asteroid belt"
```

---

### Task 25: Rings + moons on `Body.tsx`

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Body.tsx`
- Create: `src/features/tools/star_system_generator/viewer3d/scene/Ring.tsx`
- Create: `src/features/tools/star_system_generator/viewer3d/scene/Moon.tsx`

- [ ] **Step 1: Implement `Ring.tsx`**

```tsx
'use client'

import * as THREE from 'three'
import { useMemo } from 'react'
import type { RingVisual } from '../types'

export function Ring({ ring }: { ring: RingVisual }) {
  const mesh = useMemo(() => {
    const geo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 64, 1)
    const colors: number[] = []
    const pos = geo.attributes.position
    const baseColor = new THREE.Color(ring.color)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i)
      const r = Math.sqrt(x * x + y * y)
      const t = (r - ring.innerRadius) / (ring.outerRadius - ring.innerRadius)
      const banded = 0.6 + 0.4 * Math.sin(t * Math.PI * ring.bandCount * 2)
      colors.push(baseColor.r * banded, baseColor.g * banded, baseColor.b * banded)
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const m = new THREE.Mesh(geo, mat)
    m.rotation.x = Math.PI / 2 + ring.tilt
    return m
  }, [ring])

  return <primitive object={mesh} />
}
```

- [ ] **Step 2: Implement `Moon.tsx`**

```tsx
'use client'

import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MoonVisual } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

export function Moon({ moon }: { moon: MoonVisual }) {
  const groupRef = useRef<THREE.Group | null>(null)
  const { prefersReducedMotion } = useViewerContext()

  useFrame((_state, delta) => {
    if (!groupRef.current) return
    if (!prefersReducedMotion) {
      groupRef.current.rotation.y -= moon.angularSpeed * delta
    }
  })

  return (
    <group ref={groupRef} rotation={[0, moon.phase0, 0]}>
      <mesh position={[moon.parentRelativeOrbit, 0, 0]}>
        <sphereGeometry args={[moon.visualSize, 16, 16]} />
        <meshStandardMaterial color={new THREE.Color('#8a8a82')} roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 3: Modify `Body.tsx` to render rings and moons as children of the body mesh**

Inside the `<mesh ref={meshRef} position={[body.orbitRadius, 0, 0]}>` block, after the `<primitive object={material} attach="material" />`, add a child group rendering ring + moons:

```tsx
        {body.rings ? <Ring ring={body.rings} /> : null}
        {body.moons.map((moon) => (
          <Moon key={moon.id} moon={moon} />
        ))}
```

Add imports:

```tsx
import { Ring } from './Ring'
import { Moon } from './Moon'
```

- [ ] **Step 4: Manually verify**

Click "Open 3D viewer". Expected: gas giants (and any body with `rings` set) show a tilted procedural ring with subtle banding. Bodies that have moons display them orbiting the parent at small radius, moving faster than the parent's orbital motion.

- [ ] **Step 5: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/Ring.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Moon.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Body.tsx
git commit -m "feat(star-gen): viewer3d planetary rings + moons"
```

---

### Task 26: `HazardVolume.tsx` + `GuBleedVolume.tsx` — volumetric overlays

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/HazardVolume.tsx`
- Create: `src/features/tools/star_system_generator/viewer3d/scene/GuBleedVolume.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`

- [ ] **Step 1: Implement `HazardVolume.tsx`**

```tsx
'use client'

import * as THREE from 'three'
import { useMemo } from 'react'
import type { HazardVisual } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying float vDist;
void main() {
  float falloff = pow(clamp(1.0 - vDist, 0.0, 1.0), 2.0);
  gl_FragColor = vec4(uColor, falloff * 0.55 * uIntensity);
}
`

const VERTEX = /* glsl */ `
varying float vDist;
void main() {
  vDist = length(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export function HazardVolume({ hazard }: { hazard: HazardVisual }) {
  const { layers } = useViewerContext()
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uColor: { value: new THREE.Color('#ff5773') },
      uIntensity: { value: hazard.intensity },
    },
    transparent: true,
    depthWrite: false,
  }), [hazard.intensity])

  if (hazard.unclassified || !layers.physical) return null

  return (
    <mesh position={hazard.center} scale={hazard.radius}>
      <sphereGeometry args={[1, 24, 24]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
```

- [ ] **Step 2: Implement `GuBleedVolume.tsx`**

```tsx
'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { GuBleedVisual } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uPulse;
varying float vDist;
void main() {
  float falloff = pow(clamp(1.0 - vDist, 0.0, 1.0), 2.0);
  float pulse = 0.85 + 0.15 * uPulse;
  gl_FragColor = vec4(uColor, falloff * 0.5 * uIntensity * pulse);
}
`

const VERTEX = /* glsl */ `
varying float vDist;
void main() {
  vDist = length(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export function GuBleedVolume({ bleed }: { bleed: GuBleedVisual }) {
  const { layers, prefersReducedMotion } = useViewerContext()
  const matRef = useRef<THREE.ShaderMaterial | null>(null)
  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uColor: { value: new THREE.Color('#a880ff') },
        uIntensity: { value: bleed.intensity },
        uPulse: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
    })
    matRef.current = mat
    return mat
  }, [bleed.intensity])

  useFrame((state) => {
    if (!matRef.current) return
    const t = state.clock.elapsedTime
    const pulse = prefersReducedMotion ? 1 : Math.sin((t / bleed.pulsePeriodSec) * Math.PI * 2 + bleed.pulsePhase)
    matRef.current.uniforms.uPulse.value = pulse
  })

  if (bleed.unclassified || !layers.gu) return null

  return (
    <mesh position={bleed.center} scale={bleed.radius}>
      <sphereGeometry args={[1, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
```

- [ ] **Step 3: Render in `Scene.tsx`**

After the belts, append:

```tsx
      {graph.hazards.map((h) => (
        <HazardVolume key={`hz-${h.id}`} hazard={h} />
      ))}
      {graph.guBleeds.map((g) => (
        <GuBleedVolume key={`gu-${g.id}`} bleed={g} />
      ))}
```

Add imports:

```tsx
import { HazardVolume } from './HazardVolume'
import { GuBleedVolume } from './GuBleedVolume'
```

- [ ] **Step 4: Manually verify**

Click "Open 3D viewer". Expected: red translucent volumetric hazes near gas giants (or wherever the classifier anchors), purple translucent volumetric haze for the GU bleed, gently pulsing (period ~6s). Toggle the GU layer pill — bleed disappears. Toggle Physical — hazards disappear. Test `prefers-reduced-motion`: pulse stops.

- [ ] **Step 5: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/HazardVolume.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/GuBleedVolume.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx
git commit -m "feat(star-gen): viewer3d hazard + GU bleed volumetric overlays"
```

---

### Task 27: `SettlementPin.tsx`, `RuinPin.tsx`, `PhenomenonGlyph.tsx`

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/SettlementPin.tsx`
- Create: `src/features/tools/star_system_generator/viewer3d/scene/RuinPin.tsx`
- Create: `src/features/tools/star_system_generator/viewer3d/scene/PhenomenonGlyph.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Body.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`

- [ ] **Step 1: Implement `SettlementPin.tsx`**

```tsx
'use client'

import * as THREE from 'three'
import { useViewerContext } from '../chrome/ViewerContext'

export function SettlementPin({ size }: { size: number }) {
  const { layers } = useViewerContext()
  if (!layers.human) return null
  return (
    <group position={[0, size * 1.6, 0]}>
      <mesh>
        <sphereGeometry args={[size * 0.18, 8, 8]} />
        <meshBasicMaterial color={new THREE.Color('#ff9d4a')} toneMapped={false} />
      </mesh>
      <mesh position={[0, -size * 0.4, 0]}>
        <cylinderGeometry args={[size * 0.03, size * 0.03, size * 0.8, 6]} />
        <meshBasicMaterial color={new THREE.Color('#ff9d4a')} toneMapped={false} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Implement `RuinPin.tsx`**

```tsx
'use client'

import * as THREE from 'three'
import type { RuinMarker } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

export function RuinPin({ ruin }: { ruin: RuinMarker }) {
  const { layers } = useViewerContext()
  if (!layers.human) return null
  return (
    <mesh position={ruin.position}>
      <octahedronGeometry args={[1.4, 0]} />
      <meshBasicMaterial color={new THREE.Color('#7e8a96')} transparent opacity={0.7} toneMapped={false} />
    </mesh>
  )
}
```

- [ ] **Step 3: Implement `PhenomenonGlyph.tsx`**

```tsx
'use client'

import * as THREE from 'three'
import type { PhenomenonMarker } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

export function PhenomenonGlyph({ phenomenon }: { phenomenon: PhenomenonMarker }) {
  const { layers } = useViewerContext()
  if (!layers.gu) return null
  return (
    <mesh position={phenomenon.position}>
      <icosahedronGeometry args={[1.6, 0]} />
      <meshBasicMaterial color={new THREE.Color('#a880ff')} transparent opacity={0.8} toneMapped={false} />
    </mesh>
  )
}
```

- [ ] **Step 4: Mount `SettlementPin` inside `Body.tsx`**

Inside the body mesh JSX, append after `<Moon/>` mapping:

```tsx
        {body.hasSettlements ? <SettlementPin size={body.visualSize} /> : null}
```

Add import:

```tsx
import { SettlementPin } from './SettlementPin'
```

- [ ] **Step 5: Render `RuinPin` and `PhenomenonGlyph` in `Scene.tsx`**

After the GU bleed mapping, append:

```tsx
      {graph.ruins.filter((r) => !r.attachedBodyId).map((r) => (
        <RuinPin key={`ruin-${r.id}`} ruin={r} />
      ))}
      {graph.phenomena.map((p) => (
        <PhenomenonGlyph key={`phen-${p.id}`} phenomenon={p} />
      ))}
```

Add imports:

```tsx
import { RuinPin } from './RuinPin'
import { PhenomenonGlyph } from './PhenomenonGlyph'
```

- [ ] **Step 6: Manually verify**

Bodies with settlements show a small warm-orange pin floating above them. Standalone ruins (those not attached to a body) appear as dim grey octahedra in the outer system. Phenomena appear as small purple icosahedra. Toggle the Human layer — pins and ruins disappear. Toggle the GU layer — phenomena disappear.

- [ ] **Step 7: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/SettlementPin.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/RuinPin.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/PhenomenonGlyph.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Body.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx
git commit -m "feat(star-gen): viewer3d settlement/ruin pins + phenomenon glyphs"
```

---

## Phase E — Interactivity

After Phase D the scene is fully painted. Phase E makes it click-able and hover-able.

---

### Task 28: Hover state on bodies, settlements, hazards, GU, phenomena

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Body.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/HazardVolume.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/GuBleedVolume.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/PhenomenonGlyph.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/SettlementPin.tsx`

For each scene primitive that should be hover-targetable, add r3f pointer handlers that update `hover` in the viewer context. Each handler also toggles `document.body.style.cursor`.

- [ ] **Step 1: Modify `Body.tsx` — wrap the body mesh with hover/click handlers**

Inside the `<mesh ref={meshRef} ...>` block, add:

```tsx
const { hover, select } = useViewerContext()

// then on the mesh:
onPointerOver={(e) => { e.stopPropagation(); hover({ kind: 'body', id: body.id }); document.body.style.cursor = 'pointer' }}
onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
onClick={(e) => { e.stopPropagation(); select({ kind: 'body', id: body.id }) }}
```

- [ ] **Step 2: Modify `HazardVolume.tsx` similarly**

Same pattern, with `kind: 'hazard'` and `id: hazard.id`. Use a slightly larger invisible bounding sphere if the volume opacity makes hover hits unreliable.

- [ ] **Step 3: Modify `GuBleedVolume.tsx`** — `kind: 'gu-bleed'`, `id: bleed.id`.

- [ ] **Step 4: Modify `PhenomenonGlyph.tsx`** — `kind: 'phenomenon'`, `id: phenomenon.id`.

- [ ] **Step 5: Modify `SettlementPin.tsx`**

Settlement pins need access to settlement IDs from the parent body. Change `SettlementPin` to accept `settlementIds`:

```tsx
'use client'

import * as THREE from 'three'
import { useViewerContext } from '../chrome/ViewerContext'

export interface SettlementPinProps {
  size: number
  settlementIds: string[]
}

export function SettlementPin({ size, settlementIds }: SettlementPinProps) {
  const { layers, hover, select } = useViewerContext()
  if (!layers.human) return null
  const primary = settlementIds[0]
  return (
    <group
      position={[0, size * 1.6, 0]}
      onPointerOver={(e) => { e.stopPropagation(); if (primary) hover({ kind: 'settlement', id: primary }); document.body.style.cursor = 'pointer' }}
      onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
      onClick={(e) => { e.stopPropagation(); if (primary) select({ kind: 'settlement', id: primary }) }}
    >
      <mesh>
        <sphereGeometry args={[size * 0.18, 8, 8]} />
        <meshBasicMaterial color={new THREE.Color('#ff9d4a')} toneMapped={false} />
      </mesh>
      <mesh position={[0, -size * 0.4, 0]}>
        <cylinderGeometry args={[size * 0.03, size * 0.03, size * 0.8, 6]} />
        <meshBasicMaterial color={new THREE.Color('#ff9d4a')} toneMapped={false} />
      </mesh>
    </group>
  )
}
```

In `Body.tsx`, pass the settlement IDs:

```tsx
{body.hasSettlements ? <SettlementPin size={body.visualSize} settlementIds={body.settlementIds} /> : null}
```

- [ ] **Step 6: Manually verify**

Hovering bodies / settlements / hazards / GU / phenomena changes the cursor to pointer. Hover state updates in the context (visible in the next task's tooltip).

- [ ] **Step 7: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene
git commit -m "feat(star-gen): viewer3d hover/click handlers on scene primitives"
```

---

### Task 29: `HoverTooltip.tsx` — billboarded tooltip via drei `Html`

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/HoverTooltip.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`

- [ ] **Step 1: Implement `HoverTooltip.tsx`**

```tsx
'use client'

import { Html } from '@react-three/drei'
import type { GeneratedSystem } from '../../types'
import type { SystemSceneGraph } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

interface TooltipPosition {
  position: [number, number, number]
  title: string
  subtitle: string
}

function resolveTooltip(
  hovered: ReturnType<typeof useViewerContext>['hovered'],
  graph: SystemSceneGraph,
  system: GeneratedSystem,
): TooltipPosition | null {
  if (!hovered) return null
  switch (hovered.kind) {
    case 'body': {
      const body = graph.bodies.find((b) => b.id === hovered.id)
      const source = system.bodies.find((b) => b.id === hovered.id)
      if (!body || !source) return null
      return {
        position: [body.orbitRadius * Math.cos(body.phase0), body.visualSize * 1.8, body.orbitRadius * Math.sin(body.phase0)],
        title: source.name.value,
        subtitle: `${source.category.value} · ${source.thermalZone.value}`,
      }
    }
    case 'settlement': {
      const settlement = system.settlements.find((s) => s.id === hovered.id)
      if (!settlement) return null
      return {
        position: [0, 5, 0],
        title: settlement.name.value,
        subtitle: settlement.siteCategory.value,
      }
    }
    case 'hazard': {
      const hazard = graph.hazards.find((h) => h.id === hovered.id)
      if (!hazard) return null
      return {
        position: hazard.center,
        title: 'Hazard',
        subtitle: hazard.sourceText.slice(0, 48),
      }
    }
    case 'gu-bleed': {
      const bleed = graph.guBleeds.find((g) => g.id === hovered.id)
      if (!bleed) return null
      return {
        position: bleed.center,
        title: 'GU bleed',
        subtitle: system.guOverlay.intensity.value,
      }
    }
    case 'phenomenon': {
      const phen = system.phenomena.find((p) => p.id === hovered.id)
      if (!phen) return null
      const marker = graph.phenomena.find((p) => p.id === hovered.id)
      if (!marker) return null
      return { position: marker.position, title: phen.phenomenon.value, subtitle: 'system phenomenon' }
    }
    default:
      return null
  }
}

export function HoverTooltip({ graph, system }: { graph: SystemSceneGraph; system: GeneratedSystem }) {
  const { hovered } = useViewerContext()
  const tip = resolveTooltip(hovered, graph, system)
  if (!tip) return null
  return (
    <Html position={tip.position} center distanceFactor={120} pointerEvents="none">
      <div className="pointer-events-none whitespace-nowrap rounded-md border border-[var(--accent)]/30 bg-[#0f141c]/95 px-2 py-1 text-[11px] text-[var(--text-primary)] shadow-lg">
        <div className="font-semibold">{tip.title}</div>
        <div className="text-[10px] text-[var(--text-tertiary)]">{tip.subtitle}</div>
      </div>
    </Html>
  )
}
```

- [ ] **Step 2: Modify `Scene.tsx` to render the tooltip**

Pass `system` into `Scene.tsx`. Update the prop type:

```tsx
import type { GeneratedSystem } from '../../types'
import { HoverTooltip } from './HoverTooltip'

export interface SceneProps {
  graph: SystemSceneGraph
  system: GeneratedSystem
}

// at end of <Canvas>:
<HoverTooltip graph={graph} system={system} />
```

In `viewer3d/index.tsx`, pass `system` into `<Scene/>`:

```tsx
<Scene graph={graph} system={system} />
```

- [ ] **Step 3: Manually verify**

Hover any clickable object — small dark tooltip appears above it with name + subtitle. Tooltip never blocks clicks (`pointer-events: none`).

- [ ] **Step 4: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/HoverTooltip.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx \
        src/features/tools/star_system_generator/viewer3d/index.tsx
git commit -m "feat(star-gen): viewer3d hover tooltip"
```

---

### Task 30: Wire `DetailSidebar` contents to `selection`

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/index.tsx`

- [ ] **Step 1: Replace the placeholder `SidebarContent` with selection-driven content**

Replace the `SidebarContent` function with:

```tsx
import { BodyDetailContent } from '../components/BodyDetailPanel'
import { SettlementCard } from '../components/SettlementCard'
import { GuOverlayPanel } from '../components/GuOverlayPanel'
import { StarDetailCard } from './chrome/StarDetailCard'
import { HazardCard } from './chrome/HazardCard'
import { PhenomenonCard } from './chrome/PhenomenonCard'
import { useViewerContext } from './chrome/ViewerContext'

function SidebarContent({ system, graph }: { system: GeneratedSystem; graph: ReturnType<typeof buildSceneGraph> }) {
  const { selection } = useViewerContext()
  if (!selection) {
    return <p className="text-xs text-[var(--text-tertiary)]">Click a body, settlement, or hazard to see details.</p>
  }
  switch (selection.kind) {
    case 'body': {
      const body = system.bodies.find((b) => b.id === selection.id)
      if (!body) return null
      return <BodyDetailContent body={body} system={system} compact />
    }
    case 'moon': {
      const parent = system.bodies.find((b) => b.moons.some((m) => m.id === selection.id))
      if (!parent) return null
      return <BodyDetailContent body={parent} system={system} compact />
    }
    case 'settlement': {
      const s = system.settlements.find((x) => x.id === selection.id)
      return s ? <SettlementCard settlement={s} /> : null
    }
    case 'star': {
      return <StarDetailCard system={system} />
    }
    case 'hazard': {
      const h = graph.hazards.find((x) => x.id === selection.id)
      return h ? <HazardCard hazard={h} /> : null
    }
    case 'gu-bleed': {
      return <GuOverlayPanel system={system} compact />
    }
    case 'phenomenon': {
      return <PhenomenonCard phenomenonId={selection.id} system={system} />
    }
    default:
      return null
  }
}
```

- [ ] **Step 2: The `Scene.tsx` lacks a click on the star — add a clickable invisible sphere**

In `Scene.tsx`, after `<Star star={graph.star} />`, add:

```tsx
      <mesh
        position={graph.star.position}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = '' }}
        onClick={() => { /* selection handled below via context */ }}
      >
        <sphereGeometry args={[graph.star.coronaRadius * 0.6, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>
```

To wire selection to the star, pull context inside `Scene.tsx`:

```tsx
import { useViewerContext } from '../chrome/ViewerContext'

// inside Scene():
const { select, hover } = useViewerContext()

// replace the click handler on the star wrapper above:
onPointerOver={() => { hover({ kind: 'star', id: graph.star.id }); document.body.style.cursor = 'pointer' }}
onPointerOut={() => { hover(null); document.body.style.cursor = '' }}
onClick={() => select({ kind: 'star', id: graph.star.id })}
```

- [ ] **Step 3: Manually verify**

Click any body, settlement, hazard, GU bleed, phenomenon, or star. The right sidebar opens with the matching detail. Click the X on the sidebar — sidebar closes. Click a different object — sidebar contents swap.

- [ ] **Step 4: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/index.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx
git commit -m "feat(star-gen): viewer3d sidebar wired to selection (incl. star click)"
```

---

### Task 31: Camera fly-to on body click

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/CameraRig.tsx`

- [ ] **Step 1: Subscribe `CameraRig` to selection changes and tween the camera**

Add to `CameraRig.tsx`, importing the viewer context:

```tsx
import { useViewerContext } from '../chrome/ViewerContext'

// inside the component, alongside the existing useEffect blocks:
const { selection } = useViewerContext()

useEffect(() => {
  if (!selection || selection.kind !== 'body') return
  // selection points at a body. We can't read graph here, so we re-derive position approximately.
  // Read the body's group transform from the scene by name. To do this, set userData on Body groups (next step).
  const target = (window as Window & { __viewer3dBodyPositions?: Record<string, [number, number, number]> }).__viewer3dBodyPositions?.[selection.id]
  if (!target) return
  const start = camera.position.clone()
  const desired = new THREE.Vector3(target[0] * 1.6, sceneRadius * 0.18, target[2] * 1.6)
  const startTime = performance.now()
  const duration = 800

  function step(t: number) {
    const k = Math.min(1, (t - startTime) / duration)
    const eased = 1 - Math.pow(1 - k, 3)
    camera.position.lerpVectors(start, desired, eased)
    camera.lookAt(target[0], 0, target[2])
    controlsRef.current?.update()
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}, [selection, camera, sceneRadius])
```

- [ ] **Step 2: Modify `Body.tsx` to publish current world position to `window.__viewer3dBodyPositions`**

Inside `Body.tsx`, in the `useFrame` callback, after applying motion:

```tsx
import { Vector3 } from 'three'

// inside the component:
const worldPos = useMemo(() => new Vector3(), [])

useFrame((_state, delta) => {
  if (!groupRef.current) return
  const speed = prefersReducedMotion ? 0 : body.angularSpeed
  groupRef.current.rotation.y -= speed * delta
  if (meshRef.current) {
    meshRef.current.rotation.y += delta * 0.3
    meshRef.current.getWorldPosition(worldPos)
    const dict = (window as Window & { __viewer3dBodyPositions?: Record<string, [number, number, number]> })
    if (!dict.__viewer3dBodyPositions) dict.__viewer3dBodyPositions = {}
    dict.__viewer3dBodyPositions[body.id] = [worldPos.x, worldPos.y, worldPos.z]
  }
})
```

- [ ] **Step 3: Manually verify**

Click a body — camera smoothly tweens (~800ms) to a position framed on that body. Drag during tween cancels (camera resumes from current position; no fight with damping).

- [ ] **Step 4: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/CameraRig.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Body.tsx
git commit -m "feat(star-gen): viewer3d camera fly-to on body click"
```

---

### Task 32: Keyboard shortcuts (1/2/3 layers, arrow keys, Esc)

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/chrome/ViewerModal.tsx`

- [ ] **Step 1: Add layer-toggle key handlers in `ViewerModal.tsx`**

Inside the existing `useEffect` keydown handler (the focus-trap one), before the Tab handling, add:

```tsx
      if (e.key === '1') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('viewer3d:toggle-layer', { detail: { layer: 'physical' } }))
        return
      }
      if (e.key === '2') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('viewer3d:toggle-layer', { detail: { layer: 'gu' } }))
        return
      }
      if (e.key === '3') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('viewer3d:toggle-layer', { detail: { layer: 'human' } }))
        return
      }
```

- [ ] **Step 2: Subscribe `ViewerContext` to that event**

In `ViewerContext.tsx`, add an effect:

```tsx
useEffect(() => {
  function handler(e: Event) {
    const layer = (e as CustomEvent<{ layer: keyof LayerVisibility }>).detail.layer
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))
  }
  window.addEventListener('viewer3d:toggle-layer', handler)
  return () => window.removeEventListener('viewer3d:toggle-layer', handler)
}, [])
```

- [ ] **Step 3: Manually verify**

With the modal open, pressing `1`, `2`, `3` toggles Physical / GU / Human layers respectively. Esc still closes the sidebar (if open) or the modal. Tab cycles through focusable elements without escaping the modal.

- [ ] **Step 4: Verify lint + typecheck + tests**

```bash
npm run lint
npm run typecheck
npm run test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/chrome/ViewerModal.tsx \
        src/features/tools/star_system_generator/viewer3d/chrome/ViewerContext.tsx
git commit -m "feat(star-gen): viewer3d keyboard shortcuts (1/2/3 layers)"
```

---

## Phase F — Edge cases, accessibility, and polish

---

### Task 33: WebGL fallback + zero/single-body edge cases

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/chrome/WebGLFallback.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`

- [ ] **Step 1: Implement `WebGLFallback.tsx`**

```tsx
'use client'

export function WebGLFallback({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#02040a] text-center text-sm text-[var(--text-secondary)]">
      <div className="max-w-md space-y-3 px-6">
        <p className="text-base font-semibold text-[var(--text-primary)]">3D view unavailable on this device.</p>
        <p>Your browser does not appear to support WebGL or has lost the rendering context.</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-[var(--accent)]/40 bg-[var(--accent-light)] px-3 py-1.5 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/15"
        >
          Close — return to orbital table
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Detect WebGL availability in `Scene.tsx`**

At the top of `Scene.tsx`:

```tsx
import { useEffect, useState } from 'react'

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

// inside the component:
const [supported, setSupported] = useState<boolean | null>(null)
useEffect(() => { setSupported(detectWebGL()) }, [])
if (supported === false) {
  return <WebGLFallback onClose={() => window.dispatchEvent(new CustomEvent('viewer3d:close'))} />
}
if (supported === null) return null
```

Modify `viewer3d/index.tsx` to listen for `viewer3d:close`:

```tsx
useEffect(() => {
  function handler() { onClose() }
  window.addEventListener('viewer3d:close', handler)
  return () => window.removeEventListener('viewer3d:close', handler)
}, [onClose])
```

- [ ] **Step 3: Handle 0-body and 1-body edge cases visually**

In `Scene.tsx`, after the `WebGLFallback` early return, before the `<Canvas/>`:

```tsx
const hasBodies = graph.bodies.length > 0 || graph.belts.length > 0
```

Inside the `<Canvas>` block, after `<CameraRig/>`, conditionally render an empty-system overlay using drei `<Html>` if `!hasBodies`:

```tsx
{!hasBodies ? (
  <Html center>
    <div className="rounded-md border border-[var(--border)] bg-[#0f141c]/90 px-3 py-1.5 text-xs text-[var(--text-tertiary)]">
      No major bodies in this system.
    </div>
  </Html>
) : null}
```

Add the import: `import { Html } from '@react-three/drei'`.

- [ ] **Step 4: Manually verify**

Force WebGL off (e.g., via browser flag) → fallback UI appears, Close button dismisses the modal. With a system that has no major bodies (rare, but constructable via test seed), the canvas renders just the star + a centered "No major bodies" notice.

- [ ] **Step 5: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/chrome/WebGLFallback.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx \
        src/features/tools/star_system_generator/viewer3d/index.tsx
git commit -m "feat(star-gen): viewer3d WebGL fallback + empty-system overlay"
```

---

### Task 34: Reduced-motion polish + frame-loop demand mode

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`

- [ ] **Step 1: Switch `frameloop` to `demand` when reduced-motion is on**

In `Scene.tsx`, pull `prefersReducedMotion` from `ViewerContext`. The Canvas is currently rendered without the context provider in scope (the provider wraps the whole modal in `index.tsx`, so the context IS available). Read it directly:

```tsx
import { useViewerContext } from '../chrome/ViewerContext'

// inside Scene():
const { prefersReducedMotion } = useViewerContext()

// on the Canvas:
frameloop={prefersReducedMotion ? 'demand' : 'always'}
```

- [ ] **Step 2: Manually verify**

Enable `prefers-reduced-motion: reduce` in OS / browser dev tools. Modal opens with a single render — no orbital motion, no GU pulse, near-zero CPU. Disabling reduced motion brings back continuous animation.

- [ ] **Step 3: Verify lint + typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx
git commit -m "feat(star-gen): viewer3d frameloop=demand under reduced-motion"
```

---

### Task 35: Final integration tests + audit hook

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph.snapshot.test.ts`

- [ ] **Step 1: Add a snapshot test across a small representative corpus**

```typescript
import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'

const SEEDS: ReadonlyArray<{ name: string; seed: string; distribution: 'frontier' | 'realistic' }> = [
  { name: 'realistic-default',  seed: 'snap-001', distribution: 'realistic' },
  { name: 'frontier-default',   seed: 'snap-002', distribution: 'frontier' },
  { name: 'realistic-multi',    seed: 'snap-003', distribution: 'realistic' },
  { name: 'frontier-multi',     seed: 'snap-004', distribution: 'frontier' },
]

describe('buildSceneGraph snapshot corpus', () => {
  for (const sample of SEEDS) {
    it(`${sample.name} produces a coherent graph`, () => {
      const system = generateSystem({
        seed: sample.seed,
        distribution: sample.distribution,
        tone: 'balanced',
        gu: 'normal',
        settlements: 'normal',
      })
      const graph = buildSceneGraph(system)

      expect(graph.star.coronaRadius).toBeGreaterThan(0)
      expect(graph.bodies.length + graph.belts.length).toBe(system.bodies.length)
      expect(graph.guBleeds.length).toBe(1)
      expect(graph.hazards.length).toBe(system.majorHazards.length)
      expect(graph.sceneRadius).toBeGreaterThan(0)
      // every BodyVisual has an existing OrbitingBody source
      for (const bv of graph.bodies) {
        expect(system.bodies.find((b) => b.id === bv.id)).toBeTruthy()
      }
    })
  }
})
```

- [ ] **Step 2: Run the test**

```bash
npm run test -- --run src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph.snapshot.test.ts
```

Expected: PASS for all 4 seeds.

- [ ] **Step 3: Run the full project test suite + lint + typecheck**

```bash
npm run test
npm run lint
npm run typecheck
npm run audit:star-system-generator:quick
```

Expected: PASS for all (the audit is unaffected — viewer3d is a pure consumer).

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph.snapshot.test.ts
git commit -m "test(star-gen): viewer3d sceneGraph corpus snapshot"
```

---

### Task 36: Final visual + UX pass (bundle measurement, polish, fade-in)

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/index.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`

- [ ] **Step 1: Add a 200ms fade-in on first scene mount**

In `viewer3d/index.tsx`, wrap the modal contents with a `useEffect`-driven `opacity` ramp:

```tsx
import { useEffect, useState } from 'react'

// inside SystemViewer3DModal:
const [mounted, setMounted] = useState(false)
useEffect(() => {
  const t = window.setTimeout(() => setMounted(true), 16)
  return () => window.clearTimeout(t)
}, [])

// and on the modal's content wrapper or Scene container:
<div className={`relative flex-1 transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
  <Scene graph={graph} system={system} />
</div>
```

If `prefersReducedMotion` is true, skip the fade — render at `opacity-100` immediately.

- [ ] **Step 2: Measure bundle impact**

```bash
npm run build
```

Look at the build output. The viewer3d chunk should appear as a separate `.js` file. Note its size. Expected: ~200KB (gzip) for the viewer chunk; main page bundle should NOT include three / r3f / drei.

- [ ] **Step 3: Inspect the main bundle**

```bash
grep -ril 'three' .next/static/ 2>/dev/null | head -5
```

Expected: any three-related strings appear only in chunks distinct from the main page chunk. If three has leaked into the main bundle, return to Task 2 and tighten the lint scope.

- [ ] **Step 4: Manual final-pass walkthrough**

```bash
npm run dev
```

Open the generator. Check off:

- Open viewer (button visible above the summary strip)
- Loading skeleton flashes briefly, then modal opens
- Scene fades in smoothly over 200ms
- Star is correctly colored for the spectral type
- Bodies are textured (banded gas giants, blue earthlikes, etc.)
- Orbits, habitable band, and snow line render correctly
- Belts visible if present
- Settlements show pins
- Hazards and GU bleed render as expected volumes
- Layer toggles (mouse and keyboard 1/2/3) hide the right elements
- Hover tooltips appear and follow objects
- Click → sidebar opens with appropriate detail panel
- Camera fly-to is smooth on body click
- Frame system button returns the camera home
- Esc closes the sidebar then the modal
- `prefers-reduced-motion: reduce` freezes motion and disables the open-fade

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/index.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx
git commit -m "polish(star-gen): viewer3d fade-in + final integration"
```

---

### Task 37: Documentation update

**Files:**
- Modify: `src/features/tools/star_system_generator/README.md`

- [ ] **Step 1: Append a "3D Viewer" section to the README**

Add this section after the "Visual Design Memory" section in `README.md`:

```markdown
## 3D Viewer (`viewer3d/`)

The `viewer3d/` directory contains the lazy-loaded 3D modal. It depends on `three`, `@react-three/fiber`, and `@react-three/drei`. ESLint forbids importing those packages outside this directory.

Architecture:
- `lib/sceneGraph.ts` — pure projection from `GeneratedSystem` to `SystemSceneGraph` (testable, deterministic).
- `lib/scale.ts`, `lib/motion.ts`, `lib/stellarColor.ts`, `lib/bodyShading.ts` — supporting pure modules.
- `lib/hazardClassifier.ts`, `lib/guBleedClassifier.ts` — keyword-based placement of free-form `Fact<string>` hazard / bleed text.
- `chrome/` — DOM (modal, layer toggles, sidebar, legend, detail cards).
- `scene/` — react-three-fiber primitives (one component per scene element: Star, Body, Orbit, Belt, Ring, Moon, HazardVolume, GuBleedVolume, SettlementPin, RuinPin, PhenomenonGlyph).

The viewer is opened from `<SystemViewer3DButton/>` (in the main bundle) which dynamic-imports `viewer3d/index.tsx`.

Run viewer3d-specific tests: `npm run test -- --run src/features/tools/star_system_generator/viewer3d`.
```

- [ ] **Step 2: Commit**

```bash
git add src/features/tools/star_system_generator/README.md
git commit -m "docs(star-gen): document the 3D viewer module layout"
```

---

## Self-Review

| Spec section | Plan tasks |
|---|---|
| §5 Architecture & module layout | Tasks 1, 2, 3, 11, 18 |
| §6 Data flow & scene model | Tasks 3, 7, 8, 9, 10, 11, 35 |
| §7 Visual system | Tasks 6, 7, 19, 20, 21, 23, 25, 26 |
| §8 Interactivity & modal chrome | Tasks 11, 12, 13, 14, 15, 16, 17, 18, 28, 29, 30, 31, 32 |
| §9 Performance, accessibility, edge cases | Tasks 12, 14, 24, 33, 34, 36 |
| §10 Testing | Tasks 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 35 |
| Out-of-scope (§3) | Confirmed not in plan: time scrubber, sub-route, sound, photorealistic textures, caustic GU shader, orbit trails, mobile redesign, screenshots, drag simulation |

All spec sections covered. The plan introduces no out-of-scope work.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-08-3d-system-viewer.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?



