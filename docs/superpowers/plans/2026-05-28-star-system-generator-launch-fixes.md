# Star System Generator — Pre-Launch Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the five confirmed findings from the multi-specialist pre-launch review of the Star System Generator (two medium 3D-viewer concerns, one medium export-reproducibility gap, two low UI-polish items) so the tool can go live cleanly.

**Architecture:** Each fix is small and local. The two testable-logic fixes (markdown linked-seed URL, fog layer count) are done test-first against existing test files. The 3D-viewer disposal fix gets a new render test modeled on the existing `DebrisVolumeFog.test.tsx` three.js-mock pattern. The two low-severity UI fixes are a stable React key and an ARIA association. No public APIs change shape; `buildSeedParams` is introduced as a shared helper to keep option-to-query encoding DRY across the export and the URL hook.

**Tech Stack:** Next.js 15 (static export), TypeScript (strict, no `any`), React 19, three.js + React Three Fiber, Vitest + @testing-library/react.

---

## CRITICAL — Test execution environment

**The full test suite must NOT be run on this machine.** The current shell is Node v24.15.0, but the `spineFullAxisMatrix` snapshot only matches on Node 20 (CI uses Node 20). Running `npm run test` with no filter will report a spurious snapshot failure unrelated to this work.

**Every test command in this plan runs a single, explicitly-named test file** via `npm run test -- <path>`. That keeps results trustworthy on Node 24. The full suite / CI gate (`npm run test:ci`) is left for CI on Node 20.

`npm run typecheck` and `npm run lint` are Node-version-independent and safe to run in full.

## Git workflow

Work happens on `develop` (per CLAUDE.md). Commit after each task. Conventional Commits with scope, e.g. `fix(viewer3d): ...`. Do not merge to `main` — that is the user's release step.

## File Structure

| File | Responsibility | Change |
| --- | --- | --- |
| `src/features/tools/star_system_generator/viewer3d/scene/Belt.tsx` | Belt instanced-mesh rendering + lifecycle | Modify: dispose instance buffers on unmount |
| `src/features/tools/star_system_generator/viewer3d/scene/__tests__/Belt.test.tsx` | Belt disposal regression test | Create |
| `src/features/tools/star_system_generator/lib/seedUrl.ts` | Seed/option → URL query encoding | Modify: add shared `buildSeedParams` + `OPTION_DEFAULTS` |
| `src/features/tools/star_system_generator/lib/__tests__/seedUrl.test.ts` | `buildSeedParams` unit test | Create |
| `src/features/tools/star_system_generator/lib/export/markdown.ts` | System → Markdown export | Modify: embed non-default options in linked-companion URL |
| `src/features/tools/star_system_generator/hooks/useGeneratorQueryState.ts` | URL ↔ generation-options state | Modify: reuse `buildSeedParams`/`OPTION_DEFAULTS` (DRY) |
| `src/features/tools/star_system_generator/__tests__/markdown-companion.test.ts` | Companion markdown export tests | Modify: assert options + encoded seed in linked URL |
| `src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisVolumeFog.tsx` | Volumetric fog layer construction | Modify: scale minimum layer count by `qualityScale` |
| `src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisVolumeFog.test.tsx` | Fog layer-count tests | Modify: add low-quality reduction test |
| `src/features/tools/star_system_generator/components/BodyDetailPanel.tsx` | Body detail field rows | Modify: stable React key for region rows |
| `src/features/tools/star_system_generator/components/CompanionSubSystem.tsx` | Companion sub-system disclosure | Modify: add `id` + `aria-controls` |
| `src/features/tools/star_system_generator/components/__tests__/CompanionSubSystem.test.tsx` | ARIA association test | Create |

---

### Task 1: Belt InstancedMesh instance buffers leaked on unmount (MEDIUM)

`Belt.tsx` renders its instanced group with `<primitive ... dispose={null} />`, which disables React Three Fiber's automatic disposal. The `useEffect` cleanup therefore is the only disposal path, but it disposes only the `ShaderMaterial` — never `instanceMatrix` or `instanceColor`. Each open/close of the viewer on a belt system orphans three GPU buffer pairs (one per shape bucket). The sibling component `debris/debrisChunks.tsx` (lines 118–125) already does this correctly; this task mirrors that pattern.

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Belt.tsx:152-161`
- Test: `src/features/tools/star_system_generator/viewer3d/scene/__tests__/Belt.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/star_system_generator/viewer3d/scene/__tests__/Belt.test.tsx`. It mocks `three`, `@react-three/fiber`, `usePrefersReducedMotion`, and `renderAssets` (mirroring the mock style in `debris/__tests__/DebrisVolumeFog.test.tsx`), then renders and unmounts `Belt` and asserts every InstancedMesh had both instance buffers disposed.

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

const { disposeCalls } = vi.hoisted(() => ({
  disposeCalls: { matrix: 0, color: 0, instanceMeshes: 0 },
}))

vi.mock('@react-three/fiber', () => ({
  useFrame: () => {},
}))

vi.mock('../../chrome/ViewerContext', () => ({
  usePrefersReducedMotion: () => false,
}))

vi.mock('../renderAssets', () => ({
  beltChunkGeometry: { type: 'chunk' },
  beltParticleGeometry: { type: 'particle' },
  beltShardGeometry: { type: 'shard' },
}))

vi.mock('three', () => {
  class Group {
    children: unknown[] = []
    add(child: unknown) { this.children.push(child) }
    traverse(cb: (o: unknown) => void) {
      cb(this)
      this.children.forEach((c) => cb(c))
    }
  }
  class Object3D {
    position = { set() {} }
    rotation = { set() {} }
    scale = { set() {} }
    matrix = {}
    updateMatrix() {}
  }
  class Color {
    set() { return this }
    multiplyScalar() { return this }
  }
  class ShaderMaterial {
    constructor(public options: unknown) {}
    dispose() {}
  }
  class InstancedMesh {
    instanceMatrix = { needsUpdate: false, dispose: () => { disposeCalls.matrix++ } }
    instanceColor = { needsUpdate: false, dispose: () => { disposeCalls.color++ } }
    material: unknown
    constructor(_geometry: unknown, material: unknown, _count: number) {
      this.material = material
      disposeCalls.instanceMeshes++
    }
    setMatrixAt() {}
    setColorAt() {}
  }
  return { Group, Object3D, Color, ShaderMaterial, InstancedMesh }
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      group: React.HTMLAttributes<HTMLElement> & { ref?: unknown; rotation?: unknown }
      primitive: React.HTMLAttributes<HTMLElement> & { object?: unknown; dispose?: unknown }
    }
  }
}

import { Belt } from '../Belt'
import type { BeltVisual } from '../../types'

const belt: BeltVisual = {
  id: 'belt-1',
  innerRadius: 4,
  outerRadius: 7,
  particleCount: 6,
  jitter: 0.2,
  color: '#998877',
  colors: ['#998877', '#aabbcc'],
  gapCount: 0,
  clumpiness: 0.3,
  inclination: 0,
  particleSizeScale: 1,
  renderArchetype: 'belt',
}

describe('Belt', () => {
  it('disposes instance matrix and color buffers for every InstancedMesh on unmount', () => {
    disposeCalls.matrix = 0
    disposeCalls.color = 0
    disposeCalls.instanceMeshes = 0

    const { unmount } = render(<Belt belt={belt} />)
    const created = disposeCalls.instanceMeshes
    expect(created).toBeGreaterThan(0)

    unmount()

    expect(disposeCalls.matrix).toBe(created)
    expect(disposeCalls.color).toBe(created)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/viewer3d/scene/__tests__/Belt.test.tsx`
Expected: FAIL — `disposeCalls.matrix` is `0` (received) but `created` (e.g. `3`) expected, because the current cleanup never disposes instance buffers.

- [ ] **Step 3: Apply the fix**

Edit `src/features/tools/star_system_generator/viewer3d/scene/Belt.tsx`. Replace the cleanup effect (lines 152–161):

```tsx
  useEffect(() => () => {
    instancedGroup.traverse((object) => {
      if (!(object instanceof THREE.InstancedMesh)) return
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose())
      } else {
        object.material.dispose()
      }
    })
  }, [instancedGroup])
```

with:

```tsx
  useEffect(() => () => {
    instancedGroup.traverse((object) => {
      if (!(object instanceof THREE.InstancedMesh)) return
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose())
      } else {
        object.material.dispose()
      }
      object.instanceMatrix.dispose()
      object.instanceColor?.dispose()
    })
  }, [instancedGroup])
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/viewer3d/scene/__tests__/Belt.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck + lint the changed files**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/Belt.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/__tests__/Belt.test.tsx
git commit -m "fix(viewer3d): dispose Belt instance buffers on unmount to stop GPU leak"
```

---

### Task 2: Markdown linked-companion URL omits generation options (MEDIUM)

The linked-independent companion export writes only `?seed=<value>`. If the parent system was generated with non-default options (e.g. `settlements=crowded`, `gu=fracture`), a reader who follows the link regenerates with defaults and gets a *different* companion system. The fix introduces a shared `buildSeedParams` helper (so the export and the URL hook encode options identically — DRY) and uses it for the linked URL. `URLSearchParams.toString()` also correctly percent-encodes the colon in the derived seed (`parent:c1` → `parent%3Ac1`), which `URLSearchParams.get('seed')` decodes back and `normalizeSeed` preserves (`:` is in its allow-list).

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/seedUrl.ts`
- Test: `src/features/tools/star_system_generator/lib/__tests__/seedUrl.test.ts` (create)
- Modify: `src/features/tools/star_system_generator/lib/export/markdown.ts:144-148`
- Modify: `src/features/tools/star_system_generator/hooks/useGeneratorQueryState.ts` (DRY refactor)
- Modify: `src/features/tools/star_system_generator/__tests__/markdown-companion.test.ts`

- [ ] **Step 1: Write the failing unit test for the new helper**

Create `src/features/tools/star_system_generator/lib/__tests__/seedUrl.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildSeedParams } from '../seedUrl'
import type { GenerationOptions } from '../../types'

const defaults: GenerationOptions = {
  seed: 'abc123',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

describe('buildSeedParams', () => {
  it('emits only the seed when all options are default', () => {
    expect(buildSeedParams(defaults).toString()).toBe('seed=abc123')
  })

  it('includes only non-default options', () => {
    const params = buildSeedParams({
      ...defaults,
      gu: 'fracture',
      settlements: 'crowded',
    })
    expect(params.get('seed')).toBe('abc123')
    expect(params.get('gu')).toBe('fracture')
    expect(params.get('settlements')).toBe('crowded')
    expect(params.has('distribution')).toBe(false)
    expect(params.has('tone')).toBe(false)
  })

  it('percent-encodes a derived companion seed and round-trips it', () => {
    const params = buildSeedParams({ ...defaults, seed: 'abc123:c1' })
    expect(params.toString()).toContain('seed=abc123%3Ac1')
    expect(new URLSearchParams(params.toString()).get('seed')).toBe('abc123:c1')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/lib/__tests__/seedUrl.test.ts`
Expected: FAIL — `buildSeedParams` is not exported (`SyntaxError`/`undefined is not a function`).

- [ ] **Step 3: Add the shared helper to `seedUrl.ts`**

Replace the entire contents of `src/features/tools/star_system_generator/lib/seedUrl.ts` with:

```ts
import type { GenerationOptions } from '../types'

export const OPTION_DEFAULTS: Omit<GenerationOptions, 'seed' | 'graphAware'> = {
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

export function buildSeedParams(options: GenerationOptions): URLSearchParams {
  const params = new URLSearchParams()
  params.set('seed', options.seed)
  if (options.distribution !== OPTION_DEFAULTS.distribution) params.set('distribution', options.distribution)
  if (options.tone !== OPTION_DEFAULTS.tone) params.set('tone', options.tone)
  if (options.gu !== OPTION_DEFAULTS.gu) params.set('gu', options.gu)
  if (options.settlements !== OPTION_DEFAULTS.settlements) params.set('settlements', options.settlements)
  return params
}

export function buildSeedHref(seed: string): string {
  if (typeof window === 'undefined') return `?seed=${encodeURIComponent(seed)}`
  const url = new URL(window.location.href)
  url.searchParams.set('seed', seed)
  return `${url.pathname}${url.search}`
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/lib/__tests__/seedUrl.test.ts`
Expected: PASS.

- [ ] **Step 5: Update the existing companion markdown test to assert options are embedded**

In `src/features/tools/star_system_generator/__tests__/markdown-companion.test.ts`, the `baseOptions` already uses `settlements: 'crowded'` (a non-default). Replace the `linked-independent` test (lines 32–38) with one that parses the emitted URL and asserts both the (decoded) seed and the non-default option are present:

```ts
  it('emits a Linked System line whose URL carries the derived seed and non-default options', () => {
    const seed = findSeedForMode('linked-independent')
    const sys = generateSystem({ ...baseOptions, seed })
    const md = exportSystemMarkdown(sys)

    const match = md.match(/Linked system:\s+`\?([^`]+)`/i)
    expect(match).not.toBeNull()

    const params = new URLSearchParams(match![1])
    expect(params.get('seed')).toBe(sys.companions[0].linkedSeed!.value)
    expect(params.get('settlements')).toBe('crowded')
  })
```

- [ ] **Step 6: Run the companion test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/markdown-companion.test.ts`
Expected: FAIL on the linked-independent case — the current export emits `?seed=<value>` with no `settlements` param, so `params.get('settlements')` is `null`.

- [ ] **Step 7: Update the markdown export to use the helper**

In `src/features/tools/star_system_generator/lib/export/markdown.ts`, add the import near the other relative imports at the top of the file (after line 13):

```ts
import { buildSeedParams } from '../seedUrl'
```

Then replace the linked-companion line (line 147):

```ts
      lines.push(`Linked system: \`?seed=${companion.linkedSeed.value}\``, '')
```

with:

```ts
      const linkedParams = buildSeedParams({ ...system.options, seed: companion.linkedSeed.value })
      lines.push(`Linked system: \`?${linkedParams.toString()}\``, '')
```

- [ ] **Step 8: Run both export tests to verify they pass**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/markdown-companion.test.ts src/features/tools/star_system_generator/__tests__/export.test.ts`
Expected: PASS.

- [ ] **Step 9: DRY the URL hook onto the shared helper**

In `src/features/tools/star_system_generator/hooks/useGeneratorQueryState.ts`:

Add to the imports at the top:

```ts
import { OPTION_DEFAULTS, buildSeedParams } from '../lib/seedUrl'
```

Replace the local `defaultOptions` declaration (lines 7–12):

```ts
const defaultOptions: Omit<GenerationOptions, 'seed'> = {
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}
```

with:

```ts
const defaultOptions: Omit<GenerationOptions, 'seed' | 'graphAware'> = OPTION_DEFAULTS
```

Then replace the param-building block inside `writeOptionsToUrl` (lines 51–56):

```ts
  const params = new URLSearchParams()
  params.set('seed', options.seed)
  if (options.distribution !== defaultOptions.distribution) params.set('distribution', options.distribution)
  if (options.tone !== defaultOptions.tone) params.set('tone', options.tone)
  if (options.gu !== defaultOptions.gu) params.set('gu', options.gu)
  if (options.settlements !== defaultOptions.settlements) params.set('settlements', options.settlements)
```

with:

```ts
  const params = buildSeedParams(options)
```

The rest of `writeOptionsToUrl` (the `query`/`pathname`/`replaceState` logic) is unchanged. Behavior is identical because `buildSeedParams` applies the same default-omission rules.

- [ ] **Step 10: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors. (If `GeneratorTone`/`GuPreference`/`SettlementDensity`/`GeneratorDistribution` become unused imports in the hook, leave them — they are still used by the `parse*` functions.)

- [ ] **Step 11: Commit**

```bash
git add src/features/tools/star_system_generator/lib/seedUrl.ts \
        src/features/tools/star_system_generator/lib/__tests__/seedUrl.test.ts \
        src/features/tools/star_system_generator/lib/export/markdown.ts \
        src/features/tools/star_system_generator/hooks/useGeneratorQueryState.ts \
        src/features/tools/star_system_generator/__tests__/markdown-companion.test.ts
git commit -m "fix(export): embed non-default options in linked-companion seed URL"
```

---

### Task 3: DebrisVolumeFog minimum layer count cannot be reduced by PerformanceMonitor (MEDIUM)

`volumeFogLayerCount` clamps the result to a hard minimum of 6 (disk) / 5 (shell) regardless of `qualityScale`. When `PerformanceMonitor` lowers `qualityScale` on a weak GPU, the per-field floor still forces ≥6 stacked semi-transparent fog disks; across multiple fog fields this overdraw can hold integrated/mobile GPUs below 20fps. The fix scales the minimum with quality (floored at 2 so a qualifying field never disappears entirely).

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisVolumeFog.tsx:41-49`
- Test: `src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisVolumeFog.test.tsx`

- [ ] **Step 1: Add the failing test**

In `src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisVolumeFog.test.tsx`, add this test inside the existing `describe('DebrisVolumeFog', ...)` block (after the first `it`):

```ts
  it('lets a low qualityScale drop fog layers below the full-quality floor for weak GPUs', () => {
    const profile = { ...defaultDebrisVisualProfile('exocomet-swarm'), chaos: 0.55, clumpiness: 0 }
    const full = volumeFogLayerCount(profile, 1, 'disk')
    const low = volumeFogLayerCount(profile, 0.35, 'disk')
    expect(low).toBeLessThan(full)
    expect(low).toBeLessThan(6)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisVolumeFog.test.tsx`
Expected: FAIL — at `qualityScale = 0.35` the current floor pins `low` to `6`, so `expect(low).toBeLessThan(6)` fails (received `6`).

- [ ] **Step 3: Apply the fix**

Edit `src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisVolumeFog.tsx`. In `volumeFogLayerCount` (lines 41–49), replace:

```ts
  const min = mode === 'disk' ? 6 : 5
  const max = mode === 'disk' ? 24 : 18
  return Math.max(min, Math.min(max, Math.round(base * quality)))
```

with:

```ts
  const min = mode === 'disk'
    ? Math.max(2, Math.round(6 * quality))
    : Math.max(2, Math.round(5 * quality))
  const max = mode === 'disk' ? 24 : 18
  return Math.max(min, Math.min(max, Math.round(base * quality)))
```

`quality` is clamped to `[0.35, 1.35]` by the existing line `const quality = Math.min(1.35, Math.max(0.35, qualityScale))`. At full quality (`quality === 1`) the floor is still 6/5, so default-quality output is unchanged. At `quality = 0.35` the floor drops to 2.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisVolumeFog.test.tsx`
Expected: PASS (existing tests in the file still pass — the two render tests use default `qualityScale = 1`, so their `> 8` / `> 6` mesh-count expectations are unaffected).

- [ ] **Step 5: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/debris/DebrisVolumeFog.tsx \
        src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisVolumeFog.test.tsx
git commit -m "fix(viewer3d): scale fog layer floor by qualityScale so weak GPUs can shed overdraw"
```

---

### Task 4: Duplicate React key `'Region'` in BodyDetailPanel (LOW)

When a body sits inside more than one settled debris field, `BodyDetailContent` produces multiple `{ label: 'Region', ... }` field rows that are rendered with `key={field.label}` — yielding duplicate keys. The minimal fix adds an *optional* `key` to the field type, sets it only on region rows (which are the sole source of duplicate labels), and renders with `key={field.key ?? field.label}`. Every non-region entry already has a unique label, so this leaves them untouched.

**Files:**
- Modify: `src/features/tools/star_system_generator/components/BodyDetailPanel.tsx:70, 88-91, 130-134`

- [ ] **Step 1: Add an optional `key` to the field type**

In `src/features/tools/star_system_generator/components/BodyDetailPanel.tsx`, replace the `fields` declaration (line 70):

```ts
  const fields: Array<{ label: string; value: ReactNode }> = [
```

with:

```ts
  const fields: Array<{ label: string; value: ReactNode; key?: string }> = [
```

- [ ] **Step 2: Set a unique key on the region rows**

Replace the region spread (lines 88–91):

```ts
    ...regions.map((region) => ({
      label: 'Region',
      value: <span className="text-[var(--text-primary)]">{region.archetypeName}</span>,
    })),
```

with:

```ts
    ...regions.map((region) => ({
      label: 'Region',
      key: `region-${region.id}`,
      value: <span className="text-[var(--text-primary)]">{region.archetypeName}</span>,
    })),
```

- [ ] **Step 3: Render by `key ?? label`**

Replace the map (lines 130–134):

```tsx
        {fields.map((field) => (
          <FieldRow key={field.label} label={field.label} layer="physical">
            {field.value}
          </FieldRow>
        ))}
```

with:

```tsx
        {fields.map((field) => (
          <FieldRow key={field.key ?? field.label} label={field.label} layer="physical">
            {field.value}
          </FieldRow>
        ))}
```

- [ ] **Step 4: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 5: Run the existing BodyDetail/StarSystemGenerator tests that exercise this component**

Run: `npm run test -- src/features/tools/star_system_generator/__tests__/StarSystemGenerator.test.tsx`
Expected: PASS (no behavior change; rows render identically, only keys differ).

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/components/BodyDetailPanel.tsx
git commit -m "fix(star-gen): give body-detail region rows stable React keys"
```

---

### Task 5: CompanionSubSystem expand button missing `aria-controls` (LOW)

The disclosure button has `aria-expanded` but no `aria-controls`, and the collapsible region has no `id`, so assistive tech cannot associate the toggle with the region it controls. This matches the existing `OrbitalTable`/`ExportPanel` pattern in the codebase.

**Files:**
- Modify: `src/features/tools/star_system_generator/components/CompanionSubSystem.tsx:24-45`
- Test: `src/features/tools/star_system_generator/components/__tests__/CompanionSubSystem.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/star_system_generator/components/__tests__/CompanionSubSystem.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CompanionSubSystem } from '../CompanionSubSystem'
import type { GeneratedSystem, StellarCompanion } from '../../types'

function makeCompanion(): StellarCompanion {
  // Minimal shape exercised by CompanionSubSystem; cast through unknown because
  // the component only reads star.*, subSystem.{bodies,settlements,gates,zones}.
  return {
    id: 'c1',
    star: {
      name: { value: 'Companion A' },
      spectralType: { value: 'M3V' },
      massSolar: { value: 0.4 },
      luminositySolar: { value: 0.05 },
      ageState: { value: 'mature' },
    },
    subSystem: {
      bodies: [{ id: 'b1', orbitAu: { value: 0.3 }, name: { value: 'A I' }, category: { value: 'planet' } }],
      settlements: [],
      gates: [],
      zones: {
        habitableInnerAu: { value: 0.1 },
        habitableOuterAu: { value: 0.3 },
        snowLineAu: { value: 0.8 },
      },
    },
  } as unknown as StellarCompanion
}

describe('CompanionSubSystem', () => {
  it('associates the toggle button with the collapsible region via aria-controls/id', () => {
    const system = {} as GeneratedSystem
    render(<CompanionSubSystem system={system} companion={makeCompanion()} />)

    const button = screen.getByRole('button')
    const controlsId = button.getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()

    fireEvent.click(button)
    const region = document.getElementById(controlsId!)
    expect(region).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/features/tools/star_system_generator/components/__tests__/CompanionSubSystem.test.tsx`
Expected: FAIL — `aria-controls` is absent, so `controlsId` is `null` and `expect(controlsId).toBeTruthy()` fails.

- [ ] **Step 3: Apply the fix**

In `src/features/tools/star_system_generator/components/CompanionSubSystem.tsx`, add a stable id constant after the `if (!sub) return null` guard (line 16):

```tsx
  const detailId = `companion-${companion.id}-detail`
```

Add `aria-controls={detailId}` to the button (currently lines 24–28):

```tsx
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={expanded}
        aria-controls={detailId}
      >
```

And add `id={detailId}` to the collapsible region (currently line 46):

```tsx
        <div id={detailId} className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/features/tools/star_system_generator/components/__tests__/CompanionSubSystem.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/components/CompanionSubSystem.tsx \
        src/features/tools/star_system_generator/components/__tests__/CompanionSubSystem.test.tsx
git commit -m "fix(a11y): associate CompanionSubSystem toggle with its region via aria-controls"
```

---

## Final verification (after all tasks)

- [ ] **Run the five touched test files together** (still avoiding the full suite / Node-24 snapshot):

```bash
npm run test -- \
  src/features/tools/star_system_generator/viewer3d/scene/__tests__/Belt.test.tsx \
  src/features/tools/star_system_generator/lib/__tests__/seedUrl.test.ts \
  src/features/tools/star_system_generator/__tests__/markdown-companion.test.ts \
  src/features/tools/star_system_generator/viewer3d/scene/debris/__tests__/DebrisVolumeFog.test.tsx \
  src/features/tools/star_system_generator/components/__tests__/CompanionSubSystem.test.tsx
```

Expected: all PASS.

- [ ] **Typecheck + lint clean:** `npm run typecheck && npm run lint`

- [ ] **Production build smoke test** (confirms static export still succeeds): `npm run build`
  Expected: build completes and exports to `out/`.

- [ ] **Push to `develop`:** `git push origin develop` (per CLAUDE.md release flow; do NOT merge to `main` — that is the user's deploy step).

> **Note on full-suite/CI validation:** The complete suite (`npm run test:ci`, which includes the `spineFullAxisMatrix` snapshot) must be run on **Node 20**, not on this Node 24 machine, or that pre-existing snapshot will report a false failure. CI already runs on Node 20.
