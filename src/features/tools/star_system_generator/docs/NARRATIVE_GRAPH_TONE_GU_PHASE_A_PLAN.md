# Tone/GU Phase A: Plumbing + Structural Gate Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the threading channel (`BuildGraphOptions`) that Phases B/C/D rely on, AND fix the structural gate in `score.ts` that today causes most "tone bias" attempts to be no-ops. After Phase A, tone weights actually fire on real candidate edges, GU intensity widens or tightens spine eligibility per a deliberate decision matrix, and `tone='balanced'` + `gu='normal'` is byte-identical to pre-feature.

**Architecture:** Surgical extension of the existing graph pipeline. One new interface (`BuildGraphOptions`), one signature change to `buildRelationshipGraph`, one widening of `NAMED_KINDS` (gated by a pre-task survey), two new pure helper functions in `score.ts`, one matrix snapshot test pinning **structural fields only** (no prose strings), one new audit check.

**Tech Stack:** TypeScript (strict, `isolatedModules: true`), Vitest, ESLint, existing audit scripts.

**Source spec:** [Master plan](./NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md) Phases table, row "Phase A".

**Branch:** Work on `develop`. Push to `origin/develop` after every successful task.

**Scope:**
- Task 1: Pre-task survey — confirm phenomenon-anchored eligible-type edges exist in the rule corpus at meaningful frequency. Sub-task fork point: if <10% of seeds have any, author 2–3 phenomenon-anchored DESTABILIZES rules before continuing.
- Task 2: Add `BuildGraphOptions` interface in `graph/types.ts`. Thread through `buildRelationshipGraph`. Update call site in `lib/generator/index.ts`. No behavior change yet.
- Task 3: Widen `NAMED_KINDS` in `score.ts` to include `phenomenon` + `guHazard`. Verify the widening reaches expected candidate counts via the survey from Task 1.
- Task 4: Implement `toneMultiplier(tone, edgeType)` in `score.ts`. Wire into `scoreCandidates`.
- Task 5: Implement `isSpineEligibleForGu(edge, gu)` in `score.ts`. Wire into `selectEdges`. Make the explicit decision: `low` tightens, `normal` baseline, `high` boosts hazard-anchored, `fracture` widens predicate.
- Task 6: Matrix snapshot test pinning STRUCTURAL fields only (`spineEdgeType`, `spineSubjectKind`, `spineObjectKind`). No prose strings.
- Task 7: Audit check `narrative.spineToneSensitivity` (≥3 distinct edge types across the matrix) plus per-sub-corpus floors (≥1 phenomenon-anchored at fracture; ≥1 non-CONTESTS at astronomy).

**Out of scope:**
- Per-tone faction generation (Phase B).
- Per-tone template variants (Phase C).
- Distribution + density axes (Phase D).
- Prose-string snapshots in the matrix test (Phase C will add those once tone-voiced templates exist to pin).
- Any change to template families, rule files (except the optional Task 1 sub-task), historical edge attachment, or the four graph-aware prose consumers.

---

## Architectural Notes

### Why `BuildGraphOptions` is a new interface, not an extension of `EntityInventoryInput`

`EntityInventoryInput` (`graph/entities.ts:3`) is the contract for `buildEntityInventory(input: EntityInventoryInput): EntityRef[]` — a pure function that builds entity refs from the post-generation entity state. Its semantics are "what exists in this system." Adding stylistic preferences (`tone`, `gu`) would be a semantic mismatch: tone doesn't change what entities exist, it changes how the renderer prefers to talk about them.

`BuildGraphOptions` is the right home because:
1. It carries pipeline-stage configuration, not entity-construction inputs.
2. It naturally extends to Phase D's `distribution` + `settlements` axes (also stylistic preferences).
3. It keeps `EntityInventoryInput` testable in isolation without faking out tone/gu defaults in every fixture.

The `buildRelationshipGraph` signature evolves from:
```ts
buildRelationshipGraph(input: EntityInventoryInput, facts, rng)
```
to:
```ts
buildRelationshipGraph(input: EntityInventoryInput, options: BuildGraphOptions, facts, rng)
```

### Why `NAMED_KINDS` needs widening

`score.ts:20-22` defines:
```ts
const NAMED_KINDS = new Set<EntityRef['kind']>([
  'settlement', 'namedFaction', 'body', 'ruin', 'system',
])
```

`isNamedEntity` (`score.ts:24-27`) returns `true` only if the entity kind is in `NAMED_KINDS` AND the displayName matches `/[A-Z][a-z]+/`. The spine filter at `score.ts:83-87` requires both subject and object to be named-entity, AND the edge type to be in `SPINE_ELIGIBLE_TYPES = {CONTESTS, DESTABILIZES, DEPENDS_ON, CONTROLS}`.

The intersection at scale today is approximately:
- CONTESTS: typically faction-on-faction → both named → eligible
- CONTROLS: typically faction-on-route/gate → both named (route/gate are named via factions' control assertion) → eligible
- DEPENDS_ON: typically settlement-on-guResource → guResource is NOT in NAMED_KINDS → REJECTED
- DESTABILIZES: typically phenomenon-on-(target) → phenomenon is NOT in NAMED_KINDS → REJECTED

Result: spine is effectively CONTESTS-dominated with occasional CONTROLS. Phase 7 confirmed: 12/12 cells in the survey were CONTESTS.

Phase A widens `NAMED_KINDS` to add `phenomenon` and `guHazard`. After widening, DESTABILIZES becomes a real candidate for the spine, which makes `astronomy` tone's DESTABILIZES boost meaningful. `guResource` is intentionally NOT added because settlement-on-guResource is the "settlement-spine" pattern that already has its own selector at `settlementSpineEligibility.ts` — we don't want to double-count those.

### Why GU `low`/`normal`/`high`/`fracture` need an explicit decision

The original plan made `low`/`normal`/`high` functionally identical (all baseline) and only `fracture` widened the predicate. This was silently wrong: the user-facing copy promises GU intensity differentiates the output, but the implementation didn't. Phase A makes the decision explicit:

| GU Value | Eligibility Predicate | Tone-multiplier interaction |
|---|---|---|
| `low` | Strict named-on-named (current baseline). Additionally, multiplier on `DESTABILIZES` and `HIDES_FROM` capped at 0.7 (the bleed is a curiosity, not the story) | Low GU dampens cosmic-horror weights even under astronomy tone |
| `normal` | Baseline named-on-named (current behavior, no change) | Pass-through |
| `high` | Baseline named-on-named, AND `guHazard`-anchored DESTABILIZES gets +0.2 score bonus | High GU subtly raises hazard salience without unlocking the predicate |
| `fracture` | Widens predicate to allow phenomenon-on-phenomenon and phenomenon-on-guHazard | Predicate widening (the "bleed becomes the protagonist" mode) |

This is a per-axis design decision, not silent pass-through. The Phase A plan documents it; the matrix snapshot pins it; the audit check guards against regression.

### Why the matrix snapshot pins STRUCTURAL fields only

The original plan pinned `spineSummary` + `body[0]` prose strings in the matrix snapshot. Two problems:

1. **Fragility.** Any change to `connectives.ts`, `slotResolver.ts`, or any template family regenerates 12 cells. The diff reads as "everything changed" and reviewers can't tell which cells changed for the new feature vs. which changed for an unrelated polish.
2. **Premature.** Phase A doesn't ship per-tone voice. The prose strings will read in the same voice across tones — pinning them traps the un-voiced state as the contract.

Phase A's snapshot pins:
- `spineEdgeType` (e.g., `'CONTESTS'`)
- `spineSubjectKind` (e.g., `'namedFaction'`)
- `spineObjectKind` (e.g., `'phenomenon'`)

These are structural, stable, and meaningful. Future phases (Phase C particularly) add prose-string snapshots once tone-voiced templates exist to pin.

### Determinism

- No new RNG forks. `toneMultiplier` and `isSpineEligibleForGu` are pure functions of `(edge, tone)` and `(edge, gu)` respectively.
- Same seed + same options produce same output across the entire phase.
- `tone='balanced'` AND `gu='normal'` produce byte-identical output to pre-feature (multiplier is 1.0 across all types; eligibility predicate is unchanged from current `score.ts:83-87`).

### proseUnchanged.test.ts contract

Verify in Task 2 Step 2: all existing `proseUnchanged.test.ts` snapshot seeds use `tone: 'balanced'` and `gu: 'normal'`. If true, the snapshot stays byte-identical because Phase A's helpers are no-ops for those defaults. If any seed uses non-default options, list it in the task notes for resolution at Task 6 Step 4.

If `proseUnchanged.test.ts` regenerates unexpectedly, STOP and diagnose — the no-op-for-defaults guarantee has been broken. The most likely cause would be the `NAMED_KINDS` widening expanding the candidate pool for default-tone seeds in a way that changes which edge wins the spine slot. If the widening leaks into balanced-tone selection, the fix is to make the widened types only eligible when tone weights for them are non-default — but that's a deeper redesign and warrants escalation rather than ad-hoc patching.

### phase6On.test.ts

Records `phenomenonNotes`, `settlementTagHooks`, `settlementWhyHere`. None of these read `spineSummary` or `body[0]` directly, so Phase A should not regenerate this snapshot. If it regenerates, the `NAMED_KINDS` widening has cascaded into the graph-aware downstream consumers (likely via `graph.spineEdgeIds` changing → graphAwareSettlementHook picking a different edge). If this happens, narrow the widening — possibly defer `guHazard` and only add `phenomenon` in this phase, escalate `guHazard` to a follow-up.

---

## File Structure

**Files modified:**
- `src/features/tools/star_system_generator/lib/generator/graph/types.ts` — Task 2 (add `BuildGraphOptions`).
- `src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts` — Task 2 (signature change), Task 4 (pass tone to scoreCandidates), Task 5 (pass gu to selectEdges).
- `src/features/tools/star_system_generator/lib/generator/index.ts` — Task 2 (call site at line ~3143 passes new `BuildGraphOptions` arg).
- `src/features/tools/star_system_generator/lib/generator/graph/score.ts` — Task 3 (`NAMED_KINDS` widening), Task 4 (`toneMultiplier`), Task 5 (`isSpineEligibleForGu`).
- `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts` — Tasks 3, 4, 5 (unit tests).
- `scripts/audit-star-system-generator.ts` — Task 7 (`narrative.spineToneSensitivity` check).
- `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md` — final task: mark Phase A done in master overview's Phases table.

**Files added:**
- `src/features/tools/star_system_generator/lib/generator/graph/__tests__/spineToneGuMatrix.test.ts` — Task 6 (matrix snapshot, structural fields only).
- `src/features/tools/star_system_generator/lib/generator/graph/__tests__/__snapshots__/spineToneGuMatrix.test.ts.snap` — generated by the above.

**Conditionally added (Task 1 sub-task fork):**
- `src/features/tools/star_system_generator/lib/generator/graph/rules/destabilizesRules.ts` — extended with 2–3 new phenomenon-on-named rules IF the survey shows <10% seed coverage.

**Files unchanged:**
- All edge rule files except the conditional destabilizes addition.
- All template families.
- Renderer (`renderSystemStory.ts`, `slotResolver.ts`, `grammarSafety.ts`, `clusters.ts`, `connectives.ts`).
- Historical edge attachment (`history.ts`).
- All graph-aware prose consumers.
- `proseUnchanged.test.ts` and its snapshot (preserved by no-op-for-defaults).
- `phase6On.test.ts` and its snapshot.
- `data/narrative.json` (Phase B touches `namedFactions[]`).

---

## Conventions

- Run `npx tsc --noEmit` as part of every task's verification — ESLint does not catch TS module-resolution errors.
- Commit message style: lowercase `<type>: <subject>` (e.g., `feat:`, `refactor:`, `test:`, `docs:`), with the standard `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer (use a HEREDOC for `git commit -m`).
- No comments in code unless the WHY is non-obvious. The new `TONE_WEIGHTS` table and the `isSpineEligibleForGu` per-GU branches warrant brief comments because they encode product judgments.
- Push to `origin/develop` after every successful task.
- NEVER use `any`. Use `unknown`, specific interfaces, or union types. Prefix unused params with `_`.
- The `proseUnchanged.test.ts` contract must remain byte-identical for `tone: 'balanced'` + `gu: 'normal'` seeds. If it drifts, the no-op-for-defaults guarantee has been broken — STOP and diagnose.
- The `phase6On.test.ts` snapshot must remain stable across all tasks. If it regenerates, STOP and diagnose.
- Per-task quality gate (every task runs all of these and confirms green):
  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```
  Plus `npm run audit:star-system-generator:deep` after Task 7.
- `npm run test` is canonical (uses `vitest.unit.config.ts`; `vitest.local.config.ts` was removed in post-Phase-8 cleanup).

---

## Task 1: Pre-task survey of phenomenon-anchored eligible edges

**Why:** Phase A's biggest risk is widening `NAMED_KINDS` without mechanism behind it. If the rule corpus doesn't actually produce phenomenon-on-named DESTABILIZES (or other eligible-type) edges at meaningful frequency, the widening gets us nothing — `astronomy` tone still picks CONTESTS because no DESTABILIZES candidates qualify. Run the survey BEFORE the predicate widening so we know whether to fork a sub-task.

**Files:**
- Read-only: all files under `src/features/tools/star_system_generator/lib/generator/graph/rules/`.
- Conditional: `src/features/tools/star_system_generator/lib/generator/graph/rules/destabilizesRules.ts` (sub-task fork).

- [ ] **Step 1: Run the candidate-pool survey**

  ```bash
  node --import tsx/esm -e "
  import('./src/features/tools/star_system_generator/lib/generator/index.ts').then(m => {
    let phenomenonAnchoredCount = 0
    let totalSeeds = 0
    const eligibleTypes = new Set(['CONTESTS', 'DESTABILIZES', 'DEPENDS_ON', 'CONTROLS'])
    for (let i = 0; i < 200; i++) {
      const seed = 'phenomenon-survey-' + i
      const sys = m.generateSystem({
        seed, distribution: 'frontier', tone: 'balanced', gu: 'normal',
        settlements: 'normal', graphAware: { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true },
      })
      totalSeeds++
      const hasPhenomenonEligible = sys.relationshipGraph.edges.some(e =>
        eligibleTypes.has(e.type) &&
        (e.subject.kind === 'phenomenon' || e.object.kind === 'phenomenon'),
      )
      if (hasPhenomenonEligible) phenomenonAnchoredCount++
    }
    console.log('Phenomenon-anchored eligible-type edges in graph:', phenomenonAnchoredCount, '/', totalSeeds, '(' + Math.round(100 * phenomenonAnchoredCount / totalSeeds) + '%)')
  })
  "
  ```

  Note: the survey scans `relationshipGraph.edges` (post-selection), not the raw candidate pool. If the post-selection coverage is ≥10%, we know the candidates exist AND survive selection at scale. If post-selection is 0% but raw candidates exist, the predicate is filtering them out — the widening will fix it.

- [ ] **Step 2: Decision branch**

  - **If ≥10% (≥20/200 seeds):** Sufficient mechanism exists. Skip to Task 2. Document the rate in the Task 1 commit message (no commit — Task 1 is read-only unless the sub-task fires).
  - **If <10% (<20/200 seeds):** Sub-task fork. Author 2–3 new phenomenon-on-named DESTABILIZES rules before Task 2. Continue to Step 3.

- [ ] **Step 3 (CONDITIONAL — only if sub-task fork):** Read existing destabilizes rules

  ```bash
  cat src/features/tools/star_system_generator/lib/generator/graph/rules/destabilizesRules.ts
  ```

  Note the existing rule shapes — `match` predicates and `build` constructors. New rules follow the same pattern.

- [ ] **Step 4 (CONDITIONAL):** Author 2–3 phenomenon-on-named rules

  Add to `destabilizesRules.ts`:
  - Rule 1: phenomenon DESTABILIZES nearest-body-with-settlement. Match: any phenomenon paired with any body that hosts a settlement. Build: edge with `subject = phenomenon`, `object = body`, `weight = 0.6`.
  - Rule 2: phenomenon DESTABILIZES iggygate / route. Match: phenomenon paired with any route or gate fact. Build: edge with `subject = phenomenon`, `object = route/gate`, `weight = 0.55`.
  - Rule 3 (optional): phenomenon DESTABILIZES specific named faction's holdings. Match: phenomenon AND faction with `domains` containing 'ecology' or 'science'. Build: edge with subject phenomenon, object the faction, weight 0.5.

  Each rule's `id` is alphabetical-stable per existing convention. Test each rule lands in its existing test file (`__tests__/destabilizesRules.test.ts`).

- [ ] **Step 5 (CONDITIONAL):** Re-run the survey

  Re-run Step 1's survey. Expected: ≥10% post-selection coverage. If still <10%, the new rules aren't matching — investigate the `match()` predicates against fixture data before continuing.

- [ ] **Step 6 (CONDITIONAL):** Commit the sub-task

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: author phenomenon-anchored DESTABILIZES rules for spine eligibility

  Pre-task survey for Phase A found <10% of seeds had phenomenon-anchored
  eligible-type edges in their candidate pool. Phase A's NAMED_KINDS
  widening (Task 3) requires real candidates to bias toward — without
  rules producing them, the widening is a no-op.

  Add 3 phenomenon-on-named DESTABILIZES rules: phenomenon→body-with-
  settlement, phenomenon→route-or-gate, phenomenon→faction-with-
  ecology-or-science-domain. Post-rule survey: ≥10% coverage.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

- [ ] **Step 7: Run the per-task quality gate (whether sub-task fired or not)**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```

  All clean.

---

## Task 2: Add `BuildGraphOptions` interface; thread through `buildRelationshipGraph`

**Why:** Phases B/C/D all need a channel to pass tone/gu/distribution/settlements into the graph pipeline without polluting `EntityInventoryInput`. Task 2 builds that channel as a no-op so subsequent tasks can land their behavior changes inside it.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/types.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (call site at line ~3143)

- [ ] **Step 1: Add `BuildGraphOptions` to `graph/types.ts`**

  At the top of the file (after the existing `EntityKind` / `EntityLayer` / `EntityRef` block, before `EdgeType`), add:

  ```ts
  import type { GeneratorTone, GuPreference } from '../../../types'

  export interface BuildGraphOptions {
    tone: GeneratorTone
    gu: GuPreference
  }
  ```

  Note: `tone` and `gu` are required (not optional) on the `BuildGraphOptions` contract. The call site at `lib/generator/index.ts:3143` always has the user's `options.tone` and `options.gu` available, so optionality would be defensive overkill. Test fixtures that build graphs by hand will need to construct `BuildGraphOptions` explicitly — this is intentional, it forces test authors to think about which tone/gu they're testing.

  Verify the import path before writing the import. The types live in `src/features/tools/star_system_generator/types.ts`. From `src/features/tools/star_system_generator/lib/generator/graph/types.ts`, the relative path is `../../../types` — this matches the existing `import type { Confidence } from '../../../types'` at line 1 of the same file.

- [ ] **Step 2: Capture the proseUnchanged seed inputs**

  ```bash
  grep -n "tone:\|gu:" src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

  Confirm: all seeds use `tone: 'balanced'` and `gu: 'normal'`. If any seed uses non-default values, list them in task notes for resolution at Task 6 Step 4.

- [ ] **Step 3: Update `buildRelationshipGraph` signature**

  Edit `src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts`. Change:

  ```ts
  export function buildRelationshipGraph(
    input: EntityInventoryInput,
    facts: NarrativeFact[],
    rng: SeededRng,
  ): SystemRelationshipGraph
  ```

  To:

  ```ts
  export function buildRelationshipGraph(
    input: EntityInventoryInput,
    options: BuildGraphOptions,
    facts: NarrativeFact[],
    rng: SeededRng,
  ): SystemRelationshipGraph
  ```

  Add `import type { BuildGraphOptions } from './types'` to the file's imports. Don't yet read `options.tone` or `options.gu` — Tasks 4 and 5 wire those.

  Suppress unused-param lint by NOT prefixing with `_` (this param is about to get used in subsequent tasks; keep the name semantic).

- [ ] **Step 4: Update the call site in `lib/generator/index.ts`**

  Find the existing call (line ~3143):

  ```bash
  grep -n "buildRelationshipGraph(" src/features/tools/star_system_generator/lib/generator/index.ts
  ```

  Update the call to pass the new options arg in position 2:

  ```ts
  const relationshipGraph = buildRelationshipGraph(
    {
      systemName: name.value,
      primary: { spectralType: primary.spectralType },
      companions,
      bodies,
      settlements: settlements.map(s => ({
        id: s.id,
        name: s.name,
        bodyId: s.bodyId,
        presence: { guValue: s.presence.guValue, hazard: s.presence.hazard },
      })),
      guOverlay,
      phenomena,
      ruins: ruins.map(r => ({ id: r.id, remnantType: r.remnantType, location: r.location })),
      narrativeFacts,
    },
    { tone: options.tone, gu: options.gu },
    narrativeFacts,
    rootRng.fork('graph'),
  )
  ```

  The new options object is the second arg, before `narrativeFacts` and `rootRng.fork('graph')`.

- [ ] **Step 5: Update test fixtures that call `buildRelationshipGraph` directly**

  ```bash
  grep -rn "buildRelationshipGraph(" src/features/tools/star_system_generator/ --include="*.ts" --include="*.tsx"
  ```

  For each call site outside `lib/generator/index.ts`, add the new options arg in position 2: `{ tone: 'balanced', gu: 'normal' }` (the no-op defaults preserve existing test behavior).

- [ ] **Step 6: Run the per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  ```

  Expected:
  - tsc clean (signature change propagated everywhere).
  - All tests pass.
  - `proseUnchanged.test.ts` byte-identical (Task 2 is pure plumbing, no behavior change).
  - `phase6On.test.ts` snapshot stable.
  - Audit clean.

- [ ] **Step 7: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: add BuildGraphOptions threading channel for input-aware graph

  Add BuildGraphOptions interface in graph/types.ts carrying tone + gu.
  Thread through buildRelationshipGraph as a dedicated second arg
  (NOT extending EntityInventoryInput, which is the entity-construction
  contract — adding stylistic preferences there would be a semantic
  mismatch). Phases B/C/D will extend BuildGraphOptions with
  distribution + settlements as those phases ship.

  Pure plumbing in this commit. options.tone and options.gu are not
  yet read by any helper — Tasks 4 (toneMultiplier) and 5
  (isSpineEligibleForGu) wire them. proseUnchanged.test.ts and
  phase6On.test.ts snapshots stay byte-identical.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 3: Widen `NAMED_KINDS` to include `phenomenon` and `guHazard`

**Why:** Today's `NAMED_KINDS` excludes `phenomenon` and `guHazard`, so DESTABILIZES (typically subjects a phenomenon) cannot reach the spine via the named-on-named filter. Task 3 widens the predicate to admit those kinds, making the spine pool genuinely include physics-anchored edges. This is the single change that turns Task 4's `astronomy` tone weights from dead letters into real bias.

`guResource` is intentionally NOT added — settlement-on-guResource is the "settlement-spine" pattern handled by `settlementSpineEligibility.ts` and we don't want to double-count.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/score.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts`

- [ ] **Step 1: Read the current `NAMED_KINDS` and `isNamedEntity` implementation**

  ```bash
  sed -n '20,28p' src/features/tools/star_system_generator/lib/generator/graph/score.ts
  ```

  Confirm:
  ```ts
  const NAMED_KINDS = new Set<EntityRef['kind']>([
    'settlement', 'namedFaction', 'body', 'ruin', 'system',
  ])

  export function isNamedEntity(ref: EntityRef): boolean {
    if (!NAMED_KINDS.has(ref.kind)) return false
    return /[A-Z][a-z]+/.test(ref.displayName)
  }
  ```

- [ ] **Step 2: Widen `NAMED_KINDS`**

  Edit `score.ts`:

  ```ts
  // Widened post-Phase-A to admit phenomenon and guHazard. The named-entity
  // filter still requires a proper-noun-shaped displayName (the regex), so
  // generic entities (e.g., a phenomenon with displayName 'aurora bloom')
  // still fail the filter. Only properly-named entities qualify.
  const NAMED_KINDS = new Set<EntityRef['kind']>([
    'settlement', 'namedFaction', 'body', 'ruin', 'system',
    'phenomenon', 'guHazard',
  ])
  ```

  Note: the regex `/[A-Z][a-z]+/` is a meaningful gate. Phenomena and guHazards with displayNames like `"the chiral ice belt"` (no uppercase) will still fail. Only ones with proper-noun shape (e.g., `"Bonn-Tycho aurora"`, `"Kestrel bleed event"`) will pass. This is intentional — we want the widening to admit named-with-character-shape entities, not generic ones.

- [ ] **Step 3: Verify the widening doesn't break `proseUnchanged.test.ts` defaults**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

  Expected: byte-identical. If it regenerates: the widening leaked into balanced-tone selection at default GU. The likely cause is that after widening, a phenomenon-anchored DESTABILIZES candidate now scores high enough to win a spine slot from CONTESTS in some seeds. If this happens:
  - Option A: Narrow the widening to only `phenomenon` (defer `guHazard`).
  - Option B: Move the widening behind a Task 4/5 condition (only widen when tone weights would prefer the widened kinds).
  - STOP and decide before continuing.

- [ ] **Step 4: Verify `phase6On.test.ts` snapshot is stable**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  ```

  Expected: stable. If it regenerates: same diagnosis as Step 3 — the widening cascaded.

- [ ] **Step 5: Add unit test for the widened `isNamedEntity`**

  Edit `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts`. Add:

  ```ts
  describe('isNamedEntity post-Phase-A widening', () => {
    it('admits a phenomenon with proper-noun displayName', () => {
      const ref: EntityRef = {
        kind: 'phenomenon',
        id: 'p1',
        displayName: 'Bonn-Tycho aurora',
        layer: 'physical',
      }
      expect(isNamedEntity(ref)).toBe(true)
    })

    it('rejects a phenomenon with all-lowercase displayName', () => {
      const ref: EntityRef = {
        kind: 'phenomenon',
        id: 'p1',
        displayName: 'aurora bloom',
        layer: 'physical',
      }
      expect(isNamedEntity(ref)).toBe(false)
    })

    it('admits a guHazard with proper-noun displayName', () => {
      const ref: EntityRef = {
        kind: 'guHazard',
        id: 'g1',
        displayName: 'Kestrel Bleed Event',
        layer: 'gu',
      }
      expect(isNamedEntity(ref)).toBe(true)
    })

    it('still rejects guResource (intentionally not widened)', () => {
      const ref: EntityRef = {
        kind: 'guResource',
        id: 'gr1',
        displayName: 'Chiral Ice Belt',
        layer: 'gu',
      }
      expect(isNamedEntity(ref)).toBe(false)
    })
  })
  ```

- [ ] **Step 6: Run the score tests**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts
  ```

  All pass.

- [ ] **Step 7: Run the per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```

  All green. The audit may report a small drift in spine-edge-type distribution if the widening changes which edges win for some non-default seeds — that's fine because no audit check yet pins the distribution. Task 7 will add `narrative.spineToneSensitivity` once the matrix has tone-driven variation to measure.

- [ ] **Step 8: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: widen NAMED_KINDS to admit phenomenon and guHazard

  score.ts:20-22's NAMED_KINDS excluded phenomenon and guHazard,
  so DESTABILIZES (typically phenomenon-subject) and other physics-
  anchored eligible-type edges could not reach the spine via the
  named-on-named filter. Without this widening, Task 4's tone weights
  for astronomy (DESTABILIZES boost, etc.) would be dead letters at
  the spine layer.

  Widen NAMED_KINDS to include phenomenon and guHazard. The proper-
  noun-shape regex still gates — generic-named entities (e.g., 'aurora
  bloom' lowercase) still fail. Only properly-named entities qualify,
  matching the intent of the existing filter.

  guResource intentionally NOT widened — that's the settlement-spine
  pattern, handled by settlementSpineEligibility.ts.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 4: Implement `toneMultiplier` and wire into `scoreCandidates`

**Why:** Tasks 1–3 set up the channel and the structural gate. Task 4 lands the per-tone bias on edge selection. With Task 3's widening, the multiplier now actually fires on phenomenon-anchored DESTABILIZES candidates (real candidates, not dead letters).

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/score.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts`

- [ ] **Step 1: Add `TONE_WEIGHTS` and `toneMultiplier` to `score.ts`**

  After the existing scoring constants (around line 18), add:

  ```ts
  // Per-tone, per-edge-type multiplicative weight applied during scoring.
  // balanced=1.0 implicit (preserves current behavior). astronomy boosts
  // physics-anchored families (now reachable post-Task-3 NAMED_KINDS widening).
  // cinematic boosts overt-conflict families.
  type ToneWeights = Partial<Record<EdgeType, number>>
  const TONE_WEIGHTS: Record<GeneratorTone, ToneWeights> = {
    balanced: {},
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

  Add to the imports at the top of `score.ts`:
  ```ts
  import type { GeneratorTone } from '../../../types'
  ```

- [ ] **Step 2: Update `scoreCandidates` signature**

  Change:
  ```ts
  export function scoreCandidates(candidates: ReadonlyArray<RelationshipEdge>): ScoredCandidate[]
  ```
  To:
  ```ts
  export function scoreCandidates(
    candidates: ReadonlyArray<RelationshipEdge>,
    tone: GeneratorTone,
  ): ScoredCandidate[]
  ```

  Update the score computation inside the function (line 44 region):

  ```ts
  const baseScore = edge.weight + novelty + crossLayer + namedEntity
  const score = baseScore * toneMultiplier(edge.type, tone)
  ```

  Multiplier applies to the entire base score (not just `edge.weight`). This is intentional — bonuses tone-amplify too.

- [ ] **Step 3: Update `buildRelationshipGraph` to pass tone**

  Edit `src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts`. Change:

  ```ts
  const scored = scoreCandidates(candidates)
  ```
  To:
  ```ts
  const scored = scoreCandidates(candidates, options.tone)
  ```

- [ ] **Step 4: Update existing `score.test.ts` calls**

  Every existing call to `scoreCandidates(candidates)` in `__tests__/score.test.ts` needs `, 'balanced'` appended. Spot-check that tests pinning specific score values still pass (multiplier is 1.0 across all types for `'balanced'`, so scores should be identical).

- [ ] **Step 5: Add `toneMultiplier` unit tests**

  Add to `__tests__/score.test.ts`:

  ```ts
  describe('toneMultiplier and per-tone scoring', () => {
    it('cinematic tone re-ranks CONTESTS above equally-weighted DESTABILIZES', () => {
      const contestsEdge = makeEdge({ type: 'CONTESTS', weight: 1.0 })
      const destabilizesEdge = makeEdge({ type: 'DESTABILIZES', weight: 1.0 })
      const cinematic = scoreCandidates([contestsEdge, destabilizesEdge], 'cinematic')
      expect(cinematic[0].edge.type).toBe('CONTESTS')
    })

    it('astronomy tone re-ranks DESTABILIZES above equally-weighted CONTESTS', () => {
      const contestsEdge = makeEdge({ type: 'CONTESTS', weight: 1.0 })
      const destabilizesEdge = makeEdge({ type: 'DESTABILIZES', weight: 1.0 })
      const astronomy = scoreCandidates([contestsEdge, destabilizesEdge], 'astronomy')
      expect(astronomy[0].edge.type).toBe('DESTABILIZES')
    })

    it('balanced tone produces scores identical to base weight + bonuses for each candidate', () => {
      const edge = makeEdge({ type: 'CONTESTS', weight: 0.7 })
      const balanced = scoreCandidates([edge], 'balanced')
      expect(balanced[0].score).toBeCloseTo(0.7 + balanced[0].bonuses.novelty + balanced[0].bonuses.crossLayer + balanced[0].bonuses.namedEntity, 5)
    })
  })
  ```

  Use existing `makeEdge` helpers if they exist; otherwise inline a minimal builder.

- [ ] **Step 6: Run the per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  ```

  All green. `proseUnchanged.test.ts` MUST stay byte-identical (multiplier is 1.0 everywhere for default tone). If it drifts, the no-op-for-defaults guarantee is broken — STOP.

- [ ] **Step 7: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: add tone-conditioned scoring multiplier

  Per-tone, per-edge-type multipliers bias which edge family wins the
  spine slot. balanced=1.0 implicit (preserves current behavior).
  astronomy boosts DESTABILIZES, HIDES_FROM, HOSTS, WITNESSES (now
  reachable post-Task-3 NAMED_KINDS widening) and softens CONTESTS,
  CONTRADICTS. cinematic boosts CONTESTS, CONTRADICTS, BETRAYED and
  softens DESTABILIZES, HIDES_FROM.

  scoreCandidates() now takes a GeneratorTone parameter, threaded
  from BuildGraphOptions.tone. proseUnchanged.test.ts byte-identical
  (multiplier is 1.0 for all types under tone='balanced').

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 5: Implement `isSpineEligibleForGu` and wire into `selectEdges`

**Why:** Task 4 ships tone bias on scoring. Task 5 ships the GU-axis eligibility predicate. The four GU values get distinct treatment per the decision matrix (see Architectural Notes): `low` tightens, `normal` baseline, `high` adds hazard-anchored bonus, `fracture` widens predicate to allow phenomenon-on-phenomenon.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/score.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts`

- [ ] **Step 1: Add `isSpineEligibleForGu` to `score.ts`**

  Near `SPINE_ELIGIBLE_TYPES` (around line 66), add:

  ```ts
  // Per-GU eligibility predicate. Encodes a deliberate decision matrix:
  // - low: strict named-on-named (current baseline)
  // - normal: strict named-on-named (current baseline, no change)
  // - high: strict named-on-named (predicate baseline; high-GU bonus is
  //   applied via scoring, see HIGH_GU_HAZARD_BONUS)
  // - fracture: widens to allow phenomenon-on-phenomenon and phenomenon-on-
  //   guHazard (the "bleed becomes the protagonist" mode)
  function isSpineEligibleForGu(
    edge: RelationshipEdge,
    gu: GuPreference,
  ): boolean {
    if (!SPINE_ELIGIBLE_TYPES.has(edge.type)) return false
    const baselineEligible = isNamedEntity(edge.subject) && isNamedEntity(edge.object)
    if (gu === 'fracture') {
      const phenomenonAnchored =
        (edge.subject.kind === 'phenomenon' && (edge.object.kind === 'phenomenon' || edge.object.kind === 'guHazard'))
        || (edge.object.kind === 'phenomenon' && (edge.subject.kind === 'phenomenon' || edge.subject.kind === 'guHazard'))
      return baselineEligible || phenomenonAnchored
    }
    return baselineEligible
  }
  ```

  Add `import type { GuPreference } from '../../../types'` to the imports.

  Note: at `'fracture'`, the widened predicate explicitly checks BOTH endpoints — phenomenon-on-phenomenon OR phenomenon-on-guHazard. We do NOT widen to phenomenon-on-anything because that would let DESTABILIZES on a no-name body win the spine, which is too generic. Phenomenon-on-phenomenon is the "bleed protagonist" pattern; phenomenon-on-guHazard captures the "X destabilizes Y" pairing within the GU layer.

- [ ] **Step 2: Add the `low`-GU multiplier dampening in scoring**

  The `low` GU dampening is a scoring-side adjustment, not an eligibility one. Add to `score.ts` near `TONE_WEIGHTS`:

  ```ts
  // GU-axis multiplier dampening. low caps cosmic-horror weights so even
  // astronomy-tone systems read as "physics is curious" rather than "physics
  // is unmaking us." normal/high pass through unchanged.
  const LOW_GU_DAMPENERS: Partial<Record<EdgeType, number>> = {
    DESTABILIZES: 0.7,
    HIDES_FROM: 0.7,
  }
  const HIGH_GU_HAZARD_BONUS = 0.2

  function guScoreAdjustment(edge: RelationshipEdge, gu: GuPreference): number {
    if (gu === 'low') {
      return LOW_GU_DAMPENERS[edge.type] ?? 1.0
    }
    if (gu === 'high') {
      const hazardAnchored = edge.subject.kind === 'guHazard' || edge.object.kind === 'guHazard'
      if (edge.type === 'DESTABILIZES' && hazardAnchored) {
        return 1.0 + HIGH_GU_HAZARD_BONUS
      }
    }
    return 1.0
  }
  ```

- [ ] **Step 3: Update `scoreCandidates` to apply the GU adjustment**

  Update the signature:

  ```ts
  export function scoreCandidates(
    candidates: ReadonlyArray<RelationshipEdge>,
    tone: GeneratorTone,
    gu: GuPreference,
  ): ScoredCandidate[]
  ```

  And the score computation:

  ```ts
  const baseScore = edge.weight + novelty + crossLayer + namedEntity
  const score = baseScore * toneMultiplier(edge.type, tone) * guScoreAdjustment(edge, gu)
  ```

- [ ] **Step 4: Update `selectEdges` signature and filter**

  Change:
  ```ts
  export function selectEdges(
    scored: ReadonlyArray<ScoredCandidate>,
    options: SelectionOptions,
  ): SelectionResult
  ```
  To:
  ```ts
  export function selectEdges(
    scored: ReadonlyArray<ScoredCandidate>,
    options: SelectionOptions,
    gu: GuPreference,
  ): SelectionResult
  ```

  Replace the spine filter (line 83-87 region):

  ```ts
  const spineCandidates = scored.filter(c => isSpineEligibleForGu(c.edge, gu))
  ```

- [ ] **Step 5: Update `buildRelationshipGraph` to pass gu**

  Update the calls in `buildRelationshipGraph.ts`:

  ```ts
  const scored = scoreCandidates(candidates, options.tone, options.gu)
  const selection = selectEdges(scored, {
    numSettlements: input.settlements.length,
    numPhenomena: input.phenomena.length,
  }, options.gu)
  ```

- [ ] **Step 6: Update `score.test.ts` existing calls**

  All existing calls to `scoreCandidates(candidates, 'balanced')` need `, 'normal'` appended. All existing calls to `selectEdges(scored, options)` need `, 'normal'` appended. Defaults preserve current behavior.

- [ ] **Step 7: Add `isSpineEligibleForGu` and `guScoreAdjustment` unit tests**

  ```ts
  describe('isSpineEligibleForGu', () => {
    it('allows phenomenon-on-phenomenon at fracture', () => {
      const edge = makeEdge({
        type: 'DESTABILIZES',
        subject: makeRef({ kind: 'phenomenon', displayName: 'Bonn-Tycho aurora' }),
        object: makeRef({ kind: 'phenomenon', displayName: 'Kestrel bleed' }),
      })
      expect(isSpineEligibleForGu(edge, 'fracture')).toBe(true)
      expect(isSpineEligibleForGu(edge, 'normal')).toBe(false)
      expect(isSpineEligibleForGu(edge, 'high')).toBe(false)
      expect(isSpineEligibleForGu(edge, 'low')).toBe(false)
    })

    it('rejects non-eligible types regardless of GU', () => {
      const edge = makeEdge({ type: 'WITNESSES' })
      for (const gu of ['low', 'normal', 'high', 'fracture'] as const) {
        expect(isSpineEligibleForGu(edge, gu)).toBe(false)
      }
    })
  })

  describe('guScoreAdjustment', () => {
    it('low dampens DESTABILIZES weight', () => {
      const edge = makeEdge({ type: 'DESTABILIZES', weight: 1.0 })
      const low = scoreCandidates([edge], 'astronomy', 'low')
      const normal = scoreCandidates([edge], 'astronomy', 'normal')
      expect(low[0].score).toBeLessThan(normal[0].score)
    })

    it('high boosts hazard-anchored DESTABILIZES', () => {
      const hazardEdge = makeEdge({
        type: 'DESTABILIZES',
        weight: 1.0,
        object: makeRef({ kind: 'guHazard', displayName: 'Kestrel Bleed' }),
      })
      const high = scoreCandidates([hazardEdge], 'balanced', 'high')
      const normal = scoreCandidates([hazardEdge], 'balanced', 'normal')
      expect(high[0].score).toBeGreaterThan(normal[0].score)
    })
  })
  ```

- [ ] **Step 8: Run the per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  ```

  All green. `proseUnchanged.test.ts` byte-identical (predicate identical for `'normal'`, multiplier 1.0 for `'balanced'` × `'normal'`).

- [ ] **Step 9: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: add GU-conditioned spine eligibility + scoring adjustments

  Encode the deliberate per-GU decision matrix:
  - low: predicate baseline + score dampens DESTABILIZES/HIDES_FROM
    (the bleed is a curiosity, not the story)
  - normal: predicate + score baseline (no change)
  - high: predicate baseline + +0.2 score for hazard-anchored
    DESTABILIZES (subtly raises hazard salience without unlocking)
  - fracture: predicate widens to phenomenon-on-phenomenon and
    phenomenon-on-guHazard (the bleed becomes the protagonist)

  selectEdges() now takes a GuPreference parameter. scoreCandidates()
  also takes gu so it can apply the score-side dampening / boosting.
  proseUnchanged.test.ts byte-identical for tone='balanced' + gu=
  'normal' defaults.

  Closes the Phase A architectural decision that GU low/normal/high
  must be functionally distinguishable, not silent pass-through.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 6: Matrix snapshot test (structural fields only)

**Why:** Tasks 4 and 5 ship the per-tone and per-GU bias. Task 6 pins the cross-axis behavior as a regression contract. The snapshot pins **STRUCTURAL** fields only (`spineEdgeType`, `spineSubjectKind`, `spineObjectKind`) — no prose strings, because Phase A doesn't ship per-tone voice and pinning prose would trap the un-voiced state. Phase C will add prose snapshots.

**Files:**
- Add: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/spineToneGuMatrix.test.ts`
- Add: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/__snapshots__/spineToneGuMatrix.test.ts.snap`

- [ ] **Step 1: Build the snapshot test**

  Create `spineToneGuMatrix.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest'
  import { generateSystem } from '../../index'

  describe('spine tone × gu matrix (structural fields only)', () => {
    const tones = ['balanced', 'astronomy', 'cinematic'] as const
    const gus = ['low', 'normal', 'high', 'fracture'] as const
    const flags = { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true }

    for (const tone of tones) {
      for (const gu of gus) {
        it(`tone=${tone} gu=${gu} produces stable spine structural fields`, () => {
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
            spineEdgeType: top?.type ?? null,
            spineSubjectKind: top?.subject.kind ?? null,
            spineObjectKind: top?.object.kind ?? null,
          }).toMatchSnapshot()
        })
      }
    }
  })
  ```

  12 individually-named snapshot entries. Future regressions surface as per-cell diffs.

- [ ] **Step 2: Generate the initial snapshot**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/spineToneGuMatrix.test.ts -u
  ```

  Inspect the snapshot file by hand. Confirm:
  - At least 3 distinct `spineEdgeType` values across the 12 cells (not all CONTESTS).
  - The 3 `astronomy` cells show at least one of {DESTABILIZES, HOSTS, HIDES_FROM} (post-Task-3+4 widening + boost).
  - The 3 `cinematic` cells favor CONTESTS / CONTRADICTS / BETRAYED.
  - At least one `fracture` cell shows `phenomenon` as `spineSubjectKind` or `spineObjectKind` (post-Task-5 widened predicate).

  If the snapshot doesn't show this variation, tune `TONE_WEIGHTS` (raise/lower specific weights), regenerate, re-inspect. Iteration should converge in 1–2 rounds.

- [ ] **Step 3: Spot-check `proseUnchanged.test.ts` and `phase6On.test.ts`**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  ```

  Both byte-identical. The matrix snapshot uses non-default options for 8/12 cells (everything except balanced + normal), but those seeds are NEW — they don't appear in the proseUnchanged or phase6On corpora, so those snapshots stay stable.

- [ ] **Step 4: Resolve any non-default-tone/gu seeds in proseUnchanged.test.ts**

  Per Task 2 Step 2, you captured any snapshot seeds using non-default tone/gu. If empty, skip. If non-empty:
  - Preferred: move those seeds into `spineToneGuMatrix.test.ts` instead. Remove from `proseUnchanged.test.ts`.
  - Alternative: regenerate them as a deliberate one-time drift; document in commit.

- [ ] **Step 5: Run the per-task quality gate**

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
  test: pin spine tone × gu matrix as structural-fields-only snapshot

  spineToneGuMatrix.test.ts pins (spineEdgeType, spineSubjectKind,
  spineObjectKind) per tone × gu cell (3 × 4 = 12 cells, individually
  snapshotted). Future regressions of the tone weights, GU eligibility
  predicate, or NAMED_KINDS gate surface as per-cell diffs.

  Prose strings (spineSummary, body[0]) intentionally NOT pinned in
  this snapshot — Phase A doesn't ship per-tone voice and pinning the
  un-voiced state would trap it as the contract. Phase C will add
  prose snapshots once tone-voiced templates exist.

  proseUnchanged.test.ts and phase6On.test.ts snapshots unchanged.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 7: Audit check `narrative.spineToneSensitivity` + per-sub-corpus floors

**Why:** Tasks 4–6 pin the matrix at fixture-seed level. Task 7 codifies the same contract at corpus scale via the audit script. If a future change re-collapses the spine to a single edge type, the audit catches it before reaching review.

**Files:**
- Modify: `scripts/audit-star-system-generator.ts`

- [ ] **Step 1: Locate the audit script's per-corpus aggregate-checks block**

  ```bash
  grep -n "addFinding.*'corpus'\|corpus_check" scripts/audit-star-system-generator.ts | head -20
  ```

  Read the surrounding code to see how existing aggregate checks (e.g., empty-story rate) are structured. The new check goes alongside.

- [ ] **Step 2: Determine if the audit corpus already varies tone × gu**

  ```bash
  grep -n "for.*tone\|for.*gu" scripts/audit-star-system-generator.ts
  ```

  - **If yes:** the existing corpus generation already produces tone/gu variation; the new check can read from it.
  - **If no:** add a sub-corpus inside the audit that varies tone × gu. Recommended: 36 seeds (3 tones × 4 gus × 3 fixture seeds per cell). Cheap relative to the 4800-system deep audit.

- [ ] **Step 3: Add the `narrative.spineToneSensitivity` check**

  ```ts
  // narrative.spineToneSensitivity: across a corpus that varies tone × gu, at
  // least 3 distinct spine edge types should appear. If the selector collapses
  // to one edge type (the original Phase 7 finding), the tone weights or
  // eligibility predicate have regressed.
  const spineEdgeTypes = new Set<EdgeType>()
  for (const sys of toneGuCorpus) {
    const top = sys.relationshipGraph.edges.find(
      e => e.id === sys.relationshipGraph.spineEdgeIds[0],
    )
    if (top) spineEdgeTypes.add(top.type)
  }
  if (spineEdgeTypes.size < 3) {
    addFinding(findings, 'warning', 'corpus', 'narrative.spineToneSensitivity',
      `Spine edge types collapsed to ${spineEdgeTypes.size} distinct values across the tone × gu corpus: ${[...spineEdgeTypes].join(', ')}. Expected ≥3 (regression of Phase A tone-aware spine).`)
  }
  ```

- [ ] **Step 4: Add per-sub-corpus floor checks**

  ```ts
  // narrative.spineToneSensitivity sub-corpus floors: per Phase A acceptance,
  // at least 1 phenomenon-anchored spine across the fracture sub-corpus, and
  // at least 1 non-CONTESTS spine across the astronomy sub-corpus.
  const fractureSub = toneGuCorpus.filter(s => s.options.gu === 'fracture')
  const fracturePhenomenonAnchored = fractureSub.filter(sys => {
    const top = sys.relationshipGraph.edges.find(e => e.id === sys.relationshipGraph.spineEdgeIds[0])
    return top && (top.subject.kind === 'phenomenon' || top.object.kind === 'phenomenon')
  })
  if (fracturePhenomenonAnchored.length === 0 && fractureSub.length > 0) {
    addFinding(findings, 'warning', 'corpus', 'narrative.spineToneSensitivity',
      `0/${fractureSub.length} fracture-GU systems produced a phenomenon-anchored spine. Expected ≥1 (Phase A predicate widening regression).`)
  }

  const astronomySub = toneGuCorpus.filter(s => s.options.tone === 'astronomy')
  const astronomyNonContests = astronomySub.filter(sys => {
    const top = sys.relationshipGraph.edges.find(e => e.id === sys.relationshipGraph.spineEdgeIds[0])
    return top && top.type !== 'CONTESTS'
  })
  if (astronomyNonContests.length === 0 && astronomySub.length > 0) {
    addFinding(findings, 'warning', 'corpus', 'narrative.spineToneSensitivity',
      `0/${astronomySub.length} astronomy-tone systems produced a non-CONTESTS spine. Expected ≥1 (Phase A tone-multiplier regression).`)
  }
  ```

- [ ] **Step 5: Run the deep audit**

  ```bash
  npm run audit:star-system-generator:deep
  ```

  Expected: `narrative.spineToneSensitivity` reports 0 findings. If it warns:
  - Cross-axis distinct types <3: TONE_WEIGHTS need stronger differentiation. Raise the cinematic/astronomy boosts further.
  - Fracture phenomenon-anchored = 0: the Task 5 predicate widening isn't matching real edges. Check whether phenomenon entities have proper-noun-shape displayNames at fracture-GU systems.
  - Astronomy non-CONTESTS = 0: the Task 4 multiplier isn't biasing strongly enough OR the Task 3 widening didn't admit the right kinds.

- [ ] **Step 6: Run the per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```

  All green.

- [ ] **Step 7: Update the master overview to mark Phase A done**

  Edit `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md`. In the Phases table, change Phase A's Status cell:
  - From: `⏳ Not yet started — [plan](./NARRATIVE_GRAPH_TONE_GU_PHASE_A_PLAN.md)`
  - To: `✅ Done — [plan](./NARRATIVE_GRAPH_TONE_GU_PHASE_A_PLAN.md)`

- [ ] **Step 8: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: codify Phase A spine-tone-sensitivity as audit check

  narrative.spineToneSensitivity warns if (a) fewer than 3 distinct
  spine edge types appear across a tone × gu corpus, (b) zero fracture-
  GU systems produce a phenomenon-anchored spine, or (c) zero
  astronomy-tone systems produce a non-CONTESTS spine. Codifies the
  Phase A acceptance bar at audit time so future regressions are caught
  before review.

  Marks Phase A done in the master overview's Phases table. Phase B
  (per-tone faction generation) is the next phase in the sequence.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Spec coverage check (self-review)

| Spec requirement (from master overview) | Task |
|---|---|
| Add `BuildGraphOptions` interface | Task 2 |
| Thread `BuildGraphOptions` through `buildRelationshipGraph` | Task 2 |
| Expand `NAMED_KINDS` to include `phenomenon` + `guHazard` | Task 3 |
| Pre-task survey for phenomenon-anchored eligible edges | Task 1 (with sub-task fork) |
| Implement `toneMultiplier(tone, edgeType)` | Task 4 |
| Implement `isSpineEligibleForGu(edge, gu)` | Task 5 |
| Decide low/high distinct treatment (don't be silent) | Task 5 (low dampens, high adds hazard bonus) |
| Matrix snapshot pinning structural fields only | Task 6 |
| Audit check `narrative.spineToneSensitivity` with per-sub-corpus floors | Task 7 |
| Master-overview Phase A row marked done | Task 7 |

**Estimated commits:** 7 (one per task; Task 1 only commits if sub-task fork fires).

**Estimated effort:** ~5 days. Task 1 ~0.5 day (no sub-task) or ~1.5 days (with sub-task). Tasks 2–7 ~0.5–1 day each.

---

## Risks & deferred items

- **Pre-task survey may force the sub-task fork.** If <10% of seeds produce phenomenon-anchored eligible-type edges in the candidate pool, Task 1's sub-task adds 2–3 new rules. This is an authoring task with its own taste decisions (which patterns to encode). Budget +1 day if the fork fires.
- **`NAMED_KINDS` widening cascade risk.** Task 3's widening could change which edges win for default-tone seeds (because phenomenon-anchored DESTABILIZES candidates that used to be filtered out now compete for spine slots). The `proseUnchanged.test.ts` and `phase6On.test.ts` byte-identical contract is the guard. If they regenerate at Task 3, options are: narrow to phenomenon-only (defer guHazard), gate the widening behind tone-weight conditions, or accept the drift as a deliberate softening (similar to Phase 8 Task 1's `composeSpineSummary` precedent). STOP and decide before proceeding.
- **Tuning iteration on `TONE_WEIGHTS`.** First-cut weights in Task 4 may need adjustment after Task 6 inspection. Iteration loop is bounded — TONE_WEIGHTS lives in one file, regenerate the matrix snapshot, re-inspect.
- **`'cinematic'` may be overshadowed by existing CONTESTS dominance.** Today's pipeline already produces CONTESTS-dominated spines at balanced. Cinematic boosting CONTESTS to 1.5× just amplifies what's already happening. If Task 6 inspection shows cinematic and balanced cells are indistinguishable, the right fix is *softening balanced's implicit CONTESTS preference upstream* (in the rule weights themselves), not raising cinematic's multiplier higher. Capture as a follow-up if it surfaces.
- **GU `low` dampening vs astronomy boosting interaction.** With astronomy DESTABILIZES at 1.5× and low DESTABILIZES dampening at 0.7×, an astronomy + low cell ends up at 1.05× — close to 1.0 baseline. This is intentional: a user saying "I want astronomy tone but the bleed is a curiosity" should NOT get a phenomenon-dominated spine. Document this in the Task 5 commit message.
- **Audit script may need per-system options visibility.** Task 7 Step 4 reads `s.options.gu` and `s.options.tone` from each generated system in the corpus. If the audit script doesn't currently propagate options into its corpus objects, that's a small refactor (add `options: GenerationOptions` to the corpus entry shape). Budget +1 hour if needed.
- **Phenomenon-anchored snapshots may not be reproducible across tooling versions.** If the phenomenon name pool changes (e.g., a future audit-script update changes which phenomena get proper-noun-shape names), the matrix snapshot will need regeneration. Mitigation: phenomenon names are deterministic per seed and shouldn't drift across tooling versions; if they do, document explicitly.

---

## Outputs the next phase relies on

After Phase A:
- `BuildGraphOptions` is the canonical channel for any future input axis. Phase B/C/D extend it.
- `NAMED_KINDS` admits `phenomenon` and `guHazard`. The candidate pool for the spine is structurally larger; tone weights have real candidates to bias toward.
- `TONE_WEIGHTS` and `LOW_GU_DAMPENERS` constants in `score.ts` are the canonical knobs for "make tone X feel more like Y" and "make GU intensity Z feel like W."
- `spineToneGuMatrix.test.ts` is the regression contract for structural cross-axis behavior. Phase C will extend it to pin prose strings once per-tone voice exists.
- `narrative.spineToneSensitivity` audit check is live. Phase B/C/D extensions can add their own audit checks alongside.
- `proseUnchanged.test.ts` continues to pin the four substantive prose surfaces byte-identically for default inputs (Phase B will deliberately soften this for faction-name diversity).
