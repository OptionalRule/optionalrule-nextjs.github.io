# Star System Generator Polish Roadmap

## Purpose

This is the mini-roadmap for improving generated output quality before moving on to advanced options or larger feature work.

The major generator repair plans are implemented or historical:

- `AUDIT_FIX_PLAN.md`
- `POST_AUDIT_REMODEL_PLAN.md`
- `ORBIT_REFINEMENT_PLAN.md`
- `CELESTIAL_DESIGNATION_PLAN.md`

This document tracks the remaining narrative polish, data expansion, and table-quality work that should make ordinary generated systems feel more useful at the table.

## Baseline

Current baseline after the celestial designation and body-interest prose work:

- generated body and moon names are designation-first
- old body/moon name pools are retired alias material
- body-interest summaries use category-aware prompt pools plus context modifiers for moons, rings, biospheres, hydrospheres, radiation, GU conditions, rogue captures, and human-altered sites
- `npm run audit:star-system-data` reports zero structural errors and zero thin-pool warnings
- `npm run audit:star-system-generator` reports zero generated errors and zero warnings
- focused Star System Generator tests pass

## Priority 1 - Expand Body Site Prompts

Status: implemented.

Problem:

`mechanics.siteOptions` is still a very small pool. These prompts appear directly on generated bodies, so repetition is visible in the orbital table and body detail panels.

Current examples:

- `automated survey rig`
- `chiral mining claim`
- `fuel depot`
- `quarantine beacon`
- `first-wave ruin`
- `free captain hideout`

Implementation note:

- Expanded `siteOptions` to 86 entries after a second curated vector pass.
- Added an audit warning threshold so the pool should not regress below 60 entries.
- Kept the pool flat for now, using wording that can plausibly refer to surface, orbital, belt, nearby-space, or anomaly-adjacent sites.
- Deferred category-specific site filtering until the flat pool has more usage feedback.
- Reviewed candidate additions for surface-coded, interior-specific, or duplicate wording before adding the strongest cross-context options.

Recommended work:

- Keep `siteOptions` above 60 entries unless category-specific pools replace the flat pool.
- Prefer compact, concrete, table-facing prompts.
- Include enough variety for survey, extraction, salvage, quarantine, military, route, religious, medical, and refugee uses.
- Keep labels short enough for orbital-table display.

Future option:

- Split `siteOptions` by category or context after the flat pool improves:
  - body category
  - thermal zone
  - GU intensity
  - settlement density

Acceptance checks:

- `npm run audit:star-system-data`
- focused generator tests
- manual sample review of 20-30 systems

## Priority 2 - Improve Body Interest Prose

Status: implemented.

Problem:

Body summaries can still fall back to generic utility language such as orbital context, navigation terrain, or broad science/extraction value.

Recommended work:

- Expanded and refactored `bodyInterest.ts` with category-aware pools for:
  - operational use
  - local conflict
  - visual hook
  - settlement strain
  - survey question
  - operational constraint
- Added modifier phrases for hydrosphere resources, biospheres, severe radiation, GU/chiral/metric conditions, moons, rings, and rogue-captured bodies.
- Added a human-altered override layer for facility, quarantine, terraforming, shielded, former-settlement, and engineered-site worlds.
- Reduced repeated phrase openings seen in generator audits while keeping summaries concise enough for UI panels.

Candidate design:

```ts
interface BodyInterestPrompt {
  category: BodyCategory | 'default'
  use: string
  conflict: string
  sensory?: string
  surveyQuestion?: string
}
```

Acceptance checks:

- Body-interest summaries remain deterministic for a seed.
- Summaries do not duplicate `bodyProfile` or `giantEconomy` text verbatim.
- Audit phrase-opening concentration improves.
- focused generator tests and quick audit pass.

## Priority 3 - Add Settlement Tag-Pair Hooks

Status: not started.

Problem:

The settlement tag pool is strong, but only a small number of tag-pair combinations have authored connective tissue. Most random pairs fall back to generic synthesis.

Current baseline:

- `settlementTags`: 52
- `tagPairHooks`: 15
- quick generator audit passes, but top fallback-style tag-hook openings still repeat visibly across the corpus

Recommended work:

- Add 40-60 authored `tagPairHooks` for high-value combinations.
- Prioritize combinations involving:
  - life support
  - debt labor
  - route weather
  - medical triage
  - archives and falsified records
  - Gardener compliance
  - AI witness custody
  - terraforming liability
  - refugee and evacuation pressure
- Keep pair hooks specific enough to explain how the two tags interact.
- Raise authored pair coverage to at least 55 total hooks before considering this priority complete.

Acceptance checks:

- `npm run audit:star-system-data`
- settlement-data tests
- manual review of settlement cards across crowded/hub systems.

## Priority 4 - Structure System Phenomena Consequences

Status: not started.

Problem:

System phenomena are flavorful labels, but generated notes still use generic wording about shaping travel, surveys, or conflict.

Current baseline:

- `phenomena`: 32
- the pool is no longer thin by data-audit standards, but entries are still plain labels

Recommended work:

- Convert `phenomena` from strings to structured entries, or add a parallel metadata map.
- Give each phenomenon specific play consequences.

Candidate structure:

```ts
interface PhenomenonEntry {
  label: string
  travelEffect: string
  surveyQuestion: string
  conflictHook: string
  sceneAnchor: string
}
```

Acceptance checks:

- Existing no-alien guard still passes.
- Phenomena remain domain-usable by narrative generation.
- Markdown export shows more useful phenomenon notes.

## Priority 5 - Make Narrative Variable Pools Grammar-Safe

Status: not started.

Problem:

Narrative templates sometimes combine labels and phrases that are individually valid but grammatically awkward when inserted into sentence slots.

Recommended work:

- Split broad variable pools into grammar-specific pools.
- Prefer slot names that encode grammatical shape.

Candidate pools:

- `threatClauses`
- `evidenceClaims`
- `publicGroups`
- `resourceStakes`
- `leverageAssets`
- `secretClauses`
- `sceneAnchors`
- `choiceClauses`

Acceptance checks:

- Narrative text avoids known awkward patterns.
- Existing narrative-data validation continues to catch missing or unused slots.
- focused generator tests pass.

## Priority 6 - Add Local-Scale Institutions

Status: not started.

Problem:

Named factions are useful but skew large. More small institutions would make generated systems feel lived-in and less dominated by setting-scale powers.

Recommended work:

- Add local institutions to narrative and settlement pools:
  - repair guilds
  - clinic boards
  - salvage houses
  - dock cooperatives
  - weather offices
  - school modules
  - family trusts
  - debt families
  - route-window clerks
  - shelter committees
- Use these mostly as actors, authorities, publics, and scene anchors.

Acceptance checks:

- Narrative output contains more local actors without losing named-faction flavor.
- Settlement authorities remain coherent by scale.
- data audit passes.

## Deferred - Optional Celestial Aliases

Status: deferred.

The canonical designation model is implemented. Do not reintroduce default poetic names for every body.

If aliases are added later, they should be optional and justified by generated context:

- body has a settlement
- body hosts a human remnant
- body is central to a narrative thread
- body has a rare biosphere or major GU anomaly
- moon hosts a settlement or critical resource

Potential display:

```text
Nosaxa IV, locally called Sable
Nosaxa IV - Moon I, locally called Low Bell
```

## Not In This Roadmap

These should wait until the polish pass is complete:

- advanced generator controls
- import UI
- editable outputs
- custom table packs
- campaign persistence
- map visualization
- live external astronomy data
