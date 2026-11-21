# Narrative Stage Carve-out Implementation Plan (#2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Status:** awaiting the user's personal approval (decision Q16). Do not start Task 1 until the user approves.

**Goal:** Move the Narrative stage out of `lib/generator/index.ts` (4,569 lines at `712ffab`) into a `lib/generator/narrative/` module with one entry point, and move `fact` to a leaf module. Every seed must produce byte-identical output.

**Architecture:** `generateSystem` keeps building the human layer, then calls `runNarrativeStage(input, rootRng)` once. The stage owns its six fork labels and the order of its steps. It returns Narrative Facts, the Relationship Graph, the System Story (which carries the Conflicts), Stories at Port, and the reshaped Settlements and System Phenomena. Debris attach, the Companion remap, `runNoAlienGuard` and `derivePopulationLayer` stay in `generateSystem` (decision Q8).

**Tech stack:** TypeScript (strict, no `any`), Vitest unit config.

## Binding decisions and constraints

- **Q2 / ADR-0001:** #2 is rejected if any golden hash changes. The gate is `__tests__/generator-golden.test.ts` (200 seeds: two per Generation Options combination plus 8 edge-case seeds, added in `56a8731`). **Never** run `npm run test:star-system-golden:update` and never run `vitest -u` in this plan. Any snapshot or golden diff means the refactor is wrong. Revert the step and do not "fix" the expectation.
- **Q8:** the stage covers facts → Relationship Graph → Conflicts → reshape → System Story → Stories at Port, and nothing else.
- **Q9:** `fact` moves to `lib/generator/fact.ts`. All importers are updated. `index.ts` does **not** re-export it, not even temporarily across a commit.
- **Q4:** verified dead code that the work touches is deleted in its own commit. None is expected here (the `graphAware` deletion belongs to #3).
- **Q6:** the new module name "Narrative Stage" is added to `GLOSSARY.md` through the `domain-modeling` skill. The user reviews it afterwards.
- **Q7:** one reviewer agent checks the branch against `CLAUDE.md` and this plan before it merges.
- Project rules: Conventional Commits with scope `star_system_generator`; no `any`; prefix unused parameters with `_`; no code comments; run `npm run graph:update` after `src/` edits; commit per task; push to `origin/develop` fast-forward only.
- Paths below are relative to `src/features/tools/star_system_generator/`, with `G = lib/generator`.

## Fork labels that must survive unchanged

`rng.fork(label)` (G/rng.ts:58-60) seeds a fresh generator from `${seed}:${label}` and does not advance the parent. Only the label strings and the stream each label is forked **from** matter; call order does not. All six are forked from `rootRng` today:

| Step | Call at `712ffab` (G/index.ts) | Fork label | Forked from |
|------|------|------|------|
| Narrative Facts | `buildNarrativeFacts({ ..., factionRng })` | `'factions'` | `rootRng` |
| Relationship Graph | `buildRelationshipGraph(..., rng)` | `'graph'` | `rootRng` |
| Conflicts | `buildConflicts(..., rng)` | `'conflicts'` | `rootRng` |
| Reshape | `graphAwareReshape({ ..., rng: rootRng })` | `'graph-prose'` (forked **inside** `prose/graphAwareReshape.ts:27`) | `rootRng` |
| System Story | `renderSystemStory(graph, rng, ...)` | `'story'` | `rootRng` |
| Stories at Port | `selectSystemHooks({ rng, ... })` | `'hooks'` | `rootRng` |

Consequences for the stage:
- It must be handed `rootRng` itself. Handing it `rootRng.fork('narrative')` would turn every label into `seed:narrative:…` and change every system.
- `graphAwareReshape` must keep receiving the unforked `rootRng`. Its internal `'graph-prose'` fork and the nested `why-here-${id}`, `hook-${id}` forks stay exactly where they are.
- `reshapePhenomenon` shares one `'graph-prose'` stream across all phenomena, so the phenomena array must reach the stage in today's order: generated, then debris-spawned, with the binary-contact phenomenon first for volatile companions.

## Design it twice

The problem: about 490 lines of `index.ts` (the Narrative Fact builders at 3782-4197 plus `uniqueStrings` at 399-401) and about 75 lines of `generateSystem` (4358-4431) form one cohesive stage. Its only collaborators are pure, in-process modules (`graph`, `conflicts`, `prose`, `hooks`, `factions`, `data/gu`, `prose/helpers`). There is no I/O, so no adapter is needed. The seam sits between "human layer generated" and "post-narrative attach".

### Option A: one deep function

```ts
export interface NarrativeStageInput {
  options: GenerationOptions
  systemName: Fact<string>
  primary: Star
  companions: StellarCompanion[]
  reachability: Reachability
  architecture: SystemArchitecture
  bodies: OrbitingBody[]
  guOverlay: GuOverlay
  settlements: Settlement[]
  ruins: HumanRemnant[]
  phenomena: SystemPhenomenon[]
}

export interface NarrativeStageOutput {
  narrativeFacts: NarrativeFact[]
  relationshipGraph: SystemRelationshipGraph
  systemStory: SystemStoryOutput
  hooks: SystemHooks
  settlements: Settlement[]
  phenomena: SystemPhenomenon[]
}

export function runNarrativeStage(input: NarrativeStageInput, rootRng: SeededRng): NarrativeStageOutput
```

- The caller passes the human layer and `rootRng`. The six fork labels, the step order, the per-step option projections (`{ tone, gu, distribution, settlements }`), the graph's settlement and ruin projections, and the Narrative Fact builders all sit behind the seam.
- Conflicts are not returned separately. They already reach the output through `systemStory.conflicts`, and `generateSystem` never used them except to feed hooks.
- Depth: one entry point hides about 490 lines. Locality: future changes to narrative order, labels or Narrative Domains (#1) land in `narrative/` only. `prose/graphAwareReshape.ts` and its test are untouched.

### Option B: an explicit fork port plus exported steps

```ts
export interface NarrativeForks {
  factions: SeededRng
  graph: SeededRng
  conflicts: SeededRng
  graphProse: SeededRng
  story: SeededRng
  hooks: SeededRng
}

export function narrativeForksFrom(rootRng: SeededRng): NarrativeForks
export function buildNarrativeFacts(input: NarrativeStageInput, rng: SeededRng): NarrativeFact[]
export function runNarrativeStage(input: NarrativeStageInput, forks: NarrativeForks): NarrativeStageOutput
```

- The RNG streams become a port. Tests could inject a stream per step, and the label table is one object literal in `narrativeForksFrom`.
- `graphAwareReshape` would have to take the already-forked `'graph-prose'` stream instead of `rootRng`. That changes its signature and `prose/__tests__/graphAwareReshape.test.ts`, although the output stays byte-identical because `fork` is pure.
- It has more surface (three exports, a six-field port) and supports a use case nobody has: no caller wants to run the steps separately or swap streams. The `'graph-prose'` fork would also move out of the module that owns its nested `why-here-*` / `hook-*` forks, splitting one label family across two files.

### Choice: Option A

Option A gives more leverage per entry point and keeps every fork label next to the code that consumes it. It changes only `index.ts`, the new `narrative/` files and the `fact` importers. The determinism argument is also the simplest: the stage receives the same `rootRng` and makes the same six calls, copied verbatim. Option B's injectable streams do not help with the real risk (label or source-stream drift), which the golden guard and the fork-label test in Task 3 already catch. Option B can still be added later behind A's interface if per-step tests are ever needed.

## Effect on the full-pipeline tests

The review counted 38 of 160 test files that run the whole `generateSystem` (at `b18e4aa`). At `712ffab` there are **49 of 160**, and **50 of 161** once the golden guard is counted (`grep -rl "generateSystem(" … | grep test`). The same grep also finds 49 at `b18e4aa`, so the review's 38 was an undercount, not growth. The viewer3d and UI suites (`*.test.tsx`) are probably the difference.

- None of them should need an edit. `generateSystem(options, knownSystem?)` keeps its signature, and its output must be byte-identical. If one of them changes, the refactor broke something.
- This includes the snapshot suites (`graph/render/__tests__/proseUnchanged.test.ts`, the `spine*Matrix` tests, `viewer3d/lib/__tests__/sceneGraph.snapshot.test.ts`). They must pass **without** `-u`.
- The only test file this plan edits is `__tests__/debrisField-eligibility.test.ts`, whose `fact` import moves from `'../lib/generator'` to `'../lib/generator/fact'` (Q9).
- `prose/__tests__/graphAwareReshape.test.ts` and `phase6On.test.ts` stay untouched under Option A.
- One new test is added: `G/narrative/__tests__/narrativeStage.test.ts` (Task 3).

## Errata to the 2026-11-21 handoff

- The handoff lists `factions/generateFactions.ts` and `factions/banks/*Bank.ts` as importing `fact` from `./index`. They import **types** from `factions/index.ts`, not from the generator `index.ts`, so there is no cycle there. The real `fact` importers at `712ffab` are `companionStar.ts`, `debrisFields.ts`, `volatileSystem.ts`, `prose/graphAwareReshape.ts` and `__tests__/debrisField-eligibility.test.ts`.
- `companionStar.ts` also imports `activityFromRoll` from `./index`. That cycle remains after this plan, because Q9 covers only `fact`. Report it to the user as a follow-up. Do not fix it here.

---

### Task 1: Move `fact` to a leaf module

**Files:**
- Create: `G/fact.ts`
- Modify: `G/index.ts`, `G/companionStar.ts`, `G/debrisFields.ts`, `G/volatileSystem.ts`, `G/prose/graphAwareReshape.ts`, `__tests__/debrisField-eligibility.test.ts`

- [ ] Run `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/__tests__/generator-golden.test.ts` and confirm it passes as the baseline.
- [ ] Create `G/fact.ts` with the function moved verbatim from G/index.ts:395:
  ```ts
  import type { Fact } from '../../types'

  export function fact<T>(value: T, confidence: Fact<T>['confidence'], source?: string): Fact<T> {
    return { value, confidence, source }
  }
  ```
- [ ] Delete `fact` from `G/index.ts` and add `import { fact } from './fact'`. Do not add `export { fact }`.
- [ ] Repoint the imports: `companionStar.ts` becomes `import { fact } from './fact'` plus `import { activityFromRoll } from './index'`; `debrisFields.ts` and `volatileSystem.ts` use `'./fact'`; `prose/graphAwareReshape.ts` uses `'../fact'`; `__tests__/debrisField-eligibility.test.ts` uses `'../lib/generator/fact'`.
- [ ] Check the move. `grep -rnE "import[^;]*\bfact\b[^;]*from '(\.\./)*(\./)?(index|\.\./lib/generator)'" src` must print nothing. `npx tsc --noEmit` must be clean.
- [ ] Run the golden guard, then `npm run test -- --run src/features/tools/star_system_generator`. Everything must pass with no snapshot writes.
- [ ] Run `npm run lint` and `npm run graph:update`.
- [ ] Commit `refactor(star_system_generator): move fact to a leaf module`.

### Task 2: Move the Narrative Fact builders out of `index.ts`

**Files:**
- Create: `G/narrative/narrativeFacts.ts`
- Modify: `G/index.ts`

- [ ] Move these verbatim from `G/index.ts` into `G/narrative/narrativeFacts.ts`: `NarrativeGenerationContext`, `narrativeDomainsForText`, `narrativeFact`, `radiationCreatesNarrativeHazard`, `buildNarrativeFacts` (G/index.ts:3782-4197), and `uniqueStrings` (399-401; its only callers are these functions). The `noAlienReplacements` table that follows at 4199 stays in `index.ts`. Make no textual edits to the regexes or literals; #1 depends on them staying byte-identical.
- [ ] Imports in the new file: `fact` from `'../fact'`; `generateFactions` from `'../factions'`; `domainsForGuValue` from `'../data/gu'`; `lowerFirst` and `sentenceFragment` from `'../prose/helpers'`; `SeededRng` from `'../rng'`; and the domain types from `'../../../types'` (`Reachability` and `GuOverlay` exist there as interfaces). Export only `buildNarrativeFacts` and `NarrativeGenerationContext`.
- [ ] In `G/index.ts`, import `buildNarrativeFacts` from `'./narrative/narrativeFacts'`. Drop imports that are now unused (`generateFactions`, `domainsForGuValue`, `lowerFirst`, `sentenceFragment`) only if `tsc`/eslint confirm they are unused.
- [ ] Run the golden guard and the feature tests, then `npx tsc --noEmit`, `npm run lint` and `npm run graph:update`.
- [ ] Commit `refactor(star_system_generator): move narrative fact builders into narrative module`.

### Task 3: Fork-label contract test for the stage (red)

**Files:**
- Create: `G/narrative/__tests__/narrativeStage.test.ts`

- [ ] Write a test that wraps `createSeededRng(seed)` in a recording `SeededRng`. The wrapper delegates every method and pushes each `fork(label)` argument to an array. Build a `NarrativeStageInput` from `generateSystem(options)` output, using `name`, `primary`, `companions`, `reachability`, `architecture`, `bodies`, `guOverlay`, `settlements`, `ruins` and `phenomena`. Call `runNarrativeStage(input, recordingRng)`. Assert:
  - the recorded root fork labels, sorted, equal `['conflicts', 'factions', 'graph', 'graph-prose', 'hooks', 'story']`, each exactly once;
  - `output.settlements.map(s => s.id)` equals `input.settlements.map(s => s.id)`, and the same holds for phenomena;
  - two calls with fresh `createSeededRng(seed)` produce `toEqual` outputs.
- [ ] Run it and confirm it fails because `runNarrativeStage` does not exist yet.

### Task 4: `runNarrativeStage` and wiring (green)

**Files:**
- Create: `G/narrative/index.ts`
- Modify: `G/index.ts`

- [ ] In `G/narrative/index.ts`, define `NarrativeStageInput`, `NarrativeStageOutput` and `runNarrativeStage(input, rootRng)` as in Option A. Move the body of `generateSystem` from the `buildNarrativeFacts` call through the `selectSystemHooks` call **verbatim**. The only allowed rewrites are `name` → `input.systemName`, `architectureResult.architecture` → `input.architecture`, `architectureResult.architecture.name.value` → `input.architecture.name.value`, and the other `input.*` renames. Keep every `rootRng.fork('<label>')` literal and keep `graphAwareReshape({ ..., rng: rootRng })`.
- [ ] Return `{ narrativeFacts, relationshipGraph, systemStory, hooks, settlements: reshaped.settlements, phenomena: reshaped.phenomena }`.
- [ ] In `generateSystem`, replace the moved block with one `runNarrativeStage({...}, rootRng)` call. Feed `narrative.settlements` to `attachSettlementsToDebrisFields` and `narrative.phenomena` to the returned `phenomena`. Leave debris attach, the Companion remap, `runNoAlienGuard` and `derivePopulationLayer` where they are (Q8). Remove imports from `index.ts` that are now unused (`buildRelationshipGraph`, `renderSystemStory`, `buildConflicts`, `graphAwareReshape`, `selectSystemHooks`, `buildNarrativeFacts`).
- [ ] Run the Task 3 test (it should now pass), then the golden guard, then `npm run test -- --run src/features/tools/star_system_generator` with no snapshot writes.
- [ ] Run `npx tsc --noEmit`, `npm run lint`, `npm run audit:star-system-generator:quick` and `npm run graph:update`.
- [ ] Commit `refactor(star_system_generator): carve the narrative stage out of generateSystem`.

### Task 5: Glossary

- [ ] Through the `domain-modeling` skill, add **Narrative Stage** under "Narrative graph" in `GLOSSARY.md`: "The generation step that turns the human layer into Narrative Facts, the Relationship Graph, Conflicts, the System Story and Stories at Port, and reshapes Settlement and System Phenomenon prose. It owns its RNG forks." Add `_Avoid_: narrative pass, story pipeline`.
- [ ] Commit `docs(star_system_generator): add Narrative Stage to glossary`.

### Task 6: Review and merge

- [ ] Run a reviewer agent (Q7) on `origin/develop..HEAD` against `CLAUDE.md` and this plan. The fork-label table and the "no re-export" rule are explicit checklist items.
- [ ] Fetch and rebase onto `origin/develop`. Re-run the golden guard and the feature suite. Push fast-forward only, and never force-push. If the push is rejected, fetch, rebase, re-test and retry.
- [ ] Report to the user: the commit hashes, the `index.ts` line count before and after, and the remaining `activityFromRoll` cycle.
