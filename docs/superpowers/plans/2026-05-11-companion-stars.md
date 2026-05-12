# Companion Stars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat single-companion model with a four-mode classification (`volatile`, `circumbinary`, `orbital-sibling`, `linked-independent`) so close binaries get circumbinary zones, moderate/wide binaries get their own sub-system, very-wide companions become deterministic linked sibling systems, and contact pairs strip the inner system in favor of a hazard belt.

**Architecture:** Companion mode is derived from `separation`, stored on `StellarCompanion`. Generator emits 1–2 companions and (for `orbital-sibling`) a nested `CompanionSubSystem` with its own bodies/settlements/gates/ruins/phenomena. Linked-independent companions use a derived seed `<parent>:c<n>` — preview-vs-linked consistency is guaranteed by generating the companion's `star` from the derived seed itself, which is the same RNG path a visit to that seed takes. Report grows a collapsible `CompanionSubSystem` section and per-mode cards in the Multiple-Star Context panel. 3D viewer gains a second sub-graph for orbital siblings and a `DistantStarMarker` for linked-independent companions.

**Tech Stack:** TypeScript (strict), Vitest + happy-dom, React (Next.js App Router), React Three Fiber. Project tests run with `npm run test` (single file: `npm run test -- <path>`).

**Spec:** `docs/superpowers/specs/2026-05-11-companion-stars-design.md`

---

## Phase 1 — Types, classification, geometry

### Task 1: Add classification types and `separationToMode`

**Files:**
- Modify: `src/features/tools/star_system_generator/types.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/companionMode.ts`
- Create: `src/features/tools/star_system_generator/__tests__/companionMode.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/star_system_generator/__tests__/companionMode.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { separationToMode } from '../lib/generator/companionMode'

describe('separationToMode', () => {
  it('maps Contact / near-contact to volatile', () => {
    expect(separationToMode('Contact / near-contact')).toBe('volatile')
  })

  it('maps Close binary and Tight binary to circumbinary', () => {
    expect(separationToMode('Close binary')).toBe('circumbinary')
    expect(separationToMode('Tight binary')).toBe('circumbinary')
  })

  it('maps Moderate binary and Wide binary to orbital-sibling', () => {
    expect(separationToMode('Moderate binary')).toBe('orbital-sibling')
    expect(separationToMode('Wide binary')).toBe('orbital-sibling')
  })

  it('maps Very wide to linked-independent', () => {
    expect(separationToMode('Very wide')).toBe('linked-independent')
  })

  it('maps Hierarchical triple inner entry to orbital-sibling', () => {
    expect(separationToMode('Hierarchical triple')).toBe('orbital-sibling')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companionMode.test.ts`
Expected: FAIL with "Cannot find module '../lib/generator/companionMode'".

- [ ] **Step 3: Add types and implement `separationToMode`**

Append to `src/features/tools/star_system_generator/types.ts` (just after the existing `StellarCompanion` interface):

```ts
export type CompanionRelationshipMode =
  | 'volatile'
  | 'circumbinary'
  | 'orbital-sibling'
  | 'linked-independent'

export interface CompanionSubSystem {
  zones: SystemZones
  bodies: OrbitingBody[]
  settlements: Settlement[]
  gates: Gate[]
  ruins: HumanRemnant[]
  phenomena: SystemPhenomenon[]
}
```

Add the new optional fields to the existing `StellarCompanion` interface (do not remove or rename existing fields):

```ts
export interface StellarCompanion {
  id: string
  companionType: Fact<string>
  separation: Fact<string>
  planetaryConsequence: Fact<string>
  guConsequence: Fact<string>
  rollMargin: Fact<number>
  mode?: CompanionRelationshipMode      // NEW — required after Task 4
  star?: Star                            // NEW — required after Task 4
  linkedSeed?: Fact<string>              // NEW — present iff mode === 'linked-independent'
  subSystem?: CompanionSubSystem         // NEW — present iff mode === 'orbital-sibling'
}
```

Keep `mode` and `star` optional for now; later tasks make them required. The reason: incremental compilation, so existing call sites continue to work between tasks.

Create `src/features/tools/star_system_generator/lib/generator/companionMode.ts`:

```ts
import type { CompanionRelationshipMode } from '../../types'

export function separationToMode(separation: string): CompanionRelationshipMode {
  switch (separation) {
    case 'Contact / near-contact':
      return 'volatile'
    case 'Close binary':
    case 'Tight binary':
      return 'circumbinary'
    case 'Moderate binary':
    case 'Wide binary':
      return 'orbital-sibling'
    case 'Very wide':
      return 'linked-independent'
    case 'Hierarchical triple':
      return 'orbital-sibling'
    default:
      return 'orbital-sibling'
  }
}
```

The `Hierarchical triple` case returns `orbital-sibling` because that's the *inner* entry's mode; the outer linked-independent entry is added by `generateStellarCompanions` (Task 5), not by `separationToMode`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companionMode.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Run the full test suite to confirm nothing regressed**

Run: `npm run test`
Expected: PASS for everything (existing tests untouched; new optional fields don't break consumers).

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/types.ts \
  src/features/tools/star_system_generator/lib/generator/companionMode.ts \
  src/features/tools/star_system_generator/__tests__/companionMode.test.ts
git commit -m "feat: companion relationship mode classification"
```

---

### Task 2: Shared companion geometry table

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/companionGeometry.ts`
- Create: `src/features/tools/star_system_generator/__tests__/companionGeometry.test.ts`
- Modify: `src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts:34-52`

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/star_system_generator/__tests__/companionGeometry.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { separationToBucketAu, companionBucketKeys } from '../lib/generator/companionGeometry'

describe('separationToBucketAu', () => {
  it('returns numeric AU for each defined keyword bucket', () => {
    for (const key of companionBucketKeys) {
      const au = separationToBucketAu(key)
      expect(typeof au).toBe('number')
      expect(au).toBeGreaterThan(0)
    }
  })

  it('matches keywords case-insensitively from a separation string', () => {
    expect(separationToBucketAu('Close binary')).toBe(separationToBucketAu('close'))
    expect(separationToBucketAu('Wide binary')).toBe(separationToBucketAu('wide'))
  })

  it('falls back to moderate for unknown separation strings', () => {
    expect(separationToBucketAu('made up label')).toBe(separationToBucketAu('moderate'))
  })

  it('orders buckets close < near < moderate < wide < distant', () => {
    expect(separationToBucketAu('close')).toBeLessThan(separationToBucketAu('near'))
    expect(separationToBucketAu('near')).toBeLessThan(separationToBucketAu('moderate'))
    expect(separationToBucketAu('moderate')).toBeLessThan(separationToBucketAu('wide'))
    expect(separationToBucketAu('wide')).toBeLessThan(separationToBucketAu('distant'))
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companionGeometry.test.ts`
Expected: FAIL with "Cannot find module '../lib/generator/companionGeometry'".

- [ ] **Step 3: Create the shared geometry module**

Create `src/features/tools/star_system_generator/lib/generator/companionGeometry.ts`:

```ts
export const companionBucketKeys = ['close', 'near', 'moderate', 'wide', 'distant'] as const
export type CompanionBucketKey = typeof companionBucketKeys[number]

const COMPANION_AU: Record<CompanionBucketKey, number> = {
  close: 0.5,
  near: 2,
  moderate: 8,
  wide: 40,
  distant: 80,
}

export function separationToBucketAu(separation: string): number {
  const lower = separation.toLowerCase()
  for (const key of companionBucketKeys) {
    if (lower.includes(key)) return COMPANION_AU[key]
  }
  return COMPANION_AU.moderate
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companionGeometry.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Use the shared module in `sceneGraph.ts`**

Edit `src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts`. Add the import near the top of the existing imports:

```ts
import { separationToBucketAu } from '../../lib/generator/companionGeometry'
```

Remove lines 34–52 (the `COMPANION_KEYS`, `COMPANION_AU`, and the body of `companionOffset` that walks the keys table). Replace `companionOffset` with:

```ts
function companionOffset(separation: string, hzCenterAu: number, scaleMode: OrbitScaleMode): number {
  return auToScene(separationToBucketAu(separation), hzCenterAu, scaleMode)
}
```

- [ ] **Step 6: Run the full test suite**

Run: `npm run test`
Expected: PASS for everything. The viewer's existing tests (`visualProfiles.test.ts`) still pass; the refactor preserves behavior because `separationToBucketAu` returns the same AU values as the old inline table.

- [ ] **Step 7: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/companionGeometry.ts \
  src/features/tools/star_system_generator/__tests__/companionGeometry.test.ts \
  src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts
git commit -m "refactor: lift companion separation AU table to shared module"
```

---

## Phase 2 — Generator behavior

### Task 3: Companion star generator

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/companionStar.ts`
- Create: `src/features/tools/star_system_generator/__tests__/companionStar.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/star_system_generator/__tests__/companionStar.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createSeededRng } from '../lib/generator/rng'
import { generateCompanionStar } from '../lib/generator/companionStar'
import type { Star } from '../types'

function fact<T>(value: T): { value: T; confidence: 'derived' } {
  return { value, confidence: 'derived' }
}

const gPrimary: Star = {
  id: 'primary-test',
  name: fact('Test Primary'),
  spectralType: fact('G star'),
  massSolar: fact(1.0),
  luminositySolar: fact(1.0),
  ageState: fact('Main sequence, mature'),
  metallicity: fact('Solar'),
  activity: fact('Quiet'),
  activityRoll: fact(7),
  activityModifiers: [],
}

describe('generateCompanionStar', () => {
  it('returns a deterministic Star for a given seed string', () => {
    const a = generateCompanionStar(createSeededRng('seed-A:companion-1'), gPrimary, 'Test Primary B')
    const b = generateCompanionStar(createSeededRng('seed-A:companion-1'), gPrimary, 'Test Primary B')
    expect(a).toEqual(b)
  })

  it('produces a companion mass less than or equal to the primary mass for G primaries', () => {
    for (const seed of ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']) {
      const c = generateCompanionStar(createSeededRng(`${seed}:companion-1`), gPrimary, 'Test')
      expect(c.massSolar.value).toBeLessThanOrEqual(gPrimary.massSolar.value)
    }
  })

  it('inherits the primary age state (coeval)', () => {
    const c = generateCompanionStar(createSeededRng('coeval'), gPrimary, 'Test')
    expect(c.ageState.value).toBe(gPrimary.ageState.value)
  })

  it('uses the provided name', () => {
    const c = generateCompanionStar(createSeededRng('named'), gPrimary, 'Sirius B')
    expect(c.name.value).toBe('Sirius B')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companionStar.test.ts`
Expected: FAIL with "Cannot find module '../lib/generator/companionStar'".

- [ ] **Step 3: Implement `generateCompanionStar`**

Create `src/features/tools/star_system_generator/lib/generator/companionStar.ts`:

```ts
import type { Star } from '../../types'
import { fact } from './index'
import type { SeededRng } from './rng'
import { realisticStarTypes } from './tables'
import { pickTable, twoD6 } from './dice'

const SMALLER_SPECTRAL_PROGRESSION = [
  'O/B/A bright star',
  'F star',
  'G star',
  'K star',
  'M dwarf',
  'Brown dwarf/substellar primary',
] as const

function smallerOrEqualSpectral(primarySpectral: string): string {
  const idx = SMALLER_SPECTRAL_PROGRESSION.indexOf(primarySpectral as typeof SMALLER_SPECTRAL_PROGRESSION[number])
  if (idx < 0) return 'M dwarf'
  if (idx >= SMALLER_SPECTRAL_PROGRESSION.length - 1) return primarySpectral
  return SMALLER_SPECTRAL_PROGRESSION[idx + 1]
}

function pickCompanionSpectral(rng: SeededRng, primarySpectral: string): string {
  const roll = twoD6(rng)
  if (roll <= 4) return SMALLER_SPECTRAL_PROGRESSION[Math.min(SMALLER_SPECTRAL_PROGRESSION.length - 1, (SMALLER_SPECTRAL_PROGRESSION.indexOf(primarySpectral as typeof SMALLER_SPECTRAL_PROGRESSION[number]) + 2))] ?? 'M dwarf'
  if (roll <= 9) return smallerOrEqualSpectral(primarySpectral)
  return primarySpectral
}

function massForSpectral(spectral: string, rng: SeededRng): number {
  switch (spectral) {
    case 'O/B/A bright star': return 5 + (rng.next() * 10)
    case 'F star': return 1.05 + (rng.next() * 0.35)
    case 'G star': return 0.80 + (rng.next() * 0.30)
    case 'K star': return 0.50 + (rng.next() * 0.30)
    case 'M dwarf': return 0.10 + (rng.next() * 0.35)
    case 'Brown dwarf/substellar primary': return 0.05 + (rng.next() * 0.05)
    default: return 0.30
  }
}

function luminosityForMass(massSolar: number): number {
  if (massSolar < 0.45) return massSolar ** 2.3
  if (massSolar < 2.0) return massSolar ** 4
  return massSolar ** 3.5
}

export function generateCompanionStar(rng: SeededRng, primary: Star, name: string): Star {
  const spectral = pickCompanionSpectral(rng.fork('spectral'), primary.spectralType.value)
  const mass = Math.min(primary.massSolar.value, massForSpectral(spectral, rng.fork('mass')))
  const luminosity = luminosityForMass(mass)
  const activityRoll = twoD6(rng.fork('activity'))

  return {
    id: `companion-star-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name: fact(name, 'human-layer', 'Generated companion star name'),
    spectralType: fact(spectral, 'inferred', 'Companion spectral class, biased smaller than primary'),
    massSolar: fact(Number(mass.toFixed(2)), 'derived', `Companion mass for ${spectral}, capped at primary mass`),
    luminositySolar: fact(Number(luminosity.toFixed(3)), 'derived', 'Mass-luminosity relation'),
    ageState: fact(primary.ageState.value, 'inferred', 'Coeval with primary'),
    metallicity: fact(primary.metallicity.value, 'inferred', 'Shared protostellar nebula'),
    activity: fact(activityRoll >= 10 ? 'Flare-prone' : activityRoll >= 6 ? 'Active' : 'Quiet', 'inferred', `Companion activity roll ${activityRoll}`),
    activityRoll: fact(activityRoll, 'derived', '2d6'),
    activityModifiers: [],
  }
}
```

Note: the `pickTable`, `twoD6` and `realisticStarTypes` imports above are because the module uses them in case future revisions tie back into existing tables; if eslint complains about unused imports in this exact form, remove the unused ones (`pickTable`, `realisticStarTypes`) — they're listed defensively for the implementer.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companionStar.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/companionStar.ts \
  src/features/tools/star_system_generator/__tests__/companionStar.test.ts
git commit -m "feat: companion star generator"
```

---

### Task 4: Wire mode + star + linkedSeed into companion generation (single entry)

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (the `generateStellarCompanions` function and its call site)
- Modify: `src/features/tools/star_system_generator/types.ts` (make `mode` and `star` required)
- Modify: `src/features/tools/star_system_generator/lib/generator/rng.ts` (`normalizeSeed` must preserve `:` for the derived-seed convention)
- Create: `src/features/tools/star_system_generator/__tests__/companion-modes.test.ts`
- Create: `src/features/tools/star_system_generator/__tests__/normalizeSeed.test.ts`

- [ ] **Step 1a: Update `normalizeSeed` to preserve colons**

Open `src/features/tools/star_system_generator/lib/generator/rng.ts`. Line 76's `normalizeSeed` currently strips any non-hex character via `replace(/[^a-fA-F0-9]/g, '')`. The derived-seed convention uses `:c<n>` suffixes that contain colons — these must survive normalization or the URL navigation in Tasks 10/15 will silently load a different system. Replace the function body:

```ts
export function normalizeSeed(seed: string | null | undefined): string {
  const trimmed = (seed ?? '').trim()
  if (!trimmed) return createRandomSeed()
  const cleaned = trimmed.replace(/[^a-fA-F0-9:]/g, '').toLowerCase()
  if (!cleaned) return createRandomSeed()
  // Allow up to 32 hex chars per segment, with optional :c<n> suffixes (e.g. "deadbeef:c1" or "deadbeef:c1:c2").
  return cleaned.slice(0, 40)
}
```

Create a new test file `src/features/tools/star_system_generator/__tests__/normalizeSeed.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { normalizeSeed } from '../lib/generator/rng'

describe('normalizeSeed colon convention', () => {
  it('preserves a :c<n> suffix', () => {
    expect(normalizeSeed('deadbeef:c1')).toBe('deadbeef:c1')
  })

  it('preserves chained suffixes', () => {
    expect(normalizeSeed('deadbeef:c1:c2')).toBe('deadbeef:c1:c2')
  })

  it('still strips other non-hex characters', () => {
    expect(normalizeSeed('dead-beef:c1!')).toBe('deadbeef:c1')
  })
})
```

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/normalizeSeed.test.ts` (or the existing rng test path). Expected: PASS, 3 new tests.

- [ ] **Step 1b: Write the failing companion-modes test**

Create `src/features/tools/star_system_generator/__tests__/companion-modes.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'mode-test',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findSeedWithSeparation(target: string, max = 400): string {
  for (let i = 0; i < max; i++) {
    const seed = `companion-search-${target.replace(/[^a-z]/gi, '')}-${i}`
    const system = generateSystem({ ...baseOptions, seed })
    if (system.companions[0]?.separation.value === target) return seed
  }
  throw new Error(`No seed found producing separation "${target}" within ${max} tries`)
}

describe('companion modes', () => {
  it('sets mode = circumbinary for Close/Tight binaries', () => {
    const seed = findSeedWithSeparation('Close binary')
    const sys = generateSystem({ ...baseOptions, seed })
    expect(sys.companions[0].mode).toBe('circumbinary')
    expect(sys.companions[0].star).toBeDefined()
    expect(sys.companions[0].linkedSeed).toBeUndefined()
  })

  it('sets mode = orbital-sibling for Moderate/Wide binaries', () => {
    const seed = findSeedWithSeparation('Wide binary')
    const sys = generateSystem({ ...baseOptions, seed })
    expect(sys.companions[0].mode).toBe('orbital-sibling')
    expect(sys.companions[0].star).toBeDefined()
  })

  it('sets mode = linked-independent and linkedSeed for Very wide', () => {
    const seed = findSeedWithSeparation('Very wide')
    const sys = generateSystem({ ...baseOptions, seed })
    expect(sys.companions[0].mode).toBe('linked-independent')
    expect(sys.companions[0].linkedSeed?.value).toBe(`${seed}:c1`)
  })

  it('sets mode = volatile for Contact / near-contact', () => {
    const seed = findSeedWithSeparation('Contact / near-contact')
    const sys = generateSystem({ ...baseOptions, seed })
    expect(sys.companions[0].mode).toBe('volatile')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companion-modes.test.ts`
Expected: FAIL — `mode` is `undefined` on the generated companion.

- [ ] **Step 3: Wire mode, star, and linkedSeed in `generateStellarCompanions`**

In `src/features/tools/star_system_generator/lib/generator/index.ts`, add imports near the top of the file:

```ts
import { separationToMode } from './companionMode'
import { generateCompanionStar } from './companionStar'
```

Replace the body of `generateStellarCompanions` (currently around line 607) with:

```ts
function generateStellarCompanions(rng: SeededRng, primary: Star, parentSeed: string): StellarCompanion[] {
  const threshold = companionThreshold(primary.spectralType.value)
  let roll = twoD6(rng)
  const modifiers: string[] = ['+1 major reachable system']
  roll += 1

  const margin = roll - threshold
  if (margin < 0) return []

  const separationRoll = twoD6(rng)
  const separationProfile = binarySeparationProfile(separationRoll)
  const separationValue = separationProfile.separation.value
  const mode = separationToMode(separationValue)

  const companionName = `${primary.name.value} B`
  const star = mode === 'linked-independent'
    ? generateCompanionStar(createSeededRng(`${parentSeed}:c1`).fork('star'), primary, companionName)
    : generateCompanionStar(rng.fork('star1'), primary, companionName)

  const base: StellarCompanion = {
    id: 'companion-1',
    companionType: fact(companionTypeFromMargin(margin), 'inferred', `MASS-GU companion threshold ${threshold}; modifiers ${modifiers.join(', ')}`),
    ...separationProfile,
    rollMargin: fact(margin, 'derived', `Modified 2d6 companion roll ${roll} vs threshold ${threshold}`),
    mode,
    star,
  }

  if (mode === 'linked-independent') {
    base.linkedSeed = fact(`${parentSeed}:c1`, 'derived', 'Derived seed for linked sibling system')
  }

  return [base]
}
```

Update the single call site (search for `generateStellarCompanions(rootRng.fork('companions'), basePrimary)` near line 4193) to pass the seed:

```ts
const companions = generateStellarCompanions(rootRng.fork('companions'), basePrimary, options.seed)
```

In `src/features/tools/star_system_generator/types.ts`, change `mode` and `star` from optional to required on `StellarCompanion`:

```ts
export interface StellarCompanion {
  id: string
  companionType: Fact<string>
  separation: Fact<string>
  planetaryConsequence: Fact<string>
  guConsequence: Fact<string>
  rollMargin: Fact<number>
  mode: CompanionRelationshipMode
  star: Star
  linkedSeed?: Fact<string>
  subSystem?: CompanionSubSystem
}
```

You will also need to make sure `createSeededRng` is imported in `index.ts` (it should already be, but verify the import line at the top includes `createSeededRng` from `./rng`).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companion-modes.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: PASS for everything. Existing determinism tests still pass because the RNG fork structure for non-linked companions is unchanged (only adds `star1` as a sub-fork, which doesn't affect any other fork's stream).

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/index.ts \
  src/features/tools/star_system_generator/lib/generator/rng.ts \
  src/features/tools/star_system_generator/types.ts \
  src/features/tools/star_system_generator/__tests__/companion-modes.test.ts \
  src/features/tools/star_system_generator/__tests__/normalizeSeed.test.ts
git commit -m "feat: classify companions and generate companion stars"
```

---

### Task 5: Hierarchical triple emits a second linked-independent entry

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (the `generateStellarCompanions` function)
- Modify: `src/features/tools/star_system_generator/__tests__/companion-modes.test.ts`

- [ ] **Step 1: Add a failing test for hierarchical triple**

Add this test inside the existing `describe('companion modes', ...)` block in `companion-modes.test.ts`:

```ts
  it('emits two companions for Hierarchical triple — inner orbital-sibling and outer linked-independent', () => {
    const seed = findSeedWithSeparation('Hierarchical triple')
    const sys = generateSystem({ ...baseOptions, seed })

    expect(sys.companions).toHaveLength(2)
    expect(sys.companions[0].mode).toBe('orbital-sibling')
    expect(sys.companions[0].id).toBe('companion-1')
    expect(sys.companions[1].mode).toBe('linked-independent')
    expect(sys.companions[1].id).toBe('companion-2')
    expect(sys.companions[1].linkedSeed?.value).toBe(`${seed}:c2`)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companion-modes.test.ts -t "Hierarchical triple"`
Expected: FAIL — only one companion is emitted.

- [ ] **Step 3: Emit the second companion**

In `src/features/tools/star_system_generator/lib/generator/index.ts`, modify `generateStellarCompanions` to append a second entry for the hierarchical case. Just before the final `return [base]` statement, replace with:

```ts
  const result: StellarCompanion[] = [base]

  if (separationValue === 'Hierarchical triple') {
    const outerName = `${primary.name.value} C`
    const outerStar = generateCompanionStar(
      createSeededRng(`${parentSeed}:c2`).fork('star'),
      primary,
      outerName,
    )
    result.push({
      id: 'companion-2',
      companionType: fact('Hierarchical triple — outer linked system', 'inferred', 'Hierarchical triple outer member'),
      separation: fact('Very wide', 'inferred', 'Outer member of hierarchical triple'),
      planetaryConsequence: fact('Treated as an independently generated linked system.', 'inferred', 'Hierarchical outer convention'),
      guConsequence: fact('Long-haul intra-system frontier; see linked system for details.', 'gu-layer', 'Hierarchical outer convention'),
      rollMargin: fact(margin, 'derived', 'Inherits margin from primary companion roll'),
      mode: 'linked-independent',
      star: outerStar,
      linkedSeed: fact(`${parentSeed}:c2`, 'derived', 'Derived seed for hierarchical outer system'),
    })
  }

  return result
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companion-modes.test.ts`
Expected: PASS, 5 tests (including the new Hierarchical triple test).

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: PASS. The existing `companions[0]` access in consumers (SystemOverview, StarDetailCard) still works because we never remove `companions[0]`; we only add a second entry for the hierarchical case.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/index.ts \
  src/features/tools/star_system_generator/__tests__/companion-modes.test.ts
git commit -m "feat: hierarchical triple emits inner + outer companion entries"
```

---

### Task 6: Volatile mode strips bodies and injects hazard belt + phenomenon

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (the `generateSystem` orchestration)
- Create: `src/features/tools/star_system_generator/lib/generator/volatileSystem.ts`
- Create: `src/features/tools/star_system_generator/__tests__/companion-volatile.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/star_system_generator/__tests__/companion-volatile.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'volatile-test',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findVolatileSeed(max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `volatile-seek-${i}`
    const system = generateSystem({ ...baseOptions, seed })
    if (system.companions[0]?.mode === 'volatile') return seed
  }
  throw new Error('No volatile seed found')
}

describe('volatile companion mode', () => {
  it('replaces ordinary bodies with a single hazard belt', () => {
    const seed = findVolatileSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    expect(sys.bodies).toHaveLength(1)
    expect(sys.bodies[0].category.value).toBe('belt')
    expect(sys.bodies[0].name.value.toLowerCase()).toContain('contact')
  })

  it('emits a binary-contact phenomenon', () => {
    const seed = findVolatileSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const hasBinaryContact = sys.phenomena.some((p) => p.phenomenon.value.toLowerCase().includes('binary contact'))
    expect(hasBinaryContact).toBe(true)
  })

  it('produces no settlements or gates (no habitable anchors)', () => {
    const seed = findVolatileSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    expect(sys.settlements).toHaveLength(0)
    expect(sys.gates).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companion-volatile.test.ts`
Expected: FAIL — bodies array contains the normal generated planets.

- [ ] **Step 3: Create the volatile system module**

Create `src/features/tools/star_system_generator/lib/generator/volatileSystem.ts`:

```ts
import type { OrbitingBody, SystemPhenomenon, BodyPhysicalHints, PlanetaryDetail } from '../../types'
import { fact } from './index'

function emptyPhysical(): BodyPhysicalHints {
  return {
    radiusEarth: fact(0, 'derived', 'Belt has no aggregate radius'),
    massEarth: fact(null, 'derived', 'Belt has no aggregate mass'),
    surfaceGravityG: fact(null, 'derived', 'Belt has no surface'),
    gravityLabel: fact('No surface', 'inferred', 'Belt'),
    periodDays: fact(365, 'derived', 'Approximate inner belt period'),
    closeIn: fact(true, 'derived', 'Belt sits just outside the binary contact zone'),
    volatileEnvelope: fact(false, 'derived', 'Belt'),
  }
}

function emptyDetail(): PlanetaryDetail {
  const blank = (label: string) => fact(label, 'inferred', 'Binary contact belt — no surface detail')
  return {
    atmosphere: blank('No atmosphere'),
    hydrosphere: blank('None'),
    geology: blank('Debris fragments, post-contact ejecta'),
    climate: [blank('None — vacuum')],
    radiation: blank('Severe — overlapping stellar fields'),
    biosphere: blank('Sterile'),
    mineralComposition: blank('Heavy-element-rich post-contact ejecta'),
    magneticField: blank('Chaotic, sourced from both stars'),
    atmosphericTraces: blank('None'),
    hydrology: blank('None'),
    topography: blank('Dispersed debris'),
    rotationProfile: blank('Tumbling fragments'),
    seismicActivity: blank('Continuous fragmentation'),
    surfaceHazards: blank('Hypervelocity debris, paired stellar flares, GU bleed'),
    dayLength: blank('Not applicable'),
    surfaceLight: blank('Twin-star glare from all directions'),
    axialTilt: blank('Not applicable'),
    skyPhenomena: blank('Stars appear to touch from anywhere in the belt'),
    atmosphericPressure: blank('Vacuum'),
    windRegime: blank('Not applicable'),
    tidalRegime: blank('Extreme — chaotic, time-varying'),
    acousticEnvironment: blank('Silent vacuum'),
    resourceAccess: blank('Hazardous; high-yield post-stellar elements at lethal risk'),
    biosphereDistribution: blank('None'),
  }
}

export function buildVolatileHazardBelt(systemName: string): OrbitingBody {
  return {
    id: 'volatile-contact-belt',
    orbitAu: fact(0.6, 'inferred', 'Just outside binary contact zone'),
    name: fact(`${systemName} Contact Belt`, 'human-layer', 'Binary contact debris belt'),
    category: fact('belt', 'inferred', 'Binary contact ejecta'),
    massClass: fact('Asteroid belt', 'inferred', 'Belt'),
    bodyClass: fact('Hazardous binary contact belt', 'inferred', 'Volatile companion mode'),
    whyInteresting: fact('Post-contact stellar ejecta produces unstable, mineral-rich, lethally hazardous debris.', 'human-layer', 'Volatile mode flavor'),
    thermalZone: fact('Furnace', 'inferred', 'Inner binary zone'),
    physical: emptyPhysical(),
    detail: emptyDetail(),
    moons: [],
    filterNotes: [fact('Volatile binary: ordinary planets cannot form here.', 'inferred', 'Volatile companion mode')],
    traits: [
      fact('Hypervelocity debris', 'inferred', 'Volatile mode hazard'),
      fact('Overlapping stellar flares', 'inferred', 'Volatile mode hazard'),
    ],
    sites: [],
  }
}

export function buildBinaryContactPhenomenon(): SystemPhenomenon {
  return {
    id: 'phenomenon-binary-contact',
    phenomenon: fact('Binary contact zone', 'inferred', 'Volatile companion mode'),
    note: fact('Two stars in physical contact or near-contact; their atmospheres mix and their gravity wells overlap.', 'inferred', 'Volatile mode'),
    travelEffect: fact('Approach corridors are constantly redrawn; lanes inside 1 AU lose viability hour-to-hour.', 'inferred', 'Volatile mode'),
    surveyQuestion: fact('Where is the next stable debris stream, and how long before paired flares close it?', 'inferred', 'Volatile mode'),
    conflictHook: fact('Salvage operators race paired flare cycles to extract rare post-stellar elements.', 'inferred', 'Volatile mode'),
    sceneAnchor: fact('A skiff threading between two suns whose coronas are visibly touching.', 'inferred', 'Volatile mode'),
  }
}
```

- [ ] **Step 4: Wire the volatile branch into `generateSystem`**

In `src/features/tools/star_system_generator/lib/generator/index.ts`, add this import near the other generator imports:

```ts
import { buildVolatileHazardBelt, buildBinaryContactPhenomenon } from './volatileSystem'
```

In `generateSystem`, locate the line:

```ts
const bodies = generateBodies(rootRng.fork('bodies'), primary, architectureResult.architecture.name.value, name.value, knownSystem?.bodies)
```

Replace it with:

```ts
const hasVolatileCompanion = companions.some((c) => c.mode === 'volatile')
const bodies = hasVolatileCompanion
  ? [buildVolatileHazardBelt(name.value)]
  : generateBodies(rootRng.fork('bodies'), primary, architectureResult.architecture.name.value, name.value, knownSystem?.bodies)
```

Locate the line:

```ts
const phenomena = generatePhenomena(rootRng.fork('phenomena'), architectureResult.architecture.name.value, guOverlay)
```

Replace it with:

```ts
const generatedPhenomena = generatePhenomena(rootRng.fork('phenomena'), architectureResult.architecture.name.value, guOverlay)
const phenomena = hasVolatileCompanion
  ? [buildBinaryContactPhenomenon(), ...generatedPhenomena]
  : generatedPhenomena
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companion-volatile.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Run the full test suite**

Run: `npm run test`
Expected: PASS. Existing settlements/ruins counts are zero in volatile systems because they depend on bodies; the only body is a belt with no settlement-eligible body class, which the existing settlement filter rejects.

- [ ] **Step 7: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/volatileSystem.ts \
  src/features/tools/star_system_generator/lib/generator/index.ts \
  src/features/tools/star_system_generator/__tests__/companion-volatile.test.ts
git commit -m "feat: volatile companions strip bodies and inject hazard belt"
```

---

### Task 7: Circumbinary zones (combined luminosity + inner-edge push)

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (zone calculation + body generation guard)
- Create: `src/features/tools/star_system_generator/__tests__/companion-circumbinary.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/star_system_generator/__tests__/companion-circumbinary.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'circumbinary-test',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findCircumbinarySeed(max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `circumbinary-seek-${i}`
    const system = generateSystem({ ...baseOptions, seed })
    if (system.companions[0]?.mode === 'circumbinary') return seed
  }
  throw new Error('No circumbinary seed found')
}

describe('circumbinary companion mode', () => {
  it('inner habitable edge is pushed outward by at least the binary separation', () => {
    const seed = findCircumbinarySeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const innerEdge = sys.zones.habitableInnerAu.value
    expect(innerEdge).toBeGreaterThanOrEqual(1.0)
  })

  it('no body orbits inside the keep-out zone', () => {
    const seed = findCircumbinarySeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const minOrbit = Math.min(...sys.bodies.map((b) => b.orbitAu.value), Infinity)
    expect(minOrbit).toBeGreaterThanOrEqual(1.0)
  })

  it('combined luminosity inflates the habitable center compared to the primary alone', () => {
    const seed = findCircumbinarySeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const expectedCombined = sys.primary.luminositySolar.value + sys.companions[0].star.luminositySolar.value
    expect(expectedCombined).toBeGreaterThan(sys.primary.luminositySolar.value)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companion-circumbinary.test.ts`
Expected: FAIL — inner edge uses primary-only luminosity; bodies may orbit inside the no-go zone.

- [ ] **Step 3: Compute circumbinary zones and keep-out**

In `src/features/tools/star_system_generator/lib/generator/index.ts`, add an import:

```ts
import { separationToBucketAu } from './companionGeometry'
```

Locate (in `generateSystem`):

```ts
const hz = calculateHabitableZone(primary.luminositySolar.value)
const snowLine = calculateSnowLine(primary.luminositySolar.value)
```

Replace with:

```ts
const circumbinaryCompanion = companions.find((c) => c.mode === 'circumbinary')
const effectiveLuminosity = circumbinaryCompanion
  ? primary.luminositySolar.value + circumbinaryCompanion.star.luminositySolar.value
  : primary.luminositySolar.value
const keepOutAu = circumbinaryCompanion
  ? 2 * separationToBucketAu(circumbinaryCompanion.separation.value)
  : 0
const baseHz = calculateHabitableZone(effectiveLuminosity)
const hz = {
  inner: Math.max(baseHz.inner, keepOutAu),
  center: Math.max(baseHz.center, keepOutAu * 1.2),
  outer: Math.max(baseHz.outer, keepOutAu * 1.4),
}
const snowLine = Math.max(calculateSnowLine(effectiveLuminosity), keepOutAu * 1.5)
```

Then update body generation so the volatile branch (Task 6) AND the circumbinary branch both modify body generation. Locate the line you wrote in Task 6:

```ts
const hasVolatileCompanion = companions.some((c) => c.mode === 'volatile')
const bodies = hasVolatileCompanion
  ? [buildVolatileHazardBelt(name.value)]
  : generateBodies(rootRng.fork('bodies'), primary, architectureResult.architecture.name.value, name.value, knownSystem?.bodies)
```

Replace it with a function call that respects keep-out for circumbinary. First, modify `generateBodies` to accept a minimum-orbit option. In the same file, locate the signature of `generateBodies` (around line 2763):

```ts
function generateBodies(rng: SeededRng, primary: Star, architectureName: string, systemName: string, knownBodies: PartialKnownBody[] = []): OrbitingBody[] {
```

Change it to:

```ts
function generateBodies(rng: SeededRng, primary: Star, architectureName: string, systemName: string, knownBodies: PartialKnownBody[] = [], minOrbitAu = 0): OrbitingBody[] {
```

Inside `generateBodies`, after orbit assignments are computed, filter or shift any body whose `orbitAu` is below `minOrbitAu`. The minimal change: after the line that builds the `bodies` array but before returning, add:

```ts
const filtered = bodies.filter((b) => b.orbitAu.value >= minOrbitAu)
return filtered
```

(Locate the existing `return bodies` at the end of `generateBodies` and replace `return bodies` with the filter above.)

Now back to `generateSystem`, replace the body-generation block again:

```ts
const hasVolatileCompanion = companions.some((c) => c.mode === 'volatile')
const bodies = hasVolatileCompanion
  ? [buildVolatileHazardBelt(name.value)]
  : generateBodies(
      rootRng.fork('bodies'),
      primary,
      architectureResult.architecture.name.value,
      name.value,
      knownSystem?.bodies,
      keepOutAu,
    )
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companion-circumbinary.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: PASS. For non-circumbinary systems `keepOutAu = 0` and the filter is a no-op; for non-circumbinary systems `effectiveLuminosity` falls back to the primary alone, so zone values are unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/index.ts \
  src/features/tools/star_system_generator/__tests__/companion-circumbinary.test.ts
git commit -m "feat: circumbinary zones use combined luminosity and inner keep-out"
```

---

### Task 8: Orbital-sibling sub-system generation

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (extend `generateSystem` to populate `companion.subSystem`)
- Create: `src/features/tools/star_system_generator/__tests__/companion-subsystem.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/star_system_generator/__tests__/companion-subsystem.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'subsys-test',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

function findOrbitalSiblingSeed(max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `subsys-seek-${i}`
    const system = generateSystem({ ...baseOptions, seed })
    if (system.companions[0]?.mode === 'orbital-sibling') return seed
  }
  throw new Error('No orbital-sibling seed found')
}

describe('orbital-sibling sub-system', () => {
  it('populates subSystem with zones and bodies', () => {
    const seed = findOrbitalSiblingSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const sub = sys.companions[0].subSystem
    expect(sub).toBeDefined()
    expect(sub!.bodies.length).toBeGreaterThan(0)
    expect(sub!.zones.habitableCenterAu.value).toBeGreaterThan(0)
  })

  it('sub-system bodies do not appear in the top-level bodies array', () => {
    const seed = findOrbitalSiblingSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const topIds = new Set(sys.bodies.map((b) => b.id))
    for (const subBody of sys.companions[0].subSystem!.bodies) {
      expect(topIds.has(subBody.id)).toBe(false)
    }
  })

  it('is deterministic for the same seed', () => {
    const seed = findOrbitalSiblingSeed()
    const a = generateSystem({ ...baseOptions, seed })
    const b = generateSystem({ ...baseOptions, seed })
    expect(a.companions[0].subSystem!.bodies.map((b) => b.id)).toEqual(
      b.companions[0].subSystem!.bodies.map((b) => b.id),
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companion-subsystem.test.ts`
Expected: FAIL — `subSystem` is `undefined`.

- [ ] **Step 3: Generate sub-systems in `generateSystem`**

In `src/features/tools/star_system_generator/lib/generator/index.ts`, in `generateSystem`, after the `companions` variable has been computed and after the existing settlements/ruins/phenomena have been generated for the primary, add a sub-system generation block. The simplest place is right before `runNoAlienGuard({...})` (the final return). Add:

```ts
const companionsWithSubSystems: StellarCompanion[] = companions.map((companion, idx) => {
  if (companion.mode !== 'orbital-sibling') return companion

  const subRng = rootRng.fork(`subsystem-${idx + 1}`)
  const subStar = companion.star
  const subHz = calculateHabitableZone(subStar.luminositySolar.value)
  const subSnowLine = calculateSnowLine(subStar.luminositySolar.value)
  const subZones: SystemZones = {
    habitableInnerAu: fact(subHz.inner, 'derived', '0.75 * sqrt(L) — companion luminosity'),
    habitableCenterAu: fact(subHz.center, 'derived', 'sqrt(L) — companion luminosity'),
    habitableOuterAu: fact(subHz.outer, 'derived', '1.77 * sqrt(L) — companion luminosity'),
    snowLineAu: fact(subSnowLine, 'derived', '2.7 * sqrt(L) — companion luminosity'),
  }

  const subBodies = generateBodies(
    subRng.fork('bodies'),
    subStar,
    architectureResult.architecture.name.value,
    `${name.value} (Companion)`,
    [],
    0,
  )

  const subAllSettlements = generateSettlements(
    subRng.fork('settlements'),
    options,
    `${name.value} (Companion)`,
    subBodies,
    guOverlay,
    reachability,
    architectureResult.architecture.name.value,
  )
  const { settlements: subSettlements, gates: subGates } = partitionGates(subAllSettlements)
  const subRuins = generateHumanRemnants(subRng.fork('ruins'), subBodies, guOverlay)
  const subPhenomena = generatePhenomena(subRng.fork('phenomena'), architectureResult.architecture.name.value, guOverlay)

  return {
    ...companion,
    subSystem: {
      zones: subZones,
      bodies: subBodies,
      settlements: subSettlements,
      gates: subGates,
      ruins: subRuins,
      phenomena: subPhenomena,
    },
  }
})
```

Then in the `runNoAlienGuard({...})` call that follows, change the `companions` field to use `companionsWithSubSystems`:

```ts
companions: companionsWithSubSystems,
```

Add `SystemZones` to the type imports at the top of `index.ts` if it isn't already imported.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companion-subsystem.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: PASS. The relationship graph and `runNoAlienGuard` inputs are unchanged (they still operate on top-level bodies and settlements only); the sub-system is an additive payload.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/index.ts \
  src/features/tools/star_system_generator/__tests__/companion-subsystem.test.ts
git commit -m "feat: orbital-sibling companions generate their own sub-system"
```

---

### Task 9: Preview-vs-linked consistency for linked-independent companions

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (already done in Task 4 — this task adds a regression test)
- Create: `src/features/tools/star_system_generator/__tests__/companion-linked-seed.test.ts`

- [ ] **Step 1: Write the failing-or-passing test**

Create `src/features/tools/star_system_generator/__tests__/companion-linked-seed.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'linked-test',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findLinkedSeed(max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `linked-seek-${i}`
    const system = generateSystem({ ...baseOptions, seed })
    if (system.companions[0]?.mode === 'linked-independent') return seed
  }
  throw new Error('No linked-independent seed found')
}

describe('linked-independent companion seed convention', () => {
  it('uses derived seed <parent>:c1', () => {
    const parentSeed = findLinkedSeed()
    const parent = generateSystem({ ...baseOptions, seed: parentSeed })
    expect(parent.companions[0].linkedSeed?.value).toBe(`${parentSeed}:c1`)
  })

  it('parent companion.star matches the linked system primary star (preview-vs-linked consistency)', () => {
    const parentSeed = findLinkedSeed()
    const parent = generateSystem({ ...baseOptions, seed: parentSeed })
    const linked = generateSystem({ ...baseOptions, seed: parent.companions[0].linkedSeed!.value })

    expect(parent.companions[0].star.spectralType.value).toBe(linked.primary.spectralType.value)
    expect(parent.companions[0].star.massSolar.value).toBe(linked.primary.massSolar.value)
    expect(parent.companions[0].star.luminositySolar.value).toBe(linked.primary.luminositySolar.value)
  })

  it('visiting the derived seed deterministically produces the same system every time', () => {
    const parentSeed = findLinkedSeed()
    const parent = generateSystem({ ...baseOptions, seed: parentSeed })
    const linkedSeed = parent.companions[0].linkedSeed!.value
    const a = generateSystem({ ...baseOptions, seed: linkedSeed })
    const b = generateSystem({ ...baseOptions, seed: linkedSeed })
    expect(a.primary).toEqual(b.primary)
  })
})
```

- [ ] **Step 2: Run the test**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companion-linked-seed.test.ts`
Expected: the first and third tests should PASS already (from Task 4). The second (preview-vs-linked consistency) may FAIL because the linked system's `generatePrimaryStar` doesn't use the same parameters as `generateCompanionStar`. If it fails, proceed to Step 3; if it passes, skip to Step 4.

- [ ] **Step 3: Reconcile companion preview with linked primary**

There are two options here. The plan locks in option A:

**Option A (chosen):** Make the parent's `companion.star` equal whatever `generateSystem(linkedSeed)` produces as its primary, by computing the preview as exactly that.

Edit `generateStellarCompanions` in `src/features/tools/star_system_generator/lib/generator/index.ts`. Locate the block:

```ts
const star = mode === 'linked-independent'
  ? generateCompanionStar(createSeededRng(`${parentSeed}:c1`).fork('star'), primary, companionName)
  : generateCompanionStar(rng.fork('star1'), primary, companionName)
```

The path on the right of the ternary uses `generateCompanionStar` against the derived seed's `star` fork. The linked visit uses `generatePrimaryStar` against the *same* fork. To make them identical, replace the linked branch with a call to `generatePrimaryStar` against the derived seed's star fork:

```ts
const star = mode === 'linked-independent'
  ? generatePrimaryStar(createSeededRng(`${parentSeed}:c1`).fork('star'), { ...{ seed: `${parentSeed}:c1` } as GenerationOptions, distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal' } as GenerationOptions, `${primary.name.value} B`)
  : generateCompanionStar(rng.fork('star1'), primary, companionName)
```

Wait — `generatePrimaryStar` takes a full `GenerationOptions`. Instead pass through the existing options. Add `options: GenerationOptions` as a parameter to `generateStellarCompanions` and update its signature and call site accordingly:

```ts
function generateStellarCompanions(rng: SeededRng, primary: Star, parentSeed: string, options: GenerationOptions): StellarCompanion[] {
```

Then:

```ts
const star = mode === 'linked-independent'
  ? generatePrimaryStar(
      createSeededRng(`${parentSeed}:c1`).fork('star'),
      { ...options, seed: `${parentSeed}:c1` },
      `${primary.name.value} B`,
    )
  : generateCompanionStar(rng.fork('star1'), primary, companionName)
```

Update the caller in `generateSystem`:

```ts
const companions = generateStellarCompanions(rootRng.fork('companions'), basePrimary, options.seed, options)
```

Similarly update the hierarchical-triple outer entry: replace the `generateCompanionStar` call for the outer star with `generatePrimaryStar(createSeededRng(\`${parentSeed}:c2\`).fork('star'), { ...options, seed: \`${parentSeed}:c2\` }, outerName)`.

- [ ] **Step 4: Run the test to verify all three pass**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companion-linked-seed.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/index.ts \
  src/features/tools/star_system_generator/__tests__/companion-linked-seed.test.ts
git commit -m "feat: linked-independent companions use derived seed for star preview"
```

---

## Phase 3 — Report UI

### Task 10: Mode-aware Multiplicity row + per-companion cards in SystemOverview

**Files:**
- Modify: `src/features/tools/star_system_generator/components/SystemOverview.tsx`
- Create: `src/features/tools/star_system_generator/__tests__/SystemOverview-companions.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/star_system_generator/__tests__/SystemOverview-companions.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SystemOverview } from '../components/SystemOverview'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'sysov-companions',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findSeedForMode(mode: string, max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `sysov-${mode}-${i}`
    const sys = generateSystem({ ...baseOptions, seed })
    if (sys.companions[0]?.mode === mode) return seed
  }
  throw new Error(`No seed for mode ${mode}`)
}

describe('SystemOverview with companions', () => {
  it('shows a link affordance for linked-independent companions', () => {
    const seed = findSeedForMode('linked-independent')
    const sys = generateSystem({ ...baseOptions, seed })
    render(<SystemOverview system={sys} />)
    expect(screen.getByText(/Open linked system/i)).toBeTruthy()
  })

  it('shows orbital-sibling caption referring to generated bodies', () => {
    const seed = findSeedForMode('orbital-sibling')
    const sys = generateSystem({ ...baseOptions, seed })
    render(<SystemOverview system={sys} />)
    expect(screen.getByText(/Generated below/i)).toBeTruthy()
  })

  it('shows the barycenter note for circumbinary companions', () => {
    const seed = findSeedForMode('circumbinary')
    const sys = generateSystem({ ...baseOptions, seed })
    render(<SystemOverview system={sys} />)
    expect(screen.getByText(/orbit the binary's barycenter/i)).toBeTruthy()
  })

  it('shows the contact note for volatile companions', () => {
    const seed = findSeedForMode('volatile')
    const sys = generateSystem({ ...baseOptions, seed })
    render(<SystemOverview system={sys} />)
    expect(screen.getByText(/Stars are contact-touching/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/SystemOverview-companions.test.tsx`
Expected: FAIL — the current Multiple-Star Context only renders one card and shows none of these strings.

- [ ] **Step 3: Rewrite the Multiple-Star Context section**

In `src/features/tools/star_system_generator/components/SystemOverview.tsx`, locate lines 66–90 (the existing `system.companions.length ? (...) : null` block) and replace with a per-companion mapping:

```tsx
      {system.companions.length ? (
        <div className="mt-4 space-y-2">
          {system.companions.map((c) => (
            <CompanionCard key={c.id} companion={c} systemSeed={system.seed} />
          ))}
        </div>
      ) : null}
```

Add the `CompanionCard` component at the bottom of the file:

```tsx
function CompanionCard({ companion, systemSeed }: { companion: GeneratedSystem['companions'][number]; systemSeed: string }) {
  const shared = (
    <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
      {companion.companionType.value}{' '}
      <span className="font-normal text-[var(--text-tertiary)]">· {companion.separation.value}</span>
    </p>
  )

  if (companion.mode === 'linked-independent') {
    const url = `?seed=${encodeURIComponent(companion.linkedSeed!.value)}`
    return (
      <div className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm">
        <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Linked Companion System
        </h3>
        {shared}
        <p className="mt-2 text-[var(--text-secondary)]">Generated independently. This system gains +1 reachable system.</p>
        <a className="mt-2 inline-block text-[var(--accent)] underline" href={url}>Open linked system →</a>
      </div>
    )
  }

  if (companion.mode === 'orbital-sibling') {
    const bodies = companion.subSystem?.bodies ?? []
    return (
      <div className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm">
        <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Orbital Sibling Companion
        </h3>
        {shared}
        <p className="mt-2 text-[var(--text-secondary)]">
          Hosts {bodies.length} {bodies.length === 1 ? 'body' : 'bodies'}. Generated below.
        </p>
      </div>
    )
  }

  if (companion.mode === 'circumbinary') {
    return (
      <div className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm">
        <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Circumbinary Companion
        </h3>
        {shared}
        <p className="mt-2 text-[var(--text-secondary)]">
          Bodies in this system orbit the binary's barycenter. Inner habitable edge sits beyond the keep-out zone.
        </p>
      </div>
    )
  }

  // volatile
  return (
    <div className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm">
      <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        Contact / Volatile Companion
      </h3>
      {shared}
      <p className="mt-2 text-[var(--text-secondary)]">
        Stars are contact-touching. No planets formed; hazardous debris and intense GU bleed dominate the inner system.
      </p>
    </div>
  )
}
```

Also update the Multiplicity row (line 17). Replace it with:

```tsx
    {
      label: 'Multiplicity',
      value: system.companions.length === 0
        ? 'Single star'
        : system.companions.length === 1
          ? `${system.companions[0].companionType.value}`
          : `${system.companions[0].companionType.value} (${system.companions.length} companions)`,
    },
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/SystemOverview-companions.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Run the full suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/components/SystemOverview.tsx \
  src/features/tools/star_system_generator/__tests__/SystemOverview-companions.test.tsx
git commit -m "feat: mode-aware companion cards in SystemOverview"
```

---

### Task 11: Parent-link affordance for `:c<n>` seeds

**Files:**
- Modify: `src/features/tools/star_system_generator/components/SystemOverview.tsx`
- Modify: `src/features/tools/star_system_generator/__tests__/SystemOverview-companions.test.tsx`

- [ ] **Step 1: Add a failing test**

Append to `SystemOverview-companions.test.tsx`:

```tsx
describe('SystemOverview parent-link affordance', () => {
  it('renders a Return to parent system link when seed contains :c1', () => {
    const sys = generateSystem({ ...baseOptions, seed: 'parent-test:c1' })
    render(<SystemOverview system={sys} />)
    expect(screen.getByText(/Return to parent system/i)).toBeTruthy()
  })

  it('does not render a parent link for a normal seed', () => {
    const sys = generateSystem({ ...baseOptions, seed: 'parent-test' })
    render(<SystemOverview system={sys} />)
    expect(screen.queryByText(/Return to parent system/i)).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/SystemOverview-companions.test.tsx -t "parent-link"`
Expected: FAIL — no such text appears.

- [ ] **Step 3: Add the parent-link card**

In `SystemOverview.tsx`, add a helper near the top of the file:

```tsx
function extractParentSeed(seed: string): string | undefined {
  const match = seed.match(/^(.*):c\d+$/)
  return match ? match[1] : undefined
}
```

In the `SystemOverview` component, just before the companions list rendering (`{system.companions.length ? (...) : null}`), add:

```tsx
      {(() => {
        const parent = extractParentSeed(system.seed)
        if (!parent) return null
        const url = `?seed=${encodeURIComponent(parent)}`
        return (
          <div className="mt-4 rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm">
            <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Parent System
            </h3>
            <p className="mt-1 text-[var(--text-secondary)]">
              This system is the linked companion of <span className="font-mono text-[var(--text-primary)]">{parent}</span>.
            </p>
            <a className="mt-2 inline-block text-[var(--accent)] underline" href={url}>← Return to parent system</a>
          </div>
        )
      })()}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/SystemOverview-companions.test.tsx`
Expected: PASS, 6 tests total.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/components/SystemOverview.tsx \
  src/features/tools/star_system_generator/__tests__/SystemOverview-companions.test.tsx
git commit -m "feat: parent system link for companion seeds"
```

---

### Task 12: Companion sub-system section in the report

**Files:**
- Create: `src/features/tools/star_system_generator/components/CompanionSubSystem.tsx`
- Modify: `src/features/tools/star_system_generator/index.tsx` (or wherever the bodies list is rendered alongside SystemOverview)
- Create: `src/features/tools/star_system_generator/__tests__/CompanionSubSystem.test.tsx`

Before starting this task, run `grep -n "BodyList\|BodyDetailPanel\|<.*Bodies" src/features/tools/star_system_generator/index.tsx` to find the current body-rendering call site, since the existing component name may differ.

- [ ] **Step 1: Identify the body-list rendering location**

Run: `grep -n "system.bodies\|BodyList\|<BodyDetail" src/features/tools/star_system_generator/index.tsx src/features/tools/star_system_generator/components/*.tsx`
Note the file and line where the primary's bodies are rendered. The component name and props are used in Step 3.

- [ ] **Step 2: Write the failing test**

Create `src/features/tools/star_system_generator/__tests__/CompanionSubSystem.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CompanionSubSystem } from '../components/CompanionSubSystem'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'subsys-render',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

function findOrbitalSiblingSeed(max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `subsys-render-${i}`
    const sys = generateSystem({ ...baseOptions, seed })
    if (sys.companions[0]?.mode === 'orbital-sibling') return seed
  }
  throw new Error('No orbital-sibling seed found')
}

describe('CompanionSubSystem', () => {
  it('renders a section header naming the companion', () => {
    const seed = findOrbitalSiblingSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    render(<CompanionSubSystem system={sys} companion={sys.companions[0]} />)
    expect(screen.getByText(sys.companions[0].star.name.value)).toBeTruthy()
  })

  it('renders companion body count', () => {
    const seed = findOrbitalSiblingSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    render(<CompanionSubSystem system={sys} companion={sys.companions[0]} />)
    const bodyCount = sys.companions[0].subSystem!.bodies.length
    expect(screen.getByText(new RegExp(`${bodyCount}\\s+(bod(?:y|ies))`, 'i'))).toBeTruthy()
  })
})
```

- [ ] **Step 3: Create the CompanionSubSystem component**

Create `src/features/tools/star_system_generator/components/CompanionSubSystem.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { GeneratedSystem, StellarCompanion } from '../types'
import { formatStellarClass } from '../lib/stellarLabels'
import { SpectralChip, SectionHeader, sectionShellClasses } from './visual'

interface CompanionSubSystemProps {
  system: GeneratedSystem
  companion: StellarCompanion
}

export function CompanionSubSystem({ system: _system, companion }: CompanionSubSystemProps) {
  const [expanded, setExpanded] = useState(false)
  const sub = companion.subSystem
  if (!sub) return null

  const bodyCount = sub.bodies.length
  const settlementCount = sub.settlements.length
  const gateCount = sub.gates.length

  return (
    <section className={sectionShellClasses('physical')}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={expanded}
      >
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {companion.star.name.value}{' '}
            <span className="font-normal text-[var(--text-tertiary)]">· companion sub-system</span>
          </h2>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {bodyCount} {bodyCount === 1 ? 'body' : 'bodies'} · {settlementCount} settlements · {gateCount} gates
          </p>
        </div>
        <SpectralChip
          spectralType={companion.star.spectralType.value}
          label={formatStellarClass(companion.star.spectralType.value)}
        />
      </button>

      {expanded ? (
        <div className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
          <p>
            Mass {companion.star.massSolar.value} M☉ · Luminosity {companion.star.luminositySolar.value} L☉ · Age{' '}
            {companion.star.ageState.value}
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            HZ {sub.zones.habitableInnerAu.value}–{sub.zones.habitableOuterAu.value} AU · Snow line{' '}
            {sub.zones.snowLineAu.value} AU
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {sub.bodies.map((body) => (
              <li key={body.id}>
                <span className="font-mono">{body.orbitAu.value} AU</span> — {body.name.value} ({body.category.value})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
```

This is intentionally a minimal expanded view — the full body cards from the existing `BodyDetailPanel` can be plugged in later by replacing the `<ul>` with the existing component if the project has one that accepts a `bodies` prop. For this task the simpler list suffices and the test only asserts header/count text.

- [ ] **Step 4: Wire the section into the report**

Open the file you identified in Step 1 (likely `src/features/tools/star_system_generator/index.tsx`). After the primary's body list rendering, insert:

```tsx
{system.companions
  .filter((c) => c.mode === 'orbital-sibling' && c.subSystem)
  .map((c) => (
    <CompanionSubSystem key={c.id} system={system} companion={c} />
  ))}
```

Add the import at the top:

```tsx
import { CompanionSubSystem } from './components/CompanionSubSystem'
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/CompanionSubSystem.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 6: Run the full suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/tools/star_system_generator/components/CompanionSubSystem.tsx \
  src/features/tools/star_system_generator/index.tsx \
  src/features/tools/star_system_generator/__tests__/CompanionSubSystem.test.tsx
git commit -m "feat: companion sub-system section in report"
```

---

### Task 13: Aggregation counts with split display

**Files:**
- Modify: whichever component renders the settlement/gate section headers (search for it first)
- Create: `src/features/tools/star_system_generator/lib/companionAggregations.ts`
- Create: `src/features/tools/star_system_generator/__tests__/companionAggregations.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/star_system_generator/__tests__/companionAggregations.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { aggregatedCounts, formatSplitCount } from '../lib/companionAggregations'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'agg-test',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

function findOrbitalSiblingSeed(max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `agg-seek-${i}`
    const sys = generateSystem({ ...baseOptions, seed })
    if (sys.companions[0]?.mode === 'orbital-sibling') return seed
  }
  throw new Error('No orbital-sibling seed found')
}

describe('companion aggregations', () => {
  it('sums primary + companion settlements/gates/ruins', () => {
    const seed = findOrbitalSiblingSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const counts = aggregatedCounts(sys)
    expect(counts.settlements.total).toBe(sys.settlements.length + sys.companions[0].subSystem!.settlements.length)
    expect(counts.gates.total).toBe(sys.gates.length + sys.companions[0].subSystem!.gates.length)
    expect(counts.ruins.total).toBe(sys.ruins.length + sys.companions[0].subSystem!.ruins.length)
  })

  it('formats split count strings as "N total (P primary, C companion)" only when companion is non-zero', () => {
    expect(formatSplitCount(3, 0)).toBe('3')
    expect(formatSplitCount(3, 2)).toBe('5 (3 primary, 2 companion)')
    expect(formatSplitCount(0, 2)).toBe('2 (0 primary, 2 companion)')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companionAggregations.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create the helper**

Create `src/features/tools/star_system_generator/lib/companionAggregations.ts`:

```ts
import type { GeneratedSystem } from '../types'

export interface AggregatedCounts {
  settlements: { primary: number; companion: number; total: number }
  gates: { primary: number; companion: number; total: number }
  ruins: { primary: number; companion: number; total: number }
  phenomena: { primary: number; companion: number; total: number }
}

export function aggregatedCounts(system: GeneratedSystem): AggregatedCounts {
  const subSettlements = system.companions.reduce((n, c) => n + (c.subSystem?.settlements.length ?? 0), 0)
  const subGates = system.companions.reduce((n, c) => n + (c.subSystem?.gates.length ?? 0), 0)
  const subRuins = system.companions.reduce((n, c) => n + (c.subSystem?.ruins.length ?? 0), 0)
  const subPhenomena = system.companions.reduce((n, c) => n + (c.subSystem?.phenomena.length ?? 0), 0)

  return {
    settlements: {
      primary: system.settlements.length,
      companion: subSettlements,
      total: system.settlements.length + subSettlements,
    },
    gates: {
      primary: system.gates.length,
      companion: subGates,
      total: system.gates.length + subGates,
    },
    ruins: {
      primary: system.ruins.length,
      companion: subRuins,
      total: system.ruins.length + subRuins,
    },
    phenomena: {
      primary: system.phenomena.length,
      companion: subPhenomena,
      total: system.phenomena.length + subPhenomena,
    },
  }
}

export function formatSplitCount(primary: number, companion: number): string {
  if (companion === 0) return String(primary)
  return `${primary + companion} (${primary} primary, ${companion} companion)`
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/companionAggregations.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Use `formatSplitCount` in the section headers**

Run `grep -rn "system.settlements.length\|system.gates.length\|system.ruins.length\|system.phenomena.length" src/features/tools/star_system_generator/components/ src/features/tools/star_system_generator/index.tsx` to find every place that renders a raw count.

For each location, replace the raw `.length` with `formatSplitCount(system.X.length, subX)` where `subX` is summed from `system.companions[].subSystem?.X.length`. Example replacement pattern:

```tsx
// Before:
<h2>{system.settlements.length} Settlements</h2>

// After:
import { aggregatedCounts, formatSplitCount } from '../lib/companionAggregations'
// ...
const counts = aggregatedCounts(system)
<h2>{formatSplitCount(counts.settlements.primary, counts.settlements.companion)} Settlements</h2>
```

If a header currently uses an inline `.length`, just refactor to compute `counts` once near the top of that component and reference fields off it.

- [ ] **Step 6: Run the full suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/tools/star_system_generator/lib/companionAggregations.ts \
  src/features/tools/star_system_generator/__tests__/companionAggregations.test.ts \
  src/features/tools/star_system_generator/components/ \
  src/features/tools/star_system_generator/index.tsx
git commit -m "feat: aggregate primary + companion counts with split display"
```

---

### Task 14: Markdown export updates

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/export/markdown.ts`
- Create: `src/features/tools/star_system_generator/__tests__/markdown-companion.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/star_system_generator/__tests__/markdown-companion.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import { systemToMarkdown } from '../lib/export/markdown'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'md-companion',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

function findSeedForMode(mode: string, max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `md-${mode}-${i}`
    const sys = generateSystem({ ...baseOptions, seed })
    if (sys.companions[0]?.mode === mode) return seed
  }
  throw new Error(`No seed for ${mode}`)
}

describe('markdown export with companions', () => {
  it('emits a Companion System section for orbital-sibling', () => {
    const seed = findSeedForMode('orbital-sibling')
    const sys = generateSystem({ ...baseOptions, seed })
    const md = systemToMarkdown(sys)
    expect(md).toMatch(/##\s+Companion System/i)
    expect(md).toContain(sys.companions[0].star.name.value)
  })

  it('emits a Linked System line with the derived seed for linked-independent', () => {
    const seed = findSeedForMode('linked-independent')
    const sys = generateSystem({ ...baseOptions, seed })
    const md = systemToMarkdown(sys)
    expect(md).toMatch(/Linked system:\s+`/i)
    expect(md).toContain(sys.companions[0].linkedSeed!.value)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/markdown-companion.test.ts`
Expected: FAIL — markdown does not contain these sections.

- [ ] **Step 3: Identify the export function signature**

Run: `grep -n "^export function\|^export const" src/features/tools/star_system_generator/lib/export/markdown.ts | head -5`
Note the actual name (`systemToMarkdown` or similar). If the name differs, update the test import in Step 1 accordingly before the commit.

- [ ] **Step 4: Add companion sections to the markdown export**

Open `src/features/tools/star_system_generator/lib/export/markdown.ts`. Near the bottom of the main export function (just before the function returns its assembled string), insert:

```ts
for (const companion of system.companions) {
  if (companion.mode === 'orbital-sibling' && companion.subSystem) {
    sections.push(`## Companion System: ${companion.star.name.value}`)
    sections.push('')
    sections.push(`*${formatStellarClass(companion.star.spectralType.value)} · ${companion.star.massSolar.value} M☉*`)
    sections.push('')
    sections.push(`HZ ${companion.subSystem.zones.habitableInnerAu.value}–${companion.subSystem.zones.habitableOuterAu.value} AU · Snow line ${companion.subSystem.zones.snowLineAu.value} AU`)
    sections.push('')
    for (const body of companion.subSystem.bodies) {
      sections.push(`- **${body.name.value}** (${body.category.value}) at ${body.orbitAu.value} AU`)
    }
    sections.push('')
  } else if (companion.mode === 'linked-independent') {
    sections.push(`## Linked Companion System`)
    sections.push('')
    sections.push(`${companion.companionType.value} · ${companion.separation.value}`)
    sections.push('')
    sections.push(`Linked system: \`?seed=${companion.linkedSeed!.value}\``)
    sections.push('')
  }
}
```

Make sure `formatStellarClass` is imported at the top of the file. If `sections` is not the array name used in the existing implementation, adapt the pushes to whatever string-concatenation pattern the file uses (the test asserts substrings, not exact formatting).

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/markdown-companion.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 6: Run the full suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/tools/star_system_generator/lib/export/markdown.ts \
  src/features/tools/star_system_generator/__tests__/markdown-companion.test.ts
git commit -m "feat: markdown export covers companion sub-systems and links"
```

---

### Task 15: StarDetailCard chrome mode-awareness

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/chrome/StarDetailCard.tsx`
- Create: `src/features/tools/star_system_generator/__tests__/StarDetailCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/star_system_generator/__tests__/StarDetailCard.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StarDetailCard } from '../viewer3d/chrome/StarDetailCard'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'star-card',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findSeedForMode(mode: string, max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `card-${mode}-${i}`
    const sys = generateSystem({ ...baseOptions, seed })
    if (sys.companions[0]?.mode === mode) return seed
  }
  throw new Error(`No seed for ${mode}`)
}

describe('StarDetailCard', () => {
  it('shows Open linked system link for linked-independent companion', () => {
    const seed = findSeedForMode('linked-independent')
    const sys = generateSystem({ ...baseOptions, seed })
    render(<StarDetailCard system={sys} />)
    expect(screen.getByText(/Open linked system/i)).toBeTruthy()
  })

  it('does not show the link for orbital-sibling', () => {
    const seed = findSeedForMode('orbital-sibling')
    const sys = generateSystem({ ...baseOptions, seed })
    render(<StarDetailCard system={sys} />)
    expect(screen.queryByText(/Open linked system/i)).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/StarDetailCard.test.tsx`
Expected: FAIL — chrome card does not render a link.

- [ ] **Step 3: Update the chrome card**

Replace the companions block in `src/features/tools/star_system_generator/viewer3d/chrome/StarDetailCard.tsx` (lines 24–35) with:

```tsx
      {system.companions.length > 0 ? (
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Companions</p>
          <ul className="mt-1 space-y-1 text-xs">
            {system.companions.map((c) => (
              <li key={c.id} className="rounded border border-[var(--border)] bg-[var(--card-elevated)] px-2 py-1">
                <div>{c.companionType.value} · {c.separation.value}</div>
                {c.mode === 'linked-independent' && c.linkedSeed ? (
                  <a
                    className="mt-1 inline-block text-[10px] text-[var(--accent)] underline"
                    href={`?seed=${encodeURIComponent(c.linkedSeed.value)}`}
                  >
                    Open linked system →
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/StarDetailCard.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/chrome/StarDetailCard.tsx \
  src/features/tools/star_system_generator/__tests__/StarDetailCard.test.tsx
git commit -m "feat: chrome companion list shows linked-system link"
```

---

## Phase 4 — 3D viewer

### Task 16: SceneGraph types — sub-systems and distant markers

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/types.ts`

- [ ] **Step 1: Read the current SceneGraph definition**

Run: `grep -n "SceneGraph" src/features/tools/star_system_generator/viewer3d/types.ts | head -5`
Then read the surrounding lines to see what shape is being used.

- [ ] **Step 2: Extend the SystemSceneGraph type**

In `src/features/tools/star_system_generator/viewer3d/types.ts`, locate the existing `SystemSceneGraph` interface (around line 208, where `companions: StarVisual[]` is defined). Add two new types just above the interface, and add two fields to the interface:

```ts
export interface DistantStarMarker {
  id: string
  visual: StarVisual
  label: string
  linkedSeed: string
}

export interface SubSystemVisual {
  star: StarVisual
  bodies: BodyVisual[]
  belts: BeltVisual[]
}

export interface SystemSceneGraph {
  star: StarVisual
  companions: StarVisual[]
  zones: { habitableInner: number; habitable: number; habitableOuter: number; snowLine: number }
  bodies: BodyVisual[]
  belts: BeltVisual[]
  hazards: HazardVisual[]
  guBleeds: GuBleedVisual[]
  phenomena: PhenomenonMarker[]
  ruins: RuinMarker[]
  sceneRadius: number
  subSystems: SubSystemVisual[]    // NEW
  distantMarkers: DistantStarMarker[] // NEW
  circumbinaryKeepOut?: number      // NEW — scene-radius of the no-go ring for circumbinary mode, or undefined
}
```

The TypeScript compiler will now require the scene-graph builder to populate `subSystems` and `distantMarkers`. Each downstream task in this phase adds the actual population logic.

- [ ] **Step 3: Initialize the new arrays in the scene graph builder**

In `src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts`, locate the final return of `buildSceneGraph` (around line 481, where `companions` is part of the returned object). Add `subSystems: []`, `distantMarkers: []`, and `circumbinaryKeepOut: undefined` to the returned object as a starting point:

```ts
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
    subSystems: [],
    distantMarkers: [],
    circumbinaryKeepOut: undefined,
  }
```

- [ ] **Step 4: Run the full suite**

Run: `npm run test`
Expected: PASS. No new behavior; this is a type-level scaffolding step.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/types.ts \
  src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts
git commit -m "refactor: extend SceneGraph with subSystems and distantMarkers"
```

---

### Task 17: Populate `distantMarkers` for linked-independent companions

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts`
- Modify: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/visualProfiles.test.ts` (add a new test or create a new test file alongside)

- [ ] **Step 1: Create a new test file**

Create `src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-companions.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildSceneGraph } from '../sceneGraph'
import { generateSystem } from '../../../lib/generator'
import type { GenerationOptions } from '../../../types'

const baseOptions: GenerationOptions = {
  seed: 'scene-companion',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findSeedForMode(mode: string, max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `scene-${mode}-${i}`
    const sys = generateSystem({ ...baseOptions, seed })
    if (sys.companions[0]?.mode === mode) return seed
  }
  throw new Error(`No seed for ${mode}`)
}

describe('sceneGraph companion handling', () => {
  it('emits a distantMarker for linked-independent companions', () => {
    const seed = findSeedForMode('linked-independent')
    const sys = generateSystem({ ...baseOptions, seed })
    const graph = buildSceneGraph(sys)
    expect(graph.distantMarkers).toHaveLength(1)
    expect(graph.distantMarkers[0].linkedSeed).toBe(sys.companions[0].linkedSeed!.value)
  })

  it('emits no distantMarker for orbital-sibling', () => {
    const seed = findSeedForMode('orbital-sibling')
    const sys = generateSystem({ ...baseOptions, seed })
    const graph = buildSceneGraph(sys)
    expect(graph.distantMarkers).toHaveLength(0)
  })

  it('emits no distantMarker for systems with no companion', () => {
    const seed = 'no-companion-test'
    let sys = generateSystem({ ...baseOptions, seed })
    if (sys.companions.length > 0) {
      // try a few more seeds to find one with no companion
      for (let i = 0; i < 50; i++) {
        sys = generateSystem({ ...baseOptions, seed: `${seed}-${i}` })
        if (sys.companions.length === 0) break
      }
    }
    if (sys.companions.length > 0) return // skip if can't find one
    const graph = buildSceneGraph(sys)
    expect(graph.distantMarkers).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-companions.test.ts`
Expected: FAIL — `distantMarkers` is always `[]`.

- [ ] **Step 3: Build distant markers in `buildSceneGraph`**

In `src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts`, near where `companions` is computed (around line 453), add a helper and populate the new array:

```ts
function buildDistantMarker(companion: StellarCompanion, outermostBodyAu: number, hzCenterAu: number, scaleMode: OrbitScaleMode): DistantStarMarker {
  const visuals = companionStarVisuals(companion)
  const sceneRadius = auToScene(Math.max(outermostBodyAu * 1.6, hzCenterAu * 4), hzCenterAu, scaleMode)
  const angle = hashToUnit(`distant#${companion.id}`) * Math.PI * 2
  return {
    id: companion.id,
    visual: {
      id: companion.id,
      coreColor: visuals.coreColor,
      coronaColor: visuals.coronaColor,
      coronaRadius: visuals.coronaRadius * 0.4,
      rayCount: Math.max(2, Math.floor(visuals.rayCount / 2)),
      bloomStrength: visuals.bloomStrength * 0.5,
      flareStrength: visuals.flareStrength * 0.4,
      pulseSpeed: visuals.pulseSpeed,
      rayColor: visuals.rayColor,
      position: [Math.cos(angle) * sceneRadius, 0, Math.sin(angle) * sceneRadius],
    },
    label: `${companion.star.name.value} →`,
    linkedSeed: companion.linkedSeed?.value ?? '',
  }
}
```

Add `DistantStarMarker` and `StellarCompanion` to the imports at the top of the file (the latter is already imported).

Then in `buildSceneGraph`, after the existing `companions` mapping line, compute the markers separately and pass them through. Locate:

```ts
const companions = system.companions.map((c) => buildCompanion(c, star, hzCenterAu, scaleMode))
```

Replace with:

```ts
const inSceneCompanions = system.companions.filter((c) => c.mode !== 'linked-independent')
const linkedCompanions = system.companions.filter((c) => c.mode === 'linked-independent')
const companions = inSceneCompanions.map((c) => buildCompanion(c, star, hzCenterAu, scaleMode))

const outermostBodyAu = system.bodies.reduce((max, b) => Math.max(max, b.orbitAu.value), 0)
const distantMarkers = linkedCompanions.map((c) => buildDistantMarker(c, outermostBodyAu, hzCenterAu, scaleMode))
```

In the returned object replace `distantMarkers: []` with `distantMarkers`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-companions.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Run the full suite**

Run: `npm run test`
Expected: PASS. The existing in-scene companion rendering is unchanged for non-linked modes; linked companions just no longer appear via `buildCompanion` (they're rendered as markers in the next task).

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts \
  src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-companions.test.ts
git commit -m "feat: scene graph emits distant markers for linked companions"
```

---

### Task 18: Render distant markers in the scene with click navigation

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`

- [ ] **Step 1: Locate where companions are currently rendered**

Run: `grep -n "graph.companions\|companions.map\|DistantStar" src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`
Note the spot (around line 106 in `Scene.tsx`) where `graph.companions.map((c) => …)` runs.

- [ ] **Step 2: Render distant markers next to the in-scene companions**

Add an HTML overlay or simple `<mesh>` for each `distantMarker`. Since the scene is React Three Fiber, a small clickable mesh with an HTML annotation is the lowest-friction option. Add the import at the top:

```tsx
import { Html } from '@react-three/drei'
```

(If `@react-three/drei` is not yet in the project, use a simpler approach: render a small `<mesh>` and place a DOM-positioned link via the existing chrome layer. Inspect `package.json` for `@react-three/drei` first: `grep '@react-three' package.json`. If not present, skip `Html` and instead just render the marker mesh; the clickable affordance will live only in the chrome card from Task 15.)

Just after the existing `graph.companions.map((c) => …)` block, add:

```tsx
{graph.distantMarkers.map((m) => (
  <group key={m.id} position={m.visual.position}>
    <mesh
      onClick={(e) => {
        e.stopPropagation()
        if (typeof window !== 'undefined' && m.linkedSeed) {
          const url = new URL(window.location.href)
          url.searchParams.set('seed', m.linkedSeed)
          window.location.href = url.toString()
        }
      }}
    >
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshBasicMaterial color={m.visual.coreColor} />
    </mesh>
  </group>
))}
```

If `@react-three/drei` is installed, additionally wrap the mesh in an `<Html>` overlay so the label appears next to the marker:

```tsx
    <Html center sprite>
      <a
        href={`?seed=${encodeURIComponent(m.linkedSeed)}`}
        className="rounded bg-black/70 px-2 py-1 text-[10px] text-white underline"
      >
        {m.label}
      </a>
    </Html>
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`
Open the local URL (likely http://localhost:3000/tools/star_system_generator/), and try seeds until one produces a linked-independent companion (you can use the seeds your tests found, e.g., `linked-seek-0` through `linked-seek-50`). Verify:
- A dim small star appears near the edge of the scene.
- Clicking it navigates to a new URL with the `:c1` seed.
- That destination page shows a "Return to parent system" affordance (from Task 11).

Since this is a UI change, automated tests are not the strongest signal here. Record any visual issues to address in a polish commit, but proceed if the click navigation works.

- [ ] **Step 4: Run the full test suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx
git commit -m "feat: render and navigate distant linked-companion markers"
```

---

### Task 19: Render orbital-sibling sub-systems in the scene

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/types.ts`
- Modify: `src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-companions.test.ts`

- [ ] **Step 1: Add a failing test**

Append to `sceneGraph-companions.test.ts`:

```ts
  it('emits a subSystem entry with bodies for orbital-sibling companions', () => {
    const seed = findSeedForMode('orbital-sibling')
    const sys = generateSystem({ ...baseOptions, seed })
    const graph = buildSceneGraph(sys)
    expect(graph.subSystems).toHaveLength(1)
    expect(graph.subSystems[0].bodies.length).toBeGreaterThan(0)
    expect(graph.subSystems[0].star.id).toBe(sys.companions[0].id)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-companions.test.ts -t "orbital-sibling"`
Expected: FAIL — `subSystems` is empty.

- [ ] **Step 3: Verify the SubSystemVisual type is already in place**

The `SubSystemVisual` type was added in Task 16 with the shape:

```ts
export interface SubSystemVisual {
  star: StarVisual
  bodies: BodyVisual[]
  belts: BeltVisual[]
}
```

`BodyVisual.orbitRadius` is a scalar (relative to its parent's origin), so a sub-system's bodies orbit *relative to the companion star's position*. The actual world-space positioning happens in `Scene.tsx` via a `<group position={companionStar.position}>` wrapper. No new `OrbitVisual` type is needed — orbits are derived from `BodyVisual.orbitRadius` in the renderer.

- [ ] **Step 4: Build sub-system visuals**

The existing `buildBody(body, system, hzCenterAu, scaleMode, orbitIndex)` reads `system.zones`, `system.settlements`, `system.gates`, `system.ruins`. To reuse it for sub-system bodies, construct a shim system whose zones/sites are the sub-system's:

In `sceneGraph.ts`, just before the existing `return {...}` at the bottom of `buildSceneGraph`, add:

```ts
const subSystems: SubSystemVisual[] = []
for (let idx = 0; idx < system.companions.length; idx++) {
  const c = system.companions[idx]
  if (c.mode !== 'orbital-sibling' || !c.subSystem) continue

  const companionStar = buildCompanion(c, star, hzCenterAu, scaleMode)
  const subHzCenter = c.subSystem.zones.habitableCenterAu.value > 0
    ? c.subSystem.zones.habitableCenterAu.value
    : 1

  // Shim a system view for buildBody: same identity, but the zones/sites
  // come from the sub-system so per-body context is correct.
  const subSystemShim: GeneratedSystem = {
    ...system,
    zones: c.subSystem.zones,
    bodies: c.subSystem.bodies,
    settlements: c.subSystem.settlements,
    gates: c.subSystem.gates,
    ruins: c.subSystem.ruins,
    phenomena: c.subSystem.phenomena,
  }

  const sortedSubBodies = [...c.subSystem.bodies].sort((l, r) => l.orbitAu.value - r.orbitAu.value)
  const subOrbitIndex = new Map(sortedSubBodies.map((body, i) => [body.id, i]))
  const subNonBelt = sortedSubBodies.filter((b) => b.category.value !== 'belt')
  const subBeltBodies = sortedSubBodies.filter((b) => b.category.value === 'belt')

  const subBodies = applyBodyOrbitClearance(
    subNonBelt.map((b) => buildBody(b, subSystemShim, subHzCenter, scaleMode, subOrbitIndex.get(b.id) ?? 0)),
  )
  const subBelts = subBeltBodies.map((b) => buildBelt(b, subHzCenter, scaleMode, subOrbitIndex.get(b.id) ?? 0))

  subSystems.push({ star: companionStar, bodies: subBodies, belts: subBelts })
}
```

Return `subSystems` instead of `subSystems: []` in the final returned object.

Also update the filter line from Task 17 — orbital-sibling companions now have their star carried by `subSystems[i].star`, so exclude them from the top-level `companions` array. Replace:

```ts
const inSceneCompanions = system.companions.filter((c) => c.mode !== 'linked-independent')
```

with:

```ts
const inSceneCompanions = system.companions.filter((c) => c.mode !== 'linked-independent' && c.mode !== 'orbital-sibling')
```

After Task 19, the top-level `companions` array contains only volatile and circumbinary companions. Their rendering via `graph.companions.map(...)` in `Scene.tsx` is unchanged.

- [ ] **Step 5: Render sub-system bodies in `Scene.tsx`**

The existing renderers use `<Star>`, `<Body>`, `<Belt>`, and `<Orbit>`. `<Star>` reads its own position from the `star.position` prop and renders at that world position. `<Body>` and `<Belt>` use `orbitRadius` relative to their group's origin — so we wrap them in a `<group position={sub.star.position}>` to make them orbit the companion star.

After the existing `<RuinPins ruins={graph.ruins.filter(...)} />` line (or wherever the top-level scene content ends), add:

```tsx
{graph.subSystems.map((sub) => (
  <Fragment key={sub.star.id}>
    <Star star={sub.star} />
    <group position={sub.star.position}>
      {layers.physical ? sub.bodies.map((body) => (
        <Orbit key={`sub-orbit-${body.id}`} radius={body.orbitRadius} tiltY={body.orbitTiltY} color="#a07eff" />
      )) : null}
      {sub.bodies.map((body) => (
        <Body key={`sub-body-${body.id}`} body={body} />
      ))}
      {layers.physical ? sub.belts.map((b) => (
        <Belt key={`sub-belt-${b.id}`} belt={b} />
      )) : null}
    </group>
  </Fragment>
))}
```

Add `Fragment` to the existing `import { ... } from 'react'` line at the top of the file. The `#a07eff` orbit color is a distinct violet so a reader can tell sub-system orbits apart from the primary's blue.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-companions.test.ts`
Expected: PASS, including the new orbital-sibling test.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`
Find a seed that produces orbital-sibling (e.g., `subsys-seek-0`+) and confirm:
- A second star is rendered offset from the primary.
- Its bodies appear around it with their own orbit rings, visually distinct from the primary's.

- [ ] **Step 8: Run the full suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/types.ts \
  src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts \
  src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx \
  src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-companions.test.ts
git commit -m "feat: render orbital-sibling sub-systems with own body orbits"
```

---

### Task 20: Touching-pair visual for volatile, no-go ring for circumbinary

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`

- [ ] **Step 1: Adjust the companion offset by mode**

In `sceneGraph.ts`, locate `buildCompanion` (line 72). Modify it to take the companion's mode into account:

```ts
function buildCompanion(companion: StellarCompanion, _primary: StarVisual, hzCenterAu: number, scaleMode: OrbitScaleMode): StarVisual {
  const visuals = companionStarVisuals(companion)
  const baseOffset = companionOffset(companion.separation.value, hzCenterAu, scaleMode)
  const offset = companion.mode === 'volatile' ? baseOffset * 0.1 : baseOffset
  const angle = hashToUnit(`companion#${companion.id}`) * Math.PI * 2
  return {
    id: companion.id,
    coreColor: visuals.coreColor,
    coronaColor: visuals.coronaColor,
    coronaRadius: visuals.coronaRadius * (companion.mode === 'volatile' ? 1.4 : 1),
    rayCount: visuals.rayCount,
    bloomStrength: visuals.bloomStrength * (companion.mode === 'volatile' ? 1.5 : 1),
    flareStrength: visuals.flareStrength,
    pulseSpeed: visuals.pulseSpeed,
    rayColor: visuals.rayColor,
    position: [Math.cos(angle) * offset, 0, Math.sin(angle) * offset],
  }
}
```

- [ ] **Step 2: Compute and emit the circumbinary keep-out ring radius**

In `sceneGraph.ts`, near where companions are processed in `buildSceneGraph`, compute `circumbinaryKeepOut`:

```ts
const circumbinaryCompanion = system.companions.find((c) => c.mode === 'circumbinary')
const circumbinaryKeepOut = circumbinaryCompanion
  ? auToScene(2 * separationToBucketAu(circumbinaryCompanion.separation.value), hzCenterAu, scaleMode)
  : undefined
```

Replace the `circumbinaryKeepOut: undefined` in the returned object with `circumbinaryKeepOut`. (`separationToBucketAu` was already imported in Task 2.)

- [ ] **Step 3: Render the no-go ring in Scene.tsx**

Inside the `layers.physical ? (<>…</>) : null` block in `Scene.tsx`, after the `<Zones>` element, add:

```tsx
{graph.circumbinaryKeepOut !== undefined ? (
  <Orbit
    radius={graph.circumbinaryKeepOut}
    tiltY={0}
    color="#ff6f6f"
  />
) : null}
```

The red orbit ring marks the dynamical no-go zone visually. (`<Orbit>` is already imported in this file from Task 18's edits.)

- [ ] **Step 4: Run the full suite**

Run: `npm run test`
Expected: PASS. No tests assert pixel-level visuals; existing tests check structure only.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`. Try seeds that produce each mode and confirm:
- `volatile`: the two stars look fused with a strong shared bloom.
- `circumbinary`: the companion sits close to the primary; a red keep-out ring is visible around the inner zone.
- `orbital-sibling`: the companion sits noticeably offset, with its own bodies (from Task 19) on violet orbit rings.
- `linked-independent`: the distant marker sits at the edge (from Task 17/18).

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts \
  src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx
git commit -m "feat: volatile touching-pair and circumbinary keep-out ring"
```

---

## Phase 5 — Polish and final integration

### Task 21: Generator determinism test extension

**Files:**
- Modify: `src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts`

- [ ] **Step 1: Add tests for companion determinism**

In the existing `describe('generateSystem', ...)` block, append:

```ts
  it('produces the same companions array for the same seed across multiple runs', () => {
    const opts: GenerationOptions = { ...options, seed: 'det-companion-1' }
    const a = generateSystem(opts)
    const b = generateSystem(opts)
    expect(a.companions).toEqual(b.companions)
  })

  it('produces a deterministic linked-independent linkedSeed across runs', () => {
    // Try a few seeds until one produces a linked-independent companion.
    let found = false
    for (let i = 0; i < 200 && !found; i++) {
      const opts: GenerationOptions = { ...options, seed: `det-linked-${i}` }
      const a = generateSystem(opts)
      const b = generateSystem(opts)
      if (a.companions[0]?.mode === 'linked-independent') {
        expect(a.companions[0].linkedSeed?.value).toBe(b.companions[0].linkedSeed?.value)
        found = true
      }
    }
    expect(found).toBe(true)
  })
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts
git commit -m "test: companion determinism and linkedSeed stability"
```

---

### Task 22: End-to-end verification and cleanup

**Files:**
- (read-only) the full `src/features/tools/star_system_generator/` tree

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: All tests PASS.

- [ ] **Step 2: Run lint and type check**

Run: `npm run lint`
Expected: No errors.

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Manual smoke test of all four modes**

Run: `npm run dev`. In sequence, load each of these seeds (using the seeds your tests found, or generate fresh ones) and verify the listed behaviors:

- **A seed producing `volatile`**: SystemOverview shows "Contact / Volatile Companion" card. The only body in the report is a hazard belt. The 3D scene shows a fused pair.
- **A seed producing `circumbinary`**: SystemOverview shows "Circumbinary Companion" card. Bodies are present; the innermost body's orbit is greater than `2 × bucket-AU`. The 3D scene shows the two stars close together.
- **A seed producing `orbital-sibling`**: SystemOverview shows "Orbital Sibling Companion" card with body count. A "Companion Sub-System" section appears below the primary's bodies, collapsible, showing the companion's bodies. The 3D scene shows a second star with its own bodies and orbit rings.
- **A seed producing `linked-independent`**: SystemOverview shows "Linked Companion System" card with an "Open linked system →" link. The 3D scene shows a dim distant star at the edge. Clicking the link navigates to `?seed=<parent>:c1`. The new page's SystemOverview shows a "Return to parent system" card. The companion's `star` info in the parent matches the linked page's primary star info.
- **A seed producing `Hierarchical triple`**: SystemOverview shows two companion cards (one inner orbital-sibling, one outer linked-independent). The Sub-System section is present for the inner. The distant marker is present for the outer.

- [ ] **Step 4: Confirm no orphaned code**

Run: `grep -n "companion-1" src/features/tools/star_system_generator/` and verify the only hits are intentional ID strings in the generator. There should be no leftover assumptions of "exactly one companion" in component code (you can spot this by reviewing any `companions[0]` access that doesn't guard on length first).

- [ ] **Step 5: Final commit if cleanup was needed**

If any cleanup edits were made during smoke-testing or Step 4, commit them:

```bash
git add -A
git commit -m "chore: cleanup after companion stars verification"
```

If nothing changed, skip the commit.

- [ ] **Step 6: Push the branch**

```bash
git push -u origin develop
```

(or whichever branch you're on — confirm with `git status` first.)

---

## Self-review checklist for the implementer

After all 22 tasks are complete, verify:

- [ ] Spec coverage: every section in `docs/superpowers/specs/2026-05-11-companion-stars-design.md` maps to at least one completed task.
- [ ] No `any` types were introduced; all new fields are properly typed.
- [ ] All unused parameters are prefixed with underscore.
- [ ] Aggregation counts (Task 13) actually appear in section headers (this is the easiest one to drift on).
- [ ] No regressions in `generator-determinism.test.ts`, `validation.test.ts`, `StarSystemGenerator.test.tsx`, or `display-context.test.tsx`.
- [ ] The 3D viewer renders correctly across all five mode combinations in the smoke test list.
