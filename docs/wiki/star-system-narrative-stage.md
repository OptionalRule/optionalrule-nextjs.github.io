# Star system generator: Narrative stage (#2, #1, #3)

Facts as of `b18e4aa` (2026-11-21, explorer report). Paths are relative to `src/features/tools/star_system_generator/lib/generator/` (G).

- `rng.fork(label)` (G/rng.ts:58-60) is pure: it seeds from `${seed}:${label}` and does not advance the parent. So the order of steps cannot change any RNG stream; only fork labels matter. This makes #2 much safer than the review assumed.
- `generateSystem` narrative steps, with their fork labels: `buildNarrativeFacts` ('factions'), `buildRelationshipGraph` ('graph'), `buildConflicts` ('conflicts'), `graphAwareReshape` (raw rootRng, forks 'graph-prose' internally), `renderSystemStory` ('story'), `selectSystemHooks` ('hooks').
- After them: debris attach ('debris-settlement-anchor', which takes reshaped Settlements, and 'debris-ruin-anchor'), the Companion remap ('subsystem-N'; uses no narrative output), then `derivePopulationLayer(runNoAlienGuard(...))`. `runNoAlienGuard` uses no RNG but scans the narrative text too.
- `fact<T>` is at G/index.ts:395 and depends only on the `Fact` type. It is imported cyclically by companionStar, debrisFields, volatileSystem, prose/graphAwareReshape, and one test.
- No golden seed→hash test exists. `generator-determinism.test.ts` only compares two runs within one process. Prose snapshots exist (`proseUnchanged`, `phase6On`, spine matrices).
- `graphAware` gates `phenomenonNote` and `settlementHookSynthesis` (types.ts:112). The only runtime reader is prose/graphAwareReshape.ts. The `whyHere` rewrite is **not** gated. Deleting the flag kills `graphAwarePhenomenonNote.ts` and `graphAwareSettlementHook.ts` (including `rewriteFourthSentence`), their tests, and `settlementClosers.test.ts`.
- `narrativeDomainsForText` (G/index.ts:3797) feeds `NarrativeFact.domains` → `buildFactIndexes` → `groundQualifierInEntities`/`sharedDomains` in the contradicts and contests rules. Its output shapes the qualifiers on graph edges.

See [architecture-strong-items](architecture-strong-items.md), [decision-log](decision-log.md).

## 2026-11-21 Lane A progress
- `56a8731`: golden guard `__tests__/generator-golden.test.ts` with 200 cases (2 seeds × 96 option combinations + 8 edge seeds), SHA-256 over key-sorted JSON, about 1.4s. Regenerate deliberately with `npm run test:star-system-golden:update`; `vitest -u` doesn't touch it. No nondeterminism found.
- `e351cb9`: plan `docs/superpowers/plans/2026-11-21-narrative-stage.md`. Option A was chosen: a single `runNarrativeStage(input, rootRng)` that keeps the fork labels as literals inside it. The plan awaits user approval (Q16).
- Corrections to the review: 49 full-pipeline test files, not 38. The real `fact` importers are 4 source files and 1 test; factions and the banks were not cyclic. `companionStar` still imports `activityFromRoll` from `./index`, which is left as a follow-up.
- Risk: the hashes were verified only on Node 26. Other CI uses Node 24, and no CI runs on `develop`.

## 2026-11-21 Lane A landed (through `7eb3276`; the golden fixture never changed)
- #2 (`ef2e6a6`..`bbde3b7`): `runNarrativeStage(input, rootRng)`. `fact` is in `lib/generator/fact.ts`. `index.ts` went from 4569 to 4078 lines. A test checks that each of the six fork labels is forked exactly once from the root.
- #3 (`8ba1b67`, `81bc1b8`..`f2e04c8`): `graphAware` is deleted. `graphAwareReshape` now only rewrites `whyHere`. The spine snapshots were unchanged with flags off. In the audit, the "graph-aware rate" metrics are now meaningless (tagHook 92.3%, phenomenonNote 11.7%).
- #1 (`c2e88c5`..`7eb3276`): `narrative/domains.ts` holds `NARRATIVE_DOMAINS`, `NarrativeDomain`, `isNarrativeDomain` and `classifyNarrativeDomains`. Banks, `NarrativeFact.domains`, `CONTROL_DOMAINS` and `PHYSICS_DOMAINS` are typed against it. Seven domains that no faction carries were removed from `CONTROL_DOMAINS` (no output change).
- Open follow-ups: the `companionStar` → `./index` cycle (`activityFromRoll`); `settlementSpineEdgeIds` is built but never read; the audit's graph-aware-rate metrics; the graph rules use `containsWord` to find domain words in prose; `gu.json` domain drift is caught by a test, not the compiler; `CRISIS_*` are prose keywords, not domains; the substring bugs are pinned by tests (fixing them needs an ADR-0001 version-break decision).

## 2026-11-21 follow-ups (`db5a4c3..002d98c`; golden fixture untouched)
- `df5ecbb`: `activityFromRoll` moved to `lib/generator/starActivity.ts`. Nothing in `lib/generator` imports the generator `index.ts` at runtime any more.
- `3affc2e`: the audit script's tagHook and phenomenonNote graph-aware rates were removed; the whyHere rate is kept.
- `002d98c`: `proseMentionsDomain`/`findDomainMentionedInProse` in `narrative/domains.ts` replace raw `containsWord` matching in controls/contests/factionHelpers, with an equivalence test.
- Kept: `settlementSpineEdgeIds`. It is part of the `relationshipGraph` output (golden hash and JSON export), so it isn't dead.
- Kept: the `gu.json` domain-drift test. JSON imports widen to `string`, so a compile-time check would need codegen or moving the data into TS, which would break the README's JSON-pools rule.
- Discrepancy to resolve: Lane A reported 226 audit errors after #3, and this run reported 722 (e.g. `ARCH_MINIMUM_UNSATISFIED`, `ENV_COLD_CLIMATE`). The cause could be a different audit invocation or seed count, or a regression. Not yet investigated.
- 2026-11-21 (resolved): the 226 vs 722 audit errors came from different invocations, not a regression. `audit:star-system-generator:quick` (288 systems) gives 226; the default run (960 systems) gives 722, the same at `f2e04c8` and `3ea803b`. The seeds are deterministic. Note: since the audit exits 1, `npm run test:star-system-generator`, which chains it, always fails. This is a standing broken window.
- 2026-11-21 (Q31): `04d2ce4`, `5b42e59`. The audit compares against `scripts/star-system-audit-baseline.json` (quick 226 / default 722 / deep 3455) and fails only when a count rises or a new code appears. Rewrite the baseline deliberately with `npm run audit:star-system-generator:baseline`. `test:star-system-generator` passes again. Limitation: findings without a code are counted by path, so a rise in one check can be hidden by an equal drop in another on the same path.
