# Narrative Graph Phase 7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out tuning carryovers from Phases 3, 5, and 6; run a structured 20-sample manual cohesion review; and codify the issues that surface as new audit checks. Phase 7 does not add new pipeline stages or template families — it polishes the surfaces Phases 0–6 produced. Default behavior (flag-off byte-identical, flag-on snapshot stable) is preserved across every task: `proseUnchanged.test.ts` and `phase6On.test.ts` keep passing without modification, with one explicit exception (the era pool changes in Task 2 will require a `phase6On.test.ts` snapshot regeneration when an affected seed contains a historical bridge — captured in that task).

**Architecture:** Phase 7 of the [Narrative Graph Plan](./NARRATIVE_GRAPH_PLAN.md). Phases 0–6 are merged on `develop`. Phase 7 touches three layers: (1) historical-edge surfaces (`history.ts`, `eras.ts`, the 6 historical-bridge templates); (2) the spine selector / settlement-incident eligibility for downstream consumers; (3) audit detection. No new edge types, no new template families, no new orchestration stages.

**Tech Stack:** TypeScript (strict, `isolatedModules: true`), Vitest, ESLint, existing audit scripts.

**Source spec:** `NARRATIVE_GRAPH_PLAN.md` Phase 7 row at line 445 — the carryover list (a)–(g) plus the Phase 3 `spineSummary`/empty-story carryover.

**Branch:** Work on `develop`. Phases 0–6 are merged. Push to `origin/develop` after every successful task so progress is visible.

**Scope:**
- Task 1: Generate 20 sample systems + structured manual review doc.
- Task 2: Carryover (a) — fix CONTRADICTS / CONTROLS / CONTESTS / DEPENDS_ON / SUPPRESSES historicalBridge + era pool collision (avoid "during before the quarantine").
- Task 3: Carryover (b) — export `HISTORICAL_ELIGIBLE_TYPES` from `history.ts`, refactor audit to consume it.
- Task 4: Carryover (c) — rotate historical-edge body variants in `renderHistoricalSummary` (currently always picks `family.body[0]`).
- Task 5: Carryover (d) — align DESTABILIZES `historicalBridge.expects.subject` from `properNoun` to `nounPhrase`.
- Task 6: Carryover (e) — resolve `pickHistoricalEndpoints` (delete dead-identical branch, tighten return type to non-nullable).
- Task 7: Carryover (g) — investigate the 45% whyHere gap, fix the rule files where appropriate or document the realistic ceiling.
- Task 8: Carryover (f) — pick the settlementHookSynthesis spine-eligibility path (broaden, separate index, or document) and implement.
- Task 9: Empty-story rate decision (Phase 3 carryover) — characterize the 6.77% and either tune or document.
- Task 10: Add new audit checks codifying review findings + carryover regressions.
- Task 11: Final verification + master plan update.

**Out of scope:**
- Phase 8 (deprecating `narrativeLines`/`narrativeThreads`, deleting `hiddenCauseBeatText`/`choiceBeatText`).
- Pipeline reorder (settlements → graph → prose) — still deferred per Phase 6 rationale.
- New edge types, new edge rules, new template families.
- Custom era pools per setting.
- LLM-rendered prose alternatives.
- New `GenerationOptions` fields. The Phase 6 `graphAware` flag struct stays as-is.
- Anything that requires regenerating the Phase 3 `proseUnchanged.test.ts` snapshot. That snapshot pins flag-OFF behavior; nothing in Phase 7 should affect flag-OFF prose.

---

## Architectural Notes

### Why a structured 20-sample review at this stage

Phases 0–6 built the graph and downstream consumers in isolation, each with its own automated test surface. None of them validate "does the prose read well across systems." The 20-sample review is the first time a human (or a review-only subagent) reads end-to-end output in volume — repeated phrasings, awkward connectives, unidiomatic article choices, doubled nouns the grammar guard misses, era/preposition collisions that no unit test catches.

The review is *structured* rather than free-form: each sample produces a bounded text artifact (spineSummary + body + hooks + per-settlement and per-phenomenon prose surfaces) and the reviewer rates each surface against a checklist. Findings get categorized:

- **In-Phase-7 fix** — small, well-scoped, surfaces a regression or a known-broken pattern. Example: era/preposition collision (carryover a).
- **Phase 8 candidate** — touches deprecation surface (`narrativeLines`/`narrativeThreads`, `hiddenCauseBeatText`).
- **Future-tuning candidate** — needs a separate plan (e.g., new edge types, new rule predicates).

The output of Task 1 (the review doc) drives Task 10's audit additions: every Phase 7 fix gets a corresponding audit check codifying the antipattern, so the same issue cannot regress later.

### Carryovers are independent and can ship in any order

Each carryover (a)–(g) is independent — no carryover depends on another's data. The plan orders them roughly by complexity and risk:

- **Tasks 2, 5, 6** are micro-changes (1–2 file edits, isolated tests, no behavior change at the corpus level).
- **Tasks 3, 4** affect rendered prose. Task 4 (variant rotation) is the most likely source of `phase6On.test.ts` snapshot drift.
- **Tasks 7, 8** are open-ended (investigation, design choice). Task 7 may turn into a small rule-file fix; Task 8 picks one of three documented options.
- **Task 9** is open-ended diagnostic; the plan specifies a decision tree but defers the choice to the implementer's reading of the data.

### Phase 6 trigger-rate carryovers — why we may end up documenting rather than fixing

Phase 6 surfaced two trigger-rate gaps:

- **whyHere (54.9% vs target 70–90%)** — Task 7. Likely root cause: settlements whose `bodyId` resolves to a body without a `displayName` matching the `isNamedEntity` heuristic (`/[A-Z][a-z]+/`), or settlements that don't surface a GU resource dependency in their `function`/`anchorDetail` facts.
- **tagHook (0% vs target 40–60%)** — Task 8. Root cause: `score.ts:isNamedEntity` excludes `guResource`, so the most common settlement-incident DEPENDS_ON edges never reach `spineEdgeIds`.

Both are fixable but introduce design tradeoffs:

- Fixing whyHere by relaxing the rule predicates (e.g., emitting HOSTS for settlements on unnamed bodies) risks producing prose that names "Body-3" — uglier than the fallback semicolon list.
- Fixing tagHook by relaxing `isNamedEntity` to allow `guResource` dilutes the spine's "named-on-named" semantic — the spine was designed to surface dramatic relationships between proper-named entities, and `guResource` displayNames are common nouns ("chiral ice belt") not proper nouns.

Phase 7 is the right place to make these calls based on the 20-sample review. If the review shows that:
- Most "missing whyHere" settlements have legitimate prose-quality reasons to fall back, document 54.9% as the realistic ceiling and adjust the audit's target band.
- Most "missing tagHook" settlements would meaningfully benefit from a graph-aware closing sentence, carve a separate `settlementSpineEdgeIds` index (lowest-risk option that preserves spine semantics).

Both decisions should be informed by data, not aesthetic preference. Task 7 and Task 8 each include a "decision criteria" subsection with concrete numeric thresholds.

### Determinism

Phase 7 introduces no new RNG forks. Every existing fork (`'rules'`, `'body'`, `'hooks'`, `'history'`, `'story'`, `'graph-prose'`) is preserved. Task 4's variant rotation uses a deterministic hash of the present-edge ID — no RNG draw — so determinism is unaffected.

### Audit check additions are review-driven

Tasks 1–9 will surface specific antipatterns. Task 10 codifies whichever ones the reviewer finds. The plan can't enumerate every check upfront — Task 10's intake comes from Task 1's findings doc plus the carryover fixes that produce well-defined antipatterns (e.g., era/preposition collision becomes a deterministic check on rendered `spineSummary` substrings).

---

## File Structure

**New files (created in this phase):**
- `docs/PHASE_7_SAMPLE_REVIEW.md` — structured findings doc, one section per seed (Task 1).
- `lib/generator/graph/__tests__/historicalRotation.test.ts` — variant-rotation regression test (Task 4).
- Possibly: `lib/generator/graph/settlementSpineEligibility.ts` — separate eligibility index for settlement-incident spine edges (Task 8 only if Option 2 is chosen).

**Files modified:**
- `lib/generator/graph/data/eras.ts` — Task 2 (era pool restructured to be preposition-self-contained, OR per-era preposition table added).
- `lib/generator/graph/render/templates/contradictsTemplates.ts` — Task 2 (bridge template revised).
- `lib/generator/graph/render/templates/controlsTemplates.ts` — Task 2.
- `lib/generator/graph/render/templates/contestsTemplates.ts` — Task 2.
- `lib/generator/graph/render/templates/dependsOnTemplates.ts` — Task 2.
- `lib/generator/graph/render/templates/suppressesTemplates.ts` — Task 2.
- `lib/generator/graph/render/templates/destabilizesTemplates.ts` — Task 5 (bridge `expects.subject` aligned).
- `lib/generator/graph/history.ts` — Tasks 3, 4, 6 (export `HISTORICAL_ELIGIBLE_TYPES`, rotate variants, simplify `pickHistoricalEndpoints`).
- `lib/generator/graph/score.ts` OR new file — Task 8 (settlement-spine eligibility).
- `lib/generator/graph/rules/hostsRules.ts`, `dependsOnRules.ts` — Task 7 only if rule-file gaps are confirmed.
- `scripts/audit-star-system-generator.ts` — Task 10 (new checks), Task 3 (consume exported eligibility).
- `lib/generator/graph/__tests__/__snapshots__/phase6On.test.ts.snap` — likely regenerated in Task 2 and/or Task 4 if a snapshotted seed contains a historical bridge or rotated variant.
- `docs/NARRATIVE_GRAPH_PLAN.md` — Task 11 (mark Phase 7 done; add any Phase 8 carryovers found in review).

**Files unchanged:**
- `types.ts` — no `GenerationOptions` change.
- `lib/generator/index.ts` — no orchestration change.
- `lib/generator/prose/*` — no Phase 6 consumer change.
- All edge rule files except those touched by Task 7.
- The 12 edge template families' `body` and `hook` arrays (only `historicalBridge` lines change in Task 2 + Task 5; `body` arrays are unchanged).
- `proseUnchanged.test.ts` — flag-off behavior is unchanged across Phase 7.

---

## Conventions (from Phases 0–6, applied here)

- Run `npx tsc --noEmit` as part of every task's verification — ESLint does not catch TS module-resolution errors.
- If a plan-prescribed test assertion contradicts actual behavior, correct the test to match real output and document the deviation in the report.
- Commit message style: `<type>: <subject>` lowercase, with the standard `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer (use a HEREDOC for `git commit -m`).
- No comments in code unless WHY is non-obvious.
- Push to `origin/develop` after each successful task.
- NEVER use `any`. Use `unknown`, specific interfaces, or union types.
- Templates and prose strings are content. Reviewer's bar is "natural English, no unresolved slots, no doubled-noun output, no setting-incongruity"; not "matches plan example string verbatim."
- The Phase 3 `proseUnchanged.test.ts` MUST keep passing across every Phase 7 task. Default flags (false) preserve Phase 5 output, and Phase 7 makes no flag-off changes.
- The Phase 6 `phase6On.test.ts` snapshot may legitimately regenerate in Task 2 (era-pool changes) and Task 4 (variant rotation). When that happens, eyeball the new snapshot for sanity before committing — the diff should only show historical-bridge wording changes (Task 2) or distinct historical-body wording rather than always-the-same body[0] (Task 4). Any other changes mean something else moved unexpectedly.

---

## Task 1: Generate 20 sample systems + structured manual review doc

**Why:** Phase 7's tuning work is data-driven. Before touching templates or rules, produce a corpus the reviewer can actually read, organized so issues are easy to spot. The output of this task — a structured findings doc — drives Tasks 2, 7, 8, 9, and 10. Issues found that don't fit Phase 7 scope get captured for Phase 8 or future planning.

**Files:**
- Create: `src/features/tools/star_system_generator/docs/PHASE_7_SAMPLE_REVIEW.md`

- [ ] **Step 1: Pick the 20 seeds**

  Choose seeds that span the corpus matrix to maximize variety:
  - 5 seeds × `frontier` distribution × all 4 settlement densities + 1 extra (`sparse`, `normal`, `crowded`, `hub`, `normal`).
  - 5 seeds × `realistic` distribution × all 4 densities + 1 extra.
  - 5 seeds × varying `tone` (`balanced`, `astronomy`, `cinematic` mix).
  - 5 seeds × varying `gu` (`low`, `normal`, `high`, `fracture`).

  Use stable, descriptive seed strings so the review is reproducible: `phase7-review-frontier-balanced-normal-1`, `phase7-review-realistic-cinematic-fracture-3`, etc.

  Always run with `graphAware: { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true }`.

- [ ] **Step 2: Generate the corpus**

  Use a one-shot script (don't add this as a permanent npm script — it's a one-off review tool):

  ```bash
  node --import tsx/esm -e "
  import('./src/features/tools/star_system_generator/lib/generator/index.ts').then(m => {
    const seeds = [
      // 20 seeds here, see Step 1
    ]
    const flags = { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true }
    for (const { seed, distribution, tone, gu, settlements } of seeds) {
      const sys = m.generateSystem({ seed, distribution, tone, gu, settlements, graphAware: flags })
      console.log('=== seed', seed, '(', distribution, tone, gu, settlements, ') ===')
      console.log('SYSTEM:', sys.name.value)
      console.log('SPINE:', sys.systemStory.spineSummary)
      console.log('BODY:')
      sys.systemStory.body.forEach((p, i) => console.log('  [' + i + ']', p))
      console.log('HOOKS:')
      sys.systemStory.hooks.forEach((h, i) => console.log('  [' + i + ']', h))
      console.log('SETTLEMENTS:')
      sys.settlements.forEach(s => {
        console.log('  -', s.name.value, '/', s.anchorName.value)
        console.log('    whyHere:', s.whyHere.value)
        console.log('    tagHook:', s.tagHook.value)
      })
      console.log('PHENOMENA:')
      sys.phenomena.forEach(p => {
        console.log('  -', p.name?.value ?? p.id)
        console.log('    note:', p.note.value)
      })
      console.log()
    }
  })
  "
  ```

  Pipe the output to a file (`/tmp/phase7-corpus.txt` or similar) so the reviewer can reference it. Do NOT commit the raw corpus — it's an artifact, not source.

- [ ] **Step 3: Author the review doc**

  Create `docs/PHASE_7_SAMPLE_REVIEW.md` with this structure:

  ````markdown
  # Phase 7 Sample Review

  Structured manual review of 20 generated systems with all `graphAware` flags on.
  Findings drive Phase 7 tasks 2–10 and Phase 8 carryover capture.

  ## Method

  20 seeds spanning distribution × tone × gu × settlements. All flags on.
  Reviewer reads each system's spineSummary, body paragraphs, hooks, and per-settlement / per-phenomenon prose, scoring each against the checklist below.

  ## Checklist (per surface)

  - **Grammar:** Verb collisions, doubled nouns, orphaned punctuation, unresolved slots.
  - **Cohesion:** Are named entities referenced consistently? Does the system feel like one place?
  - **Article correctness:** "the chiral ice belt" vs "chiral ice belt" — does the article appear where natural English wants it?
  - **Era/preposition fit:** When a historicalBridge fires, does "during X" / "in X" / "before X" read correctly?
  - **Variant diversity:** When 3+ historical edges fire across the corpus, are different `body` variants used? (Carryover c.)
  - **Tag-hook closing:** Does the 4th sentence vary or always end with "decides who has leverage"? (Carryover f.)
  - **whyHere richness:** Does most output read as prose ("X sits on Y") or fallback semicolons? (Carryover g.)
  - **Setting incongruity:** Anything that doesn't fit the setting (e.g., aliens, modern slang, anachronisms).

  ## Findings per seed

  ### Seed: phase7-review-frontier-balanced-normal-1

  - System: <name>
  - SpineSummary: "..."
  - Findings:
    - [grammar] ...
    - [cohesion] ...
    - [carryover-a] "during before the quarantine" appears in body[0].

  ### Seed: ...

  (... repeat for all 20)

  ## Aggregated findings

  Group findings by carryover / category. Each row links to the seed that surfaced it.

  | Category | Count | Seeds | Phase 7 task | Phase 8 candidate? |
  |---|---|---|---|---|
  | Era/preposition collision | N | seed-1, seed-7, ... | Task 2 | no |
  | Always body[0] | N | ... | Task 4 | no |
  | Doubled noun missed by guard | N | ... | Task 10 (new check) | maybe |
  | Settlement on unnamed body | N | ... | Task 7 | no |
  | Hook fallback dominance | N | ... | Task 8 | no |
  | Other (Phase 8) | N | ... | — | yes |

  ## Conclusion

  Brief 3–5 sentence summary: how cohesive does the corpus feel? Where are the worst gaps? What goes into Phase 8?
  ````

  The reviewer fills this out by reading the corpus output and capturing 1–3 findings per seed. Most seeds will produce 0–2 findings; a few will produce many. Aim for at least 30 distinct findings across the corpus. If fewer than 15 surface, the review was too shallow — re-read.

- [ ] **Step 4: Quality gate**

  ```bash
  npm run lint
  npx tsc --noEmit
  ```

  No code changes — these run trivially. The review doc itself doesn't need linting (markdown).

- [ ] **Step 5: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  docs: phase 7 sample review of 20 systems with all flags on

  Structured manual review covering 20 seeds spanning the corpus matrix.
  Findings categorized by Phase 7 task or Phase 8 carryover. Task 2's
  era/preposition collision, Task 4's variant rotation, and Task 7/8's
  trigger-rate gaps are confirmed by review. Specific findings drive
  Task 10's audit additions.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 2: Carryover (a) — fix era/preposition collision in historicalBridge templates

**Why:** Five of the six populated `historicalBridge` templates use the literal preposition "during {historical:era}". Two era-pool entries do not pair grammatically with "during":

- `'before the quarantine'` → "broke during before the quarantine," ❌ (broken)
- `'pre-collapse'` → "broke during pre-collapse," ⚠️ (technically grammatical, awkward)

The remaining 8 era entries pair cleanly with "during" because they are bare noun phrases ("the first wave", "the great compaction", etc.). Task 1's review will surface this; the fix is mechanical.

**Decision: restructure the era pool to be preposition-self-contained.** Each entry carries its own preposition (or stands alone where natural). The historicalBridge templates then drop the literal "during" and use just `{historical:era|<fallback adjunct>}`.

**Files:**
- Modify: `lib/generator/graph/data/eras.ts`
- Modify: `lib/generator/graph/render/templates/contradictsTemplates.ts`
- Modify: `lib/generator/graph/render/templates/controlsTemplates.ts`
- Modify: `lib/generator/graph/render/templates/contestsTemplates.ts`
- Modify: `lib/generator/graph/render/templates/dependsOnTemplates.ts`
- Modify: `lib/generator/graph/render/templates/suppressesTemplates.ts`
- Modify: `lib/generator/graph/render/templates/destabilizesTemplates.ts` only if its `traces back to {historical:era}` reads awkwardly with the new entries (verify against examples; likely needs no change because "traces back to before the quarantine" reads fine).

- [ ] **Step 1: Update the era pool**

  Edit `lib/generator/graph/data/eras.ts`. Each entry becomes a self-contained adjunct phrase:

  ```ts
  export const ERAS = [
    'in the first wave',
    'in the second wave',
    'in the long quiet',
    'before the quarantine',
    'in the early charters',
    'in the great compaction',
    'in the pinchdrive era',
    'in the iggygate dawn',
    'in the bleed years',
    'before the collapse',
  ] as const
  ```

  (Note: "pre-collapse" reworded to "before the collapse" so all entries are full phrases. Prefer prose-readable forms over compact technical labels here — the era is consumed in spine summaries that want to read as natural English.)

  Updated `Era` type derives from this — no other change needed.

- [ ] **Step 2: Update the 5 affected `historicalBridge` templates**

  Each currently has `text: '... during {historical:era|<fallback>},'`. Drop the "during":

  - **CONTRADICTS:** `'The records were edited {historical:era|after a public-trust breach},'`
  - **CONTROLS:** `'{subject} founded {object} {historical:era|in the early charters},'`
  - **CONTESTS:** `'The compact between {subject} and {object} broke {historical:era|in an earlier reckoning},'`
  - **DEPENDS_ON:** `'{subject} ended up on {object:article} {historical:era|in the great compaction},'`
  - **SUPPRESSES:** `'{subject} took control {historical:era|in a broken compact},'`

  The fallback strings are also restructured to start with "in"/"after" so the `{historical:era|<fallback>}` slot's fallback is preposition-self-contained too — the bridge text never has a hanging "during".

  DESTABILIZES does not change: `'{subject} traces back to {historical:era|to a flawed founding},'` is already shaped as `traces back to <era-noun-phrase>`. Verify by reading the file: if the literal text uses "to {historical:era|to ...}" the slot value already includes "in" and we'd get "traces back to in the first wave" — broken. Check carefully and adjust the fallback if needed. (See Step 3.)

- [ ] **Step 3: Verify DESTABILIZES bridge fits the new era forms**

  The current text is `'{subject} traces back to {historical:era|a flawed founding},'`. With the new era pool, this renders as `'<subject> traces back to in the first wave,'` — broken (doubled "to in").

  Fix: change the bridge text to `'{subject} dates from {historical:era|a flawed founding},'` (so "dates from in the first wave" → grammatical). Or `'{subject} grew out of {historical:era|a flawed founding},'`. Pick one that reads naturally.

  Reviewer's bar: render-test against all 10 era entries; output reads as "<subject> dates from in the first wave," / "<subject> dates from before the quarantine," — both grammatical.

  (Note: this approach makes "in" fungible with "before" / "after". If a reviewer prefers a more elegant solution — e.g., adding a `prepositionAffix` to the era data and varying it per template — that's also valid, but adds surface area. The plan recommends the simpler "self-contained adjunct" approach because it keeps the era data flat.)

- [ ] **Step 4: Update / add tests**

  Find the test file that asserts on historical-edge rendering — likely `lib/generator/graph/__tests__/history.test.ts` or one of the per-edge template snapshots. Search:

  ```bash
  grep -rln "historicalBridge\|attachHistoricalEvents\|spineSummary" src/features/tools/star_system_generator/lib/generator/graph/__tests__/ src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/
  ```

  Update existing assertions that contained the old "during {era}" pattern.

  Add a small regression test asserting the antipattern doesn't recur. Place it in the historical-test file:

  ```ts
  it('historicalBridge templates do not produce double prepositions with any era', () => {
    const templates = [contradictsTemplates, controlsTemplates, contestsTemplates,
                       dependsOnTemplates, suppressesTemplates, destabilizesTemplates]
    for (const family of templates) {
      const bridge = family.historicalBridge.text
      // The bridge must not contain a hanging preposition immediately before {historical:era}.
      expect(bridge).not.toMatch(/(during|in|on|at|to)\s+\{historical:era/)
    }
  })
  ```

  This is a structural assertion against the templates, not a rendered-output check. It will catch any future template that re-introduces a hanging preposition.

  Also add a render-time regression test that drives all 10 eras through one bridge and asserts no doubled preposition appears in the output:

  ```ts
  it('rendered historicalBridge output contains no double prepositions for any era', () => {
    for (const era of ERAS) {
      const ctx = { subject: SUBJECT, object: OBJECT, qualifier: era,
                    edgeType: 'CONTRADICTS', visibility: 'public' }
      const text = resolveSlots(contradictsTemplates.historicalBridge.text, ctx, {})
      expect(text).not.toMatch(/\b(during|in|on|at|to)\s+(in|on|at|to|before|after)\b/)
    }
  })
  ```

  Use minimal SUBJECT and OBJECT EntityRef fixtures.

- [ ] **Step 5: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  ```

  - `proseUnchanged.test.ts` MUST still pass byte-identically (Phase 7 doesn't touch flag-off behavior).
  - `phase6On.test.ts` will likely **regenerate** for snapshots whose seed produces a historical bridge in the spineSummary. That's expected. Review the diff:
    - Before: spineSummary contained "during the first wave," / "during before the quarantine,"
    - After: spineSummary contains "in the first wave," / "before the quarantine,"
    - Any other change → unexpected; investigate.
  - audit-quick errors=0.

- [ ] **Step 6: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  fix: avoid double-preposition collisions in historicalBridge templates

  Restructure data/eras.ts so each entry is a preposition-self-contained
  adjunct phrase ("in the first wave" / "before the quarantine"), then
  drop the literal "during" prefix from the 6 historicalBridge templates
  that use {historical:era}. Eliminates "during before the quarantine"
  and similar collisions surfaced in the Phase 7 sample review (Phase 5
  carryover a). Adds a structural test that the bridge templates have no
  hanging preposition immediately before {historical:era}, and a render-
  time test driving all 10 eras through one bridge to assert no doubled
  preposition. Updates phase6On snapshot.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 3: Carryover (b) — export `HISTORICAL_ELIGIBLE_TYPES` and consume from audit

**Why:** `lib/generator/graph/history.ts` defines the `PRESENT_TO_HISTORICAL` map at line 30 (the canonical "which present-edge types qualify for historical attachment" set). The audit script duplicates this set inline when computing `spineEdgesEligibleForHistorical`. If history.ts adds or removes an eligible type, the audit silently drifts. Exporting and re-importing eliminates the drift risk.

**Files:**
- Modify: `lib/generator/graph/history.ts` — export the set.
- Modify: `scripts/audit-star-system-generator.ts` — import and consume.

- [ ] **Step 1: Export the eligibility set**

  In `history.ts`, the existing constant is `PRESENT_TO_HISTORICAL: Partial<Record<EdgeType, EdgeType>>` (line 30). Add an exported derivation alongside it:

  ```ts
  export const HISTORICAL_ELIGIBLE_TYPES: ReadonlySet<EdgeType> = new Set(
    Object.keys(PRESENT_TO_HISTORICAL) as EdgeType[]
  )
  ```

  This exposes the canonical set without exposing the implementation map. The audit imports the set, not the map.

  Alternative: also export `PRESENT_TO_HISTORICAL` directly as readonly. Use this if the audit has any reason to know the present→historical mapping (it currently doesn't). Default: only export the set.

- [ ] **Step 2: Refactor the audit to consume**

  In `scripts/audit-star-system-generator.ts`, find where `spineEdgesEligibleForHistorical` is computed. The check likely looks like:

  ```ts
  const eligibleTypes: EdgeType[] = ['CONTROLS', 'CONTESTS', 'DEPENDS_ON', 'DESTABILIZES', 'SUPPRESSES', 'CONTRADICTS']
  // ... eligibleTypes.includes(edge.type) ...
  ```

  Replace with:

  ```ts
  import { HISTORICAL_ELIGIBLE_TYPES } from '../src/features/tools/star_system_generator/lib/generator/graph/history'
  // ...
  // ... HISTORICAL_ELIGIBLE_TYPES.has(edge.type) ...
  ```

  Verify the import path matches the audit script's existing imports (use the same relative-path style).

- [ ] **Step 3: Tests**

  Add a structural test asserting `HISTORICAL_ELIGIBLE_TYPES` is non-empty and matches the keys of `PRESENT_TO_HISTORICAL`. Place in the existing history test file:

  ```ts
  it('HISTORICAL_ELIGIBLE_TYPES matches the keys of the present-to-historical map', () => {
    const expected = Object.keys(PRESENT_TO_HISTORICAL).sort()
    const actual = [...HISTORICAL_ELIGIBLE_TYPES].sort()
    expect(actual).toEqual(expected)
  })
  ```

  Note: `PRESENT_TO_HISTORICAL` may not be exported. If it isn't, either (a) export it readonly for testing only, or (b) place the test inside the history.ts module via a colocated test (less ideal) or (c) test the constant against a hardcoded expected array (most pragmatic). Option (c) is fine — it adds a second drift point but it's stable and explicit.

- [ ] **Step 4: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```

  audit-quick must report the same numbers it did pre-refactor. The audit logic is unchanged; only the data source moved.

- [ ] **Step 5: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  refactor: export HISTORICAL_ELIGIBLE_TYPES from history.ts

  The audit script previously hard-coded the eligible-for-historical edge
  type set, risking silent drift if history.ts changed PRESENT_TO_HISTORICAL.
  Export the set as a readonly constant and have the audit consume it
  directly (Phase 5 carryover b).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 4: Carryover (c) — rotate historical-edge body variants

**Why:** `renderHistoricalSummary` at `history.ts:133-141` always picks `family.body[0]`. This means variants 1, 2 (and 3, 4 if present) of the FOUNDED_BY / BETRAYED / DISPLACED template families are dead in production. The Phase 5 plan called this out as a known carryover; Phase 7 implements the fix.

**Decision: rotate via deterministic hash of the present-edge ID.** No RNG draw needed (preserves determinism). The hash function `stableHashString` already exists and is used elsewhere in `history.ts`.

**Files:**
- Modify: `lib/generator/graph/history.ts`
- Create: `lib/generator/graph/__tests__/historicalRotation.test.ts`

- [ ] **Step 1: Rotate variant selection**

  Change `renderHistoricalSummary` (history.ts:133-141). Currently:

  ```ts
  function renderHistoricalSummary(ctx: EdgeRenderContext): string {
    const family = templateFor(ctx.edgeType)
    if (family.body.length === 0 || family.body[0].text === '') return ''
    const variant = family.body[0]
    let text = resolveSlots(variant.text, ctx, variant.expects)
    text = capitalizeForPosition(text, 'sentence-start')
    text = guardDoubledNoun(text)
    return text
  }
  ```

  Change signature to accept a rotation key, and rotate:

  ```ts
  function renderHistoricalSummary(ctx: EdgeRenderContext, rotationKey: string): string {
    const family = templateFor(ctx.edgeType)
    if (family.body.length === 0) return ''
    const variantIndex = stableHashString(rotationKey) % family.body.length
    const variant = family.body[variantIndex]
    if (variant.text === '') return ''
    let text = resolveSlots(variant.text, ctx, variant.expects)
    text = capitalizeForPosition(text, 'sentence-start')
    text = guardDoubledNoun(text)
    return text
  }
  ```

  In `mintHistoricalEdge` (line 86-119), the call site is:

  ```ts
  const summary = renderHistoricalSummary({
    subject, object, qualifier: era,
    edgeType: histType, visibility: 'public',
  })
  ```

  Update to pass `presentEdge.id` as the rotation key:

  ```ts
  const summary = renderHistoricalSummary({
    subject, object, qualifier: era,
    edgeType: histType, visibility: 'public',
  }, presentEdge.id)
  ```

  Why `presentEdge.id`? It's stable, deterministic, and unique within a system — produces a different hash per spine edge so historical summaries on different spine edges in the same system can pick different variants. Different systems with the same edge ID (which won't happen — IDs include subject/object names) would also rotate independently.

  Note on guard at line 135 (currently `family.body.length === 0 || family.body[0].text === ''`): split this into two checks. Empty `body` array → still skip. Variant with empty `text` → return '' (matches old behavior for a stub family). The new code structure handles both.

- [ ] **Step 2: Add the rotation test**

  Create `lib/generator/graph/__tests__/historicalRotation.test.ts`:

  ```ts
  import { describe, expect, it } from 'vitest'
  import { attachHistoricalEvents } from '../history'
  import type { RelationshipEdge } from '../types'
  import { createSeededRng } from '../../rng'

  // Build N synthetic spine edges that all qualify for historical (e.g., all CONTROLS),
  // each with a unique id. Run attachHistoricalEvents with a deterministic rng. Inspect
  // the resulting historical edges' summaries.

  function makeControlsEdge(id: string): RelationshipEdge {
    // ... minimal RelationshipEdge fixture with type='CONTROLS', subject/object set ...
  }

  describe('historical body variant rotation', () => {
    it('picks different body variants across spine edges with different ids', () => {
      const spine = [makeControlsEdge('e-a'), makeControlsEdge('e-b'), makeControlsEdge('e-c')]
      const rng = createSeededRng('test')
      const result = attachHistoricalEvents({ spineEdges: spine, rng })
      const summaries = new Set(result.historicalEdges.map(h => h.summary))
      // Three different ids → potentially three different variants. With 3-variant families,
      // expect at least 2 distinct strings (hash collisions possible but unlikely in 3 trials).
      expect(summaries.size).toBeGreaterThanOrEqual(2)
    })

    it('is deterministic — same inputs produce same variant choice', () => {
      const spine = [makeControlsEdge('e-a')]
      const r1 = attachHistoricalEvents({ spineEdges: spine, rng: createSeededRng('det') })
      const r2 = attachHistoricalEvents({ spineEdges: spine, rng: createSeededRng('det') })
      expect(r1.historicalEdges[0].summary).toBe(r2.historicalEdges[0].summary)
    })
  })
  ```

  The `expect(summaries.size).toBeGreaterThanOrEqual(2)` assertion is probabilistic but safe: with `stableHashString % 3` and 3 distinct inputs, the probability of all three mapping to the same bucket is ~1/9 — choose the test inputs (`'e-a'`, `'e-b'`, `'e-c'` or similar) such that you've verified by hand they actually distribute. If the assertion is flaky, hardcode known-distributing IDs by running `stableHashString` on candidate strings ahead of time.

- [ ] **Step 3: Update existing tests if any pin variant 0**

  If any existing test in `history.test.ts` pinned the rendered summary to a specific variant text, that test will fail under rotation. Update it to either:
  - Test that the summary is one of the family's variants (loose check), or
  - Pick a presentEdge ID known to map to variant 0 under `stableHashString % 3`, preserving the original assertion.

  Search:
  ```bash
  grep -n "summary.*toBe\|summary.*toContain\|family\.body\[0\]\.text" src/features/tools/star_system_generator/lib/generator/graph/__tests__/
  ```

- [ ] **Step 4: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  ```

  - `phase6On.test.ts` will regenerate snapshots for any seed whose historical summary was previously variant 0 and is now a different variant. Eyeball the diff:
    - Before: "Houseclan Ferrand founded Bel Verde in the early charters" (always)
    - After: variant 1 / 2 wording for some seeds.
    - Any unrelated change → investigate.
  - audit-quick errors=0.

- [ ] **Step 5: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: rotate historical-edge body variants by present-edge id hash

  renderHistoricalSummary previously always picked family.body[0], leaving
  variants 1+ of FOUNDED_BY / BETRAYED / DISPLACED template families dead
  in production. Rotate via stableHashString(presentEdge.id) % body.length
  so different spine edges in the same system can pick different variants
  while preserving determinism (Phase 5 carryover c). Updates phase6On
  snapshot for seeds whose historical summary now picks a non-0 variant.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 5: Carryover (d) — align DESTABILIZES `historicalBridge.expects.subject` to `nounPhrase`

**Why:** The DESTABILIZES family's `body` templates declare `expects.subject: 'nounPhrase'` (so the slot resolver strips leading articles, lowercases when mid-sentence, etc.). The `historicalBridge` template at `destabilizesTemplates.ts:15-17` declares `expects.subject: 'properNoun'` — different shape. When the subject is a phenomenon (a common case for DESTABILIZES), `properNoun` skips the article-stripping that `nounPhrase` would apply. Result: the bridge can produce text like "The bleed season traces back to..." vs the body's "the bleed season is corroding..." — capitalization mismatch.

**Files:**
- Modify: `lib/generator/graph/render/templates/destabilizesTemplates.ts`

- [ ] **Step 1: Change `expects.subject` to `nounPhrase`**

  Line 17 currently:

  ```ts
  expects: { subject: 'properNoun' },
  ```

  Change to:

  ```ts
  expects: { subject: 'nounPhrase' },
  ```

  Verify Task 2's bridge text change (the `traces back to` → `dates from` revision) still composes cleanly with `nounPhrase` shape on subject. Render-test against a phenomenon subject and a settlement subject:

  - Phenomenon "The bleed season" → bridge fires, slot resolver lowercases / strips article → "bleed season dates from in the first wave," — reads cleanly mid-sentence.
  - Settlement "Orison Hold" → properNoun rendering preserved (nounPhrase doesn't break proper-noun-shaped values).

  If `nounPhrase` produces unwanted lowering for a `properNoun`-shaped value, that's a `slotResolver`/`grammarSafety` bug and goes into Task 10's audit checks, not this task.

- [ ] **Step 2: Add a regression test**

  In the destabilizes test file (or wherever DESTABILIZES rendering is exercised; create a colocated test if one doesn't exist):

  ```ts
  it('historicalBridge subject reshapes to nounPhrase for phenomenon-typed subjects', () => {
    const phenomSubject = makePhenomenonRef('p1', 'the bleed season')
    const ctx = { subject: phenomSubject, object: SETTLEMENT, qualifier: 'in the first wave',
                  edgeType: 'DESTABILIZES', visibility: 'public' }
    const text = resolveSlots(destabilizesTemplates.historicalBridge.text, ctx,
                              destabilizesTemplates.historicalBridge.expects)
    expect(text).not.toContain('The bleed season')  // article should be stripped
    expect(text).toContain('bleed season')
  })
  ```

  Adjust the assertion based on what `slotResolver` actually does for `nounPhrase` shape — read `lib/generator/graph/render/slotResolver.ts` to confirm the article-stripping rules.

- [ ] **Step 3: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  ```

  `phase6On.test.ts` may regenerate for seeds where DESTABILIZES historicalBridge fires with a phenomenon subject. Verify the diff is only article-stripping changes ("The bleed season" → "bleed season").

- [ ] **Step 4: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  fix: DESTABILIZES historicalBridge subject reshapes as nounPhrase

  The body templates declare subject: nounPhrase (article-strip + lowercase
  mid-sentence) but historicalBridge declared subject: properNoun, skipping
  the reshape and producing "The bleed season traces back to..." mid-clause.
  Align to nounPhrase so phenomenon-typed subjects strip "the" / lowercase
  consistently with the body templates (Phase 5 carryover d).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 6: Carryover (e) — resolve `pickHistoricalEndpoints`

**Why:** `pickHistoricalEndpoints` at `history.ts:121-131` has a dead-identical branch. Both the DISPLACED-specific case and the default return the same thing — `{ subject: presentEdge.subject, object: presentEdge.object }`. The return type is `{ subject: EntityRef | undefined; object: EntityRef | undefined }` but in practice neither is ever undefined.

**Decision: delete the dead branch and tighten the return type to non-nullable.** The "real DISPLACED inversion logic" mentioned in the carryover comment is not actually well-defined — DISPLACED's intended semantic ("X was displaced from Y to Z") is already satisfied by `subject = presentEdge.subject` (the displaced settlement) and `object = presentEdge.object` (the resource). Inversion would imply a different, less natural reading.

**Files:**
- Modify: `lib/generator/graph/history.ts`

- [ ] **Step 1: Simplify the function**

  Delete the dead DISPLACED branch. The function reduces to a one-liner that always returns `{ subject: presentEdge.subject, object: presentEdge.object }`. Tighten the return type:

  ```ts
  function pickHistoricalEndpoints(
    presentEdge: RelationshipEdge,
    _histType: EdgeType,
  ): { subject: EntityRef; object: EntityRef } {
    return { subject: presentEdge.subject, object: presentEdge.object }
  }
  ```

  Update the call site in `mintHistoricalEdge` (line 91-92):

  ```ts
  const { subject, object } = pickHistoricalEndpoints(presentEdge, histType)
  if (!subject || !object) return null
  ```

  The `if (!subject || !object) return null` guard was the only consumer of the loose return type. Now that the type is non-nullable, the guard becomes dead. Delete it:

  ```ts
  const { subject, object } = pickHistoricalEndpoints(presentEdge, histType)
  ```

  This simplifies `mintHistoricalEdge`'s control flow. The function still has other return-null paths (e.g., `if (summary === '') return null`), so the function signature still returns `RelationshipEdge | null`.

- [ ] **Step 2: Update or remove tests**

  Search for any test asserting the null-guarded path:

  ```bash
  grep -n "pickHistoricalEndpoints\|mintHistoricalEdge.*null" src/features/tools/star_system_generator/lib/generator/graph/__tests__/
  ```

  If a test specifically exercised the now-dead null-guard path, remove it (or update to exercise a different null path like empty summary).

  Add a structural test asserting `pickHistoricalEndpoints`'s return type is non-nullable. TypeScript will catch this at compile time, but a runtime assertion that the function never returns undefined for any (presentEdge, histType) combination is cheap.

- [ ] **Step 3: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  npm run audit:star-system-generator:quick
  ```

  No behavior change → no snapshot regeneration. If a snapshot moves, something else changed unexpectedly.

- [ ] **Step 4: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  refactor: tighten pickHistoricalEndpoints return type

  The function had a DISPLACED branch identical to the default branch and
  returned EntityRef | undefined despite the type never actually surfacing
  undefined values. Delete the dead branch, tighten the return type to
  EntityRef, and remove the dead null-guard at the call site
  (Phase 5 carryover e).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 7: Carryover (g) — investigate the whyHere graph-aware gap

**Why:** Phase 6 audit reported `whyHere graph-aware rate: 54.9%` against a 70–90% target band. 45% of settlements still fall back to the legacy semicolon-list output. Need to characterize WHICH settlements are missing both DEPENDS_ON and HOSTS edges, then either:

- **Fix the rule files** if the gap is a rule-predicate bug (e.g., HOSTS only fires when the body has a name with proper-noun shape, but settlements on unnamed bodies should still get a HOSTS edge with a fallback display name).
- **Document 54.9% as the realistic ceiling** if the missing settlements legitimately don't have the relationships graph-aware whyHere is meant to express, and adjust the audit's target band downward.

**Files:**
- Possibly: `lib/generator/graph/rules/hostsRules.ts`, `dependsOnRules.ts`
- Modify: `scripts/audit-star-system-generator.ts` (target-band documentation in comments)
- Possibly: `docs/PHASE_7_SAMPLE_REVIEW.md` (notes on which seeds surfaced missing edges)

- [ ] **Step 1: Diagnostic — characterize the missing-edge population**

  Write a one-shot diagnostic script (don't commit, just run):

  ```ts
  // For each of the audit's settlements, log the settlement id, anchorName,
  // body name, function, and whether it has any incoming HOSTS / DEPENDS_ON edge.
  // Group by "missing" reason: no HOSTS rule fired, no DEPENDS_ON rule fired.
  // Tabulate top 5 reasons.
  ```

  Run against the deep-audit corpus (4800 systems × ~3.7 settlements each = ~17600 settlements). The 45% fallback population is ~7900 settlements — characterize the top 3–5 reasons.

  Common possibilities:
  1. Settlement on a body whose displayName fails `isNamedEntity` (no `[A-Z][a-z]+` shape) — HOSTS rule may emit but the body endpoint isn't a usable display name.
  2. Settlement function/anchorDetail doesn't surface a tagged GU resource — DEPENDS_ON rule never fires.
  3. Settlement on a moon (moonId set, bodyId may be the parent body but HOSTS rule may key on bodyId not moonId).
  4. Settlement with `anchorKind: 'gate'` or `'route'` — a different physical anchor type that may not produce HOSTS.

- [ ] **Step 2: Decision**

  Based on the diagnostic:

  - **If a single root cause covers >50% of the missing population AND the fix is small** (<50 lines, no new edge type, no rule predicate rewrite): fix the rule file. Example: HOSTS doesn't emit when settlement is on a moon — fix the rule to also emit HOSTS(moon, settlement) when moonId is set.

  - **If multiple small causes each cover 10–20% of the missing population**: cherry-pick one fix in this task. Capture the rest as Phase 8 candidates in the review doc.

  - **If the missing population is dominated by "this settlement has no semantic dependency to express"** (e.g., scout outpost on a flyby trajectory): document 54.9% as the ceiling. Update the audit target-band comment to say "expected 50–70% given current rule coverage; below 50% indicates regression."

- [ ] **Step 3: Implement the chosen fix (if any)**

  If fixing a rule file, write the fix narrowly. Add a regression test asserting the new rule fires for the targeted settlement shape.

  If documenting, update the audit script's print block comment near the whyHere rate output:

  ```ts
  // Phase 7: whyHere graph-aware rate target was originally 70-90% but the
  // realistic ceiling under current rule coverage is ~55-65% — settlements
  // with no semantic body/resource dependency legitimately fall back to the
  // semicolon-list output. Below 50% indicates regression in the host or
  // depends-on rule files.
  ```

- [ ] **Step 4: Re-run deep audit, capture new rate**

  ```bash
  npm run audit:star-system-generator:deep
  ```

  Record the new whyHere rate. If a fix shipped, expect modest improvement (e.g., 54.9% → 60-70%). If only a documentation change shipped, expect the same 54.9%.

- [ ] **Step 5: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  ```

  If a rule-file fix shipped: phase6On may regenerate for seeds whose newly-eligible settlements now get graph-aware whyHere. Eyeball the diff — should only show whyHere strings changing from semicolon-list to graph-aware prose for the affected settlements.

- [ ] **Step 6: Commit**

  Commit message depends on which path was taken:

  Fix-shipped variant:
  ```
  fix: emit HOSTS edge for settlements anchored to moons

  Phase 6 surfaced a 45% whyHere fallback rate. Diagnostic showed that
  settlements with moonId set never received a HOSTS edge because hostsRules
  only matched bodyRef → settlementRef, missing the moon → settlement case.
  Add a moon-host rule emitting HOSTS(moon, settlement) when moonId is set.
  Re-measured whyHere rate: <X>% (up from 54.9%). Phase 5 carryover g
  partial fix; remaining gaps captured in PHASE_7_SAMPLE_REVIEW.md.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```

  Documented-baseline variant:
  ```
  docs: document realistic ceiling for whyHere graph-aware rate

  Phase 6 measured 54.9% whyHere graph-aware rate against a 70-90% target
  band. Diagnostic shows the missing 45% is dominated by settlements with
  no semantic body / resource dependency to express (scout outposts on
  unnamed flyby targets, anchor-kind: gate / route settlements without GU
  links). These legitimately fall back; broadening rule predicates would
  produce uglier output. Update target band to 50-70% in audit comments
  (Phase 5 carryover g).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```

  Push.

---

## Task 8: Carryover (f) — settlementHookSynthesis spine-eligibility decision

**Why:** Phase 6 audit reported `tagHook graph-aware rate: 0.0%` against a 40–60% target band. Root cause documented in Task 5 of Phase 6: the spine selector (`score.ts:isNamedEntity` + the `selectEdges` named-on-named filter) excludes `guResource` entities, so settlement-incident DEPENDS_ON edges (the most common eligible type) never reach `spineEdgeIds`. `settlementHookSynthesis` consumes `spineEdgeIds` and falls back unconditionally.

**Three documented options (Phase 6 plan + Task 5 report):**

1. **Broaden spine eligibility** — relax `isNamedEntity` to allow `guResource`. Risk: dilutes the spine's "named-on-named" semantic; spine summaries may name common-noun resources alongside proper nouns ("Orison Hold contests the chiral ice belt"), which reads OK but loses some narrative crispness.

2. **Carve a separate `settlementSpineEdgeIds` index** — keep main spine pure for the system story, but maintain a settlement-specific eligibility index for downstream consumers. Cleaner separation; adds surface area.

3. **Document 0% as intentional** — accept the trigger rate, update the audit's target band, accept that `settlementHookSynthesis` only fires in systems where two named factions / settlements / bodies happen to land in a spine-eligible relationship.

**Recommendation: Option 2 (separate index) IF Task 1's review shows reviewers want graph-aware tagHook prose. Option 3 IF reviewers find the existing 4-sentence form satisfactory.** Decision criterion below.

**Files (depends on path chosen):**
- Option 1: Modify `lib/generator/graph/score.ts`.
- Option 2: Create `lib/generator/graph/settlementSpineEligibility.ts` (or similar); modify `lib/generator/prose/graphAwareSettlementHook.ts` to consume.
- Option 3: Modify `scripts/audit-star-system-generator.ts` (comment change) + possibly `lib/generator/prose/graphAwareSettlementHook.ts` (no change).

- [ ] **Step 1: Decision criterion**

  Read the Task 1 review findings on the "Hook fallback dominance" row:

  - If ≥10 of 20 reviewed systems had a tagHook 4th sentence the reviewer flagged as boilerplate / would-have-improved-with-graph-aware: pick **Option 2** (separate index). The cost of the new file is justified.
  - If fewer than 10 reviewed systems flagged the 4th sentence (i.e., the fallback reads acceptably most of the time): pick **Option 3** (document). The 0% rate is acceptable and the cost of broader spine changes isn't justified.
  - **Avoid Option 1 unless the review explicitly says spine summaries should name guResources.** Most reviewers won't have that preference; spine = proper-noun pairs is a clean semantic.

  Document the decision in `docs/PHASE_7_SAMPLE_REVIEW.md` aggregated findings table.

- [ ] **Step 2: Implement (Option 2 path — recommended default)**

  Create `lib/generator/graph/settlementSpineEligibility.ts`:

  ```ts
  import type { RelationshipEdge, ScoredCandidate } from './types'  // adjust imports
  import { isNamedEntity } from './score'

  // Settlements get their own "spine" — the highest-scored eligible incident edge
  // per settlement. Eligibility relaxes the main-spine named-on-named requirement:
  // an edge is settlement-spine-eligible if it's CONTESTS / DEPENDS_ON / SUPPRESSES
  // and at least ONE endpoint (the settlement) is named — the OTHER endpoint can be
  // any kind including guResource.
  const SETTLEMENT_SPINE_TYPES: ReadonlySet<EdgeType> = new Set<EdgeType>([
    'CONTESTS', 'DEPENDS_ON', 'SUPPRESSES',
  ])

  export function selectSettlementSpineEdgeIds(
    scored: ReadonlyArray<ScoredCandidate>,
    settlementIds: ReadonlySet<string>,
  ): string[] {
    const eligible = scored.filter(c =>
      SETTLEMENT_SPINE_TYPES.has(c.edge.type)
      && (settlementIds.has(c.edge.subject.id) || settlementIds.has(c.edge.object.id))
    )
    // Highest-scored eligible edges win, capped per-settlement to avoid one
    // dominant settlement absorbing all spine slots.
    const perSettlementCap = 1
    const counts = new Map<string, number>()
    const out: string[] = []
    for (const cand of eligible) {
      const settlementId = settlementIds.has(cand.edge.subject.id)
        ? cand.edge.subject.id
        : cand.edge.object.id
      const used = counts.get(settlementId) ?? 0
      if (used >= perSettlementCap) continue
      out.push(cand.edge.id)
      counts.set(settlementId, used + 1)
    }
    return out
  }
  ```

  Wire this into the graph build pipeline. Find where `spineIds` is populated in `lib/generator/graph/index.ts` (or wherever `buildRelationshipGraph` assembles `SystemRelationshipGraph`):

  ```ts
  const settlementIds = new Set(settlements.map(s => s.id))
  const settlementSpineEdgeIds = selectSettlementSpineEdgeIds(scored, settlementIds)
  // Add to SystemRelationshipGraph output:
  return {
    ...,
    spineEdgeIds,           // existing — main-story spine
    settlementSpineEdgeIds, // NEW — settlement-incident spine for downstream consumers
    ...
  }
  ```

  Extend `SystemRelationshipGraph` type in `lib/generator/graph/types.ts` to include `settlementSpineEdgeIds: string[]`.

  Update `lib/generator/prose/graphAwareSettlementHook.ts` to consult `graph.settlementSpineEdgeIds` instead of `graph.spineEdgeIds`:

  ```ts
  const spineSet = new Set(graph.settlementSpineEdgeIds)
  // ... rest unchanged
  ```

  Phase 6 Task 5's spec said "incident spine edge of type CONTESTS / DEPENDS_ON / SUPPRESSES." Phase 7 redefines "spine" in this context to be the settlement-spine (graph.settlementSpineEdgeIds), preserving the consumer's semantic. The main spine (graph.spineEdgeIds) is unchanged.

- [ ] **Step 2-alt: Implement (Option 3 path — document)**

  No code changes to consumers. Update the audit's print-block comment:

  ```ts
  // Phase 7: tagHook graph-aware rate target was originally 40-60% but the
  // realistic rate under "named-on-named" spine is 0-5%. Most systems'
  // spine consists of faction-faction or faction-body CONTESTS edges that
  // don't connect to settlements. Phase 7 reviewed and decided this is
  // acceptable — settlementHookSynthesis only triggers when a settlement
  // is itself in a spine-eligible faction relationship, which is by design.
  ```

  Don't change the consumer; the 4-sentence form remains canonical.

- [ ] **Step 3: Tests**

  Option 2:
  - Unit test `selectSettlementSpineEdgeIds`: returns expected ids for a corpus of synthetic edges + settlement set.
  - Integration test: `graphAwareSettlementHook` now fires when an incident DEPENDS_ON exists (regardless of whether it's in `graph.spineEdgeIds`).
  - Phase 6 unit tests in `graphAwareSettlementHook.test.ts` should still pass — they construct synthetic graphs with `spineEdgeIds`, so they'll keep working as long as the consumer change is backwards-compatible. If they break, update them to populate `settlementSpineEdgeIds` instead.

  Option 3:
  - No new tests. Existing tests pass unchanged.

- [ ] **Step 4: Re-run deep audit, capture new tagHook rate**

  ```bash
  npm run audit:star-system-generator:deep
  ```

  Option 2: expect 30–60% tagHook graph-aware rate.
  Option 3: expect ~0% (unchanged); the audit output's commentary clarifies why.

- [ ] **Step 5: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  ```

  Option 2: phase6On regenerates for snapshotted seeds where settlements now get graph-aware tagHook 4th sentences. Eyeball the diff — only the 4th sentence of affected settlements should change.

  Option 3: no snapshot change.

- [ ] **Step 6: Commit**

  Option 2:
  ```
  feat: add settlementSpineEdgeIds index for graph-aware tagHook

  Phase 6 measured 0% tagHook graph-aware rate because the main spine
  selector requires named-on-named (excluding guResource), so settlement-
  incident DEPENDS_ON edges never reach spineEdgeIds. Phase 7 carves a
  separate settlementSpineEdgeIds index that relaxes eligibility to
  "settlement is at least one endpoint" + CONTESTS/DEPENDS_ON/SUPPRESSES.
  graphAwareSettlementHook now consults this index. Re-measured rate:
  <X>% (up from 0%). Main spine semantics (named-on-named) preserved.
  ```

  Option 3:
  ```
  docs: document 0% tagHook rate as intentional under named-on-named spine

  Phase 6 measured 0% tagHook graph-aware rate against a 40-60% target.
  Phase 7 sample review found the 4-sentence fallback form acceptable
  for the systems where spine eligibility excludes settlement-incident
  edges. Update the audit's target-band comment to reflect 0-5% as the
  realistic rate under the current named-on-named spine semantic.
  ```

---

## Task 9: Empty-story rate decision (Phase 3 carryover)

**Why:** Phase 3 measured a 6.77% empty-story rate (systems where `spineEdgeIds` is empty so `systemStory` produces no spineSummary or body). Phase 4 retained it. Phase 5 retained it. Phase 6 retained it. The carryover lives because no phase has explicitly decided whether 6.77% is acceptable. Phase 7 makes the call.

**Decision tree:**

- **If a single root cause produces most empty stories** (e.g., systems with zero settlements + zero phenomena): fix or document.
- **If the cause is structurally unavoidable** (e.g., systems with no faction-faction or faction-body relationships): document 6.77% as the floor.

**Files (depends on path chosen):**
- Possibly: `lib/generator/graph/score.ts` (loosen spine selection in degenerate cases).
- Modify: `scripts/audit-star-system-generator.ts` (target-band documentation).

- [ ] **Step 1: Diagnostic**

  Run a one-shot script characterizing the 325 empty-story systems from the deep audit:
  - Settlement count distribution.
  - Phenomenon count distribution.
  - Number of named factions per system.
  - Number of edges produced (spineEdgeIds is empty, but how many peripheral edges? Is the graph degenerate or just spine-empty?).

  Hypothesis: most empty-story systems have very few named entities (sparse settlements + low GU). If so, the empty story is a *correct* outcome — there's nothing to say.

- [ ] **Step 2: Decision**

  - **If most empty-story systems have ≥3 named entities and the spine just didn't select**: investigate the spine selector. Possibly relax the SPINE_MAX = 3 ceiling or the named-on-named filter for spine slot 1 only (not slots 2-3). This is more invasive than Task 8's separate-index approach because it changes main spine semantics. Defer to Phase 8 unless the fix is trivial.

  - **If most empty-story systems are genuinely sparse (1-2 named entities)**: document. Update the audit comment.

- [ ] **Step 3: Implement (likely document path)**

  Update audit comment near the empty-story rate output:

  ```ts
  // Phase 7: empty-story rate is 6.77% across the corpus. Diagnostic showed
  // the affected systems are dominated by sparse-settlement + low-GU profiles
  // with <3 named entities — there's nothing meaningful for the spine to
  // surface. Accept 6.77% as the floor. >10% indicates regression.
  ```

- [ ] **Step 4: Re-run deep audit**

  Confirm rate unchanged (or improved if a fix shipped).

- [ ] **Step 5: Quality gate**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  ```

- [ ] **Step 6: Commit**

  ```
  docs: document 6.77% empty-story rate as structural floor

  Phase 3 surfaced a 6.77% empty-story rate, retained through Phases 4-6.
  Phase 7 diagnostic showed the affected systems have <3 named entities
  on average (sparse + low GU) — there is no meaningful narrative the
  spine can surface. Accept 6.77% as the floor; update the audit target
  to flag regression at >10%. (Phase 3 carryover.)
  ```

---

## Task 10: Add new audit checks codifying review findings

**Why:** Tasks 1–9 surface specific antipatterns. To prevent regression, codify each as an audit check.

**Files:**
- Modify: `scripts/audit-star-system-generator.ts`

- [ ] **Step 1: Codify carryover regression checks**

  Add the following checks — each fires `addFinding(findings, 'error', ...)` if the antipattern reappears:

  - **`prose.doublePreposition`** (from Task 2): scan rendered `spineSummary` and `body` paragraphs for the pattern `\b(during|in|on|at|to)\s+(in|on|at|to|before|after)\b`. This catches era/preposition collisions that bypass Task 2's structural template test.

  - **`prose.alwaysFirstHistoricalVariant`** (from Task 4, weak heuristic): not directly checkable per-system. Add as a corpus-level check: track the distinct rendered historical-summary strings per `(edgeType, era)` bucket; if a bucket of size ≥10 contains only one distinct summary, flag a warning.

  - **`prose.unstrippedArticleInBridge`** (from Task 5): scan rendered `spineSummary` for `the [a-z]+(?:\s|,|\.)` patterns immediately following a bridge marker (e.g., right after "dates from"). Tunable; if it produces too many false positives, drop it and rely on the unit test.

- [ ] **Step 2: Codify any review-driven antipatterns from Task 1**

  Read `docs/PHASE_7_SAMPLE_REVIEW.md`'s aggregated findings table. For each row marked "Task 10 (new check)":

  - Codify the specific substring or regex that detected the issue.
  - Add an `addFinding(findings, 'error' | 'warning', ...)` call.
  - Place near related checks for grouping.

  Examples of what reviewers might find:
  - Doubled adjectives ("the the iggygate", "very very rare") → regex `/\b(\w+)\s+\1\b/i`.
  - Settlement names containing reserved words.
  - Phenomena notes shorter than 30 chars (truncation regression).

  Keep checks tight — false positives degrade audit utility.

- [ ] **Step 3: Run deep audit, capture new metrics**

  ```bash
  npm run audit:star-system-generator:deep
  ```

  All new checks should produce 0 findings against a clean corpus. If any check fires, either the codification is wrong (false positive — tune) or the underlying Task 2-9 fix didn't fully land (real regression — go back).

- [ ] **Step 4: Quality gate**

  ```bash
  npm run lint
  npx tsc --noEmit
  npm run test -- --run src/features/tools/star_system_generator
  ```

- [ ] **Step 5: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: codify phase 7 review findings as audit checks

  Adds prose.doublePreposition (catches era/preposition collisions),
  prose.alwaysFirstHistoricalVariant (corpus-level diversity check),
  prose.unstrippedArticleInBridge (Task 5 regression guard), plus
  any antipatterns surfaced in PHASE_7_SAMPLE_REVIEW.md. All checks
  produce 0 findings against the deep audit corpus.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 11: Final verification + master plan update

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

- [ ] **Step 2: Re-do the 20-sample review (lighter pass)**

  Re-generate the 20 systems from Task 1's seed list. Spot-check that:
  - No "during before the quarantine" / "during pre-collapse" patterns appear (Task 2 ✓).
  - Different historical-edge body variants are visible across the corpus (Task 4 ✓).
  - DESTABILIZES bridges with phenomenon subjects strip articles correctly (Task 5 ✓).
  - whyHere / tagHook rates match Task 7 / Task 8 expectations.
  - Empty-story systems are genuinely sparse (Task 9 ✓).

  This is a sanity pass, not a full review. Capture any new finding in `PHASE_7_SAMPLE_REVIEW.md`'s "post-fix verification" section.

- [ ] **Step 3: Confirm `proseUnchanged.test.ts` still byte-identical**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

  Phase 7 made no flag-off changes; this snapshot must remain stable.

- [ ] **Step 4: Phase 7 acceptance**

  - All 5 Phase 5 carryovers (a)–(e) addressed ✓
  - Both Phase 6 carryovers (f), (g) addressed (fix or documented) ✓
  - Phase 3 empty-story carryover addressed ✓
  - 20-sample review doc committed ✓
  - New audit checks present and produce 0 findings ✓
  - Audit errors=0, warnings=0, prose.unresolvedSlot=0 ✓
  - `proseUnchanged.test.ts` still passes ✓
  - `phase6On.test.ts` snapshots stable (or regenerated with reviewed diffs) ✓

- [ ] **Step 5: Update master plan**

  Edit `docs/NARRATIVE_GRAPH_PLAN.md`:
  - Phase 7 row Status: `⏳ Not yet planned` → `✅ Done — [plan](./NARRATIVE_GRAPH_PHASE_7_PLAN.md)`.
  - "Completed so far" line: `Phases 0, 1, 2, 3, 4, 5, 6 (~8 weeks)` → `Phases 0, 1, 2, 3, 4, 5, 6, 7 (~8.5 weeks)`.
  - If Task 7 or Task 8 chose the document-only path, append a Phase 8 row note: rule-coverage gaps remain as a Phase 8 candidate (no master plan structural change — just a brief mention).

  Commit separately:
  ```
  git commit -m "docs: mark phase 7 complete in master narrative graph plan"
  git push origin develop
  ```

---

## Spec coverage check (self-review)

| Spec requirement (Phase 7 row + carryovers) | Task |
|---|---|
| Manual review of 20 sample systems | Task 1, Task 11 |
| Tune templates and rules based on review | Tasks 2, 4, 5, 7, 10 |
| Phase 5 carryover (a) — CONTRADICTS / era preposition fix | Task 2 |
| Phase 5 carryover (b) — Export HISTORICAL_ELIGIBLE_TYPES | Task 3 |
| Phase 5 carryover (c) — Rotate historical body variants | Task 4 |
| Phase 5 carryover (d) — DESTABILIZES bridge subject shape | Task 5 |
| Phase 5 carryover (e) — Resolve pickHistoricalEndpoints | Task 6 |
| Phase 6 carryover (f) — settlementHookSynthesis trigger rate | Task 8 |
| Phase 6 carryover (g) — whyHere graph-aware rate | Task 7 |
| Phase 3 carryover — empty-story rate decision | Task 9 |
| Add new audit checks | Task 10 |
| `proseUnchanged.test.ts` continues to pass | Verified after every task; final check Task 11 |

**Estimated commits:** 11–13 (one per task plus possible review-fix commits + master plan doc commit).

**Estimated effort:** ~0.5 week (matches the master plan's Phase 7 budget).

---

## Risks & deferred items

- **Snapshot regenerations.** Tasks 2 and 4 will regenerate `phase6On.test.ts` snapshots for affected seeds. Eyeball each diff carefully — only historical-bridge wording (Task 2) and historical-summary variant (Task 4) should change. Task 5 may also regenerate for seeds with phenomenon-subject DESTABILIZES bridges. Any other snapshot drift means something else moved.

- **Decision-deferred tasks.** Tasks 7, 8, 9 each have a "fix vs document" branch that depends on Task 1 review findings. If the implementer reaches Task 7 before Task 1's review is complete, hold and complete the review first — diagnostic data without review context produces wrong decisions.

- **`stableHashString` distribution.** Task 4's variant rotation depends on `stableHashString(edge.id) % family.body.length` distributing reasonably. With 3-variant families and the ID-encoding scheme used by `mintEdgeId`, the practical distribution should be close to uniform but isn't guaranteed. The audit check `prose.alwaysFirstHistoricalVariant` (Task 10) catches degenerate distributions if they emerge.

- **Era-pool expansion vs prose templates.** Task 2 restructures the era pool to be preposition-self-contained. Future era additions must follow the same convention. If a future plan adds a "{historical:eraClause}" alternate slot for templates that want a different preposition, the era pool can stay as-is but each template would need to choose between `{historical:era}` (current adjunct phrase) and a hypothetical `{historical:eraName}` (just the name). Out of scope for Phase 7.

- **Settlement-spine index (Task 8 Option 2) is a new public surface.** If `settlementSpineEdgeIds` is added to `SystemRelationshipGraph`, downstream consumers in Phase 8 may rely on it. Document the contract in the type definition: "settlement-incident eligible spine edges, capped 1 per settlement, populated regardless of whether main `spineEdgeIds` includes them."

- **Manual review subjectivity.** Task 1's review is one reviewer's read of 20 systems. Different reviewers may flag different findings. The audit checks added in Task 10 codify only the carryover-regression patterns, not aesthetic judgments — those would need a different rigor bar (e.g., A/B comparisons, multi-reviewer scoring).

- **Empty-story floor decision is final-but-revisitable.** If Phase 8's deprecation work changes how settlements / phenomena are generated, the empty-story rate may shift. Re-measure in Phase 8.

---

## Outputs the next phase relies on

After Phase 7:
- `narrativeLines` and `narrativeThreads` are still populated (Phase 8 retires them).
- `HISTORICAL_ELIGIBLE_TYPES` is exported and the audit consumes it — Phase 8 can use the same import if it touches historical-edge code.
- Historical body variants are rotated; Phase 8's `phase6On.test.ts` regenerations (if any) won't be confused by always-body[0] artifacts.
- Era pool is preposition-self-contained; Phase 8 can add new eras following the same convention.
- `settlementSpineEdgeIds` (if Task 8 Option 2 chosen) is a stable index Phase 8 can rely on.
- `PHASE_7_SAMPLE_REVIEW.md` documents which findings were Phase 7 in-scope vs Phase 8 candidates — Phase 8's plan can pull from the deferred list.
- All audit checks codified in Task 10 catch regressions; Phase 8 inherits them.
