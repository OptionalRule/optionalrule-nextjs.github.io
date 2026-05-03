# Narrative Graph Phase 8 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire the legacy parallel narrative pipeline (`narrativeLines`, `narrativeThreads`, `NarrativeBeat`, `hiddenCauseBeatText`, `choiceBeatText`) now that Phases 0–7 have shipped the graph-aware replacement, and fix the spine-summary lowercase-faction bug that blocked the `prose.lowercaseFactionMidSentence` audit check.

**Architecture:** Phase 8 is a deletion phase — no new pipeline stages, no new edge types, no new template families. Two threads of work: (1) a one-line bug fix in `composeSpineSummary` plus the audit check that codifies the regression guard; (2) removal of the deprecated narrative-thread surface and its consumers. The deletion fans across the type system (`types.ts`), the producer (`lib/generator/index.ts`), three consumers (`lib/generator/validation.ts`, `lib/export/markdown.ts`, `components/PlayableLayerPanel.tsx`), and the test surfaces that pinned the legacy shape.

**Tech Stack:** TypeScript (strict, `isolatedModules: true`), Vitest, ESLint, existing audit scripts.

**Source spec:** `NARRATIVE_GRAPH_PLAN.md` Phase 8 row at line 446 (Phase 7 closure carryover + the original Phase 8 deprecation goal).

**Branch:** Work on `develop`. Phases 0–7 are merged. Push to `origin/develop` after every successful task.

**Scope:**
- Task 1: Fix the spine-summary lowercase-faction bug in `composeSpineSummary` (Phase 7 carryover).
- Task 2: Add the `prose.lowercaseFactionMidSentence` audit check that Phase 7 Task 10 deferred.
- Task 3: Remove the legacy `NarrativeLinesPanel` UI consumer.
- Task 4: Delete the legacy narrative producer pipeline (`generateNarrativeLines`, `generateNarrativeThreads`, `hiddenCauseBeatText`, `choiceBeatText`) and the surrounding type/consumer cascade. This is the largest task; sub-steps land it in a single coherent commit.
- Task 5: Final verification + master plan update.

**Out of scope:**
- Pipeline reorder (settlements → graph → prose). Still deferred per the Phase 6 rationale.
- New edge types, new edge rules, new template families.
- Tone-aware spine and gu-aware spine (captured as Phase 8 candidates in `PHASE_7_SAMPLE_REVIEW.md` but each warrants its own plan; not Phase 8 work).
- Any change to the graph-aware prose consumers (`graphAwareSettlementHook`, `graphAwareSettlementWhyHere`, `graphAwarePhenomenonNote`) beyond what the bug fix and audit check require.
- Touching `crisisPressureSentence`. Despite the historical association with the legacy pipeline, it is consumed by `lib/generator/prose/settlementProse.ts` (the Phase 6 settlement-prose surface) and stays.

---

## Architectural Notes

### Why now

Phase 6 wired the three graph-aware prose consumers (settlement hook, phenomenon note, settlement whyHere) and shipped behind feature flags. Phase 7 turned all three flags on, tuned the templates, and confirmed the graph-aware output is corpus-stable. The legacy `narrativeLines`/`narrativeThreads` were retained through Phases 1–7 as a parallel population so the master plan could ship one slice at a time without breaking the existing UI. With Phase 7's tuning landed and the corpus quality verified by the 20-sample review, the legacy population has no remaining role — the UI panel that consumed it (`PlayableLayerPanel`) is the last reader.

### Why fix the spine bug now (not earlier)

`composeSpineSummary` (`lib/generator/graph/render/renderSystemStory.ts:137-146`) has lowercased the leading character of the post-bridge clause since Phase 5 introduced the historicalBridge surface. The bug was hidden from existing tests because they use `toContain('Faction Name')` substring matches that find the un-clobbered first occurrence inside the bridge, not the second occurrence in the spine clause. Phase 7's 20-sample review surfaced it as a 20/20 corpus pattern, and Task 10 confirmed it fires for 4475/4800 systems in the deep audit. Phase 7 deferred the fix because:

1. The fix changes flag-OFF rendered prose for affected seeds — a deliberate softening of the Phase 3 "byte-identical flag-OFF" contract that Phase 8 is the right place to land.
2. The audit check `prose.lowercaseFactionMidSentence` cannot ship until the fix lands (would fail against ~93% of corpus).

Phase 8 lands both together. The contract softening is OK because Phase 8 is the deprecation phase — flag-OFF prose is expected to evolve as the legacy surface goes away.

### Determinism

No new RNG forks. The bug fix is a pure rewrite of one function. The deletion removes an existing fork (`'narrative-lines'` at `lib/generator/index.ts:3746`); seeds that hit code after this fork point will continue to produce identical output because no other code consumes the fork's downstream RNG state.

### proseUnchanged.test.ts contract

The Phase 3 snapshot (`lib/generator/graph/render/__tests__/proseUnchanged.test.ts`) records a small set of fields per seed:
- `systemName` (substantive prose)
- `settlementTagHooks` (substantive prose)
- `settlementWhyHere` (substantive prose)
- `phenomenonNotes` (substantive prose)
- `narrativeLineCount` (integer)
- `narrativeThreadCount` (integer)

Phase 8 affects this surface in two ways:

- **Task 1 (spine bug fix):** `spineSummary` is NOT in the snapshot. The four substantive prose surfaces remain byte-identical. Test passes unchanged.
- **Task 4 (narrative deletion):** removes the two integer count keys from both the surface object AND the snapshot file. The four substantive prose keys remain byte-identical. The snapshot file edit is a structural removal of two keys, not a regeneration of substantive flag-OFF prose.

Both edits preserve the spirit of the contract (the four substantive surfaces stay byte-identical) while acknowledging that the integer count keys are tied to deprecated fields and have to come out with them.

### phase6On.test.ts

Records `phenomenonNotes`, `settlementTagHooks`, `settlementWhyHere`. None of these read the legacy narrative pipeline, none read `spineSummary`. Phase 8 should not regenerate this snapshot. If it regenerates, that's an unexpected interaction — STOP and diagnose.

### Why one big deletion task vs. multiple small ones

Tasks 3 and 4 could in theory split across 5–6 mini-commits (UI panel, producer functions, helpers, type fields, type definitions, validation, export, tests). Each mini-commit would leave the type system in an inconsistent state — e.g., deleting the producer without deleting the field assignment yields a TypeScript error; deleting the field assignment without deleting the type field yields a different error. The plan keeps the deletion coherent: Task 3 removes the standalone UI consumer (independent of the type cascade), then Task 4 lands the entire type-system + consumer cascade as one commit. Sub-steps within Task 4 are ordered to minimize transient breakage during local development.

---

## File Structure

**Files modified:**
- `lib/generator/graph/render/renderSystemStory.ts` — Task 1 (`composeSpineSummary` rewrite).
- `lib/generator/graph/render/__tests__/renderSystemStory.test.ts` — Task 1 (regression test asserting post-bridge clause's proper-noun head is preserved).
- `scripts/audit-star-system-generator.ts` — Task 2 (new check).
- `components/PlayableLayerPanel.tsx` — Task 3 (surgical removal of the `NarrativeLinesPanel` export only; the file bundles three sibling panels and the other two stay).
- `index.tsx` — Task 3 (remove `<NarrativeLinesPanel system={system} />` mount).
- `types.ts` — Task 4 (delete `NarrativeLine`, `NarrativeThread`, `NarrativeBeat`, `NarrativeBeatKind` types; delete `narrativeLines` and `narrativeThreads` fields from `GeneratedSystem`).
- `lib/generator/index.ts` — Task 4 (delete `generateNarrativeLines`, `generateNarrativeThreads`, `hiddenCauseBeatText`, `choiceBeatText`, the corresponding RNG fork, and the field assignments).
- `lib/generator/validation.ts` — Task 4 (delete `validateNarrativeCoherence` + 4 dead validation codes; remove the call site in `validate(...)`).
- `lib/export/markdown.ts` — Task 4 (delete the `## Narrative Threads` / `## Narrative Lines` section; preserve the rest of the markdown export contract).
- `lib/generator/graph/render/__tests__/proseUnchanged.test.ts` + `__snapshots__/proseUnchanged.test.ts.snap` — Task 4 (remove `narrativeLineCount` and `narrativeThreadCount` keys from both).
- `__tests__/export.test.ts` — Task 4 (remove `narrativeLines`/`narrativeThreads` shape assertions).
- `__tests__/validation.test.ts` — Task 4 (remove `narrativeLines: []` / `narrativeThreads: []` from fixture).
- `__tests__/generator-determinism.test.ts` — Task 4 (the largest test rewrite; delete the cluster at lines 339-340, 843-893 that pins thread-pipeline behavior).
- `docs/NARRATIVE_GRAPH_PLAN.md` — Task 5 (mark Phase 8 done, update completed-so-far line).

**Files deleted:**
- `lib/generator/prose/__tests__/hiddenCauseBeatText.test.ts` — Task 4 (the test file's name already reads `'hiddenCauseBeatText (characterization, retired in Phase 8)'` — explicit retirement signal).

**Files unchanged:**
- All edge rule files.
- All template families.
- All other graph-aware prose consumers (`graphAwareSettlementHook`, `graphAwareSettlementWhyHere`, `graphAwarePhenomenonNote`).
- `lib/generator/prose/crisisShaping.ts` and `crisisPressureSentence` — consumed by Phase 6 settlement prose, stays.
- `phase6On.test.ts` and its snapshot.

---

## Conventions (from Phases 0–7, applied here)

- Run `npx tsc --noEmit` as part of every task's verification — ESLint does not catch TS module-resolution errors.
- Commit message style: lowercase `<type>: <subject>` (e.g., `fix:`, `feat:`, `refactor:`, `docs:`), with the standard `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer (use a HEREDOC for `git commit -m`).
- No comments in code unless the WHY is non-obvious.
- Push to `origin/develop` after every successful task.
- NEVER use `any`. Use `unknown`, specific interfaces, or union types.
- The `proseUnchanged.test.ts` contract evolves in this phase: the four substantive prose surfaces (`systemName`, `settlementTagHooks`, `settlementWhyHere`, `phenomenonNotes`) remain byte-identical; the two integer count keys are removed. Other surfaces (e.g., `spineSummary`) are NOT in the snapshot and are allowed to evolve in Task 1.
- The `phase6On.test.ts` snapshot must remain stable across all Phase 8 tasks. If it regenerates, STOP and diagnose.
- Per-task quality gate (every task runs all of these and confirms green):
  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  ```
  Plus `npm run build` and `npm run audit:star-system-generator:deep` at Task 5.

---

## Task 1: Fix the spine-summary lowercase-faction bug

**Why:** `composeSpineSummary` in `renderSystemStory.ts:137-146` unconditionally lowercases the leading character of the post-bridge clause. The original intent was to handle a leading article ("The records were edited..., the captains can't both..."), but it fires on `properNoun`-shaped slot heads too, producing `"... broke in the long quiet, kestrel Free Compact and Red Vane..."`. The 20-sample Phase 7 review found this in 20/20 systems; the deep-audit corpus has it in 4475/4800 systems. Phase 8 fixes the bug; Task 2 codifies the regression guard.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/renderSystemStory.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/renderSystemStory.test.ts`

- [ ] **Step 1: Read the current `composeSpineSummary` implementation**

  ```bash
  sed -n '130,150p' src/features/tools/star_system_generator/lib/generator/graph/render/renderSystemStory.ts
  ```

  Confirm the current implementation reads (line numbers may differ slightly):

  ```ts
  function composeSpineSummary(bridge: string, summary: string): string {
    if (summary.length === 0) return bridge
    const first = summary[0]
    const isUppercaseAlpha = first === first.toUpperCase() && first !== first.toLowerCase()
    const head = isUppercaseAlpha ? first.toLowerCase() : first
    return `${bridge} ${head}${summary.slice(1)}`
  }
  ```

- [ ] **Step 2: Write the failing regression test**

  Edit `src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/renderSystemStory.test.ts`. Find the existing CONTESTS-family / spineSummary block (search for `composeSpineSummary` or seek the section that exercises a CONTESTS spine edge with a historicalBridge). Add a test that drives the same scenario and asserts the post-bridge clause preserves the proper-noun head:

  ```ts
  it('composeSpineSummary preserves the proper-noun head of the post-bridge clause', () => {
    // Build a CONTESTS spine edge with two named-faction endpoints, plus a
    // historical edge whose summary forms the bridge "... broke in <era>,".
    // Drive renderSpineSummary through renderSystemStory and assert the bridge
    // is followed by "Kestrel ..." not "kestrel ...".
    const result = renderSystemStory(graph, [/* facts */])
    expect(result.spineSummary).not.toMatch(/, [a-z]/)
    expect(result.spineSummary).toMatch(/Kestrel Free Compact/)  // both occurrences capitalized
  })
  ```

  Use existing helper builders (the test file already constructs a `SystemRelationshipGraph` fixture for similar tests — reuse them). If the existing helpers don't expose CONTESTS+historicalBridge end-to-end, build a minimal fixture inline. Read the file's existing patterns (around line 154-249 per the survey) for fixture style.

- [ ] **Step 3: Run the test to confirm it fails**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/renderSystemStory.test.ts
  ```

  Expected: the new test fails with the spineSummary containing `, kestrel ...` (or equivalent lowercased proper-noun head). The other tests in the file continue to pass.

- [ ] **Step 4: Fix `composeSpineSummary`**

  Edit `src/features/tools/star_system_generator/lib/generator/graph/render/renderSystemStory.ts`. Replace `composeSpineSummary` with:

  ```ts
  // The bridge ends mid-sentence (',' or '—'), so the summary continues the same
  // sentence. Lowercase a leading article ("The"/"A"/"An") so it reads as a
  // continuation; otherwise preserve the head (proper-noun-shaped slots arrive
  // pre-capitalized via capitalizeForPosition and must stay that way).
  const LEADING_ARTICLE_PATTERN = /^(The|A|An)\s/

  function composeSpineSummary(bridge: string, summary: string): string {
    if (summary.length === 0) return bridge
    const articleMatch = summary.match(LEADING_ARTICLE_PATTERN)
    if (articleMatch !== null) {
      const lowered = articleMatch[1].toLowerCase()
      return `${bridge} ${lowered}${summary.slice(articleMatch[1].length)}`
    }
    return `${bridge} ${summary}`
  }
  ```

  This narrows the lowercasing rule to the ONLY case it was ever needed for — a leading English article. Proper nouns and other heads pass through with their original case intact. The pattern matches `The /A /An ` (with trailing space) so non-article identifiers that happen to start with `T`/`A` (e.g., `"Tianyi"`, `"Almach"`) are not mistakenly treated as articles.

- [ ] **Step 5: Run the new test and confirm it passes**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/renderSystemStory.test.ts
  ```

  Expected: PASS, all tests including the new regression case.

- [ ] **Step 6: Run the full graph render suite + the snapshot tests**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  ```

  Expected:
  - All tests pass.
  - `proseUnchanged.test.ts` byte-identical (the snapshot does NOT include `spineSummary`, so the four substantive prose surfaces remain unchanged; the two integer count keys also remain unchanged).
  - `phase6On.test.ts` snapshot stable (it does not include `spineSummary` either).

  If `proseUnchanged.test.ts` fails: STOP. The fix touched something it shouldn't have. Diagnose.
  If `phase6On.test.ts` regenerates: STOP. Same reason.

- [ ] **Step 7: Run quick audit and confirm errors=0**

  ```bash
  npm run audit:star-system-generator:quick
  ```

  Expected: errors=0, warnings=0. The bug fix should not introduce new findings.

- [ ] **Step 8: Static checks**

  ```bash
  npx tsc --noEmit
  npm run lint
  ```

  Both must be clean.

- [ ] **Step 9: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  fix: preserve proper-noun head in composeSpineSummary post-bridge clause

  The spine-summary joiner was unconditionally lowercasing the leading
  character of the post-bridge clause, intending to handle a leading
  article ("The records were edited..., the captains can't..."). When
  the post-bridge clause begins with a properNoun-shaped slot the rule
  clobbered the proper-noun head, producing ", kestrel Free Compact" /
  ", glasshouse Biosafety Compact" / ", orison Route Authority" mid-
  sentence. Phase 7's 20-sample review found this in 20/20 systems;
  the deep audit had it in 4475/4800.

  Narrow the rule to the only case it was ever for: a leading English
  article ("The"/"A"/"An" + space). Other heads pass through with their
  original case intact. Adds a regression test asserting the proper-noun
  head survives across the bridge join. Phase 7 carryover.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 2: Add `prose.lowercaseFactionMidSentence` audit check

**Why:** With Task 1's fix landed, the audit check Phase 7 Task 10 deferred can ship. The check codifies the antipattern so a future change to `composeSpineSummary` (or any new joiner that introduces the same shape) is caught at audit time rather than via 20-sample review.

**Files:**
- Modify: `scripts/audit-star-system-generator.ts`

- [ ] **Step 1: Locate the existing prose checks**

  ```bash
  grep -n "prose\.\(doublePreposition\|unstrippedArticleInBridge\|unresolvedSlot\)" scripts/audit-star-system-generator.ts
  ```

  Read the surrounding code to see how the existing per-system prose checks are structured (around line 600-790). The new check goes alongside.

- [ ] **Step 2: Add the check**

  In `scripts/audit-star-system-generator.ts`, add a constant near the other prose-check regex constants (find them by `grep -n "DOUBLE_PREPOSITION_PATTERN\|ARTICLE_IN_BRIDGE_PATTERN" scripts/audit-star-system-generator.ts`):

  ```ts
  // Detects spine-assembly joiner regressions where a post-bridge clause's
  // proper-noun head was lowercased mid-sentence. Anchors on bridge punctuation
  // (',' or '—' followed by a space) and a "lowercaseWord SpaceUppercaseWord"
  // pair — characteristic of "kestrel Free Compact" / "orison Route Authority".
  const LOWERCASE_FACTION_MID_SENTENCE_PATTERN = /[,—] [a-z][a-zA-Z]+ [A-Z]/
  ```

  Then add the per-system check inside `auditSystem` (or wherever the per-system audit body is — find by `grep -n "function auditSystem" scripts/audit-star-system-generator.ts`). Place near the other prose checks (line 600-720 region):

  ```ts
  if (LOWERCASE_FACTION_MID_SENTENCE_PATTERN.test(system.systemStory.spineSummary)) {
    addFinding(findings, 'error', seed, 'prose.lowercaseFactionMidSentence',
      `Spine summary has a lowercased proper-noun head mid-sentence: "${system.systemStory.spineSummary.slice(0, 160)}..."`)
  }
  ```

  Only scan `spineSummary`. The body paragraphs use a different joiner (`connectives.ts`) and the antipattern doesn't surface there.

- [ ] **Step 3: Run quick audit and confirm 0 findings**

  ```bash
  npm run audit:star-system-generator:quick
  ```

  Expected: errors=0, warnings=0. No new finding code surfaces.

- [ ] **Step 4: Run deep audit and confirm 0 findings**

  ```bash
  npm run audit:star-system-generator:deep
  ```

  Expected: errors=0. The check should produce 0 hits because Task 1 fixed the underlying bug. If the deep audit produces hits:
  - If <20 hits: investigate. Likely a corner case Task 1 missed (e.g., a non-article leading word that the regex shouldn't have flagged; tighten the regex). Fix and re-run.
  - If ≥20 hits: STOP. Task 1 did not fully fix the bug. Roll back to diagnose.

- [ ] **Step 5: Static checks + full test run**

  ```bash
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator
  ```

  All clean / pass.

- [ ] **Step 6: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: codify spine-summary lowercase-faction antipattern as audit check

  Phase 7 Task 10 deferred this check because the underlying bug fired
  for 4475/4800 systems in the deep audit. Phase 8 Task 1 fixed the bug
  in composeSpineSummary; this commit adds the prose.lowercaseFaction-
  MidSentence check that codifies the regression guard. The check
  scans spineSummary for "[,—] lowercaseWord SpaceUppercaseWord"
  patterns characteristic of a post-bridge clause whose proper-noun
  head was clobbered. 0 findings against the deep-audit corpus
  post-fix.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 3: Remove the legacy `NarrativeLinesPanel` UI consumer

**Why:** `PlayableLayerPanel.tsx` defines `NarrativeLinesPanel`, which iterates `system.narrativeThreads` and renders each thread's title, domains, and beats. With the graph-aware prose surfaces (settlement cards, phenomenon notes, system story) carrying the narrative load, the panel is the last reader of `narrativeThreads`. Phase 8 Task 4 cannot delete the type until this consumer is gone. Task 3 lands the panel removal as an independent UI commit, decoupled from the type-system cascade.

The Star System Generator UI already mounts the graph-aware prose via the system-story panel and the per-settlement / per-phenomenon panels; removing `NarrativeLinesPanel` does not leave a hole — the same narrative surface (system story, settlement hooks, phenomenon notes) is already visible.

**Files:**
- Modify: `src/features/tools/star_system_generator/components/PlayableLayerPanel.tsx` (the file bundles three sibling panels; remove only the `NarrativeLinesPanel` export — keep the other two)
- Modify: `src/features/tools/star_system_generator/index.tsx` (remove the mount)

- [ ] **Step 1: Verify the panel is the only place `narrativeThreads` is read by UI code**

  ```bash
  grep -rn "narrativeThreads\|narrativeLines\|NarrativeLinesPanel\|PlayableLayerPanel" src/features/tools/star_system_generator/components/ src/features/tools/star_system_generator/index.tsx
  ```

  Expected output: references in `PlayableLayerPanel.tsx` (the panel definition + import) and `index.tsx` (the mount and the `<NarrativeLinesPanel system={system} />` usage). No other UI files should reference the type.

- [ ] **Step 2: Locate and read the mount**

  ```bash
  grep -n "NarrativeLinesPanel\|PlayableLayerPanel" src/features/tools/star_system_generator/index.tsx
  ```

  Read the mount line and any neighboring conditional rendering. Confirm the panel is mounted unconditionally (not gated by a feature flag that would need separate cleanup).

- [ ] **Step 3: Remove the mount and the import**

  Edit `src/features/tools/star_system_generator/index.tsx`. Remove:
  - The `<NarrativeLinesPanel system={system} />` JSX line (line ~95 per the survey).
  - The `import { NarrativeLinesPanel } from './components/PlayableLayerPanel'` import statement (or whatever the actual import line reads — read it first).
  - Any conditional rendering or wrapping div that exists ONLY for the panel.

  Do NOT touch other panels' mounts.

- [ ] **Step 4: Surgically remove the `NarrativeLinesPanel` export from `PlayableLayerPanel.tsx`**

  `PlayableLayerPanel.tsx` is a multi-export file bundling three sibling panels. Open it and delete only the `NarrativeLinesPanel` function (and any imports that become unused once it is gone — e.g. types from `../types` referenced only by that panel). Leave the other two exports untouched. The file stays.

- [ ] **Step 5: Static checks**

  ```bash
  npx tsc --noEmit
  npm run lint
  ```

  Both must be clean. If `tsc --noEmit` complains about a missing reference somewhere else, search for it:

  ```bash
  grep -rn "PlayableLayerPanel\|NarrativeLinesPanel" src/
  ```

  and remove the stragglers.

- [ ] **Step 6: Run the UI test surface**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  ```

  Expected: pass. The panel was not snapshot-tested per the survey, so no test surface depends on it directly.

- [ ] **Step 7: Run the build**

  ```bash
  npm run build
  ```

  Expected: success. The static export must continue to work — `PlayableLayerPanel` is the only file deleted and its mount point is removed cleanly.

- [ ] **Step 8: Quality gates**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  ```

  All pass / unchanged.

- [ ] **Step 9: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  refactor: remove legacy NarrativeLinesPanel UI consumer

  PlayableLayerPanel.tsx was the last reader of system.narrativeThreads.
  With Phases 6-7 having shipped the graph-aware prose surfaces
  (settlement hooks, phenomenon notes, system story) the panel is no
  longer providing user value. Remove the file and its mount so Task 4
  can delete the underlying narrativeThreads / narrativeLines type
  surface without leaving a dangling consumer.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 4: Delete the legacy narrative producer pipeline + type surface

**Why:** With Task 3's UI consumer gone, the only remaining readers of `narrativeLines` / `narrativeThreads` are the validation walker, the markdown export, and the test surfaces that pinned the legacy behavior. Phase 8 deletes:

- The producer functions `generateNarrativeLines` and `generateNarrativeThreads` (`lib/generator/index.ts:3472-3617`).
- The helpers `hiddenCauseBeatText` (line 356) and `choiceBeatText` (line 430).
- The RNG fork `'narrative-lines'` (line 3746).
- The field assignments `narrativeLines` and `narrativeThreads` on the returned `GeneratedSystem`.
- The types `NarrativeLine` (`types.ts:261-271`), `NarrativeBeat` + `NarrativeBeatKind` (273-280), `NarrativeThread` (282-291), and the `narrativeLines`/`narrativeThreads` fields on `GeneratedSystem`.
- The validation function `validateNarrativeCoherence` and its 4 dead validation codes (`lib/generator/validation.ts:78-81, 592-668, 684`).
- The markdown-export section `## Narrative Threads` / `## Narrative Lines` (`lib/export/markdown.ts:35-52`).
- The dedicated test file `lib/generator/prose/__tests__/hiddenCauseBeatText.test.ts` (already self-labeled `(characterization, retired in Phase 8)`).
- The test fixture entries and assertions in `__tests__/export.test.ts`, `__tests__/validation.test.ts`, `__tests__/generator-determinism.test.ts`.
- The two integer count keys (`narrativeLineCount`, `narrativeThreadCount`) from `proseUnchanged.test.ts` and its snapshot.

This is a single coherent commit because the type-system + producer + consumer surfaces are all interlocked — deleting any one in isolation breaks the build.

**Files:**
- Modify: `src/features/tools/star_system_generator/types.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/validation.ts`
- Modify: `src/features/tools/star_system_generator/lib/export/markdown.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/__snapshots__/proseUnchanged.test.ts.snap`
- Modify: `src/features/tools/star_system_generator/__tests__/export.test.ts`
- Modify: `src/features/tools/star_system_generator/__tests__/validation.test.ts`
- Modify: `src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts`
- Delete: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/hiddenCauseBeatText.test.ts`

### Order of edits (to minimize transient breakage during local dev)

The implementer should make all edits before running tests. The build will be transiently broken during the edits themselves — that is fine because no commit is made until all edits land. Order:

1. Producer pipeline (`lib/generator/index.ts`).
2. Field assignments (same file, `GeneratedSystem` return).
3. Type definitions (`types.ts`).
4. Validation (`validation.ts`).
5. Export markdown (`markdown.ts`).
6. Test fixtures + assertions.
7. Snapshot file (last — depends on the test changes).

Then run all tests once, verify green, commit.

- [ ] **Step 1: Confirm no other references exist**

  ```bash
  grep -rn "narrativeLines\|narrativeThreads\|NarrativeLine\b\|NarrativeThread\b\|NarrativeBeat\b\|hiddenCauseBeatText\|choiceBeatText\|generateNarrativeLines\|generateNarrativeThreads\|validateNarrativeCoherence" src/ scripts/ --include="*.ts" --include="*.tsx"
  ```

  Read the output. The expected sites (per Survey 1) are:
  - `types.ts` (type defs + GeneratedSystem fields)
  - `lib/generator/index.ts` (producers, helpers, fork, field assignments)
  - `lib/generator/validation.ts` (validateNarrativeCoherence + codes + caller)
  - `lib/export/markdown.ts` (export section)
  - `__tests__/export.test.ts`, `__tests__/validation.test.ts`, `__tests__/generator-determinism.test.ts` (test surfaces)
  - `lib/generator/graph/render/__tests__/proseUnchanged.test.ts` (the two count keys)
  - `lib/generator/prose/__tests__/hiddenCauseBeatText.test.ts` (file to delete)

  If grep finds references OUTSIDE this list, STOP. The survey was incomplete; investigate before proceeding.

- [ ] **Step 2: Delete the producer pipeline**

  In `src/features/tools/star_system_generator/lib/generator/index.ts`:

  1. Delete the `hiddenCauseBeatText` function (line ~356; it is `export`ed). Read the function and its surrounding context first to understand any non-obvious dependencies.
  2. Delete the `choiceBeatText` function (line ~430).
  3. Delete the `generateNarrativeLines` function (line ~3472-3539).
  4. Delete the `generateNarrativeThreads` function (line ~3540-3617).
  5. Delete the `const narrativeLines = generateNarrativeLines(rootRng.fork('narrative-lines'), options, narrativeFacts)` line (~3746).
  6. Delete the `const narrativeThreads = generateNarrativeThreads(narrativeLines, narrativeFacts)` line (~3747).
  7. In the `GeneratedSystem` return literal (~3776-3777), delete the `narrativeLines,` and `narrativeThreads,` properties.

  After these edits, `index.ts` compiles cleanly only if the types in `types.ts` are also updated — proceed to the next step before running `tsc`.

- [ ] **Step 3: Delete the type definitions**

  In `src/features/tools/star_system_generator/types.ts`:

  1. Delete the `NarrativeLine` interface (line ~261-271) and any `export type` re-exports of it.
  2. Delete the `NarrativeBeatKind` union and the `NarrativeBeat` interface (line ~273-280).
  3. Delete the `NarrativeThread` interface (line ~282-291).
  4. In `GeneratedSystem` (around line 317-318), delete the `narrativeLines: NarrativeLine[]` and `narrativeThreads: NarrativeThread[]` fields.

  Verify with grep that no other type re-exports the deleted types:

  ```bash
  grep -n "NarrativeLine\|NarrativeThread\|NarrativeBeat" src/features/tools/star_system_generator/types.ts
  ```

  Expected: no remaining matches.

- [ ] **Step 4: Delete `validateNarrativeCoherence` and dead codes**

  In `src/features/tools/star_system_generator/lib/generator/validation.ts`:

  1. Delete the four validation codes from the codes block (~line 78-81): `narrativeNoConcreteFact`, `narrativeUnknownFactRef`, `narrativeUnresolvedSlot`, `narrativeThreadMissingBeat`. Each is a single line in a discriminated-union or const-array structure — read first, delete cleanly.
  2. Delete the `validateNarrativeCoherence` function (~line 592-668).
  3. In the main `validate(...)` function (~line 684), delete the `...validateNarrativeCoherence(system)` spread or call.

  Read the surrounding code to ensure the deletions don't leave a trailing comma or empty array. Adjust syntactically.

- [ ] **Step 5: Delete the markdown-export narrative section**

  In `src/features/tools/star_system_generator/lib/export/markdown.ts`:

  Delete the `## Narrative Threads` block (lines ~35-46) and the `## Narrative Lines` fallback block (lines ~47-52). Read the file first to confirm the exact line range and ensure neighboring sections (e.g., the system-story export, the settlement export) are untouched.

  After deletion, the `markdown.ts` export contract loses two sections and otherwise stays identical. The `## System Story`, `## Settlements`, `## Phenomena`, and other sections must remain unchanged.

- [ ] **Step 6: Update test fixtures and assertions**

  **`src/features/tools/star_system_generator/__tests__/export.test.ts`:**

  Find lines ~47-48:
  ```ts
  expect(parsed.narrativeLines).toHaveLength(system.narrativeLines.length)
  expect(parsed.narrativeThreads).toHaveLength(system.narrativeThreads.length)
  ```

  Delete both lines.

  **`src/features/tools/star_system_generator/__tests__/validation.test.ts`:**

  Find lines ~123-124 (fixture):
  ```ts
  narrativeLines: [],
  narrativeThreads: [],
  ```

  Delete both lines.

  **`src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts`:**

  This is the largest test rewrite. Find each of these line clusters and delete entirely:
  - Line ~339-340: count assertions (`toBeGreaterThan(0)` style on `narrativeLines.length` / `narrativeThreads.length`).
  - Line ~843-893: the deep-assertion block on thread titles, domains, beats, biased generation. Delete the whole `describe('narrative threads', ...)` block (or whatever the surrounding block-name reads).

  Read the surrounding context to identify the right block boundaries — don't accidentally delete an adjacent unrelated test cluster. The cluster is identifiable by all assertions referencing `system.narrativeLines` or `system.narrativeThreads`.

  After the deletions, run a grep to confirm no leftover references:

  ```bash
  grep -n "narrativeLines\|narrativeThreads\|NarrativeLine\|NarrativeThread" src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts
  ```

  Expected: zero matches.

  Do NOT replace the deleted thread tests with graph-equivalent tests in this commit. Phases 4-7 already added comprehensive tests for the graph pipeline; the thread tests pinned the legacy producer's behavior, which is now gone, so they have no equivalent.

- [ ] **Step 7: Update the proseUnchanged surface object and snapshot**

  **`src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts`:**

  Find the surface-object construction (around line 24-25 per the survey):

  ```ts
  narrativeLineCount: sys.narrativeLines.length,
  narrativeThreadCount: sys.narrativeThreads.length,
  ```

  Delete both lines. The surface object loses two integer keys; the four substantive prose keys (`systemName`, `settlementTagHooks`, `settlementWhyHere`, `phenomenonNotes`) remain unchanged.

  **`src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/__snapshots__/proseUnchanged.test.ts.snap`:**

  For each seeded entry in the snapshot file, delete the two lines containing `"narrativeLineCount":` and `"narrativeThreadCount":`. This is a structural removal of two integer keys per seed; the remaining keys (the four substantive prose surfaces) stay byte-identical.

  Use `git diff` after the edit to confirm the only deletions are the two count keys per seed. Any other diff shape means something else changed unexpectedly.

- [ ] **Step 8: Delete the dedicated `hiddenCauseBeatText` test file**

  ```bash
  git rm src/features/tools/star_system_generator/lib/generator/prose/__tests__/hiddenCauseBeatText.test.ts
  ```

  The file's describe-block name `'hiddenCauseBeatText (characterization, retired in Phase 8)'` is the explicit retirement signal — Phase 8 honors it.

- [ ] **Step 9: Run the full test suite**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  ```

  Expected: all tests pass. The deleted test file should disappear from the run; the deleted test clusters in `generator-determinism.test.ts` should leave the remaining clusters untouched.

  If a test fails, the most likely causes are:
  - A leftover reference to the deleted types in a fixture builder. Grep for it and clean up.
  - A snapshot file edit that inadvertently changed a substantive prose key. Inspect the snapshot diff and revert the unintended change.

- [ ] **Step 10: Static checks**

  ```bash
  npx tsc --noEmit
  npm run lint
  ```

  Both must be clean. Type errors at this stage usually mean the type deletion missed a reference; grep for the type name and clean up.

- [ ] **Step 11: Verify proseUnchanged contract (the four substantive surfaces) is preserved**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

  Expected: PASS. The two count keys are gone (matching the snapshot edit); the four substantive prose surfaces remain byte-identical.

  Inspect the snapshot diff explicitly:

  ```bash
  git diff src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/__snapshots__/proseUnchanged.test.ts.snap
  ```

  Expected diff shape: only deletions of `narrativeLineCount` / `narrativeThreadCount` lines per seed. Any other modification (different prose strings, added/removed seeds) means something else moved unexpectedly — STOP and investigate.

- [ ] **Step 12: Verify phase6On snapshot is unchanged**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  ```

  Expected: PASS, no snapshot regeneration.

- [ ] **Step 13: Run the build**

  ```bash
  npm run build
  ```

  Expected: success. The full Next.js static-export build must continue to work after the deletion.

- [ ] **Step 14: Audit**

  ```bash
  npm run audit:star-system-generator:quick
  ```

  Expected: errors=0, warnings=0. The audit script does not consume the deleted types.

- [ ] **Step 15: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  refactor: remove legacy narrative producer pipeline and type surface

  Phases 0-7 retained narrativeLines / narrativeThreads as a parallel
  population so each phase could ship one slice without breaking the
  existing UI. Phase 6 wired the graph-aware prose consumers; Phase 7
  Task 3 turned them on; the 20-sample review confirmed the graph
  output carries the narrative load. Phase 8 Task 3 removed the last
  UI reader.

  Delete:
  - generateNarrativeLines, generateNarrativeThreads (producers)
  - hiddenCauseBeatText, choiceBeatText (helpers)
  - the rng.fork('narrative-lines') call site
  - narrativeLines, narrativeThreads field assignments on GeneratedSystem
  - NarrativeLine, NarrativeThread, NarrativeBeat, NarrativeBeatKind types
  - validateNarrativeCoherence + 4 dead validation codes
  - the markdown-export ## Narrative Threads / ## Narrative Lines section
  - the dedicated hiddenCauseBeatText characterization test file
  - the legacy generator-determinism thread-pinning test cluster
  - narrativeLineCount / narrativeThreadCount keys from proseUnchanged
    snapshot (the four substantive prose surfaces stay byte-identical)

  proseUnchanged.test.ts continues to pin systemName / settlementTagHooks
  / settlementWhyHere / phenomenonNotes byte-identically. phase6On
  snapshot unchanged. Audit clean.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 5: Final verification + master plan update

**Files:**
- Modify: `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_PLAN.md`

- [ ] **Step 1: Full quality bar**

  Run all of these and confirm green:

  ```bash
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run audit:star-system-generator:quick
  npm run audit:star-system-generator:deep
  npm run build
  ```

  Capture:
  - Test count (passing / total).
  - Audit-deep numbers: errors, warnings, prose.unresolvedSlot count, whyHere %, tagHook %, phenomenonNote %, empty-story %.
  - Confirm `prose.lowercaseFactionMidSentence` is now present in the codified-checks list and produces 0 findings.
  - Build success.

- [ ] **Step 2: Confirm `proseUnchanged.test.ts` four substantive surfaces are byte-identical against pre-Phase-8 baseline**

  ```bash
  git show 78484a8:src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/__snapshots__/proseUnchanged.test.ts.snap > /tmp/pre-phase8-snapshot.snap
  diff /tmp/pre-phase8-snapshot.snap src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/__snapshots__/proseUnchanged.test.ts.snap
  ```

  Expected diff: only the `narrativeLineCount` and `narrativeThreadCount` lines removed per seed. The four substantive prose surfaces (`systemName`, `settlementTagHooks`, `settlementWhyHere`, `phenomenonNotes`) remain byte-identical line-for-line.

  If the diff shows changes to substantive prose: STOP. A prior task introduced unexpected drift.

- [ ] **Step 3: Re-do a 5-seed corpus spot-check**

  Generate a small corpus (5 seeds spanning the matrix; reuse 5 of the 20 Phase 7 review seeds):

  ```bash
  node --import tsx/esm -e "
  import('./src/features/tools/star_system_generator/lib/generator/index.ts').then(m => {
    const seeds = [
      { seed: 'phase7-review-frontier-balanced-normal-1', distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal' },
      { seed: 'phase7-review-realistic-balanced-crowded-3', distribution: 'realistic', tone: 'balanced', gu: 'normal', settlements: 'crowded' },
      { seed: 'phase7-review-frontier-cinematic-fracture-1', distribution: 'frontier', tone: 'cinematic', gu: 'fracture', settlements: 'normal' },
      { seed: 'phase7-review-realistic-astronomy-low-1', distribution: 'realistic', tone: 'astronomy', gu: 'low', settlements: 'sparse' },
      { seed: 'phase7-review-frontier-balanced-hub-1', distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'hub' },
    ]
    const flags = { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true }
    for (const cfg of seeds) {
      const sys = m.generateSystem({ ...cfg, graphAware: flags })
      console.log('=== seed', cfg.seed, '===')
      console.log('SPINE:', sys.systemStory.spineSummary)
      console.log()
    }
  })
  " > /tmp/phase8-spotcheck.txt
  ```

  Spot-check:
  - Zero spine summaries contain `, lowercaseword UpperCase` (Task 1 fix verified).
  - Spine summaries that were "kestrel Free Compact" pre-Phase-8 are now "Kestrel Free Compact" post-Phase-8.
  - The systemStory body and hooks render normally; nothing else regressed.

  Do NOT commit `/tmp/phase8-spotcheck.txt`. It is an artifact.

- [ ] **Step 4: Phase 8 acceptance checklist**

  Verify each:
  - Spine-summary lowercase-faction bug fixed (Task 1) ✓
  - `prose.lowercaseFactionMidSentence` audit check present, 0 findings (Task 2) ✓
  - `NarrativeLinesPanel` UI consumer removed (Task 3) ✓
  - Producer pipeline (`generateNarrativeLines`, `generateNarrativeThreads`, `hiddenCauseBeatText`, `choiceBeatText`) deleted (Task 4) ✓
  - Type surface (`NarrativeLine`, `NarrativeThread`, `NarrativeBeat`, fields on `GeneratedSystem`) deleted (Task 4) ✓
  - Validation `validateNarrativeCoherence` + 4 codes deleted (Task 4) ✓
  - Markdown export's narrative section deleted (Task 4) ✓
  - `hiddenCauseBeatText.test.ts` file deleted (Task 4) ✓
  - `proseUnchanged.test.ts` snapshot — four substantive prose surfaces byte-identical, two count keys removed (Task 4) ✓
  - `phase6On.test.ts` snapshot unchanged across all Phase 8 tasks ✓
  - Audit errors=0, warnings=0, prose.unresolvedSlot=0 ✓
  - Full build succeeds ✓

- [ ] **Step 5: Update master plan**

  Edit `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_PLAN.md`:

  1. Phase 8 row (line 446): change the Status cell from `⏳ Not yet planned` to `✅ Done — [plan](./NARRATIVE_GRAPH_PHASE_8_PLAN.md)`.

  2. The "Total" / "Completed so far" line (around line 448): update from `Phases 0, 1, 2, 3, 4, 5, 6, 7 (~8.5 weeks of plan-equivalent effort)` to `Phases 0, 1, 2, 3, 4, 5, 6, 7, 8 (~9 weeks of plan-equivalent effort)`.

  3. If the master plan has any prose elsewhere referring to `narrativeLines` / `narrativeThreads` / `hiddenCauseBeatText` as "RETAINED (deprecated, populated for 1 release)" or similar — update to reflect that they have now been deleted.

     Search:
     ```bash
     grep -n "narrativeLines\|narrativeThreads\|hiddenCauseBeatText\|RETAINED" src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_PLAN.md
     ```

     Reword each match minimally — say "RETIRED in Phase 8" or delete the obsolete sentence. Don't restructure the doc.

  4. Don't add new rows. Phase 8 is the last row.

- [ ] **Step 6: Commit master plan update**

  ```bash
  git commit -m "$(cat <<'EOF'
  docs: mark phase 8 complete in master narrative graph plan

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Spec coverage check (self-review)

| Spec requirement (Phase 8 row + Phase 7 carryover) | Task |
|---|---|
| Deprecate `narrativeLines` / `narrativeThreads` (remove parallel population) | Task 4 (full deletion, not soft-deprecation) |
| Delete `hiddenCauseBeatText` / `choiceBeatText` | Task 4 |
| Phase 7 carryover: spine-summary lowercase-faction bug | Task 1 |
| Phase 7 carryover: ship `prose.lowercaseFactionMidSentence` audit check | Task 2 |
| `index.ts` clean of dead narrative code (master plan's Phase 8 acceptance criterion) | Task 4 |
| `proseUnchanged.test.ts` four substantive surfaces preserved | Verified after Tasks 1, 4, 5 |
| `phase6On.test.ts` snapshot unchanged | Verified after every task |

**Estimated commits:** 5–6 (one per task plus the master-plan-update commit).

**Estimated effort:** ~0.5 week (matches the master plan's Phase 8 budget).

---

## Risks & deferred items

- **Flag-OFF prose contract softening.** Task 1 changes flag-OFF rendered `spineSummary` for affected seeds. The `proseUnchanged.test.ts` snapshot doesn't include `spineSummary` so the test still passes byte-identically, but the rendered prose seen by users IS different. This is the first deliberate flag-OFF prose change since Phase 3. Phase 8 is the right place — it's the deprecation phase. Document explicitly in the Task 1 commit message.

- **Test fixture rewrite scope.** Task 4's edits to `__tests__/generator-determinism.test.ts` are the largest single cluster of test deletions. The deleted assertions pinned the legacy producer's exact thread titles, domains, beat text, and biased-generation behavior — none of which has a graph-equivalent. Don't try to recreate them. The graph pipeline has its own comprehensive tests under `lib/generator/graph/__tests__/`.

- **Markdown export contract change.** Task 4 removes the `## Narrative Threads` and `## Narrative Lines` sections from the markdown export. Any downstream consumer of the markdown export (e.g., a static site that links to it, an external tool that scrapes the section headers) will see a contract change. Master plan doesn't list any such consumer — but if one exists outside this repo, that's a separate-coordination concern flagged here.

- **Multiple consumers of `narrativeFacts` (NOT to confuse with `narrativeLines`).** `narrativeFacts` is a different field — it's the underlying fact ledger, consumed by the graph pipeline, the renderer, and the validation layer. Phase 8 does NOT touch `narrativeFacts`. Be careful during the deletion to leave it alone.

- **Snapshot edit discipline.** Task 4 Step 7 asks the implementer to manually edit the `proseUnchanged.test.ts.snap` file to remove two integer keys per seed. This is unusual — most snapshot edits are regenerated by Vitest with `-u`. The manual edit is preferred here because it preserves the four substantive prose keys' bytes exactly; regenerating with `-u` could mask an unintended drift in those surfaces. If Vitest complains about the manual edit (e.g., "snapshot mismatch"), inspect the diff carefully before falling back to `-u`. The expected manual diff is small: 2 lines removed per seed, no other changes.

- **Phase 8 candidates from `PHASE_7_SAMPLE_REVIEW.md` that are NOT in scope.** The review's aggregated findings table flags tone-aware spine, gu-aware spine, and others as Phase 8 candidates. None of those are in the master plan's Phase 8 row description, and each is a substantive new feature, not a deprecation. They are NOT Phase 8 work. Capture them as future-tuning candidates in the review doc but do not implement.

---

## Outputs the next phase relies on

After Phase 8:
- `narrativeLines`, `narrativeThreads`, `NarrativeBeat`, `hiddenCauseBeatText`, `choiceBeatText` are gone. Future plans must use the graph-aware surfaces.
- `prose.lowercaseFactionMidSentence` audit check is live — any future spine-assembly joiner that re-introduces the antipattern is caught at audit time.
- `composeSpineSummary` has the narrowed lowercase-article rule. If a future template introduces a different leading shape (e.g., a numeric prefix), the rule may need extending — but the test added in Task 1 will catch any regression of the proper-noun preservation guarantee.
- `proseUnchanged.test.ts` is the long-term flag-OFF anchor for the four substantive prose surfaces (system name, settlement hooks, settlement whyHere, phenomenon notes). Future phases keep that contract.
- The master plan reaches its planned end state. Further work (tone-aware spine, gu-aware spine, pipeline reorder) belongs to new plans, not new phases of this one.
