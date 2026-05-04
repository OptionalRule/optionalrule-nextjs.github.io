# Tone/GU Phase D: Distribution + Density Axes

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 7's review explicitly cited that body[0] reads identically across `distribution` (`frontier` / `realistic`) AND `settlements` (`sparse` / `normal` / `crowded` / `hub`) inputs. With Phase A's `BuildGraphOptions` channel in place, adding distribution + density is a few more weights in the same scoring + cluster-pulling tables — not a new architecture. Phase D claims that ground.

**Architecture:** Extend `BuildGraphOptions` to include `distribution` and `settlements`. Distribution-axis weights in `score.ts`'s `INPUT_WEIGHTS`-style table. Density-conditioned cluster pulling in `clusters.ts`. Matrix snapshot extension covers a representative diagonal (~16 cells) of the full 96-cell Cartesian product — full-matrix coverage deferred.

**Tech Stack:** TypeScript (strict, `isolatedModules: true`), Vitest, ESLint, existing audit scripts.

**Source spec:** [Master plan](./NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md) Phases table, row "Phase D".

**Branch:** Work on `develop`. Push to `origin/develop` after every successful task.

**Scope:**
- Task 1: Extend `BuildGraphOptions` with `distribution: GeneratorDistribution` and `settlements: SettlementDensity`. Thread through `buildRelationshipGraph` and the call site at `lib/generator/index.ts`.
- Task 2: Distribution-axis scoring weights in `score.ts`. `frontier` boosts edges with `visibility: 'contested'`; `realistic` boosts edges with `visibility: 'open'` (verify the actual EdgeVisibility values in `graph/types.ts`).
- Task 3: Density-conditioned cluster pulling in `clusters.ts`. `hub` (8+ settlements) pulls more CONTROLS / DEPENDS_ON into spineCluster; `sparse` (1-2 settlements) drops multi-faction edges and pulls HOSTS.
- Task 4: Matrix snapshot extension — 16 representative cells covering the diagonal of the 96-cell Cartesian product (3 tones × 4 gus × 2 distributions × 4 densities = 96; subset to ~16).
- Task 5: Audit checks `narrative.distributionAxisSensitivity` and `narrative.densityAxisSensitivity` + master overview update marking Phase D done.

**Out of scope:**
- Per-distribution template variants (Phase C's per-tone variants address voice; distribution variance is structural, not voice).
- Per-density template variants (same reason).
- Per-distribution faction registers (Phase B's per-tone factions cover the name-diversity layer).
- Full-Cartesian 96-cell matrix snapshot (cost-of-snapshot vs marginal value isn't worth it; 16 representative cells catch the regressions worth catching).

---

## Architectural Notes

### Why distribution/density bias in scoring + clustering, not in templates

Three options were considered:

1. **Per-distribution template variants** (mirror Phase C). Would require 12 edge types × 2 distributions × 4 densities × 4 variants = 384 strings. Authoring cost is the gating factor.

2. **Per-distribution scoring weights + per-density cluster pulling (CHOSEN).** Distribution shapes which edge VISIBILITY tier wins (`contested` vs `open` vs `hidden`). Density shapes which clusters get pulled into body[0]. Both are structural; both extend existing tables. Total authoring: ~10 weights, ~6 cluster-pull rules.

3. **Per-distribution faction registers** (mirror Phase B). Frontier could prefer scrappier names; realistic could prefer bureaucratic. Real signal but real cost — would re-author 3 banks for distribution × tone, 6 banks total. Possibly worth it as a future axis if surveys show distribution still reads same after Phase D's structural changes.

Option 2 wins on cost-of-authoring + cleanest extension of Phase A's `INPUT_WEIGHTS` model.

### Distribution axis: visibility-driven

`RelationshipEdge.visibility` (defined in `graph/types.ts:31`) is `'public' | 'contested' | 'hidden'`. Distribution axis maps to this:

- `frontier`: scrappy, transient, leaks-leverage flavor. Boost `visibility: 'contested'`. Soften `visibility: 'public'` (no settled order).
- `realistic`: stable-state, institutional, transparent flavor. Boost `visibility: 'public'` (settled compacts, public charters). Soften `visibility: 'contested'`.

Both pass through `visibility: 'hidden'` unchanged (hidden edges go to hooks, not body[0]).

This is a per-edge multiplier, applied alongside Phase A's `toneMultiplier` and Phase A's `guScoreAdjustment`. Total scoring computation:

```ts
const score = baseScore
  * toneMultiplier(edge.type, tone)
  * guScoreAdjustment(edge, gu)
  * distributionMultiplier(edge.visibility, distribution)
```

### Density axis: cluster-pulling-driven

`clusters.ts:13-44`'s `clusterEdges` decides which non-spine edges to pull into spineCluster. Today's logic: any structural edge (HOSTS, CONTROLS, DEPENDS_ON) touching a spine endpoint joins the spineCluster. Phase D conditions this on `settlements`:

- `sparse` (1–2 settlements): drop multi-faction edges (no rich political web). Pull HOSTS edges (isolation + place flavor). Spine cluster reads as "this place, alone."
- `normal` / `crowded`: baseline (current logic).
- `hub` (8+ settlements): pull more CONTROLS / DEPENDS_ON into spineCluster (trade-web flavor). Spine cluster reads as "this hub, with its many strands."

The cluster-pulling change is a few more lines in `clusterEdges`, not a new function. It reads `options.settlements` from the threaded `BuildGraphOptions`.

### Matrix snapshot scope

Full Cartesian: 3 tones × 4 gus × 2 distributions × 4 densities = 96 cells. Full snapshot is too noisy for human review (96 individually-named entries). Phase D ships 16 representative cells covering the diagonal:

- 6 cells: 3 tones × 2 distributions, all at `gu='normal'` `settlements='normal'` (baseline cross-tone-distribution variance)
- 4 cells: 4 gus × {frontier × normal} (gu axis variance at one fixed distribution)
- 4 cells: 4 densities × {astronomy × normal} (density axis variance at one fixed tone)
- 2 cells: extreme corners — `frontier × cinematic × fracture × hub`, `realistic × astronomy × low × sparse`

Total: 16 cells. Catches axis-level regressions without 96-cell noise. Full coverage deferred.

### Determinism

- No new RNG forks. `distributionMultiplier` and the density-conditioned cluster logic are pure functions.
- Same seed + same options produce same output across the entire phase.
- `tone='balanced'` AND `gu='normal'` AND `distribution='realistic'` AND `settlements='normal'` produce byte-identical output to pre-Phase-D for the existing snapshot — IF distribution and density multipliers are exactly 1.0 for that combination. Verify in Task 1.

### Snapshot contract

Phase B and C already softened the byte-identical-default contract. Phase D follows the same pattern: `proseUnchanged.test.ts` regenerates IF the default-input combination is no longer 1.0× across all axes after Phase D. Document the regeneration in Task 4 commit.

---

## File Structure

**Files modified:**
- `src/features/tools/star_system_generator/lib/generator/graph/types.ts` — Task 1 (extend `BuildGraphOptions` with `distribution` + `settlements`).
- `src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts` — Task 1 (pass new fields), Task 2 (distribution multiplier), Task 3 (density-aware cluster call).
- `src/features/tools/star_system_generator/lib/generator/index.ts` — Task 1 (call site passes `distribution` + `settlements`).
- `src/features/tools/star_system_generator/lib/generator/graph/score.ts` — Task 2 (`distributionMultiplier`).
- `src/features/tools/star_system_generator/lib/generator/graph/render/clusters.ts` — Task 3 (density-conditioned pulling).
- `src/features/tools/star_system_generator/lib/generator/graph/render/renderSystemStory.ts` — Task 3 (pass settlements through to clusterEdges).
- `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts` — Task 2 (distributionMultiplier tests).
- `src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/clusters.test.ts` — Task 3 (density-aware pulling tests).
- `scripts/audit-star-system-generator.ts` — Task 5 (axis-sensitivity audit checks).
- `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md` — Task 5 (mark Phase D done).

**Files added:**
- `src/features/tools/star_system_generator/lib/generator/graph/__tests__/spineFullAxisMatrix.test.ts` — Task 4 (16-cell snapshot).
- `src/features/tools/star_system_generator/lib/generator/graph/__tests__/__snapshots__/spineFullAxisMatrix.test.ts.snap` — generated by the above.

**Possibly modified:**
- `src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/__snapshots__/proseUnchanged.test.ts.snap` — IF Phase D's default-axis multipliers aren't exactly 1.0×.

**Files unchanged:**
- All edge rule files.
- All template families.
- Faction generation (Phase B).
- Per-tone era pools, connectives (Phase C).
- Historical edge attachment (`history.ts`).
- All graph-aware prose consumers.
- `phase6On.test.ts` snapshot (should stay stable).

---

## Conventions

- Run `npx tsc --noEmit` as part of every task's verification.
- Commit message style: lowercase `<type>: <subject>` with the standard `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer (HEREDOC for `git commit -m`).
- No comments in code unless WHY is non-obvious. The `distributionMultiplier` table and density-conditioned cluster rules warrant brief comments.
- Push to `origin/develop` after every successful task.
- NEVER use `any`. Use `unknown`, specific interfaces, or union types. Prefix unused params with `_`.
- The `phase6On.test.ts` snapshot must remain stable across all tasks. If it regenerates, STOP and diagnose.
- Per-task quality gate (every task runs all of these and confirms green):
  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```
  Plus `npm run audit:star-system-generator:deep` after Task 5.

---

## Task 1: Extend `BuildGraphOptions` with `distribution` + `settlements`

**Why:** Phase A built the threading channel. Phase D adds the two remaining axes to it. Pure plumbing in this task; Tasks 2 and 3 land the behavior.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/types.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts`

- [ ] **Step 1: Extend `BuildGraphOptions`**

  Edit `graph/types.ts`. Add:
  ```ts
  import type { GeneratorTone, GuPreference, GeneratorDistribution, SettlementDensity } from '../../../types'

  export interface BuildGraphOptions {
    tone: GeneratorTone
    gu: GuPreference
    distribution: GeneratorDistribution
    settlements: SettlementDensity
  }
  ```

  Both new fields required (not optional), matching the Phase A convention.

- [ ] **Step 2: Update the call site at `lib/generator/index.ts`**

  Find the existing `buildRelationshipGraph` call (line ~3143). Update the options arg:

  ```ts
  { tone: options.tone, gu: options.gu, distribution: options.distribution, settlements: options.settlements },
  ```

- [ ] **Step 3: Update test fixtures that build `BuildGraphOptions` by hand**

  ```bash
  grep -rn "tone:.*gu:" src/features/tools/star_system_generator/ --include="*.ts" | head
  ```

  For each fixture that constructs a `BuildGraphOptions` literal, add `distribution: 'realistic'` and `settlements: 'normal'` (the no-op defaults).

- [ ] **Step 4: Per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```

  All clean. Pure plumbing; no behavior change yet.

- [ ] **Step 5: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: extend BuildGraphOptions with distribution + settlements

  Pure plumbing: BuildGraphOptions now carries all 4 user input axes.
  Tasks 2 (distribution-axis scoring) and 3 (density-conditioned
  cluster pulling) land the behavior. proseUnchanged byte-identical
  in this commit.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 2: Distribution-axis scoring weights

**Why:** `distribution` controls whether the system reads scrappy/transient (`frontier`) or stable-state/institutional (`realistic`). The bias is in edge `visibility` — frontier prefers contested edges; realistic prefers public edges.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/score.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts`

- [ ] **Step 1: Verify `EdgeVisibility` values**

  ```bash
  grep -n "EdgeVisibility\|visibility" src/features/tools/star_system_generator/lib/generator/graph/types.ts
  ```

  Confirm: `'public' | 'contested' | 'hidden'`.

- [ ] **Step 2: Add `distributionMultiplier` to `score.ts`**

  ```ts
  import type { GeneratorDistribution } from '../../../types'
  import type { EdgeVisibility } from './types'

  // Per-distribution, per-visibility weights. frontier prefers contested
  // (scrappy, leak-leverage). realistic prefers public (settled compacts,
  // institutional charters). hidden passes through both (those edges
  // route to hooks, not body[0]).
  const DISTRIBUTION_VISIBILITY_WEIGHTS: Record<GeneratorDistribution, Record<EdgeVisibility, number>> = {
    realistic: {
      public: 1.2,
      contested: 0.8,
      hidden: 1.0,
    },
    frontier: {
      public: 0.8,
      contested: 1.3,
      hidden: 1.0,
    },
  }

  function distributionMultiplier(visibility: EdgeVisibility, distribution: GeneratorDistribution): number {
    return DISTRIBUTION_VISIBILITY_WEIGHTS[distribution][visibility]
  }
  ```

  Note: per the architectural note, the multiplier is per-visibility, not per-edge-type. This keeps the tuning surface small (6 numbers) while still meaningfully differentiating the two distributions.

- [ ] **Step 3: Apply `distributionMultiplier` in `scoreCandidates`**

  Update the signature:
  ```ts
  export function scoreCandidates(
    candidates: ReadonlyArray<RelationshipEdge>,
    tone: GeneratorTone,
    gu: GuPreference,
    distribution: GeneratorDistribution,
  ): ScoredCandidate[]
  ```

  Update the score computation:
  ```ts
  const score = baseScore
    * toneMultiplier(edge.type, tone)
    * guScoreAdjustment(edge, gu)
    * distributionMultiplier(edge.visibility, distribution)
  ```

- [ ] **Step 4: Update `buildRelationshipGraph` to pass `distribution`**

  ```ts
  const scored = scoreCandidates(candidates, options.tone, options.gu, options.distribution)
  ```

- [ ] **Step 5: Update existing `score.test.ts` calls**

  Append `, 'realistic'` to every call (the realistic baseline preserves expected behavior most closely — multipliers are 1.2 / 0.8 / 1.0, not 1.0 / 1.0 / 1.0, so test fixtures may need score-value adjustments).

  Note: `realistic` is NOT a no-op multiplier set. Test cases that pin specific score values will need updating. This is acceptable because `realistic` was the implicit default before Phase D — we're now explicitly biasing toward public edges in realistic mode, which is the intended behavior.

  If preserving the existing test contract matters, an alternative is: introduce a `'neutral'` distribution for tests only, with all multipliers = 1.0. But this complicates the public API for limited test-only benefit. Recommended: update test fixtures to assert the new realistic-tier scores explicitly.

- [ ] **Step 6: Add `distributionMultiplier` unit tests**

  ```ts
  describe('distributionMultiplier', () => {
    it('frontier boosts contested edges over public', () => {
      const contestedEdge = makeEdge({ type: 'CONTESTS', visibility: 'contested', weight: 1.0 })
      const publicEdge = makeEdge({ type: 'CONTROLS', visibility: 'public', weight: 1.0 })
      const frontier = scoreCandidates([contestedEdge, publicEdge], 'balanced', 'normal', 'frontier')
      expect(frontier[0].edge.id).toBe(contestedEdge.id)
    })

    it('realistic boosts public edges over contested', () => {
      const contestedEdge = makeEdge({ type: 'CONTESTS', visibility: 'contested', weight: 1.0 })
      const publicEdge = makeEdge({ type: 'CONTROLS', visibility: 'public', weight: 1.0 })
      const realistic = scoreCandidates([contestedEdge, publicEdge], 'balanced', 'normal', 'realistic')
      expect(realistic[0].edge.id).toBe(publicEdge.id)
    })

    it('hidden visibility passes through both distributions', () => {
      const hiddenEdge = makeEdge({ type: 'HIDES_FROM', visibility: 'hidden', weight: 1.0 })
      const realistic = scoreCandidates([hiddenEdge], 'balanced', 'normal', 'realistic')
      const frontier = scoreCandidates([hiddenEdge], 'balanced', 'normal', 'frontier')
      expect(realistic[0].score).toBeCloseTo(frontier[0].score, 5)
    })
  })
  ```

- [ ] **Step 7: Per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```

  Expected: most tests pass. `proseUnchanged.test.ts` may regenerate for default seeds (because realistic now applies a 1.2 / 0.8 / 1.0 multiplier set, no longer the implicit 1.0 / 1.0 / 1.0 baseline). If it regenerates: inspect the diff (similar shape to Phase B / Phase C softenings — different edges win, different prose). Decide: bundle into Task 4's snapshot regeneration, or land as deliberate softening in this task. Recommended: bundle into Task 4 to keep this task's focus on scoring.

- [ ] **Step 8: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: distribution-axis scoring weights (frontier/realistic)

  Per-distribution, per-visibility multipliers in score.ts. frontier
  prefers contested edges (scrappy, leak-leverage register).
  realistic prefers public edges (settled compacts, institutional
  charters). hidden passes through (routes to hooks, not body[0]).

  scoreCandidates() now takes a GeneratorDistribution parameter
  threaded from BuildGraphOptions.distribution. Tuning surface is
  bounded: 6 numbers (2 distributions × 3 visibility tiers).

  proseUnchanged regeneration deferred to Task 4 (will bundle with
  density-axis cluster pulling regeneration for one combined
  snapshot diff rather than two).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 3: Density-conditioned cluster pulling in `clusters.ts`

**Why:** `clusters.ts:13-44`'s `clusterEdges` decides which non-spine edges join spineCluster. Today it pulls any structural edge (HOSTS / CONTROLS / DEPENDS_ON) touching a spine endpoint. Phase D conditions this on `settlements`: hubs pull more (trade-web flavor); sparse drops multi-faction (isolation flavor).

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/clusters.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/renderSystemStory.ts` (pass settlements through)
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/clusters.test.ts`

- [ ] **Step 1: Read the current `clusterEdges` implementation**

  Already read in scope review (`clusters.ts:13-44`). Confirm the structure: spine-touching structural edges are pulled into spineCluster; ACTIVE / EPISTEMIC types route to their own clusters.

- [ ] **Step 2: Extend `clusterEdges` with density awareness**

  ```ts
  import type { SettlementDensity } from '../../../../types'

  export interface ClusterEdgesOptions {
    settlements: SettlementDensity
  }

  export function clusterEdges(
    graph: SystemRelationshipGraph,
    options: ClusterEdgesOptions,
  ): EdgeClusters {
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
      // Density-conditioned cluster pulling
      if (STRUCTURAL_TYPES.has(edge.type)) {
        if (spinedEntityIds.has(edge.subject.id) || spinedEntityIds.has(edge.object.id)) {
          if (options.settlements === 'sparse' && isMultiFactionEdge(edge)) {
            // sparse: skip multi-faction edges (no political web at this scale)
            continue
          }
          spineCluster.push(edge)
          continue
        }
        // hub: pull additional CONTROLS / DEPENDS_ON even if not spine-touching
        if (options.settlements === 'hub'
            && (edge.type === 'CONTROLS' || edge.type === 'DEPENDS_ON')) {
          spineCluster.push(edge)
          continue
        }
      }
      if (ACTIVE_TYPES.has(edge.type)) {
        activeCluster.push(edge)
        continue
      }
      if (EPISTEMIC_TYPES.has(edge.type) && edge.visibility !== 'hidden') {
        epistemicCluster.push(edge)
      }
    }

    return { spineCluster, activeCluster, epistemicCluster }
  }

  function isMultiFactionEdge(edge: RelationshipEdge): boolean {
    return edge.subject.kind === 'namedFaction' && edge.object.kind === 'namedFaction'
  }
  ```

- [ ] **Step 3: Update `renderSystemStory` to pass settlements to clusterEdges**

  Find the `clusterEdges(graph)` call. Update to:
  ```ts
  const clusters = clusterEdges(graph, { settlements: options.settlements })
  ```

- [ ] **Step 4: Update existing `clusters.test.ts` calls**

  Append `, { settlements: 'normal' }` to every existing call. Spot-check that `'normal'` produces identical cluster output (because `'normal'` doesn't trigger either the sparse-drop or hub-pull condition — current behavior preserved).

- [ ] **Step 5: Add density-aware tests**

  ```ts
  describe('clusterEdges density conditioning', () => {
    it('sparse drops multi-faction structural edges from spineCluster', () => {
      const multiFactionEdge = makeEdge({
        type: 'CONTROLS',
        subject: makeRef({ kind: 'namedFaction' }),
        object: makeRef({ kind: 'namedFaction' }),
      })
      const graph = makeGraph({ edges: [multiFactionEdge], spineEdgeIds: ['spine'] })
      const sparse = clusterEdges(graph, { settlements: 'sparse' })
      const normal = clusterEdges(graph, { settlements: 'normal' })
      expect(sparse.spineCluster).not.toContainEqual(multiFactionEdge)
      expect(normal.spineCluster).toContainEqual(multiFactionEdge)
    })

    it('hub pulls non-spine-touching CONTROLS into spineCluster', () => {
      const orphanCtrl = makeEdge({
        type: 'CONTROLS',
        subject: makeRef({ id: 'orphan-1' }),
        object: makeRef({ id: 'orphan-2' }),
      })
      const graph = makeGraph({ edges: [orphanCtrl], spineEdgeIds: ['spine'] })
      const hub = clusterEdges(graph, { settlements: 'hub' })
      const normal = clusterEdges(graph, { settlements: 'normal' })
      expect(hub.spineCluster).toContainEqual(orphanCtrl)
      expect(normal.spineCluster).not.toContainEqual(orphanCtrl)
    })
  })
  ```

- [ ] **Step 6: Per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```

  All green. proseUnchanged regeneration deferred to Task 4.

- [ ] **Step 7: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: density-conditioned cluster pulling

  clusterEdges now conditions on settlements density:
  - sparse: drops multi-faction structural edges from spineCluster
    (no rich political web at small scale; isolation flavor)
  - hub: pulls non-spine-touching CONTROLS / DEPENDS_ON into
    spineCluster (trade-web flavor at large scale)
  - normal / crowded: baseline behavior preserved

  proseUnchanged regeneration bundled with Task 4's snapshot edits.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 4: 16-cell axis matrix snapshot + proseUnchanged regeneration

**Why:** Tasks 2 and 3 ship the per-axis behavior. Task 4 pins the cross-axis behavior at fixture-seed level via a 16-cell snapshot — a representative diagonal of the 96-cell Cartesian product. Also lands the proseUnchanged regeneration deferred from Tasks 2 and 3.

**Files:**
- Add: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/spineFullAxisMatrix.test.ts`
- Add: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/__snapshots__/spineFullAxisMatrix.test.ts.snap`
- Modify (regenerate): `src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/__snapshots__/proseUnchanged.test.ts.snap`

- [ ] **Step 1: Build the 16-cell snapshot test**

  Create `spineFullAxisMatrix.test.ts`. The cell selection is per the Architectural Notes' "Matrix snapshot scope" diagonal:

  ```ts
  import { describe, it, expect } from 'vitest'
  import { generateSystem } from '../../index'

  type AxisCell = {
    name: string
    distribution: 'frontier' | 'realistic'
    tone: 'balanced' | 'astronomy' | 'cinematic'
    gu: 'low' | 'normal' | 'high' | 'fracture'
    settlements: 'sparse' | 'normal' | 'crowded' | 'hub'
  }

  const CELLS: readonly AxisCell[] = [
    // 6 cells: 3 tones × 2 distributions, baseline gu/settlements
    { name: 'baseline-frontier-balanced',  distribution: 'frontier',  tone: 'balanced',  gu: 'normal', settlements: 'normal' },
    { name: 'baseline-frontier-cinematic', distribution: 'frontier',  tone: 'cinematic', gu: 'normal', settlements: 'normal' },
    { name: 'baseline-frontier-astronomy', distribution: 'frontier',  tone: 'astronomy', gu: 'normal', settlements: 'normal' },
    { name: 'baseline-realistic-balanced',  distribution: 'realistic', tone: 'balanced',  gu: 'normal', settlements: 'normal' },
    { name: 'baseline-realistic-cinematic', distribution: 'realistic', tone: 'cinematic', gu: 'normal', settlements: 'normal' },
    { name: 'baseline-realistic-astronomy', distribution: 'realistic', tone: 'astronomy', gu: 'normal', settlements: 'normal' },
    // 4 cells: gu axis variance at frontier × balanced × normal-settlements
    { name: 'gu-axis-low',     distribution: 'frontier', tone: 'balanced', gu: 'low',      settlements: 'normal' },
    { name: 'gu-axis-normal',  distribution: 'frontier', tone: 'balanced', gu: 'normal',   settlements: 'normal' },
    { name: 'gu-axis-high',    distribution: 'frontier', tone: 'balanced', gu: 'high',     settlements: 'normal' },
    { name: 'gu-axis-fracture', distribution: 'frontier', tone: 'balanced', gu: 'fracture', settlements: 'normal' },
    // 4 cells: density axis variance at realistic × astronomy × normal-gu
    { name: 'density-sparse',   distribution: 'realistic', tone: 'astronomy', gu: 'normal', settlements: 'sparse' },
    { name: 'density-normal',   distribution: 'realistic', tone: 'astronomy', gu: 'normal', settlements: 'normal' },
    { name: 'density-crowded',  distribution: 'realistic', tone: 'astronomy', gu: 'normal', settlements: 'crowded' },
    { name: 'density-hub',      distribution: 'realistic', tone: 'astronomy', gu: 'normal', settlements: 'hub' },
    // 2 extreme corners
    { name: 'corner-frontier-cinematic-fracture-hub',     distribution: 'frontier',  tone: 'cinematic', gu: 'fracture', settlements: 'hub' },
    { name: 'corner-realistic-astronomy-low-sparse',      distribution: 'realistic', tone: 'astronomy', gu: 'low',      settlements: 'sparse' },
  ]

  describe('spine full axis matrix (16 representative cells)', () => {
    const flags = { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true }

    for (const cell of CELLS) {
      it(`${cell.name}: stable spine + body[0] structural fields`, () => {
        const sys = generateSystem({
          seed: `axis-matrix-${cell.name}`,
          distribution: cell.distribution,
          tone: cell.tone,
          gu: cell.gu,
          settlements: cell.settlements,
          graphAware: flags,
        })
        const top = sys.relationshipGraph.edges.find(
          e => e.id === sys.relationshipGraph.spineEdgeIds[0],
        )
        expect({
          spineEdgeType: top?.type ?? null,
          spineSubjectKind: top?.subject.kind ?? null,
          spineObjectKind: top?.object.kind ?? null,
          spineVisibility: top?.visibility ?? null,
          spineSummary: sys.systemStory.spineSummary,
          body0: sys.systemStory.body[0] ?? null,
        }).toMatchSnapshot()
      })
    }
  })
  ```

  16 individually-named snapshot entries. The structural fields plus prose strings (now safe to pin because Phase C ships per-tone voice).

- [ ] **Step 2: Generate the matrix snapshot**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/spineFullAxisMatrix.test.ts -u
  ```

  Inspect by hand. Confirm:
  - The 6 baseline cells show 3-tone variance × 2-distribution variance (visible on `spineEdgeType` and `body0` voice).
  - The 4 gu-axis cells show `fracture` producing a phenomenon-anchored spine (per Phase A).
  - The 4 density-axis cells show `sparse` and `hub` differentiating structurally (sparse dropping multi-faction; hub pulling more CONTROLS into spineCluster).
  - The 2 corner cells produce coherent output (no broken slot resolution; faction names slot correctly).

- [ ] **Step 3: Regenerate proseUnchanged.test.ts (deferred from Tasks 2 and 3)**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

  - If passes: skip the regeneration step. Tasks 2 and 3's tuning landed at exactly 1.0× for default-axis combination (lucky).
  - If fails: inspect diff manually, then regenerate:
    ```bash
    npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts -u
    ```
    Confirm the diff is structural (different edges win) and not broken (no missing slot resolution).

- [ ] **Step 4: phase6On.test.ts spot-check**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  ```

  Expected: stable. If it regenerates, the cluster-pulling change cascaded into the graph-aware prose consumers — STOP and diagnose before continuing.

- [ ] **Step 5: Per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```

  All green.

- [ ] **Step 6: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  test: 16-cell axis matrix snapshot + proseUnchanged regeneration

  spineFullAxisMatrix.test.ts pins (spineEdgeType, spineSubjectKind,
  spineObjectKind, spineVisibility, spineSummary, body[0]) for 16
  representative cells covering the diagonal of the 96-cell
  3 × 4 × 2 × 4 Cartesian product. Cell selection: 6 baseline (tones
  × distributions), 4 gu-axis variance, 4 density-axis variance,
  2 extreme corners.

  proseUnchanged.test.ts regenerated for default-axis seeds: Task 2
  (distribution-axis weights) and Task 3 (density-conditioned cluster
  pulling) shifted which edges win at the realistic + normal-density
  combination. The 4 substantive prose surfaces drift accordingly.

  This is the FOURTH deliberate softening of the byte-identical-
  default contract (after Phase 8 Task 1, Phase B Task 6, Phase C
  Task 6). Diff inspected: drift is structural (different edges win),
  no broken slot resolution. phase6On.test.ts snapshot stable.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 5: Axis-sensitivity audit checks + master overview update

**Why:** Codify the per-axis behavior at corpus scale. Two new audit checks: distribution-axis sensitivity and density-axis sensitivity. Plus mark Phase D done in the master overview.

**Files:**
- Modify: `scripts/audit-star-system-generator.ts`
- Modify: `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md`

- [ ] **Step 1: Add `narrative.distributionAxisSensitivity`**

  ```ts
  // narrative.distributionAxisSensitivity: across N seeds at frontier vs
  // realistic, body[0] prose should differ in ≥40% of paired cases. If
  // identical, the distribution-axis multipliers have regressed.
  const seeds = Array.from({ length: 100 }, (_, i) => `dist-axis-audit-${i}`)
  let differing = 0
  for (const seed of seeds) {
    const baseOptions = { tone: 'balanced' as const, gu: 'normal' as const, settlements: 'normal' as const, graphAware: { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true } }
    const frontier = generateSystem({ seed, distribution: 'frontier', ...baseOptions })
    const realistic = generateSystem({ seed, distribution: 'realistic', ...baseOptions })
    if (frontier.systemStory.body[0] !== realistic.systemStory.body[0]) differing++
  }
  if (differing / seeds.length < 0.4) {
    addFinding(findings, 'warning', 'corpus', 'narrative.distributionAxisSensitivity',
      `Distribution axis differentiation: ${differing}/${seeds.length} seeds (${Math.round(100 * differing / seeds.length)}%, expected ≥40%). Phase D distribution-axis multipliers may have regressed.`)
  }
  ```

- [ ] **Step 2: Add `narrative.densityAxisSensitivity`**

  Same shape, comparing `settlements: 'sparse'` vs `settlements: 'hub'`. Threshold ≥40%.

- [ ] **Step 3: Run deep audit**

  ```bash
  npm run audit:star-system-generator:deep
  ```

  Expected: 0 findings of either new check. If either warns, the per-axis tuning is too soft. Adjust the multipliers / cluster-pull rules.

- [ ] **Step 4: Update master overview's Phases table**

  Mark Phase D done (the LAST phase in the sequence).

  Also: update the master overview's introductory text. The "Status:" line at the top of the master overview can change from "rewritten as a 4-phase sequence" to "fully shipped as a 4-phase sequence."

- [ ] **Step 5: Per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  npm run audit:star-system-generator:deep
  ```

  All green.

- [ ] **Step 6: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: axis-sensitivity audit checks + mark Phase D done

  narrative.distributionAxisSensitivity: across 100 paired seeds at
  frontier vs realistic, body[0] should differ in ≥40% of pairs.
  narrative.densityAxisSensitivity: same shape for sparse vs hub.
  Both 0-findings post-Phase-D.

  Master overview's Phases table marks Phase D done. The full 4-phase
  sequence (A: plumbing + structural gate, B: per-tone factions,
  C: per-tone voice, D: distribution + density) is shipped.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Spec coverage check (self-review)

| Spec requirement (from master overview) | Task |
|---|---|
| Extend `BuildGraphOptions` with `distribution` + `settlements` | Task 1 |
| Distribution-axis weights in `INPUT_WEIGHTS` table | Task 2 |
| Density-conditioned cluster pulling in `clusters.ts` | Task 3 |
| `frontier` boosts contested visibility, `realistic` boosts public | Task 2 |
| `hub` pulls more CONTROLS / DEPENDS_ON; `sparse` drops multi-faction | Task 3 |
| 16-cell representative diagonal snapshot | Task 4 |
| Audit: distribution-axis sensitivity ≥40% paired-seed differentiation | Task 5 |
| Master-overview Phase D row marked done | Task 5 |

**Estimated commits:** 5 (one per task).

**Estimated effort:** ~3–4 days. Task 4 is the largest (16-cell snapshot + manual inspection + proseUnchanged regeneration).

---

## Risks & deferred items

- **`distribution='realistic'` is no longer a no-op multiplier set.** Pre-Phase-D, the implicit default treated all visibility tiers equally. Post-Phase-D, realistic biases public 1.2× and softens contested 0.8×. This is the intended behavior (realistic systems should read more institutional). The proseUnchanged regeneration in Task 4 is the consequence.
- **`crowded` vs `normal` indistinguishable.** Phase D's density rules treat `sparse` and `hub` as the two strong end-states. `crowded` and `normal` differ subtly in real-world generation — the cluster-pulling rules don't differentiate them explicitly. If post-Phase-D surveys show `crowded` and `normal` reading identically, document as a known limitation rather than over-engineer.
- **Multi-axis interaction effects.** The 16-cell snapshot covers main-effect axes plus 2 corners. Genuine multi-axis interaction effects (e.g., does `frontier × cinematic × hub` read differently than `realistic × cinematic × hub`?) are NOT exhaustively pinned. If a future regression manifests as an interaction effect missed by the 16 cells, the snapshot extension cost is small (add cells). Don't try to pre-pin every interaction.
- **`hub` cluster-pulling can over-stuff body[0].** If a hub system has many CONTROLS / DEPENDS_ON edges, all getting pulled into spineCluster could make body[0] overlong. The existing per-paragraph sentence cap in `renderSystemStory` should bound this, but verify in Task 4 inspection — if body[0] for hub systems is noticeably longer than other densities, tighten the hub-pull rule (e.g., cap at 2 additional pulls).
- **Visibility distribution may be skewed.** If the rule corpus produces edges that are 80% public and 5% contested, frontier's 1.3× boost on contested doesn't have enough candidates to bias toward. Audit: if the distribution check (`narrative.distributionAxisSensitivity`) fires, run a candidate-pool survey to check the visibility distribution. If skewed, either retune the rules to produce more contested edges, or accept the limited differentiation.
- **Snapshot fragility.** Task 4's snapshot pins prose strings (newly safe to do post-Phase-C). Future template tweaks regenerate it. Maintain the discipline established by Phases B/C: human-reviewed snapshot diffs, never blind `vitest -u`.

---

## Outputs the full sequence relies on

After Phase D (and thus the full A→B→C→D sequence):
- `BuildGraphOptions` carries all 4 user input axes. Future axes (e.g., a hypothetical `era` or `setting-flavor` axis) extend the same interface.
- The graph pipeline is fully input-aware: scoring biases per tone × gu × distribution; eligibility predicate widens per gu; cluster pulling conditions per density.
- The full 4-axis matrix snapshot (16 representative cells) is the regression contract for the entire input space.
- Three audit checks codify per-axis variance: `narrative.spineToneSensitivity` (Phase A), `narrative.body0VoiceDiversity` (Phase C), `narrative.distributionAxisSensitivity` + `narrative.densityAxisSensitivity` (Phase D).
- The Phase 7 review's bar — "20-sample review reads as 20 distinct systems whose differences trace back to the input axes" — is achieved.
- The 4 user-facing input controls (tone, gu, distribution, settlements) are all earned at the output layer.
