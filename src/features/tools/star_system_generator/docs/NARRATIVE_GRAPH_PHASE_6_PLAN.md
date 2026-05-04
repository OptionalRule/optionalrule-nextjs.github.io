# Narrative Graph Phase 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land downstream consumer integration end-to-end. Wire the 3 prose surfaces (`settlementWhyHere`, `phenomenonNote`, `settlementHookSynthesis`) to consult the relationship graph that Phases 0–5 built. Each surface gated by an independent flag in `GenerationOptions.graphAware`. Default behavior (all flags `false`) remains byte-identical to Phase 5; the Phase 3 `proseUnchanged.test.ts` snapshot keeps passing without modification.

**Architecture:** Phase 6 of the [Narrative Graph Plan](./NARRATIVE_GRAPH_PLAN.md). Phases 0–5 are merged on `develop`. Phase 6 adds a single new pipeline step — `graphAwareReshape` — that runs **after** `buildRelationshipGraph` and **before** the `GeneratedSystem` is returned. The reshape pass walks the already-built `settlements` and `phenomena`, looks up incident graph edges by entity id, and replaces specific prose fields when the corresponding flag is on. Existing pre-graph prose generation is unchanged — graph-aware text overrides the inline-generated string only when the flag is on AND relevant edges exist.

**Tech Stack:** TypeScript (strict, `isolatedModules: true`), Vitest, ESLint, existing audit scripts.

**Source spec:** `NARRATIVE_GRAPH_PLAN.md` Sections "Downstream Consumer Integration" (lines 319–342), "File Layout" (line 384–385), "Phase Plan" Phase 6 row (line 444), and the "Downstream integration risk" note (line 454).

**Branch:** Work on `develop`. Phase 5 is merged. Push to `origin/develop` after every successful task so progress is visible.

**Scope:**
- Task 1: Extend `GenerationOptions` with `graphAware?: { settlementWhyHere?: boolean; phenomenonNote?: boolean; settlementHookSynthesis?: boolean }`.
- Task 2: New `graphAwareReshape` orchestrator + integration site in `generateSystem`.
- Task 3: Graph-aware `settlementWhyHere` (replaces semicolon list with prose).
- Task 4: Graph-aware `phenomenonNote` (replaces `Transit:/Question:/Hook:/Image:` blob).
- Task 5: Graph-aware `settlementHookSynthesis` (replaces invariant 4th-sentence boilerplate).
- Task 6: Phase-6 companion snapshot tests covering all-flags-on behavior.
- Task 7: Audit extensions — per-consumer trigger rates, fallback rates, 1 new integrity check.
- Task 8: Final verification + master plan update.

**Out of scope:**
- Reordering the pipeline (settlements → graph → prose). Phase 6 uses a 2-pass reshape because reordering requires splitting settlement/phenomenon generation into build-entity + render-prose stages — a refactor outside Phase 6's 1-week budget. Captured as a Phase 7+ candidate if the reshape pattern proves awkward.
- Retiring `narrativeLines`/`narrativeThreads` (Phase 8).
- Manual review of 20 sample systems + template tuning (Phase 7).
- Phase 5 carryovers (a)–(e) tracked in the master plan's Phase 7 row.
- Settlement `tagHook` rewrite when `settlementHookSynthesis` flag is OFF — fall back unchanged.

---

## Architectural Notes

### Why a 2-pass reshape, not a pipeline reorder

The current `generateSystem` orchestrator in `lib/generator/index.ts` runs:

```
1. generateSettlements        (calls settlementWhyHere, settlementHookSynthesis)
2. generatePhenomena          (calls phenomenonNote)
3. buildRelationshipGraph     (consumes settlements + phenomena as entities)
4. renderSystemStory          (consumes the graph)
5. generateNarrativeLines     (legacy parallel path)
```

Step 3 depends on steps 1–2. Reordering to "graph first, then prose" would require splitting settlement/phenomenon generation into entity-building and prose-rendering halves and threading the graph back through both halves. That's plausible but expensive: it changes function signatures across the orchestrator, requires a new rng-fork choreography, and risks behavior drift on existing seeds. Out of scope for Phase 6's 1-week budget.

The 2-pass alternative: after step 3, run a new step 3.5 — `graphAwareReshape` — that walks the built `settlements` and `phenomena` and overwrites their prose fields in place when flags allow it. This:

- Preserves every existing rng fork in steps 1–4. Same seed → same graph → same systemStory.
- Lets each consumer's flag toggle independently without cross-cutting changes.
- Keeps `proseUnchanged.test.ts` passing unmodified (flags default to false; pre-graph prose is unchanged).
- Is reversible per-consumer if a regression appears in production.

Cost: the inline-generated prose runs even when the flag is on (only to be overwritten). One extra string allocation per consumer per system. Negligible — the audit doesn't measure per-system render time at this granularity.

### Flag mechanism: `GenerationOptions.graphAware`

The codebase has no env-var or feature-flag pattern. Phase 6 introduces flags as a struct field on the existing options bag:

```ts
export interface GenerationOptions {
  seed: string
  distribution: GeneratorDistribution
  tone: GeneratorTone
  gu: GuPreference
  settlements: SettlementDensity
  narrativeBias?: NarrativeBias
  graphAware?: {
    settlementWhyHere?: boolean
    phenomenonNote?: boolean
    settlementHookSynthesis?: boolean
  }
}
```

Why a struct, not three top-level booleans:

- Keeps the Phase 6 surface namespaced — easy to scan as a unit and remove later (Phase 8 retires the toggle once narrativeLines/Threads are gone and graph-aware becomes the default).
- Each subflag is independently optional with `false` default — backwards-compatible for every existing call site.
- Tests and the audit can flip individual flags by spreading: `{ ...baseOptions, graphAware: { phenomenonNote: true } }`.

The reshape orchestrator reads `options.graphAware ?? {}` defensively and treats every missing/false subflag as "skip this consumer."

### Determinism

`graphAwareReshape` forks its own rng under the label `'graph-prose'`. This is a new sub-fork from `rootRng`. Phase 5's existing forks (`'rules'`, `'body'`, `'hooks'`, `'history'`, `'story'`) are untouched. Same parent seed → same forks → same output regardless of which Phase 6 flags are toggled.

The `proseUnchanged.test.ts` snapshot tests run with default options (no `graphAware` field). Since all flags default to false, every consumer falls through to the inline-generated string. Snapshot remains byte-identical. **Verify this assumption holds after every Phase 6 task** — if the snapshot fails on flags-off, the reshape pass is incorrectly mutating fields.

### Edge filtering per consumer

Each consumer reads a different slice of the graph:

| Consumer | Direction | Edge types | Why |
|---|---|---|---|
| `settlementWhyHere` | incoming to settlement | `DEPENDS_ON`, `HOSTS` | "What pulled this settlement to this site" — the resources/bodies it depends on, the body it sits on. |
| `phenomenonNote` | outgoing from phenomenon | `DESTABILIZES` | "What this phenomenon does to other entities" — name the destabilization target. |
| `settlementHookSynthesis` | incident (subject OR object) | spine intersection of {`CONTESTS`, `DEPENDS_ON`, `SUPPRESSES`} | "What's the active pressure on or from this settlement" — closing-sentence boilerplate replacement. |

Edge directionality:

- An edge "incoming to entity X" means `edge.object.id === X.id`.
- An edge "outgoing from entity X" means `edge.subject.id === X.id`.
- "Incident" means subject or object is X.

Lookup uses the existing `edgesByEntity` index from `buildRelationshipGraph`: `graph.edgesByEntity[settlementId] || []`, then filter the edges by id back into `graph.edges`.

### Output contracts per consumer

**`settlementWhyHere` (graph-aware):**
- Look at incoming `DEPENDS_ON` (subject = the resource/body the settlement depends on; object = the settlement) and `HOSTS` (subject = the body; object = the settlement).
- If at least one such edge exists: render 1–2 prose sentences using a small template family (NEW, in this phase). Otherwise fall back to the existing semicolon-list output.
- The template family lives in `lib/generator/prose/` (not `graph/render/templates/`) because it's a consumer-facing prose surface, not a graph-edge sentence.

Template shape (1 variant suffices for Phase 6):

```
'{anchorName} survives because {dependsClause}{hostsClause}.'
```

Where `dependsClause` is "it depends on the chiral ice belt" or similar from the DEPENDS_ON edge object, and `hostsClause` is " on Nosaxa IV-b" from the HOSTS edge subject (or empty if no HOSTS edge). Both clauses pulled directly from the edge's subject/object `displayName` — no slot resolver, no expects, no shape reshape (the prose surface owns its own grammar).

**`phenomenonNote` (graph-aware):**
- The existing function returns `'Transit: ${travelEffect} Question: ${surveyQuestion} Hook: ${conflictHook} Image: ${sceneAnchor}'` — a single run-on string with `Transit:` / `Question:` / `Hook:` / `Image:` labels.
- Graph-aware variant produces 2–3 prose sentences combining the four fields with connectives, and — if a `DESTABILIZES` outgoing edge exists from this phenomenon — names the target entity in the resulting prose.

Template shape (1 variant for Phase 6):

```
With-target:    '{travelEffect} {connectorA} {surveyQuestion} The destabilization centers on {targetDisplayName}: {conflictHook} {sceneAnchor}'
Without-target: '{travelEffect} {connectorA} {surveyQuestion} {conflictHook} {sceneAnchor}'
```

Where `connectorA` is "And" / "But" / "Meanwhile" picked deterministically by `rng.fork('graph-prose').int(0, 2)`. Punctuation cleanup applies (trailing-period guard from `grammarSafety.ts`'s helpers — reuse `capitalizeForPosition` and the trailing-punct stripper from `reshapeSlot`'s clause path).

**`settlementHookSynthesis` (graph-aware):**
- The existing function returns 4 sentences. Sentence 4 is always "Control of the {function} decides who has leverage." — the audit flagged this as invariant boilerplate.
- Graph-aware variant: replace ONLY sentence 4 when an incident edge of type `CONTESTS`, `DEPENDS_ON`, or `SUPPRESSES` exists AND that edge is in the spine.
- Sentences 1–3 (the tag-pair hook, the pressure sentence, and the privately-secret sentence) remain untouched.

Template shape (1 variant for Phase 6, picked based on edge type):

```
CONTESTS:    'The standoff with {otherDisplayName} is the political reality of this site.'
DEPENDS_ON:  'Everything here turns on access to {otherDisplayName}.'
SUPPRESSES:  'Whoever controls {otherDisplayName} decides what gets reported.'
```

Where `otherDisplayName` is the OTHER endpoint of the edge (the one that isn't this settlement). If multiple eligible edges exist for the settlement, pick the highest-spine-rank one (lowest index in `graph.spineEdgeIds`).

### Why entity ids over names

Settlement entities in the graph carry stable `id` strings (`'settlement-1'`, etc.) that match `Settlement.id`. Phenomenon entities likewise carry `'phenomenon-1'` ids that match `SystemPhenomenon.id`. Use these for lookups — never match by `displayName`, which can collide across systems and is normalized through different code paths.

### Fallback semantics

Each consumer's reshape function returns one of:
- The graph-aware prose string (when flag on AND edges exist).
- `null` (when flag on but no eligible edges).
- `null` (when flag off).

The orchestrator only overwrites the field when the reshape returns a non-null string. This means flag-off and flag-on-but-no-edges produce IDENTICAL output to Phase 5. Only flag-on AND edges-found changes the output. This is the contract that keeps `proseUnchanged.test.ts` passing without modification.

### Constructing the new `Fact<string>` field

Each prose field is a `Fact<string>` wrapper (e.g., `whyHere: fact(...)`). The reshape pass, when it overrides, must produce a new `Fact<string>` with:
- `value`: the new graph-aware prose
- `confidence`: `'inferred'` (graph-aware prose is derived, not source-canonical)
- `source`: a new methodNotes-style string explaining the reshape: `'Graph-aware reshape from <consumer name>'`

Reuse the existing `fact(value, confidence, source)` helper in `lib/generator/index.ts` (or import it if not exported — Phase 6 may need to widen its export).

### Audit metrics worth tracking after Phase 6

- **Per-consumer trigger rate** (% of eligible entities where the graph-aware path produced output, vs fell back). Baseline expectation: settlementWhyHere ~70–90% (most settlements have incoming HOSTS/DEPENDS_ON), phenomenonNote ~30–50% (DESTABILIZES is rarer), settlementHookSynthesis ~40–60% (need spine-eligible edges).
- **Empty-story rate** (Phase 5 carryover at 6.77%). Phase 6 may improve this since empty-story systems with no spine still get graph-aware whyHere/note from non-spine edges. Re-measure but don't block on it.
- **Output length distribution** for the 3 surfaces. Compare graph-aware vs fallback. Mostly informational.

### One new integrity check

`prose.unresolvedSlot`: error if any of the graph-aware reshape outputs contain an unresolved `{` character. The reshape templates don't use `{slot}` syntax (they pull `displayName` directly), but a copy-paste mistake or a future extension could introduce one. Cheap defensive check.

---

## File Structure

**New files (created in this phase):**
- `lib/generator/prose/graphAwareReshape.ts` — orchestrator: walks settlements + phenomena, calls per-consumer reshape, returns updated arrays.
- `lib/generator/prose/graphAwareSettlementWhyHere.ts` — reshape function for whyHere.
- `lib/generator/prose/graphAwarePhenomenonNote.ts` — reshape function for phenomenonNote.
- `lib/generator/prose/graphAwareSettlementHook.ts` — reshape function for settlementHookSynthesis.
- `lib/generator/prose/__tests__/graphAwareReshape.test.ts` — orchestrator tests (flag toggles, fallback semantics, fact-wrapping).
- `lib/generator/prose/__tests__/graphAwareSettlementWhyHere.test.ts` — unit tests.
- `lib/generator/prose/__tests__/graphAwarePhenomenonNote.test.ts` — unit tests.
- `lib/generator/prose/__tests__/graphAwareSettlementHook.test.ts` — unit tests.
- `lib/generator/__tests__/phase6On.test.ts` — companion snapshot test (3 seeds, all flags on).

**Files modified:**
- `types.ts` — extend `GenerationOptions` with `graphAware?: { ... }`.
- `lib/generator/index.ts` — call `graphAwareReshape` after `buildRelationshipGraph`; export `fact` helper if not already.
- `scripts/audit-star-system-generator.ts` — track per-consumer trigger rates + 1 new integrity check.
- `docs/NARRATIVE_GRAPH_PLAN.md` — mark Phase 6 done, update "Completed so far".

**Files unchanged:**
- All 12 edge template families. The graph-aware reshape templates live in `prose/`, not `graph/render/templates/`, because they're consumer-facing surfaces, not edge sentences.
- All `graph/` rule files. Phase 6 only consumes the graph; no rule changes.
- `proseUnchanged.test.ts` — keeps passing as-is, since default flags = false.
- `narrativeLines`/`narrativeThreads` generation — orthogonal to Phase 6.

---

## Conventions (from Phases 0–5, applied here)

- Run `npx tsc --noEmit` as part of every task's verification — ESLint does not catch TS module-resolution errors.
- If a plan-prescribed test assertion contradicts actual behavior, correct the test to match real output and document the deviation in the report.
- Commit message style: `<type>: <subject>` lowercase, with the standard `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer (use a HEREDOC for `git commit -m`).
- No comments in code unless WHY is non-obvious.
- Push to `origin/develop` after each successful task.
- NEVER use `any`. Use `unknown`, specific interfaces, or union types.
- Templates and prose strings are content. Reviewer's bar is "natural English, no unresolved slots, no doubled-noun output, no setting-incongruity"; not "matches plan example string verbatim."
- The Phase 3 `proseUnchanged.test.ts` MUST keep passing across every Phase 6 task. Default flags (false) preserve Phase 5 output.

---

## Task 1: Extend `GenerationOptions` with `graphAware`

**Why:** The flag struct is the public surface for Phase 6. Land it first so subsequent tasks have a stable type to consume. Type-only change; no behavioral impact.

**Files:**
- Modify: `src/features/tools/star_system_generator/types.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/__tests__/` (or an existing types test file) — add a type-shape test asserting the new field is optional.

- [ ] **Step 1: Extend the interface**

  Edit `types.ts` (interface starts at line 22):

  ```ts
  export interface GenerationOptions {
    seed: string
    distribution: GeneratorDistribution
    tone: GeneratorTone
    gu: GuPreference
    settlements: SettlementDensity
    narrativeBias?: NarrativeBias
    graphAware?: {
      settlementWhyHere?: boolean
      phenomenonNote?: boolean
      settlementHookSynthesis?: boolean
    }
  }
  ```

- [ ] **Step 2: Type-shape test**

  Find an existing test file that imports `GenerationOptions` (e.g., a test under `lib/generator/__tests__/` or a graph test). Append a static-type assertion:

  ```ts
  it('GenerationOptions accepts graphAware field with all subflags optional', () => {
    const opts: GenerationOptions = {
      seed: 't1', distribution: 'frontier', tone: 'balanced',
      gu: 'normal', settlements: 'normal',
    }
    expect(opts).toBeDefined()

    const optsWithFlags: GenerationOptions = {
      ...opts,
      graphAware: { settlementWhyHere: true },
    }
    expect(optsWithFlags.graphAware?.settlementWhyHere).toBe(true)

    const optsAllFlags: GenerationOptions = {
      ...opts,
      graphAware: {
        settlementWhyHere: true,
        phenomenonNote: true,
        settlementHookSynthesis: true,
      },
    }
    expect(Object.keys(optsAllFlags.graphAware ?? {})).toHaveLength(3)
  })
  ```

  If no obvious home file exists, create `src/features/tools/star_system_generator/__tests__/types.test.ts` with just this test. Reviewer's bar is "the new field type-checks under all expected uses."

- [ ] **Step 3: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

  proseUnchanged must still pass — Phase 6 hasn't changed any behavior yet.

- [ ] **Step 4: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: add graphAware flags to GenerationOptions for phase 6

  GenerationOptions.graphAware?: { settlementWhyHere?, phenomenonNote?,
  settlementHookSynthesis? } gates each downstream consumer's graph-aware
  prose reshape independently. Default (no field) preserves Phase 5
  output byte-identical. Subsequent Phase 6 tasks consume this surface
  to wire each consumer.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 2: `graphAwareReshape` orchestrator + integration site

**Why:** Land the integration point and the orchestrator scaffold before any consumer logic. Subsequent tasks (3, 4, 5) plug into named hooks in the orchestrator. With the orchestrator in place but every per-consumer reshape returning `null`, Phase 5 behavior is preserved.

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/prose/graphAwareReshape.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/graphAwareReshape.test.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (call site after `buildRelationshipGraph`).
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/index.ts` (barrel export).

- [ ] **Step 1: Author the orchestrator**

  ```ts
  // graphAwareReshape.ts
  import type { SeededRng } from '../rng'
  import type {
    Settlement, SystemPhenomenon, GenerationOptions,
  } from '../../../types'
  import type { SystemRelationshipGraph } from '../graph'

  export interface GraphAwareReshapeInput {
    settlements: Settlement[]
    phenomena: SystemPhenomenon[]
    relationshipGraph: SystemRelationshipGraph
    options: GenerationOptions
    rng: SeededRng
  }

  export interface GraphAwareReshapeResult {
    settlements: Settlement[]
    phenomena: SystemPhenomenon[]
  }

  export function graphAwareReshape(input: GraphAwareReshapeInput): GraphAwareReshapeResult {
    const flags = input.options.graphAware ?? {}
    const noFlags =
      !flags.settlementWhyHere &&
      !flags.phenomenonNote &&
      !flags.settlementHookSynthesis
    if (noFlags) {
      return { settlements: input.settlements, phenomena: input.phenomena }
    }

    const rng = input.rng.fork('graph-prose')
    const settlements = flags.settlementWhyHere || flags.settlementHookSynthesis
      ? input.settlements.map(s => reshapeSettlement(s, input.relationshipGraph, flags, rng))
      : input.settlements
    const phenomena = flags.phenomenonNote
      ? input.phenomena.map(p => reshapePhenomenon(p, input.relationshipGraph, rng))
      : input.phenomena

    return { settlements, phenomena }
  }

  function reshapeSettlement(
    settlement: Settlement,
    _graph: SystemRelationshipGraph,
    _flags: NonNullable<GenerationOptions['graphAware']>,
    _rng: SeededRng,
  ): Settlement {
    // Tasks 3 + 5 fill this in. Phase 6 Task 2 returns the input unchanged.
    return settlement
  }

  function reshapePhenomenon(
    phenomenon: SystemPhenomenon,
    _graph: SystemRelationshipGraph,
    _rng: SeededRng,
  ): SystemPhenomenon {
    // Task 4 fills this in. Phase 6 Task 2 returns the input unchanged.
    return phenomenon
  }
  ```

  Notes:
  - The orchestrator is the only export. Per-consumer reshapes are private until later tasks expand them.
  - Flag-off-fast-path returns the input arrays untouched (no allocation, no fork).
  - When any flag is on, fork once and reuse for all consumers (deterministic, isolated from other forks).

- [ ] **Step 2: Barrel export**

  In `lib/generator/prose/index.ts`, add:

  ```ts
  export { graphAwareReshape } from './graphAwareReshape'
  export type {
    GraphAwareReshapeInput, GraphAwareReshapeResult,
  } from './graphAwareReshape'
  ```

- [ ] **Step 3: Wire into `generateSystem`**

  In `lib/generator/index.ts`, after `relationshipGraph = buildRelationshipGraph(...)` (line ~3734), before `systemStory = renderSystemStory(...)` (line 3735):

  ```ts
  const relationshipGraph = buildRelationshipGraph(...)
  const reshaped = graphAwareReshape({
    settlements,
    phenomena,
    relationshipGraph,
    options,
    rng: rootRng,
  })
  const systemStory = renderSystemStory(relationshipGraph, rootRng.fork('story'))
  ```

  Then update every downstream reference to `settlements` / `phenomena` to use `reshaped.settlements` / `reshaped.phenomena`. The simpler refactor: rebind the names:

  ```ts
  const settlementsAfterReshape = reshaped.settlements
  const phenomenaAfterReshape = reshaped.phenomena
  // and update the return object's settlements/phenomena fields to use these
  ```

  Concretely, the safest minimal-diff edit at `lib/generator/index.ts:3735`:

  ```ts
  // Before (current):
  const relationshipGraph = buildRelationshipGraph(/* ... */)
  const systemStory = renderSystemStory(relationshipGraph, rootRng.fork('story'))

  // After:
  const relationshipGraph = buildRelationshipGraph(/* ... */)
  const reshaped = graphAwareReshape({
    settlements,
    phenomena,
    relationshipGraph,
    options,
    rng: rootRng,
  })
  const reshapedSettlements = reshaped.settlements
  const reshapedPhenomena = reshaped.phenomena
  const systemStory = renderSystemStory(relationshipGraph, rootRng.fork('story'))
  ```

  Then update the `runNoAlienGuard({ ... })` return object (around line 3739) to use `reshapedSettlements` and `reshapedPhenomena` in place of `settlements` and `phenomena` for the two emitted fields. All other downstream uses of `settlements`/`phenomena` (e.g., `narrativeFacts` construction, which already happened earlier in the function) are unaffected.

  Don't import `graphAwareReshape` from a deep path — use the barrel: `import { graphAwareReshape } from './prose'`.

  **Important:** the reshape MUST run before the `runNoAlienGuard(...)` return-shape construction (line ~3739) so the no-alien guard inspects the post-reshape prose, not the pre-reshape prose.

- [ ] **Step 4: Tests**

  ```ts
  // graphAwareReshape.test.ts
  import { describe, expect, it } from 'vitest'
  import { graphAwareReshape } from '../graphAwareReshape'
  import { createSeededRng } from '../../rng'
  import type { Settlement, SystemPhenomenon, GenerationOptions } from '../../../../types'
  import type { SystemRelationshipGraph } from '../../graph'

  function emptyGraph(): SystemRelationshipGraph {
    return {
      entities: [], edges: [], spineEdgeIds: [], historicalEdgeIds: [],
      edgesByEntity: {},
      edgesByType: {
        HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
        CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
        CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
        FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
      },
    }
  }

  // Construct minimal Settlement and SystemPhenomenon fixtures with the right
  // shape. Look at types.ts for Settlement and SystemPhenomenon definitions.

  const baseOptions: GenerationOptions = {
    seed: 't', distribution: 'frontier', tone: 'balanced',
    gu: 'normal', settlements: 'normal',
  }

  describe('graphAwareReshape', () => {
    it('returns input unchanged when no flags are set', () => {
      const settlements: Settlement[] = []  // populate with 1+ minimal fixtures
      const phenomena: SystemPhenomenon[] = []
      const result = graphAwareReshape({
        settlements, phenomena,
        relationshipGraph: emptyGraph(),
        options: baseOptions,
        rng: createSeededRng('reshape-test'),
      })
      expect(result.settlements).toBe(settlements)  // identity (no copy)
      expect(result.phenomena).toBe(phenomena)
    })

    it('returns input unchanged when graphAware is empty object', () => {
      // Same as above with options.graphAware = {} explicitly.
    })

    it('iterates settlements when settlementWhyHere flag is on', () => {
      // Pass a settlement, set the flag, verify the reshape was invoked
      // (in Phase 6 Task 2 it's a no-op so the array is .map()'d but contents
      // are returned unchanged — assert the array values deep-equal but the
      // array reference may differ).
    })

    it('iterates phenomena when phenomenonNote flag is on', () => { /* ... */ })

    it('does not iterate phenomena when only settlement flags are on', () => {
      // Verify the phenomena array reference is the original (no .map call).
    })

    it('forks rng with label "graph-prose"', () => {
      // Snapshot or behavioral check — pass an rng whose .fork() spy records
      // the label. Assert 'graph-prose' was the label used.
    })

    it('preserves determinism: same input + same seed → identical output', () => {
      // Two calls with the same input + a fresh rng of same seed produce
      // .toEqual() outputs.
    })
  })
  ```

  Tests use minimal Settlement and SystemPhenomenon fixtures. Look at `lib/generator/__tests__/` or `lib/generator/prose/__tests__/` for similar fixture patterns.

- [ ] **Step 5: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run audit:star-system-generator:quick
  ```

  All must pass. proseUnchanged must still be byte-identical (default flags = false → no reshape effect).

- [ ] **Step 6: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: add graphAwareReshape orchestrator + integration site

  prose/graphAwareReshape.ts walks settlements and phenomena after
  buildRelationshipGraph and dispatches to per-consumer reshape functions
  when GenerationOptions.graphAware subflags are on. Forks rng under
  'graph-prose' label. Per-consumer reshapes are no-ops in Task 2 — Tasks
  3, 4, 5 implement them. Wired into generateSystem between graph build
  and renderSystemStory.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 3: Graph-aware `settlementWhyHere`

**Why:** First real consumer reshape. Replaces the semicolon-list whyHere output with prose constructed from the settlement's incoming `DEPENDS_ON` and `HOSTS` edges, when the `settlementWhyHere` flag is on AND at least one such edge exists.

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/prose/graphAwareSettlementWhyHere.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/graphAwareSettlementWhyHere.test.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/graphAwareReshape.ts` — wire `reshapeSettlement` to call this function under the right flag.

- [ ] **Step 1: Author `graphAwareSettlementWhyHere.ts`**

  ```ts
  import type { Settlement } from '../../../types'
  import type { SystemRelationshipGraph, RelationshipEdge } from '../graph'

  export function graphAwareSettlementWhyHere(
    settlement: Settlement,
    graph: SystemRelationshipGraph,
  ): string | null {
    const incidentEdgeIds = graph.edgesByEntity[settlement.id] ?? []
    if (incidentEdgeIds.length === 0) return null

    const incidentEdges = incidentEdgeIds
      .map(id => graph.edges.find(e => e.id === id))
      .filter((e): e is RelationshipEdge => e !== undefined)

    const dependsOn = incidentEdges.find(e =>
      e.type === 'DEPENDS_ON' && e.subject.id === settlement.id,
    )
    const hosts = incidentEdges.find(e =>
      e.type === 'HOSTS' && e.object.id === settlement.id,
    )

    if (!dependsOn && !hosts) return null

    const dependsClause = dependsOn
      ? `depends on ${dependsOn.object.displayName}`
      : null
    const hostsClause = hosts
      ? `it sits on ${hosts.subject.displayName}`
      : null

    const anchorName = settlement.anchorName.value
    if (dependsClause && hostsClause) {
      return `${anchorName} survives because ${dependsClause}, and ${hostsClause}.`
    }
    if (dependsClause) {
      return `${anchorName} survives because ${dependsClause}.`
    }
    return `${anchorName} survives because ${hostsClause}.`
  }
  ```

  Note: `DEPENDS_ON` direction in the graph has the dependent (settlement) as `subject` and the resource as `object`. Verify this in `graph/rules/dependsOnRules.ts` if the Phase 5 reviewer flagged subject/object inversion concerns. The check above filters by `subject.id === settlement.id`, which assumes settlement is the dependent. Confirm before merging.

- [ ] **Step 2: Wire into the orchestrator**

  Update `graphAwareReshape.ts`'s `reshapeSettlement` (currently a no-op):

  The `fact()` helper currently lives at `lib/generator/index.ts:333` as a private function: `function fact<T>(value: T, confidence: Fact<T>['confidence'], source?: string): Fact<T>`. It is NOT exported. Two acceptable approaches:

  1. **Widen the export** (recommended). Add `export` to the `function fact` declaration at line 333, then import from the barrel:

     ```ts
     // In lib/generator/index.ts at line 333:
     export function fact<T>(value: T, confidence: Fact<T>['confidence'], source?: string): Fact<T> {
       // existing body unchanged
     }
     ```

     ```ts
     // In graphAwareReshape.ts:
     import { fact } from '../index'
     ```

  2. **Duplicate locally** in `graphAwareReshape.ts`. The helper is a thin wrapper around object construction; duplicating preserves the helper-duplication discipline from Phases 4–5 if you prefer not to widen the orchestrator's surface. Only justified if the export widening surfaces unrelated changes.

  Pick option 1 unless `git grep "function fact"` surfaces test fixtures or external callers that would conflict with the export.

  Updated `reshapeSettlement` (with option 1):

  ```ts
  import { graphAwareSettlementWhyHere } from './graphAwareSettlementWhyHere'
  import { fact } from '../index'

  function reshapeSettlement(
    settlement: Settlement,
    graph: SystemRelationshipGraph,
    flags: NonNullable<GenerationOptions['graphAware']>,
    _rng: SeededRng,
  ): Settlement {
    let updated = settlement
    if (flags.settlementWhyHere) {
      const newWhyHere = graphAwareSettlementWhyHere(updated, graph)
      if (newWhyHere !== null) {
        updated = {
          ...updated,
          whyHere: fact(newWhyHere, 'inferred', 'Graph-aware reshape from settlementWhyHere'),
        }
      }
    }
    // settlementHookSynthesis hook will be added in Task 5.
    return updated
  }
  ```

- [ ] **Step 3: Tests for `graphAwareSettlementWhyHere`**

  ```ts
  describe('graphAwareSettlementWhyHere', () => {
    it('returns null when settlement has no incident edges', () => {
      const settlement = makeSettlement('s1')
      const graph = makeGraph({ edges: [], spineEdgeIds: [] })
      expect(graphAwareSettlementWhyHere(settlement, graph)).toBeNull()
    })

    it('returns null when only unrelated edges exist (e.g., CONTROLS)', () => {
      // Add a CONTROLS edge where settlement is subject. Should still return
      // null because the function only consumes DEPENDS_ON + HOSTS.
    })

    it('returns DEPENDS_ON-only prose when only DEPENDS_ON edge exists', () => {
      // Settlement subject of DEPENDS_ON to a chiral ice belt (guResource).
      // Expected: '<anchorName> survives because depends on chiral ice belt.'
    })

    it('returns HOSTS-only prose when only HOSTS edge exists', () => {
      // Settlement object of HOSTS from a body. Expected:
      // '<anchorName> survives because it sits on Nosaxa IV-b.'
    })

    it('returns combined prose when both DEPENDS_ON and HOSTS exist', () => {
      // Both edges. Expected:
      // '<anchorName> survives because depends on chiral ice belt, and it sits on Nosaxa IV-b.'
    })

    it('output ends with terminal punctuation', () => {
      // /[.!?]$/.test(result)
    })

    it('output contains no unresolved {', () => {
      // expect(result).not.toContain('{')
    })

    it('uses anchorName.value, not name.value or id', () => {
      // Settlement with name 'Settlement-1' but anchorName 'Orison Hold'.
      // Output contains 'Orison Hold', not 'Settlement-1'.
    })
  })
  ```

  Helper `makeSettlement` constructs a minimal Settlement fixture; `makeGraph` constructs a minimal SystemRelationshipGraph with 1 settlement entity + the relevant edges + populated `edgesByEntity[settlementId]`.

- [ ] **Step 4: Add an integration test in `graphAwareReshape.test.ts`**

  ```ts
  it('replaces whyHere when settlementWhyHere flag is on AND incident DEPENDS_ON exists', () => {
    const settlement = makeSettlement('s1')  // with anchorName.value === 'Orison Hold'
    const graph = makeGraph({
      edges: [makeDependsOnEdge('s1', 'gu1')],  // settlement → resource
      spineEdgeIds: [],
    })
    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: graph,
      options: { ...baseOptions, graphAware: { settlementWhyHere: true } },
      rng: createSeededRng('test'),
    })
    expect(result.settlements[0].whyHere.value).toContain('Orison Hold')
    expect(result.settlements[0].whyHere.value).toContain('survives because')
    expect(result.settlements[0].whyHere.confidence).toBe('inferred')
  })

  it('preserves whyHere when settlementWhyHere flag is off', () => {
    const settlement = makeSettlement('s1')
    const originalWhyHere = settlement.whyHere
    const graph = makeGraph({
      edges: [makeDependsOnEdge('s1', 'gu1')],
      spineEdgeIds: [],
    })
    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: graph,
      options: baseOptions,  // no graphAware
      rng: createSeededRng('test'),
    })
    expect(result.settlements[0].whyHere).toBe(originalWhyHere)  // identity preserved
  })

  it('preserves whyHere when flag on but no incident edges', () => {
    const settlement = makeSettlement('s1')
    const originalWhyHere = settlement.whyHere
    const graph = makeGraph({ edges: [], spineEdgeIds: [] })
    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: graph,
      options: { ...baseOptions, graphAware: { settlementWhyHere: true } },
      rng: createSeededRng('test'),
    })
    expect(result.settlements[0].whyHere).toBe(originalWhyHere)  // fallback path
  })
  ```

- [ ] **Step 5: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run audit:star-system-generator:quick
  ```

  proseUnchanged passes (default flags = off). audit-quick errors=0.

- [ ] **Step 6: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: graph-aware settlementWhyHere reshape

  When GenerationOptions.graphAware.settlementWhyHere is true, walk the
  settlement's incoming DEPENDS_ON (subject = settlement, object = resource)
  and HOSTS (subject = body, object = settlement) edges and produce 1-2
  prose sentences naming the dependency target and host body. Falls back
  to the existing semicolon-list output when no eligible edges are found.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 4: Graph-aware `phenomenonNote`

**Why:** Replace the run-on `Transit:/Question:/Hook:/Image:` blob with 2–3 prose sentences combining the four fields with connectives. If the phenomenon has an outgoing `DESTABILIZES` edge, name the target entity in the resulting prose.

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/prose/graphAwarePhenomenonNote.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/graphAwarePhenomenonNote.test.ts`
- Modify: `graphAwareReshape.ts` — wire `reshapePhenomenon` to call this function.

- [ ] **Step 1: Author `graphAwarePhenomenonNote.ts`**

  ```ts
  import type { SeededRng } from '../rng'
  import type { SystemPhenomenon } from '../../../types'
  import type { SystemRelationshipGraph, RelationshipEdge } from '../graph'

  const CONNECTORS = ['And', 'But', 'Meanwhile'] as const

  export function graphAwarePhenomenonNote(
    phenomenon: SystemPhenomenon,
    graph: SystemRelationshipGraph,
    rng: SeededRng,
  ): string | null {
    // The phenomenon's id in the graph matches phenomenon.id.
    const incidentEdgeIds = graph.edgesByEntity[phenomenon.id] ?? []
    const incidentEdges = incidentEdgeIds
      .map(id => graph.edges.find(e => e.id === id))
      .filter((e): e is RelationshipEdge => e !== undefined)

    const destabilizes = incidentEdges.find(e =>
      e.type === 'DESTABILIZES' && e.subject.id === phenomenon.id,
    )

    const connector = CONNECTORS[rng.int(0, CONNECTORS.length - 1)]
    const travelEffect = phenomenon.travelEffect.value.trim().replace(/[.,;:!?]+$/, '')
    const surveyQuestion = phenomenon.surveyQuestion.value.trim()
    const conflictHook = phenomenon.conflictHook.value.trim()
    const sceneAnchor = phenomenon.sceneAnchor.value.trim()

    if (destabilizes) {
      const target = destabilizes.object.displayName
      return `${travelEffect}. ${connector}, ${surveyQuestion} The destabilization centers on ${target}: ${conflictHook} ${sceneAnchor}`
    }

    return `${travelEffect}. ${connector}, ${surveyQuestion} ${conflictHook} ${sceneAnchor}`
  }
  ```

  Notes:
  - `rng.int(0, n-1)` is inclusive on both ends per `rng.ts`.
  - Trailing-punct strip on `travelEffect` is a small cleanup so the period we add reads cleanly.
  - The prose intentionally doesn't go through the slot resolver — `phenomenonNote` is a free-form prose surface, not an edge sentence.
  - The function still returns `null` if the result would be identical to the existing blob (e.g., if all 4 fields are empty). Practical guard:

    ```ts
    if (travelEffect === '' && surveyQuestion === '' && conflictHook === '' && sceneAnchor === '') {
      return null
    }
    ```

    Add this check before the early-return paths.

- [ ] **Step 2: Wire into orchestrator**

  Update `graphAwareReshape.ts`'s `reshapePhenomenon`:

  ```ts
  import { graphAwarePhenomenonNote } from './graphAwarePhenomenonNote'

  function reshapePhenomenon(
    phenomenon: SystemPhenomenon,
    graph: SystemRelationshipGraph,
    rng: SeededRng,
  ): SystemPhenomenon {
    const newNote = graphAwarePhenomenonNote(phenomenon, graph, rng)
    if (newNote === null) return phenomenon
    return {
      ...phenomenon,
      note: fact(newNote, 'inferred', 'Graph-aware reshape from phenomenonNote'),
    }
  }
  ```

  The flag check is in the orchestrator's outer dispatch (only runs when `flags.phenomenonNote` is on). The reshape function itself doesn't need to re-check.

- [ ] **Step 3: Tests for `graphAwarePhenomenonNote`**

  ```ts
  describe('graphAwarePhenomenonNote', () => {
    it('returns prose without target name when no DESTABILIZES edge exists', () => {
      const phenomenon = makePhenomenon('p1', {
        travelEffect: 'Drives subliminal between transits',
        surveyQuestion: 'What pulses behind the static?',
        conflictHook: 'Whoever owns the recordings owns the question.',
        sceneAnchor: 'A drift of low-amplitude blooms.',
      })
      const graph = makeGraph({ edges: [], spineEdgeIds: [] })
      const rng = createSeededRng('p-test')
      const result = graphAwarePhenomenonNote(phenomenon, graph, rng)
      expect(result).not.toBeNull()
      expect(result).toContain('Drives subliminal between transits')
      expect(result).not.toContain('Transit:')
      expect(result).not.toContain('destabilization centers on')
    })

    it('returns prose with target name when DESTABILIZES edge exists', () => {
      const phenomenon = makePhenomenon('p1', { /* fields */ })
      const target = makeEntity('settlement', 's1', 'Orison Hold')
      const graph = makeGraph({
        edges: [makeDestabilizesEdge('p1', 's1', target)],
        spineEdgeIds: [],
      })
      const rng = createSeededRng('p-test-2')
      const result = graphAwarePhenomenonNote(phenomenon, graph, rng)
      expect(result).toContain('destabilization centers on Orison Hold')
    })

    it('returns null when all fields are empty strings', () => {
      const phenomenon = makePhenomenon('p1', {
        travelEffect: '', surveyQuestion: '', conflictHook: '', sceneAnchor: '',
      })
      const graph = makeGraph({ edges: [], spineEdgeIds: [] })
      const rng = createSeededRng('p-test-3')
      expect(graphAwarePhenomenonNote(phenomenon, graph, rng)).toBeNull()
    })

    it('output contains no Transit: / Question: / Hook: / Image: labels', () => {
      // Render and assert each of these labels is absent.
    })

    it('output contains no unresolved {', () => {
      // expect(result).not.toContain('{')
    })

    it('output ends with terminal punctuation', () => {
      // /[.!?]$/.test(result)
    })

    it('connector is deterministic per seed', () => {
      const a = graphAwarePhenomenonNote(p, g, createSeededRng('det-1'))
      const b = graphAwarePhenomenonNote(p, g, createSeededRng('det-1'))
      expect(a).toBe(b)
    })
  })
  ```

- [ ] **Step 4: Integration tests in `graphAwareReshape.test.ts`**

  Three cases (mirror Task 3): replaces note when flag on + DESTABILIZES exists; preserves note when flag off; preserves note when flag on but no eligible edges.

- [ ] **Step 5: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run audit:star-system-generator:quick
  ```

- [ ] **Step 6: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: graph-aware phenomenonNote reshape

  When GenerationOptions.graphAware.phenomenonNote is true, replace the
  Transit:/Question:/Hook:/Image: run-on blob with 2-3 prose sentences
  joining travelEffect, surveyQuestion, conflictHook, and sceneAnchor
  with a deterministic connector ('And' / 'But' / 'Meanwhile'). When the
  phenomenon has an outgoing DESTABILIZES edge, name the target entity
  in the prose ('The destabilization centers on <target>:'). Falls back
  to the existing blob when fields are empty.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 5: Graph-aware `settlementHookSynthesis`

**Why:** Eliminates the invariant 4th-sentence boilerplate ("Control of the {function} decides who has leverage.") that the audit flagged as repetitive. When the settlement has an incident spine edge of type `CONTESTS`, `DEPENDS_ON`, or `SUPPRESSES`, the 4th sentence is rewritten to name the OTHER endpoint of that edge.

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/prose/graphAwareSettlementHook.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/graphAwareSettlementHook.test.ts`
- Modify: `graphAwareReshape.ts` — extend `reshapeSettlement` to call this under `flags.settlementHookSynthesis`.

- [ ] **Step 1: Author `graphAwareSettlementHook.ts`**

  ```ts
  import type { Settlement } from '../../../types'
  import type { SystemRelationshipGraph, RelationshipEdge, EdgeType } from '../graph'

  const ELIGIBLE_TYPES: ReadonlyArray<EdgeType> = ['CONTESTS', 'DEPENDS_ON', 'SUPPRESSES']

  export function graphAwareSettlementHook(
    settlement: Settlement,
    graph: SystemRelationshipGraph,
  ): string | null {
    const incidentEdgeIds = graph.edgesByEntity[settlement.id] ?? []
    if (incidentEdgeIds.length === 0) return null

    const incidentEdges = incidentEdgeIds
      .map(id => graph.edges.find(e => e.id === id))
      .filter((e): e is RelationshipEdge => e !== undefined)
      .filter(e => ELIGIBLE_TYPES.includes(e.type))

    const spineSet = new Set(graph.spineEdgeIds)
    const eligible = incidentEdges
      .filter(e => spineSet.has(e.id))
      .sort((a, b) => graph.spineEdgeIds.indexOf(a.id) - graph.spineEdgeIds.indexOf(b.id))

    if (eligible.length === 0) return null
    const edge = eligible[0]
    const otherDisplayName =
      edge.subject.id === settlement.id ? edge.object.displayName : edge.subject.displayName

    if (edge.type === 'CONTESTS') {
      return `The standoff with ${otherDisplayName} is the political reality of this site.`
    }
    if (edge.type === 'DEPENDS_ON') {
      return `Everything here turns on access to ${otherDisplayName}.`
    }
    return `Whoever controls ${otherDisplayName} decides what gets reported.`  // SUPPRESSES
  }

  export function rewriteFourthSentence(
    existing: string,
    replacement: string,
  ): string {
    // The original tagHook from settlementHookSynthesis ends with:
    //   ' Control of <noun phrase> decides who has leverage.'
    // We strip the last sentence (period-terminated) and append the replacement.
    const lastPeriodBefore = findFourthSentenceStart(existing)
    if (lastPeriodBefore === -1) return existing  // can't safely rewrite
    return existing.slice(0, lastPeriodBefore + 1).trim() + ' ' + replacement
  }

  function findFourthSentenceStart(text: string): number {
    // Find the index of the period before the 4th sentence. The hook is
    // structured as 4 sentences joined by spaces. Find the 3rd period.
    let count = 0
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '.') {
        count += 1
        if (count === 3) return i
      }
    }
    return -1
  }
  ```

  Notes:
  - The fallback (`null`) covers: no incident edges, no eligible types, no spine edges of those types.
  - Spine ordering matters: pick the first eligible edge in `graph.spineEdgeIds` order. Spine order encodes priority (top spine first).
  - `rewriteFourthSentence` is a pragmatic surgery: count periods to find the 4th sentence boundary. The 4-sentence assumption is invariant in `settlementHookSynthesis` (it always emits 4 sentences). If the function's structure changes, this surgery will misalign — caught by integration tests.

- [ ] **Step 2: Wire into orchestrator**

  Extend `reshapeSettlement` in `graphAwareReshape.ts`:

  ```ts
  import { graphAwareSettlementHook, rewriteFourthSentence } from './graphAwareSettlementHook'

  function reshapeSettlement(
    settlement: Settlement,
    graph: SystemRelationshipGraph,
    flags: NonNullable<GenerationOptions['graphAware']>,
    _rng: SeededRng,
  ): Settlement {
    let updated = settlement
    if (flags.settlementWhyHere) {
      const newWhyHere = graphAwareSettlementWhyHere(updated, graph)
      if (newWhyHere !== null) {
        updated = {
          ...updated,
          whyHere: fact(newWhyHere, 'inferred', 'Graph-aware reshape from settlementWhyHere'),
        }
      }
    }
    if (flags.settlementHookSynthesis) {
      const replacement = graphAwareSettlementHook(updated, graph)
      if (replacement !== null) {
        const newHook = rewriteFourthSentence(updated.tagHook.value, replacement)
        if (newHook !== updated.tagHook.value) {
          updated = {
            ...updated,
            tagHook: fact(newHook, 'inferred', 'Graph-aware reshape from settlementHookSynthesis'),
          }
        }
      }
    }
    return updated
  }
  ```

- [ ] **Step 3: Tests for `graphAwareSettlementHook`**

  ```ts
  describe('graphAwareSettlementHook', () => {
    it('returns null when no incident edges exist', () => { /* ... */ })

    it('returns null when only non-eligible incident edges exist (CONTROLS, HOSTS)', () => { /* ... */ })

    it('returns null when CONTESTS edge exists but is not in spine', () => {
      // Edge present in graph.edges but not in spineEdgeIds.
      // Function should return null.
    })

    it('returns CONTESTS prose when settlement is in an incident CONTESTS spine edge', () => {
      // Edge: subject=other-faction, object=settlement (or vice versa), type=CONTESTS, in spine.
      // Expected: 'The standoff with <other.displayName> is the political reality of this site.'
    })

    it('returns DEPENDS_ON prose for incident DEPENDS_ON spine edge', () => { /* ... */ })

    it('returns SUPPRESSES prose for incident SUPPRESSES spine edge', () => { /* ... */ })

    it('picks the highest-spine-rank edge when multiple eligible spine edges exist', () => {
      // Two eligible edges at different positions in spineEdgeIds.
      // Function picks the one at index 0.
    })

    it('output contains no unresolved {', () => { /* ... */ })

    it('output ends with terminal punctuation', () => { /* ... */ })
  })

  describe('rewriteFourthSentence', () => {
    it('replaces the 4th sentence with the replacement', () => {
      const existing = 'Sentence one. Sentence two. Sentence three. Sentence four.'
      const replacement = 'New fourth sentence.'
      expect(rewriteFourthSentence(existing, replacement))
        .toBe('Sentence one. Sentence two. Sentence three. New fourth sentence.')
    })

    it('returns input unchanged if fewer than 3 sentence-terminating periods found', () => {
      const existing = 'Only one. Two.'
      const replacement = 'X.'
      expect(rewriteFourthSentence(existing, replacement)).toBe(existing)
    })
  })
  ```

- [ ] **Step 4: Integration test in `graphAwareReshape.test.ts`**

  ```ts
  it('rewrites tagHook 4th sentence when settlementHookSynthesis flag on + spine edge exists', () => {
    const settlement = makeSettlement('s1')
    settlement.tagHook = fact(
      'Sentence one. Pressure sentence. Privately, secret. Control of the function decides who has leverage.',
      'human-layer', 'Generated...',
    )
    const graph = makeGraph({
      edges: [makeContestsEdge('s1', 'f1', 'Route Authority')],
      spineEdgeIds: ['<edge-id>'],
    })
    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: graph,
      options: { ...baseOptions, graphAware: { settlementHookSynthesis: true } },
      rng: createSeededRng('hook-test'),
    })
    expect(result.settlements[0].tagHook.value).toContain('standoff with Route Authority')
    expect(result.settlements[0].tagHook.value).not.toContain('decides who has leverage')
  })

  it('combines whyHere + settlementHookSynthesis flags independently', () => {
    // Both flags on, both apply. Verify whyHere is graph-aware AND tagHook is rewritten.
  })
  ```

- [ ] **Step 5: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run audit:star-system-generator:quick
  ```

- [ ] **Step 6: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: graph-aware settlementHookSynthesis 4th-sentence rewrite

  When GenerationOptions.graphAware.settlementHookSynthesis is true and
  the settlement has an incident spine edge of type CONTESTS,
  DEPENDS_ON, or SUPPRESSES, replace the invariant 4th sentence
  ('Control of the function decides who has leverage') with prose that
  names the other endpoint of the spine edge. Sentences 1-3 (tag-pair
  hook, pressure sentence, privately-secret) remain untouched. Falls
  back to the original tagHook when no eligible spine edge exists.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 6: Phase-6 companion snapshot tests

**Why:** Phase 5's `proseUnchanged.test.ts` pins flag-OFF output. Phase 6 needs a complementary snapshot that pins flag-ON output to catch regressions across all 3 consumers in a single, behavior-anchoring test.

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts`

- [ ] **Step 1: Author the test**

  ```ts
  import { describe, expect, it } from 'vitest'
  import { generateSystem } from '..'
  import type { GenerationOptions } from '../../../types'

  const baseOptions: Omit<GenerationOptions, 'seed'> = {
    distribution: 'frontier',
    tone: 'balanced',
    gu: 'normal',
    settlements: 'normal',
    graphAware: {
      settlementWhyHere: true,
      phenomenonNote: true,
      settlementHookSynthesis: true,
    },
  }

  const seeds = ['phase6-on-1', 'phase6-on-2', 'phase6-on-3'] as const

  describe('Phase 6 graph-aware prose surfaces (all flags on)', () => {
    for (const seed of seeds) {
      it(`seed ${seed} produces stable graph-aware output`, () => {
        const sys = generateSystem({ seed, ...baseOptions })

        const surfaces = {
          settlementTagHooks: sys.settlements.map(s => s.tagHook?.value ?? ''),
          settlementWhyHere: sys.settlements.map(s => s.whyHere?.value ?? ''),
          phenomenonNotes: sys.phenomena.map(p => p.note?.value ?? ''),
        }

        expect(surfaces).toMatchSnapshot()
      })
    }
  })

  describe('Phase 6 isolation: flag toggles only affect their own surface', () => {
    it('settlementWhyHere flag alone does not change tagHook or note', () => {
      const allOff = generateSystem({ seed: 'isolate-1', ...baseOptions, graphAware: {} })
      const onlyWhy = generateSystem({
        seed: 'isolate-1', ...baseOptions,
        graphAware: { settlementWhyHere: true },
      })
      expect(onlyWhy.settlements.map(s => s.tagHook.value))
        .toEqual(allOff.settlements.map(s => s.tagHook.value))
      expect(onlyWhy.phenomena.map(p => p.note.value))
        .toEqual(allOff.phenomena.map(p => p.note.value))
    })

    it('phenomenonNote flag alone does not change settlement surfaces', () => { /* ... */ })

    it('settlementHookSynthesis flag alone does not change whyHere or note', () => { /* ... */ })
  })

  describe('Phase 6 determinism', () => {
    it('same seed + same flags produces identical output across runs', () => {
      const a = generateSystem({ seed: 'det-1', ...baseOptions })
      const b = generateSystem({ seed: 'det-1', ...baseOptions })
      expect(a.settlements.map(s => s.whyHere.value))
        .toEqual(b.settlements.map(s => s.whyHere.value))
      expect(a.phenomena.map(p => p.note.value))
        .toEqual(b.phenomena.map(p => p.note.value))
    })
  })
  ```

  When the snapshot file is generated, eyeball it manually for sanity:
  - Each `whyHere` reads as 1–2 sentences when graph-aware, semicolon-list when fallback.
  - Each `note` reads as prose, no `Transit:` labels, with target name when DESTABILIZES exists.
  - Each `tagHook` ends with a graph-aware closing sentence when applicable.

- [ ] **Step 2: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

  proseUnchanged still passes. The new phase6On test commits its initial snapshot file.

- [ ] **Step 3: Commit**

  Include the snapshot file in the commit.

  ```
  git commit -m "$(cat <<'EOF'
  test: snapshot phase 6 graph-aware prose surfaces with all flags on

  phase6On.test.ts pins the output of settlements[].whyHere,
  settlements[].tagHook, and phenomena[].note across 3 seeds with
  graphAware: { settlementWhyHere, phenomenonNote, settlementHookSynthesis }
  all true. Includes flag-isolation tests verifying each flag only
  affects its own surface, plus determinism verification.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 7: Audit extensions

**Why:** Track per-consumer trigger rates and add 1 new integrity check (`prose.unresolvedSlot`). Surfaces visibility into how often each graph-aware path actually fires vs falls back.

**Files:**
- Modify: `scripts/audit-star-system-generator.ts`

- [ ] **Step 1: Run audit with all-flags-on profile**

  The audit currently runs without any `graphAware` flags (defaults). To measure Phase 6 trigger rates, the audit needs to call `generateSystem` with all flags on.

  Two approaches:
  1. Add a `STAR_SYSTEM_AUDIT_PHASE6` env var that, when set to `1`, passes `graphAware: { all: true }` to every `generateSystem` call.
  2. Always run with all flags on. Phase 6's contract is that flag-off = Phase 5 = already covered by the existing audit.

  Recommendation: option 2. The audit's job after Phase 6 is to characterize the Phase 6 surface; flag-off is implicitly covered by the proseUnchanged test which catches any drift.

  Find the `makeOptions` function in the audit script (around line 1000+) — it builds the `GenerationOptions` for each corpus run. Add the `graphAware` field there:

  ```ts
  function makeOptions(distribution, tone, gu, settlements, index): GenerationOptions {
    return {
      seed: `${distribution}-${tone}-${gu}-${settlements}-${index}`,
      distribution, tone, gu, settlements,
      graphAware: {
        settlementWhyHere: true,
        phenomenonNote: true,
        settlementHookSynthesis: true,
      },
    }
  }
  ```

- [ ] **Step 2: Track per-consumer rates**

  Extend `CorpusStats`:

  ```ts
  whyHereGraphAwareCount: number      // settlements where whyHere came from the graph
  whyHereFallbackCount: number        // settlements where whyHere fell back
  noteGraphAwareCount: number         // phenomena where note came from the graph
  noteFallbackCount: number
  hookGraphAwareCount: number         // settlements where tagHook 4th sentence was rewritten
  hookFallbackCount: number
  ```

  In `auditSystem`, detect the path each surface took. Detection heuristic:
  - `whyHere` graph-aware: starts with `<anchorName> survives because` pattern.
  - `whyHere` fallback: contains `;` (semicolon) — the legacy joiner.
  - `note` graph-aware: does NOT contain `Transit:` label.
  - `note` fallback: contains `Transit:`.
  - `hook` graph-aware: 4th sentence contains "standoff with" / "turns on access to" / "Whoever controls".
  - `hook` fallback: 4th sentence contains "decides who has leverage".

  Heuristics are imperfect — they assume the templates from Tasks 3–5 are stable. Capture in a comment near the detection block.

  ```ts
  for (const settlement of system.settlements) {
    if (settlement.whyHere.value.includes(';')) {
      stats.whyHereFallbackCount += 1
    } else {
      stats.whyHereGraphAwareCount += 1
    }
    if (settlement.tagHook.value.includes('decides who has leverage')) {
      stats.hookFallbackCount += 1
    } else {
      stats.hookGraphAwareCount += 1
    }
  }
  for (const phenomenon of system.phenomena) {
    if (phenomenon.note.value.includes('Transit:')) {
      stats.noteFallbackCount += 1
    } else {
      stats.noteGraphAwareCount += 1
    }
  }
  ```

- [ ] **Step 3: Print metrics**

  In the global print block, after the existing graph metrics:

  ```ts
  const totalSettlements = stats.whyHereGraphAwareCount + stats.whyHereFallbackCount
  if (totalSettlements > 0) {
    console.log(`whyHere graph-aware rate: ${(stats.whyHereGraphAwareCount / totalSettlements * 100).toFixed(1)}% (${stats.whyHereGraphAwareCount}/${totalSettlements})`)
    console.log(`tagHook graph-aware rate: ${(stats.hookGraphAwareCount / totalSettlements * 100).toFixed(1)}% (${stats.hookGraphAwareCount}/${totalSettlements})`)
  }
  const totalPhenomena = stats.noteGraphAwareCount + stats.noteFallbackCount
  if (totalPhenomena > 0) {
    console.log(`phenomenonNote graph-aware rate: ${(stats.noteGraphAwareCount / totalPhenomena * 100).toFixed(1)}% (${stats.noteGraphAwareCount}/${totalPhenomena})`)
  }
  ```

- [ ] **Step 4: New integrity check**

  ```ts
  // After the graph integrity checks, before duplicate-edge:
  for (const settlement of system.settlements) {
    if (settlement.whyHere.value.includes('{')) {
      addFinding(findings, 'error', seed, 'prose.unresolvedSlot',
        `Settlement ${settlement.id} whyHere contains unresolved slot: ${settlement.whyHere.value}`)
    }
    if (settlement.tagHook.value.includes('{')) {
      addFinding(findings, 'error', seed, 'prose.unresolvedSlot',
        `Settlement ${settlement.id} tagHook contains unresolved slot.`)
    }
  }
  for (const phenomenon of system.phenomena) {
    if (phenomenon.note.value.includes('{')) {
      addFinding(findings, 'error', seed, 'prose.unresolvedSlot',
        `Phenomenon ${phenomenon.id} note contains unresolved slot.`)
    }
  }
  ```

- [ ] **Step 5: Run deep audit**

  ```bash
  npm run audit:star-system-generator:deep
  ```

  Capture and report:
  - whyHere graph-aware rate (target: 70–90%).
  - phenomenonNote graph-aware rate (target: 30–50%).
  - tagHook graph-aware rate (target: 40–60%).
  - 0 `prose.unresolvedSlot` findings.
  - Total errors / warnings (must be 0 for both).
  - Empty-story rate (Phase 5 baseline: 6.77%; Phase 6 may improve).

  If `prose.unresolvedSlot` fires, STOP and diagnose — these should be impossible by Tasks 3–5's design.

- [ ] **Step 6: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: surface phase 6 graph-aware prose metrics in audit + 1 check

  Audit now runs every system with graphAware: all-on, tracks per-consumer
  graph-aware vs fallback rates (whyHere, phenomenonNote, tagHook), and
  adds prose.unresolvedSlot integrity check (errors if any reshape output
  contains an unresolved '{' character). Numbers from this run are
  captured in the commit body.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 8: Final verification + master plan update

**Files:** `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_PLAN.md`

- [ ] **Step 1: Full quality bar**

  ```bash
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run audit:star-system-generator:quick
  npm run audit:star-system-generator:deep
  npm run build
  ```

- [ ] **Step 2: Spot-check rendered output**

  ```bash
  node --import tsx/esm -e "import('./src/features/tools/star_system_generator/lib/generator/index.ts').then(m => { for (const seed of ['phase6-spot-1', 'phase6-spot-2', 'phase6-spot-3']) { const sys = m.generateSystem({ seed, distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal', graphAware: { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true } }); console.log(seed, '— whyHere:', sys.settlements.map(s => s.whyHere.value).join(' || ')); console.log('  tagHook:', sys.settlements.map(s => s.tagHook.value).join(' || ')); console.log('  note:', sys.phenomena.map(p => p.note.value).join(' || ')); console.log() } })"
  ```

  Expected: graph-aware prose visible on most settlements; phenomena notes read as prose, not Transit/Question/Hook/Image labels.

- [ ] **Step 3: Existing prose snapshot still passes**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

- [ ] **Step 4: Phase 6 acceptance**

  - All 3 consumers gated by independent flags ✓
  - Default options (no `graphAware` field) preserves Phase 5 byte-identical output ✓
  - With all flags on, the 3 surfaces produce graph-aware prose when edges exist ✓
  - Same seed → same graph → same systemStory regardless of flag state ✓
  - All existing tests pass ✓
  - `proseUnchanged.test.ts` continues to pass ✓
  - `phase6On.test.ts` snapshots stable ✓
  - Audit errors=0; prose.unresolvedSlot count = 0 ✓
  - Per-consumer trigger rates fall in target bands (whyHere 70–90%, phenomenonNote 30–50%, tagHook 40–60%)

- [ ] **Step 5: Update master plan**

  Edit `docs/NARRATIVE_GRAPH_PLAN.md`:
  - Phase 6 row Status: `⏳ Not yet planned` → `✅ Done — [plan](./NARRATIVE_GRAPH_PHASE_6_PLAN.md)`.
  - "Completed so far" line: `Phases 0, 1, 2, 3, 4, 5 (~7 weeks)` → `Phases 0, 1, 2, 3, 4, 5, 6 (~8 weeks)`.

  If any Phase 6 surface produced unexpectedly low trigger rates (e.g., `phenomenonNote` < 20% because DESTABILIZES is rarer than expected), append a note to Phase 7's row about template tuning for the affected consumer.

  Commit separately:
  ```
  git commit -m "docs: mark phase 6 complete in master narrative graph plan"
  git push origin develop
  ```

---

## Spec coverage check (self-review)

| Spec requirement | Task |
|---|---|
| `GenerationOptions.graphAware` flag struct | Task 1 |
| Pipeline integration (graph-aware reshape after `buildRelationshipGraph`) | Task 2 |
| `settlementWhyHere` graph-aware reshape (incoming DEPENDS_ON / HOSTS) | Task 3 |
| `phenomenonNote` graph-aware reshape (outgoing DESTABILIZES with target name) | Task 4 |
| `settlementHookSynthesis` 4th-sentence rewrite (incident spine CONTESTS/DEPENDS_ON/SUPPRESSES) | Task 5 |
| Independent flag-gating per consumer | Tasks 1, 2, 3, 4, 5 (composed) |
| Fallback to existing prose when no edges OR flag off | Tasks 3, 4, 5 |
| `proseUnchanged.test.ts` continues to pass with default flags | Verified after every task; final check Task 8 |
| Phase-6-on snapshot for graph-aware behavior | Task 6 |
| Audit metrics + new integrity check | Task 7 |

**Estimated commits:** 8–10 (one per task plus possible review-fix commits).

**Estimated effort:** ~1 week (matches the master plan's Phase 6 budget).

---

## Risks & deferred items

- **Heuristic-based audit detection.** Task 7 detects which path each prose surface took by scanning for substring patterns ("survives because", "Transit:", etc.). If Tasks 3–5 templates are tightened during review, the audit heuristics break silently. Mitigation: assert audit detection rates against `phase6On.test.ts` snapshot rates as a coarse sanity check during Task 8 verification.

- **`rewriteFourthSentence` assumes 4-sentence structure.** The existing `settlementHookSynthesis` always emits exactly 4 sentences. If a future change reduces it to 3 or expands to 5, the period-counting surgery will misalign. Captured in Task 5 with a `findFourthSentenceStart` helper that returns -1 when fewer than 3 periods exist (safe default: skip the rewrite). Future-proofing: when retiring `settlementHookSynthesis` in Phase 8, the rewrite logic also retires.

- **Pipeline reorder deferred.** The 2-pass reshape preserves Phase 5 ordering. If Phase 6 produces awkward prose that would be cleaner with edge knowledge during settlement/phenomenon construction (vs. post-hoc reshape), Phase 7 may revisit the ordering refactor. Capture as a potential Phase 7 follow-up.

- **`fact()` helper export.** Task 3 needs `fact()` from `lib/generator/index.ts`. If it's not currently exported, widening the export is fine — but verify nothing else relies on it being internal. The helper is a thin wrapper; duplicating it locally is also acceptable per the duplication discipline from Phases 4–5.

- **Edge `subject`/`object` direction confirmation.** Tasks 3, 4, 5 assume specific directions for DEPENDS_ON, HOSTS, DESTABILIZES, CONTESTS, SUPPRESSES. Confirm by reading the rule files (`graph/rules/<edgeType>Rules.ts`) before writing the consumer functions. If Phase 5 review notes flagged any subject/object semantics ambiguity, double-check those types.

- **Empty-story carryover unaffected.** Phase 5 noted 6.77% empty-story systems (no spine). Phase 6's `settlementHookSynthesis` rewrite REQUIRES a spine edge, so empty-story systems can't gain a graph-aware tagHook. `settlementWhyHere` may help (DEPENDS_ON / HOSTS exist on most settlements regardless of spine). Re-measure in Task 7; do not block on improvement.

- **Determinism risk from `rng.fork('graph-prose')`.** New fork. Phase 5's `'history'` and `'story'` forks are unaffected. The `proseUnchanged.test.ts` snapshot should not depend on this fork (it pins flag-off behavior, where the fork is never created). Verify in Task 2.

- **The `unresolvedSlot` integrity check is heuristic.** A `{` in legitimate prose (e.g., a quote with `{` characters) would trigger a false positive. None of the templates use `{` in this way today, but future content additions should be aware.

---

## Outputs the next phase relies on

After Phase 6:
- `GenerationOptions.graphAware` is the canonical surface for toggling graph-aware downstream prose. Phase 7 may add new subflags to it (e.g., for hooks or settlement summaries) without changing the orchestration.
- `lib/generator/prose/graphAwareReshape.ts` is the central dispatch point for any future graph-aware prose surface. New consumers can plug in without touching `lib/generator/index.ts`.
- The audit reports per-consumer trigger rates — Phase 7 baselines against these numbers when measuring template improvements.
- `proseUnchanged.test.ts` (Phase 3) and `phase6On.test.ts` (Phase 6) together pin the entire prose surface's behavior in both flag-off and flag-on modes. Phase 7 template tuning regenerates `phase6On.test.ts` snapshots intentionally; `proseUnchanged.test.ts` should remain stable until Phase 8.
- `'graph-prose'` rng sub-fork is established and stable; future phases should NOT reuse this fork name.
