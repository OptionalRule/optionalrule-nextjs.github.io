# Star System Generator Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all confirmed findings from the 2026-06-12 code review of `src/features/tools/star_system_generator` (1 deferred-feature completion, 6 major fixes, 8 minor fixes; 2 findings closed as by-design with no code change).

**Architecture:** All changes are contained to the star system generator feature directory plus its test files. The generator is deterministic (seeded RNG, forked sub-streams); any change that alters RNG consumption or fact selection changes generated output for a given seed, which is acceptable — there are no golden-output snapshots of whole systems, only same-seed-twice equality tests and table-shape assertions. Graph rule changes may shift prose snapshots under `lib/generator/graph/__tests__/__snapshots__/`; inspect diffs and update snapshots only when the change is the intended one.

**Tech Stack:** Next.js 15 (static export), TypeScript strict (no `any`), React 19, Three.js + react-three-fiber, Vitest + Testing Library.

**Verification commands used throughout:**
- Targeted tests: `npx vitest run --config vitest.unit.config.ts <path>`
- Full suite: `npm run test` (1553 tests green at plan time)
- Types: `npm run typecheck` · Lint: `npm run lint`
- Generator audit: `npm run audit:star-system-generator:quick`

---

## Findings closed with NO code change (record only — do not "fix" these)

1. **`data/stellar.json` architectures `max: 13`** — intentional. The architecture roll is modified 2d6 clamped with `roll = Math.max(2, Math.min(13, roll))` (`lib/generator/index.ts:687`), and `generator-determinism.test.ts` asserts the `[12, 13]` row by name ("matches the modified 2d6 architecture table"). Not a data error.
2. **`SUPPRESSES:authority-over-hiddenTruth` "inverted prose"** — by design. The rule's `defaultVisibility` is `'hidden'`, and `render/templates/suppressesTemplates.ts` documents: "Hidden-visibility edges never reach body[] (cluster filter)." The awkward body templates never render for this rule; the hook templates read correctly with the settlement as object.
3. **Reframing of the "critical" ruins finding** — the empty `new Map()` at `lib/generator/index.ts:4426` is a *documented deferral*, not an accident: `__tests__/debrisField-attachment.test.ts` has a guard test "ruins do not gain debrisFieldId in v1 (HumanRemnant has no body-id reference for orbit lookup)". Task 1 completes the deferred feature (ruin `location.value` is always exactly `body.name.value`, set in `generateHumanRemnants` at `index.ts:3734`, so orbit lookup is feasible without schema change) and replaces the guard test.

---

## Task 0: Branch setup and baseline

**Files:** none (git only)

- [ ] **Step 1: Switch to develop and sync**

```bash
git switch develop
git pull origin develop
git log --oneline -3 develop main
```

If `main` has commits not on `develop` (at plan time: `52daa54 ci: run deploy workflow on node 24`, `7429c29 chore: dep upgrades`), merge them in:

```bash
git merge main
```

- [ ] **Step 2: Confirm baseline is green**

Run: `npm run test 2>&1 | tail -5`
Expected: `Test Files  192 passed`, `Tests  1553 passed` (counts may have drifted slightly; all green is what matters).

---

## Task 1: Complete deferred ruin → debris-field attachment

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts:4416-4427`
- Test: `src/features/tools/star_system_generator/__tests__/debrisField-attachment.test.ts`

Background: `attachRuinsToDebrisFields` (`lib/generator/debrisFields.ts:429-450`) looks up each ruin's orbit via `ruinBodyOrbitById.get(ruin.id)` and skips the ruin on a miss. The call site passes `new Map()`, so no ruin ever attaches. Ruins carry no `bodyId` — but `ruin.location.value` is always exactly the host body's `name.value`.

- [ ] **Step 1: Replace the v1 guard test with positive tests**

In `__tests__/debrisField-attachment.test.ts`, delete the entire test `it('ruins do not gain debrisFieldId in v1 (HumanRemnant has no body-id reference for orbit lookup)', ...)` and replace it with these two tests (same `describe` block, reusing the existing `baseOptions` const):

```ts
  it('ruins attached to debris fields lie within the field spatial extent', () => {
    for (let i = 0; i < 200; i++) {
      const sys = generateSystem({ ...baseOptions, gu: 'fracture' as const, settlements: 'crowded' as const, seed: `attach-ruin-extent-${i}` })
      const orbitByName = new Map(sys.bodies.map(b => [b.name.value, b.orbitAu.value]))
      for (const r of sys.ruins) {
        if (!r.debrisFieldId) continue
        const field = sys.debrisFields.find(d => d.id === r.debrisFieldId)
        expect(field, `ruin ${r.id} references missing field ${r.debrisFieldId}`).toBeTruthy()
        const orbit = orbitByName.get(r.location.value)
        expect(orbit, `ruin ${r.id} location ${r.location.value} matches no body`).toBeDefined()
        expect(orbit!).toBeGreaterThanOrEqual(field!.spatialExtent.innerAu.value)
        expect(orbit!).toBeLessThanOrEqual(field!.spatialExtent.outerAu.value)
        expect(field!.anchorMode.value, `ruin on unanchorable field ${field!.id}`).not.toBe('unanchorable')
      }
    }
  })

  it('at least one ruin attaches to a debris field somewhere in the sweep', () => {
    let totalAttached = 0
    for (let i = 0; i < 200; i++) {
      const sys = generateSystem({ ...baseOptions, gu: 'fracture' as const, settlements: 'crowded' as const, seed: `attach-ruin-sweep-${i}` })
      totalAttached += sys.ruins.filter(r => r.debrisFieldId).length
    }
    expect(totalAttached, 'no ruin attached across 200 fracture-gu seeds').toBeGreaterThan(0)
  })
```

Note: the first test is vacuously green before the fix (no ruin has `debrisFieldId`); the second is the failing TDD driver.

- [ ] **Step 2: Run to verify the sweep test fails**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/__tests__/debrisField-attachment.test.ts`
Expected: FAIL — "no ruin attached across 200 fracture-gu seeds" (totalAttached = 0). Other tests in the file pass.

- [ ] **Step 3: Build the ruin orbit map at the call site**

In `lib/generator/index.ts`, the current code (~line 4416):

```ts
  const bodyOrbitAuById = new Map(bodies.map(b => [b.id, b.orbitAu.value]))
  const settlementsWithDebris = attachSettlementsToDebrisFields(
    rootRng.fork('debris-settlement-anchor'),
    reshapedSettlements,
    debrisFields,
    bodyOrbitAuById,
  )
  const ruinsWithDebris = attachRuinsToDebrisFields(
    rootRng.fork('debris-ruin-anchor'),
    ruins,
    debrisFields,
    new Map(),
  )
```

Replace the `attachRuinsToDebrisFields` call (keep the settlement block unchanged) with:

```ts
  const bodyOrbitAuByName = new Map(bodies.map(b => [b.name.value, b.orbitAu.value]))
  const ruinBodyOrbitById = new Map<string, number>()
  for (const ruin of ruins) {
    const ruinOrbitAu = bodyOrbitAuByName.get(ruin.location.value)
    if (ruinOrbitAu !== undefined) ruinBodyOrbitById.set(ruin.id, ruinOrbitAu)
  }
  const ruinsWithDebris = attachRuinsToDebrisFields(
    rootRng.fork('debris-ruin-anchor'),
    ruins,
    debrisFields,
    ruinBodyOrbitById,
  )
```

- [ ] **Step 4: Run the attachment tests**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/__tests__/debrisField-attachment.test.ts`
Expected: PASS. If the sweep test still finds 0 attachments, widen the loop to 500 seeds before concluding the fix is wrong — attachment requires a ruin's body inside a field extent *and* a probability roll (`ATTACHMENT_PROB` in `debrisFields.ts:394`). If still 0 at 500, debug `ruinBodyOrbitById` contents for one seed rather than weakening the test.

- [ ] **Step 5: Run the feature suite (validation tests consume `ruin.debrisFieldId`)**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator`
Expected: PASS. `validation-debris-fields.test.ts` already validates debris-anchored ruins (`validation.ts:793-795`) — this leg of validation now exercises real data for the first time. If a validation test fails, the failure is new signal about the attachment logic; investigate, don't suppress.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/index.ts src/features/tools/star_system_generator/__tests__/debrisField-attachment.test.ts
git commit -m "feat(star-system): complete deferred ruin attachment to debris fields"
```

---

## Task 2: Deduplicate graph rule faction helpers

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/graph/rules/factionHelpers.ts`
- Modify: `lib/generator/graph/rules/contestsRules.ts`, `controlsRules.ts`, `suppressesRules.ts`, `hidesFromRules.ts`, `contradictsRules.ts` (delete local copies, import shared)

Duplication map (verified): `getFactionEntities` ×3 (contests:8, controls:8, suppresses:8), `factionFactIdsForName` ×4 (contests:12, controls:12, suppresses:12, hidesFrom:8), `findControllingFaction` ×3 (suppresses:24, hidesFrom:20, contradicts:9).

- [ ] **Step 1: Confirm the copies are byte-identical**

```bash
cd src/features/tools/star_system_generator/lib/generator/graph/rules
for fn in getFactionEntities factionFactIdsForName findControllingFaction; do
  echo "== $fn"; grep -A14 "^function $fn" contestsRules.ts controlsRules.ts suppressesRules.ts hidesFromRules.ts contradictsRules.ts 2>/dev/null | md5sum
done
```

Eyeball the bodies with `grep -A20` if hashes are unclear. If any copy differs semantically, STOP and report the divergence before deduplicating — that divergence is itself a bug to surface, not silently resolve.

- [ ] **Step 2: Create the shared module**

Create `factionHelpers.ts` with the exact bodies currently in `suppressesRules.ts:8-40` (the canonical copy), exported:

```ts
import type { NarrativeFact } from '../../../../types'
import type { BuildCtx } from './ruleTypes'
import type { EntityRef } from '../types'
import { containsWord } from './settingPatterns'
import { buildFactionMetadataByName } from '../../factions'

export function getFactionEntities(entities: ReadonlyArray<EntityRef>): EntityRef[] {
  return entities.filter(e => e.kind === 'namedFaction')
}

export function factionFactIdsForName(
  factsByKind: ReadonlyMap<string, ReadonlyArray<NarrativeFact>>,
  name: string,
): string[] {
  const facts = factsByKind.get('namedFaction') ?? []
  const ids: string[] = []
  for (const fact of facts) {
    if (fact.value.value === name) ids.push(fact.id)
  }
  return ids
}

export function findControllingFaction(settlement: EntityRef, ctx: BuildCtx): EntityRef | undefined {
  const authorityFacts = (ctx.factsBySubjectId.get(settlement.id) ?? [])
    .filter(f => f.kind === 'settlement.authority')
  if (authorityFacts.length === 0) return undefined
  const authorityText = authorityFacts[0].value.value
  const factionMeta = buildFactionMetadataByName(ctx.factsByKind)
  const factionEntities = ctx.entities.filter(e => e.kind === 'namedFaction')
  const matched: EntityRef[] = []
  for (const factionEntity of factionEntities) {
    const faction = factionMeta.get(factionEntity.displayName)
    if (!faction) continue
    if (faction.domains.some(d => containsWord(authorityText, d))) {
      matched.push(factionEntity)
    }
  }
  return matched.length === 1 ? matched[0] : undefined
}
```

Note: the relative import paths above are correct for `suppressesRules.ts`'s siblings — `factionHelpers.ts` lives in the same directory, so copy the import specifiers exactly as they appear at the top of `suppressesRules.ts`.

- [ ] **Step 3: Update the five rule files**

In each of `contestsRules.ts`, `controlsRules.ts`, `suppressesRules.ts`, `hidesFromRules.ts`, `contradictsRules.ts`: delete the local function definitions listed in the duplication map and add the corresponding named imports from `'./factionHelpers'`. Remove any imports that become unused in each file (e.g., `buildFactionMetadataByName`, `NarrativeFact`) — `npm run lint` will flag leftovers.

- [ ] **Step 4: Verify behavior unchanged**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/lib/generator/graph`
Expected: PASS with zero snapshot changes (this commit is a pure move).
Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 5: Commit the move**

```bash
git add src/features/tools/star_system_generator/lib/generator/graph/rules/
git commit -m "refactor(star-system): deduplicate graph rule faction helpers into factionHelpers.ts"
```

- [ ] **Step 6: Add the authority-fact tiebreaker (separate commit)**

In `factionHelpers.ts`, make the chosen authority fact order-independent:

```ts
  const authorityFacts = (ctx.factsBySubjectId.get(settlement.id) ?? [])
    .filter(f => f.kind === 'settlement.authority')
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
```

- [ ] **Step 7: Run graph tests; inspect any snapshot diffs**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/lib/generator/graph`
If prose snapshots under `__snapshots__/` change: confirm the diff is attributable to a settlement with multiple authority facts now resolving to a different (id-sorted) fact, then update with `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/lib/generator/graph -u` and re-run. If snapshots change for any other apparent reason, STOP and investigate.

- [ ] **Step 8: Commit**

```bash
git add -A src/features/tools/star_system_generator/lib/generator/graph/
git commit -m "fix(star-system): stable id-sort tiebreaker for authority fact selection"
```

---

## Task 3: Unify HOSTS:body-ruin location matching with WITNESSES

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/rules/hostsRules.ts:49-77`
- Test: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/hostsRules.test.ts`

`hostsBodyRuinRule` requires `ruin.location.value` to exactly equal a body `displayName`; `witnessesAiSituationRuinRule` uses word-boundary `containsWord`. A location like "Kerrigan IV surface" gets a WITNESSES edge but no HOSTS edge.

- [ ] **Step 1: Write the failing test**

Append to `hostsRules.test.ts` (it already imports `hostsBodyRuinRule` and defines `makeCtx`):

```ts
describe('HOSTS:body-ruin location matching', () => {
  it('matches a ruin whose location embeds the body name in a longer phrase', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Kerrigan IV' } }],
        settlements: [],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [],
        ruins: [{ id: 'remnant-1', location: { value: 'Kerrigan IV surface' } }],
        narrativeFacts: [],
      },
      entities: [
        { kind: 'body', id: 'body-1', displayName: 'Kerrigan IV', layer: 'physical' },
        { kind: 'ruin', id: 'remnant-1', displayName: 'Remnant', layer: 'human' },
      ],
    })
    const matches = hostsBodyRuinRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('body-1')
    expect(matches[0].object.id).toBe('remnant-1')
  })

  it('prefers the longest matching body name when several names appear in the location', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [
          { id: 'body-1', name: { value: 'Kerrigan' } },
          { id: 'body-2', name: { value: 'Kerrigan Reach' } },
        ],
        settlements: [],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [],
        ruins: [{ id: 'remnant-1', location: { value: 'Kerrigan Reach orbital band' } }],
        narrativeFacts: [],
      },
      entities: [
        { kind: 'body', id: 'body-1', displayName: 'Kerrigan', layer: 'physical' },
        { kind: 'body', id: 'body-2', displayName: 'Kerrigan Reach', layer: 'physical' },
        { kind: 'ruin', id: 'remnant-1', displayName: 'Remnant', layer: 'human' },
      ],
    })
    const matches = hostsBodyRuinRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('body-2')
  })
})
```

If `makeCtx`'s `EntityInventoryInput` ruin shape requires more fields than `{ id, location }` (check the type error output), mirror the minimal ruin shape used elsewhere in the graph test files.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/lib/generator/graph/__tests__/hostsRules.test.ts`
Expected: both new tests FAIL with `expected [] to have length 1`.

- [ ] **Step 3: Implement exact-then-containsWord matching**

In `hostsRules.ts`, add `containsWord` to the existing import from `'./settingPatterns'` (create the import if the file has none). Replace the body of `hostsBodyRuinRule.match`'s lookup loop:

```ts
  match(ctx) {
    const matches: RuleMatch[] = []
    const bodyRefs = ctx.entities.filter(e => e.kind === 'body')
    const bodyByName = new Map<string, EntityRef>()
    for (const e of bodyRefs) bodyByName.set(e.displayName, e)
    for (const ruin of ctx.input.ruins) {
      const locName = ruin.location?.value
      if (!locName) continue
      let bodyRef = bodyByName.get(locName)
      if (!bodyRef) {
        const candidates = bodyRefs
          .filter(b => containsWord(locName, b.displayName))
          .sort((a, b) => b.displayName.length - a.displayName.length || (a.id < b.id ? -1 : 1))
        bodyRef = candidates[0]
      }
      if (!bodyRef) continue
      const ruinRef = ctx.entitiesById.get(ruin.id)
      if (!ruinRef) continue
      const groundingFactIds = (ctx.factsBySubjectId.get(ruin.id) ?? [])
        .filter(f => f.kind === 'ruin.type')
        .map(f => f.id)
      matches.push({ subject: bodyRef, object: ruinRef, groundingFactIds })
    }
    matches.sort((a, b) => {
      if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
      return a.object.id < b.object.id ? -1 : 1
    })
    return matches
  },
```

(The existing `matches.sort` and `build()` are unchanged; only the lookup changes. Longest-name-first with id tiebreak keeps the fallback deterministic.)

- [ ] **Step 4: Run graph tests**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/lib/generator/graph`
Expected: PASS. Main-system ruin locations are exact body names today, so the integration/spine snapshots should not change. If a snapshot does change, a previously-unmatched ruin location now matches — verify the new edge is sensible, then update the snapshot.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/graph/rules/hostsRules.ts src/features/tools/star_system_generator/lib/generator/graph/__tests__/hostsRules.test.ts
git commit -m "fix(star-system): HOSTS body-ruin rule matches embedded body names like WITNESSES"
```

---

## Task 4: CONTRADICTS qualifier — use template default instead of generic "record"

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/rules/contradictsRules.ts:65`
- Test: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/contradictsRules.test.ts`

When `contradictsRuinHookAuthorityRule` fires on a contradiction keyword with zero domain overlap, `concretizeDomain(overlap[0])` is `concretizeDomain(undefined)` → the literal `'record'`. The contradicts template already has a designed fallback: `"...on the {qualifier|same point}."` — passing `undefined` lets it render "on the same point" instead of "on the record".

- [ ] **Step 1: Write the failing test**

In `contradictsRules.test.ts` (helpers `makeCtx` and `makeFact` already exist), add a test that builds a ruin fact and an authority fact with **disjoint** `domains` where one fact's `value.value` contains a `CONTRADICTION_KEYWORDS` entry (e.g., `'falsified'`), wires the matching settlement/body/ruin entities the same way the file's existing `contradictsRuinHookAuthorityRule` tests do (copy the nearest existing fixture in that file and change only `domains` and the value text), then asserts:

```ts
    const matches = contradictsRuinHookAuthorityRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].qualifier).toBeUndefined()
```

If an existing test in the file currently asserts `qualifier === 'record'` (or `concretizeDomain(undefined)`) for the keyword-only path, update that assertion to `toBeUndefined()` as part of this step.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/lib/generator/graph/__tests__/contradictsRules.test.ts`
Expected: FAIL — `expected 'record' to be undefined`.

- [ ] **Step 3: Implement**

In `contradictsRules.ts:65`, change:

```ts
          qualifier: concretizeDomain(overlap[0]),
```

to:

```ts
          qualifier: overlap.length > 0 ? concretizeDomain(overlap[0]) : undefined,
```

(`concretizeDomain` remains imported — it is still used at line 123.)

- [ ] **Step 4: Run graph tests, inspect snapshot diffs**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/lib/generator/graph`
Snapshot diffs replacing "on the record" with "on the same point" (or the template's other default adjuncts) are the intended change — update snapshots if they appear. Anything else: investigate.

- [ ] **Step 5: Commit**

```bash
git add -A src/features/tools/star_system_generator/lib/generator/graph/
git commit -m "fix(star-system): contradicts rule uses template default qualifier when domains do not overlap"
```

---

## Task 5: Remove non-null assertion on `linkedSeed`

**Files:**
- Modify: `src/features/tools/star_system_generator/components/SystemOverview.tsx:137-138`

- [ ] **Step 1: Guard instead of assert**

Current:

```tsx
  if (companion.mode === 'linked-independent') {
    const url = buildSeedHref(companion.linkedSeed!.value)
```

Change to:

```tsx
  if (companion.mode === 'linked-independent' && companion.linkedSeed) {
    const url = buildSeedHref(companion.linkedSeed.value)
```

A `linked-independent` companion without `linkedSeed` (impossible today, unguaranteed by the type) now falls through to the default companion rendering below the `if` instead of throwing.

- [ ] **Step 2: Verify**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/__tests__/SystemOverview-companions.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/components/SystemOverview.tsx
git commit -m "fix(star-system): guard linkedSeed access instead of non-null assertion"
```

---

## Task 6: Robust export download (Firefox) 

**Files:**
- Modify: `src/features/tools/star_system_generator/components/ExportPanel.tsx:43-55`
- Test: Create `src/features/tools/star_system_generator/__tests__/ExportPanel-download.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExportPanel } from '../components/ExportPanel'
import { generateSystem } from '../lib/generator'

const system = generateSystem({
  seed: '7f3a9c2e41b8d09a',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
})

describe('ExportPanel download', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('appends the temporary anchor to the DOM and removes it after click', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')
    render(<ExportPanel system={system} />)
    await userEvent.click(screen.getByRole('button', { name: 'Show exports' }))
    await userEvent.click(screen.getByRole('button', { name: 'Download Markdown' }))
    const appendedAnchor = appendSpy.mock.calls
      .map(c => c[0])
      .find((n): n is HTMLAnchorElement => n instanceof HTMLAnchorElement && n.download.endsWith('.md'))
    expect(appendedAnchor).toBeTruthy()
    expect(removeSpy.mock.calls.map(c => c[0])).toContain(appendedAnchor)
  })
})
```

Note: the `ExportPreview` download buttons carry `downloadLabel="Download Markdown"` / `"Download JSON"` — if `getByRole` misses (label rendered as icon-only with aria-label), inspect the `ExportPreview` component at the bottom of `ExportPanel.tsx` and match its actual accessible name.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/__tests__/ExportPanel-download.test.tsx`
Expected: FAIL — no anchor was appended (`expect(appendedAnchor).toBeTruthy()`).

- [ ] **Step 3: Implement**

Replace the tail of `downloadExport` in `ExportPanel.tsx`:

```ts
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/__tests__/ExportPanel-download.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/components/ExportPanel.tsx src/features/tools/star_system_generator/__tests__/ExportPanel-download.test.tsx
git commit -m "fix(star-system): append download anchor to DOM and defer blob revocation for Firefox"
```

---

## Task 7: Safe SSR default for WebGL detection

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx:49`

- [ ] **Step 1: Invert the server-side default**

Current:

```tsx
  const [supported] = useState<boolean>(() => typeof document === 'undefined' ? true : detectWebGL())
```

Change to:

```tsx
  const [supported] = useState<boolean>(() => typeof document === 'undefined' ? false : detectWebGL())
```

The viewer mounts inside a client-only modal, so this branch should never run in practice; `false` makes the prerender path render the fallback rather than attempting a `<Canvas>`.

- [ ] **Step 2: Verify**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/Scene.tsx
git commit -m "fix(star-system): default to unsupported WebGL during prerender"
```

---

## Task 8: Generic `SelectControl` — remove the four `as` casts

**Files:**
- Modify: `src/features/tools/star_system_generator/components/GeneratorControls.tsx`

- [ ] **Step 1: Make `SelectControl` generic and drop the casts**

Replace the `SelectControl` definition (lines 58-85) with:

```tsx
function SelectControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<[T, string]>
  onChange: (value: T) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}
```

(The single `as T` inside is the unavoidable DOM-boundary cast — `event.target.value` is `string`, but the rendered options are statically `T`. This replaces four call-site casts with one boundary cast.)

Then simplify all four call sites, e.g.:

```tsx
      <SelectControl
        label="Distribution"
        value={options.distribution}
        onChange={(distribution) => onChange({ distribution })}
        options={[
          ['frontier', 'Reachable frontier'],
          ['realistic', 'Realistic local-ish'],
        ]}
      />
```

Apply the same pattern to Tone, GU Intensity, and Settlements: `onChange={(tone) => onChange({ tone })}`, `onChange={(gu) => onChange({ gu })}`, `onChange={(settlements) => onChange({ settlements })}`. TypeScript infers `T` from `value`; the option arrays type-check against the union.

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator`
Expected: clean and PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/components/GeneratorControls.tsx
git commit -m "refactor(star-system): generic SelectControl removes onChange union casts"
```

---

## Task 9: Deduplicate `formatOrbitContext`

**Files:**
- Create: `src/features/tools/star_system_generator/lib/orbitContext.ts`
- Modify: `components/OrbitalTable.tsx:198-211`, `components/BodyDetailPanel.tsx:299-312`

- [ ] **Step 1: Check for other `formatRatio` call sites**

```bash
grep -n "formatRatio" src/features/tools/star_system_generator/components/OrbitalTable.tsx src/features/tools/star_system_generator/components/BodyDetailPanel.tsx
```

If `formatRatio` is called anywhere besides inside `formatOrbitContext`, export it from the new module too; otherwise keep it private.

- [ ] **Step 2: Create the shared module**

`src/features/tools/star_system_generator/lib/orbitContext.ts`:

```ts
import type { GeneratedSystem } from '../types'

export function formatOrbitContext(orbitAu: number, system: GeneratedSystem): string {
  const hzCenter = system.zones.habitableCenterAu.value
  const snowLine = system.zones.snowLineAu.value
  if (snowLine > 0 && orbitAu >= snowLine * 0.7) return `${formatRatio(orbitAu / snowLine)}x snow line`
  if (hzCenter > 0) return `${formatRatio(orbitAu / hzCenter)}x HZ center`
  return 'no stellar zone scale'
}

function formatRatio(value: number): string {
  if (value >= 10) return value.toFixed(0)
  if (value >= 1) return value.toFixed(1)
  return value.toFixed(2)
}
```

- [ ] **Step 3: Replace both copies**

- `OrbitalTable.tsx`: delete the exported `formatOrbitContext` and `formatRatio` definitions; add `import { formatOrbitContext } from '../lib/orbitContext'`. (Nothing imports `formatOrbitContext` from `OrbitalTable` — verified by grep at plan time — so dropping the re-export is safe.)
- `BodyDetailPanel.tsx`: delete the local `formatOrbitContext` and `formatRatio`; add the same import.

- [ ] **Step 4: Verify**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/__tests__/OrbitalTable-debrisRegion.test.tsx src/features/tools/star_system_generator/__tests__/BodyDetailPanel-region.test.tsx && npm run typecheck && npm run lint`
Expected: PASS / clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/lib/orbitContext.ts src/features/tools/star_system_generator/components/OrbitalTable.tsx src/features/tools/star_system_generator/components/BodyDetailPanel.tsx
git commit -m "refactor(star-system): extract shared formatOrbitContext helper"
```

---

## Task 10: Stop regenerating the system on every seed keystroke

**Files:**
- Modify: `src/features/tools/star_system_generator/hooks/useGeneratorQueryState.ts:69-78`
- Modify: `src/features/tools/star_system_generator/components/SeedControl.tsx`
- Test: `src/features/tools/star_system_generator/__tests__/query-state.test.tsx`, create `src/features/tools/star_system_generator/__tests__/SeedControl-debounce.test.tsx`

Two parts: (a) `setQueryState` always spreads a fresh object, so even no-op updates invalidate `useGeneratedSystem`'s memo; (b) the seed input propagates every keystroke, re-running the full generator per character.

- [ ] **Step 1: Write the failing no-op identity test**

Append to `query-state.test.tsx`:

```tsx
  it('returns the same state object for a no-op update', async () => {
    function StableHarness() {
      const [state, setState] = useGeneratorQueryState()
      const prevRef = React.useRef(state)
      const stable = prevRef.current === state
      prevRef.current = state
      return (
        <div>
          <div data-testid="stable">{String(stable)}</div>
          <button onClick={() => setState({ tone: state.tone, seed: state.seed })}>noop</button>
        </div>
      )
    }
    window.history.replaceState(null, '', '/tools/star_system_generator/?seed=7f3a9c2e')
    render(<StableHarness />)
    await userEvent.click(screen.getByText('noop'))
    expect(screen.getByTestId('stable').textContent).toBe('true')
  })
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/__tests__/query-state.test.tsx`
Expected: the new test FAILS (`'false'`). (If React bails out so eagerly the click produces no re-render at all, the test passes trivially — confirm failure by temporarily logging; in jsdom with the current code it fails because the object identity changes.)

- [ ] **Step 3: Bail out on no-op updates**

In `useGeneratorQueryState.ts`, replace the `setQueryState` callback:

```ts
  const setQueryState = useCallback((next: Partial<GenerationOptions>) => {
    setOptions((current) => {
      const candidate: GenerationOptions = {
        ...current,
        ...next,
        seed: next.seed !== undefined ? normalizeSeed(next.seed) : current.seed,
      }
      if (
        candidate.seed === current.seed
        && candidate.distribution === current.distribution
        && candidate.tone === current.tone
        && candidate.gu === current.gu
        && candidate.settlements === current.settlements
        && candidate.graphAware === current.graphAware
      ) {
        return current
      }
      return candidate
    })
  }, [])
```

- [ ] **Step 4: Run query-state tests**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/__tests__/query-state.test.tsx`
Expected: PASS (all tests including the existing URL round-trip test).

- [ ] **Step 5: Write the failing debounce test**

Create `__tests__/SeedControl-debounce.test.tsx`:

```tsx
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SeedControl } from '../components/SeedControl'
import type { GenerationOptions } from '../types'

const options: GenerationOptions = {
  seed: 'abc123',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

describe('SeedControl seed input debounce', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('does not propagate seed edits until the debounce window elapses', () => {
    const onChange = vi.fn()
    render(<SeedControl options={options} onChange={onChange} />)
    const input = screen.getByLabelText('Seed')
    fireEvent.change(input, { target: { value: 'deadbeef' } })
    expect(onChange).not.toHaveBeenCalled()
    vi.advanceTimersByTime(350)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ seed: 'deadbeef' })
  })

  it('collapses rapid keystrokes into one commit', () => {
    const onChange = vi.fn()
    render(<SeedControl options={options} onChange={onChange} />)
    const input = screen.getByLabelText('Seed')
    fireEvent.change(input, { target: { value: 'd' } })
    vi.advanceTimersByTime(100)
    fireEvent.change(input, { target: { value: 'de' } })
    vi.advanceTimersByTime(100)
    fireEvent.change(input, { target: { value: 'dead' } })
    vi.advanceTimersByTime(350)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ seed: 'dead' })
  })
})
```

- [ ] **Step 6: Run to verify failure**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/__tests__/SeedControl-debounce.test.tsx`
Expected: FAIL — `onChange` is called synchronously on the first change event.

- [ ] **Step 7: Implement the debounced draft in `SeedControl`**

In `SeedControl.tsx`, add draft state and a commit timer (the component already has `useEffect`, `useRef`, `useState` imported):

```tsx
  const [draft, setDraft] = useState(options.seed)
  const commitTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    setDraft(options.seed)
    if (commitTimeoutRef.current) {
      window.clearTimeout(commitTimeoutRef.current)
      commitTimeoutRef.current = null
    }
  }, [options.seed])

  useEffect(() => {
    return () => {
      if (commitTimeoutRef.current) {
        window.clearTimeout(commitTimeoutRef.current)
      }
    }
  }, [])

  function handleSeedInput(value: string) {
    setDraft(value)
    if (commitTimeoutRef.current) {
      window.clearTimeout(commitTimeoutRef.current)
    }
    commitTimeoutRef.current = window.setTimeout(() => {
      commitTimeoutRef.current = null
      onChange({ seed: value })
    }, 300)
  }
```

And change the input:

```tsx
        <input
          value={draft}
          onChange={(event) => handleSeedInput(event.target.value)}
          ...
```

The sync-from-props effect also cancels any pending commit so the Random button (which calls `onChange` directly and changes `options.seed`) is not overwritten by a stale debounce.

- [ ] **Step 8: Run the new tests plus the feature suite**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator`
Expected: PASS. Watch `query-state.test.tsx` and `StarSystemGenerator.test.tsx` in particular — if an existing test types into the seed field and asserts an immediate update, adapt it to advance timers or use `findBy`/`waitFor`.

- [ ] **Step 9: Commit**

```bash
git add src/features/tools/star_system_generator/hooks/useGeneratorQueryState.ts src/features/tools/star_system_generator/components/SeedControl.tsx src/features/tools/star_system_generator/__tests__/query-state.test.tsx src/features/tools/star_system_generator/__tests__/SeedControl-debounce.test.tsx
git commit -m "perf(star-system): debounce seed input and bail no-op option updates"
```

---

## Task 11: Stop sharing quad GPU buffers across `DustBillboards` instances

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/debris/dustBillboards.tsx`

The module-level `QUAD_GEOMETRY`'s `position/uv/normal/index` are assigned by reference into every per-field `InstancedBufferGeometry`; `geometry.dispose()` on unmount deletes the shared GPU buffers, forcing re-uploads for every other live instance.

- [ ] **Step 1: Own a quad per instance**

Delete the module constant `const QUAD_GEOMETRY = new THREE.PlaneGeometry(1, 1)`. In the `instanced` useMemo, create and return a per-instance quad:

```ts
  const instanced = useMemo(() => {
    if (billboards.length === 0) return null
    const quad = new THREE.PlaneGeometry(1, 1)
    const geometry = new THREE.InstancedBufferGeometry()
    geometry.index = quad.index
    geometry.attributes.position = quad.attributes.position
    geometry.attributes.uv = quad.attributes.uv
    geometry.attributes.normal = quad.attributes.normal
    // ... (instanced attribute construction unchanged) ...
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = `dust-billboards-${fieldId}`
    mesh.frustumCulled = false
    return { geometry, quad, mesh }
  }, [billboards, fieldId, material])

  useEffect(() => () => {
    if (instanced) {
      instanced.geometry.dispose()
      instanced.quad.dispose()
    }
  }, [instanced])
```

(A unit plane is 4 vertices; per-instance ownership costs nothing and makes `dispose()` safe.)

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/viewer3d`
Expected: clean / PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/debris/dustBillboards.tsx
git commit -m "fix(viewer3d): per-instance quad buffers so dust billboard disposal cannot evict shared GPU buffers"
```

---

## Task 12: Stop recreating Nebula plane geometries per render

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/Nebula.tsx:91-104`

- [ ] **Step 1: Use one module-level unit plane, scale per mesh**

Add at module scope (alongside the shader constants):

```ts
const NEBULA_PLANE_GEOMETRY = new THREE.PlaneGeometry(1, 1)
```

Replace the JSX meshes:

```tsx
      {planes.map((plane, index) => (
        <mesh
          key={index}
          position={plane.position}
          scale={plane.size}
          material={plane.material}
          geometry={NEBULA_PLANE_GEOMETRY}
          dispose={null}
          renderOrder={-5}
        />
      ))}
```

`dispose={null}` stops R3F from disposing the shared module-level geometry on unmount; materials keep their existing manual disposal in the `useEffect`. The uniform `scale` replaces the baked-in `args={[plane.size, plane.size]}`.

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: clean. Then a visual smoke check is part of Task 17's final build/verify.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/Nebula.tsx
git commit -m "fix(viewer3d): share one nebula plane geometry instead of recreating per render"
```

---

## Task 13: Replace lifecycle-bound `console.warn` monkey-patch

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/index.tsx:82-89`

- [ ] **Step 1: Install-once module-level filter**

Add at module scope in `viewer3d/index.tsx`:

```ts
let clockWarnFilterInstalled = false
function installThreeClockWarnFilter(): void {
  if (clockWarnFilterInstalled) return
  clockWarnFilterInstalled = true
  const original = console.warn
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('THREE.Clock')) return
    original.apply(console, args)
  }
}
```

Replace the existing effect:

```ts
  useEffect(() => {
    installThreeClockWarnFilter()
  }, [])
```

The filter is intentionally permanent for the tab (idempotent, narrowly scoped to the `THREE.Clock` prefix) rather than installed/removed per mount, which leaked a permanently-patched `console.warn` if cleanup never ran.

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/viewer3d`
Expected: clean / PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/index.tsx
git commit -m "fix(viewer3d): idempotent module-level THREE.Clock warn filter"
```

---

## Task 14: Memoize per-render lookups in viewer overlays

**Files:**
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/BodyDetailCard.tsx:61`
- Modify: `src/features/tools/star_system_generator/viewer3d/scene/HoverTooltip.tsx` (the `resolveTooltip` call after the `useFrame` block)

Both components re-render at ~12 Hz while a body is selected/hovered (live-position state updates from `useFrame`); each render currently re-runs `resolveSelection` / `resolveTooltip`, which rebuild arrays via `flatMap`/`find`.

- [ ] **Step 1: BodyDetailCard**

Add `useMemo` to the React import. Change:

```tsx
  const resolved = resolveSelection(graph, system, selection)
```

to:

```tsx
  const resolved = useMemo(() => resolveSelection(graph, system, selection), [graph, system, selection])
```

Hooks-order check: this line currently sits above the existing `useEffect`/`useFrame` calls and below the state hooks — wrapping in `useMemo` keeps it unconditional, so hook order is unchanged.

- [ ] **Step 2: HoverTooltip**

Add `useMemo` to the React import. Change:

```tsx
  const tip = resolveTooltip(hovered, graph, system, liveBodyPosition)
```

to:

```tsx
  const tip = useMemo(
    () => resolveTooltip(hovered, graph, system, liveBodyPosition),
    [hovered, graph, system, liveBodyPosition],
  )
```

This still recomputes when the throttled live position actually changes (that's an input), but no longer on re-renders triggered by anything else, and the early-bail in the position setter now prevents recompute when motion is below the epsilon.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/viewer3d`
Expected: clean / PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/star_system_generator/viewer3d/scene/BodyDetailCard.tsx src/features/tools/star_system_generator/viewer3d/scene/HoverTooltip.tsx
git commit -m "perf(viewer3d): memoize selection and tooltip resolution in overlay components"
```

---

## Task 15: Robust trojan-camp L4/L5 side selection

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/debrisFields.ts:68`

- [ ] **Step 1: Replace float-modulo parity with integer parity**

Current:

```ts
      const side = (inputs.separationAu * 1000) % 2 < 1 ? 60 : -60
```

Change to:

```ts
      const side = Math.round(inputs.separationAu * 1000) % 2 === 0 ? 60 : -60
```

Same intent (deterministic side keyed to the milli-AU separation) without relying on IEEE-754 float modulo behavior at representation boundaries.

- [ ] **Step 2: Run the debris suite**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/__tests__/debrisField-spatial-extent.test.ts src/features/tools/star_system_generator/__tests__/debrisField-derivation.test.ts src/features/tools/star_system_generator/__tests__/debrisField-determinism.test.ts`
Expected: PASS. If a fixture asserts a specific side for a specific separation and now flips, the input was on a float boundary — confirm `Math.round(separation * 1000)` parity by hand for that value and update the expectation.

- [ ] **Step 3: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/debrisFields.ts
git commit -m "fix(star-system): integer parity for trojan-camp L4/L5 side selection"
```

---

## Task 16: Document the exoplanet filter RNG-order constraint

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts:1255-1263` (`applyModernExoplanetFilters`)

The review flagged that the triple hot-Neptune / double radius-valley pass sequence has order-dependent RNG consumption (a pass that changes a body's category alters how many draws later passes consume). Behavior is correct and deterministic per seed; the remediation requested by the review is to record the constraint so a future edit doesn't silently shift the RNG stream. (Comment explicitly requested by this remediation plan, overriding the default no-comments rule.)

- [ ] **Step 1: Add the constraint comment**

Directly above the first `applyHotNeptuneDesertFilter` call inside `applyModernExoplanetFilters`, insert:

```ts
  // Pass order and count are part of the seed contract: each filter conditionally
  // consumes RNG draws based on the category produced by earlier passes, so
  // reordering, adding, or removing a pass shifts the RNG stream for every
  // subsequent draw in this body's generation.
```

- [ ] **Step 2: Verify and commit**

Run: `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts && npm run lint`
Expected: PASS / clean.

```bash
git add src/features/tools/star_system_generator/lib/generator/index.ts
git commit -m "docs(star-system): document RNG-order seed contract in exoplanet filter passes"
```

---

## Task 17: Final verification

**Files:** none

- [ ] **Step 1: Full gates**

```bash
npm run typecheck && npm run lint && npm run test
```

Expected: all clean, all tests pass (count will be ≥ baseline 1553 given the new tests).

- [ ] **Step 2: Generator audit script**

Run: `npm run audit:star-system-generator:quick`
Expected: completes without violations. This sweeps many seeds through `generateSystem` + `validateSystem` and is the strongest check that the ruin-attachment change (Task 1) didn't introduce invariant violations.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: static export succeeds (Task 7's prerender-path change and the viewer changes must not break SSG).

- [ ] **Step 4: Manual smoke (browser)**

`npm run dev`, open the star system generator tool page:
- Type into Seed: system regenerates once per pause, not per keystroke.
- Random / Copy Link buttons still work; URL reflects the seed.
- Expand Export → Download Markdown and Download JSON produce files.
- Open the 3D viewer: nebula renders, dust/debris fields render, hover tooltips and the body detail card track moving bodies.
- Generate a fracture-GU system (`?gu=fracture`) with debris fields and check a ruin row for a debris-field association where applicable.

- [ ] **Step 5: Push**

```bash
git push origin develop
```

---

## Self-review notes

- All 15 actionable findings have a task; 2 findings (stellar.json `max: 13`, SUPPRESSES prose) plus the reframed critical are recorded as no-change/reframed at the top so the executor doesn't "fix" intentional behavior.
- Output-changing tasks (1, 2 step 6, 3, 4) are isolated in their own commits with explicit snapshot-diff instructions; pure refactors (2 step 5, 8, 9) are expected to be diff-free on snapshots.
- Tasks are ordered: generator correctness first (1), graph hygiene (2-4), UI safety (5-6), viewer (7, 11-14), type/dedup polish (8-9), perf (10), data robustness (15), docs (16), gates (17). Order is not load-bearing except Task 2 before Tasks 3-4 (they touch the same files; rebasing pain otherwise).
