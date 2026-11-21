# Delete the `graphAware` Path Implementation Plan (#3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Remove `GenerationOptions.graphAware` and every code path it gates, so the Tag Hook is composed in exactly one place (`prose/settlementProse.ts`). There is no change for users: the UI and URL never set the flag.

**Precondition:** the Narrative Stage commits (#2) are on `develop`.

**Architecture:** `graphAwareReshape` keeps its ungated `whyHere` rewrite and its `'graph-prose'` fork (Narrative Stage, see `2026-11-21-narrative-stage.md`). The phenomenon-note branch and the settlement-hook-synthesis branch are deleted together with their modules and tests.

## Binding decisions

- Decision log 2026-11-21: delete the `graphAware` path.
- **Q10:** delete everything it gates: `graphAwarePhenomenonNote.ts`, `graphAwareSettlementHook.ts` (including `rewriteFourthSentence` and `HOOK_REWRITE_POOLS`), and their tests. The `whyHere` rewrite stays.
- **Q11:** the spine matrix snapshot tests switch to flags off, and their snapshots are regenerated.
- **Q5:** the audit script only stops passing `graphAware`.
- **Q4:** one commit per deletion.
- **Q2 / ADR-0001:** the golden fixture `__tests__/__fixtures__/generator-golden-hashes.json` must not change. It covers only flags-off options, and every flag-gated branch is off for those, so deleting the branches cannot move a hash. Never run `npm run test:star-system-golden:update`.
- Project rules: Conventional Commits with scope `star_system_generator`, no `any`, no comments, `npm run graph:update` after `src/` edits.

Paths are relative to `src/features/tools/star_system_generator/`, with `G = lib/generator`.

## Why the flags-off output cannot change

- `graphAwareReshape` forks `'graph-prose'` from the root stream. `whyHere` forks `why-here-${id}` from that, and the hook branch forks `hook-${id}`. `fork` is pure, so removing the hook branch leaves every `why-here-*` stream untouched.
- The phenomenon branch draws from the shared `'graph-prose'` stream, but only when `phenomenonNote` is on. Settlements never draw from that shared stream directly.
- The spine matrix snapshots record only `relationshipGraph` and `systemStory` fields, which the Narrative Stage computes before or apart from the reshape. Their regenerated snapshots are therefore expected to be identical. Any diff is a finding to report, not something to accept silently.

## Name collisions to avoid

`prose/settlementProse.ts` exports `settlementHookSynthesis` (the Tag Hook composer) and `prose/phenomenonProse.ts` exports `phenomenonNote`. These have the same names as the flags, but they are the base prose and **stay**. `CLOSING_POOLS` and its tests in `prose/__tests__/settlementClosers.test.ts` and `settlementProse.test.ts` also stay; only the `HOOK_REWRITE_POOLS` and `graphAwareSettlementHook` blocks of `settlementClosers.test.ts` go.

---

### Task 1: Spine matrices with flags off (Q11)

- [ ] In `G/graph/__tests__/spineToneGuMatrix.test.ts`, `spineToneVoiceMatrix.test.ts` and `spineFullAxisMatrix.test.ts`, delete the `flags` constant and the `graphAware: flags` option.
- [ ] First run the three files **without** `-u`. A pass proves the snapshots are unchanged. Only if they fail, regenerate just these three files with `-u` and report the diff.
- [ ] Commit `test(star_system_generator): run spine matrices with graphAware off`.

### Task 2: Audit script drops the flag (Q5)

- [ ] In `scripts/audit-star-system-generator.ts`, remove the `graphAware` property from `optionsFor…` (about line 293) and the `baseFlags` constants and `graphAware: baseFlags` arguments in `auditDistributionAxisSensitivity` and `auditDensityAxisSensitivity`. Change nothing else.
- [ ] Run `npm run audit:star-system-generator:quick`. The "graph-aware rate" statistics for tagHook and phenomenonNote (script lines about 742-760 and 1596-1602) will shift and become meaningless. Q5 forbids reworking them; they are warnings and statistics only, and the script exits 1 only on errors. Report the shift.
- [ ] Commit `chore(star_system_generator): stop passing graphAware from the audit script`.

### Task 3: Delete the flags-on snapshot test

- [ ] Delete `G/__tests__/phase6On.test.ts` and `G/__tests__/__snapshots__/phase6On.test.ts.snap`.
- [ ] Commit `test(star_system_generator): delete the graphAware-on prose snapshot`.

### Task 4: Delete the phenomenon-note branch (Q10)

- [ ] Red: in `G/prose/__tests__/graphAwareReshape.test.ts`, replace the phenomenonNote cases (the integration describe at about lines 251-303, plus the case at about line 91) with one test asserting that `graphAwareReshape` returns the input `phenomena` array by reference. It should pass already; it pins the behaviour that is about to become unconditional. Convert to flags off (do not delete): the `graphAware: {}` case (about line 79), `iterates settlements even when only phenomenonNote flag is on` (about line 116) and the determinism test (about line 147). Delete the helpers this leaves unused (`makePhenomenonWithFields`, `makeDestabilizesEdge`), because lint treats unused vars as errors.
- [ ] Delete `G/prose/graphAwarePhenomenonNote.ts` and `G/prose/__tests__/graphAwarePhenomenonNote.test.ts`. Remove `reshapePhenomenon` and the `flags.phenomenonNote` branch, so `graphAwareReshape` returns `phenomena: input.phenomena`.
- [ ] Run tsc, lint, the golden guard and the `prose` tests.
- [ ] Commit `refactor(star_system_generator): delete graph-aware phenomenon note`.

### Task 5: Delete the settlement-hook-synthesis branch (Q10)

- [ ] Remove the settlementHookSynthesis cases from `graphAwareReshape.test.ts`, keeping a `whyHere` case that asserts `tagHook` is returned unchanged. That case may use `settlementWithTagHook`/`graphWithEdgesAndSpine`/`makeContestsEdge` (about lines 336-372); delete whichever of these end up unused.
- [ ] Delete `G/prose/graphAwareSettlementHook.ts` and `G/prose/__tests__/graphAwareSettlementHook.test.ts`. In `settlementClosers.test.ts`, delete the `HOOK_REWRITE_POOLS` `it` (about lines 21-28, inside the kept `closing pools` describe) and the `graphAwareSettlementHook rewrite variety` describe (about lines 60-104), together with the imports this leaves unused. Remove the `flags.settlementHookSynthesis` branch, the `flags` parameter from `reshapeSettlement`, and the now-unused `const flags` in `graphAwareReshape`.
- [ ] `graph/types.ts` has a comment naming `graphAwareSettlementHook` as the only consumer of `settlementSpineEdgeIds`. Check with `grep` whether any other consumer remains. If none, report `settlementSpineEdgeIds` as newly dead. Do **not** delete it: it feeds the Relationship Graph that is in the golden output. Remove the stale consumer sentence from that comment.
- [ ] Run tsc, lint, the golden guard and the `prose` tests.
- [ ] Commit `refactor(star_system_generator): delete graph-aware settlement hook synthesis`.

### Task 6: Delete the option itself

- [ ] Remove `graphAware` from `GenerationOptions` (`types.ts`), its cases from `__tests__/types.test.ts` (delete the file if nothing else is left in it), the `'graphAware'` key from the `Omit` in `lib/seedUrl.ts`, and the `candidate.graphAware === current.graphAware` clause in `hooks/useGeneratorQueryState.ts`. `graphAwareReshape` then reads only `options.tone`.
- [ ] Run `grep -rn graphAware src scripts`. Only the `graphAwareReshape`/`graphAwareSettlementWhyHere` names and historical docs may remain.
- [ ] Run tsc, lint, `npm run test -- --run src/features/tools/star_system_generator`, `npm run audit:star-system-generator:quick` and `npm run graph:update`.
- [ ] Commit `refactor(star_system_generator): remove the graphAware generation option`.

### Task 7: Review and merge

- [ ] A fresh reviewer agent checks the diff against `CLAUDE.md` and this plan.
- [ ] Rebase onto `origin/develop`, re-run the golden guard, then push fast-forward only.
