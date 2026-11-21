# Narrative Domain Vocabulary Implementation Plan (#1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Give Narrative Domains one closed vocabulary that every producer and consumer is typed against, so drift between the classifier, the faction banks and the graph rules fails to compile. The change is additive and byte-identical.

**Architecture:** A new leaf module, `lib/generator/narrative/domains.ts`, behind the Narrative Stage seam. It exports `NARRATIVE_DOMAINS` (a closed `as const` tuple), the `NarrativeDomain` union, the `isNarrativeDomain` guard and `classifyNarrativeDomains(text)`. `classifyNarrativeDomains` is `narrativeDomainsForText` moved verbatim. Producers (classifier, faction banks, GU domain tags, explicit `domains:` literals) and consumers (CONTROLS, DESTABILIZES, HIDES_FROM and SUPPRESSES rules) take `NarrativeDomain` instead of `string`.

## Binding decisions

- Decision log 2026-11-21: land #1 additively and byte-identically. The substring bugs ("ai"⊂"maintenance", "sol"⊂"isolated", "old"⊂"gold") **stay**. Fixing them would break ADR-0001 and needs a separate decision.
- **Q17:** the closed set is the union of the domains the current regexes can return. Bank `domains:` literals and `CONTROL_DOMAINS`/`CRISIS_*` are typed against it. Mismatches that would change output are **reported, not fixed**.
- **Q2:** the golden fixture must not change. Never regenerate it.
- **Q6:** add "Narrative Domain" to `GLOSSARY.md` through `domain-modeling`.
- Project rules: no `any`, no casts used to hide mismatches, no comments, Conventional Commits with scope `star_system_generator`, `npm run graph:update`.

Paths are relative to `src/features/tools/star_system_generator/`, with `G = lib/generator`.

## The closed set (from `narrativeDomainsForText` at `ff40fb6`)

`war, trade, espionage, information-integrity, science, ecology, medicine, terraforming, labor, infrastructure, governance, law, religion, gardener-interdiction, crime, migration, archaeology, ai, disaster, stellar-events, public-life, daily-life, exploration, route-weather` (24, kept in regex order).

Every other domain source was checked against it at `ff40fb6`:
- Bank `seedFactions[].domains` literals (balanced bank only; the cinematic and astronomy banks have no seed factions): all inside.
- Bank `kindByDomain` keys (cinematic, astronomy, balanced): all inside. These keys are also a domain source, because `pickDomainsForGenerated` draws from `Object.keys(bank.kindByDomain)`. Key **order** must not change.
- `data/gu.json` `domainTags` values: all 21 distinct values are inside.
- Explicit `domains:` literals in `narrative/narrativeFacts.ts`: all inside.
- `data/narrative.json` `narrativeDomains` keys: the same 24 domains, used as `knownDomains` by `scripts/audit-star-system-data.ts:372`. That is a second copy of the vocabulary, pinned equal by a test in Task 1.
- `data/narrative.ts:7` `NamedFaction.domains` (deprecated export, feeds graph tests only): left as `string`.
- `PHYSICS_DOMAINS` (`destabilizesRules.ts:12`) and the `'gardener-interdiction'` checks in `hidesFromRules.ts`/`suppressesRules.ts`: inside.

## Mismatches (reported; outcome stated per item)

1. **`CONTROL_DOMAINS` contains 7 non-domains:** `route`, `transit`, `compliance`, `authority`, `enforcement`, `customs`, `patrol`. It is matched only against `faction.domains` (`controlsRules.ts:37`). Faction domains come only from bank literals and `kindByDomain` keys, which are all inside the set, so these 7 entries can never match. Removing them is **output-neutral**, and the golden guard proves it. Plan: remove them and type the list `satisfies readonly NarrativeDomain[]`. `graph/__tests__/settingPatterns.test.ts:71-72` asserts `'route'` and `'compliance'`; those two expectations are dropped. If the golden guard disagrees, stop and report.
2. **`CRISIS_DESTABILIZE/DEPENDENCY/CONTEST_KEYWORDS` are not domains.** They are substring keywords matched against crisis prose (`water`, `strike`, `breach` …) by `matchesAny`. Typing them against `NarrativeDomain` would not compile, and turning them into domains would change which Relationships fire, which changes output. Plan: **do not change them**; report to the user that Q17's premise does not hold for `CRISIS_*`.
3. **`controlsRules.ts:99`, `contestsRules.ts:99-101` and `factionHelpers.ts:36` match domain words inside prose** (`containsWord(text, domain)`). That is a classifier-in-reverse that the vocabulary does not own. It is left as is and reported as a follow-up.

## Tasks

### Task 1: Vocabulary module (TDD)

- [ ] Red: write `G/narrative/__tests__/domains.test.ts` asserting that:
  - `NARRATIVE_DOMAINS` equals the 24-entry list above, in order;
  - `isNarrativeDomain('trade')` is true and `isNarrativeDomain('route')` is false;
  - `classifyNarrativeDomains` reproduces the known substring behaviour (`'maintenance'` → includes `'ai'` and `'infrastructure'`; `'isolated'` → includes `'religion'`; `''` → `['public-life']`), pinning the bugs as current behaviour;
  - every value in `data/gu.json` `domainTags` and every bank `kindByDomain` key and seed-faction domain satisfies `isNarrativeDomain`. This is the runtime drift check for JSON, which the compiler cannot see;
  - the keys of `data/narrative.json` `narrativeDomains` equal `NARRATIVE_DOMAINS` as a set.
- [ ] Green: create `G/narrative/domains.ts` with `NARRATIVE_DOMAINS`, `NarrativeDomain`, `isNarrativeDomain`, and `classifyNarrativeDomains` moved verbatim from `narrativeFacts.ts` (returning `NarrativeDomain[]`). Make `uniqueStrings` generic: `<T extends string>(values: readonly T[]): T[]`. `narrativeFacts.ts` imports it.
- [ ] Golden guard, tsc, lint. Commit `refactor(star_system_generator): add the closed narrative domain vocabulary`.

### Task 2: Type the producers

- [ ] `types.ts`: `NarrativeFact.domains: NarrativeDomain[]` (import type from `./lib/generator/narrative/domains`).
- [ ] `factions/index.ts`: `SeedFaction.domains` and `GeneratedFaction.domains` become `readonly NarrativeDomain[]`, and `kindByDomain` becomes `Partial<Record<NarrativeDomain, readonly string[]>>`. In `generateFactions.ts`, `Object.keys(bank.kindByDomain)` is narrowed with `.filter(isNarrativeDomain)`. Type `pickKindForGenerated`'s `domains` parameter and `pickDomainsForGenerated`'s return value as `readonly NarrativeDomain[]`. Guard the `Object.values(bank.kindByDomain)` loop with `if (kinds)`, because `Partial` makes the values `| undefined` (neutral). That is output-neutral because every key passes, which the Task 1 test pins. The key order is preserved.
- [ ] `factions/factionLookup.ts`: `FactionMetadata.domains: readonly NarrativeDomain[]`. Every graph rule reads faction domains through it.
- [ ] `narrativeFacts.ts`: the `narrativeFact` input `domains?: NarrativeDomain[]`.
- [ ] `data/gu.ts`: `domainsForGuValue(..., fallback: readonly NarrativeDomain[]): NarrativeDomain[]`, narrowing the JSON values with `.filter(isNarrativeDomain)` (output-neutral, pinned by the Task 1 test).
- [ ] Fix any compile errors that are real drift by **reporting** them. Expect none.
- [ ] Golden guard, feature tests, tsc, lint. Commit `refactor(star_system_generator): type narrative domain producers against the vocabulary`.

### Task 3: Type the consumers

- [ ] `settingPatterns.ts`: remove the 7 non-domains from `CONTROL_DOMAINS` and add `satisfies readonly NarrativeDomain[]` (mismatch 1). Update `settingPatterns.test.ts` and drop the `as ReadonlyArray<string>` casts in `controlsRules.ts`/`controlsRules.test.ts` where the types now line up. `sharedDomains` becomes generic over `T extends string`.
- [ ] `destabilizesRules.ts`: `PHYSICS_DOMAINS = new Set<NarrativeDomain>([...])`.
- [ ] `settingPatterns.ts`: `groundQualifierInEntities(domain: NarrativeDomain | undefined, …)`. Its callers in `contestsRules.ts` and `contradictsRules.ts` already pass faction or fact domains.
- [ ] Golden guard (it must stay green; otherwise revert and report mismatch 1), feature tests, tsc, lint, `npm run audit:star-system-generator:quick`. Commit `refactor(star_system_generator): type graph rule domains against the vocabulary`.

### Task 4: Glossary and merge

- [ ] Through `domain-modeling`, add **Narrative Domain** under "Narrative graph": "One of a closed set of interest areas (trade, war, religion …) that tags Narrative Facts and Named Factions so the Relationship Graph can connect them." Avoid: domain (unqualified), topic, category. Update **Named Faction** to reference it.
- [ ] Commit `docs(star_system_generator): define Narrative Domain`. `npm run graph:update`.
- [ ] Fresh reviewer on the diff vs this plan and `CLAUDE.md`. Rebase, golden guard, push fast-forward only.
