# Generator v3: word-boundary Narrative Domain classification (Q29)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. TDD: each task writes its failing test first.

**Goal:** Ship `GENERATOR_VERSION = 3`. Its only behaviour change is that `classifyNarrativeDomains` matches its vocabulary on word boundaries, so `maintenance` is no longer `ai`, `gold` is no longer `archaeology`, `isolated` is no longer `religion`, and so on. Version 2 stays byte-identical: its classifier is kept verbatim and is selected by version. `generateSystem` takes the Generator Version (default current) and stamps the version it actually ran (ADR-0002). The page passes the decoded Seed Link version into generation, so `v=2` and v-less links reproduce exactly and companion links inherit it.

Paths are relative to `src/features/tools/star_system_generator/` unless they start with `scripts/` or `docs/`.

## Binding decisions

- **Q29:** the substring fix plus the same-class traps ships as v3; the v2 classifier is kept; new ADR (0003).
- **Q30 (context):** hook variety also ships inside v3 later. The seam must make a second version-dependent rule a one-field addition, not a new set of `if (version === 3)` checks.
- **v2 golden fixture must not change.** `__tests__/__fixtures__/generator-golden-hashes.json` is frozen; if any v2 hash moves, stop.
- Do not touch `lib/generator/hooks.ts` (another agent is splitting it). Do not edit `docs/wiki`.
- Project rules: no `any`, no comments, Conventional Commits scope `star_system_generator`, `npm run graph:update` at the end.

## Design it twice: where the version dispatch lives

- **A. Thread a bare `generatorVersion` down** to `classifyNarrativeDomains(value, version)` and branch inside it. Smallest diff, but every future version-dependent rule (Q30 hooks) grows its own `version >= 3` branch somewhere deep in the generator, and the set of supported versions lives in nobody's hands. Rejected.
- **B. One rules table keyed by version** (chosen). A new module `lib/generator/rules.ts` owns `GENERATOR_VERSION`, the supported versions, and `RULES_BY_VERSION: { [V in GeneratorVersion]: GeneratorRules }` where `GeneratorRules = { version, classifyNarrativeDomains }`. `generateSystem` resolves the rules once (`generatorRules(version)`, unknown → current) and stamps `rules.version`. The Narrative Stage receives `rules`; `buildNarrativeFacts` receives only the classifier function. No code below `generateSystem` ever sees a version number. The mapped type makes adding version 4 to `GeneratorVersion` without a rules entry a compile error, and `seedUrl.ts` derives its supported list from the same table, so URL decoding and generation cannot disagree.

Generator entry point, designed twice:

- **A. Third positional param** `generateSystem(options, knownSystem?, version?)`: forces `undefined` placeholders at call sites. Rejected.
- **B. Second param becomes settings** `generateSystem(options, { knownSystem?, generatorVersion? } = {})` (chosen). Only two test call sites pass `knownSystem`.
- **C. Version inside `GenerationOptions`**: rejected; `options` is hashed into the golden fixture and round-tripped as URL options, so v2 output would change.

## v3 term policy

Same 22 rule groups in the same order, pushing the same domains; only matching changes. Each group is a list of literal terms compiled to `\b(?:term1s?|tax(?:es)?|…)\b` on lowercased input: plural `s`, or `es` only after s/x/z/ch/sh (plan review: a blanket `es` would make `wares` read as war). Every explicit form contains its v2 term, so v3 can only remove domains; a corpus test over all 96 option combinations enforces v3 ⊆ v2 per classifier input (fallback `public-life` excepted). Further inflections from plan review are listed explicitly (trader, governing/governed, surveyed/surveyor, researcher, weaponized/weaponry, salvaged, clinical, laborer, drafted, repaired, powered, exiled, archived, misjumped, scouted/scouting, chartered, gateway, striker). Hyphens and `.` count as boundaries, so `narrow-ai`, `ice-chirality`, `sol-interdiction`, `forced-labor` still match. Where v2's leading-substring match caught a real inflection that the plural suffix does not, the form is listed explicitly. v2 stem fragments become explicit words (`terrafor` → `terraform`, `terraforming`, `terraformer`, `terraformed`; `govern` → `govern`, `governance`, `government`, `governor`).

Audit corpus: every narrative-fact classifier input from 288 generated systems (all option combinations x 3 seeds). Per term, mid-word and prefix hits under v2:

| Term | Dropped (trap) | Kept explicitly |
|---|---|---|
| ai | maintenance, maintained, failure, failed, repair, claim, captain, chain, containment, air, airless, star names | ais (plural) |
| sol | isolation, insolvent, solar, solid, sold, solvent, resolves, obsolete | sol-interdiction (hyphen) |
| old | gold, cold, hold, threshold, folded, older | |
| ore | core, bore, borealis, before, forecast, more, censored | ores |
| ark | dark-sector, market, marker, unmarked, parking | arks |
| gate | iggygate (has its own term), interrogated | gates |
| ration | calibration, operations, corporation, generational, vibrations | rations, rationing |
| war | dwarf, swarm, warning, ward, warden, warm, warrant, hardware, toward | wars |
| lab | labor, forced-labor, labeled | labs, laboratory, laboratories |
| law | outlaw (kept), flawlessly | laws, lawful, lawsuit(s), outlaw(s) |
| legal | | illegal, illegally, legally |
| cult | culture, agricultural | cults |
| chart | charter (governance has its own term) | charts, charted |
| mine | determines, famine, mineral, minefield, star names | mines, miner(s), mined |
| stellar | interstellar | |
| anchor | sceneanchor (camelCase tag) | anchorage, anchoring, anchored |
| draft | updraft | |
| claim | reclaim | claims, claimed, claimant(s) |
| fuel | | refueling |
| hidden | hiddentruth (camelCase kind; those facts carry the `secret` tag) | |
| route | rerouted, routeasset (camelCase) | routes, routed |
| others (prefix inflections) | | traded, banking, taxed, debts, secretly, quarantined, chirality, strikebreaker, shielded, shielding, ruined, breached, hazardous, publicly, criminalizes, pinchdrive(s), courtroom |

Dropped without replacement because they are not the domain: `warhead` (from war), `stormbound` for the `storm` disaster group (it stays in route-weather), `mineral`, `minefield`.

## Tasks

### Task 1: v3 classifier beside the verbatim v2 classifier

- [ ] Test `lib/generator/narrative/__tests__/domainClassifier.test.ts`: v2 keeps the trap behaviour (`maintenance` → ai, `isolated` → religion, `gold` → archaeology, the existing assertions); v3 rejects each trap word in the table and still matches each kept form; v3 on `''` is `['public-life']`; v3 group order matches v2 on a sentence free of traps (e.g. `Navy blockade of the trade depot` gives the same array from both).
- [ ] Move `classifyNarrativeDomains` out of `narrative/domains.ts` verbatim into `narrative/domainClassifier.ts` as `classifyNarrativeDomainsV2`; add `NarrativeDomainClassifier` type and table-driven `classifyNarrativeDomainsV3`. Update the existing `domains.test.ts` import.
- [ ] Commit `feat(star_system_generator): word-boundary v3 narrative domain classifier beside v2`.

### Task 2: rules table and version-aware `generateSystem`

- [ ] `types.ts`: `GeneratorVersion = 2 | 3`.
- [ ] Tests: `generateSystem(o, { generatorVersion: 2 }).generatorVersion === 2`; default stamps 3; an unsupported runtime value (`99 as GeneratorVersion`) runs and stamps current; a v2 system's settlement `aiSituation`/`tagHook` facts differ from v3 only where trap words occur (spot check: find a seed whose v2 facts carry `ai` from `maintenance` and show v3 does not).
- [ ] `lib/generator/rules.ts` with `GeneratorRules`, `RULES_BY_VERSION`, `GENERATOR_VERSION = 3`, `SUPPORTED_GENERATOR_VERSIONS`, `generatorRules(version)`. `index.ts` re-exports `GENERATOR_VERSION` and `SUPPORTED_GENERATOR_VERSIONS`; `generateSystem(options, settings = {})` resolves rules and stamps `rules.version`; `NarrativeStageInput.rules`; `NarrativeGenerationContext.classifyDomains`.
- [ ] `seedUrl.ts` imports `SUPPORTED_GENERATOR_VERSIONS` from `./generator` instead of its own list.
- [ ] Update the `knownSystem` call sites (`architecture.test.ts`, `generator-determinism.test.ts`, `orbit-refinement.test.ts`) to `{ knownSystem }`, and `narrativeStage.test.ts` `stageInput()` to pass `rules`. `SUPPORTED_GENERATOR_VERSIONS` is derived from the rules table.

### Task 3: golden guard for both versions

- [ ] `generator-golden.test.ts` iterates `{ 2: generator-golden-hashes.json, 3: generator-golden-hashes-v3.json }`, hashing `generateSystem(options, { generatorVersion })`. `STAR_SYSTEM_GOLDEN_UPDATE=1` rewrites only the current version's fixture; frozen versions are never rewritten. Run first without update: v2 must pass untouched. Then generate the v3 fixture deliberately.
- [ ] Measure the v3 changed count against v2 with the `generatorVersion` stamp normalised (the stamp alone changes every hash). Record it in the ADR.

### Task 4: page passes the decoded version through

- [ ] Test: rendering the generator page at `?seed=…` (no `v`) generates with v2 (the overview's linked-system or export link carries `v=2`); `useGeneratedSystem(options, 2)` returns a system stamped 2.
- [ ] `useGeneratedSystem(options, generatorVersion)` memoised on both; `index.tsx` takes the third tuple element from `useGeneratorQueryState` and passes it. Companion links already use `seedLinkFrom(system, …)`, which reads the stamped version.

### Task 5: ADR-0003, glossary, audit

- [ ] `docs/adr/0003-generator-v3-word-boundary-domains.md`: deliberate break, the 185/200 measurement for the narrow ai/sol/old fix, the final v3 count, term policy summary, v2 kept verbatim, how to add the next version (one rules field + one table entry).
- [ ] `GLOSSARY.md`: Generator Version entry notes that a version's rules are kept so old links reproduce (one sentence). ADR-0001/0002 untouched except an ADR-0001 consequence line pointing to 0003 if it states old versions are not reproducible.
- [ ] Audit: default profile already calls `generateSystem` with the default version, so it runs v3. Compare v2 (pre-change run: 722 errors) with v3. Update `scripts/star-system-audit-baseline.json` only if v3 counts differ and only downward; report numbers either way.

### Task 6: verification and ship

- [ ] Reviewer on `git diff origin/develop...HEAD`.
- [ ] `npm run test -- --run src/features/tools/star_system_generator`, golden for both versions, `npm run lint`, `npx tsc --noEmit`.
- [ ] `git pull --rebase origin develop`, fast-forward push, `npm run graph:update`.
