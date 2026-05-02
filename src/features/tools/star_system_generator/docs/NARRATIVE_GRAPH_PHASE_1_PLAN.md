# Narrative Graph Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the type foundation and entity inventory for the Narrative Graph layer, scaffold a `buildRelationshipGraph` stage that returns an empty-edges graph, wire it into the generator pipeline between fact extraction and narrative rendering, and add `relationshipGraph` to `GeneratedSystem` — all without changing any existing rendered output.

**Architecture:** Phase 1 of the [Narrative Graph Plan](./NARRATIVE_GRAPH_PLAN.md). Pure structural addition: no edges, no rules, no rendering. Existing pipeline output is byte-identical for any seed. Two opportunistic cleanups from the [Phase 0](./NARRATIVE_GRAPH_PHASE_0_PLAN.md) final review land first because they touch the same files.

**Tech Stack:** TypeScript (strict, `isolatedModules: true`), Vitest, ESLint, existing audit scripts.

**Source spec:** `NARRATIVE_GRAPH_PLAN.md` Sections "Pipeline Placement", "Output Extension", "Core Data Types".

**Branch:** Work on `develop`. Phase 0 is already merged in. No push.

**Scope:**
- Task 1 (cleanup): Move `settlementTagHook` from `index.ts` into `prose/settlementProse.ts`. Removes the runtime cycle entirely.
- Task 2 (cleanup): Replace `export function` on `scoreSettlementPresence` / `generateGuOverlay` / `generateReachability` with `export type` ReturnType aliases (`SettlementPresenceScore`, `GuOverlay`, `Reachability`). The unused `SettlementPresenceScore` alias at `index.ts:2237` is the model.
- Task 3: Create `lib/generator/graph/` module skeleton (barrel + tests directory).
- Task 4: Define `EntityRef`, `EdgeType`, `RelationshipEdge`, `SystemRelationshipGraph` types in `graph/types.ts`. (`SystemStoryOutput` and historical-edge fields land in Phase 3 / Phase 5; not in scope here.)
- Task 5: Build `graph/entities.ts` — pure functions that walk an existing `GeneratedSystem`-shaped input and produce an `EntityRef[]` covering 12 kinds.
- Task 6: Add `relationshipGraph: SystemRelationshipGraph` to the `GeneratedSystem` type.
- Task 7: Implement `buildRelationshipGraph` in `graph/index.ts` returning `{ entities: …, edges: [], edgesByEntity: {}, edgesByType: {…all-empty}, spineEdgeIds: [], historicalEdgeIds: [] }`.
- Task 8: Wire the scaffold into `generateSystem` after `buildNarrativeFacts` and before `generateNarrativeLines`. Update return shape.
- Task 9: Final verification.

**Out of scope:** Edge generation rules, scoring, budget selection, historical edges, rendering, downstream consumer integration, snapshot updates beyond the new `relationshipGraph` field. Those are Phases 2–8.

---

## File Structure

**New files (created in this phase):**
- `lib/generator/graph/index.ts` — public exports.
- `lib/generator/graph/types.ts` — `EntityRef`, `EdgeType`, `RelationshipEdge`, `SystemRelationshipGraph`.
- `lib/generator/graph/entities.ts` — `buildEntityInventory` and per-kind builders.
- `lib/generator/graph/__tests__/types.test.ts` — type-shape sanity checks (compile-time).
- `lib/generator/graph/__tests__/entities.test.ts` — entity inventory characterization.
- `lib/generator/graph/__tests__/buildRelationshipGraph.test.ts` — empty-graph scaffold integration.

**Files modified:**
- `lib/generator/index.ts` — moves `settlementTagHook` out (Task 1); replaces three function exports with three type-alias exports (Task 2); adds `import { buildRelationshipGraph } from './graph'`; calls scaffold after `buildNarrativeFacts`; threads `relationshipGraph` into the returned object.
- `lib/generator/prose/settlementProse.ts` — gains `settlementTagHook` definition + tests (Task 1); imports change from named-fn `scoreSettlementPresence`/`generateGuOverlay`/`generateReachability` to type-only `SettlementPresenceScore`/`GuOverlay`/`Reachability` (Task 2).
- `lib/generator/prose/__tests__/settlementProse.test.ts` — gains `settlementTagHook` characterization tests (Task 1).
- `types.ts` — `GeneratedSystem` gains `relationshipGraph: SystemRelationshipGraph`.

**Files unchanged:**
- All `data/`, `components/`, `hooks/` files. All other generator modules. Existing audit scripts.

---

## Conventions (from Phase 0, applied here)

- Run `npx tsc --noEmit` as part of every task's verification — ESLint does not catch TS module-resolution errors.
- Function bodies copied during extraction must be byte-identical (only `export` added).
- If a plan-prescribed test assertion contradicts actual behavior, correct the test to match real output and document the deviation in the report.
- Keep `prose/index.ts` and `graph/index.ts` barrels named-only — no `export * from`. Direct sub-module imports from `index.ts` are the established pattern.
- Commit message style: `<type>: <subject>` lowercase, with the standard co-author trailer.
- Do not push.

---

## Task 1: Move `settlementTagHook` into `prose/settlementProse.ts`

**Why:** Phase 0's final reviewer flagged the runtime cycle (`prose/settlementProse.ts` → `..` for `settlementTagHook`, `index.ts` → `./prose/settlementProse` for `settlementHookSynthesis`) as a tripwire — safe today, broken if anyone ever puts a top-level reference of `settlementTagHook` in `settlementProse.ts`. Moving the 13-line `settlementTagHook` function (no dependencies on the rest of `index.ts` beyond two data-table imports) eliminates the cycle entirely.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts` (gains the function + adjusts imports)
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts` (adds characterization tests)
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (deletes definition; replaces local calls with imports from the prose module — but since Task 8's pipeline split already imports `settlementHookSynthesis`, only the deletion is needed if no other call site exists in `index.ts`)

- [ ] **Step 1: Locate the function and any call sites in `index.ts`**

```
grep -n "settlementTagHook" src/features/tools/star_system_generator/lib/generator/index.ts
```

The function is currently `export function settlementTagHook(rng: SeededRng, obviousTag: string, deeperTag: string): string` near `index.ts:2155`. Confirm exact line numbers and whether any call sites exist OUTSIDE of `settlementHookSynthesis` (which is already in `prose/settlementProse.ts`). If there are no other callers in `index.ts`, the only change to `index.ts` is the function deletion plus removing the `export` keyword (which becomes unused after the move).

- [ ] **Step 2: Append failing tests to `settlementProse.test.ts`**

Append a `describe('settlementTagHook', …)` block:

```ts
import { settlementTagHook } from '../settlementProse'
// (extend the existing import line at the top of the file rather than adding a duplicate)

describe('settlementTagHook', () => {
  it('returns the authored hook for a known tag pair', () => {
    const rng = createSeededRng('tag-hook-1')
    const result = settlementTagHook(rng, 'Gate Shadow', 'Archive War')
    // Authored pair "Gate Shadow + Archive War" exists in tagPairHooks.
    // Sentence shape: contains both tag names; ends with a sentence boundary.
    expect(result).toContain('Gate Shadow')
    expect(result).toContain('Archive War')
    expect(result).toMatch(/[.;!?]$|with a fragment ending without punctuation/)
    expect(result.length).toBeGreaterThan(20)
  })

  it('falls back to a deterministic template when no authored pair exists', () => {
    const rng = createSeededRng('tag-hook-2')
    // Use a synthetic tag combination that will not be in the authored pairs.
    const result = settlementTagHook(rng, 'Synthetic Tag One', 'Synthetic Tag Two')
    expect(result).toContain('Synthetic Tag One')
    expect(result).toContain('Synthetic Tag Two')
  })

  it('produces deterministic output for the same seed', () => {
    const a = settlementTagHook(createSeededRng('tag-hook-3'), 'Gate Shadow', 'Archive War')
    const b = settlementTagHook(createSeededRng('tag-hook-3'), 'Gate Shadow', 'Archive War')
    expect(a).toBe(b)
  })
})
```

The first regex `/[.;!?]$|with a fragment ending without punctuation/` is intentionally permissive — `tagPairHooks` are authored prose and may end with various punctuation. Don't over-specify.

- [ ] **Step 3: Run test to confirm failure**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts
```
Expected: FAIL with "settlementTagHook is not exported from '../settlementProse'".

- [ ] **Step 4: Move the function body to `settlementProse.ts`**

In `prose/settlementProse.ts`:

1. Remove the line `import { settlementTagHook } from '..'` (or `'../index'` — whichever is currently there).
2. Add (alongside the existing `helpers` import):
   ```ts
   import { settlementTagHook as _settlementTagHookCheck } from './tag-hook-stub' // DO NOT ADD - illustrative only
   ```
   …actually disregard. The correct shape is to add the `settlementTagHook` function definition directly inside `settlementProse.ts`, and that requires importing `settlementTagPairHooks` and `settlementTagPressures` from the data module:
   ```ts
   import { settlementTagPairHooks, settlementTagPressures } from '../data/settlements'
   ```
3. Append the function definition (byte-identical to the original at `index.ts`):
   ```ts
   export function settlementTagHook(rng: SeededRng, obviousTag: string, deeperTag: string): string {
     const exactPair = `${obviousTag} + ${deeperTag}`
     if (settlementTagPairHooks[exactPair]) return settlementTagPairHooks[exactPair]
     const reversePair = `${deeperTag} + ${obviousTag}`
     if (settlementTagPairHooks[reversePair]) return settlementTagPairHooks[reversePair]

     const deeperText = settlementTagPressures[deeperTag] ?? `${deeperTag.toLowerCase()} is the deeper pressure driving the site.`
     const template = rng.int(1, 4)
     if (template === 1) return `${obviousTag} is what visitors notice first; ${deeperText}`
     if (template === 2) return `Outsiders call it ${obviousTag}, but the local pressure is sharper: ${deeperText}`
     if (template === 3) return `${obviousTag} is the surface story, but ${deeperTag} shows who benefits from the tension: ${deeperText}`
     return `The public tag is ${obviousTag}; the private trouble is ${deeperTag}, because ${deeperText}`
   }
   ```

   Verify byte-identity by reading the original via `grep -n "function settlementTagHook" src/features/tools/star_system_generator/lib/generator/index.ts` and reading the surrounding lines.

- [ ] **Step 5: Run test, expect pass**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts
```
Expected: PASS — including the 3 new `settlementTagHook` tests plus all prior tests in this file.

If a test fails because the assertion doesn't match real output (e.g., the regex was too strict), correct the assertion to match actual behavior and document the correction in the report.

- [ ] **Step 6: Remove the function from `index.ts`**

In `lib/generator/index.ts`:

1. Delete the entire `export function settlementTagHook(...)` block. Find via `grep -n "function settlementTagHook" src/features/tools/star_system_generator/lib/generator/index.ts`.
2. Confirm `settlementTagHook` is no longer referenced anywhere in `index.ts` (`grep -c settlementTagHook src/features/tools/star_system_generator/lib/generator/index.ts` should return 0).
3. The data-table imports for `settlementTagPairHooks` and `settlementTagPressures` may now be unused in `index.ts`. Check: `grep -n "settlementTagPairHooks\|settlementTagPressures" src/features/tools/star_system_generator/lib/generator/index.ts`. If not referenced in `index.ts`, remove from the imports there to keep lint clean.

- [ ] **Step 7: Quality gate**

```
npm run test -- --run src/features/tools/star_system_generator
npx tsc --noEmit
npm run lint
npm run audit:star-system-generator:quick
```
Expected: all pass. Determinism guard included.

- [ ] **Step 8: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts \
         src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts \
         src/features/tools/star_system_generator/lib/generator/index.ts
git commit -m "$(cat <<'EOF'
refactor: move settlementTagHook into prose module

Eliminates the runtime cycle between prose/settlementProse.ts and
lib/generator/index.ts. settlementTagHook had only two data-table
dependencies (settlementTagPairHooks, settlementTagPressures) and no
ties to the rest of index.ts, so the move is mechanical.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Replace function exports with `export type` ReturnType aliases

**Why:** Phase 0 made `scoreSettlementPresence`, `generateGuOverlay`, and `generateReachability` public so `prose/settlementProse.ts` could use `ReturnType<typeof X>`. The Phase 0 final reviewer flagged this as leaky public API surface — these are mid-pipeline stages that external callers should not invoke. The fix is a `ReturnType` alias pattern: `export type GuOverlay = ReturnType<typeof generateGuOverlay>` etc., kept in `index.ts` next to each function, and the functions revert to non-exported. The unused `type SettlementPresenceScore = ReturnType<typeof scoreSettlementPresence>` already at `index.ts:2237` is the model — Task 2 makes it `export`, references it in `prose/settlementProse.ts`, and adds two more.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (3 keyword changes + 2 new alias declarations)
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts` (import line — types instead of functions)

- [ ] **Step 1: Find the three function declarations and the existing alias**

```
grep -n "export function scoreSettlementPresence\|export function generateGuOverlay\|export function generateReachability\|type SettlementPresenceScore" src/features/tools/star_system_generator/lib/generator/index.ts
```
Note their line numbers.

- [ ] **Step 2: In `index.ts`, demote the three functions and add type aliases**

For each of the three:
- Change `export function X(...)` to `function X(...)` (remove `export`).
- Immediately after the closing `}` of the function, add:
  ```ts
  export type <AliasName> = ReturnType<typeof X>
  ```
  Where:
  - `scoreSettlementPresence` → `SettlementPresenceScore` (already declared at `index.ts:2237` — change `type` to `export type` rather than adding a new line)
  - `generateGuOverlay` → `GuOverlay`
  - `generateReachability` → `Reachability`

Final state of the alias declarations (likely near each function definition):
```ts
function scoreSettlementPresence(rng: SeededRng, body: OrbitingBody, guOverlay: GuOverlay, reachability: Reachability) { … }
export type SettlementPresenceScore = ReturnType<typeof scoreSettlementPresence>

function generateGuOverlay(...) { … }
export type GuOverlay = ReturnType<typeof generateGuOverlay>

function generateReachability(...) { … }
export type Reachability = ReturnType<typeof generateReachability>
```

Note: `scoreSettlementPresence` itself uses `ReturnType<typeof generateGuOverlay>` and `ReturnType<typeof generateReachability>` in its parameters. Update those to `GuOverlay` and `Reachability` for consistency once the aliases exist. **Be careful with declaration order** — TS allows forward references for `type` aliases, but only if the referenced functions are defined in the same scope. If TS complains about forward references, place each `export type` immediately after its function and declare functions in dependency order.

- [ ] **Step 3: Run typecheck to verify the changes resolve cleanly inside `index.ts`**

```
npx tsc --noEmit
```

Expected: clean. If there are TS2304 ("Cannot find name") errors, the alias is being referenced before declaration. Move the alias to right after the function and re-run.

- [ ] **Step 4: Update `prose/settlementProse.ts` imports**

Change:
```ts
import type { scoreSettlementPresence, generateGuOverlay, generateReachability, SettlementAnchor } from '..'
```

To:
```ts
import type { SettlementPresenceScore, GuOverlay, Reachability, SettlementAnchor } from '..'
```

And update the `settlementWhyHere` parameter types — replace each `ReturnType<typeof X>` with the corresponding alias:

```ts
export function settlementWhyHere(
  rng: SeededRng,
  body: OrbitingBody,
  presence: SettlementPresenceScore,
  guOverlay: GuOverlay,
  reachability: Reachability,
  anchor: SettlementAnchor,
): string {
  // body unchanged — byte-identical to current
}
```

The function body and behavior are unchanged. Only the type expressions in the signature get tightened.

- [ ] **Step 5: Quality gate**

```
npm run test -- --run src/features/tools/star_system_generator
npx tsc --noEmit
npm run lint
npm run audit:star-system-generator:quick
```
Expected: all pass.

- [ ] **Step 6: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/index.ts \
         src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts
git commit -m "$(cat <<'EOF'
refactor: tighten generator API with ReturnType type aliases

Replaces three function exports (scoreSettlementPresence, generateGuOverlay,
generateReachability) with three exported type aliases (SettlementPresenceScore,
GuOverlay, Reachability). Functions revert to module-private. Consumers in
prose/settlementProse.ts now import the type aliases for parameter typing.

Phase 0 reviewer recommendation: external callers should not invoke
mid-pipeline functions; only their result shapes are public API.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create `graph/` module skeleton

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/graph/index.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/.gitkeep`

- [ ] **Step 1: Create the barrel**

File: `src/features/tools/star_system_generator/lib/generator/graph/index.ts`
```ts
// Barrel for the narrative-graph module. Public surface is added per task in
// the Phase 1 plan as each source file lands. Use named re-exports
// (e.g. `export { foo } from './module'`), not `export * from`.
export {}
```

(Same pattern as `prose/index.ts` from Phase 0.)

- [ ] **Step 2: Create the tests directory placeholder**

```
touch src/features/tools/star_system_generator/lib/generator/graph/__tests__/.gitkeep
```

- [ ] **Step 3: Verify nothing breaks**

```
npx tsc --noEmit
npm run lint
```

Expected: clean.

- [ ] **Step 4: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/graph/
git commit -m "$(cat <<'EOF'
refactor: scaffold graph module for narrative graph layer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Define core types in `graph/types.ts`

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/graph/types.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/types.test.ts`

The types match the `NARRATIVE_GRAPH_PLAN.md` "Core Data Types" section. **Do not include `SystemStoryOutput` here** — it lands in Phase 3 with the renderer. **Do include all historical-edge fields** on `RelationshipEdge` even though no historical edges are generated until Phase 5; they are part of the type's stable shape from day one.

- [ ] **Step 1: Write a type-shape sanity test**

File: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/types.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import type {
  EntityRef,
  EntityKind,
  EdgeType,
  EdgeVisibility,
  RelationshipEdge,
  SystemRelationshipGraph,
} from '../types'
import type { Confidence } from '../../../types'

describe('graph/types', () => {
  it('EntityRef accepts all 12 kinds', () => {
    const kinds: EntityKind[] = [
      'system', 'star', 'body', 'settlement', 'guResource', 'guHazard',
      'phenomenon', 'ruin', 'namedFaction', 'localInstitution', 'route', 'gate',
    ]
    expect(kinds.length).toBe(12)
    const ref: EntityRef = {
      kind: 'settlement',
      id: 'orison-hold',
      displayName: 'Orison Hold',
      layer: 'human',
    }
    expect(ref.kind).toBe('settlement')
  })

  it('EdgeType accepts all 12 types', () => {
    const types: EdgeType[] = [
      'HOSTS', 'CONTROLS', 'DEPENDS_ON',
      'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
      'CONTRADICTS', 'WITNESSES', 'HIDES_FROM',
      'FOUNDED_BY', 'BETRAYED', 'DISPLACED',
    ]
    expect(types.length).toBe(12)
  })

  it('RelationshipEdge required and optional fields compile', () => {
    const presentEdge: RelationshipEdge = {
      id: 'edge-1',
      type: 'HOSTS',
      subject: { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' },
      object: { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' },
      visibility: 'public',
      confidence: 'derived' satisfies Confidence,
      groundingFactIds: ['fact-1'],
      era: 'present',
      weight: 1.0,
    }
    expect(presentEdge.era).toBe('present')

    const historicalEdge: RelationshipEdge = {
      id: 'edge-2',
      type: 'FOUNDED_BY',
      subject: { kind: 'namedFaction', id: 'authority', displayName: 'Route Authority', layer: 'human' },
      object: { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' },
      visibility: 'public',
      confidence: 'human-layer',
      groundingFactIds: [],
      era: 'historical',
      weight: 0.8,
      approxEra: 'second wave',
      summary: 'Orison Hold was founded by the Route Authority during the second wave.',
      consequenceEdgeIds: ['edge-1'],
    }
    expect(historicalEdge.approxEra).toBe('second wave')
  })

  it('SystemRelationshipGraph initial empty shape compiles', () => {
    const graph: SystemRelationshipGraph = {
      entities: [],
      edges: [],
      edgesByEntity: {},
      edgesByType: {
        HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
        CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
        CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
        FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
      },
      spineEdgeIds: [],
      historicalEdgeIds: [],
    }
    expect(graph.entities.length).toBe(0)
    expect(Object.keys(graph.edgesByType).length).toBe(12)
  })

  it('EdgeVisibility is the literal union public | contested | hidden', () => {
    const v: EdgeVisibility[] = ['public', 'contested', 'hidden']
    expect(v.length).toBe(3)
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/types.test.ts
```
Expected: FAIL with "Cannot find module '../types'".

- [ ] **Step 3: Create `graph/types.ts`**

File: `src/features/tools/star_system_generator/lib/generator/graph/types.ts`
```ts
import type { Confidence } from '../../types'

export type EntityKind =
  | 'system' | 'star' | 'body' | 'settlement' | 'guResource' | 'guHazard'
  | 'phenomenon' | 'ruin' | 'namedFaction' | 'localInstitution' | 'route' | 'gate'

export type EntityLayer = 'physical' | 'gu' | 'human'

export interface EntityRef {
  kind: EntityKind
  id: string
  displayName: string
  layer: EntityLayer
}

export type EdgeType =
  | 'HOSTS' | 'CONTROLS' | 'DEPENDS_ON'
  | 'CONTESTS' | 'DESTABILIZES' | 'SUPPRESSES'
  | 'CONTRADICTS' | 'WITNESSES' | 'HIDES_FROM'
  | 'FOUNDED_BY' | 'BETRAYED' | 'DISPLACED'

export type EdgeEra = 'present' | 'historical'

export type EdgeVisibility = 'public' | 'contested' | 'hidden'

export interface RelationshipEdge {
  id: string
  type: EdgeType
  subject: EntityRef
  object: EntityRef
  qualifier?: string
  visibility: EdgeVisibility
  confidence: Confidence
  groundingFactIds: string[]
  era: EdgeEra
  weight: number

  // Historical-only fields, populated iff era === 'historical'.
  approxEra?: string
  summary?: string
  consequenceEdgeIds?: string[]
}

export interface SystemRelationshipGraph {
  entities: EntityRef[]
  edges: RelationshipEdge[]
  edgesByEntity: Record<string, string[]>
  edgesByType: Record<EdgeType, string[]>
  spineEdgeIds: string[]
  historicalEdgeIds: string[]
}
```

The `EdgeType`, `EntityKind`, `EdgeEra`, `EdgeVisibility` literal unions and `EntityLayer` are extracted as named types so they can be reused by Task 5's entity builders and by future rule modules.

- [ ] **Step 4: Run test, expect pass**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/types.test.ts
```
Expected: PASS — all 5 cases.

- [ ] **Step 5: Quality gate**

```
npx tsc --noEmit
npm run lint
```
Expected: clean.

- [ ] **Step 6: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/graph/types.ts \
         src/features/tools/star_system_generator/lib/generator/graph/__tests__/types.test.ts
git commit -m "$(cat <<'EOF'
feat: define narrative graph core types

EntityRef + EntityKind + EntityLayer for the 12 entity kinds the graph
operates over; RelationshipEdge + EdgeType + EdgeEra + EdgeVisibility
for the 12 edge types in 4 functional groups; SystemRelationshipGraph
as the top-level container with entity/type indexes plus spine and
historical edge id lists.

Type-shape unit tests verify all 12 kinds and 12 edge types are
representable and that the empty graph initializes cleanly.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Build entity inventory in `graph/entities.ts`

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/graph/entities.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/entities.test.ts`

`buildEntityInventory` walks an existing partial-system shape and produces an `EntityRef[]` covering every entity that could participate in an edge. It is a **pure derivation** — same input always gives the same output, no RNG, no I/O.

For Phase 1, the inventory function takes a small structural input rather than the full `GeneratedSystem` (which doesn't yet have a `relationshipGraph` field — that's added in Task 6, after this).

### Entity coverage by kind

| Kind | Source | id format | displayName | layer |
|---|---|---|---|---|
| `system` | The system itself | `'system'` | system name | `'physical'` |
| `star` | `primary` + each `companion` | `'star-primary'`, `'star-companion-N'` | spectral type or assigned name | `'physical'` |
| `body` | each `bodies[i]` | body id (already exists on the body) | `body.name.value` | `'physical'` |
| `settlement` | each `settlements[i]` | settlement id | `settlement.name.value` | `'human'` |
| `guResource` | `guOverlay.resource` | `'gu-resource'` | `guOverlay.resource.value` | `'gu'` |
| `guHazard` | `guOverlay.hazard` | `'gu-hazard'` | `guOverlay.hazard.value` | `'gu'` |
| `phenomenon` | each `phenomena[i]` | `phenomenon.id` | `phenomenon.phenomenon.value` (the label) | `'gu'` (most are gu-layer) or `'physical'` (debris disk, comet storm, etc. — see implementation note) |
| `ruin` | each `ruins[i]` | `ruin.id` | `ruin.remnantType.value` | `'human'` |
| `namedFaction` | derived: scan `narrativeFacts` for `kind === 'namedFaction'` | `'faction-' + slug(name)` | faction name | `'human'` |
| `localInstitution` | NOT GENERATED YET (Polish Roadmap Priority 6, deferred) | — | — | — |
| `route` | derived from `reachability.className.value` if non-trivial | `'route'` | reachability label | `'physical'` |
| `gate` | derived from `architecture` if it includes a gate-bearing pattern | `'gate'` | gate label | `'physical'` |

**Implementation note:** Phase 1's `buildEntityInventory` covers 9 of the 12 entity kinds: `system`, `star`, `body`, `settlement`, `guResource`, `guHazard`, `phenomenon`, `ruin`, and `namedFaction` (the last derived from `narrativeFacts` whose `kind === 'namedFaction'`). The remaining 3 kinds — `localInstitution`, `route`, `gate` — are deferred to Phase 2 because their derivation depends on either source data that doesn't exist yet (`localInstitution` is blocked on Polish Roadmap Priority 6) or on rule logic that will determine the right derivation shape (`route`, `gate`).

This pragmatic split keeps Phase 1's scope tight without leaving the type definitions incomplete (Task 4 already declared all 12 kinds).

### Function signature

```ts
export interface EntityInventoryInput {
  systemName: string
  primary: { spectralType: { value: string } }
  companions: ReadonlyArray<{ id?: string; spectralType?: { value: string }; name?: string }>
  bodies: ReadonlyArray<{ id: string; name: { value: string } }>
  settlements: ReadonlyArray<{ id: string; name: { value: string } }>
  guOverlay: { resource: { value: string }; hazard: { value: string } }
  phenomena: ReadonlyArray<{ id: string; phenomenon: { value: string }; confidence?: 'inferred' | 'gu-layer' | 'confirmed' | 'derived' | 'human-layer' }>
  ruins: ReadonlyArray<{ id: string; remnantType: { value: string } }>
  narrativeFacts: ReadonlyArray<{ kind: string; value: { value: string } }>
}

export function buildEntityInventory(input: EntityInventoryInput): EntityRef[]
```

The `EntityInventoryInput` is a structural subset — it deliberately doesn't import the full `GeneratedSystem` interface, both to keep the function decoupled from the much larger type and to make testing with hand-built fixtures straightforward.

- [ ] **Step 1: Write failing tests**

File: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/entities.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { buildEntityInventory, type EntityInventoryInput } from '../entities'

const minimalInput = (): EntityInventoryInput => ({
  systemName: 'Nosaxa IV',
  primary: { spectralType: { value: 'G2V' } },
  companions: [],
  bodies: [
    { id: 'body-1', name: { value: 'Nosaxa IV-a' } },
    { id: 'body-2', name: { value: 'Nosaxa IV-b' } },
  ],
  settlements: [
    { id: 'settlement-1', name: { value: 'Orison Hold' } },
  ],
  guOverlay: {
    resource: { value: 'chiral ice belt' },
    hazard: { value: 'flare-amplified bleed season' },
  },
  phenomena: [
    { id: 'phenomenon-1', phenomenon: { value: 'Dense debris disk' }, confidence: 'inferred' },
    { id: 'phenomenon-2', phenomenon: { value: 'Resonant compact chain' }, confidence: 'inferred' },
  ],
  ruins: [
    { id: 'ruin-1', remnantType: { value: 'First-wave colony shell' } },
  ],
  narrativeFacts: [
    { kind: 'namedFaction', value: { value: 'Route Authority' } },
    { kind: 'namedFaction', value: { value: 'Kestrel Free Compact' } },
    { kind: 'settlement.crisis', value: { value: 'Bleed node changed course' } },
  ],
})

describe('buildEntityInventory', () => {
  it('produces a single system entity', () => {
    const refs = buildEntityInventory(minimalInput())
    const systemRefs = refs.filter(r => r.kind === 'system')
    expect(systemRefs).toHaveLength(1)
    expect(systemRefs[0]).toMatchObject({
      kind: 'system',
      id: 'system',
      displayName: 'Nosaxa IV',
      layer: 'physical',
    })
  })

  it('produces a primary star entity', () => {
    const refs = buildEntityInventory(minimalInput())
    const starRefs = refs.filter(r => r.kind === 'star')
    expect(starRefs).toHaveLength(1)
    expect(starRefs[0]).toMatchObject({
      kind: 'star',
      id: 'star-primary',
      layer: 'physical',
    })
    expect(starRefs[0].displayName).toContain('G2V')
  })

  it('produces one body entity per body', () => {
    const refs = buildEntityInventory(minimalInput())
    const bodyRefs = refs.filter(r => r.kind === 'body')
    expect(bodyRefs).toHaveLength(2)
    expect(bodyRefs.map(r => r.id)).toEqual(['body-1', 'body-2'])
    expect(bodyRefs.every(r => r.layer === 'physical')).toBe(true)
  })

  it('produces one settlement entity per settlement', () => {
    const refs = buildEntityInventory(minimalInput())
    const sRefs = refs.filter(r => r.kind === 'settlement')
    expect(sRefs).toHaveLength(1)
    expect(sRefs[0]).toMatchObject({
      kind: 'settlement',
      id: 'settlement-1',
      displayName: 'Orison Hold',
      layer: 'human',
    })
  })

  it('produces one guResource and one guHazard entity', () => {
    const refs = buildEntityInventory(minimalInput())
    const guRes = refs.filter(r => r.kind === 'guResource')
    const guHaz = refs.filter(r => r.kind === 'guHazard')
    expect(guRes).toHaveLength(1)
    expect(guHaz).toHaveLength(1)
    expect(guRes[0].displayName).toBe('chiral ice belt')
    expect(guHaz[0].displayName).toBe('flare-amplified bleed season')
    expect(guRes[0].layer).toBe('gu')
    expect(guHaz[0].layer).toBe('gu')
  })

  it('produces one phenomenon entity per phenomenon', () => {
    const refs = buildEntityInventory(minimalInput())
    const pRefs = refs.filter(r => r.kind === 'phenomenon')
    expect(pRefs).toHaveLength(2)
    expect(pRefs.map(r => r.displayName)).toEqual(['Dense debris disk', 'Resonant compact chain'])
  })

  it('produces one ruin entity per ruin', () => {
    const refs = buildEntityInventory(minimalInput())
    const rRefs = refs.filter(r => r.kind === 'ruin')
    expect(rRefs).toHaveLength(1)
    expect(rRefs[0].displayName).toBe('First-wave colony shell')
    expect(rRefs[0].layer).toBe('human')
  })

  it('produces one namedFaction entity per unique namedFaction fact', () => {
    const refs = buildEntityInventory(minimalInput())
    const fRefs = refs.filter(r => r.kind === 'namedFaction')
    expect(fRefs).toHaveLength(2)
    expect(fRefs.map(r => r.displayName).sort())
      .toEqual(['Kestrel Free Compact', 'Route Authority'])
    expect(fRefs.every(r => r.layer === 'human')).toBe(true)
  })

  it('returns no localInstitution / route / gate entities (deferred to Phase 2)', () => {
    const refs = buildEntityInventory(minimalInput())
    expect(refs.some(r => r.kind === 'localInstitution')).toBe(false)
    expect(refs.some(r => r.kind === 'route')).toBe(false)
    expect(refs.some(r => r.kind === 'gate')).toBe(false)
  })

  it('handles empty arrays gracefully', () => {
    const empty: EntityInventoryInput = {
      systemName: 'Empty',
      primary: { spectralType: { value: 'M5V' } },
      companions: [],
      bodies: [],
      settlements: [],
      guOverlay: { resource: { value: 'none' }, hazard: { value: 'none' } },
      phenomena: [],
      ruins: [],
      narrativeFacts: [],
    }
    const refs = buildEntityInventory(empty)
    // Always: 1 system + 1 star + 2 GU entities = 4 minimum
    expect(refs.length).toBeGreaterThanOrEqual(4)
    expect(refs.some(r => r.kind === 'system')).toBe(true)
    expect(refs.some(r => r.kind === 'star')).toBe(true)
    expect(refs.some(r => r.kind === 'guResource')).toBe(true)
    expect(refs.some(r => r.kind === 'guHazard')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/entities.test.ts
```
Expected: FAIL — "Cannot find module '../entities'".

- [ ] **Step 3: Implement `entities.ts`**

File: `src/features/tools/star_system_generator/lib/generator/graph/entities.ts`
```ts
import type { EntityRef } from './types'

export interface EntityInventoryInput {
  systemName: string
  primary: { spectralType: { value: string } }
  companions: ReadonlyArray<{ id?: string; spectralType?: { value: string }; name?: string }>
  bodies: ReadonlyArray<{ id: string; name: { value: string } }>
  settlements: ReadonlyArray<{ id: string; name: { value: string } }>
  guOverlay: { resource: { value: string }; hazard: { value: string } }
  phenomena: ReadonlyArray<{ id: string; phenomenon: { value: string } }>
  ruins: ReadonlyArray<{ id: string; remnantType: { value: string } }>
  narrativeFacts: ReadonlyArray<{ kind: string; value: { value: string } }>
}

export function buildEntityInventory(input: EntityInventoryInput): EntityRef[] {
  const refs: EntityRef[] = []

  // 1. System (always exactly one)
  refs.push({
    kind: 'system',
    id: 'system',
    displayName: input.systemName,
    layer: 'physical',
  })

  // 2. Primary star
  refs.push({
    kind: 'star',
    id: 'star-primary',
    displayName: input.primary.spectralType.value,
    layer: 'physical',
  })

  // Companion stars (zero or more)
  input.companions.forEach((companion, index) => {
    const id = companion.id ?? `star-companion-${index + 1}`
    const displayName = companion.spectralType?.value
      ?? companion.name
      ?? `companion-${index + 1}`
    refs.push({
      kind: 'star',
      id,
      displayName,
      layer: 'physical',
    })
  })

  // 3. Bodies
  for (const body of input.bodies) {
    refs.push({
      kind: 'body',
      id: body.id,
      displayName: body.name.value,
      layer: 'physical',
    })
  }

  // 4. Settlements
  for (const settlement of input.settlements) {
    refs.push({
      kind: 'settlement',
      id: settlement.id,
      displayName: settlement.name.value,
      layer: 'human',
    })
  }

  // 5. GU resource + hazard (always exactly one of each)
  refs.push({
    kind: 'guResource',
    id: 'gu-resource',
    displayName: input.guOverlay.resource.value,
    layer: 'gu',
  })
  refs.push({
    kind: 'guHazard',
    id: 'gu-hazard',
    displayName: input.guOverlay.hazard.value,
    layer: 'gu',
  })

  // 6. Phenomena
  for (const phenomenon of input.phenomena) {
    refs.push({
      kind: 'phenomenon',
      id: phenomenon.id,
      displayName: phenomenon.phenomenon.value,
      layer: 'gu', // most phenomena are gu-layer; classification refined in Phase 2 rules
    })
  }

  // 7. Ruins
  for (const ruin of input.ruins) {
    refs.push({
      kind: 'ruin',
      id: ruin.id,
      displayName: ruin.remnantType.value,
      layer: 'human',
    })
  }

  // 8. Named factions (derived from narrativeFacts where kind === 'namedFaction')
  const seenFactions = new Set<string>()
  for (const fact of input.narrativeFacts) {
    if (fact.kind !== 'namedFaction') continue
    const name = fact.value.value
    if (seenFactions.has(name)) continue
    seenFactions.add(name)
    refs.push({
      kind: 'namedFaction',
      id: `faction-${slugify(name)}`,
      displayName: name,
      layer: 'human',
    })
  }

  // 9. localInstitution / route / gate entities are deferred to Phase 2.
  // localInstitution: blocked on Polish Roadmap Priority 6 (no source data yet).
  // route + gate: derivation logic depends on the rules that consume them; build alongside.

  return refs
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
```

- [ ] **Step 4: Run test, expect pass**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/entities.test.ts
```
Expected: PASS — all 10 cases.

- [ ] **Step 5: Quality gate**

```
npx tsc --noEmit
npm run lint
```
Expected: clean.

- [ ] **Step 6: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/graph/entities.ts \
         src/features/tools/star_system_generator/lib/generator/graph/__tests__/entities.test.ts
git commit -m "$(cat <<'EOF'
feat: build narrative graph entity inventory

buildEntityInventory walks a structural subset of a generated system and
produces an EntityRef[] covering 8 of 12 entity kinds: system, star,
body, settlement, guResource, guHazard, phenomenon, ruin, namedFaction.
The remaining 4 kinds (localInstitution, route, gate) are deferred to
Phase 2 where the rule logic that consumes them will determine the
derivation shape.

Pure derivation — same input, same output, no RNG, no I/O.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Add `relationshipGraph` field to `GeneratedSystem`

**Files:**
- Modify: `src/features/tools/star_system_generator/types.ts` (add one field)

- [ ] **Step 1: Locate `GeneratedSystem`**

```
grep -n "interface GeneratedSystem" src/features/tools/star_system_generator/types.ts
```
Expected: line ~291.

- [ ] **Step 2: Add the field**

In `types.ts`, add an import for `SystemRelationshipGraph` from `./lib/generator/graph/types` (use a relative path from `types.ts` — `./lib/generator/graph/types`):

```ts
import type { SystemRelationshipGraph } from './lib/generator/graph/types'
```

Then in the `GeneratedSystem` interface, add (immediately after `narrativeFacts`):

```ts
relationshipGraph: SystemRelationshipGraph
```

So the relevant block becomes:
```ts
  narrativeFacts: NarrativeFact[]
  relationshipGraph: SystemRelationshipGraph
  narrativeLines: NarrativeLine[]
```

- [ ] **Step 3: Run typecheck — expect failures in `index.ts`**

```
npx tsc --noEmit
```
Expected: FAIL with several TS2741 / TS2739 errors in `lib/generator/index.ts` because `generateSystem` returns a `GeneratedSystem` shape that no longer includes `relationshipGraph`. **Do not fix yet** — Task 7 wires the scaffold into `generateSystem` and Task 8 threads the field into the returned object. Confirm the failure is exactly that and move on.

If `npx tsc --noEmit` reports something OTHER than missing `relationshipGraph`, investigate — there may be circular type imports between `types.ts` and `graph/types.ts`.

- [ ] **Step 4: DO NOT COMMIT YET**

This task's diff alone produces a typecheck failure. Tasks 7 and 8 are the matching landing tasks. Combine all three into one commit at the end of Task 8 (see Task 8 Step 5).

---

## Task 7: Implement `buildRelationshipGraph` returning empty edges

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/buildRelationshipGraph.test.ts`

`buildRelationshipGraph` is the Phase 1 scaffold: it builds the entity inventory and returns a graph with empty edges. Phases 2–5 progressively populate edges; Phase 1 only proves the wiring works.

The function signature accepts the same `EntityInventoryInput` plus a `SeededRng` (forked for the `'graph'` stage, even though Phase 1 doesn't use randomness yet — the API stays stable as Phase 2 adds rules):

```ts
export function buildRelationshipGraph(
  input: EntityInventoryInput,
  rng: SeededRng,
): SystemRelationshipGraph
```

- [ ] **Step 1: Write failing test**

File: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/buildRelationshipGraph.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { buildRelationshipGraph } from '../buildRelationshipGraph'
import type { EntityInventoryInput } from '../entities'
import { createSeededRng } from '../../rng'

const minimalInput = (): EntityInventoryInput => ({
  systemName: 'Nosaxa IV',
  primary: { spectralType: { value: 'G2V' } },
  companions: [],
  bodies: [{ id: 'body-1', name: { value: 'Nosaxa IV-a' } }],
  settlements: [{ id: 'settlement-1', name: { value: 'Orison Hold' } }],
  guOverlay: {
    resource: { value: 'chiral ice belt' },
    hazard: { value: 'flare-amplified bleed season' },
  },
  phenomena: [],
  ruins: [],
  narrativeFacts: [],
})

describe('buildRelationshipGraph (Phase 1 scaffold — empty edges)', () => {
  it('returns a populated entity inventory and an empty edge list', () => {
    const rng = createSeededRng('graph-test-1')
    const graph = buildRelationshipGraph(minimalInput(), rng)
    expect(graph.entities.length).toBeGreaterThan(0)
    expect(graph.edges).toEqual([])
    expect(graph.spineEdgeIds).toEqual([])
    expect(graph.historicalEdgeIds).toEqual([])
  })

  it('initializes edgesByEntity as an empty object', () => {
    const rng = createSeededRng('graph-test-2')
    const graph = buildRelationshipGraph(minimalInput(), rng)
    expect(graph.edgesByEntity).toEqual({})
  })

  it('initializes edgesByType with all 12 keys mapped to empty arrays', () => {
    const rng = createSeededRng('graph-test-3')
    const graph = buildRelationshipGraph(minimalInput(), rng)
    const expectedKeys = [
      'HOSTS', 'CONTROLS', 'DEPENDS_ON',
      'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
      'CONTRADICTS', 'WITNESSES', 'HIDES_FROM',
      'FOUNDED_BY', 'BETRAYED', 'DISPLACED',
    ] as const
    for (const key of expectedKeys) {
      expect(graph.edgesByType[key]).toEqual([])
    }
    expect(Object.keys(graph.edgesByType).length).toBe(12)
  })

  it('produces deterministic output for the same seed and input', () => {
    const a = buildRelationshipGraph(minimalInput(), createSeededRng('graph-test-4'))
    const b = buildRelationshipGraph(minimalInput(), createSeededRng('graph-test-4'))
    expect(a).toEqual(b)
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/buildRelationshipGraph.test.ts
```
Expected: FAIL with "Cannot find module '../buildRelationshipGraph'".

- [ ] **Step 3: Implement `buildRelationshipGraph.ts`**

File: `src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts`
```ts
import type { SeededRng } from '../rng'
import { buildEntityInventory, type EntityInventoryInput } from './entities'
import type { EdgeType, SystemRelationshipGraph } from './types'

const ALL_EDGE_TYPES: EdgeType[] = [
  'HOSTS', 'CONTROLS', 'DEPENDS_ON',
  'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
  'CONTRADICTS', 'WITNESSES', 'HIDES_FROM',
  'FOUNDED_BY', 'BETRAYED', 'DISPLACED',
]

function emptyEdgesByType(): Record<EdgeType, string[]> {
  const result = {} as Record<EdgeType, string[]>
  for (const type of ALL_EDGE_TYPES) {
    result[type] = []
  }
  return result
}

export function buildRelationshipGraph(
  input: EntityInventoryInput,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- rng is reserved for Phase 2 rule generation
  _rng: SeededRng,
): SystemRelationshipGraph {
  const entities = buildEntityInventory(input)
  return {
    entities,
    edges: [],
    edgesByEntity: {},
    edgesByType: emptyEdgesByType(),
    spineEdgeIds: [],
    historicalEdgeIds: [],
  }
}
```

The `_rng` parameter is intentionally unused in Phase 1 — naming it with the leading underscore + the eslint-disable comment makes the contract visible (rules will use it in Phase 2).

- [ ] **Step 4: Update the `graph/index.ts` barrel**

Replace `export {}` with named re-exports:
```ts
// Barrel for the narrative-graph module. Public surface is added per task in
// the Phase 1 plan as each source file lands. Use named re-exports
// (e.g. `export { foo } from './module'`), not `export * from`.
export type {
  EntityRef, EntityKind, EntityLayer, EdgeType, EdgeEra, EdgeVisibility,
  RelationshipEdge, SystemRelationshipGraph,
} from './types'
export { buildEntityInventory, type EntityInventoryInput } from './entities'
export { buildRelationshipGraph } from './buildRelationshipGraph'
```

- [ ] **Step 5: Run test, expect pass**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/buildRelationshipGraph.test.ts
```
Expected: PASS — all 4 cases.

- [ ] **Step 6: DO NOT COMMIT YET**

Task 8 lands the wiring into `generateSystem`. Combine Tasks 6, 7, 8 into one commit at the end of Task 8.

---

## Task 8: Wire the scaffold into the generator pipeline

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts`

The scaffold call lands between the existing `buildNarrativeFacts` call and `generateNarrativeLines`. The forked RNG label is `'graph'`.

- [ ] **Step 1: Find the pipeline section**

```
grep -n "narrativeFacts = buildNarrativeFacts\|narrativeLines = generateNarrativeLines" src/features/tools/star_system_generator/lib/generator/index.ts
```
Expected: two adjacent call sites near `index.ts:3716` and `index.ts:3729`.

- [ ] **Step 2: Add the import at the top of `index.ts`**

```ts
import { buildRelationshipGraph } from './graph'
```

(Sorted alphabetically among the existing relative imports — `./graph` likely sits just before `./prose/...` or `./rng`.)

- [ ] **Step 3: Add the scaffold call in `generateSystem`**

Locate the lines (line numbers approximate):
```ts
const narrativeFacts = buildNarrativeFacts({ … })

const narrativeLines = generateNarrativeLines(rootRng.fork('narrative-lines'), options, narrativeFacts)
```

Insert between them:
```ts
const relationshipGraph = buildRelationshipGraph(
  {
    systemName: name.value,
    primary: { spectralType: primary.spectralType },
    companions,
    bodies,
    settlements,
    guOverlay,
    phenomena,
    ruins,
    narrativeFacts,
  },
  rootRng.fork('graph'),
)
```

(Variable names like `name`, `primary`, `companions`, `bodies`, etc. should match the existing locals at this point in `generateSystem`. Verify each exists by reading the surrounding ~20 lines.)

- [ ] **Step 4: Add `relationshipGraph` to the returned object**

Find the `return {` block at the end of `generateSystem` and add `relationshipGraph,` (alongside `narrativeFacts`, `narrativeLines`, etc.). Order: immediately after `narrativeFacts` to match the field order in the `GeneratedSystem` interface (Task 6).

- [ ] **Step 5: Quality gate**

```
npm run test -- --run src/features/tools/star_system_generator
npx tsc --noEmit
npm run lint
npm run audit:star-system-generator:quick
npm run audit:star-system-generator:deep
```
Expected: all pass. Determinism: existing seeds produce identical existing fields (`narrativeLines`, `narrativeThreads`, etc.); the `relationshipGraph` field is new but its `entities` are deterministic and `edges` are always `[]`.

If determinism snapshot tests fail because the `GeneratedSystem` shape changed, the snapshot needs updating to include the new `relationshipGraph` field. Update the snapshot ONLY after confirming the diff is exactly that field's addition. Use `npm run test -- --run src/features/tools/star_system_generator -u` then re-run without `-u` to confirm green.

- [ ] **Step 6: Commit Tasks 6, 7, 8 together**

```
git add src/features/tools/star_system_generator/types.ts \
         src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts \
         src/features/tools/star_system_generator/lib/generator/graph/__tests__/buildRelationshipGraph.test.ts \
         src/features/tools/star_system_generator/lib/generator/graph/index.ts \
         src/features/tools/star_system_generator/lib/generator/index.ts \
         src/features/tools/star_system_generator/__tests__/  2>/dev/null || true
git commit -m "$(cat <<'EOF'
feat: scaffold relationship graph stage in generator pipeline

Adds a buildRelationshipGraph stage between buildNarrativeFacts and
generateNarrativeLines that produces a SystemRelationshipGraph with the
entity inventory populated and empty edges. Adds relationshipGraph to
GeneratedSystem.

Phase 2 will introduce edge generation rules that populate edges; Phase 1
proves the wiring is correct without changing any rendered output.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Final verification

**Files:** None modified — verification only.

- [ ] **Step 1: Full quality bar**

```
npm run lint
npm run test -- --run src/features/tools/star_system_generator
npx tsc --noEmit
npm run audit:star-system-generator:quick
npm run audit:star-system-generator:deep
npm run audit:star-system-data
npm run build
```
Expected: ALL pass.

- [ ] **Step 2: Spot-check generated output is unchanged outside `relationshipGraph`**

```
node --import tsx/esm -e "import('./src/features/tools/star_system_generator/lib/generator/index.ts').then(m => { const sys = m.generateSystem({ seed: 'phase1-spot' }); console.log(JSON.stringify({ name: sys.name.value, settlements: sys.settlements.map(s => s.tagHook?.value), phenomena: sys.phenomena.map(p => p.note?.value), graphEntityCount: sys.relationshipGraph.entities.length, graphEdgeCount: sys.relationshipGraph.edges.length }, null, 2)) })"
```
Expected: settlement / phenomenon strings unchanged from Phase 0. `graphEntityCount` > 0. `graphEdgeCount === 0`.

- [ ] **Step 3: Confirm graph module structure**

```
ls -R src/features/tools/star_system_generator/lib/generator/graph/
```
Expected:
```
src/features/tools/star_system_generator/lib/generator/graph/:
__tests__  buildRelationshipGraph.ts  entities.ts  index.ts  types.ts

src/features/tools/star_system_generator/lib/generator/graph/__tests__:
buildRelationshipGraph.test.ts  entities.test.ts  types.test.ts
```

- [ ] **Step 4: Phase 1 done; ready for Phase 2**

Phase 1 acceptance per the spec:
- `relationshipGraph` field on `GeneratedSystem` ✓
- Graph stage scaffolded with entity inventory + empty edges ✓
- All 12 entity kinds representable in the type; 9 actually generated; 3 deferred to Phase 2 ✓
- All 12 edge types representable in the type; none generated yet ✓
- Existing tests pass; existing rendered prose unchanged ✓
- Cleanup items from Phase 0 final review absorbed (settlementTagHook moved out of index.ts; ReturnType aliases replace function exports) ✓

The repository is now ready for Phase 2: implement the first 4 edge generation rules (`HOSTS`, `DEPENDS_ON`, `CONTESTS`, `DESTABILIZES`), implement scoring + budget selection, no rendering yet.

---

## Spec coverage check (self-review)

| Spec requirement | Task |
|---|---|
| Build `graph/types.ts` | Task 4 |
| Build `graph/entities.ts` | Task 5 |
| Scaffold `buildRelationshipGraph` returning empty graph | Task 7 |
| Add `relationshipGraph` to `GeneratedSystem` | Task 6 |
| Empty graph but deterministic | Task 7 (deterministic test case) |
| All existing tests pass | Verified after every task and in Task 9 |
| Phase 0 follow-up: move `settlementTagHook` to remove cycle | Task 1 |
| Phase 0 follow-up: tighten leaky function exports | Task 2 |

**Estimated commits:** 6 (one per task, except Tasks 6–8 share one commit).

**Estimated effort:** 1 week, matching the spec's Phase 1 budget.
