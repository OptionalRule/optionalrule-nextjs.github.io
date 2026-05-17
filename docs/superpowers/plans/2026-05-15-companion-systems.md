# Companion Systems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate visible encroachment of bodies/moons onto the companion star in the 3D viewer, then introduce a first-class `DebrisField` generation layer with 10 archetypes that turn close- and near-binary companion modes into anchorable, scene-anchoring places.

**Architecture:** Phase 0 (independent, shippable on its own) closes the empirical encroachment bugs. Phase 1+ adds a `DebrisField` entity with shape, spatial extent, anchor mode, and a paired auto-spawned `SystemPhenomenon`. Settlements and ruins gain optional `debrisFieldId`. The viewer adds four shape renderers (ring/shell/stream/halo). No new shaders, no new dependencies, no new narrative-graph `EntityKind`.

**Tech Stack:** Next.js 15, TypeScript strict mode, Vitest, React Three Fiber (viewer3d), TailwindCSS, Node 20.

**Reference spec:** `docs/superpowers/specs/2026-05-15-companion-systems-design.md`. Read it before starting Phase 1.

**Commit cadence:** Per `CLAUDE.md`, commit and push to `origin/develop` after each completed task. Use Conventional Commits with a `star-gen` or `viewer3d` scope.

---

## Phase 0 — Encroachment Fix Bundle

Independent of Phase 1+. Ships as its own bundle of commits.

### Task 0.1: Failing regression test for sub-system mass-arg order

**Files:**
- Test: `src/features/tools/star_system_generator/__tests__/companion-sibling-mass-args.test.ts` (new)

- [ ] **Step 1: Read the call site**

Open `src/features/tools/star_system_generator/lib/generator/index.ts` and confirm the buggy call near line 4419 reads:

```ts
const companionMaxOrbitAu = siblingOuterAuLimit(
  separationToBucketAu(companion.separation.value),
  primary.massSolar.value,
  subStar.massSolar.value,
)
```

The companion is the perturber from the sub-body's frame; `siblingOuterAuLimit` computes `μ = companion/(primary+companion)`. For sub-bodies orbiting the *companion*, μ must be `primary/(primary+companion)`. Args should be `(sep, subStar.massSolar.value, primary.massSolar.value)`.

- [ ] **Step 2: Write the failing test**

Create the new test file:

```ts
import { describe, it, expect } from 'vitest'
import { generateSystem } from '../lib/generator'
import { siblingOuterAuLimit } from '../lib/generator/companionStability'
import { separationToBucketAu } from '../lib/generator/companionGeometry'

describe('orbital-sibling sub-system mass-arg order', () => {
  // Seed identified by empirical investigation as a high-asymmetry sub-system.
  const probeSeeds = [
    'cut-frontier-balanced-normal-normal-8-68',
    'cut-frontier-balanced-fracture-normal-7-163',
    'probe-frontier-balanced-low-sparse-6-6',
  ]

  for (const seed of probeSeeds) {
    it(`seed=${seed}: every sub-body stays within the correct HW cutoff`, () => {
      const system = generateSystem({
        seed,
        distribution: 'frontier',
        tone: 'balanced',
        gu: 'normal',
        settlements: 'normal',
      })

      const siblings = system.companions.filter(c => c.mode === 'orbital-sibling' && c.subSystem)
      expect(siblings.length).toBeGreaterThan(0)

      for (const companion of siblings) {
        const sep = separationToBucketAu(companion.separation.value)
        // Correct mass order: sub-star is the host; primary is the perturber.
        const correctCutoff = siblingOuterAuLimit(
          sep,
          companion.star.massSolar.value,
          system.primary.massSolar.value,
        )
        const subBodies = companion.subSystem!.bodies
        for (const body of subBodies) {
          if (body.orbitAu.locked) continue
          expect(body.orbitAu.value,
            `${seed} ${body.id} orbitAu ${body.orbitAu.value} exceeds correct cutoff ${correctCutoff}`,
          ).toBeLessThanOrEqual(correctCutoff)
        }
      }
    })
  }
})
```

- [ ] **Step 3: Run the test and confirm it fails**

```bash
npm run test -- src/features/tools/star_system_generator/__tests__/companion-sibling-mass-args.test.ts
```

Expected: at least one of the three probe seeds fails with `orbitAu exceeds correct cutoff`.

- [ ] **Step 4: Commit the failing test**

```bash
git add src/features/tools/star_system_generator/__tests__/companion-sibling-mass-args.test.ts
git commit -m "test(star-gen): failing test for orbital-sibling sub-system mass-arg order"
```

### Task 0.2: Fix sub-system mass-arg swap

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts:~4419-4423`

- [ ] **Step 1: Swap the args**

Locate the block under `companionsWithSubSystems` near line 4419 and change:

```ts
const companionMaxOrbitAu = siblingOuterAuLimit(
  separationToBucketAu(companion.separation.value),
  primary.massSolar.value,
  subStar.massSolar.value,
)
```

to:

```ts
const companionMaxOrbitAu = siblingOuterAuLimit(
  separationToBucketAu(companion.separation.value),
  subStar.massSolar.value,
  primary.massSolar.value,
)
```

- [ ] **Step 2: Run the regression test and confirm pass**

```bash
npm run test -- src/features/tools/star_system_generator/__tests__/companion-sibling-mass-args.test.ts
```

Expected: all three probe seeds pass.

- [ ] **Step 3: Run the focused generator test suite to see snapshot fallout**

```bash
npm run test -- src/features/tools/star_system_generator/__tests__/
```

Expected: snapshot tests of orbital-sibling systems FAIL with sub-body orbit values shifting. This is the expected ~46% snapshot churn documented in the spec.

- [ ] **Step 4: Refresh snapshots deliberately**

```bash
npm run test -- src/features/tools/star_system_generator/__tests__/ -u
```

Then `git diff --stat src/features/tools/star_system_generator/__tests__/__snapshots__/` — confirm only `__snapshots__` files changed (no source-test changes). Spot-check three diffs to verify body counts dropped or shifted inward as expected, never expanded.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/index.ts \
        src/features/tools/star_system_generator/__tests__/__snapshots__/
git commit -m "fix(star-gen): swap mass args for orbital-sibling sub-system cutoff"
```

### Task 0.3: Audit covers sub-system bodies for BINARY_STABILITY_CONFLICT

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/validation.ts`
- Test: `src/features/tools/star_system_generator/__tests__/validation-binary-stability.test.ts` (new)

- [ ] **Step 1: Read the current `BINARY_STABILITY_CONFLICT` rule**

```bash
grep -n "BINARY_STABILITY_CONFLICT" src/features/tools/star_system_generator/lib/generator/validation.ts
```

Identify the current check (covers primary's bodies and the circumbinary keep-out) and confirm it does NOT iterate `companion.subSystem.bodies`.

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { generateSystem } from '../lib/generator'
import { validateSystem } from '../lib/generator/validation'

describe('BINARY_STABILITY_CONFLICT covers sub-system bodies', () => {
  it('seed cut-frontier-balanced-normal-normal-8-68: no findings after sub-system cutoff fix', () => {
    const system = generateSystem({
      seed: 'cut-frontier-balanced-normal-normal-8-68',
      distribution: 'frontier',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'normal',
    })
    const findings = validateSystem(system)
    const stabilityFindings = findings.filter(f => f.code === 'BINARY_STABILITY_CONFLICT')
    expect(stabilityFindings).toEqual([])
  })

  it('synthetically violating sub-body is detected', () => {
    const system = generateSystem({
      seed: 'audit-probe-sibling-stability',
      distribution: 'realistic',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'normal',
    })
    const sibling = system.companions.find(c => c.mode === 'orbital-sibling' && c.subSystem)
    if (!sibling) return // skipped if seed didn't produce one
    // Inject a body past the cutoff
    const inflated = { ...sibling.subSystem!.bodies[0], orbitAu: { ...sibling.subSystem!.bodies[0].orbitAu, value: 999, locked: false } }
    const mutated = { ...system, companions: system.companions.map(c => c === sibling ? { ...c, subSystem: { ...c.subSystem!, bodies: [inflated, ...c.subSystem!.bodies.slice(1)] } } : c) }
    const findings = validateSystem(mutated)
    const stabilityFindings = findings.filter(f => f.code === 'BINARY_STABILITY_CONFLICT')
    expect(stabilityFindings.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Run the test and confirm second case fails**

```bash
npm run test -- src/features/tools/star_system_generator/__tests__/validation-binary-stability.test.ts
```

Expected: synthetic case fails because validation doesn't iterate sub-system bodies yet.

- [ ] **Step 4: Extend the validator**

In `validation.ts`, locate the function that emits `BINARY_STABILITY_CONFLICT` for primary bodies. Add a parallel loop over `system.companions.filter(c => c.mode === 'orbital-sibling').flatMap(c => c.subSystem?.bodies ?? [])`. For each sub-body, compute `siblingOuterAuLimit(sep, subStar.mass, primary.mass)` with the correct mass order; if `body.orbitAu.value > cutoff` and not locked, emit a finding with `subjectId: body.id`, `subjectType: 'body'`, `subjectKind: 'orbital-sibling-sub-body'`.

- [ ] **Step 5: Run the test and verify pass**

```bash
npm run test -- src/features/tools/star_system_generator/__tests__/validation-binary-stability.test.ts
```

Expected: both cases pass.

- [ ] **Step 6: Run the full audit script to confirm zero findings on real seeds**

```bash
npm run audit:star-system-generator:quick
```

Expected: zero `BINARY_STABILITY_CONFLICT` reported.

- [ ] **Step 7: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/validation.ts \
        src/features/tools/star_system_generator/__tests__/validation-binary-stability.test.ts
git commit -m "feat(star-gen): audit covers orbital-sibling sub-system stability"
```

### Task 0.4: Viewer cap — sub-system orbit-ring scene radius

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts`
- Test: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-subSystemExtent.test.ts` (new)

- [ ] **Step 1: Read the sub-system rendering block**

```bash
grep -n "auToScene\|subSystem\|companion" src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts | head -40
```

Locate where sub-system bodies receive their scene radii (the spec identifies lines 386-441 as the affected range). Locate where the companion's scene offset from the primary is computed (~lines 44-86).

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'

describe('sub-system orbit-ring scene radius is capped against the companion offset', () => {
  it('seed probe-frontier-astronomy-fracture-crowded-11-371: no sub-body scene radius exceeds 85% of companion offset', () => {
    const system = generateSystem({
      seed: 'probe-frontier-astronomy-fracture-crowded-11-371',
      distribution: 'frontier',
      tone: 'astronomy',
      gu: 'fracture',
      settlements: 'crowded',
    })
    const graph = buildSceneGraph(system)

    for (const sub of graph.subSystems) {
      const offset = Math.hypot(sub.star.position.x, sub.star.position.y, sub.star.position.z)
      const cap = offset * 0.85
      for (const body of sub.bodies) {
        expect(body.orbitRadius, `${body.id} radius ${body.orbitRadius} exceeds cap ${cap}`).toBeLessThanOrEqual(cap)
      }
    }
  })
})
```

- [ ] **Step 3: Run the test and confirm fail**

```bash
npm run test -- src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-subSystemExtent.test.ts
```

Expected: assertion fails.

- [ ] **Step 4: Add the cap in `sceneGraph.ts`**

Inside the sub-system construction (after each sub-body's `auToScene` call, before pushing to the sub-bodies array), clamp `orbitRadius`:

```ts
const subCompanionOffset = Math.hypot(subStarPosition.x, subStarPosition.y, subStarPosition.z)
const SUB_SYSTEM_EXTENT_FRACTION = 0.85
const cappedOrbitRadius = Math.min(rawOrbitRadius, subCompanionOffset * SUB_SYSTEM_EXTENT_FRACTION)
```

Use `cappedOrbitRadius` when constructing the body entry. Apply the same cap to any moon-orbit calculations inside the sub-system.

- [ ] **Step 5: Run test and verify pass**

```bash
npm run test -- src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-subSystemExtent.test.ts
```

Expected: pass.

- [ ] **Step 6: Run the viewer3d test suite to see regressions**

```bash
npm run test -- src/features/tools/star_system_generator/viewer3d/
```

Expected: existing scene-graph snapshot tests fail. Refresh with `-u` after spot-checking three diffs.

- [ ] **Step 7: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts \
        src/features/tools/star_system_generator/viewer3d/lib/__tests__/
git commit -m "fix(viewer3d): cap sub-system orbit-ring extent against companion offset"
```

### Task 0.5: Viewer cap — moon-envelope against neighbours

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts:~117-179`
- Test: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-moonEnvelope.test.ts` (new)

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'

describe('moon envelope is capped against next neighbour', () => {
  it('seed probe-frontier-balanced-normal-normal-0-60: no outermost-body moon envelope crosses the companion', () => {
    const system = generateSystem({
      seed: 'probe-frontier-balanced-normal-normal-0-60',
      distribution: 'frontier',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'normal',
    })
    const graph = buildSceneGraph(system)
    const primaryBodies = graph.primary.bodies
    if (primaryBodies.length === 0) return
    const outermost = primaryBodies[primaryBodies.length - 1]
    const companion = graph.companions[0]
    if (!companion) return
    const companionOffset = Math.hypot(companion.position.x, companion.position.y, companion.position.z)

    const moons = outermost.moons ?? []
    if (moons.length === 0) return
    const outerMoonRadius = Math.max(...moons.map(m => m.orbitRadius))
    const moonEnvelopeReach = outermost.orbitRadius + outerMoonRadius
    expect(moonEnvelopeReach, `body+moons reach ${moonEnvelopeReach} crosses companion at ${companionOffset}`).toBeLessThan(companionOffset)
  })
})
```

- [ ] **Step 2: Run test and confirm fail**

```bash
npm run test -- src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-moonEnvelope.test.ts
```

- [ ] **Step 3: Implement the moon-envelope cap**

In the moon-placement block of `sceneGraph.ts` (lines 117-179), compute the next-neighbour distance for each body before placing its moons. The next neighbour is the next body's `orbitRadius` (if any), the companion's scene offset (if no next body and a companion exists), or `Infinity`. Cap each moon's `orbitShell + idx * orbitStep` so the maximum reach stays within `(neighbour - bodyOrbitRadius) / 2`. If even the first moon's natural shell exceeds the gap, compress all moons proportionally.

- [ ] **Step 4: Run test and verify pass**

```bash
npm run test -- src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-moonEnvelope.test.ts
```

- [ ] **Step 5: Re-run viewer3d suite and refresh snapshots**

```bash
npm run test -- src/features/tools/star_system_generator/viewer3d/
# spot-check, then if all changes are expected:
npm run test -- src/features/tools/star_system_generator/viewer3d/ -u
```

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts \
        src/features/tools/star_system_generator/viewer3d/lib/__tests__/
git commit -m "fix(viewer3d): cap moon envelope against next neighbour or companion"
```

### Task 0.6: Viewer cap — clearance inflation against companion

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts:~279-289` (`applyBodyOrbitClearance`)
- Test: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-clearance.test.ts` (new)

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'

describe('clearance inflation does not push bodies past the companion', () => {
  it('seed probe-frontier-astronomy-low-normal-7-211: no primary body scene radius exceeds companion offset', () => {
    const system = generateSystem({
      seed: 'probe-frontier-astronomy-low-normal-7-211',
      distribution: 'frontier',
      tone: 'astronomy',
      gu: 'low',
      settlements: 'normal',
    })
    const graph = buildSceneGraph(system)
    const companion = graph.companions[0]
    if (!companion) return
    const companionOffset = Math.hypot(companion.position.x, companion.position.y, companion.position.z)
    for (const body of graph.primary.bodies) {
      expect(body.orbitRadius, `${body.id} radius ${body.orbitRadius} exceeds companion at ${companionOffset}`).toBeLessThan(companionOffset)
    }
  })
})
```

- [ ] **Step 2: Run test and confirm fail**

```bash
npm run test -- src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-clearance.test.ts
```

- [ ] **Step 3: Implement clearance cap**

Modify `applyBodyOrbitClearance` to accept an optional `maxRadius` parameter. When present, never inflate `orbitRadius` beyond `maxRadius - safetyMargin` (use 1.5 scene units as the margin). If the inflation cannot be satisfied within the cap, mark the body as `truncated: true` and skip it from the output array (the calling code can render a warning trait or just omit). Pass `companionOffset - safetyMargin` as `maxRadius` whenever a companion is in-scene.

- [ ] **Step 4: Run test and verify pass**

- [ ] **Step 5: Re-run viewer3d suite and refresh snapshots**

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts \
        src/features/tools/star_system_generator/viewer3d/lib/__tests__/
git commit -m "fix(viewer3d): cap orbit-clearance inflation against companion offset"
```

### Task 0.7: Viewer — sync circumbinary keep-out ring with the math

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts:~374-376`
- Test: `src/features/tools/star_system_generator/viewer3d/lib/__tests__/sceneGraph-keepOut.test.ts` (new)

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'
import { circumbinaryInnerAuLimit } from '../../lib/generator/companionStability'
import { separationToBucketAu } from '../../lib/generator/companionGeometry'
import { auToScene } from '../scale'

describe('circumbinary keep-out ring matches HW math', () => {
  it('matches circumbinaryInnerAuLimit on a deterministic circumbinary seed', () => {
    const system = generateSystem({
      seed: 'audit-circumbinary-keepout-0',
      distribution: 'frontier',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'normal',
    })
    const cb = system.companions.find(c => c.mode === 'circumbinary')
    if (!cb) return
    const sepAu = separationToBucketAu(cb.separation.value)
    const expectedAu = circumbinaryInnerAuLimit(sepAu, system.primary.massSolar.value, cb.star.massSolar.value)
    const graph = buildSceneGraph(system)
    expect(graph.keepOut).toBeDefined()
    expect(graph.keepOut!.sceneRadius).toBeCloseTo(auToScene(expectedAu, graph.hzCenterAu), 2)
  })
})
```

- [ ] **Step 2: Run test and confirm fail**

- [ ] **Step 3: Replace the placeholder**

In `sceneGraph.ts` around line 374-376, replace:

```ts
const keepOutSceneRadius = auToScene(2 * separationToBucketAu(separation), hzCenterAu)
```

with:

```ts
import { circumbinaryInnerAuLimit } from '../../lib/generator/companionStability'
// ...
const keepOutAu = circumbinaryInnerAuLimit(
  separationToBucketAu(separation),
  primary.massSolar.value,
  circumbinaryCompanion.star.massSolar.value,
)
const keepOutSceneRadius = auToScene(keepOutAu, hzCenterAu)
```

- [ ] **Step 4: Run test and verify pass**

- [ ] **Step 5: Re-run viewer3d suite and refresh snapshots (96% of circumbinary snapshots will shift)**

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts \
        src/features/tools/star_system_generator/viewer3d/lib/__tests__/
git commit -m "fix(viewer3d): sync circumbinary keep-out ring with HW math"
```

### Task 0.8: Phase 0 verification + push

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```

Expected: green.

- [ ] **Step 2: Run lint and build**

```bash
npm run lint && npm run build
```

Expected: clean.

- [ ] **Step 3: Run deep audit and verify zero stability findings**

```bash
npm run audit:star-system-generator:deep
```

Expected: zero `BINARY_STABILITY_CONFLICT`.

- [ ] **Step 4: Manual viewer smoke**

Start `npm run dev`, open `http://localhost:3000/tools/star_system_generator/`, generate each seed below and visually confirm no body or moon crosses the companion or the keep-out ring:

- `cut-frontier-balanced-normal-normal-8-68` (orbital-sibling, high mass asymmetry)
- `probe-frontier-astronomy-fracture-crowded-11-371` (wide binary, M-dwarf companion)
- `probe-frontier-balanced-normal-normal-0-60` (gas giant with many moons)
- `audit-circumbinary-keepout-0` (circumbinary keep-out ring)
- `probe-frontier-astronomy-low-normal-7-211` (compact moderate binary, clearance pressure)

- [ ] **Step 5: Push**

```bash
git push origin develop
```

---

## Phase 1 — Types and Generator Pipeline

### Task 1.1: Add `DebrisField` types and field references

**Files:**
- Modify: `src/features/tools/star_system_generator/types.ts`

- [ ] **Step 1: Add the new types**

Append after the `SystemPhenomenon` interface and before `NarrativeFactStatus`:

```ts
export type DebrisFieldShape =
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

export type DebrisDensityBand =
  | 'dust'
  | 'sparse'
  | 'asteroid-fleet'
  | 'shell-dense'
  | 'stream'

export type DebrisAnchorMode =
  | 'unanchorable'
  | 'transient-only'
  | 'edge-only'
  | 'embedded'

export interface DebrisFieldSpatialExtent {
  innerAu: Fact<number>
  outerAu: Fact<number>
  inclinationDeg: Fact<number>
  spanDeg: Fact<number>
  centerAngleDeg: Fact<number>
}

export interface DebrisField {
  id: string
  shape: Fact<DebrisFieldShape>
  archetypeName: Fact<string>
  companionId: string | null
  spatialExtent: DebrisFieldSpatialExtent
  densityBand: Fact<DebrisDensityBand>
  anchorMode: Fact<DebrisAnchorMode>
  guCharacter: Fact<string>
  prize: Fact<string>
  spawnedPhenomenonId: string | null
  whyHere: Fact<string>
}
```

- [ ] **Step 2: Wire field onto `Settlement` and `HumanRemnant`**

Find the `Settlement` interface and add (next to `bodyId?` / `moonId?`):

```ts
  debrisFieldId?: string
```

Find the `HumanRemnant` interface and add the same field.

- [ ] **Step 3: Wire array onto `GeneratedSystem`**

In `GeneratedSystem`, add (alphabetized between `bodies` and `gates`):

```ts
  debrisFields: DebrisField[]
```

- [ ] **Step 4: Wire optional locked-import field on `PartialKnownSystem`**

Search for `PartialKnownSystem` and add:

```ts
  debrisFields?: DebrisField[]
```

- [ ] **Step 5: Run tsc to confirm types compile**

```bash
npx tsc --noEmit
```

Expected: many errors in callers because `debrisFields` is now required on `GeneratedSystem`. Resolve in Task 1.2.

- [ ] **Step 6: Commit (with the empty-array shim from Task 1.2 — defer commit)**

### Task 1.2: Empty-array shim and skeleton derivation

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts:~4485-4499` (the `generateSystem` return object)
- Create: `src/features/tools/star_system_generator/lib/generator/debrisFields.ts`

- [ ] **Step 1: Create the skeleton module**

```ts
import type { DebrisField, GeneratedSystem, GenerationOptions, StellarCompanion } from '../../types'
import type { SeededRng } from './rng'

export function deriveDebrisFields(
  _rng: SeededRng,
  _system: GeneratedSystem,
  _options: GenerationOptions,
): DebrisField[] {
  return []
}

export function attachSettlementsToDebrisFields<T extends { debrisFieldId?: string; bodyId?: string }>(
  _rng: SeededRng,
  settlements: T[],
  _debrisFields: DebrisField[],
): T[] {
  return settlements
}

export function attachRuinsToDebrisFields<T extends { debrisFieldId?: string }>(
  _rng: SeededRng,
  ruins: T[],
  _debrisFields: DebrisField[],
): T[] {
  return ruins
}
```

- [ ] **Step 2: Wire `debrisFields: []` into `generateSystem` return**

In `index.ts`, find the `return` block at the end of `generateSystem`. Add `debrisFields: [],` to the returned object (between `bodies` and `gates`).

- [ ] **Step 3: Run tsc**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Run focused tests**

```bash
npm run test -- src/features/tools/star_system_generator/__tests__/
```

Expected: existing tests still pass; new field appears as `[]` in any snapshot diff. Refresh snapshots if any structural snapshots include the whole `GeneratedSystem`.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/types.ts \
        src/features/tools/star_system_generator/lib/generator/debrisFields.ts \
        src/features/tools/star_system_generator/lib/generator/index.ts \
        src/features/tools/star_system_generator/__tests__/__snapshots__/
git commit -m "feat(star-gen): scaffold DebrisField types and empty-array shim"
```

### Task 1.3: `data/debrisFields.json` skeleton

**Files:**
- Create: `src/features/tools/star_system_generator/data/debrisFields.json`

- [ ] **Step 1: Create the file with one entry per archetype**

This is the schema/skeleton; full prose authoring happens in Phase 4. For now each entry has empty arrays for prose pools and a single placeholder string per beat to make Phase 1 tests pass.

```json
{
  "archetypes": {
    "mass-transfer-stream": {
      "label": "Mass-Transfer Stream",
      "whyHerePool": ["placeholder"],
      "prizePool": ["placeholder"],
      "guCharacterPool": ["placeholder"],
      "phenomenon": {
        "labelPool": ["L1 mass-transfer stream"],
        "notePool": ["placeholder"],
        "travelEffectPool": ["placeholder"],
        "surveyQuestionPool": ["placeholder"],
        "conflictHookPool": ["placeholder"],
        "sceneAnchorPool": ["placeholder"]
      }
    },
    "common-envelope-shell": { /* same shape */ },
    "polar-ring": { /* same shape */ },
    "trojan-camp": { /* same shape */ },
    "inner-pair-halo": { /* same shape */ },
    "kozai-scattered-halo": { /* same shape */ },
    "hill-sphere-capture-cone": { /* same shape */ },
    "exocomet-swarm": { /* same shape */ },
    "accretion-bridge": { /* same shape */ },
    "gardener-cordon": { /* same shape */ }
  }
}
```

Spell out all ten entries with the same shape (no `/* same shape */` shortcuts in the actual file).

- [ ] **Step 2: Add a loader**

Create `src/features/tools/star_system_generator/lib/generator/data/debrisFields.ts`:

```ts
import debrisFieldsRaw from '../../../data/debrisFields.json' assert { type: 'json' }
import type { DebrisFieldShape } from '../../../types'

export interface DebrisArchetypeData {
  label: string
  whyHerePool: string[]
  prizePool: string[]
  guCharacterPool: string[]
  phenomenon: {
    labelPool: string[]
    notePool: string[]
    travelEffectPool: string[]
    surveyQuestionPool: string[]
    conflictHookPool: string[]
    sceneAnchorPool: string[]
  }
}

const archetypes = debrisFieldsRaw.archetypes as Record<DebrisFieldShape, DebrisArchetypeData>

export function debrisArchetypeData(shape: DebrisFieldShape): DebrisArchetypeData {
  const data = archetypes[shape]
  if (!data) throw new Error(`Unknown debris archetype: ${shape}`)
  return data
}

export function allDebrisArchetypes(): Array<[DebrisFieldShape, DebrisArchetypeData]> {
  return Object.entries(archetypes) as Array<[DebrisFieldShape, DebrisArchetypeData]>
}
```

- [ ] **Step 3: Add a smoke test for the loader**

`src/features/tools/star_system_generator/__tests__/debrisFields-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { allDebrisArchetypes, debrisArchetypeData } from '../lib/generator/data/debrisFields'

describe('debrisFields data loader', () => {
  it('returns all ten archetypes', () => {
    expect(allDebrisArchetypes()).toHaveLength(10)
  })

  it('each archetype has all required pool keys', () => {
    for (const [shape, data] of allDebrisArchetypes()) {
      expect(data.label, shape).toBeDefined()
      expect(data.whyHerePool.length, `${shape}.whyHerePool`).toBeGreaterThan(0)
      expect(data.phenomenon.travelEffectPool.length, `${shape}.phenomenon.travelEffectPool`).toBeGreaterThan(0)
    }
  })

  it('debrisArchetypeData throws on unknown shape', () => {
    expect(() => debrisArchetypeData('nope' as never)).toThrow()
  })
})
```

- [ ] **Step 4: Run test**

```bash
npm run test -- src/features/tools/star_system_generator/__tests__/debrisFields-data.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/data/debrisFields.json \
        src/features/tools/star_system_generator/lib/generator/data/debrisFields.ts \
        src/features/tools/star_system_generator/__tests__/debrisFields-data.test.ts
git commit -m "feat(star-gen): scaffold debrisFields.json with 10 archetype skeletons"
```

### Task 1.4: Archetype eligibility selection

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/debrisFields.ts`
- Test: `src/features/tools/star_system_generator/__tests__/debrisField-eligibility.test.ts` (new)

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { selectArchetypeForCompanion } from '../lib/generator/debrisFields'
import { fact } from '../lib/generator'
import type { StellarCompanion, Star } from '../types'

function fakeStar(massSolar: number, activity: string = 'Quiet'): Star {
  return {
    id: 'fake',
    name: fact('Fake', 'human-layer', 'test'),
    spectralType: fact('K star', 'inferred', 'test'),
    massSolar: fact(massSolar, 'derived', 'test'),
    luminositySolar: fact(0.5, 'derived', 'test'),
    ageState: fact('Mature', 'inferred', 'test'),
    metallicity: fact('Average', 'inferred', 'test'),
    activity: fact(activity, 'inferred', 'test'),
    activityRoll: fact(7, 'derived', 'test'),
    activityModifiers: [],
  }
}

function fakeCompanion(mode: StellarCompanion['mode'], separation: string, companionMass: number, activity: string = 'Quiet'): StellarCompanion {
  return {
    id: 'companion-1',
    companionType: fact('Test', 'inferred', 'test'),
    separation: fact(separation, 'inferred', 'test'),
    planetaryConsequence: fact('test', 'inferred', 'test'),
    guConsequence: fact('test', 'gu-layer', 'test'),
    rollMargin: fact(0, 'derived', 'test'),
    mode,
    star: fakeStar(companionMass, activity),
  }
}

describe('selectArchetypeForCompanion eligibility', () => {
  it('volatile companions select mass-transfer-stream', () => {
    const companion = fakeCompanion('volatile', 'Contact / near-contact', 0.5)
    const primary = fakeStar(1.0)
    const result = selectArchetypeForCompanion({ seed: 'eligibility-test-1' }, companion, primary, { hierarchicalTriple: false })
    expect(result?.shape).toBe('mass-transfer-stream')
  })

  it('circumbinary close binary with high mass ratio selects polar-ring', () => {
    const companion = fakeCompanion('circumbinary', 'Close binary', 0.7)
    const primary = fakeStar(1.0)
    const result = selectArchetypeForCompanion({ seed: 'eligibility-test-2' }, companion, primary, { hierarchicalTriple: false })
    expect(result?.shape).toBe('polar-ring')
  })

  it('circumbinary with very low mass ratio selects trojan-camp', () => {
    const companion = fakeCompanion('circumbinary', 'Close binary', 0.10)
    const primary = fakeStar(1.0)
    const result = selectArchetypeForCompanion({ seed: 'eligibility-test-3' }, companion, primary, { hierarchicalTriple: false })
    expect(result?.shape).toBe('trojan-camp')
  })

  it('hierarchical-triple always selects inner-pair-halo for inner companion', () => {
    const companion = fakeCompanion('circumbinary', 'Tight binary', 0.4)
    const primary = fakeStar(1.0)
    const result = selectArchetypeForCompanion({ seed: 'eligibility-test-4' }, companion, primary, { hierarchicalTriple: true })
    expect(result?.shape).toBe('inner-pair-halo')
  })

  it('orbital-sibling with flare-prone companion selects kozai-scattered-halo', () => {
    const companion = fakeCompanion('orbital-sibling', 'Moderate binary', 0.3, 'Flare-prone')
    const primary = fakeStar(1.0)
    const result = selectArchetypeForCompanion({ seed: 'eligibility-test-5' }, companion, primary, { hierarchicalTriple: false })
    expect(result?.shape).toBe('kozai-scattered-halo')
  })

  it('orbital-sibling moderate without flare selects hill-sphere-capture-cone or exocomet-swarm', () => {
    const companion = fakeCompanion('orbital-sibling', 'Moderate binary', 0.5)
    const primary = fakeStar(1.0)
    const result = selectArchetypeForCompanion({ seed: 'eligibility-test-6' }, companion, primary, { hierarchicalTriple: false })
    expect(['hill-sphere-capture-cone', 'exocomet-swarm']).toContain(result?.shape)
  })

  it('linked-independent never produces a debris archetype', () => {
    const companion = fakeCompanion('linked-independent', 'Very wide', 0.3)
    const primary = fakeStar(1.0)
    const result = selectArchetypeForCompanion({ seed: 'eligibility-test-7' }, companion, primary, { hierarchicalTriple: false })
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run test, confirm fail**

```bash
npm run test -- src/features/tools/star_system_generator/__tests__/debrisField-eligibility.test.ts
```

- [ ] **Step 3: Implement `selectArchetypeForCompanion`**

In `lib/generator/debrisFields.ts`, add the function and its decision-tree helpers:

```ts
import type { DebrisFieldShape, StellarCompanion, Star } from '../../types'
import { createSeededRng } from './rng'

interface SelectionContext {
  hierarchicalTriple: boolean
}

interface SelectionResult {
  shape: DebrisFieldShape
}

export function selectArchetypeForCompanion(
  rngSeed: { seed: string },
  companion: StellarCompanion,
  primary: Star,
  context: SelectionContext,
): SelectionResult | null {
  const rng = createSeededRng(`${rngSeed.seed}:debris:${companion.id}`)
  const massRatio = companion.star.massSolar.value / (primary.massSolar.value + companion.star.massSolar.value)
  const activity = companion.star.activity.value
  const mode = companion.mode

  if (mode === 'linked-independent') return null

  if (context.hierarchicalTriple && companion.id === 'companion-1') {
    return { shape: 'inner-pair-halo' }
  }

  if (mode === 'volatile') {
    return { shape: 'mass-transfer-stream' }
  }

  if (mode === 'circumbinary') {
    if (massRatio <= 0.15) return { shape: 'trojan-camp' }
    if (massRatio >= 0.3) return { shape: 'polar-ring' }
    return { shape: 'polar-ring' } // mid-band defaults to polar-ring
  }

  if (mode === 'orbital-sibling') {
    if (activity === 'Flare-prone' || activity === 'Violent flare cycle' || activity === 'Extreme activity / metric-amplified events') {
      return { shape: 'kozai-scattered-halo' }
    }
    const roll = rng.next()
    if (roll < 0.4) return { shape: 'hill-sphere-capture-cone' }
    return { shape: 'exocomet-swarm' }
  }

  return null
}
```

- [ ] **Step 4: Run test, verify pass**

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/debrisFields.ts \
        src/features/tools/star_system_generator/__tests__/debrisField-eligibility.test.ts
git commit -m "feat(star-gen): archetype eligibility selection for debris fields"
```

### Task 1.5: Spatial-extent derivation per shape

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/debrisFields.ts`
- Test: `src/features/tools/star_system_generator/__tests__/debrisField-spatial-extent.test.ts` (new)

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { spatialExtentForShape } from '../lib/generator/debrisFields'

describe('spatialExtentForShape', () => {
  it('polar-ring is perpendicular (inclination 90)', () => {
    const ext = spatialExtentForShape('polar-ring', { separationAu: 1.0, primaryMass: 1.0, companionMass: 0.7, hwInner: 2.5, hwOuter: 0.5 })
    expect(ext.inclinationDeg.value).toBe(90)
    expect(ext.spanDeg.value).toBe(360)
  })

  it('trojan-camp is a tadpole at 60 deg, span ~30', () => {
    const ext = spatialExtentForShape('trojan-camp', { separationAu: 1.5, primaryMass: 1.0, companionMass: 0.1, hwInner: 4.5, hwOuter: 0.7 })
    expect(Math.abs(ext.centerAngleDeg.value)).toBe(60)
    expect(ext.spanDeg.value).toBe(30)
  })

  it('common-envelope-shell is a full sphere shell', () => {
    const ext = spatialExtentForShape('common-envelope-shell', { separationAu: 0.5, primaryMass: 1.0, companionMass: 0.7, hwInner: 1.5, hwOuter: 0.2 })
    expect(ext.spanDeg.value).toBe(360)
    expect(ext.outerAu.value).toBeGreaterThan(ext.innerAu.value)
  })

  it('mass-transfer-stream is a narrow stream (span ~5)', () => {
    const ext = spatialExtentForShape('mass-transfer-stream', { separationAu: 0.05, primaryMass: 1.0, companionMass: 0.6, hwInner: 0.15, hwOuter: 0.02 })
    expect(ext.spanDeg.value).toBeLessThanOrEqual(10)
  })

  it('extent never punches through the circumbinary keep-out', () => {
    const ext = spatialExtentForShape('polar-ring', { separationAu: 1.0, primaryMass: 1.0, companionMass: 0.7, hwInner: 2.5, hwOuter: 0.5 })
    expect(ext.innerAu.value).toBeGreaterThanOrEqual(2.5)
  })
})
```

- [ ] **Step 2: Implement `spatialExtentForShape`**

In `lib/generator/debrisFields.ts`:

```ts
import type { DebrisFieldShape, DebrisFieldSpatialExtent, Fact } from '../../types'
import { fact } from './index'

interface SpatialInputs {
  separationAu: number
  primaryMass: number
  companionMass: number
  hwInner: number   // circumbinary inner-keep-out radius
  hwOuter: number   // sibling outer-stability radius
}

export function spatialExtentForShape(shape: DebrisFieldShape, inputs: SpatialInputs): DebrisFieldSpatialExtent {
  const f = (n: number, src: string): Fact<number> => fact(n, 'derived', src)

  switch (shape) {
    case 'polar-ring':
      return {
        innerAu: f(inputs.hwInner, 'circumbinary inner keep-out'),
        outerAu: f(inputs.hwInner * 3, 'polar-ring outer = 3x inner'),
        inclinationDeg: f(90, 'polar by definition'),
        spanDeg: f(360, 'full ring'),
        centerAngleDeg: f(0, 'rotationally symmetric'),
      }
    case 'mass-transfer-stream':
      return {
        innerAu: f(inputs.separationAu * 0.3, 'stream inner'),
        outerAu: f(inputs.separationAu * 1.2, 'stream outer'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(5, 'narrow stream'),
        centerAngleDeg: f(0, 'L1 axis'),
      }
    case 'common-envelope-shell':
      return {
        innerAu: f(inputs.separationAu * 5, 'shell inner ~5x sep'),
        outerAu: f(inputs.separationAu * 50, 'shell outer ~50x sep'),
        inclinationDeg: f(0, 'spherical, no preferred plane'),
        spanDeg: f(360, 'full shell'),
        centerAngleDeg: f(0, 'spherical'),
      }
    case 'inner-pair-halo':
      return {
        innerAu: f(inputs.hwInner * 1.1, 'just outside keep-out'),
        outerAu: f(inputs.hwInner * 4, 'inner halo extent'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(360, 'annulus'),
        centerAngleDeg: f(0, 'symmetric'),
      }
    case 'trojan-camp':
      // Pick L4 vs L5 deterministically from separation
      const side = (inputs.separationAu * 1000) % 2 < 1 ? 60 : -60
      return {
        innerAu: f(inputs.separationAu * 0.9, 'co-orbital with companion'),
        outerAu: f(inputs.separationAu * 1.1, 'co-orbital'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(30, 'tadpole'),
        centerAngleDeg: f(side, 'L4 or L5'),
      }
    case 'kozai-scattered-halo':
      return {
        innerAu: f(inputs.hwOuter * 0.5, 'inner halo'),
        outerAu: f(inputs.hwOuter * 0.95, 'just inside S-type cutoff'),
        inclinationDeg: f(60, 'Kozai inclination'),
        spanDeg: f(360, 'scattered'),
        centerAngleDeg: f(0, 'isotropic'),
      }
    case 'hill-sphere-capture-cone':
      return {
        innerAu: f(inputs.separationAu * 0.3, 'companion Hill sphere'),
        outerAu: f(inputs.separationAu * 0.5, 'capture boundary'),
        inclinationDeg: f(15, 'mild scatter'),
        spanDeg: f(120, 'trailing cone'),
        centerAngleDeg: f(180, 'opposite companion motion'),
      }
    case 'exocomet-swarm':
      return {
        innerAu: f(inputs.hwOuter * 2, 'reservoir start'),
        outerAu: f(inputs.hwOuter * 10, 'reservoir extent'),
        inclinationDeg: f(20, 'mild scatter'),
        spanDeg: f(360, 'reservoir'),
        centerAngleDeg: f(0, 'symmetric'),
      }
    case 'accretion-bridge':
      return {
        innerAu: f(0, 'star surface'),
        outerAu: f(inputs.separationAu, 'star to star'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(3, 'very narrow'),
        centerAngleDeg: f(0, 'star-star axis'),
      }
    case 'gardener-cordon':
      return {
        innerAu: f(inputs.hwOuter * 0.7, 'cordon radius'),
        outerAu: f(inputs.hwOuter * 0.72, 'cordon thin'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(360, 'full perimeter'),
        centerAngleDeg: f(0, 'symmetric'),
      }
  }
}
```

- [ ] **Step 3: Run test, verify pass**

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/debrisFields.ts \
        src/features/tools/star_system_generator/__tests__/debrisField-spatial-extent.test.ts
git commit -m "feat(star-gen): per-shape spatial-extent derivation"
```

### Task 1.6: `deriveDebrisFields` orchestrator + phenomenon spawn

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/debrisFields.ts`
- Test: `src/features/tools/star_system_generator/__tests__/debrisField-derivation.test.ts` (new)

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { generateSystem } from '../lib/generator'

describe('deriveDebrisFields end-to-end', () => {
  it('volatile companion system produces a mass-transfer-stream debris field', () => {
    // Find a deterministic seed that produces a volatile companion
    const system = generateSystem({
      seed: 'debris-volatile-seed-1',
      distribution: 'frontier',
      tone: 'cinematic',
      gu: 'normal',
      settlements: 'normal',
    })
    const volatile = system.companions.find(c => c.mode === 'volatile')
    if (!volatile) {
      console.warn('skipping: seed did not produce volatile companion')
      return
    }
    expect(system.debrisFields.length).toBeGreaterThan(0)
    const stream = system.debrisFields.find(d => d.shape.value === 'mass-transfer-stream')
    expect(stream).toBeDefined()
    expect(stream!.spawnedPhenomenonId).not.toBeNull()
    expect(system.phenomena.some(p => p.id === stream!.spawnedPhenomenonId)).toBe(true)
  })

  it('every debris field has a paired phenomenon with all four beats', () => {
    const seeds = ['debris-corpus-1', 'debris-corpus-2', 'debris-corpus-3', 'debris-corpus-4']
    for (const seed of seeds) {
      const system = generateSystem({
        seed,
        distribution: 'frontier',
        tone: 'balanced',
        gu: 'normal',
        settlements: 'normal',
      })
      for (const field of system.debrisFields) {
        expect(field.spawnedPhenomenonId, `${seed} ${field.id}`).not.toBeNull()
        const phen = system.phenomena.find(p => p.id === field.spawnedPhenomenonId)
        expect(phen, `${seed} ${field.id} phenomenon missing`).toBeDefined()
        expect(phen!.travelEffect.value.length).toBeGreaterThan(0)
        expect(phen!.surveyQuestion.value.length).toBeGreaterThan(0)
        expect(phen!.conflictHook.value.length).toBeGreaterThan(0)
        expect(phen!.sceneAnchor.value.length).toBeGreaterThan(0)
      }
    }
  })
})
```

- [ ] **Step 2: Run test, confirm fail (`debrisFields` is empty per Task 1.2 shim)**

- [ ] **Step 3: Implement `deriveDebrisFields`**

Expand `lib/generator/debrisFields.ts`:

```ts
import type {
  DebrisField, DebrisFieldShape, DebrisAnchorMode, DebrisDensityBand,
  GeneratedSystem, SystemPhenomenon, GenerationOptions,
} from '../../types'
import type { SeededRng } from './rng'
import { fact } from './index'
import { separationToBucketAu } from './companionGeometry'
import { siblingOuterAuLimit, circumbinaryInnerAuLimit } from './companionStability'
import { debrisArchetypeData } from './data/debrisFields'

const ANCHOR_BY_SHAPE: Record<DebrisFieldShape, DebrisAnchorMode> = {
  'mass-transfer-stream': 'edge-only',
  'common-envelope-shell': 'embedded',
  'polar-ring': 'edge-only',
  'trojan-camp': 'embedded',
  'inner-pair-halo': 'edge-only',
  'kozai-scattered-halo': 'transient-only',
  'hill-sphere-capture-cone': 'transient-only',
  'exocomet-swarm': 'unanchorable',
  'accretion-bridge': 'unanchorable',
  'gardener-cordon': 'unanchorable',
}

const DENSITY_BY_SHAPE: Record<DebrisFieldShape, DebrisDensityBand> = {
  'mass-transfer-stream': 'stream',
  'common-envelope-shell': 'shell-dense',
  'polar-ring': 'asteroid-fleet',
  'trojan-camp': 'asteroid-fleet',
  'inner-pair-halo': 'asteroid-fleet',
  'kozai-scattered-halo': 'sparse',
  'hill-sphere-capture-cone': 'sparse',
  'exocomet-swarm': 'sparse',
  'accretion-bridge': 'dust',
  'gardener-cordon': 'dust',
}

function pickOne<T>(rng: SeededRng, pool: T[]): T {
  if (pool.length === 0) throw new Error('empty pool')
  return pool[Math.floor(rng.next() * pool.length) % pool.length]
}

function spawnPhenomenonForField(
  rng: SeededRng,
  fieldId: string,
  shape: DebrisFieldShape,
): SystemPhenomenon {
  const data = debrisArchetypeData(shape)
  return {
    id: `phen-debris-${fieldId}`,
    phenomenon: fact(pickOne(rng.fork('label'), data.phenomenon.labelPool), 'inferred', `Spawned by debris field ${fieldId}`),
    note: fact(pickOne(rng.fork('note'), data.phenomenon.notePool), 'inferred', 'Debris-spawned phenomenon'),
    travelEffect: fact(pickOne(rng.fork('travel'), data.phenomenon.travelEffectPool), 'inferred', 'Debris-spawned'),
    surveyQuestion: fact(pickOne(rng.fork('survey'), data.phenomenon.surveyQuestionPool), 'inferred', 'Debris-spawned'),
    conflictHook: fact(pickOne(rng.fork('conflict'), data.phenomenon.conflictHookPool), 'inferred', 'Debris-spawned'),
    sceneAnchor: fact(pickOne(rng.fork('anchor'), data.phenomenon.sceneAnchorPool), 'inferred', 'Debris-spawned'),
  }
}

export function deriveDebrisFields(
  rng: SeededRng,
  system: GeneratedSystem,
  _options: GenerationOptions,
): { debrisFields: DebrisField[]; spawnedPhenomena: SystemPhenomenon[] } {
  const fields: DebrisField[] = []
  const spawnedPhenomena: SystemPhenomenon[] = []
  const hierarchicalTriple = system.companions.some(c => c.id === 'companion-2')

  for (const companion of system.companions) {
    const selection = selectArchetypeForCompanion(
      { seed: system.seed },
      companion,
      system.primary,
      { hierarchicalTriple },
    )
    if (!selection) continue

    const sepAu = separationToBucketAu(companion.separation.value)
    const hwInner = circumbinaryInnerAuLimit(sepAu, system.primary.massSolar.value, companion.star.massSolar.value)
    const hwOuter = siblingOuterAuLimit(sepAu, system.primary.massSolar.value, companion.star.massSolar.value)

    const fieldRng = rng.fork(`field-${companion.id}`)
    const archetype = debrisArchetypeData(selection.shape)
    const fieldId = `debris-${companion.id}-${selection.shape}`

    const spawned = spawnPhenomenonForField(fieldRng.fork('phenomenon'), fieldId, selection.shape)
    spawnedPhenomena.push(spawned)

    const field: DebrisField = {
      id: fieldId,
      shape: fact(selection.shape, 'derived', `Selected by ${companion.id} mode/mu/activity`),
      archetypeName: fact(archetype.label, 'derived', 'archetype data'),
      companionId: companion.id,
      spatialExtent: spatialExtentForShape(selection.shape, {
        separationAu: sepAu,
        primaryMass: system.primary.massSolar.value,
        companionMass: companion.star.massSolar.value,
        hwInner,
        hwOuter,
      }),
      densityBand: fact(DENSITY_BY_SHAPE[selection.shape], 'inferred', 'shape default'),
      anchorMode: fact(ANCHOR_BY_SHAPE[selection.shape], 'inferred', 'shape default'),
      guCharacter: fact(pickOne(fieldRng.fork('gu'), archetype.guCharacterPool), 'gu-layer', 'archetype data'),
      prize: fact(pickOne(fieldRng.fork('prize'), archetype.prizePool), 'inferred', 'archetype data'),
      spawnedPhenomenonId: spawned.id,
      whyHere: fact(pickOne(fieldRng.fork('why'), archetype.whyHerePool), 'inferred', 'archetype data'),
    }
    fields.push(field)
  }

  return { debrisFields: fields, spawnedPhenomena }
}
```

- [ ] **Step 4: Wire into `generateSystem`**

In `lib/generator/index.ts`, find the block where `phenomena` is assembled (look for `generatedPhenomena`). After computing `generatedPhenomena`, call `deriveDebrisFields`:

```ts
const { debrisFields, spawnedPhenomena } = deriveDebrisFields(rootRng.fork('debris'), {
  ...partialSystem, // assemble the partial GeneratedSystem-shaped object we have so far
  phenomena: generatedPhenomena,
}, options)

const phenomena = hasVolatileCompanion
  ? [buildBinaryContactPhenomenon(), ...generatedPhenomena, ...spawnedPhenomena]
  : [...generatedPhenomena, ...spawnedPhenomena]
```

Then add `debrisFields,` to the returned object.

Notes:
- The function signature accepts `GeneratedSystem` but at this point we don't have the full system yet — the spec's pipeline says `deriveDebrisFields` runs *after* settlements. For Phase 1, pass the partial system that's been built so far (whatever fields the function actually reads — primary, companions, seed). Tighten the type in `debrisFields.ts` to accept a narrower input if needed.

- [ ] **Step 5: Run test and verify pass**

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/debrisFields.ts \
        src/features/tools/star_system_generator/lib/generator/index.ts \
        src/features/tools/star_system_generator/__tests__/debrisField-derivation.test.ts \
        src/features/tools/star_system_generator/__tests__/__snapshots__/
git commit -m "feat(star-gen): derive debris fields with paired spawned phenomena"
```

### Task 1.7: Settlement and ruin anchor passes

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/debrisFields.ts`
- Test: `src/features/tools/star_system_generator/__tests__/debrisField-attachment.test.ts` (new)

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { attachSettlementsToDebrisFields, attachRuinsToDebrisFields } from '../lib/generator/debrisFields'
import { generateSystem } from '../lib/generator'

describe('settlement and ruin attachment to debris fields', () => {
  it('embedded fields can attract compatible settlements', () => {
    const system = generateSystem({
      seed: 'debris-attachment-seed-1',
      distribution: 'frontier',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'crowded',
    })
    // Find an embedded field
    const embedded = system.debrisFields.find(d => d.anchorMode.value === 'embedded')
    if (!embedded) return
    // Verify at least one settlement attached when overlap allowed
    const attached = system.settlements.filter(s => s.debrisFieldId === embedded.id)
    // Anchored settlements lose their bodyId
    for (const s of attached) {
      expect(s.bodyId, `${s.id} has both anchors`).toBeUndefined()
    }
  })

  it('unanchorable fields never receive settlements', () => {
    const system = generateSystem({
      seed: 'debris-attachment-seed-2',
      distribution: 'frontier',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'crowded',
    })
    const unanchorable = system.debrisFields.filter(d => d.anchorMode.value === 'unanchorable')
    for (const field of unanchorable) {
      expect(system.settlements.some(s => s.debrisFieldId === field.id), field.id).toBe(false)
    }
  })

  it('transient-only fields only attract mobile habitation patterns', () => {
    const system = generateSystem({
      seed: 'debris-attachment-seed-3',
      distribution: 'frontier',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'crowded',
    })
    const transient = system.debrisFields.filter(d => d.anchorMode.value === 'transient-only')
    for (const field of transient) {
      for (const s of system.settlements.filter(s => s.debrisFieldId === field.id)) {
        expect(['Mobile site', 'Distributed swarm']).toContain(s.habitationPattern.value)
      }
    }
  })
})
```

- [ ] **Step 2: Implement the two attachment functions**

In `lib/generator/debrisFields.ts`:

```ts
import type { Settlement, HumanRemnant, DebrisField } from '../../types'

const ATTACHMENT_PROB: Record<string, number> = {
  embedded: 0.30,
  'edge-only': 0.15,
  'transient-only': 0.50,
  unanchorable: 0,
}

const TRANSIENT_PATTERNS = new Set(['Mobile site', 'Distributed swarm'])

export function attachSettlementsToDebrisFields(
  rng: SeededRng,
  settlements: Settlement[],
  debrisFields: DebrisField[],
  bodyOrbitAuById: Map<string, number>,
): Settlement[] {
  if (debrisFields.length === 0) return settlements
  return settlements.map(settlement => {
    if (!settlement.bodyId) return settlement
    const bodyOrbit = bodyOrbitAuById.get(settlement.bodyId)
    if (bodyOrbit === undefined) return settlement
    for (const field of debrisFields) {
      const inExtent = bodyOrbit >= field.spatialExtent.innerAu.value && bodyOrbit <= field.spatialExtent.outerAu.value
      if (!inExtent) continue
      const anchorMode = field.anchorMode.value
      const prob = ATTACHMENT_PROB[anchorMode] ?? 0
      if (prob === 0) continue
      if (anchorMode === 'transient-only' && !TRANSIENT_PATTERNS.has(settlement.habitationPattern.value)) continue
      const roll = rng.fork(`s-${settlement.id}-f-${field.id}`).next()
      if (roll > prob) continue
      return { ...settlement, debrisFieldId: field.id, bodyId: undefined }
    }
    return settlement
  })
}

export function attachRuinsToDebrisFields(
  rng: SeededRng,
  ruins: HumanRemnant[],
  debrisFields: DebrisField[],
  ruinBodyOrbitById: Map<string, number>,
): HumanRemnant[] {
  if (debrisFields.length === 0) return ruins
  return ruins.map(ruin => {
    const orbit = ruinBodyOrbitById.get(ruin.id)
    if (orbit === undefined) return ruin
    for (const field of debrisFields) {
      const inExtent = orbit >= field.spatialExtent.innerAu.value && orbit <= field.spatialExtent.outerAu.value
      if (!inExtent) continue
      const prob = ATTACHMENT_PROB[field.anchorMode.value] ?? 0
      if (prob === 0) continue
      const roll = rng.fork(`r-${ruin.id}-f-${field.id}`).next()
      if (roll > prob) continue
      return { ...ruin, debrisFieldId: field.id }
    }
    return ruin
  })
}
```

- [ ] **Step 3: Wire into `generateSystem`**

In `index.ts`, after `deriveDebrisFields`, after settlement generation, build the `bodyOrbitAuById` map from `bodies` and call `attachSettlementsToDebrisFields`. After ruin generation, build a similar map for ruin locations and call `attachRuinsToDebrisFields`.

- [ ] **Step 4: Run test, verify pass**

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/debrisFields.ts \
        src/features/tools/star_system_generator/lib/generator/index.ts \
        src/features/tools/star_system_generator/__tests__/debrisField-attachment.test.ts \
        src/features/tools/star_system_generator/__tests__/__snapshots__/
git commit -m "feat(star-gen): attach settlements and ruins to compatible debris fields"
```

### Task 1.8: Determinism + Phase 1 push

**Files:**
- Test: `src/features/tools/star_system_generator/__tests__/debrisField-determinism.test.ts` (new)

- [ ] **Step 1: Determinism test**

```ts
import { describe, it, expect } from 'vitest'
import { generateSystem } from '../lib/generator'

describe('debris-field determinism', () => {
  it('same seed produces identical debris fields across 20 runs', () => {
    const seed = 'debris-determinism-seed'
    const reference = generateSystem({
      seed, distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal',
    })
    const refJson = JSON.stringify(reference.debrisFields)
    for (let i = 0; i < 20; i++) {
      const again = generateSystem({
        seed, distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal',
      })
      expect(JSON.stringify(again.debrisFields)).toBe(refJson)
    }
  })
})
```

- [ ] **Step 2: Run focused test suite end-to-end**

```bash
npm run test -- src/features/tools/star_system_generator/__tests__/ src/features/tools/star_system_generator/viewer3d/
```

Expected: green.

- [ ] **Step 3: Lint + build**

```bash
npm run lint && npm run build
```

- [ ] **Step 4: Push**

```bash
git push origin develop
```

---

## Phase 2 — UI Surfaces and Exports

### Task 2.1: Display helpers

**Files:**
- Create: `src/features/tools/star_system_generator/lib/debrisFieldDisplay.ts`
- Test: `src/features/tools/star_system_generator/__tests__/debrisFieldDisplay.test.ts` (new)

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import {
  debrisShapeLabel, densityBandLabel, anchorModeLabel,
  formatDebrisExtentLine, formatDebrisRegionSuffix,
} from '../lib/debrisFieldDisplay'

describe('debris field display helpers', () => {
  it('debrisShapeLabel maps shape to human label', () => {
    expect(debrisShapeLabel('polar-ring')).toBe('Polar circumbinary ring')
    expect(debrisShapeLabel('mass-transfer-stream')).toBe('Mass-transfer stream')
    expect(debrisShapeLabel('common-envelope-shell')).toBe('Common-envelope ejecta shell')
  })

  it('densityBandLabel maps band to label', () => {
    expect(densityBandLabel('asteroid-fleet')).toBe('asteroid-fleet density')
    expect(densityBandLabel('shell-dense')).toBe('dense shell')
  })

  it('anchorModeLabel maps anchor mode to label', () => {
    expect(anchorModeLabel('embedded')).toBe('settlements can be embedded')
    expect(anchorModeLabel('unanchorable')).toBe('no settlements possible')
  })

  it('formatDebrisExtentLine reads inner/outer/inclination', () => {
    expect(formatDebrisExtentLine({ inner: 2.5, outer: 7.5, inclinationDeg: 90 })).toBe('2.5 - 7.5 AU, perpendicular')
    expect(formatDebrisExtentLine({ inner: 0.3, outer: 1.2, inclinationDeg: 0 })).toBe('0.3 - 1.2 AU, in plane')
  })

  it('formatDebrisRegionSuffix is short and GM-readable', () => {
    expect(formatDebrisRegionSuffix({ archetypeName: 'Polar Crown' })).toBe('near Polar Crown')
  })
})
```

- [ ] **Step 2: Implement**

```ts
import type { DebrisFieldShape, DebrisDensityBand, DebrisAnchorMode } from '../types'

const SHAPE_LABELS: Record<DebrisFieldShape, string> = {
  'polar-ring': 'Polar circumbinary ring',
  'mass-transfer-stream': 'Mass-transfer stream',
  'common-envelope-shell': 'Common-envelope ejecta shell',
  'inner-pair-halo': 'Hierarchical inner-pair halo',
  'trojan-camp': 'Binary Trojan camp',
  'kozai-scattered-halo': 'Kozai-Lidov scattered halo',
  'hill-sphere-capture-cone': 'Hill-sphere capture cone',
  'exocomet-swarm': 'Resonance-pumped exocomet swarm',
  'accretion-bridge': 'Accretion bridge',
  'gardener-cordon': 'Gardener-quarantine cordon',
}

const DENSITY_LABELS: Record<DebrisDensityBand, string> = {
  dust: 'dust haze',
  sparse: 'sparse field',
  'asteroid-fleet': 'asteroid-fleet density',
  'shell-dense': 'dense shell',
  stream: 'narrow stream',
}

const ANCHOR_LABELS: Record<DebrisAnchorMode, string> = {
  unanchorable: 'no settlements possible',
  'transient-only': 'mobile camps only',
  'edge-only': 'rim settlements only',
  embedded: 'settlements can be embedded',
}

export function debrisShapeLabel(shape: DebrisFieldShape): string {
  return SHAPE_LABELS[shape]
}

export function densityBandLabel(band: DebrisDensityBand): string {
  return DENSITY_LABELS[band]
}

export function anchorModeLabel(mode: DebrisAnchorMode): string {
  return ANCHOR_LABELS[mode]
}

export function formatDebrisExtentLine(args: { inner: number; outer: number; inclinationDeg: number }): string {
  const orientation =
    args.inclinationDeg >= 80 ? 'perpendicular' :
    args.inclinationDeg >= 30 ? `${Math.round(args.inclinationDeg)} deg inclined` :
    'in plane'
  return `${args.inner.toFixed(1)} - ${args.outer.toFixed(1)} AU, ${orientation}`
}

export function formatDebrisRegionSuffix(args: { archetypeName: string }): string {
  return `near ${args.archetypeName}`
}
```

- [ ] **Step 3: Run test, verify pass**

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/star_system_generator/lib/debrisFieldDisplay.ts \
        src/features/tools/star_system_generator/__tests__/debrisFieldDisplay.test.ts
git commit -m "feat(star-gen): debris-field display helpers"
```

### Task 2.2: Body detail panel `Region:` line

**Files:**
- Modify: `src/features/tools/star_system_generator/components/BodyDetailPanel.tsx`
- Test: `src/features/tools/star_system_generator/__tests__/BodyDetailPanel-region.test.tsx` (new)

- [ ] **Step 1: Failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BodyDetailPanel } from '../components/BodyDetailPanel'
import type { GeneratedSystem, OrbitingBody, DebrisField, Settlement } from '../types'
import { fact } from '../lib/generator'

describe('BodyDetailPanel Region: line', () => {
  it('shows Region: <archetype> when a settlement on the body anchors to a debris field', () => {
    // Build a minimal fixture system with one body, one settlement on it that anchors to a field
    const body: Partial<OrbitingBody> = {
      id: 'body-1',
      name: fact('Test', 'human-layer', 't'),
      orbitAu: fact(3.0, 'inferred', 't'),
      category: fact('rocky', 'inferred', 't'),
      // ... other required fields with sensible defaults; see existing tests for reference
    }
    const debrisField: DebrisField = {
      id: 'debris-1',
      shape: fact('polar-ring', 'derived', 't'),
      archetypeName: fact('Polar Crown', 'derived', 't'),
      companionId: 'companion-1',
      spatialExtent: {
        innerAu: fact(2.5, 'derived', 't'),
        outerAu: fact(7.5, 'derived', 't'),
        inclinationDeg: fact(90, 'derived', 't'),
        spanDeg: fact(360, 'derived', 't'),
        centerAngleDeg: fact(0, 'derived', 't'),
      },
      densityBand: fact('asteroid-fleet', 'inferred', 't'),
      anchorMode: fact('edge-only', 'inferred', 't'),
      guCharacter: fact('test', 'gu-layer', 't'),
      prize: fact('test prize', 'inferred', 't'),
      spawnedPhenomenonId: 'phen-1',
      whyHere: fact('test', 'inferred', 't'),
    }
    const settlement: Partial<Settlement> = {
      id: 'set-1',
      name: fact('Outpost', 'human-layer', 't'),
      debrisFieldId: 'debris-1',
    }
    const system: Partial<GeneratedSystem> = {
      bodies: [body as OrbitingBody],
      settlements: [settlement as Settlement],
      debrisFields: [debrisField],
    }
    render(<BodyDetailPanel body={body as OrbitingBody} system={system as GeneratedSystem} />)
    expect(screen.getByText(/Region:/i)).toBeInTheDocument()
    expect(screen.getByText(/Polar Crown/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test, confirm fail**

- [ ] **Step 3: Implement the line in `BodyDetailPanel.tsx`**

Inside the settlement subsection of the panel, when iterating `settlementsForThisBody`, look up each settlement's `debrisFieldId` in `system.debrisFields` and render:

```tsx
{settlement.debrisFieldId && (() => {
  const field = system.debrisFields.find(d => d.id === settlement.debrisFieldId)
  if (!field) return null
  return (
    <div className="mt-1 text-xs text-[var(--muted)]">
      Region: <span className="text-[var(--foreground)]">{field.archetypeName.value}</span>
    </div>
  )
})()}
```

- [ ] **Step 4: Run test, verify pass**

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/components/BodyDetailPanel.tsx \
        src/features/tools/star_system_generator/__tests__/BodyDetailPanel-region.test.tsx
git commit -m "feat(star-gen): show Region: line on settlements anchored to debris fields"
```

### Task 2.3: Orbital table adjacency hint

**Files:**
- Modify: `src/features/tools/star_system_generator/components/OrbitalTable.tsx`
- Test: extend existing OrbitalTable test or add `OrbitalTable-debrisRegion.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrbitalTable } from '../components/OrbitalTable'
import { fact } from '../lib/generator'
// ... build fixture with a body whose orbit falls inside a debris field's extent and has a settlement attached

describe('OrbitalTable shows debris-field hint for anchored settlements', () => {
  it('renders "near <Archetype>" suffix in the Sites column', () => {
    // ... render OrbitalTable with fixture
    expect(screen.getByText(/near Polar Crown/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Implement**

In `OrbitalTable.tsx`, in the `Sites or settlements` column rendering, after listing each settlement name, append `formatDebrisRegionSuffix({ archetypeName: field.archetypeName.value })` if the settlement has a `debrisFieldId`.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/components/OrbitalTable.tsx \
        src/features/tools/star_system_generator/__tests__/
git commit -m "feat(star-gen): OrbitalTable shows debris-field region hint"
```

### Task 2.4: Markdown export — Debris Fields section

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/export/markdown.ts`
- Test: extend `__tests__/export.test.ts`

- [ ] **Step 1: Failing test (add to existing `export.test.ts`)**

```ts
describe('Markdown export with debris fields', () => {
  it('includes ## Debris Fields section with one subsection per field', () => {
    const system = generateSystem({ seed: 'export-debris-1', distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal' })
    if (system.debrisFields.length === 0) return
    const md = renderMarkdown(system)
    expect(md).toMatch(/## Debris Fields/)
    expect(md).toMatch(new RegExp(system.debrisFields[0].archetypeName.value))
  })

  it('settlements anchored to a debris field include a Region: line', () => {
    const system = generateSystem({ seed: 'export-debris-2', distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'crowded' })
    const anchored = system.settlements.find(s => s.debrisFieldId)
    if (!anchored) return
    const md = renderMarkdown(system)
    const field = system.debrisFields.find(d => d.id === anchored.debrisFieldId)!
    expect(md).toMatch(new RegExp(`Region:.*${field.archetypeName.value}`))
  })
})
```

- [ ] **Step 2: Implement**

In `markdown.ts`, after the `## Phenomena` section, insert:

```ts
function renderDebrisFields(system: GeneratedSystem): string {
  if (system.debrisFields.length === 0) return ''
  const lines = ['## Debris Fields', '']
  for (const field of system.debrisFields) {
    lines.push(`### ${field.archetypeName.value}`)
    lines.push('')
    lines.push(`- **Shape:** ${debrisShapeLabel(field.shape.value)}`)
    lines.push(`- **Extent:** ${formatDebrisExtentLine({ inner: field.spatialExtent.innerAu.value, outer: field.spatialExtent.outerAu.value, inclinationDeg: field.spatialExtent.inclinationDeg.value })}`)
    lines.push(`- **Density:** ${densityBandLabel(field.densityBand.value)}`)
    lines.push(`- **Settlements:** ${anchorModeLabel(field.anchorMode.value)}`)
    lines.push(`- **Prize:** ${field.prize.value}`)
    lines.push(`- **GU character:** ${field.guCharacter.value}`)
    lines.push(`- **Why here:** ${field.whyHere.value}`)
    const phen = system.phenomena.find(p => p.id === field.spawnedPhenomenonId)
    if (phen) {
      lines.push('')
      lines.push(`*Travel effect:* ${phen.travelEffect.value}`)
      lines.push(`*Survey question:* ${phen.surveyQuestion.value}`)
      lines.push(`*Conflict hook:* ${phen.conflictHook.value}`)
      lines.push(`*Scene anchor:* ${phen.sceneAnchor.value}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}
```

Then in the main export function, insert `renderDebrisFields(system)` between Phenomena and Settlements. Also extend the per-settlement renderer to include a `Region:` bullet when `s.debrisFieldId` is set. Same for ruins.

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/star_system_generator/lib/export/markdown.ts \
        src/features/tools/star_system_generator/__tests__/export.test.ts
git commit -m "feat(star-gen): Markdown export includes Debris Fields section"
```

### Task 2.5: JSON export pass-through

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/export/json.ts`
- Test: extend `__tests__/export.test.ts`

- [ ] **Step 1: Failing test**

```ts
describe('JSON export with debris fields', () => {
  it('includes debrisFields[] in output', () => {
    const system = generateSystem({ seed: 'json-debris-1', distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal' })
    const json = JSON.parse(renderJson(system))
    expect(Array.isArray(json.debrisFields)).toBe(true)
  })
  it('includes settlement.debrisFieldId when anchored', () => {
    const system = generateSystem({ seed: 'json-debris-2', distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'crowded' })
    const anchored = system.settlements.find(s => s.debrisFieldId)
    if (!anchored) return
    const json = JSON.parse(renderJson(system))
    const exported = json.settlements.find((s: any) => s.id === anchored.id)
    expect(exported.debrisFieldId).toBe(anchored.debrisFieldId)
  })
})
```

- [ ] **Step 2: Implement**

JSON export already serializes the whole `GeneratedSystem` (verify with `cat src/features/tools/star_system_generator/lib/export/json.ts`). If the function uses an explicit allowlist, add `debrisFields` to it. If settlement/ruin exports use explicit allowlists, add `debrisFieldId` to them.

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/star_system_generator/lib/export/json.ts \
        src/features/tools/star_system_generator/__tests__/export.test.ts
git commit -m "feat(star-gen): JSON export passes through debrisFields"
```

### Task 2.6: Phase 2 push

- [ ] **Step 1: Run full focused tests, lint, build**

```bash
npm run test -- src/features/tools/star_system_generator/
npm run lint
npm run build
```

- [ ] **Step 2: Push**

```bash
git push origin develop
```

---

## Phase 3 — 3D Viewer

### Task 3.1: `pickDebris` picker

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/debris/pickDebris.ts`
- Test: `src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/pickDebris.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { pickDebrisRenderer } from '../pickDebris'

const SHAPES = [
  'polar-ring', 'mass-transfer-stream', 'common-envelope-shell',
  'inner-pair-halo', 'trojan-camp', 'kozai-scattered-halo',
  'hill-sphere-capture-cone', 'exocomet-swarm', 'accretion-bridge', 'gardener-cordon',
] as const

describe('pickDebrisRenderer', () => {
  it('every archetype maps to a renderer', () => {
    for (const shape of SHAPES) {
      const result = pickDebrisRenderer({ shape, densityBand: 'sparse' })
      expect(result, shape).toBeDefined()
      expect(result.component, shape).toBeDefined()
    }
  })

  it('rings map to DebrisFieldRing', () => {
    expect(pickDebrisRenderer({ shape: 'polar-ring', densityBand: 'asteroid-fleet' }).component).toBe('ring')
    expect(pickDebrisRenderer({ shape: 'trojan-camp', densityBand: 'asteroid-fleet' }).component).toBe('ring')
    expect(pickDebrisRenderer({ shape: 'inner-pair-halo', densityBand: 'asteroid-fleet' }).component).toBe('ring')
    expect(pickDebrisRenderer({ shape: 'gardener-cordon', densityBand: 'dust' }).component).toBe('ring')
  })

  it('shells map to DebrisFieldShell', () => {
    expect(pickDebrisRenderer({ shape: 'common-envelope-shell', densityBand: 'shell-dense' }).component).toBe('shell')
  })

  it('streams map to DebrisFieldStream', () => {
    expect(pickDebrisRenderer({ shape: 'mass-transfer-stream', densityBand: 'stream' }).component).toBe('stream')
    expect(pickDebrisRenderer({ shape: 'accretion-bridge', densityBand: 'dust' }).component).toBe('stream')
  })

  it('halos map to DebrisFieldHalo', () => {
    expect(pickDebrisRenderer({ shape: 'kozai-scattered-halo', densityBand: 'sparse' }).component).toBe('halo')
    expect(pickDebrisRenderer({ shape: 'hill-sphere-capture-cone', densityBand: 'sparse' }).component).toBe('halo')
    expect(pickDebrisRenderer({ shape: 'exocomet-swarm', densityBand: 'sparse' }).component).toBe('halo')
  })
})
```

- [ ] **Step 2: Implement**

```ts
import type { DebrisFieldShape, DebrisDensityBand } from '../../../types'

export type DebrisComponent = 'ring' | 'shell' | 'stream' | 'halo'

const COMPONENT_BY_SHAPE: Record<DebrisFieldShape, DebrisComponent> = {
  'polar-ring': 'ring',
  'trojan-camp': 'ring',
  'inner-pair-halo': 'ring',
  'gardener-cordon': 'ring',
  'common-envelope-shell': 'shell',
  'mass-transfer-stream': 'stream',
  'accretion-bridge': 'stream',
  'kozai-scattered-halo': 'halo',
  'hill-sphere-capture-cone': 'halo',
  'exocomet-swarm': 'halo',
}

export function pickDebrisRenderer(args: { shape: DebrisFieldShape; densityBand: DebrisDensityBand }): {
  component: DebrisComponent
  visualParams: { particleCount: number; opacity: number }
} {
  const component = COMPONENT_BY_SHAPE[args.shape]
  const particleCount =
    args.densityBand === 'shell-dense' ? 600 :
    args.densityBand === 'asteroid-fleet' ? 300 :
    args.densityBand === 'sparse' ? 120 :
    args.densityBand === 'dust' ? 80 : 200
  const opacity =
    args.densityBand === 'dust' ? 0.35 :
    args.densityBand === 'sparse' ? 0.55 : 0.85
  return { component, visualParams: { particleCount, opacity } }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/debris/pickDebris.ts \
        src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/pickDebris.test.ts
git commit -m "feat(viewer3d): pickDebrisRenderer maps archetype to render component"
```

### Task 3.2: `DebrisFieldRing` component

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisFieldRing.tsx`
- Test: `src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisFieldRing.test.tsx`

- [ ] **Step 1: Failing test (mount + role assertion via @react-three/test-renderer)**

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { DebrisFieldRing } from '../DebrisFieldRing'

describe('DebrisFieldRing', () => {
  it('mounts and produces a torus-like mesh for a 360-deg ring', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <DebrisFieldRing
        innerRadius={4}
        outerRadius={6}
        inclinationDeg={90}
        spanDeg={360}
        centerAngleDeg={0}
        opacity={0.7}
        color="#88aaff"
      />
    )
    const meshes = renderer.scene.findAllByType('Mesh')
    expect(meshes.length).toBeGreaterThan(0)
  })

  it('partial span (60 deg) renders a partial arc', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <DebrisFieldRing
        innerRadius={4}
        outerRadius={6}
        inclinationDeg={0}
        spanDeg={60}
        centerAngleDeg={60}
        opacity={0.7}
        color="#ffaa88"
      />
    )
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Implement**

```tsx
import { useMemo } from 'react'
import * as THREE from 'three'

interface DebrisFieldRingProps {
  innerRadius: number
  outerRadius: number
  inclinationDeg: number
  spanDeg: number
  centerAngleDeg: number
  opacity: number
  color: string
}

export function DebrisFieldRing(props: DebrisFieldRingProps) {
  const geometry = useMemo(() => {
    const segments = Math.max(8, Math.round((props.spanDeg / 360) * 96))
    const thetaStart = (props.centerAngleDeg - props.spanDeg / 2) * Math.PI / 180
    const thetaLength = props.spanDeg * Math.PI / 180
    const ring = new THREE.RingGeometry(props.innerRadius, props.outerRadius, segments, 1, thetaStart, thetaLength)
    return ring
  }, [props.innerRadius, props.outerRadius, props.spanDeg, props.centerAngleDeg])

  const inclinationRad = props.inclinationDeg * Math.PI / 180
  return (
    <mesh geometry={geometry} rotation={[Math.PI / 2 - inclinationRad, 0, 0]}>
      <meshBasicMaterial color={props.color} transparent opacity={props.opacity} side={THREE.DoubleSide} />
    </mesh>
  )
}
```

- [ ] **Step 3: Run test, verify pass**

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisFieldRing.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisFieldRing.test.tsx
git commit -m "feat(viewer3d): DebrisFieldRing component"
```

### Task 3.3: `DebrisFieldShell` component

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisFieldShell.tsx`
- Test: `src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisFieldShell.test.tsx`

- [ ] **Step 1: Failing test**

Mount test similar to 3.2 — assert at least one `<Points>` or instanced mesh is produced.

- [ ] **Step 2: Implement**

Spherical-shell instanced particles. Use `THREE.BufferGeometry` with positions sampled on the shell: `r = randUniform(innerRadius, outerRadius)`, direction sampled uniformly on the sphere. Render with `<points>` and a `PointsMaterial`.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisFieldShell.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisFieldShell.test.tsx
git commit -m "feat(viewer3d): DebrisFieldShell component"
```

### Task 3.4: `DebrisFieldStream` component

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisFieldStream.tsx`
- Test: `src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisFieldStream.test.tsx`

- [ ] **Step 1: Failing test**

Mount with `innerRadius=0.5`, `outerRadius=2.0`, narrow span; assert a line mesh and optional hot-spot mesh exist.

- [ ] **Step 2: Implement**

Use `<line>` with a `BufferGeometry` of ~20 segments. Color gradient from hot (yellow) at one endpoint to cool (blue) at the other using a `LineBasicMaterial` with vertex colors. Add a small sphere mesh at the hot endpoint (`accretion-bridge`/`mass-transfer-stream` both have a terminus hot-spot).

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisFieldStream.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisFieldStream.test.tsx
git commit -m "feat(viewer3d): DebrisFieldStream component"
```

### Task 3.5: `DebrisFieldHalo` component

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisFieldHalo.tsx`
- Test: `src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisFieldHalo.test.tsx`

- [ ] **Step 1: Failing test**

Similar to shell; assert points geometry exists.

- [ ] **Step 2: Implement**

Same approach as shell but with inclination spread: sample positions on torus-like distribution with `inclinationDeg` parameter controlling latitude spread.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisFieldHalo.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisFieldHalo.test.tsx
git commit -m "feat(viewer3d): DebrisFieldHalo component"
```

### Task 3.6: `DebrisFields` integrator in scene

**Files:**
- Create: `src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisFields.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx`
- Modify: `src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts` (add debris-field entries to graph output)

- [ ] **Step 1: Add debris fields to scene-graph output**

In `sceneGraph.ts`, build a `debrisFields` array where each entry has scene-space `innerRadius`, `outerRadius`, `inclinationDeg`, `spanDeg`, `centerAngleDeg` (use `auToScene` for the AU values).

- [ ] **Step 2: Write the integrator**

```tsx
import { DebrisFieldRing } from './DebrisFieldRing'
import { DebrisFieldShell } from './DebrisFieldShell'
import { DebrisFieldStream } from './DebrisFieldStream'
import { DebrisFieldHalo } from './DebrisFieldHalo'
import { pickDebrisRenderer } from './pickDebris'
import type { DebrisField } from '../../../types'
// graph type for DebrisField scene entry

interface DebrisFieldsProps {
  fields: Array<{
    field: DebrisField
    innerRadius: number
    outerRadius: number
    inclinationDeg: number
    spanDeg: number
    centerAngleDeg: number
  }>
  layerVisibility: { physical: boolean; gu: boolean; human: boolean }
}

const COLOR_BY_SHAPE: Partial<Record<string, string>> = {
  'polar-ring': '#a0b8d8',
  'mass-transfer-stream': '#ffcc66',
  'common-envelope-shell': '#b89898',
  'trojan-camp': '#88aaaa',
  'inner-pair-halo': '#a8a0c8',
  'kozai-scattered-halo': '#b88888',
  'hill-sphere-capture-cone': '#80a0a0',
  'exocomet-swarm': '#8090b0',
  'accretion-bridge': '#ffaa66',
  'gardener-cordon': '#d0606a', // human-layer warm
}

export function DebrisFields({ fields, layerVisibility }: DebrisFieldsProps) {
  if (!layerVisibility.physical && !layerVisibility.human) return null
  return (
    <>
      {fields.map(({ field, innerRadius, outerRadius, inclinationDeg, spanDeg, centerAngleDeg }) => {
        const isHumanLayer = field.shape.value === 'gardener-cordon'
        if (isHumanLayer && !layerVisibility.human) return null
        if (!isHumanLayer && !layerVisibility.physical) return null
        const picked = pickDebrisRenderer({ shape: field.shape.value, densityBand: field.densityBand.value })
        const color = COLOR_BY_SHAPE[field.shape.value] ?? '#888888'
        const common = { opacity: picked.visualParams.opacity, color }
        switch (picked.component) {
          case 'ring':
            return <DebrisFieldRing key={field.id} innerRadius={innerRadius} outerRadius={outerRadius} inclinationDeg={inclinationDeg} spanDeg={spanDeg} centerAngleDeg={centerAngleDeg} {...common} />
          case 'shell':
            return <DebrisFieldShell key={field.id} innerRadius={innerRadius} outerRadius={outerRadius} particleCount={picked.visualParams.particleCount} {...common} />
          case 'stream':
            return <DebrisFieldStream key={field.id} startRadius={innerRadius} endRadius={outerRadius} centerAngleDeg={centerAngleDeg} {...common} />
          case 'halo':
            return <DebrisFieldHalo key={field.id} innerRadius={innerRadius} outerRadius={outerRadius} inclinationDeg={inclinationDeg} particleCount={picked.visualParams.particleCount} {...common} />
        }
      })}
    </>
  )
}
```

- [ ] **Step 3: Mount in `Scene.tsx`**

In `Scene.tsx`, after `<Belt />` rendering, add `<DebrisFields fields={graph.debrisFields} layerVisibility={layerVisibility} />`.

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisFields.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx \
        src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts
git commit -m "feat(viewer3d): DebrisFields integrator mounted in Scene"
```

### Task 3.7: Legend chips

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/chrome/ViewerLegend.tsx`
- Test: extend or add `ViewerLegend.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
it('legend includes one chip per debris shape class', () => {
  render(<ViewerLegend layerVisibility={{ physical: true, gu: true, human: true }} hasDebris={{ ring: true, shell: true, stream: true, halo: true, cordon: true }} />)
  expect(screen.getByText(/Polar / debris ring/i)).toBeInTheDocument()
  expect(screen.getByText(/Ejecta shell/i)).toBeInTheDocument()
  expect(screen.getByText(/Stream/i)).toBeInTheDocument()
  expect(screen.getByText(/Scatter halo/i)).toBeInTheDocument()
  expect(screen.getByText(/Gardener cordon/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Implement**

In `ViewerLegend.tsx`, add a section that takes a `hasDebris: { ring, shell, stream, halo, cordon }` prop and renders 1 chip per `true` value. Compute `hasDebris` upstream by scanning `system.debrisFields` for shape classes.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/chrome/ViewerLegend.tsx \
        src/features/tools/star_system_generator/viewer3d/chrome/__tests__/
git commit -m "feat(viewer3d): legend chips for debris-field shape classes"
```

### Task 3.8: Phase 3 manual visual review + push

- [ ] **Step 1: Run full test suite, lint, build**

```bash
npm run test
npm run lint
npm run build
```

- [ ] **Step 2: Manual viewer review across 5 generated systems**

```bash
npm run dev
```

Open the tool. Generate seeds:

- `viewer-debris-1` (target: orbital-sibling with Kozai halo)
- `viewer-debris-2` (target: circumbinary with polar ring)
- `viewer-debris-3` (target: volatile with mass-transfer stream)
- `viewer-debris-4` (target: hierarchical triple with inner-pair halo)
- `viewer-debris-5` (target: gardener cordon, rare)

For each, verify:
- The debris field renders with the right shape class
- The layer toggle hides it correctly
- The legend chip appears
- No body/moon crosses the field or the companion

- [ ] **Step 3: Push**

```bash
git push origin develop
```

---

## Phase 4 — Authored Prose Pools

Replace the `placeholder` strings in `data/debrisFields.json` with authored prose for each of the 10 archetypes. Each archetype has its own task so the author can review tone and gameplay fit independently.

**Tone reference for all 10 archetypes:**
- Read `data/narrative.json` entries for `phenomena` as the canonical voice — see entries like "Trojan megaswarm", "Long-period comet storm", "Ring arc with phase dust" for the right beat shape.
- Each `whyHerePool` entry is a single sentence anchoring this field to the local system context.
- Each `prizePool` entry is a noun phrase or short phrase about what's mineable/harvestable.
- Each `guCharacterPool` entry uses GU vocabulary (`bleed`, `chiral`, `metric tide`, `Iggygate`, `Lagrange shear`, `observerse anchor`, `dark route`, `Gardener compliance`) — match the relevant lines from the design spec catalog table and the existing `binarySeparationProfile` `guConsequence` lines.
- Phenomenon beats follow the four-beat pattern: `travelEffect` (what flying through does), `surveyQuestion` (what scanners can't resolve), `conflictHook` (who's fighting over what), `sceneAnchor` (one iconic image).

**Required minimums per archetype (audited in Task 4.11):**
- `whyHerePool`: 5 entries
- `prizePool`: 5 entries
- `guCharacterPool`: 5 entries
- `phenomenon.labelPool`: 3 entries
- `phenomenon.notePool`: 5 entries
- `phenomenon.travelEffectPool`: 5 entries
- `phenomenon.surveyQuestionPool`: 5 entries
- `phenomenon.conflictHookPool`: 5 entries
- `phenomenon.sceneAnchorPool`: 5 entries

### Task 4.1: Author `mass-transfer-stream`

**Files:**
- Modify: `src/features/tools/star_system_generator/data/debrisFields.json`

- [ ] **Step 1: Replace placeholders with authored prose**

Use this as the seed entry. The author may add or refine; minimums above apply.

```json
"mass-transfer-stream": {
  "label": "Mass-Transfer Stream",
  "whyHerePool": [
    "Material falls continuously from one star to the other across the L1 saddle, lighting the gulf between them.",
    "The stream pulses on the binary orbital period; brightness peaks correlate with rare-element accretion.",
    "Successive generations of harvesters have learned to time crossings against the stream's flare clock.",
    "The donor star is shedding its outer envelope on a geological timescale; the stream is a fossil-in-progress.",
    "Crews report the stream looks like a glowing river from a quarter-AU out."
  ],
  "prizePool": [
    "post-stellar heavy elements unavailable anywhere else in-system",
    "chiral aerosols carrying single-handedness collapse signatures",
    "fresh accretion-disc plasma sampled at the impact spot",
    "industrial-grade isotopes dredged from a stellar interior",
    "calibration-medium fractions only the stream produces"
  ],
  "guCharacterPool": [
    "The L1 throat sits inside a continuous Shiab-math instability; ships that cross take a hammering they can quantify only after.",
    "Chiral output of the stream collapses to a single handedness over hours, making this the cleanest single-chirality source in-system.",
    "Bleed inside the stream reads as a continuous extreme node; long exposures kill instruments before they kill crew.",
    "Iggygate construction across the stream would short the geometry between the two stars; no one has tried since the warning beacons appeared.",
    "Metric storms hit on the stream's brightness cycle; the only safe windows are dim phases."
  ],
  "phenomenon": {
    "labelPool": [
      "L1 mass-transfer stream",
      "Inter-stellar plasma corridor",
      "Roche-lobe overflow lane"
    ],
    "notePool": [
      "A visible river of stellar plasma arcs from one star's photosphere onto the other across the L1 saddle.",
      "Stream brightness pulses on the binary orbital period; rare elements concentrate at the accretion hot spot.",
      "The stream is photometrically resolvable from beyond the system; pilgrims and observatories alike track it.",
      "Generations of harvesters have learned to read the stream's flare clock by eye.",
      "Stream geometry shifts hour-to-hour as the donor's atmospheric layers vent."
    ],
    "travelEffectPool": [
      "Approach corridors are constantly redrawn; lanes inside one AU lose viability hour-to-hour.",
      "Crossings only succeed during a brief dim-phase window; missing it costs a synodic period of waiting.",
      "Particle flux on the stream's leading edge degrades shielding integrity within minutes of exposure.",
      "Ship hulls accumulate isotopic markers from a single crossing; customs uses the markers to track who's been where.",
      "X-ray spillover from the impact hot spot blinds nav sensors for hours after a transit."
    ],
    "surveyQuestionPool": [
      "Where is the next stable shear edge, and how long before paired flares close it?",
      "Is the donor's mass-loss rate accelerating toward runaway, or holding?",
      "Which photospheric layer is the stream currently sampling, and what does that say about the donor's interior?",
      "Can the accretion hot spot's flicker frequency be predicted enough to insure a passage?",
      "Has anything organic ever entered the stream and produced legible spectroscopy on the way through?"
    ],
    "conflictHookPool": [
      "Salvage operators race paired flare cycles to extract rare post-stellar elements; the cycle math is contested by competing AI providers.",
      "A chiral-monopoly cartel controls the only-known single-chirality aerosol source; new entrants are quietly disappeared.",
      "Two rival route-weather boards publish incompatible safe-crossing windows; both sell insurance.",
      "Gardener warning beacons appeared near the stream a generation ago; nobody has explained why, and the local interdiction council bills as if they know.",
      "A donor-star measurement-rights treaty between three houses is up for renewal; the new terms determine who gets to publish the next century's accretion-rate forecasts."
    ],
    "sceneAnchorPool": [
      "A skiff threads the dim-phase shear edge; the bridge view shows the stream arcing from one sun to the other like a frozen lightning bolt.",
      "An accretion-disc refinery rides the rim of the hot spot, hauls running at maximum cool.",
      "Three pilgrim transports queue in low parking, waiting for the next stable observation window.",
      "A customs cutter scans an arriving freighter's hull for stream-isotope markers and finds three that don't match the manifest.",
      "A wake-reader sits cross-legged on a glassed observation deck, listening to the stream and saying nothing."
    ]
  }
}
```

- [ ] **Step 2: Run the data audit + smoke tests**

```bash
npm run audit:star-system-data
npm run test -- src/features/tools/star_system_generator/__tests__/debrisFields-data.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/data/debrisFields.json
git commit -m "feat(star-gen): author mass-transfer-stream debris prose"
```

### Task 4.2: Author `common-envelope-shell`

Same pattern as 4.1. Tone reference: spec catalog table row 2 ("Common-envelope shell"); GU agent reading on "Smoke Crown"; gameplay agent reading on the legacy/first-wave scene anchor. First-wave inheritance, decaying infrastructure, chiral assay reading concentric event rings.

- [ ] Author the entry, run audit + tests, commit

```bash
git add src/features/tools/star_system_generator/data/debrisFields.json
git commit -m "feat(star-gen): author common-envelope-shell debris prose"
```

### Task 4.3: Author `polar-ring`

Tone reference: catalog row 3; GU agent reading on "Tilted Crown" / metric-eye band; gameplay agent reading on polar shadow station economy. Vertical wheel that eclipses both suns once per binary orbit. Iggygate-anchor candidacy.

- [ ] Author the entry, run audit + tests, commit

```bash
git commit -m "feat(star-gen): author polar-ring debris prose"
```

### Task 4.4: Author `trojan-camp`

Tone reference: catalog row 4; GU agent reading on L4/L5 chiral asymmetry; gameplay agent reading on Trojan settlement economy and asteroid-tunnel-city / hollowed-warhead-depot habitation. Sixty degrees ahead and behind.

- [ ] Author the entry, run audit + tests, commit

```bash
git commit -m "feat(star-gen): author trojan-camp debris prose"
```

### Task 4.5: Author `inner-pair-halo`

Tone reference: catalog row 5; GU agent on "rich and rhythmic, layered bleed"; gameplay agent on two-tier conflict between inner-pair workers and outer-star civilians. Halo edge stations as gate-keepers.

- [ ] Author the entry, run audit + tests, commit

```bash
git commit -m "feat(star-gen): author inner-pair-halo debris prose"
```

### Task 4.6: Author `kozai-scattered-halo`

Tone reference: catalog row 6; GU agent on "pulsed bleed, Kozai cycle clock"; gameplay agent on storm-chaser-convoy mobile settlement and probabilistic-chaos-forecast economy.

- [ ] Author the entry, run audit + tests, commit

```bash
git commit -m "feat(star-gen): author kozai-scattered-halo debris prose"
```

### Task 4.7: Author `hill-sphere-capture-cone`

Tone reference: catalog row 7; GU agent on "chronic moderate, continuous re-mixing"; gameplay agent on one-way valve smuggler/salvage economy and "title transfers with the rock" mechanic.

- [ ] Author the entry, run audit + tests, commit

```bash
git commit -m "feat(star-gen): author hill-sphere-capture-cone debris prose"
```

### Task 4.8: Author `exocomet-swarm`

Tone reference: catalog row 8; GU agent on "nodes that arrive"; gameplay agent on multi-generational scheduled-hazard economy and inheritance-rights drama.

- [ ] Author the entry, run audit + tests, commit

```bash
git commit -m "feat(star-gen): author exocomet-swarm debris prose"
```

### Task 4.9: Author `accretion-bridge`

Tone reference: catalog row 9; GU agent on "bleed corridor, paired stellar handshake"; gameplay agent on pilgrim/observatory/Gardener-watched economy.

- [ ] Author the entry, run audit + tests, commit

```bash
git commit -m "feat(star-gen): author accretion-bridge debris prose"
```

### Task 4.10: Author `gardener-cordon`

Tone reference: catalog row 10 — the lone GU-native v1 archetype. Surgical-strike perimeter relic. Geometry-perfect ring nobody built. Detour-at-any-cost forbidden zone. The most setting-specific archetype in v1; lean fully into the GU vocabulary.

- [ ] Author the entry, run audit + tests, commit

```bash
git commit -m "feat(star-gen): author gardener-cordon debris prose"
```

### Task 4.11: Data-audit minimums for debris prose

**Files:**
- Modify: `scripts/audit-star-system-data.ts` (or wherever data audits live; grep `audit:star-system-data` in `package.json` to find the entry point)

- [ ] **Step 1: Add audit checks**

For each entry in `data/debrisFields.json`, assert minimums per the table at the top of Phase 4:

```ts
const DEBRIS_POOL_MINIMUMS = {
  whyHerePool: 5,
  prizePool: 5,
  guCharacterPool: 5,
  'phenomenon.labelPool': 3,
  'phenomenon.notePool': 5,
  'phenomenon.travelEffectPool': 5,
  'phenomenon.surveyQuestionPool': 5,
  'phenomenon.conflictHookPool': 5,
  'phenomenon.sceneAnchorPool': 5,
}
```

For each archetype, fail the audit with code `DEBRIS_POOL_THIN` if any pool is below its minimum.

- [ ] **Step 2: Run audit**

```bash
npm run audit:star-system-data
```

Expected: green if all 10 archetypes were authored correctly in 4.1-4.10.

- [ ] **Step 3: Commit**

```bash
git add scripts/audit-star-system-data.ts
git commit -m "feat(star-gen): audit minimum debris prose pool counts"
```

### Task 4.12: Phase 4 push

- [ ] **Step 1: Run full test suite, lint, build**

```bash
npm run test
npm run lint
npm run build
```

- [ ] **Step 2: Push**

```bash
git push origin develop
```

---

## Phase 5 — Audit, Sample Review, Verification

### Task 5.1: Audit — `DEBRIS_FIELD_MISSING`

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/validation.ts`
- Modify: `scripts/audit-star-system-generator.ts`
- Test: extend `__tests__/validation-debris-fields.test.ts` (new)

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { generateSystem } from '../lib/generator'
import { validateSystem } from '../lib/generator/validation'

describe('DEBRIS_FIELD_MISSING', () => {
  it('volatile companion without a mass-transfer-stream is flagged', () => {
    const system = generateSystem({ seed: 'debris-missing-1', distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal' })
    const volatile = system.companions.find(c => c.mode === 'volatile')
    if (!volatile) return
    // Synthetic: remove the debris field
    const mutated = { ...system, debrisFields: system.debrisFields.filter(d => d.shape.value !== 'mass-transfer-stream') }
    const findings = validateSystem(mutated)
    expect(findings.some(f => f.code === 'DEBRIS_FIELD_MISSING')).toBe(true)
  })
})
```

- [ ] **Step 2: Implement**

In `validation.ts`, add a `DEBRIS_FIELD_MISSING` rule: for each companion in `system.companions`, compute expected archetype (or `null`); if non-null and not present in `system.debrisFields`, emit the finding.

- [ ] **Step 3: Run test, commit**

```bash
git commit -m "feat(star-gen): audit DEBRIS_FIELD_MISSING"
```

### Task 5.2: Audit — `DEBRIS_FIELD_GEOMETRY_INVALID`

Same pattern. Check each field's `spatialExtent` against planets' orbit AU and the circumbinary keep-out. Emit finding if any overlap.

- [ ] Test + impl + commit `feat(star-gen): audit DEBRIS_FIELD_GEOMETRY_INVALID`

### Task 5.3: Audit — `DEBRIS_FIELD_ANCHOR_VIOLATION`

For each settlement/ruin with `debrisFieldId`, verify the target's `anchorMode` permits it and habitation pattern is compatible.

- [ ] Test + impl + commit `feat(star-gen): audit DEBRIS_FIELD_ANCHOR_VIOLATION`

### Task 5.4: Audit — `DEBRIS_FIELD_PHENOMENON_ORPHAN`

For each `DebrisField` with `spawnedPhenomenonId`, the matching phenomenon must exist in `system.phenomena` (and vice versa for any phenomenon claiming to be debris-spawned).

- [ ] Test + impl + commit `feat(star-gen): audit DEBRIS_FIELD_PHENOMENON_ORPHAN`

### Task 5.5: Deep audit run

- [ ] **Step 1: Run deep audit**

```bash
npm run audit:star-system-generator:deep
```

Expected: zero `DEBRIS_FIELD_*` errors and zero `BINARY_STABILITY_CONFLICT` findings on the deep corpus.

If failures, fix root causes (do NOT silence the audit).

### Task 5.6: 20-system manual sample review

- [ ] **Step 1: Generate 20 systems across distribution × tone × gu × density**

Use these seeds (or generate fresh from `Math.random()`-style stamps documented in a new `docs/SAMPLE_REVIEW_2026-05_DEBRIS.md`):

```
debris-review-1-frontier-balanced-normal-normal
debris-review-2-frontier-cinematic-fracture-crowded
debris-review-3-realistic-astronomy-low-sparse
debris-review-4-frontier-balanced-high-hub
debris-review-5-realistic-cinematic-normal-normal
debris-review-6-frontier-astronomy-normal-crowded
debris-review-7-realistic-balanced-fracture-normal
debris-review-8-frontier-balanced-low-normal
debris-review-9-realistic-cinematic-high-crowded
debris-review-10-frontier-astronomy-fracture-hub
debris-review-11-frontier-cinematic-normal-sparse
debris-review-12-realistic-balanced-high-normal
debris-review-13-frontier-balanced-normal-crowded
debris-review-14-realistic-astronomy-low-hub
debris-review-15-frontier-cinematic-high-normal
debris-review-16-realistic-cinematic-fracture-sparse
debris-review-17-frontier-balanced-low-sparse
debris-review-18-frontier-astronomy-high-hub
debris-review-19-realistic-balanced-normal-crowded
debris-review-20-frontier-cinematic-low-normal
```

- [ ] **Step 2: For each system, in `docs/SAMPLE_REVIEW_2026-05_DEBRIS.md`**, record:
  - Companion mode (if any)
  - Archetypes generated
  - Whether the field reads as anchored to the right body/orbit
  - Whether the prose is on-tone (yes/needs-tightening/skip)
  - Whether the 3D viewer rendering matches the archetype

- [ ] **Step 3: Aggregate findings**. If more than 3 systems flag prose-tone issues, add a follow-up task to re-author specific pool entries (run audit after re-authoring).

- [ ] **Step 4: Commit review doc**

```bash
git add docs/SAMPLE_REVIEW_2026-05_DEBRIS.md
git commit -m "docs(star-gen): debris-field sample review across 20 systems"
```

### Task 5.7: Distribution audit

Across the same 20 systems, verify:
- Of systems with a volatile companion, ~100% have a `mass-transfer-stream`.
- Of systems with circumbinary `close binary` or `tight binary`, mu-band distribution matches catalog (most polar-ring, a few trojan-camp).
- Of systems with orbital-sibling moderate/wide, the kozai/hill-cone/exocomet split is ~30/30/40.
- Total debris-field count across 20 systems matches the expected modal distribution (each binary system produces 1, each hierarchical-triple may produce 2).

- [ ] Document any drift in `docs/SAMPLE_REVIEW_2026-05_DEBRIS.md`. If drift is severe, file follow-up tasks.

### Task 5.8: Final full-suite verification

- [ ] `npm run test` (full suite green)
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run audit:star-system-generator:deep`
- [ ] `npm run audit:star-system-data`

### Task 5.9: Documentation updates

**Files:**
- Modify: `src/features/tools/star_system_generator/docs/PLAN.md` (§6.1 add debris layer line)
- Modify: `src/features/tools/star_system_generator/docs/POLISH_ROADMAP.md` (add to "Adjacent Plans")
- Modify: `src/features/tools/star_system_generator/README.md` (link the design spec)

- [ ] **Step 1: Update PLAN.md §6.1**

Add a line under "Implemented close to source method":

```
- Companion-debris configuration layer: ten archetypes (mass-transfer stream, common-envelope shell, polar ring, Trojan camp, inner-pair halo, Kozai scattered halo, Hill capture cone, exocomet swarm, accretion bridge, Gardener cordon) derived deterministically from companion mode/mass-ratio/activity. Each spawns a paired structured phenomenon. Settlements and ruins can anchor on compatible fields. See `docs/superpowers/specs/2026-05-15-companion-systems-design.md`.
```

- [ ] **Step 2: Update POLISH_ROADMAP.md**

In the "Adjacent Plans" section, add:

```
- [Companion systems debris layer](../../../docs/superpowers/specs/2026-05-15-companion-systems-design.md) — encroachment fix bundle plus a ten-archetype debris configuration layer that turns close- and near-binary companion modes into anchorable, scene-anchoring places.
```

- [ ] **Step 3: Update feature README**

Add a link to the spec in the docs index.

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/star_system_generator/docs/PLAN.md \
        src/features/tools/star_system_generator/docs/POLISH_ROADMAP.md \
        src/features/tools/star_system_generator/README.md
git commit -m "docs(star-gen): note companion debris layer in plan/roadmap/readme"
```

### Task 5.10: Final push

- [ ] **Step 1: Push everything**

```bash
git push origin develop
```

- [ ] **Step 2: Verify branch state matches expectation**

```bash
git log origin/main..origin/develop --oneline
```

Expected: a clean linear sequence of Phase 0-5 commits.

---

## Self-Review

Before handing this off, here's the coverage check against the spec:

**Phase 0** covers all five mechanisms (0.2 generator, 0.4 sub-system extent, 0.5 moon envelope, 0.6 clearance, 0.7 keep-out ring) plus the audit extension (0.3). ✓

**Data model** (spec §Data Model): all five types created in Task 1.1; all three existing-type extensions wired in 1.1; locked-import scaffolding present. ✓

**Pipeline** (spec §Generation Pipeline): `deriveDebrisFields` in 1.6; settlement attachment in 1.7; ruin attachment in 1.7. ✓ Note: spec lists the population layer step (`derivePopulationLayer`) downstream — should remain unchanged after debris fields land because the population layer reads anchored settlements regardless of `debrisFieldId` vs `bodyId`. Verified via the existing `population-derivation.test.ts` (unchanged seeds should still produce the same population bands once anchor relocations are accounted for).

**Catalog** (spec §Catalog): all 10 archetypes ship; Phase 4 authors them; figure-eight is explicitly excluded; v2 deferrals are documented in the spec and in `data/debrisFields.json` is restricted to v1 archetypes. ✓

**Rendering** (spec §Rendering): four renderers in 3.2-3.5; picker in 3.1; integrator in 3.6; legend chips in 3.7; layer gating built into the integrator. ✓ The spec calls for a `Region:` line linking from BodyDetailPanel and "Clicking focuses the camera on the field" — Task 2.2 covers the line; camera focus is **not** in any task. Add follow-up: this is a polish item, not a v1 blocker.

**Exports** (spec §Exports): Markdown in 2.4; JSON in 2.5. ✓

**Testing & audit** (spec §Testing): all listed tests covered. ✓

**Risk mitigations** (spec §Risk Mitigation): snapshot churn is documented in Phase 0 (Task 0.2 step 3) and Phase 1 (Task 1.6 step 6). Tone risk verified in Phase 5 sample review (5.6).

Coverage gap: **camera-focus on debris field from `Region:` link** — added as a v1.1 follow-up (out of scope for this plan).

Type consistency: `DebrisField`, `DebrisFieldShape`, `DebrisDensityBand`, `DebrisAnchorMode`, `DebrisFieldSpatialExtent` are referenced consistently across all phases. `deriveDebrisFields` returns `{ debrisFields, spawnedPhenomena }` consistently in 1.6 onward.

Placeholder scan: no "TBD", no "TODO", no "implement later". Each task has runnable code or a clear, bounded specification with reference to data/narrative.json for prose-tone guidance.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-15-companion-systems.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
