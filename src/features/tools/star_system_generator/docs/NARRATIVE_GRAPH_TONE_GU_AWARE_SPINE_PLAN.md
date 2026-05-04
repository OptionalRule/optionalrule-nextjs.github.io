# Narrative Graph: Tone-Aware / GU-Aware Spine Selection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the spine selector responsive to the user's `tone` (`balanced` / `astronomy` / `cinematic`) and `gu` (`low` / `normal` / `high` / `fracture`) inputs so that `systemStory.spineSummary` and `systemStory.body[0]` actually vary along those axes. Phase 7's 20-sample manual review found that body[0] reads identically across distribution × tone × gu in 15+/20 systems — the same six-faction politics scaffold reshuffles regardless of input. Phase 8 deferred this work because Phase 8 was a deprecation phase, not a feature phase.

**Architecture:** Surgical extension of the existing graph pipeline. No new edge types, no new template families, no new pipeline stages. Two thin layers of input-conditioned bias added at the spine selection boundary in `score.ts`: (1) a tone-conditioned edge-type weight multiplier applied during scoring; (2) a GU-conditioned eligibility predicate applied during spine selection. Both layers are additive — `tone='balanced'` and `gu='normal'` produce byte-identical output to the current pipeline, so the existing `proseUnchanged.test.ts` snapshot stays green for the default-input baseline corpus.

**Tech Stack:** TypeScript (strict, `isolatedModules: true`), Vitest, ESLint, existing audit scripts.

**Source spec:** `PHASE_7_SAMPLE_REVIEW.md` aggregated findings table — the spine/body[0] sameness pattern documented in 15+/20 sampled systems. `NARRATIVE_GRAPH_PHASE_8_PLAN.md` Risks section line 885: "Phase 8 candidates from PHASE_7_SAMPLE_REVIEW.md that are NOT in scope ... tone-aware spine, gu-aware spine ... each is a substantive new feature, not a deprecation. They are NOT Phase 8 work. Capture them as future-tuning candidates."

**Branch:** Work on a dedicated feature branch (`feat/tone-gu-aware-spine` or similar). Phases 0–8 are merged on develop. Push to the feature branch after every successful task; merge to develop via PR after Task 6 verification.

---

## Survey: Confirming the Phase 7 Finding (post-Phase-8)

Run before starting Task 1, then again after Task 4 to verify the fix:

```bash
node --import tsx/esm -e "
import('./src/features/tools/star_system_generator/lib/generator/index.ts').then(m => {
  const tones = ['balanced', 'astronomy', 'cinematic']
  const gus = ['low', 'normal', 'high', 'fracture']
  const flags = { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true }
  for (const tone of tones) {
    for (const gu of gus) {
      const sys = m.generateSystem({ seed: 'spine-tone-gu-survey-' + tone + '-' + gu, distribution: 'frontier', tone, gu, settlements: 'normal', graphAware: flags })
      console.log('tone=' + tone + ' gu=' + gu + ' SPINE:', sys.systemStory.spineSummary)
      console.log('tone=' + tone + ' gu=' + gu + ' BODY[0]:', sys.systemStory.body[0] || '(empty)')
      console.log('---')
    }
  }
})
"
```

Pre-implementation baseline (run during plan authoring, post-Phase-8 develop):
- All 12 (3 tones × 4 gus) `spineSummary` outputs use the **CONTESTS** edge family. None use HOSTS, DEPENDS_ON, or DESTABILIZES.
- All 12 `body[0]` paragraphs are six-faction politics scaffolds (Kestrel / Glasshouse / Orison / Ninth Ledger / Ash Meridian / Veyra-Locke / Red Vane / Pale Choir). The factions reshuffle; no physical-anomaly anchors, no GU-fracture framing, no scale-shift for `astronomy` vs `cinematic`.
- Despite varied inputs, the spine + body[0] read like the same story with names rotated. This is the user-visible quality gap.

Post-implementation acceptance: the same survey produces meaningfully different `spineSummary` + `body[0]` shapes across at least 9/12 cells, and `astronomy` tone produces at least 1 physical-anomaly-anchored spine across the 4 GU values.

---

## Architectural Notes

### Where `tone` and `gu` flow today

Confirmed via survey of `lib/generator/index.ts`:
- `options.gu` is read at line 410 (stellar activity modifier), line 477 (reachability modifier), line 3126 (`generateGuOverlay`).
- `options.tone` is read at line 579-580 (architecture roll modifier).
- **Neither input flows into the graph pipeline.** `lib/generator/graph/` (rules, score, render, templates) does not import or read `tone` or `gu`. This is the structural cause of the sameness pattern: the graph deterministically shapes itself from the post-stellar / post-architecture / post-settlement state, but the three inputs that change the most about user intent (distribution × tone × gu) only affect physical and GU-overlay state — they never reach the narrative scoring.

### Why two layers (tone + gu) instead of one

Tone and GU control different intents:
- **Tone** is a stylistic preference (`astronomy` = "I want the physics to lead", `cinematic` = "I want overt conflict to lead", `balanced` = current default).
- **GU intensity** is a worldbuilding preference (`low` = "the bleed is a curiosity", `fracture` = "the bleed is unmaking the system").

Conflating them into a single knob produces the wrong cross-product. A `cinematic`/`low` system should have human-vs-human spine drama with no GU spillover. An `astronomy`/`fracture` system should have phenomenon-on-phenomenon spine reads with the bleed as protagonist. The two-layer design lets each axis independently bias the spine.

### Why bias at scoring + eligibility, not at template selection

Three brainstormed designs (see "Design options considered" below) — biasing at the score, biasing at the eligibility filter, and biasing at the template-family selection. The recommended design biases at scoring (tone) and eligibility (GU) because:

1. **Scoring is the natural injection point.** `score.ts:36-46` already composes `weight + novelty + crossLayer + namedEntity` into a single score. Adding a tone-conditioned 5th term keeps the scoring contract intact and lets selection re-rank without any other pipeline stage knowing about tone.
2. **Eligibility is the right place for GU.** `selectEdges` already has `SPINE_ELIGIBLE_TYPES` and the `isNamedEntity(subject) && isNamedEntity(object)` predicate. GU intensity wants to *expand* or *contract* that pool — at low GU, fewer phenomenon-anchored edges qualify; at fracture, more do. This is an eligibility question, not a scoring question.
3. **Template families stay edge-type-pure.** The existing 12 template families each represent ONE edge type's narrative voice. Splitting families into tone variants triples authoring effort and creates a maintenance trap (e.g., a future template fix has to be made 3 times). Better: bias which edges become spine, then let the existing single template render that edge in its single voice.

### Determinism

No new RNG forks. Both new layers are pure functions of `(scored candidates, tone)` and `(scored candidates, gu)`. The score adjustment is a multiplicative weight applied per candidate; the eligibility predicate is a set-membership check. Same seed + same options produce same output.

For `tone='balanced'` AND `gu='normal'`, the multiplier is 1.0 and the eligibility predicate is unchanged from today. This means the existing `proseUnchanged.test.ts` snapshot — which uses `tone: 'balanced'` and `gu: 'normal'` for all seeds (verify before starting Task 1) — stays byte-identical. This preserves the Phase 3 contract for the default-input baseline.

For non-default tone/gu, the snapshot WILL drift if seeds with non-default options are added — a deliberate widening of the contract. Task 5 documents this and adds a complementary snapshot test (`spineToneGuMatrix.test.ts`) that pins the tone/gu × spine selection behavior across a small fixture matrix.

### proseUnchanged.test.ts contract

Verify before starting (read the test file): all snapshot seeds use `tone: 'balanced'` and `gu: 'normal'`. If true, the contract is preserved by definition because the new layers are no-ops for those inputs. If any seed in the snapshot uses a non-default tone or gu, the snapshot for that seed WILL drift — capture which seeds in Task 1 Step 2, then in Task 5 Step 4 either:
- Move those seeds to the new `spineToneGuMatrix.test.ts` snapshot (preferred), OR
- Regenerate them as the deliberate one-time drift Phase 8 set the precedent for.

### phase6On.test.ts

Records `phenomenonNotes`, `settlementTagHooks`, `settlementWhyHere`. None of these read `spineSummary` or `body[0]` directly, so the changes here should not regenerate this snapshot. If it regenerates, an unintended interaction has occurred — STOP and diagnose. The most likely cause would be the GU-eligibility expansion changing which edges become spine, which then changes `graph.spineEdgeIds`, which then changes the graph-aware downstream consumers' choice of which non-spine edges to highlight. If this turns out to be the case, the GU-eligibility change is wider than expected — narrow it.

### Why one feature branch instead of develop-direct

The change is multi-task with intermediate states (e.g., Task 1 introduces the score parameter but doesn't yet apply it; Task 3 wires GU before tone and would temporarily produce drift in only one axis). Landing on a feature branch lets the implementer ship the full feature as a single PR after Task 6's verification, instead of leaving partial-feature commits on develop.

---

## File Structure

**Files modified:**
- `src/features/tools/star_system_generator/lib/generator/graph/score.ts` — add tone-conditioned scoring multiplier (Task 1) and GU-conditioned eligibility predicate (Task 3).
- `src/features/tools/star_system_generator/lib/generator/graph/index.ts` — thread `tone` and `gu` through `buildRelationshipGraph` to the score/select call sites (Task 2). (Verify file path; the `buildRelationshipGraph` entry point may live at `lib/generator/graph/buildRelationshipGraph.ts` or in `graph/index.ts` — read first.)
- `src/features/tools/star_system_generator/lib/generator/graph/types.ts` — extend the build-graph input type to include `tone` and `gu` (Task 2).
- `src/features/tools/star_system_generator/lib/generator/index.ts` — pass `options.tone` and `options.gu` into `buildRelationshipGraph` (Task 2).
- `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts` — add tests for `applyToneWeight` and `isSpineEligibleForGu` (Tasks 1 and 3).
- `src/features/tools/star_system_generator/lib/generator/graph/__tests__/integration.test.ts` — add integration tests asserting end-to-end tone/gu-driven spine variation (Task 4).
- `scripts/audit-star-system-generator.ts` — add `narrative.spineToneSensitivity` audit check (Task 5).
- `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_PLAN.md` — mark this work complete in the future-work section (Task 6).

**Files added:**
- `src/features/tools/star_system_generator/lib/generator/graph/__tests__/spineToneGuMatrix.test.ts` — new snapshot test pinning the tone × gu × spine matrix (Task 5).
- `src/features/tools/star_system_generator/lib/generator/graph/__tests__/__snapshots__/spineToneGuMatrix.test.ts.snap` — generated by the above (Task 5).

**Files unchanged:**
- All edge rule files (`graph/rules/*.ts`).
- All template families (`graph/render/templates/*.ts`).
- Renderer (`renderSystemStory.ts`, `slotResolver.ts`, `grammarSafety.ts`, `clusters.ts`, `connectives.ts`).
- Historical edge attachment (`history.ts`).
- All graph-aware prose consumers (`graphAwareSettlementHook`, `graphAwareSettlementWhyHere`, `graphAwarePhenomenonNote`).
- `proseUnchanged.test.ts` and its snapshot (preserved by the no-op-for-defaults guarantee).
- `phase6On.test.ts` and its snapshot.

---

## Conventions (from Phases 0–8, applied here)

- Run `npx tsc --noEmit` as part of every task's verification — ESLint does not catch TS module-resolution errors.
- Commit message style: lowercase `<type>: <subject>` (e.g., `feat:`, `refactor:`, `test:`, `docs:`), with the standard `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer (use a HEREDOC for `git commit -m`).
- No comments in code unless the WHY is non-obvious. The new tone-multiplier and GU-eligibility constants warrant brief comments explaining the design intent because they encode product judgments (not pure mechanics).
- Push to the feature branch after every successful task. Open the PR to develop after Task 6.
- NEVER use `any`. Use `unknown`, specific interfaces, or union types.
- The `proseUnchanged.test.ts` contract must remain byte-identical for `tone: 'balanced'` + `gu: 'normal'` seeds. If it drifts, the no-op-for-defaults guarantee has been broken — STOP and diagnose.
- The `phase6On.test.ts` snapshot must remain stable across all tasks. If it regenerates, STOP and diagnose (see "phase6On.test.ts" above for the most likely cause).
- New snapshot file `spineToneGuMatrix.test.ts.snap` is the new contract for this feature; any future change to the tone/gu weights should regenerate it intentionally and the diff should be reviewed by a human before commit.
- Per-task quality gate (every task runs all of these and confirms green):
  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  ```
  Plus `npm run build` and `npm run audit:star-system-generator:deep` at Task 6.

---

## Design Options Considered

These three options were brainstormed before settling on the recommendation. Documented here so future implementers can revisit the tradeoff.

### Option A — Tone-weighted edge-type preferences in `score.ts` + GU-modulated eligibility (RECOMMENDED)

- **Why:** Addresses both axes (tone via scoring, GU via eligibility). Both adjustments are surgical and additive — no new pipeline stages, no template authoring, no rule-file changes. Default inputs (`balanced` + `normal`) produce byte-identical output to the current pipeline so the existing snapshot contract is preserved.
- **File changes:** `score.ts` (add multiplier + predicate), `graph/index.ts` (thread inputs through), `graph/types.ts` (extend input type), `index.ts` (pass options).
- **Risk:** Per-tone × edge-type weights need tuning (3 tones × 12 edge types = 36 weights, but most are 1.0 by default and only 6–10 need explicit tuning for the visible tonal axes). Iteration risk is bounded because the weights are constants in one file. GU-eligibility expansion at `fracture` may cascade into `phase6On.test.ts` snapshot regeneration if it changes which edges win spine slots and that propagates to the graph-aware prose surfaces — Task 3 verifies this explicitly.
- **Effort:** ~4 days. Tasks 1–6, of which Tasks 1 and 3 are the substantive ~half-day implementations and Task 5 is the largest test-authoring task.

### Option B — Tone-conditioned `body[0]` template family selection in `render`

- **Why:** Same spine selection. body[0] template family chosen by tone — `astronomy` opens with the spine's physical anchor, `balanced` with the human anchor, `cinematic` with the open conflict.
- **File changes:** Split each body[0] template family into 3 tone variants in `templates/*.ts`. Add tone routing in `renderClause` or the upstream `renderEdgeSentence`.
- **Risk:** Triples template authoring work for body[0] families only (12 families × 3 variants for body[0] only = 36 new variants). Maintenance trap: future template fixes have to be made 3 times. Doesn't address spine selection itself — just rephrases the same edge differently. The Phase 7 finding was that the same factions reshuffle, not just that the prose was unvaried; this option doesn't fix the underlying same-edge-family-wins-every-time issue.
- **Effort:** ~6–8 days, mostly authoring. Higher long-term cost.

### Option C — GU-modulated spine eligibility in `score.ts` (GU only, no tone)

- **Why:** `fracture` GU expands the spine pool to include phenomenon-on-phenomenon edges (which today's spine excludes via the `isNamedEntity(subject) && isNamedEntity(object)` predicate); `low` GU shrinks the pool to require strict named-on-named. Implementation is small (single predicate function).
- **File changes:** `score.ts` only.
- **Risk:** Small (single function). But only addresses the GU axis. Tone is the more user-facing knob (it appears in the top-level UI, while GU is more of a worldbuilding preference) and leaving it out would only resolve half the Phase 7 finding.
- **Effort:** ~1 day. The cheapest option but the most incomplete.

**Recommendation:** **Option A.** Best coverage of both Phase 7 axes, smallest authoring footprint, default-input behavior unchanged (so the existing snapshot contract is automatically preserved), and the tuning constants live in one file so iteration is bounded.

---

## Task 1: Add tone-conditioned scoring multiplier in `score.ts`

**Why:** `score.ts:36-46` composes the candidate score from `weight + novelty + crossLayer + namedEntity`. Without a tone signal, the scorer always prefers the same edge family for the spine in a given system (today: CONTESTS-anchored 12/12 in the survey). Adding a multiplicative tone-conditioned weight per edge-type biases which family wins the spine slot:

- `astronomy` → boost DESTABILIZES (physics destabilizes the human structures), HIDES_FROM (something is being hidden because the physics demands it), HOSTS (the body literally hosts the settlement).
- `cinematic` → boost CONTESTS (overt conflict), CONTRADICTS (someone is lying), BETRAYED (someone broke trust).
- `balanced` → all 1.0 (current behavior).

The multiplier is per-edge-type, not per-edge, so the tuning surface is bounded.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/score.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts`

- [ ] **Step 1: Read the current `scoreCandidates` implementation**

  ```bash
  sed -n '29,53p' src/features/tools/star_system_generator/lib/generator/graph/score.ts
  ```

  Confirm the function signature:
  ```ts
  export function scoreCandidates(candidates: ReadonlyArray<RelationshipEdge>): ScoredCandidate[]
  ```

  This signature changes in this task to accept a `tone` parameter — propagate the change in Task 2.

- [ ] **Step 2: Capture the current snapshot for the default-input baseline**

  Note the test file's existing fixtures use `tone: 'balanced'` and `gu: 'normal'` (verify with `grep -n "tone:" src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts`). Capture the seeds and confirm.

  Expected: all snapshot seeds use defaults. If any seed uses a non-default tone or gu, list it in the task notes for resolution at Task 5 Step 4.

- [ ] **Step 3: Add the tone-weight constants and helper**

  Edit `src/features/tools/star_system_generator/lib/generator/graph/score.ts`. Add after the existing scoring constants (around line 18):

  ```ts
  // Per-tone, per-edge-type multiplicative weight applied during scoring. The
  // multiplier biases which edge family wins the spine slot. balanced=1.0
  // everywhere preserves current behavior. astronomy boosts physics-anchored
  // families. cinematic boosts overt-conflict families.
  type ToneWeights = Partial<Record<EdgeType, number>>
  const TONE_WEIGHTS: Record<GeneratorTone, ToneWeights> = {
    balanced: {},  // implicit 1.0 for all types
    astronomy: {
      DESTABILIZES: 1.5,
      HIDES_FROM: 1.3,
      HOSTS: 1.2,
      WITNESSES: 1.2,
      CONTESTS: 0.7,
      CONTRADICTS: 0.7,
    },
    cinematic: {
      CONTESTS: 1.5,
      CONTRADICTS: 1.4,
      BETRAYED: 1.3,
      DESTABILIZES: 0.8,
      HIDES_FROM: 0.9,
    },
  }

  function toneMultiplier(edgeType: EdgeType, tone: GeneratorTone): number {
    return TONE_WEIGHTS[tone][edgeType] ?? 1.0
  }
  ```

  Add `import type { GeneratorTone } from '../../../types'` at the top of the file. Verify the import path matches the project's existing pattern (read the first 5 lines of the file to confirm).

- [ ] **Step 4: Apply the multiplier inside `scoreCandidates`**

  Change the signature:

  ```ts
  export function scoreCandidates(
    candidates: ReadonlyArray<RelationshipEdge>,
    tone: GeneratorTone,
  ): ScoredCandidate[]
  ```

  Update the score computation (line 44 region):

  ```ts
  const baseScore = edge.weight + novelty + crossLayer + namedEntity
  const score = baseScore * toneMultiplier(edge.type, tone)
  ```

  Note: multiplier is applied to the entire base score, not just `edge.weight`. This means novelty/crossLayer/namedEntity bonuses also get tone-amplified — that is intentional. A novel astronomy-tone candidate is worth more than a novel cinematic-tone candidate of a non-preferred family because both contribute to the overall preference signal.

- [ ] **Step 5: Update existing tests in `score.test.ts`**

  Read `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts`. Every existing call to `scoreCandidates(candidates)` must change to `scoreCandidates(candidates, 'balanced')` to match the new signature. Confirm `tone='balanced'` produces identical scores to the old implementation by spot-checking 1–2 existing test cases that pin specific score values.

- [ ] **Step 6: Add new tests for the tone multiplier**

  Add a new `describe('toneMultiplier', () => {...})` block (or wherever the file's describe pattern lives):

  ```ts
  it('cinematic tone re-ranks a CONTESTS edge above an equally-weighted DESTABILIZES edge', () => {
    const contestsEdge = makeEdge({ type: 'CONTESTS', weight: 1.0 })
    const destabilizesEdge = makeEdge({ type: 'DESTABILIZES', weight: 1.0 })
    const balanced = scoreCandidates([contestsEdge, destabilizesEdge], 'balanced')
    const cinematic = scoreCandidates([contestsEdge, destabilizesEdge], 'cinematic')
    // balanced: ties broken by hash; cinematic: CONTESTS wins by multiplier
    const cinematicTop = cinematic[0]
    expect(cinematicTop.edge.type).toBe('CONTESTS')
    // verify the score is actually higher than the balanced score
    expect(cinematic[0].score).toBeGreaterThan(balanced[0].score)
  })

  it('astronomy tone re-ranks a DESTABILIZES edge above an equally-weighted CONTESTS edge', () => {
    // ...mirror the above with the families swapped
  })

  it('balanced tone produces identical scores to the pre-tone implementation for a known fixture', () => {
    // pin a small fixture and assert the scores match a known-good baseline
  })
  ```

  Use existing `makeEdge` helpers if they exist; otherwise define a minimal builder inline.

- [ ] **Step 7: Run the score tests**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts
  ```

  Expected: all tests pass, including the new tone-multiplier tests.

- [ ] **Step 8: Run the full per-task quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  ```

  Expected: tsc fails — `scoreCandidates` is called from `buildRelationshipGraph` (or similar) with the old signature. This is expected; Task 2 wires the new parameter through. Suppress the failure by temporarily passing `'balanced'` at the existing call site if needed to keep the build green during local iteration, then revert in Task 2. The proseUnchanged and phase6On snapshots must remain stable.

- [ ] **Step 9: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: add tone-conditioned scoring multiplier in graph spine selection

  Per-tone, per-edge-type multipliers bias which edge family wins the
  spine slot. balanced=1.0 everywhere (preserves current behavior).
  astronomy boosts DESTABILIZES, HIDES_FROM, HOSTS, WITNESSES (physics-
  anchored families) and softens CONTESTS, CONTRADICTS. cinematic boosts
  CONTESTS, CONTRADICTS, BETRAYED (overt-conflict families) and softens
  DESTABILIZES, HIDES_FROM.

  scoreCandidates() now takes a GeneratorTone parameter. Existing
  callers temporarily pass 'balanced' to keep the build green; Task 2
  threads the user's tone through buildRelationshipGraph.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push -u origin <feature-branch>
  ```

---

## Task 2: Thread `tone` and `gu` through `buildRelationshipGraph`

**Why:** Task 1 added a `tone` parameter to `scoreCandidates`. Task 3 will add a `gu` parameter to `selectEdges`. Both need to flow from `GenerationOptions` (where the user input lives) through the existing graph-build call chain. This task is plumbing only — no behavior changes.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/types.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/index.ts` (or wherever `buildRelationshipGraph` lives — read first)
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (the call site at line ~3143)

- [ ] **Step 1: Locate the build-graph entry point**

  ```bash
  grep -rn "export function buildRelationshipGraph\|export const buildRelationshipGraph" src/features/tools/star_system_generator/lib/generator/graph/
  ```

  Note the exact file and signature. The signature today reads something like `buildRelationshipGraph(input, narrativeFacts, rng)`.

- [ ] **Step 2: Extend the input type to carry tone and gu**

  Find the `BuildGraphInput` (or equivalent) interface in `graph/types.ts`. Add two optional fields:

  ```ts
  export interface BuildGraphInput {
    // ...existing fields
    tone?: GeneratorTone
    gu?: GuPreference
  }
  ```

  Optional with a default of `'balanced'` / `'normal'` so existing tests that build inputs by hand don't break — Task 4 makes the threading explicit at the integration point.

  Add `import type { GeneratorTone, GuPreference } from '../../../types'`.

- [ ] **Step 3: Update `buildRelationshipGraph` to pass tone to `scoreCandidates`**

  Inside the function body, change the call:

  ```ts
  const scored = scoreCandidates(candidates, input.tone ?? 'balanced')
  ```

  Don't yet touch `selectEdges` — Task 3 adds the gu parameter there.

- [ ] **Step 4: Update the call site in `index.ts`**

  Find `buildRelationshipGraph(...)` call (around line 3143):

  ```ts
  const relationshipGraph = buildRelationshipGraph(
    {
      systemName: name.value,
      // ...existing fields
      narrativeFacts,
      tone: options.tone,
      gu: options.gu,
    },
    narrativeFacts,
    rootRng.fork('graph'),
  )
  ```

  Add `tone: options.tone` and `gu: options.gu` to the input object.

- [ ] **Step 5: Run the full per-task quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  ```

  Expected:
  - tsc clean (Task 1's transient breakage resolved).
  - All tests pass.
  - `proseUnchanged.test.ts` byte-identical (the snapshot uses `tone: 'balanced'` + `gu: 'normal'` per Task 1 Step 2; the new threading is a no-op for those values).
  - `phase6On.test.ts` snapshot stable.
  - Audit clean.

- [ ] **Step 6: Run the survey from the top of this plan and capture the diff**

  Compare to the pre-implementation baseline (kept in `/tmp/spine-tone-gu-survey-pre.txt` if you ran the survey first). Expected: the spine summaries for `astronomy` and `cinematic` tones now show different edge families winning the spine in at least 4/8 of the (tone × gu) cells. (The 4 `balanced` cells should be byte-identical to the baseline.) The body[0] paragraphs may also start to diverge.

- [ ] **Step 7: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: thread tone and gu through buildRelationshipGraph

  Extend BuildGraphInput to carry the user's GeneratorTone and
  GuPreference. buildRelationshipGraph passes tone through to
  scoreCandidates so the Task 1 multiplier can re-rank spine
  candidates per tone. gu is plumbed but not yet consumed (Task 3
  wires the eligibility predicate).

  proseUnchanged.test.ts and phase6On.test.ts snapshots remain
  byte-identical because they use tone='balanced' (multiplier is
  1.0 across all edge types).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin <feature-branch>
  ```

---

## Task 3: Add GU-conditioned spine eligibility predicate in `score.ts`

**Why:** Today `selectEdges` filters spine candidates by `SPINE_ELIGIBLE_TYPES.has(c.edge.type) && isNamedEntity(c.edge.subject) && isNamedEntity(c.edge.object)` (`score.ts:83-87`). At `gu='fracture'` the system should be allowed phenomenon-on-phenomenon spine reads — the bleed itself becomes the protagonist. At `gu='low'` the predicate should stay strict (the bleed is a curiosity, not the story). At `gu='normal'` and `gu='high'` the current predicate is the right baseline.

The change is a per-GU widening of the eligibility predicate. The widening only ADDS candidates; it never removes ones that were eligible before.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/score.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/index.ts` (pass gu through to selectEdges)

- [ ] **Step 1: Read the current `selectEdges` filter logic**

  ```bash
  sed -n '74,112p' src/features/tools/star_system_generator/lib/generator/graph/score.ts
  ```

  Confirm the current filter:
  ```ts
  const spineCandidates = scored.filter(c =>
    SPINE_ELIGIBLE_TYPES.has(c.edge.type)
    && isNamedEntity(c.edge.subject)
    && isNamedEntity(c.edge.object),
  )
  ```

- [ ] **Step 2: Add the GU-eligibility helper**

  Add near the existing `SPINE_ELIGIBLE_TYPES` constant:

  ```ts
  // GU intensity widens or holds the spine-eligibility predicate. fracture
  // allows phenomenon-on-phenomenon edges (the bleed becomes the protagonist).
  // low/normal/high keep the baseline named-on-named requirement.
  function isSpineEligibleForGu(
    edge: RelationshipEdge,
    gu: GuPreference,
  ): boolean {
    if (!SPINE_ELIGIBLE_TYPES.has(edge.type)) return false
    const baselineEligible = isNamedEntity(edge.subject) && isNamedEntity(edge.object)
    if (gu === 'fracture') {
      // Allow phenomenon-anchored edges as well. A phenomenon endpoint counts
      // because at fracture-intensity bleed, the phenomenon IS the named thing.
      const phenomenonAnchored =
        edge.subject.kind === 'phenomenon' || edge.object.kind === 'phenomenon'
      return baselineEligible || phenomenonAnchored
    }
    return baselineEligible
  }
  ```

  Add `import type { GuPreference } from '../../../types'`.

- [ ] **Step 3: Update `selectEdges` signature and filter**

  Change the signature:
  ```ts
  export function selectEdges(
    scored: ReadonlyArray<ScoredCandidate>,
    options: SelectionOptions,
    gu: GuPreference,
  ): SelectionResult
  ```

  Replace the spine filter with:
  ```ts
  const spineCandidates = scored.filter(c => isSpineEligibleForGu(c.edge, gu))
  ```

- [ ] **Step 4: Update `buildRelationshipGraph` to pass gu to `selectEdges`**

  In `graph/index.ts` (or wherever `selectEdges` is called), update:
  ```ts
  const selection = selectEdges(scored, selectionOptions, input.gu ?? 'normal')
  ```

- [ ] **Step 5: Update existing `selectEdges` tests in `score.test.ts`**

  Every existing call to `selectEdges(scored, options)` must change to `selectEdges(scored, options, 'normal')`. Confirm `gu='normal'` produces identical selections to the old implementation by spot-checking 1–2 existing test cases.

- [ ] **Step 6: Add new tests for the GU-eligibility predicate**

  ```ts
  it('isSpineEligibleForGu allows phenomenon-anchored edges at fracture', () => {
    const phenomenonEdge = makeEdge({
      type: 'DESTABILIZES',
      subject: { kind: 'phenomenon', /* ... */ },
      object: { kind: 'phenomenon', /* ... */ },
    })
    expect(isSpineEligibleForGu(phenomenonEdge, 'fracture')).toBe(true)
    expect(isSpineEligibleForGu(phenomenonEdge, 'normal')).toBe(false)
    expect(isSpineEligibleForGu(phenomenonEdge, 'high')).toBe(false)
    expect(isSpineEligibleForGu(phenomenonEdge, 'low')).toBe(false)
  })

  it('isSpineEligibleForGu still requires named-on-named at low/normal/high', () => {
    // mirror the test above with non-phenomenon edges
  })

  it('isSpineEligibleForGu rejects non-eligible edge types regardless of GU', () => {
    const witnessEdge = makeEdge({ type: 'WITNESSES', /* ... */ })
    for (const gu of ['low', 'normal', 'high', 'fracture'] as const) {
      expect(isSpineEligibleForGu(witnessEdge, gu)).toBe(false)
    }
  })
  ```

- [ ] **Step 7: Run the full per-task quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  ```

  Expected:
  - All tests pass.
  - `proseUnchanged.test.ts` byte-identical (snapshot uses `gu: 'normal'`; predicate unchanged for normal).
  - `phase6On.test.ts` snapshot stable. **If this regenerates,** see "phase6On.test.ts" in Architectural Notes — the GU-eligibility expansion has cascaded farther than expected; investigate before committing.
  - Audit clean.

- [ ] **Step 8: Re-run the survey and confirm the GU axis now varies**

  Compare to the post-Task-2 survey. Expected: at least one of the 3 `fracture` cells now shows a phenomenon-anchored spine summary or body[0] (e.g., "the chiral ice belt destabilizes the iggygate" or similar). The non-fracture cells remain unchanged from the post-Task-2 baseline.

- [ ] **Step 9: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: add GU-conditioned spine eligibility predicate

  At gu='fracture' the bleed becomes the protagonist — allow
  phenomenon-on-phenomenon edges into the spine pool so the
  systemStory leads with the bleed instead of with human politics.
  At low/normal/high the predicate keeps the baseline named-on-named
  requirement.

  selectEdges() now takes a GuPreference parameter. Existing snapshots
  remain stable because the eligibility predicate is identical to the
  pre-change behavior for gu='normal'.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin <feature-branch>
  ```

---

## Task 4: End-to-end integration tests + survey verification

**Why:** Tasks 1–3 wire the inputs and add unit tests for the helpers. Task 4 confirms the end-to-end behavior — generated systems with non-default tone/gu actually produce meaningfully different `spineSummary` and `body[0]` strings.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/integration.test.ts`

- [ ] **Step 1: Read the existing integration test patterns**

  ```bash
  sed -n '1,80p' src/features/tools/star_system_generator/lib/generator/graph/__tests__/integration.test.ts
  ```

  Note the fixture-builder style and how `generateSystem` is called.

- [ ] **Step 2: Add a test asserting astronomy tone biases toward physical-anchor edges**

  ```ts
  it('astronomy tone produces a non-CONTESTS spine for at least one fixture seed', () => {
    const seeds = [
      'tone-astronomy-test-1',
      'tone-astronomy-test-2',
      'tone-astronomy-test-3',
      'tone-astronomy-test-4',
    ]
    const flags = { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true }
    const spineEdgeTypes: EdgeType[] = []
    for (const seed of seeds) {
      const sys = generateSystem({
        seed, distribution: 'frontier', tone: 'astronomy', gu: 'normal',
        settlements: 'normal', graphAware: flags,
      })
      const topSpineId = sys.relationshipGraph.spineEdgeIds[0]
      const topEdge = sys.relationshipGraph.edges.find(e => e.id === topSpineId)
      if (topEdge) spineEdgeTypes.push(topEdge.type)
    }
    // at least one of 4 astronomy seeds should pick a non-CONTESTS spine
    const nonContests = spineEdgeTypes.filter(t => t !== 'CONTESTS')
    expect(nonContests.length).toBeGreaterThan(0)
  })
  ```

- [ ] **Step 3: Add a test asserting cinematic tone biases toward conflict edges**

  Mirror Step 2 with `tone: 'cinematic'` and assert at least one seed picks a CONTESTS or CONTRADICTS or BETRAYED spine. (Likely passes trivially since CONTESTS already wins at balanced; the test is a guard against a future regression that over-corrects.)

- [ ] **Step 4: Add a test asserting fracture GU widens the spine pool**

  ```ts
  it('fracture GU produces a phenomenon-anchored spine for at least one fixture seed', () => {
    const seeds = [
      'gu-fracture-test-1',
      'gu-fracture-test-2',
      'gu-fracture-test-3',
      'gu-fracture-test-4',
      'gu-fracture-test-5',
    ]
    const flags = { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true }
    let phenomenonAnchoredCount = 0
    for (const seed of seeds) {
      const sys = generateSystem({
        seed, distribution: 'frontier', tone: 'balanced', gu: 'fracture',
        settlements: 'normal', graphAware: flags,
      })
      const topSpineId = sys.relationshipGraph.spineEdgeIds[0]
      const topEdge = sys.relationshipGraph.edges.find(e => e.id === topSpineId)
      if (topEdge && (topEdge.subject.kind === 'phenomenon' || topEdge.object.kind === 'phenomenon')) {
        phenomenonAnchoredCount++
      }
    }
    // at least 1 of 5 fracture seeds should produce a phenomenon-anchored spine
    expect(phenomenonAnchoredCount).toBeGreaterThan(0)
  })
  ```

  Note: 1/5 is a deliberate floor, not a target. The test guards against the predicate being a no-op (regression). If during tuning you see 0/5, the predicate isn't reaching real phenomenon-anchored edges — likely a rule-file gap (no rule produces phenomenon-on-phenomenon edges of an eligible type). Investigate which rule files would need to add phenomenon-anchored DESTABILIZES or DEPENDS_ON edges.

- [ ] **Step 5: Add a test asserting balanced tone + normal GU is byte-identical to pre-feature**

  This test is the regression guard for the no-op-for-defaults guarantee. Pin a small set of seeds against expected substring matches:

  ```ts
  it('balanced tone + normal GU produces a byte-identical spineSummary against pre-feature for fixture seeds', () => {
    // these strings are captured pre-feature from the survey at the top of this plan
    const cases = [
      {
        seed: 'spine-tone-gu-survey-balanced-normal',
        expectedSpineSummary: 'The compact between Glasshouse Biosafety Compact and Ninth Ledger Office broke in the second wave, Glasshouse Biosafety Compact and Ninth Ledger Office can\'t both set the rules — and the rest of the system knows it.',
      },
    ]
    const flags = { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true }
    for (const { seed, expectedSpineSummary } of cases) {
      const sys = generateSystem({
        seed, distribution: 'frontier', tone: 'balanced', gu: 'normal',
        settlements: 'normal', graphAware: flags,
      })
      expect(sys.systemStory.spineSummary).toBe(expectedSpineSummary)
    }
  })
  ```

- [ ] **Step 6: Run the integration tests**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/integration.test.ts
  ```

  Expected: all new tests pass. If Step 4's test fails (0/5 phenomenon-anchored at fracture), see the note in Step 4 for the diagnostic path.

- [ ] **Step 7: Run the full per-task quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  ```

  All pass.

- [ ] **Step 8: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  test: integration tests for tone-aware and gu-aware spine selection

  Pins astronomy-tone non-CONTESTS spine bias (1/4 minimum), fracture-
  GU phenomenon-anchored spine widening (1/5 minimum), and the
  no-op-for-defaults regression guarantee (balanced+normal byte-
  identical to pre-feature for a captured fixture seed).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin <feature-branch>
  ```

---

## Task 5: Snapshot test + audit check for tone/gu spine sensitivity

**Why:** Tasks 1–4 add the feature and integration tests, but a snapshot file gives the long-term contract. Future changes to `TONE_WEIGHTS` or `isSpineEligibleForGu` should regenerate this snapshot intentionally; the diff makes the behavior change visible at review time. The audit check codifies the inverse — at audit time, surface the spine-tone-sensitivity rate so a future regression that re-collapses the matrix is caught.

**Files:**
- Add: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/spineToneGuMatrix.test.ts`
- Add: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/__snapshots__/spineToneGuMatrix.test.ts.snap`
- Modify: `scripts/audit-star-system-generator.ts`

- [ ] **Step 1: Build the snapshot test**

  Create `spineToneGuMatrix.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest'
  import { generateSystem } from '../../index'

  describe('spine tone × gu matrix', () => {
    const tones = ['balanced', 'astronomy', 'cinematic'] as const
    const gus = ['low', 'normal', 'high', 'fracture'] as const
    const flags = { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true }

    for (const tone of tones) {
      for (const gu of gus) {
        it(`tone=${tone} gu=${gu} produces stable spine + body[0]`, () => {
          const sys = generateSystem({
            seed: `spine-matrix-${tone}-${gu}`,
            distribution: 'frontier',
            tone,
            gu,
            settlements: 'normal',
            graphAware: flags,
          })
          const top = sys.relationshipGraph.edges.find(
            e => e.id === sys.relationshipGraph.spineEdgeIds[0],
          )
          expect({
            spineEdgeType: top?.type,
            spineSubjectKind: top?.subject.kind,
            spineObjectKind: top?.object.kind,
            spineSummary: sys.systemStory.spineSummary,
            body0: sys.systemStory.body[0] ?? null,
          }).toMatchSnapshot()
        })
      }
    }
  })
  ```

  This generates 12 individually-named snapshot entries. Future regressions surface as per-cell snapshot diffs — much easier to read than one giant blob.

- [ ] **Step 2: Generate the initial snapshot**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/spineToneGuMatrix.test.ts -u
  ```

  This creates the snapshot file. **Inspect the file by hand** before committing — confirm the spine edge types vary across the matrix:
  - Look at the 12 `spineEdgeType` values. At least 3 different values should appear (not all CONTESTS).
  - The 3 cinematic cells should heavily favor CONTESTS / CONTRADICTS / BETRAYED.
  - The 3 astronomy cells should show at least one DESTABILIZES / HOSTS / HIDES_FROM.
  - The 3 fracture cells should show at least one phenomenon-kind subject or object.

  If the snapshot doesn't show this variation, the tone weights / GU eligibility need tuning. Adjust `TONE_WEIGHTS` constants, regenerate, re-inspect.

- [ ] **Step 3: Add the audit check**

  In `scripts/audit-star-system-generator.ts`, find the per-corpus aggregate-checks block (search for an existing aggregate check like the empty-story rate or the unresolvedSlot count). Add:

  ```ts
  // narrative.spineToneSensitivity: across a corpus that varies tone × gu,
  // at least 3 distinct spine edge types should appear in the spine. If the
  // selector collapses to one edge type (the original Phase 7 finding), the
  // tone weights or eligibility predicate have regressed.
  const spineEdgeTypes = new Set<EdgeType>()
  for (const sys of corpusByToneGu) {
    const top = sys.relationshipGraph.edges.find(
      e => e.id === sys.relationshipGraph.spineEdgeIds[0],
    )
    if (top) spineEdgeTypes.add(top.type)
  }
  if (spineEdgeTypes.size < 3) {
    addFinding(findings, 'warning', 'corpus', 'narrative.spineToneSensitivity',
      `Spine edge types collapsed to ${spineEdgeTypes.size} distinct values across the tone × gu corpus: ${[...spineEdgeTypes].join(', ')}. Expected ≥3 (regression of tone-aware spine).`)
  }
  ```

  Note: this requires the audit script to actually generate a corpus that varies tone × gu. Read the existing audit script's seed-generation pattern (`grep -n "for.*tone\|for.*gu" scripts/audit-star-system-generator.ts`) — if the corpus is single-tone, extend it for this check (or restrict the check to a sub-corpus that does vary tone/gu).

- [ ] **Step 4: Resolve any non-default-tone/gu seeds in proseUnchanged.test.ts**

  Per Task 1 Step 2, you captured any snapshot seeds using non-default tone/gu. If the list is empty, skip this step. If it has entries:

  - Preferred: move those seeds into `spineToneGuMatrix.test.ts` (new feature-specific snapshot) instead. Remove from `proseUnchanged.test.ts`.
  - Alternative: regenerate those seeds' entries in `proseUnchanged.test.ts` as the deliberate one-time drift, document in commit message.

  Both options preserve the principle that `proseUnchanged.test.ts` is the LONG-TERM contract for default inputs only.

- [ ] **Step 5: Run the full quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  npm run audit:star-system-generator:deep
  ```

  All pass. The deep audit should report 0 findings of `narrative.spineToneSensitivity`.

- [ ] **Step 6: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  test: snapshot + audit guard for tone/gu spine matrix

  spineToneGuMatrix.test.ts pins the spine edge type, endpoint kinds,
  spineSummary, and body[0] for each of 12 (3 tones × 4 gus) cells.
  Future regressions of the tone-weight tuning or gu-eligibility
  predicate surface as per-cell snapshot diffs.

  narrative.spineToneSensitivity audit check warns if the spine edge
  types collapse to fewer than 3 distinct values across a tone × gu
  corpus — a regression to the pre-feature single-edge-type pattern
  Phase 7's 20-sample review surfaced.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin <feature-branch>
  ```

---

## Task 6: Final verification + master plan update + PR

**Files:**
- Modify: `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_PLAN.md`

- [ ] **Step 1: Full quality bar**

  ```bash
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run audit:star-system-generator:quick
  npm run audit:star-system-generator:deep
  npm run build
  ```

  Capture:
  - Test count (passing / total). Should include the new `spineToneGuMatrix` 12-snapshot suite and the new integration tests.
  - Audit-deep numbers: errors, warnings, prose.unresolvedSlot count, whyHere %, tagHook %, phenomenonNote %, empty-story %. Confirm `narrative.spineToneSensitivity` is in the codified-checks list and produces 0 findings.
  - Build success.

- [ ] **Step 2: Re-run the original survey and document the diff**

  Re-run the survey from the top of this plan and compare to the pre-implementation baseline. Expected:
  - At least 9/12 cells have meaningfully different `spineSummary` (different edge type or different endpoint kinds — not just different factions reshuffled).
  - At least 3 distinct edge types appear across the 12 spine summaries.
  - Astronomy cells produce at least one physics-anchored spine.
  - Fracture cells produce at least one phenomenon-anchored spine.

  Capture the diff — paste 3–4 contrasting cells into the PR description as evidence.

- [ ] **Step 3: Verify proseUnchanged.test.ts default-input contract is preserved**

  ```bash
  git show develop:src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/__snapshots__/proseUnchanged.test.ts.snap > /tmp/develop-snapshot.snap
  diff /tmp/develop-snapshot.snap src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/__snapshots__/proseUnchanged.test.ts.snap
  ```

  Expected diff: empty (no changes) IF Task 1 Step 2 confirmed all snapshot seeds use default inputs. Otherwise expected diff: only the seeds with non-default tone/gu changed (per Task 5 Step 4 resolution).

  Any unexpected diff → STOP. The no-op-for-defaults guarantee has been broken — diagnose before opening the PR.

- [ ] **Step 4: Acceptance checklist**

  Verify each:
  - [ ] Tone-conditioned scoring multiplier in `score.ts` (Task 1) ✓
  - [ ] `tone` and `gu` threaded through `buildRelationshipGraph` (Task 2) ✓
  - [ ] GU-conditioned spine eligibility predicate in `score.ts` (Task 3) ✓
  - [ ] Integration tests pin the per-tone, per-gu behavior with non-trivial floors (Task 4) ✓
  - [ ] `spineToneGuMatrix.test.ts` 12-cell snapshot in place (Task 5) ✓
  - [ ] `narrative.spineToneSensitivity` audit check live, 0 findings (Task 5) ✓
  - [ ] `proseUnchanged.test.ts` default-input contract byte-identical ✓
  - [ ] `phase6On.test.ts` snapshot unchanged across all tasks ✓
  - [ ] Audit errors=0, warnings=0 ✓
  - [ ] Full build succeeds ✓
  - [ ] Survey re-run shows ≥9/12 cells meaningfully different from pre-feature baseline ✓

- [ ] **Step 5: Update master plan**

  Edit `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_PLAN.md`. In the "Future work (post-Phase-8)" section, mark this work complete:

  ```markdown
  ## Future work (post-Phase-8)

  - **Tone-aware / gu-aware spine selection** — ✅ Done — [plan](./NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md). Phase 7's 20-sample review surfaced that body[0] reads identically across distribution × tone × gu inputs in 15+/20 systems. Tone is now a per-edge-type scoring multiplier; GU intensity now widens the spine eligibility predicate at fracture. Snapshot + audit check codify the new contract.
  ```

- [ ] **Step 6: Commit master plan update**

  ```bash
  git commit -m "$(cat <<'EOF'
  docs: mark tone-aware / gu-aware spine work complete

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin <feature-branch>
  ```

- [ ] **Step 7: Open the PR**

  ```bash
  gh pr create --base develop --title "feat: tone-aware / gu-aware spine selection" --body "$(cat <<'EOF'
  ## Summary

  - Bias which edge family wins the spine slot per the user's `tone` (per-edge-type multiplier in scoring) and `gu` (eligibility predicate widens at fracture).
  - Default inputs (`balanced` + `normal`) are byte-identical to pre-feature; the proseUnchanged.test.ts snapshot stays green for the existing seed set.
  - New `spineToneGuMatrix.test.ts` snapshot pins the 12 (3 tones × 4 gus) cells.
  - New `narrative.spineToneSensitivity` audit check warns if the spine collapses to <3 edge types across the tone × gu corpus.

  Closes the post-Phase-8 quality gap from `PHASE_7_SAMPLE_REVIEW.md`'s 20-sample finding (15+/20 systems read identically across tone × gu).

  ## Test plan

  - [ ] Per-tone unit tests pass (`scoreCandidates` re-ranking).
  - [ ] Per-gu unit tests pass (`isSpineEligibleForGu` predicate).
  - [ ] Integration tests pass (astronomy ≥1/4 non-CONTESTS spine; fracture ≥1/5 phenomenon-anchored spine).
  - [ ] `spineToneGuMatrix.test.ts` 12-cell snapshot stable.
  - [ ] `proseUnchanged.test.ts` byte-identical to develop.
  - [ ] `phase6On.test.ts` snapshot unchanged.
  - [ ] Deep audit clean; `narrative.spineToneSensitivity` reports 0 findings.
  - [ ] Survey diff (paste 3–4 contrasting cells from before/after) shows the matrix actually varies now.
  EOF
  )"
  ```

  Tag a reviewer. Do NOT merge until the snapshot diffs in `spineToneGuMatrix.test.ts.snap` have had a human review — the snapshot is the new feature contract and the human-readable diff is the audit trail.

---

## Spec coverage check (self-review)

| Spec requirement (Phase 7 review + Phase 8 deferred-items) | Task |
|---|---|
| Make `body[0]` vary across `tone` axis | Task 1 (multiplier) + Task 2 (threading) |
| Make `body[0]` vary across `gu` axis | Task 3 (eligibility) + Task 2 (threading) |
| Preserve default-input snapshot contract | Tasks 1, 3 (no-op-for-defaults design); verified Tasks 2, 5, 6 |
| Codify the new behavior as a regression-resistant test | Task 5 (snapshot) |
| Codify the regression at audit-time | Task 5 (audit check) |
| Document the future-work entry as complete | Task 6 (master plan update) |

**Estimated commits:** 6 (one per task plus the master-plan-update).

**Estimated effort:** ~4 days (matches Option A's estimate from the brainstorm above).

---

## Risks & deferred items

- **Tuning risk.** The tone weights in Task 1 are a first cut. The Task 5 snapshot inspection step is the calibration loop — if `astronomy` cells still mostly pick CONTESTS, raise the DESTABILIZES weight further; if `cinematic` cells over-correct to all CONTESTS-no-CONTRADICTS-no-BETRAYED, soften the CONTESTS weight. Iteration should converge in 1–2 rounds because the tuning surface is bounded (6–10 weights matter).

- **GU-eligibility cascade.** Task 3's predicate widening at `fracture` could theoretically change `graph.spineEdgeIds`, which propagates to graph-aware downstream consumers (`graphAwareSettlementHook`, `graphAwarePhenomenonNote`, `graphAwareSettlementWhyHere`), which could regenerate `phase6On.test.ts`'s snapshot. Task 3 Step 7 verifies this explicitly. If the snapshot regenerates, the predicate is wider than intended — narrow it (e.g., require the phenomenon endpoint to also have a non-trivial weight) before committing.

- **Phenomenon-on-phenomenon edge availability.** Task 4 Step 4's test asserts ≥1/5 fracture seeds produce a phenomenon-anchored spine. If this consistently fails at 0/5, the issue isn't the predicate — it's that no rule files PRODUCE phenomenon-on-phenomenon edges of an eligible type (CONTESTS/DESTABILIZES/DEPENDS_ON/CONTROLS). That's a deeper rule-authoring task and out of scope for this plan; the implementer should escalate to a follow-up plan rather than expand this one.

- **Snapshot-regeneration discipline.** Task 5's `spineToneGuMatrix.test.ts.snap` becomes the new feature contract. Future tuning of `TONE_WEIGHTS` will regenerate this snapshot. The PR review checklist must include "human-reviewed the spine matrix snapshot diff" — automated `vitest -u` regeneration without human review defeats the audit trail purpose.

- **Distribution interaction.** This plan addresses `tone` and `gu` axes. The `distribution` axis (`frontier` vs `realistic`) is the third Phase-7-review-cited input. Distribution is left out of this plan because it's a different mechanism — distribution shapes the *system* (planet count, spectral types, stellar age), and the resulting graph variation is already supposed to flow naturally from the changed system state. If post-feature surveys show distribution still produces visually-identical body[0]s, that warrants its own follow-up plan.

- **`tone='cinematic'` may be overshadowed by the existing CONTESTS dominance.** Today's pipeline already produces 12/12 CONTESTS spines at balanced. Cinematic boosting CONTESTS to 1.5x just amplifies what's already happening. If post-feature surveys show cinematic and balanced are indistinguishable, the right fix is *softening balanced's implicit CONTESTS preference upstream* (in the rule weights themselves), not raising cinematic's multiplier higher. Capture this as a follow-up if it surfaces.

- **No new RNG fork.** Determinism preserved: same seed + same options = same output. Same seed + different tone/gu = different output (this is the entire point of the feature).

---

## Outputs the next phase relies on

After this work:
- `tone` and `gu` are first-class inputs to the graph pipeline. Future graph extensions can read them via the same threading pattern (`BuildGraphInput.tone`, `BuildGraphInput.gu`).
- `spineToneGuMatrix.test.ts` is the long-term contract for the tone × gu spine matrix. Future tuning regenerates this snapshot intentionally; reviewers see the diff.
- `narrative.spineToneSensitivity` audit check is live — any future change that re-collapses the spine to a single edge type is caught at audit time.
- `proseUnchanged.test.ts` continues to pin the four substantive prose surfaces byte-identically for default inputs. The feature does not weaken this contract.
- The `TONE_WEIGHTS` constant becomes the canonical knob for "make tone X feel more like Y." Future product decisions to amplify a given mood land as edits to one constant in one file.
