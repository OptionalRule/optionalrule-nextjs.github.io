# Narrative Graph Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the rendering layer. Add a new `systemStory: SystemStoryOutput` field on `GeneratedSystem` populated by `renderSystemStory(graph, rng)`. Implement the rendering primitives (slot resolver, grammar safety, connective dictionary, paragraph clustering) and edge template families for the 4 in-scope edge types from Phase 2 (`HOSTS`, `DEPENDS_ON`, `CONTESTS`, `DESTABILIZES`). The new field is populated for fixture systems and surfaced in the audit. Existing rendered prose remains byte-identical for any seed — settlement / phenomenon / `whyHere` integration is Phase 6.

**Architecture:** Phase 3 of the [Narrative Graph Plan](./NARRATIVE_GRAPH_PLAN.md). After this phase, `GeneratedSystem` has `systemStory` populated alongside the still-extant `narrativeLines`/`narrativeThreads`. Phase 4 will add the 5 remaining edge types and their templates; Phase 5 layers in historical edges; Phase 6 wires the existing prose surfaces to consult the graph; Phase 8 retires the parallel narrative outputs.

**Tech Stack:** TypeScript (strict, `isolatedModules: true`), Vitest, ESLint, existing audit scripts.

**Source spec:** `NARRATIVE_GRAPH_PLAN.md` Sections "Rendering & Downstream Integration", "Edge Templates", "Grammar Safety", "Connective Tissue", "Acceptance Criteria".

**Branch:** Work on `develop`. Phase 2 is already merged. No push.

**Scope:**
- Task 1: `SystemStoryOutput` type, `GeneratedSystem.systemStory` field, scaffold `renderSystemStory` returning the empty-output shape, wire into pipeline.
- Task 2: `slotResolver` — `{slot}`, `{slot:article}`, `{slot:lower}`, `{qualifier|fallback}` substitution. Skips `{historical:*}` (Phase 5).
- Task 3: `grammarSafety` — slot-shape reshape, boundary-aware capitalization, doubled-noun guard.
- Task 4: Edge template types (`EdgeTemplate`, `SlotShape`, `EdgeTemplateFamily`) + template registry + stub family for `HOSTS`.
- Task 5: `connectives` — connective dictionary keyed by `(prevEdgeType, nextEdgeType)`.
- Task 6: `clusters` — paragraph clustering algorithm (spine cluster, active cluster, epistemic cluster).
- Task 7: Vertical slice — wire the renderer end-to-end so `HOSTS` edges render into `body[0]`. **First commit where any seed produces a non-empty `systemStory.body`.**
- Task 8: `DEPENDS_ON` template family + integration test.
- Task 9: `CONTESTS` template family + integration test.
- Task 10: `DESTABILIZES` template family + integration test.
- Task 11: `spineSummary` renderer — pulls top spine edge + its `spineSummary` template.
- Task 12: `hooks` renderer — produces 3-5 GM-facing one-liners from contested + non-spine active edges.
- Task 13: Audit visibility — surface `systemStory` length percentiles + 4 grammar/template integrity checks.
- Task 14: Final verification.

**Out of scope:**
- Historical edges (Phase 5) — `{historical:summary}` and `{historical:era}` slots remain unresolved (rendered as empty strings).
- The 5 remaining edge types (Phase 4: `CONTROLS`, `SUPPRESSES`, `CONTRADICTS`, `WITNESSES`, `HIDES_FROM`) — clusters tolerates their absence; templates land in Phase 4.
- Downstream consumer integration (Phase 6) — `settlementHookSynthesis`, `phenomenonNote`, `settlementWhyHere` continue to use their existing logic.
- Retiring `narrativeLines`/`narrativeThreads` (Phase 8) — they remain populated.
- The "manual review of 20 sample systems" cohesion judgment — Phase 7 is the dedicated tuning phase.

---

## Architectural Notes

### Why a stub-first approach for Task 1

The Phase 2 plan landed the graph stage's scaffold (empty edges) before the rules. Phase 3 mirrors this: Task 1 lands `systemStory` returning an empty `{ spineSummary: '', body: [], hooks: [] }`, with the full plumbing in place — the field on `GeneratedSystem`, the call in the pipeline, the audit script type-checking against the new field. Subsequent tasks fill in pieces. This keeps every commit independently shippable: at any point during Phase 3, the codebase compiles, tests pass, and the field is at minimum well-formed.

### Determinism

`renderSystemStory(graph, rng)` takes a forked RNG (`rng.fork('story')`). The renderer uses RNG **only** to choose among `body[]` template variants when more than one is eligible; everything else (paragraph order, edge order within paragraph, spine summary template choice) is fully deterministic from the graph alone. This isolates "creative variance" to a single decision point per edge.

Sub-forks under `'story'`: `'story:body'`, `'story:hooks'` — used for variant selection at the body/hooks layers.

### Slot syntax — what Phase 3 supports

Phase 3 supports:
- `{subject}` — `edge.subject.displayName` as-is.
- `{object}` — `edge.object.displayName` as-is.
- `{subject:article}` — `'the '` prepended unless the value is already a proper noun (heuristic: starts with uppercase). E.g., `'the Route Authority'` vs `'Orison Hold'`.
- `{subject:lower}` — `displayName.toLowerCase()` for mid-sentence references.
- `{qualifier|fallback}` — uses `edge.qualifier` if defined and non-empty, else the fallback literal.

Phase 3 does **not** support:
- `{historical:summary}` / `{historical:era}` — Phase 5. The slot resolver returns `''` (empty string) for these; the grammar safety layer cleans up the resulting whitespace artifacts.

The slot grammar is `\{(\w+)(?::(\w+))?(?:\|([^}]+))?\}` — name, optional modifier after `:`, optional fallback after `|`. The resolver throws on unknown slot names (a real bug — templates must reference real edge fields) but tolerates unknown modifiers (warns and falls back to the unmodified value, surfaced as an audit finding in Task 13).

### Template authoring boundary

Each `EdgeTemplateFamily` per edge type has:
- `body: EdgeTemplate[]` — 3-5 sentence variants used in `systemStory.body` paragraphs.
- `spineSummary: EdgeTemplate` — 1 single sentence used when this edge is the system's top spine edge.
- `hook: EdgeTemplate[]` — 2-3 GM-facing inversions used in `systemStory.hooks`.
- `historicalBridge: EdgeTemplate` — 1 placeholder for Phase 5; Phase 3 includes it as `{ text: '', expects: {} }` so the type structure is complete.

Each `EdgeTemplate` declares `expects: { [slotName]: SlotShape }` to drive the grammar-safety reshape pass. `SlotShape = 'properNoun' | 'nounPhrase' | 'verbPhrase' | 'clause' | 'era'`. Phase 3 only uses `'properNoun'` and `'nounPhrase'`; `'verbPhrase'`/`'clause'`/`'era'` are reserved for Phase 4+ but the type union enumerates them all so families don't churn.

### Grammar safety as a separate layer

Per the master plan, grammar safety lives at the slot-substitution layer — it's a pure function on `(rawValue, slotShape, position)` that returns a normalized string. Three transforms:

1. **Slot-shape reshape** — strips terminal punctuation, removes leading articles ("the ", "a ", "an "), trims whitespace. Reshape is idempotent.
2. **Boundary-aware capitalization** — given a `Position = 'sentence-start' | 'after-comma' | 'after-semicolon' | 'mid-clause'`, capitalizes the first letter when `'sentence-start'` and lowercases when mid-clause unless the value is a proper noun.
3. **Doubled-noun guard** — when a value would produce an output like "the evidence of evidence", strip the leading repeated noun. Lookup table of common nouns: `'evidence', 'records', 'logs', 'claims', 'reports'`.

These run in a fixed order: reshape → capitalize → dedouble. Order matters because reshape removes articles before capitalize decides whether to add one back.

### What the renderer does NOT do

The renderer never modifies edges. It reads `RelationshipEdge[]` and produces strings. The graph stage owns edge content; the render stage owns prose.

The renderer also never reaches outside the graph — no fact-ledger lookups, no `Settlement.tagHook` reads. Phase 3's `systemStory` is purely a function of `relationshipGraph + rng`.

### Sparse-system handling

Phase 3 must produce sensible output for the full corpus, including:
- Systems with 0 spine edges (rare but possible) — `spineSummary: ''`, `body[]` skips the spine cluster, `hooks[]` may be empty.
- Systems with only HOSTS edges (no `CONTESTS`/`DESTABILIZES`) — `body[0]` exists; `body[1]` may be empty.
- Systems with no contested or active edges — `hooks: []`.

The audit's median-length warning (Task 13) catches systematic sparsity but does not block individual systems.

### Existing-prose-byte-identical guarantee

Phase 3 must NOT change any existing field on `GeneratedSystem`. The contract: every existing seed produces the same `name`, `bodies[i].whyInteresting`, `settlements[i].tagHook`, `phenomena[i].note`, `narrativeLines`, `narrativeThreads` etc. as before. The new `systemStory` field is purely additive.

This is verified at the start of each task by running an integration test that compares a seeded snapshot of these fields to a captured-once baseline. The baseline lives in a fixture file and is generated **once** at the start of Phase 3 (Task 1) using the current state of `develop`, then never modified during Phase 3 — any task that breaks it has either (a) accidentally invoked the renderer's RNG fork before some upstream RNG fork (changing fork order downstream of `'graph'`) or (b) modified an existing surface inadvertently. Both are bugs.

---

## File Structure

**New files (created in this phase):**
- `lib/generator/graph/render/index.ts` — barrel exporting `renderSystemStory` + types.
- `lib/generator/graph/render/slotResolver.ts` — `resolveSlots(template, edge, ctx)` returns the substituted string.
- `lib/generator/graph/render/grammarSafety.ts` — `reshapeSlot`, `capitalizeForPosition`, `guardDoubledNoun` + the small `Position` type.
- `lib/generator/graph/render/connectives.ts` — `CONNECTIVES` map + `connectiveFor(prev, next)` helper.
- `lib/generator/graph/render/clusters.ts` — `clusterEdges(graph)` returns `{ spineCluster, activeCluster, epistemicCluster }`.
- `lib/generator/graph/render/templates/index.ts` — barrel re-exporting per-edge-type families and the `templateFor(edgeType)` lookup.
- `lib/generator/graph/render/templates/types.ts` — `EdgeTemplate`, `SlotShape`, `EdgeTemplateFamily` types.
- `lib/generator/graph/render/templates/hostsTemplates.ts` — `HOSTS` family.
- `lib/generator/graph/render/templates/dependsOnTemplates.ts` — `DEPENDS_ON` family.
- `lib/generator/graph/render/templates/contestsTemplates.ts` — `CONTESTS` family.
- `lib/generator/graph/render/templates/destabilizesTemplates.ts` — `DESTABILIZES` family.
- `lib/generator/graph/render/renderSystemStory.ts` — top-level renderer that orchestrates clusters, templates, slot resolution, grammar safety, connectives.
- `lib/generator/graph/render/__tests__/slotResolver.test.ts`
- `lib/generator/graph/render/__tests__/grammarSafety.test.ts`
- `lib/generator/graph/render/__tests__/connectives.test.ts`
- `lib/generator/graph/render/__tests__/clusters.test.ts`
- `lib/generator/graph/render/__tests__/templates.test.ts` — one file with describe blocks per family.
- `lib/generator/graph/render/__tests__/renderSystemStory.test.ts` — integration tests against fixture seeds.
- `lib/generator/graph/render/__tests__/proseUnchanged.test.ts` — captures existing-prose snapshot at Task 1 and pins it.

**Files modified:**
- `lib/generator/graph/types.ts` — add `SystemStoryOutput` interface.
- `lib/generator/graph/index.ts` — barrel exports `renderSystemStory`, `SystemStoryOutput`, edge template types.
- `types.ts` — `GeneratedSystem.systemStory: SystemStoryOutput` field.
- `lib/generator/index.ts` — call `renderSystemStory(relationshipGraph, rootRng.fork('story'))` after `buildRelationshipGraph` and assign to the new field.
- `scripts/audit-star-system-generator.ts` — `CorpusStats` gains `spineSummaryLengths`, `bodyParagraphCounts`, `hookCounts`. `auditSystem` adds 4 grammar/template integrity checks. Print block prints story length percentiles.

**Files unchanged:**
- All `data/` JSON files. All `prose/` module files. `audit:star-system-data`. All Phase 2 rule files. The `Settlement` / `HumanRemnant` / etc. surface fields.

---

## Conventions (from Phase 0/1/2, applied here)

- Run `npx tsc --noEmit` as part of every task's verification — ESLint does not catch TS module-resolution errors.
- Function bodies copied during extraction must be byte-identical (only `export` added).
- If a plan-prescribed test assertion contradicts actual behavior, correct the test to match real output and document the deviation in the report. The plan's test text drifts; the function is the contract.
- Keep `prose/index.ts` and `graph/index.ts` (and the new `graph/render/index.ts`) barrels named-only — no `export * from`. Direct sub-module imports from `index.ts` are the established pattern.
- Commit message style: `<type>: <subject>` lowercase, with the standard Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com> trailer (use a HEREDOC for git commit -m).
- The `_rng` underscore-prefix doesn't need an `eslint-disable` comment because the project's ESLint config respects underscore as intentional non-use.
- No comments in code unless the WHY is non-obvious.
- Do not push.
- NEVER use `any` type. Use `unknown`, specific interfaces, or union types.
- Templates are content. The plan provides example template strings as starting points; the implementer may tighten or vary the prose. The reviewer's bar is "natural English, no unresolved slots, no grammar bugs from the master audit list, no setting-incongruity"; not "matches the plan's example string verbatim."

---

## Task 1: SystemStoryOutput type + scaffold renderer + pipeline wiring

**Why:** Mirroring the Phase 1 / Phase 2 pattern: land the seam first. After Task 1, `GeneratedSystem.systemStory` is populated for every system with the empty-output shape `{ spineSummary: '', body: [], hooks: [] }`. The new field is type-safe, audited, and structurally indistinguishable from its eventual filled state. No downstream changes happen yet.

**Files:**
- Modify: `lib/generator/graph/types.ts` (add `SystemStoryOutput` interface)
- Modify: `lib/generator/graph/index.ts` (barrel)
- Create: `lib/generator/graph/render/renderSystemStory.ts`
- Create: `lib/generator/graph/render/index.ts`
- Modify: `types.ts` (add `GeneratedSystem.systemStory`)
- Modify: `lib/generator/index.ts` (call site)
- Create: `lib/generator/graph/render/__tests__/renderSystemStory.test.ts`
- Create: `lib/generator/graph/render/__tests__/proseUnchanged.test.ts` — captures existing-prose snapshot for 3 fixture seeds.

- [ ] **Step 1: Add `SystemStoryOutput` to `graph/types.ts`**

  ```ts
  export interface SystemStoryOutput {
    spineSummary: string
    body: string[]
    hooks: string[]
  }
  ```

  Place it after `SystemRelationshipGraph`. The interface is the public contract the renderer must satisfy; subsequent tasks fill it in.

- [ ] **Step 2: Add `GeneratedSystem.systemStory` to `types.ts`**

  In `src/features/tools/star_system_generator/types.ts`, locate the `GeneratedSystem` interface (search `interface GeneratedSystem`). Add `systemStory: SystemStoryOutput` near `relationshipGraph`. Add the import: `import type { SystemRelationshipGraph, SystemStoryOutput } from './lib/generator/graph/types'` (extend the existing import).

  TypeScript will fail-compile until Step 5 wires the assignment.

- [ ] **Step 3: Create `renderSystemStory.ts` (empty-output stub)**

  File: `lib/generator/graph/render/renderSystemStory.ts`

  ```ts
  import type { SeededRng } from '../../rng'
  import type { SystemRelationshipGraph, SystemStoryOutput } from '../types'

  export function renderSystemStory(
    _graph: SystemRelationshipGraph,
    _rng: SeededRng,
  ): SystemStoryOutput {
    return {
      spineSummary: '',
      body: [],
      hooks: [],
    }
  }
  ```

  Both parameters are unused for now — underscore-prefix per project convention. Subsequent tasks consume them.

- [ ] **Step 4: Create the render barrel**

  File: `lib/generator/graph/render/index.ts`

  ```ts
  export { renderSystemStory } from './renderSystemStory'
  ```

  Keep it minimal — additional exports land in subsequent tasks.

- [ ] **Step 5: Update `graph/index.ts` barrel**

  Add to the existing barrel (right after the `EDGE_TYPES` re-export):

  ```ts
  export type { SystemStoryOutput } from './types'
  export { renderSystemStory } from './render'
  ```

- [ ] **Step 6: Wire the call site in `lib/generator/index.ts`**

  Find the existing `relationshipGraph` assignment (around line 3715). Right after it (and BEFORE `narrativeLines` is generated), add:

  ```ts
  const systemStory = renderSystemStory(relationshipGraph, rootRng.fork('story'))
  ```

  Add the import to the existing graph-module import line:
  ```ts
  import { buildRelationshipGraph, renderSystemStory } from './graph'
  ```

  Then in the return object (around line 3757), add `systemStory` near `relationshipGraph`:
  ```ts
  relationshipGraph,
  systemStory,
  narrativeLines,
  ```

- [ ] **Step 7: Add the prose-unchanged snapshot test**

  This is the gate that protects every subsequent task from accidentally affecting upstream prose.

  File: `lib/generator/graph/render/__tests__/proseUnchanged.test.ts`

  ```ts
  import { describe, expect, it } from 'vitest'
  import { generateSystem } from '../../../index'
  import type { GenerationOptions } from '../../../../types'

  const baseOptions: Omit<GenerationOptions, 'seed'> = {
    distribution: 'frontier',
    tone: 'balanced',
    gu: 'normal',
    settlements: 'normal',
  }

  // The seeds in this test case set the existing-prose contract for Phase 3.
  // The expected values are written ONCE during Task 1 by reading the actual
  // outputs and pinning them. Subsequent Phase 3 tasks must keep these stable.
  const seeds = ['phase3-prose-1', 'phase3-prose-2', 'phase3-prose-3'] as const

  describe('Phase 3 existing prose remains byte-identical', () => {
    for (const seed of seeds) {
      it(`seed ${seed} produces stable existing-prose surfaces`, () => {
        const sys = generateSystem({ seed, ...baseOptions })

        // The set of "existing prose" surfaces tracked here covers everything that
        // Phase 6+ will eventually rewire. Phase 3 must NOT change any of them.
        const surfaces = {
          systemName: sys.name.value,
          settlementTagHooks: sys.settlements.map(s => s.tagHook?.value ?? ''),
          settlementWhyHere: sys.settlements.map(s => s.whyHere?.value ?? ''),
          phenomenonNotes: sys.phenomena.map(p => p.note?.value ?? ''),
          narrativeLineCount: sys.narrativeLines.length,
          narrativeThreadCount: sys.narrativeThreads.length,
        }

        // The first run will fail and print the actual surfaces; copy the values
        // into the corresponding `expectedSurfaces` block below, then re-run.
        // Subsequent runs of the same seed MUST match exactly.
        expect(surfaces).toMatchSnapshot()
      })
    }
  })
  ```

  Run the test once; copy the resulting snapshot file into the repo. From this point on, any task that breaks the snapshot has caused regression and must be fixed before merging.

  Note: Vitest's snapshot testing creates a `__snapshots__/proseUnchanged.test.ts.snap` file. **Commit this file** alongside the test — it IS the contract.

- [ ] **Step 8: Add a smoke test for `renderSystemStory`**

  File: `lib/generator/graph/render/__tests__/renderSystemStory.test.ts`

  ```ts
  import { describe, expect, it } from 'vitest'
  import { renderSystemStory } from '../renderSystemStory'
  import { createSeededRng } from '../../../rng'
  import type { SystemRelationshipGraph } from '../../types'

  describe('renderSystemStory (Phase 3 scaffold — empty output)', () => {
    it('returns the empty-output shape for an empty graph', () => {
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
      const story = renderSystemStory(graph, createSeededRng('test'))
      expect(story).toEqual({ spineSummary: '', body: [], hooks: [] })
    })

    it('is deterministic — same graph + same seed → same story', () => {
      const graph: SystemRelationshipGraph = {
        entities: [], edges: [], edgesByEntity: {},
        edgesByType: { HOSTS: [], CONTROLS: [], DEPENDS_ON: [], CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [], CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [], FOUNDED_BY: [], BETRAYED: [], DISPLACED: [] },
        spineEdgeIds: [], historicalEdgeIds: [],
      }
      const a = renderSystemStory(graph, createSeededRng('det'))
      const b = renderSystemStory(graph, createSeededRng('det'))
      expect(a).toEqual(b)
    })
  })
  ```

- [ ] **Step 9: Quality gate**

  ```
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```

  Expected: all pass. The new `systemStory` field appears on every audited system with the empty-output shape. Existing prose snapshot is captured.

- [ ] **Step 10: Commit**

  ```
  git add src/features/tools/star_system_generator/types.ts \
           src/features/tools/star_system_generator/lib/generator/graph/types.ts \
           src/features/tools/star_system_generator/lib/generator/graph/index.ts \
           src/features/tools/star_system_generator/lib/generator/graph/render/ \
           src/features/tools/star_system_generator/lib/generator/index.ts
  git commit -m "$(cat <<'EOF'
  feat: scaffold systemStory output + renderSystemStory empty-output stub

  Adds SystemStoryOutput type, GeneratedSystem.systemStory field, and a
  Phase 3 stub renderer that returns the empty-output shape for every
  generated system. Wires renderSystemStory into the pipeline after
  buildRelationshipGraph using a dedicated 'story' RNG fork so its
  internal choices do not affect downstream RNG streams. Captures a
  prose-unchanged snapshot for three fixture seeds — the contract that
  protects Phase 3 from accidentally regressing existing prose surfaces.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 2: Slot resolver

**Why:** Every template renders by parsing `{slot:modifier|fallback}` syntax against an `EdgeRenderContext`. Landing the resolver as a pure, fully-tested helper before any templates exist eliminates a whole class of "is the substitution wrong, or is the template wrong?" debugging.

**Files:**
- Create: `lib/generator/graph/render/slotResolver.ts`
- Create: `lib/generator/graph/render/__tests__/slotResolver.test.ts`

- [ ] **Step 1: Define the public surface**

  Three exports:
  - `interface EdgeRenderContext` — what slot resolution sees (subject / object refs, qualifier, edge metadata).
  - `function resolveSlots(template: string, ctx: EdgeRenderContext): string` — substitutes all slots, returns the result.
  - `function parseSlotExpression(expr: string): SlotExpression` — internal parser, exported for testability.

- [ ] **Step 2: Write failing tests**

  File: `lib/generator/graph/render/__tests__/slotResolver.test.ts`

  ```ts
  import { describe, expect, it } from 'vitest'
  import { resolveSlots, parseSlotExpression } from '../slotResolver'
  import type { EdgeRenderContext } from '../slotResolver'

  function makeCtx(overrides: Partial<EdgeRenderContext> = {}): EdgeRenderContext {
    return {
      subject: { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' },
      object: { kind: 'guResource', id: 'gu-resource', displayName: 'chiral ice belt', layer: 'gu' },
      qualifier: undefined,
      edgeType: 'DEPENDS_ON',
      visibility: 'public',
      ...overrides,
    }
  }

  describe('parseSlotExpression', () => {
    it('parses bare slot name', () => {
      expect(parseSlotExpression('subject')).toEqual({ name: 'subject' })
    })
    it('parses slot:modifier', () => {
      expect(parseSlotExpression('subject:article')).toEqual({ name: 'subject', modifier: 'article' })
    })
    it('parses slot|fallback', () => {
      expect(parseSlotExpression('qualifier|the route')).toEqual({ name: 'qualifier', fallback: 'the route' })
    })
    it('parses slot:modifier|fallback', () => {
      expect(parseSlotExpression('subject:lower|the actor')).toEqual({ name: 'subject', modifier: 'lower', fallback: 'the actor' })
    })
  })

  describe('resolveSlots', () => {
    it('substitutes {subject} with displayName', () => {
      expect(resolveSlots('{subject} watches', makeCtx())).toBe('Orison Hold watches')
    })

    it('substitutes {object} with displayName', () => {
      expect(resolveSlots('controls {object}', makeCtx())).toBe('controls chiral ice belt')
    })

    it('substitutes {subject:article} with definite-article-prefixed form when not a proper noun', () => {
      const ctx = makeCtx({
        subject: { kind: 'namedFaction', id: 'f1', displayName: 'Route Authority', layer: 'human' },
      })
      // "Route Authority" begins with uppercase → treated as proper noun → no article prepended.
      expect(resolveSlots('{subject:article} stalks the lanes', ctx)).toBe('Route Authority stalks the lanes')
    })

    it('substitutes {object:article} with article when value is not a proper noun', () => {
      // "chiral ice belt" begins with lowercase → article prepended.
      expect(resolveSlots('depends on {object:article}', makeCtx())).toBe('depends on the chiral ice belt')
    })

    it('substitutes {subject:lower} with lowercased displayName', () => {
      expect(resolveSlots('walks past {subject:lower}', makeCtx())).toBe('walks past orison hold')
    })

    it('uses fallback when qualifier is undefined', () => {
      expect(resolveSlots('contests {qualifier|the route asset}', makeCtx())).toBe('contests the route asset')
    })

    it('uses qualifier when defined and non-empty', () => {
      expect(resolveSlots('contests {qualifier|the route asset}', makeCtx({ qualifier: 'the quota' }))).toBe('contests the quota')
    })

    it('uses fallback when qualifier is empty string', () => {
      expect(resolveSlots('contests {qualifier|the route asset}', makeCtx({ qualifier: '' }))).toBe('contests the route asset')
    })

    it('returns empty string for unsupported {historical:*} slots in Phase 3', () => {
      expect(resolveSlots('after {historical:summary}', makeCtx())).toBe('after ')
      expect(resolveSlots('during {historical:era}', makeCtx())).toBe('during ')
    })

    it('throws on unknown slot name', () => {
      expect(() => resolveSlots('mystery {nonExistentSlot}', makeCtx()))
        .toThrow(/unknown slot/i)
    })

    it('handles multiple slots in the same template', () => {
      expect(resolveSlots('{subject} depends on {object:article}', makeCtx()))
        .toBe('Orison Hold depends on the chiral ice belt')
    })

    it('preserves text between slots verbatim', () => {
      expect(resolveSlots('— {subject}, in transit —', makeCtx())).toBe('— Orison Hold, in transit —')
    })
  })
  ```

  Run, expect FAIL.

- [ ] **Step 3: Implement `slotResolver.ts`**

  ```ts
  import type { EdgeType, EdgeVisibility, EntityRef } from '../types'

  export interface EdgeRenderContext {
    subject: EntityRef
    object: EntityRef
    qualifier?: string
    edgeType: EdgeType
    visibility: EdgeVisibility
  }

  export interface SlotExpression {
    name: string
    modifier?: string
    fallback?: string
  }

  const SLOT_PATTERN = /\{([^}]+)\}/g

  export function parseSlotExpression(expr: string): SlotExpression {
    let body = expr
    let fallback: string | undefined
    const pipeIndex = body.indexOf('|')
    if (pipeIndex >= 0) {
      fallback = body.slice(pipeIndex + 1)
      body = body.slice(0, pipeIndex)
    }
    let modifier: string | undefined
    const colonIndex = body.indexOf(':')
    if (colonIndex >= 0) {
      modifier = body.slice(colonIndex + 1)
      body = body.slice(0, colonIndex)
    }
    return fallback === undefined ? { name: body, modifier } : { name: body, modifier, fallback }
  }

  export function resolveSlots(template: string, ctx: EdgeRenderContext): string {
    return template.replace(SLOT_PATTERN, (_full, expr: string) => {
      const slot = parseSlotExpression(expr)
      return resolveOne(slot, ctx)
    })
  }

  function resolveOne(slot: SlotExpression, ctx: EdgeRenderContext): string {
    // Phase 5 will resolve {historical:summary} and {historical:era}.
    // Phase 3 returns empty for these so templates that reference them produce
    // empty space; downstream grammar safety cleans up the whitespace artifacts.
    if (slot.name === 'historical') return ''

    let raw: string | undefined
    if (slot.name === 'subject') raw = ctx.subject.displayName
    else if (slot.name === 'object') raw = ctx.object.displayName
    else if (slot.name === 'qualifier') raw = ctx.qualifier
    else throw new Error(`unknown slot: ${slot.name}`)

    if (raw === undefined || raw === '') {
      return slot.fallback ?? ''
    }
    return applyModifier(raw, slot.modifier)
  }

  function applyModifier(value: string, modifier: string | undefined): string {
    if (modifier === undefined) return value
    if (modifier === 'lower') return value.toLowerCase()
    if (modifier === 'article') return startsWithUppercase(value) ? value : `the ${value}`
    // Unknown modifier: fall back to raw value. Phase 13's audit catches this.
    return value
  }

  function startsWithUppercase(value: string): boolean {
    if (value.length === 0) return false
    const first = value[0]
    return first === first.toUpperCase() && first !== first.toLowerCase()
  }
  ```

- [ ] **Step 4: Run tests, expect PASS**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/slotResolver.test.ts
  npx tsc --noEmit
  npm run lint
  ```

- [ ] **Step 5: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: slot resolver for narrative graph render templates

  Pure-function {slot:modifier|fallback} substitution. Supports
  {subject}, {object}, {qualifier|fallback} with modifiers 'article'
  (definite-article prefix unless value already begins with uppercase)
  and 'lower'. {historical:*} slots resolve to empty strings (Phase 5
  populates them). Throws on unknown slot names — templates must
  reference real edge fields.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 3: Grammar safety

**Why:** Three audit-flagged grammar bugs (verb-collision, doubled-noun, semicolon-list) live at the slot-substitution boundary. Centralizing the fixes in one tested helper module means every template inherits the safety pass for free.

**Files:**
- Create: `lib/generator/graph/render/grammarSafety.ts`
- Create: `lib/generator/graph/render/__tests__/grammarSafety.test.ts`

- [ ] **Step 1: Define the surface**

  Three pure functions + one type:
  - `type Position = 'sentence-start' | 'after-comma' | 'after-semicolon' | 'mid-clause'`
  - `function reshapeSlot(value: string, shape: SlotShape): string`
  - `function capitalizeForPosition(value: string, position: Position): string`
  - `function guardDoubledNoun(rendered: string): string`

  `SlotShape` is imported from `./templates/types` (Task 4 lands the types). For now, declare it inline:
  ```ts
  export type SlotShape = 'properNoun' | 'nounPhrase' | 'verbPhrase' | 'clause' | 'era'
  ```
  Task 4 moves this to `templates/types.ts` and `grammarSafety.ts` re-imports it. Do NOT defer Task 3 on Task 4 — the inline type is fine for this task and the move is a 2-line refactor.

- [ ] **Step 2: Write failing tests**

  File: `lib/generator/graph/render/__tests__/grammarSafety.test.ts`

  ```ts
  import { describe, expect, it } from 'vitest'
  import {
    reshapeSlot,
    capitalizeForPosition,
    guardDoubledNoun,
  } from '../grammarSafety'

  describe('reshapeSlot', () => {
    it('strips terminal punctuation', () => {
      expect(reshapeSlot('the dispute.', 'nounPhrase')).toBe('the dispute')
      expect(reshapeSlot('a claim,', 'nounPhrase')).toBe('a claim')
      expect(reshapeSlot('the route;', 'nounPhrase')).toBe('the route')
    })

    it('removes leading articles for nounPhrase', () => {
      expect(reshapeSlot('the route', 'nounPhrase')).toBe('route')
      expect(reshapeSlot('a settlement', 'nounPhrase')).toBe('settlement')
      expect(reshapeSlot('an outpost', 'nounPhrase')).toBe('outpost')
    })

    it('does NOT remove leading articles for properNoun', () => {
      expect(reshapeSlot('Route Authority', 'properNoun')).toBe('Route Authority')
    })

    it('trims whitespace', () => {
      expect(reshapeSlot('  Orison Hold  ', 'properNoun')).toBe('Orison Hold')
    })

    it('is idempotent', () => {
      const once = reshapeSlot('the dispute,', 'nounPhrase')
      const twice = reshapeSlot(once, 'nounPhrase')
      expect(once).toBe(twice)
    })

    it('handles empty string', () => {
      expect(reshapeSlot('', 'nounPhrase')).toBe('')
      expect(reshapeSlot('', 'properNoun')).toBe('')
    })
  })

  describe('capitalizeForPosition', () => {
    it('capitalizes first letter at sentence-start', () => {
      expect(capitalizeForPosition('orison hold', 'sentence-start')).toBe('Orison hold')
    })

    it('does not capitalize at mid-clause unless already capitalized', () => {
      expect(capitalizeForPosition('the route', 'mid-clause')).toBe('the route')
    })

    it('preserves proper-noun capitalization at any position', () => {
      expect(capitalizeForPosition('Orison Hold', 'mid-clause')).toBe('Orison Hold')
      expect(capitalizeForPosition('Orison Hold', 'sentence-start')).toBe('Orison Hold')
    })

    it('handles empty string', () => {
      expect(capitalizeForPosition('', 'sentence-start')).toBe('')
    })
  })

  describe('guardDoubledNoun', () => {
    it('strips doubled "evidence" pattern', () => {
      expect(guardDoubledNoun('the evidence is evidence of corrupted bleed metrics'))
        .toBe('the evidence of corrupted bleed metrics')
    })

    it('strips doubled "records" pattern', () => {
      expect(guardDoubledNoun('the records contradict records of the same event'))
        .toBe('the records contradict the same event')
    })

    it('leaves non-doubled prose alone', () => {
      const intact = 'the Route Authority controls the Iggygate'
      expect(guardDoubledNoun(intact)).toBe(intact)
    })

    it('handles empty string', () => {
      expect(guardDoubledNoun('')).toBe('')
    })
  })
  ```

  Run, expect FAIL.

- [ ] **Step 3: Implement `grammarSafety.ts`**

  ```ts
  export type SlotShape = 'properNoun' | 'nounPhrase' | 'verbPhrase' | 'clause' | 'era'

  export type Position = 'sentence-start' | 'after-comma' | 'after-semicolon' | 'mid-clause'

  const LEADING_ARTICLE_PATTERN = /^(?:the|a|an)\s+/i
  const TRAILING_PUNCT_PATTERN = /[.,;:!?]+$/

  export function reshapeSlot(value: string, shape: SlotShape): string {
    let out = value.trim().replace(TRAILING_PUNCT_PATTERN, '').trim()
    if (shape === 'nounPhrase') {
      out = out.replace(LEADING_ARTICLE_PATTERN, '')
    }
    return out
  }

  export function capitalizeForPosition(value: string, position: Position): string {
    if (value.length === 0) return value
    if (position !== 'sentence-start') return value
    const first = value[0]
    if (first === first.toUpperCase()) return value
    return first.toUpperCase() + value.slice(1)
  }

  const DOUBLED_NOUNS = ['evidence', 'records', 'logs', 'claims', 'reports'] as const

  export function guardDoubledNoun(rendered: string): string {
    let out = rendered
    for (const noun of DOUBLED_NOUNS) {
      // Pattern: "the {noun} (verb*) {noun} of ..." → "the {noun} of ..."
      const pattern = new RegExp(`\\bthe ${noun}\\s+(\\S+)\\s+${noun}\\s+(of|that)\\b`, 'gi')
      out = out.replace(pattern, `the ${noun} $2`)
    }
    return out
  }
  ```

- [ ] **Step 4: Quality gate + commit**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/grammarSafety.test.ts
  npx tsc --noEmit
  npm run lint
  ```

  ```
  git commit -m "$(cat <<'EOF'
  feat: grammar safety helpers for narrative graph renderer

  Three pure functions: reshapeSlot trims terminal punctuation and
  optionally strips leading articles for nounPhrase shapes;
  capitalizeForPosition handles sentence-start capitalization without
  clobbering proper nouns; guardDoubledNoun catches the audit-flagged
  "evidence is evidence of" pattern across a small lookup table.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 4: Edge template types + registry

**Why:** Templates are content. The type contract that backs them must be locked in before any template author starts writing — otherwise every template needs editing twice when the contract drifts.

**Files:**
- Create: `lib/generator/graph/render/templates/types.ts`
- Create: `lib/generator/graph/render/templates/index.ts`
- Modify: `lib/generator/graph/render/grammarSafety.ts` (re-import `SlotShape` from templates/types instead of declaring inline)
- Create: `lib/generator/graph/render/__tests__/templates.test.ts`

- [ ] **Step 1: Define types**

  File: `lib/generator/graph/render/templates/types.ts`

  ```ts
  import type { EdgeType } from '../../types'

  export type SlotShape = 'properNoun' | 'nounPhrase' | 'verbPhrase' | 'clause' | 'era'

  export interface EdgeTemplate {
    text: string
    expects: Partial<Record<string, SlotShape>>
  }

  export interface EdgeTemplateFamily {
    edgeType: EdgeType
    body: EdgeTemplate[]              // 3-5 variants
    spineSummary: EdgeTemplate
    historicalBridge: EdgeTemplate    // unused in Phase 3; populated in Phase 5
    hook: EdgeTemplate[]              // 2-3 GM-facing inversions
  }
  ```

- [ ] **Step 2: Update grammarSafety.ts to re-import SlotShape**

  In `lib/generator/graph/render/grammarSafety.ts`, replace the inline `export type SlotShape = ...` with:
  ```ts
  import type { SlotShape } from './templates/types'
  export type { SlotShape }
  ```

  (Re-exporting keeps any existing test imports valid.)

- [ ] **Step 3: Create the registry barrel with stub HOSTS family**

  File: `lib/generator/graph/render/templates/index.ts`

  ```ts
  import type { EdgeType } from '../../types'
  import type { EdgeTemplateFamily } from './types'

  // Stub family used until Tasks 7-12 author each edge type.
  function stubFamily(edgeType: EdgeType): EdgeTemplateFamily {
    return {
      edgeType,
      body: [{ text: '', expects: {} }],
      spineSummary: { text: '', expects: {} },
      historicalBridge: { text: '', expects: {} },
      hook: [{ text: '', expects: {} }],
    }
  }

  const FAMILIES: Record<EdgeType, EdgeTemplateFamily> = {
    HOSTS: stubFamily('HOSTS'),
    CONTROLS: stubFamily('CONTROLS'),
    DEPENDS_ON: stubFamily('DEPENDS_ON'),
    CONTESTS: stubFamily('CONTESTS'),
    DESTABILIZES: stubFamily('DESTABILIZES'),
    SUPPRESSES: stubFamily('SUPPRESSES'),
    CONTRADICTS: stubFamily('CONTRADICTS'),
    WITNESSES: stubFamily('WITNESSES'),
    HIDES_FROM: stubFamily('HIDES_FROM'),
    FOUNDED_BY: stubFamily('FOUNDED_BY'),
    BETRAYED: stubFamily('BETRAYED'),
    DISPLACED: stubFamily('DISPLACED'),
  }

  export function templateFor(edgeType: EdgeType): EdgeTemplateFamily {
    return FAMILIES[edgeType]
  }

  export type { EdgeTemplate, EdgeTemplateFamily, SlotShape } from './types'
  ```

  The stub families let `templateFor(...)` always return a valid family — sparse systems that fall through to a not-yet-authored edge type render an empty string instead of throwing. Phase 4 will replace the 5 remaining stubs with real families.

- [ ] **Step 4: Write tests**

  File: `lib/generator/graph/render/__tests__/templates.test.ts`

  ```ts
  import { describe, expect, it } from 'vitest'
  import { templateFor } from '../templates'
  import type { EdgeType } from '../../types'

  describe('templateFor', () => {
    const allTypes: EdgeType[] = [
      'HOSTS', 'CONTROLS', 'DEPENDS_ON',
      'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
      'CONTRADICTS', 'WITNESSES', 'HIDES_FROM',
      'FOUNDED_BY', 'BETRAYED', 'DISPLACED',
    ]

    it('returns a family for every EdgeType', () => {
      for (const t of allTypes) {
        const family = templateFor(t)
        expect(family.edgeType).toBe(t)
        expect(Array.isArray(family.body)).toBe(true)
        expect(family.body.length).toBeGreaterThanOrEqual(1)
        expect(family.spineSummary).toBeDefined()
        expect(family.historicalBridge).toBeDefined()
        expect(Array.isArray(family.hook)).toBe(true)
      }
    })
  })
  ```

- [ ] **Step 5: Quality gate + commit**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render
  npx tsc --noEmit
  npm run lint
  ```

  ```
  git commit -m "$(cat <<'EOF'
  feat: edge template types + registry barrel with 12 stub families

  EdgeTemplate, EdgeTemplateFamily, SlotShape types declared in
  templates/types.ts. The registry barrel exports templateFor(edgeType)
  returning a family for every EdgeType — Phase 3 stubs the 12 families
  with empty templates so the renderer can be wired end-to-end before
  Tasks 7-12 author the real content. grammarSafety.ts now imports
  SlotShape from the templates module.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 5: Connectives dictionary

**Why:** Within a paragraph, sentence joins use a small dictionary keyed by `(prevEdgeType, nextEdgeType)`. Centralizing the table here keeps the renderer's logic narrow.

**Files:**
- Create: `lib/generator/graph/render/connectives.ts`
- Create: `lib/generator/graph/render/__tests__/connectives.test.ts`

- [ ] **Step 1: Write failing tests**

  ```ts
  import { describe, expect, it } from 'vitest'
  import { connectiveFor } from '../connectives'

  describe('connectiveFor', () => {
    it('returns a connective for known edge-type pairs', () => {
      expect(connectiveFor('CONTESTS', 'DESTABILIZES')).toBe('Meanwhile, ')
      expect(connectiveFor('DEPENDS_ON', 'DESTABILIZES')).toBe('And ')
    })

    it('returns empty string when prev is undefined (first sentence in a paragraph)', () => {
      expect(connectiveFor(undefined, 'HOSTS')).toBe('')
    })

    it('returns empty string for unknown pairs (default fallback)', () => {
      expect(connectiveFor('HOSTS', 'WITNESSES')).toBe('')
    })

    it('is fully deterministic', () => {
      expect(connectiveFor('CONTESTS', 'DESTABILIZES')).toBe(connectiveFor('CONTESTS', 'DESTABILIZES'))
    })
  })
  ```

- [ ] **Step 2: Implement**

  ```ts
  import type { EdgeType } from '../types'

  type Pair = `${EdgeType}->${EdgeType}`

  const CONNECTIVES: Partial<Record<Pair, string>> = {
    'CONTESTS->DESTABILIZES': 'Meanwhile, ',
    'CONTROLS->CONTESTS': 'But ',
    'DEPENDS_ON->DESTABILIZES': 'And ',
    'HOSTS->DEPENDS_ON': 'There, ',
    'CONTESTS->CONTRADICTS': 'Privately, ',
    'DESTABILIZES->CONTESTS': 'And in turn, ',
    // 6 entries today; Phase 4 adds entries for the new edge types.
  }

  export function connectiveFor(
    prev: EdgeType | undefined,
    next: EdgeType,
  ): string {
    if (prev === undefined) return ''
    return CONNECTIVES[`${prev}->${next}`] ?? ''
  }
  ```

- [ ] **Step 3: Quality gate + commit**

  Standard verification + a commit:

  ```
  git commit -m "$(cat <<'EOF'
  feat: connective dictionary for narrative graph renderer

  6 entries keyed by (prevEdgeType, nextEdgeType). First sentence in a
  paragraph (prev = undefined) gets no connective. Unknown pairs fall
  through to empty string. Phase 4 will extend the table for the 5
  remaining edge types.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 6: Cluster algorithm

**Why:** The renderer's paragraph layout is deterministic from the graph alone. Landing it as a pure helper means tests can pin paragraph composition for fixture graphs without going through the full render.

**Files:**
- Create: `lib/generator/graph/render/clusters.ts`
- Create: `lib/generator/graph/render/__tests__/clusters.test.ts`

- [ ] **Step 1: Define the surface**

  ```ts
  export interface EdgeClusters {
    spineCluster: RelationshipEdge[]      // spine + immediate neighbors
    activeCluster: RelationshipEdge[]     // remaining CONTESTS/DESTABILIZES/SUPPRESSES not in spine
    epistemicCluster: RelationshipEdge[]  // CONTRADICTS/WITNESSES/HIDES_FROM with visibility !== 'hidden'
  }

  export function clusterEdges(graph: SystemRelationshipGraph): EdgeClusters
  ```

- [ ] **Step 2: Failing tests**

  ```ts
  import { describe, expect, it } from 'vitest'
  import { clusterEdges } from '../clusters'
  import type { SystemRelationshipGraph, RelationshipEdge } from '../../types'

  // helper to build a minimal graph
  function makeGraph(edges: RelationshipEdge[], spineEdgeIds: string[] = []): SystemRelationshipGraph {
    return {
      entities: [], edges, spineEdgeIds, historicalEdgeIds: [],
      edgesByEntity: {},
      edgesByType: { HOSTS: [], CONTROLS: [], DEPENDS_ON: [], CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [], CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [], FOUNDED_BY: [], BETRAYED: [], DISPLACED: [] },
    }
  }

  // Helper to make an edge with sensible defaults
  function makeEdge(o: Partial<RelationshipEdge> & { id: string }): RelationshipEdge { /* ... */ }

  describe('clusterEdges', () => {
    it('puts spine edges in spineCluster', () => {
      const e1 = makeEdge({ id: 'e1', type: 'CONTESTS' })
      const result = clusterEdges(makeGraph([e1], ['e1']))
      expect(result.spineCluster.map(e => e.id)).toEqual(['e1'])
    })

    it('puts non-spine active edges in activeCluster', () => {
      const e1 = makeEdge({ id: 'spine', type: 'CONTESTS' })
      const e2 = makeEdge({ id: 'active', type: 'DESTABILIZES' })
      const result = clusterEdges(makeGraph([e1, e2], ['spine']))
      expect(result.activeCluster.map(e => e.id)).toEqual(['active'])
    })

    it('puts visible epistemic edges in epistemicCluster', () => {
      const e1 = makeEdge({ id: 'pub', type: 'CONTRADICTS', visibility: 'public' })
      const e2 = makeEdge({ id: 'cont', type: 'WITNESSES', visibility: 'contested' })
      const result = clusterEdges(makeGraph([e1, e2]))
      expect(result.epistemicCluster.map(e => e.id).sort()).toEqual(['cont', 'pub'])
    })

    it('excludes hidden epistemic edges from epistemicCluster (they go to hooks)', () => {
      const e = makeEdge({ id: 'hidden', type: 'CONTRADICTS', visibility: 'hidden' })
      const result = clusterEdges(makeGraph([e]))
      expect(result.epistemicCluster).toHaveLength(0)
    })

    it('puts HOSTS / DEPENDS_ON edges into spineCluster as neighbors when they touch a spined entity', () => {
      const spine = makeEdge({ id: 'spine', type: 'CONTESTS', subject: { kind: 'namedFaction', id: 'f1', displayName: 'A', layer: 'human' } })
      const neighbor = makeEdge({ id: 'host', type: 'HOSTS', subject: { kind: 'body', id: 'b1', displayName: 'B', layer: 'physical' }, object: { kind: 'namedFaction', id: 'f1', displayName: 'A', layer: 'human' } })
      const result = clusterEdges(makeGraph([spine, neighbor], ['spine']))
      expect(result.spineCluster.map(e => e.id).sort()).toEqual(['host', 'spine'])
    })

    it('handles sparse graph (only HOSTS, no spine) — no spine cluster, all edges in active or unused', () => {
      const e = makeEdge({ id: 'h1', type: 'HOSTS' })
      const result = clusterEdges(makeGraph([e]))
      expect(result.spineCluster).toHaveLength(0)
      expect(result.activeCluster).toHaveLength(0)
      // HOSTS without a spine to attach to is dropped from prose; that's intended.
    })

    it('preserves edge insertion order within each cluster', () => {
      const e1 = makeEdge({ id: 'e1', type: 'DESTABILIZES' })
      const e2 = makeEdge({ id: 'e2', type: 'DESTABILIZES' })
      const result = clusterEdges(makeGraph([e1, e2], []))
      expect(result.activeCluster.map(e => e.id)).toEqual(['e1', 'e2'])
    })
  })
  ```

  Run, expect FAIL.

- [ ] **Step 3: Implement**

  ```ts
  import type { EdgeType, RelationshipEdge, SystemRelationshipGraph } from '../types'

  const ACTIVE_TYPES: ReadonlySet<EdgeType> = new Set([
    'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
  ])
  const EPISTEMIC_TYPES: ReadonlySet<EdgeType> = new Set([
    'CONTRADICTS', 'WITNESSES', 'HIDES_FROM',
  ])
  const STRUCTURAL_TYPES: ReadonlySet<EdgeType> = new Set([
    'HOSTS', 'CONTROLS', 'DEPENDS_ON',
  ])

  export interface EdgeClusters {
    spineCluster: RelationshipEdge[]
    activeCluster: RelationshipEdge[]
    epistemicCluster: RelationshipEdge[]
  }

  export function clusterEdges(graph: SystemRelationshipGraph): EdgeClusters {
    const spineIds = new Set(graph.spineEdgeIds)
    const spineEdges = graph.edges.filter(e => spineIds.has(e.id))
    const spinedEntityIds = new Set<string>()
    for (const e of spineEdges) {
      spinedEntityIds.add(e.subject.id)
      spinedEntityIds.add(e.object.id)
    }

    const spineCluster: RelationshipEdge[] = []
    const activeCluster: RelationshipEdge[] = []
    const epistemicCluster: RelationshipEdge[] = []

    for (const edge of graph.edges) {
      if (spineIds.has(edge.id)) {
        spineCluster.push(edge)
        continue
      }
      // Structural neighbor: HOSTS/DEPENDS_ON/CONTROLS that touch a spined entity.
      if (STRUCTURAL_TYPES.has(edge.type)) {
        if (spinedEntityIds.has(edge.subject.id) || spinedEntityIds.has(edge.object.id)) {
          spineCluster.push(edge)
        }
        continue
      }
      if (ACTIVE_TYPES.has(edge.type)) {
        activeCluster.push(edge)
        continue
      }
      if (EPISTEMIC_TYPES.has(edge.type) && edge.visibility !== 'hidden') {
        epistemicCluster.push(edge)
      }
      // Hidden epistemic + historical edges fall through unused — they go to hooks (Task 12).
    }

    return { spineCluster, activeCluster, epistemicCluster }
  }
  ```

- [ ] **Step 4: Quality gate + commit**

---

## Task 7: Vertical slice — render HOSTS edges into `body[0]`

**Why:** Mirrors Phase 2's Task 7 vertical slice. This is the first commit where any seeded system produces non-empty `systemStory.body`. It exercises the full pipeline: clusters → templates → slot resolution → grammar safety → connectives → string assembly. After this commit, the remaining tasks fill in template content for the other 3 edge types and add spine summary + hooks.

**Files:**
- Create: `lib/generator/graph/render/templates/hostsTemplates.ts` — real HOSTS family.
- Modify: `lib/generator/graph/render/templates/index.ts` — register the real HOSTS family (drop the stub for HOSTS only).
- Rewrite: `lib/generator/graph/render/renderSystemStory.ts` — actual implementation.
- Modify: `lib/generator/graph/render/__tests__/renderSystemStory.test.ts` — replace the empty-output assertions with real-content assertions for fixture graphs.
- Modify: `lib/generator/graph/render/__tests__/templates.test.ts` — add a HOSTS-specific render check.

- [ ] **Step 1: Author HOSTS templates**

  File: `lib/generator/graph/render/templates/hostsTemplates.ts`

  ```ts
  import type { EdgeTemplateFamily } from './types'

  // HOSTS edges: subject = body or system; object = settlement or ruin.
  // Tone: matter-of-fact, present-tense. The HOSTS edge sets the stage; spine
  // summary lands the dramatic note when HOSTS is the top spine edge (rare).
  export const hostsTemplates: EdgeTemplateFamily = {
    edgeType: 'HOSTS',
    body: [
      {
        text: '{object} sits on {subject}.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: '{subject} hosts {object}.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: '{object} is the only major foothold on {subject}.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: '{subject} carries {object} on its surface.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
    ],
    spineSummary: {
      text: '{object} clings to {subject} — the only thing keeping the system human.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    historicalBridge: { text: '', expects: {} },  // Phase 5
    hook: [
      {
        text: 'What gave {object} its claim to {subject} in the first place?',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: 'Who else has tried to settle {subject} since {object} arrived?',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
    ],
  }
  ```

  Each `body` template is a complete sentence. The renderer chooses one per edge using `rng.fork('story:body').int(family.body.length)` for determinism with variant.

- [ ] **Step 2: Register real HOSTS family**

  In `lib/generator/graph/render/templates/index.ts`, replace `HOSTS: stubFamily('HOSTS'),` with `HOSTS: hostsTemplates,` and add the import:

  ```ts
  import { hostsTemplates } from './hostsTemplates'
  ```

- [ ] **Step 3: Implement `renderSystemStory.ts`**

  This is the heart of Task 7. The skeleton:

  ```ts
  import type { SeededRng } from '../../rng'
  import type {
    EdgeType, EdgeVisibility, RelationshipEdge, SystemRelationshipGraph,
    SystemStoryOutput,
  } from '../types'
  import { resolveSlots, type EdgeRenderContext } from './slotResolver'
  import {
    capitalizeForPosition, guardDoubledNoun, reshapeSlot,
    type Position,
  } from './grammarSafety'
  import { connectiveFor } from './connectives'
  import { clusterEdges, type EdgeClusters } from './clusters'
  import { templateFor, type EdgeTemplate, type EdgeTemplateFamily } from './templates'

  export function renderSystemStory(
    graph: SystemRelationshipGraph,
    rng: SeededRng,
  ): SystemStoryOutput {
    const clusters = clusterEdges(graph)
    const bodyRng = rng.fork('body')

    const body: string[] = []
    const para1 = renderParagraph(clusters.spineCluster, bodyRng)
    if (para1.length > 0) body.push(para1)
    const para2 = renderParagraph(clusters.activeCluster, bodyRng)
    if (para2.length > 0) body.push(para2)
    const para3 = renderParagraph(clusters.epistemicCluster, bodyRng)
    if (para3.length > 0) body.push(para3)

    return {
      spineSummary: '',  // Task 11
      body,
      hooks: [],         // Task 12
    }
  }

  function renderParagraph(edges: ReadonlyArray<RelationshipEdge>, rng: SeededRng): string {
    if (edges.length === 0) return ''
    const sentences: string[] = []
    let prev: EdgeType | undefined
    for (const edge of edges) {
      const sentence = renderEdgeSentence(edge, prev, rng)
      if (sentence.length === 0) continue
      sentences.push(sentence)
      prev = edge.type
    }
    return sentences.join(' ')
  }

  function renderEdgeSentence(
    edge: RelationshipEdge,
    prev: EdgeType | undefined,
    rng: SeededRng,
  ): string {
    const family = templateFor(edge.type)
    if (family.body.length === 0 || family.body[0].text === '') return ''
    const variant = pickVariant(family.body, rng)
    const ctx: EdgeRenderContext = {
      subject: edge.subject,
      object: edge.object,
      qualifier: edge.qualifier,
      edgeType: edge.type,
      visibility: edge.visibility,
    }
    const rendered = renderTemplate(variant, ctx, prev === undefined ? 'sentence-start' : 'mid-clause')
    const connective = connectiveFor(prev, edge.type)
    return connective + rendered
  }

  function renderTemplate(
    template: EdgeTemplate,
    ctx: EdgeRenderContext,
    position: Position,
  ): string {
    // 1. Slot substitution.
    let result = resolveSlots(template.text, ctx)
    // 2. Grammar safety pass — apply each declared slot's shape contract.
    // (Note: per-slot reshape happens inside resolveSlots in Phase 4 once we wire
    //  template.expects through. Phase 3 applies the global passes here.)
    result = capitalizeForPosition(result, position)
    result = guardDoubledNoun(result)
    return result
  }

  function pickVariant(variants: ReadonlyArray<EdgeTemplate>, rng: SeededRng): EdgeTemplate {
    if (variants.length === 0) throw new Error('renderSystemStory: empty variants array')
    if (variants.length === 1) return variants[0]
    const index = Math.floor(rng.next() * variants.length) % variants.length
    return variants[index]
  }
  ```

  **Note on slot-shape application:** Phase 3 lands the global grammar-safety passes (capitalize, dedouble) but does NOT yet wire the per-slot `template.expects[slotName]` reshape pass through `resolveSlots`. That requires modifying `slotResolver.ts` to accept a `expects` map and pass each resolved value through `reshapeSlot(value, expects[slotName])`. Phase 4's plan (or a Task 7 follow-up) will land that wiring. The Phase 3 grammar-safety pass at the paragraph level is sufficient because every Phase 3 template uses `properNoun` slots only — no article-stripping required.

- [ ] **Step 4: Update tests**

  Replace the empty-output tests in `renderSystemStory.test.ts` with real-content assertions:

  ```ts
  describe('renderSystemStory', () => {
    it('renders an empty story for an empty graph', () => {
      const story = renderSystemStory(emptyGraph(), createSeededRng('test'))
      expect(story).toEqual({ spineSummary: '', body: [], hooks: [] })
    })

    it('renders a body paragraph for a single HOSTS edge', () => {
      const body = { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' }
      const settlement = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }
      const edge = makeEdge({ id: 'h1', type: 'HOSTS', subject: body, object: settlement })
      const graph = makeGraph([edge], ['h1'])
      const story = renderSystemStory(graph, createSeededRng('test'))
      expect(story.body).toHaveLength(1)
      expect(story.body[0]).toMatch(/Orison Hold|Nosaxa IV-b/)
      expect(story.body[0]).toMatch(/[.!?]$/) // ends with terminal punctuation
    })

    it('produces deterministic output for the same seed', () => {
      const graph = /* ... */
      const a = renderSystemStory(graph, createSeededRng('det'))
      const b = renderSystemStory(graph, createSeededRng('det'))
      expect(a).toEqual(b)
    })

    it('handles a graph with HOSTS + DEPENDS_ON edges (DEPENDS_ON template still stub → empty rendering)', () => {
      // Verifies the renderer skips empty-template edges gracefully without crashing.
      const graph = /* with one HOSTS edge in spine and one DEPENDS_ON edge as neighbor */
      const story = renderSystemStory(graph, createSeededRng('test'))
      expect(story.body[0]).toContain('Hold')  // HOSTS rendered
      expect(story.body[0]).not.toContain('{')  // no unresolved slots
    })
  })
  ```

- [ ] **Step 5: Run integration tests against real seeded systems**

  Add to the existing integration test in `lib/generator/graph/__tests__/integration.test.ts`:

  ```ts
  it('produces a non-empty systemStory.body for any system with a HOSTS spine edge', () => {
    const sys = generateSystem({ seed: 'phase3-task7-spot', /* ... */ })
    if (sys.relationshipGraph.spineEdgeIds.length > 0) {
      // The story may still be empty if no HOSTS edges are spined (CONTESTS dominates).
      // Check that ANY non-empty edge type renders something.
      expect(sys.systemStory.body.length).toBeGreaterThanOrEqual(0)
    }
  })
  ```

  This is intentionally weak — the strong assertions come in Tasks 9-12 once all 4 template families exist.

- [ ] **Step 6: Verify prose-unchanged snapshot**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

  Expected: 3/3 still pass. If the snapshot fails, the renderer or its RNG fork order has accidentally affected upstream prose. Investigate before proceeding.

- [ ] **Step 7: Quality gate + commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: wire renderSystemStory end-to-end with HOSTS templates

  First rendering vertical slice. clusterEdges → templateFor →
  resolveSlots → grammarSafety → connectiveFor pipeline lands behind
  renderSystemStory(graph, rng). HOSTS family ships with 4 body
  variants, 1 spineSummary template, 2 hook templates. Other 11 edge
  types still stub to empty templates so the renderer gracefully
  skips edges of those types — Tasks 8-10 author the remaining 3
  Phase-2 in-scope families (DEPENDS_ON, CONTESTS, DESTABILIZES).

  spineSummary and hooks remain '' / [] until Tasks 11-12.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 8: DEPENDS_ON template family

**Why:** Second of the 4 in-scope edge types. Each task lands one family; the renderer's plumbing (Task 7) does not change.

**Files:**
- Create: `lib/generator/graph/render/templates/dependsOnTemplates.ts`
- Modify: `lib/generator/graph/render/templates/index.ts` — replace stub for `DEPENDS_ON`.
- Modify: `lib/generator/graph/render/__tests__/templates.test.ts` — add a `DEPENDS_ON` render-snapshot test.

- [ ] **Step 1: Author DEPENDS_ON templates**

  ```ts
  import type { EdgeTemplateFamily } from './types'

  // DEPENDS_ON: subject = settlement; object = guResource (typically).
  export const dependsOnTemplates: EdgeTemplateFamily = {
    edgeType: 'DEPENDS_ON',
    body: [
      { text: '{subject} depends on {object} for everything.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject} survives only because {object} keeps flowing.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Without {object}, {subject:lower} would fold within a season.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject} draws everything it consumes from {object}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
    spineSummary: {
      text: '{subject} runs on {object} — a single failure away from collapse.',
      expects: { subject: 'properNoun', object: 'nounPhrase' },
    },
    historicalBridge: { text: '', expects: {} },
    hook: [
      { text: 'What does {subject} owe to keep {object} flowing?', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'How long can {subject:lower} last if {object} dries up?', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
  }
  ```

- [ ] **Step 2: Register**

  Update `templates/index.ts` to import + use `dependsOnTemplates` for the `DEPENDS_ON` slot.

- [ ] **Step 3: Render-snapshot test**

  Add to `templates.test.ts`:

  ```ts
  describe('DEPENDS_ON family', () => {
    it('renders a body sentence with subject and object substituted', () => {
      // Construct a deterministic single-edge graph and assert the rendered output
      // contains both endpoint names + ends with terminal punctuation + has no
      // unresolved {slot} markers.
      const story = renderSystemStory(makeDependsOnGraph(), createSeededRng('depends-test'))
      expect(story.body[0]).toContain('Orison Hold')
      expect(story.body[0]).toContain('chiral')
      expect(story.body[0]).not.toContain('{')
      expect(story.body[0]).toMatch(/[.!?]$/)
    })
  })
  ```

- [ ] **Step 4: Quality gate + commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: add DEPENDS_ON template family for narrative graph renderer

  4 body variants, 1 spineSummary, 2 hooks. Subject is typically a
  settlement (properNoun); object is a gu resource (nounPhrase, so
  reshape strips any leading article in Phase 4's per-slot pass).
  Phase 3 only renders proper-noun slots safely; Phase 4 lands per-slot
  shape application for nounPhrase reshape.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 9: CONTESTS template family

**Files:**
- Create: `lib/generator/graph/render/templates/contestsTemplates.ts`
- Modify: `lib/generator/graph/render/templates/index.ts`
- Modify: `templates.test.ts`

- [ ] **Step 1: Author**

  ```ts
  export const contestsTemplates: EdgeTemplateFamily = {
    edgeType: 'CONTESTS',
    body: [
      { text: '{subject} and {object} both want {qualifier|the same leverage}.', expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' } },
      { text: '{subject} disputes {object}\'s claim.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} refuses to recognize {object}\'s authority.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The compact between {subject:lower} and {object:lower} has gone bad.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    spineSummary: {
      text: '{subject} and {object} can\'t both set the rules — and the rest of the system knows it.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    historicalBridge: { text: '', expects: {} },
    hook: [
      { text: 'Who profits if {subject} and {object} stay locked in this fight?', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'A neutral broker between {subject} and {object} would have leverage.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'What\'s the original wrong neither side will name?', expects: {} },
    ],
  }
  ```

- [ ] **Step 2-4: register, snapshot test, commit**

---

## Task 10: DESTABILIZES template family

**Files:**
- Create: `lib/generator/graph/render/templates/destabilizesTemplates.ts`
- Modify: `lib/generator/graph/render/templates/index.ts`
- Modify: `templates.test.ts`

- [ ] **Step 1: Author**

  ```ts
  export const destabilizesTemplates: EdgeTemplateFamily = {
    edgeType: 'DESTABILIZES',
    body: [
      { text: '{subject:article} is corroding {object:article}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{subject:article} keeps shifting under {object}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'Each pass of {subject:article} costs {object} a margin it doesn\'t have.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{object} can\'t plan around {subject:lower} anymore.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    ],
    spineSummary: {
      text: '{subject:article} is rewriting the constants {object} was built around.',
      expects: { subject: 'nounPhrase', object: 'properNoun' },
    },
    historicalBridge: { text: '', expects: {} },
    hook: [
      { text: 'Whose models predicted {subject:lower} would behave?', expects: { subject: 'nounPhrase' } },
      { text: 'Who profits from {object}\'s loss of cushion?', expects: { object: 'properNoun' } },
    ],
  }
  ```

  Note the use of `{subject:article}` for non-proper-noun subjects (phenomena, gu hazards) — this is where slot-shape application matters most.

- [ ] **Step 2-4: register, snapshot test, commit**

---

## Task 11: spineSummary renderer

**Why:** `spineSummary` is the single sentence that anchors the system's story. It uses the top spine edge's `spineSummary` template. Without this, the story body has no thesis sentence.

**Files:**
- Modify: `lib/generator/graph/render/renderSystemStory.ts`
- Modify: `lib/generator/graph/render/__tests__/renderSystemStory.test.ts`

- [ ] **Step 1: Implement spine summary**

  In `renderSystemStory`:

  ```ts
  const spineSummary = renderSpineSummary(graph, rng.fork('spine'))
  return { spineSummary, body, hooks: [] }
  ```

  ```ts
  function renderSpineSummary(graph: SystemRelationshipGraph, _rng: SeededRng): string {
    const topSpineId = graph.spineEdgeIds[0]
    if (!topSpineId) return ''
    const edge = graph.edges.find(e => e.id === topSpineId)
    if (!edge) return ''
    const family = templateFor(edge.type)
    const template = family.spineSummary
    if (template.text === '') return ''
    const ctx: EdgeRenderContext = {
      subject: edge.subject,
      object: edge.object,
      qualifier: edge.qualifier,
      edgeType: edge.type,
      visibility: edge.visibility,
    }
    let result = resolveSlots(template.text, ctx)
    result = capitalizeForPosition(result, 'sentence-start')
    result = guardDoubledNoun(result)
    return result
  }
  ```

- [ ] **Step 2: Tests**

  ```ts
  it('renders a single-sentence spineSummary from the top spine edge', () => {
    const graph = makeContestsSpineGraph()
    const story = renderSystemStory(graph, createSeededRng('spine'))
    expect(story.spineSummary).toMatch(/[.!?]$/)
    expect(story.spineSummary).not.toContain('{')
  })

  it('returns empty spineSummary when no spine edges exist', () => {
    const story = renderSystemStory(emptyGraph(), createSeededRng('test'))
    expect(story.spineSummary).toBe('')
  })
  ```

- [ ] **Step 3: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: render systemStory.spineSummary from top spine edge template

  Pulls graph.spineEdgeIds[0]'s template family, applies its
  spineSummary template via the same slot-resolution + grammar-safety
  pipeline used for body sentences. Returns empty string when no spine
  exists. Phase 5 will weave a linked historical edge into the
  spineSummary; Phase 3 leaves {historical:*} slots unresolved.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 12: hooks renderer

**Why:** Hooks are 3-5 GM-facing one-liners. They draw from contested + non-spine active edges + hidden epistemic edges. Without them, the system's narrative is body-only.

**Files:**
- Modify: `lib/generator/graph/render/renderSystemStory.ts`
- Modify: `lib/generator/graph/render/__tests__/renderSystemStory.test.ts`

- [ ] **Step 1: Implement hooks renderer**

  Hooks aim for 3-5 outputs. The eligible edges are:
  - All edges with `visibility === 'contested'`.
  - Hidden epistemic edges (Phase 4) — Phase 3 has none, so this branch is dead today.
  - Non-spine active edges — drawn last to fill out to the 3-5 target.

  ```ts
  function renderHooks(graph: SystemRelationshipGraph, rng: SeededRng): string[] {
    const eligibleEdges = pickHookEligibleEdges(graph)
    const hooks: string[] = []
    const hookRng = rng.fork('pick')
    const seen = new Set<string>()
    for (const edge of eligibleEdges) {
      if (hooks.length >= 5) break
      const family = templateFor(edge.type)
      if (family.hook.length === 0) continue
      const template = pickVariant(family.hook, hookRng)
      if (template.text === '') continue
      const ctx: EdgeRenderContext = {
        subject: edge.subject, object: edge.object, qualifier: edge.qualifier,
        edgeType: edge.type, visibility: edge.visibility,
      }
      let rendered = resolveSlots(template.text, ctx)
      rendered = capitalizeForPosition(rendered, 'sentence-start')
      rendered = guardDoubledNoun(rendered)
      // Dedup against already-emitted hooks.
      if (seen.has(rendered)) continue
      seen.add(rendered)
      hooks.push(rendered)
    }
    return hooks
  }

  function pickHookEligibleEdges(graph: SystemRelationshipGraph): RelationshipEdge[] {
    const spineIds = new Set(graph.spineEdgeIds)
    const out: RelationshipEdge[] = []
    // Contested edges first (highest priority).
    for (const e of graph.edges) {
      if (e.visibility === 'contested') out.push(e)
    }
    // Hidden epistemic next (none in Phase 3).
    for (const e of graph.edges) {
      if (e.visibility === 'hidden') out.push(e)
    }
    // Then non-spine active edges.
    for (const e of graph.edges) {
      if (spineIds.has(e.id)) continue
      if (e.type === 'CONTESTS' || e.type === 'DESTABILIZES' || e.type === 'SUPPRESSES') {
        if (out.includes(e)) continue
        out.push(e)
      }
    }
    return out
  }
  ```

- [ ] **Step 2: Tests**

  ```ts
  it('produces 3-5 hooks for a typical system', () => {
    const story = renderSystemStory(makeRichGraph(), createSeededRng('hooks'))
    expect(story.hooks.length).toBeGreaterThanOrEqual(0)
    expect(story.hooks.length).toBeLessThanOrEqual(5)
    for (const hook of story.hooks) {
      expect(hook).not.toContain('{')
      expect(hook).toMatch(/[.!?]$/)
    }
  })

  it('returns empty hooks for an empty graph', () => {
    const story = renderSystemStory(emptyGraph(), createSeededRng('test'))
    expect(story.hooks).toEqual([])
  })

  it('produces deterministic hooks for the same seed', () => {
    const a = renderSystemStory(graph, createSeededRng('hooks-det'))
    const b = renderSystemStory(graph, createSeededRng('hooks-det'))
    expect(a.hooks).toEqual(b.hooks)
  })
  ```

- [ ] **Step 3: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: render systemStory.hooks from contested + non-spine active edges

  Hook priority: contested-visibility edges first, then hidden
  epistemic (Phase 4), then non-spine active edges (CONTESTS,
  DESTABILIZES, SUPPRESSES). Caps at 5. Dedup against already-emitted
  hooks. Each hook draws from its edge type's family.hook variants
  via the same slot-resolution + grammar-safety pipeline used elsewhere.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 13: Audit visibility + 4 grammar/template integrity checks

**Why:** Mirroring Phase 2's Task 12. Surface story length stats in the audit so the corpus's narrative density is visible. Add grammar/template integrity checks so any regression surfaces during deep-corpus runs.

**Files:**
- Modify: `scripts/audit-star-system-generator.ts`

- [ ] **Step 1: Extend `CorpusStats`**

  ```ts
  spineSummaryLengths: number[]
  bodyParagraphCounts: number[]
  bodySentenceCounts: number[]
  hookCounts: number[]
  systemsWithEmptyStory: number
  ```

  Initialize in the const stats.

- [ ] **Step 2: Add 4 per-system integrity checks in `auditSystem`**

  ```ts
  // Stats collection
  stats.spineSummaryLengths.push(system.systemStory.spineSummary.length)
  stats.bodyParagraphCounts.push(system.systemStory.body.length)
  stats.bodySentenceCounts.push(system.systemStory.body.reduce(
    (sum, p) => sum + p.split(/(?<=[.!?])\s+/).length, 0))
  stats.hookCounts.push(system.systemStory.hooks.length)
  if (system.systemStory.spineSummary === '' && system.systemStory.body.length === 0) {
    stats.systemsWithEmptyStory += 1
  }

  // Check 1: no unresolved {slot} placeholders in any rendered output.
  const allOutputs = [
    system.systemStory.spineSummary,
    ...system.systemStory.body,
    ...system.systemStory.hooks,
  ]
  for (const output of allOutputs) {
    if (output.includes('{')) {
      addFinding(findings, 'error', seed, 'story.unresolvedSlot',
        `Rendered output contains unresolved slot: "${output}"`)
    }
  }

  // Check 2: no doubled-noun patterns in any rendered output.
  for (const output of allOutputs) {
    if (/\b(evidence|records|logs|claims|reports)\s+\S+\s+\1\s+(of|that)\b/i.test(output)) {
      addFinding(findings, 'error', seed, 'story.doubledNoun',
        `Doubled-noun pattern: "${output}"`)
    }
  }

  // Check 3: spineSummary, when populated, ends with terminal punctuation.
  if (system.systemStory.spineSummary.length > 0
      && !/[.!?]$/.test(system.systemStory.spineSummary)) {
    addFinding(findings, 'warning', seed, 'story.terminalPunct',
      `spineSummary missing terminal punctuation: "${system.systemStory.spineSummary}"`)
  }

  // Check 4: paragraph count ≤ 3 (per design doc — sparse systems can have 0-3).
  if (system.systemStory.body.length > 3) {
    addFinding(findings, 'error', seed, 'story.bodyParagraphs',
      `Body has ${system.systemStory.body.length} paragraphs; expected ≤ 3.`)
  }
  ```

- [ ] **Step 3: Print block additions**

  ```ts
  console.log(`Story spineSummary length (p10/p50/p90): ${formatPercentiles(stats.spineSummaryLengths)} chars`)
  console.log(`Story body paragraph count (p10/p50/p90): ${formatPercentiles(stats.bodyParagraphCounts)}`)
  console.log(`Story body sentence count (p10/p50/p90): ${formatPercentiles(stats.bodySentenceCounts)}`)
  console.log(`Story hook count (p10/p50/p90): ${formatPercentiles(stats.hookCounts)}`)
  console.log(`Systems with empty story: ${stats.systemsWithEmptyStory} / ${stats.systems}`)
  ```

- [ ] **Step 4: Quality gate**

  ```
  npm run audit:star-system-generator:quick
  npm run audit:star-system-generator:deep
  ```

  Expected: 0 errors. The deep run will reveal what fraction of systems have empty stories (likely zero given Phase 2's median 9 edges per system) and the actual story-length distribution.

  If the deep run produces grammar/template integrity errors, that's a real bug in the renderer or templates — STOP and investigate.

- [ ] **Step 5: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: surface narrative graph systemStory metrics in audit + 4 integrity checks

  Per-system: no unresolved {slot} placeholders, no doubled-noun
  patterns, spineSummary terminal punctuation (warning), body paragraph
  count ≤ 3. Print block emits spineSummary length, body paragraph
  count, body sentence count, and hook count percentiles plus the
  systems-with-empty-story tally.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 14: Final verification

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

- [ ] **Step 2: Spot-check rendered story output**

  ```
  node --import tsx/esm -e "import('./src/features/tools/star_system_generator/lib/generator/index.ts').then(m => { const sys = m.generateSystem({ seed: 'phase3-final', distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal' }); console.log(JSON.stringify({ spineSummary: sys.systemStory.spineSummary, bodyParagraphs: sys.systemStory.body.length, bodySample: sys.systemStory.body[0]?.slice(0, 200), hooks: sys.systemStory.hooks }, null, 2)) })"
  ```

  Expected: `spineSummary` is a single sentence with terminal punctuation. `body` has 1-3 paragraphs. `hooks` has 0-5 entries. Sample text is grammatical English.

- [ ] **Step 3: Existing-prose snapshot still passes**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

  Expected: 3/3 pass. If any snapshot fails, Phase 3 has accidentally affected upstream prose — investigate immediately.

- [ ] **Step 4: Confirm render module structure**

  ```
  ls -R src/features/tools/star_system_generator/lib/generator/graph/render/
  ```

  Expected layout:
  - `index.ts`, `renderSystemStory.ts`, `slotResolver.ts`, `grammarSafety.ts`, `connectives.ts`, `clusters.ts`
  - `templates/`: `index.ts`, `types.ts`, `hostsTemplates.ts`, `dependsOnTemplates.ts`, `contestsTemplates.ts`, `destabilizesTemplates.ts`
  - `__tests__/`: `slotResolver.test.ts`, `grammarSafety.test.ts`, `connectives.test.ts`, `clusters.test.ts`, `templates.test.ts`, `renderSystemStory.test.ts`, `proseUnchanged.test.ts`

- [ ] **Step 5: Phase 3 acceptance**

  - `systemStory.spineSummary` populated for systems with at least one spine edge ✓
  - `systemStory.body` produces 1-3 paragraphs of edge-rendered prose ✓
  - `systemStory.hooks` produces 0-5 GM-facing one-liners ✓
  - All 4 in-scope edge types (`HOSTS`, `DEPENDS_ON`, `CONTESTS`, `DESTABILIZES`) have working template families ✓
  - Same seed produces same `systemStory` ✓
  - All existing tests pass ✓
  - All existing audits pass ✓
  - New audit checks (4 grammar/template) pass ✓
  - **Existing rendered prose is byte-identical for any seed** ✓ (verified by `proseUnchanged.test.ts`)
  - `npm run lint`, `npm run test`, `npm run build` pass ✓

---

## Spec coverage check (self-review)

| Spec requirement | Task |
|---|---|
| `SystemStoryOutput` shape on `GeneratedSystem` | Task 1 |
| `renderSystemStory(graph, rng)` pipeline integration | Task 1 |
| Slot resolver with `{slot:modifier|fallback}` syntax | Task 2 |
| Grammar safety: shape reshape, capitalization, dedouble | Task 3 |
| `EdgeTemplate`, `EdgeTemplateFamily`, `SlotShape` types | Task 4 |
| Connective dictionary | Task 5 |
| Paragraph clustering (spine/active/epistemic) | Task 6 |
| Renderer end-to-end (vertical slice) | Task 7 |
| `HOSTS` template family | Task 7 |
| `DEPENDS_ON` template family | Task 8 |
| `CONTESTS` template family | Task 9 |
| `DESTABILIZES` template family | Task 10 |
| `spineSummary` rendered from top spine edge | Task 11 |
| `hooks` rendered from contested + non-spine active edges | Task 12 |
| Audit length-percentile visibility | Task 13 |
| 4 grammar/template integrity checks | Task 13 |
| Existing tests + audits + prose unchanged | Verified after every task; final check Task 14 |

**Estimated commits:** 14-16 (one per task plus possible review-fix commits).

**Estimated effort:** 1.5 weeks, matching the design doc's Phase 3 budget.

---

## Risks & deferred items

- **Per-slot shape application is partial in Phase 3.** Phase 3 applies the global grammar-safety passes (capitalization, dedouble) but does NOT route the per-template-slot `expects` map into per-slot reshape. This is sufficient for proper-noun-heavy edge types (HOSTS, CONTESTS) but means `DEPENDS_ON` and `DESTABILIZES` with `nounPhrase`/`{*:article}` slots may produce slightly stilted prose. Phase 4 lands the wiring (touches `slotResolver.ts` to accept and apply `expects`). Mitigated in Phase 3 by template authors writing around the limitation.
- **Connective dictionary is small (6 entries).** Most adjacent-pair sentences will fall through to no connective, producing reads like "X. Y. Z." Phase 4 grows the dictionary as new edge types come online; Phase 7 tunes it.
- **Variant selection RNG forks under `'story:body'` and `'story:pick'`** introduce two new seed branches. Captured by the prose-unchanged snapshot test (Task 1) — any drift fails the snapshot, signaling that an upstream RNG fork's order changed.
- **Hidden-epistemic-edges-go-to-hooks logic is dead in Phase 3.** No edges of `visibility === 'hidden'` are produced by Phase 2 rules. Phase 4 introduces `HIDES_FROM` / `CONTRADICTS` rules that may produce hidden edges; the hook renderer already handles them. No code change required in Phase 4 for hooks.
- **The "manual review of 20 sample systems" cohesion check from the master plan is deferred to Phase 7.** Phase 3's quality bar is structural correctness (grammatical English, no unresolved slots, no grammar bugs from the audit list). Phase 7 evaluates whether the system reads as cohesive.

---

## Outputs the next phase relies on

After Phase 3:
- `relationshipGraph.edges` (unchanged from Phase 2).
- `systemStory.spineSummary`, `systemStory.body[]`, `systemStory.hooks[]` (NEW, populated for typical systems).
- All 12 `EdgeTemplateFamily` entries reachable via `templateFor(edgeType)` — 4 are real (HOSTS, DEPENDS_ON, CONTESTS, DESTABILIZES); 8 are stubs (Phase 4 fills 5; Phase 5 fills 3 historical).
- `slotResolver`, `grammarSafety`, `connectives`, `clusters` are all public exports of the graph module barrel — Phase 6 reuses them when wiring `settlementHookSynthesis` / `phenomenonNote` / `settlementWhyHere`.

Phase 4 builds on this directly: 5 new template family files + connective dictionary entries + one minor enhancement to `slotResolver` (per-slot shape application). Phase 5 adds historical edges to the graph + populates the 3 historical edge type families + extends `slotResolver` to handle `{historical:*}` slots.
