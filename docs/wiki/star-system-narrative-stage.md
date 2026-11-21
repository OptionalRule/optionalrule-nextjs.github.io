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
