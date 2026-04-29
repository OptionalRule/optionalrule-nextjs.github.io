# Star System Generator Data Table Migration Plan

## Context

The Star System Generator currently keeps many author-facing random results, name fragments, settlement prompts, and narrative option pools as TypeScript constants inside the generator implementation. This works for type safety and determinism, but it makes creative expansion harder than it needs to be.

The main pain point is visibility. It should be easy to answer questions like:

- Do we have enough name cores for systems, planets, moons, and settlements?
- Which settlement categories have thin location, function, or built-form pools?
- Which narrative pools repeat too often across generated systems?
- Which tags, crises, hidden truths, and encounter sites need more options?
- Are all settlement tags backed by useful pressure text for hook synthesis?

This plan moves the best creative and table data into JSON files, while keeping procedural rules in TypeScript.

## Goals

- Make names and narrative option pools easy to view, edit, and expand.
- Keep generation deterministic for the same seed and options.
- Preserve existing output contracts and validation behavior.
- Add data coverage reporting so thin pools are visible without manually reading generator code.
- Keep rule-heavy logic in TypeScript where it is easier to test and reason about.
- Make future creative expansion mostly a JSON edit plus focused verification.

## Non-Goals

- Do not build a general rules engine.
- Do not move architecture slot generation into JSON during this pass.
- Do not move compatibility predicates, semantic validators, or environment repair logic into JSON.
- Do not intentionally change generator output distribution except where a phase explicitly adds new options.
- Do not require runtime file loading; JSON should remain bundled through normal static imports.

## Current High-Value Data Targets

The first migration should focus on content that is both easy to externalize and highly visible in generated results.

### Names

Currently in `lib/generator/index.ts`:

- `systemNameCores`
- `systemNameForms`
- `systemNamePatterns`
- `bodyNameCores`
- `bodyNameFormsByCategory`
- `moonNameCores`
- `moonNameForms`
- settlement naming descriptors derived from function, category, authority, and scale

These directly affect perceived variety and are the best first move.

### Settlement Narrative

Currently in `lib/generator/index.ts`:

- settlement function pools
- GU fracture function pools by site category
- built forms by site category
- settlement authorities
- AI situations
- settlement conditions
- settlement tags
- settlement tag pressure text
- settlement crises
- hidden truths
- encounter sites
- settlement locations by category
- settlement scale table

These are the main author-facing narrative tables and should become easy to expand.

### Play Layer Extras

Currently in `lib/generator/index.ts`:

- human remnants
- remnant hooks
- system phenomena
- phenomenon note templates, if expanded beyond the current simple generated sentence

These are small but player-facing and should live with the other narrative data.

### GU Narrative Tables

Currently split between `lib/generator/index.ts` and `lib/generator/tables.ts`:

- GU intensity labels
- bleed locations
- bleed behaviors
- GU resources
- GU hazards

These are good JSON candidates after names and settlements.

### Mechanical Tables

Lower-priority candidates:

- star type tables
- age and metallicity tables
- architecture roll table
- atmosphere, hydrosphere, geology, climate, radiation, biosphere, moon, and ring tables
- world classes by thermal zone
- belt class table

These can move later, but they need stricter validation because bad edits can create invalid or contradictory worlds.

## Proposed Directory Structure

Add a data directory under the feature:

```text
src/features/tools/star_system_generator/
  data/
    names.json
    settlements.json
    narrative.json
    gu.json
    stellar.json
    world-classes.json
```

Add typed adapter modules under the generator:

```text
src/features/tools/star_system_generator/lib/generator/data/
  names.ts
  settlements.ts
  narrative.ts
  gu.ts
  stellar.ts
  worldClasses.ts
```

The generator should import from the TypeScript adapters, not directly from JSON. This keeps the rest of the code insulated from JSON shape details.

## Data Shape Principles

Use JSON objects when future metadata is likely. Use plain arrays only for genuinely flat pools.

Good candidates for plain arrays:

```json
{
  "systemNameCores": ["Keid", "Vesper", "Lumen"],
  "moonNameForms": ["Minor", "Major", "Cradle"]
}
```

Good candidates for object records:

```json
{
  "settlementTags": [
    {
      "id": "air-is-money",
      "label": "Air Is Money",
      "pressure": "life support has become the settlement currency and the main lever of control.",
      "themes": ["life-support", "scarcity", "class"]
    }
  ]
}
```

Use stable `id` fields for entries that may be referenced by other data. Labels can change for polish; ids should remain stable.

Use category-keyed records for constrained pools:

```json
{
  "builtFormsBySiteCategory": {
    "Orbital station": ["Inflatable modules", "Rotating cylinder"],
    "Moon base": ["Buried pressure cans", "Borehole habitat"]
  }
}
```

## TypeScript Adapter Requirements

Each adapter module should:

- import the JSON data
- expose named exports matching the current generator constants where practical
- assert or type the imported structure against existing TypeScript types
- convert JSON arrays to `readonly` data where useful
- build derived maps or lookup records needed by the generator
- avoid procedural branching beyond simple adaptation

Example shape:

```ts
import namesData from '../../../data/names.json'
import type { BodyCategory } from '../../../types'

export const systemNameCores = namesData.systemNameCores
export const systemNameForms = namesData.systemNameForms
export const bodyNameFormsByCategory = namesData.bodyNameFormsByCategory satisfies Record<BodyCategory, readonly string[]>
```

If TypeScript cannot infer the JSON narrowly enough, add small local interfaces in the adapter rather than weakening generator code with `any`.

## Validation And Coverage

Add a data audit script:

```text
scripts/audit-star-system-data.ts
```

Add package scripts:

```json
{
  "audit:star-system-data": "node --import tsx/esm scripts/audit-star-system-data.ts"
}
```

The audit should report counts and missing metadata, not just pass/fail.

Initial report sections:

- name pools
- settlement site categories
- function pools by category
- built forms by category
- authorities, conditions, AI situations, crises, hidden truths
- settlement tags with pressure text coverage
- encounter sites
- remnants and remnant hooks
- phenomena
- GU resources and hazards

Example output:

```text
Star System Generator Data Audit
Names:
  systemNameCores: 30
  systemNameForms: 30
  bodyNameCores: 36
  moonNameCores: 24

Settlements:
  site categories: 8
  settlementTags: 36
  settlementTags with pressure text: 36/36
  hiddenTruths: 36
  encounterSites: 20

Thin pools:
  remnantHooks: 7
  mobile site locations: 2
```

The audit should fail only on structural errors:

- missing required top-level keys
- empty required arrays
- duplicate ids or labels in id-backed pools
- settlement tags without pressure text
- unknown settlement site categories
- unknown body categories in name form records
- d-table ranges with gaps or overlaps where the table is intended to cover a die roll

Thin-pool warnings should remain warnings so the script is useful during creative expansion.

## Phased Implementation

### Phase 1 - Names Data

Purpose: get immediate authoring value with minimal behavioral risk.

Tasks:

- Add `data/names.json`.
- Add `lib/generator/data/names.ts`.
- Move system, body, moon, and settlement naming pools out of `index.ts`.
- Keep naming functions in TypeScript.
- Preserve current generated naming behavior for existing seeds as much as possible.
- Add or update tests for name pool coverage and deterministic output.

Verification:

- `npm run test -- --run src/features/tools/star_system_generator`
- `npm run audit:star-system-generator:quick`

Acceptance:

- Adding a system/body/moon name option requires editing JSON only.
- Existing name variety tests still pass.
- Same seed/options remain deterministic.

Suggested commit:

- `refactor: move star system name pools to json`

### Phase 2 - Settlement Creative Pools

Purpose: make the largest narrative surface easy to expand.

Tasks:

- Add `data/settlements.json`.
- Add `lib/generator/data/settlements.ts`.
- Move settlement locations, function pools, built forms, authorities, AI situations, conditions, crises, hidden truths, encounter sites, and scale labels into JSON.
- Move settlement tags into structured objects with `id`, `label`, `pressure`, and optional `themes`.
- Update tag hook synthesis to read pressure text from the structured tag data.
- Keep settlement scoring, category selection, and compatibility branching in TypeScript.

Verification:

- `npm run test -- --run src/features/tools/star_system_generator`
- `npm run audit:star-system-generator:quick`

Acceptance:

- All settlement tags have pressure text.
- Settlement function and built-form compatibility tests still pass.
- Generated settlement hooks remain varied across sample systems.

Suggested commit:

- `refactor: move star system settlement pools to json`

### Phase 3 - Data Audit Script

Purpose: expose thin pools and make future expansion intentional.

Tasks:

- Add `scripts/audit-star-system-data.ts`.
- Add `npm run audit:star-system-data`.
- Print count summaries for each creative pool.
- Warn for thin pools using initial thresholds.
- Fail for structural errors.
- Document how to use the report in the feature README or this plan.

Initial thin-pool thresholds:

- system name cores: fewer than 40
- body name cores: fewer than 50
- moon name cores: fewer than 40
- settlement tags: fewer than 50
- crises: fewer than 50
- hidden truths: fewer than 50
- encounter sites: fewer than 30
- remnant hooks: fewer than 20
- any settlement location category: fewer than 4
- any built-form category: fewer than 5

These thresholds are deliberately aspirational. They should identify expansion opportunities, not block commits unless we choose to harden them later.

Verification:

- `npm run audit:star-system-data`
- `npm run test -- --run src/features/tools/star_system_generator`

Acceptance:

- The audit gives a clear summary of where narrative options are thin.
- Structural errors fail with actionable messages.
- Thin pools are reported as warnings.

Suggested commit:

- `test: add star system data coverage audit`

### Phase 4 - GU And Play-Layer Narrative Data

Purpose: move remaining high-visibility creative pools after the settlement migration is stable.

Tasks:

- Add or fill `data/gu.json`.
- Add or fill `data/narrative.json`.
- Move bleed locations, bleed behaviors, GU resources, GU hazards, human remnants, remnant hooks, and phenomena.
- Keep GU intensity modifiers and generation logic in TypeScript.
- Add audit coverage for GU and play-layer pools.

Verification:

- `npm run audit:star-system-data`
- `npm run test -- --run src/features/tools/star_system_generator`
- `npm run audit:star-system-generator:quick`

Acceptance:

- GU resources and hazards are easy to expand in JSON.
- Remnant and phenomenon variety is visible in the data audit.

Suggested commit:

- `refactor: move star system narrative pools to json`

### Phase 5 - Optional Mechanical Tables

Purpose: decide whether the remaining mechanical tables should also move to JSON.

Candidates:

- `lib/generator/tables.ts`
- atmosphere, hydrosphere, geology, climate, radiation, biosphere, moon, and ring tables
- `worldClassesByThermalZone`
- `forcedWorldClasses`
- `beltClassTable`

Additional validation required:

- table range coverage
- valid body categories
- world-class metadata completeness
- environment profile compatibility
- no duplicate world class names unless intentionally allowed
- no impossible default combinations

Verification:

- `npm run test -- --run src/features/tools/star_system_generator`
- `npm run audit:star-system-generator`
- `npm run audit:star-system-data`

Acceptance:

- Mechanical tables can be edited in JSON without weakening validation.
- Existing semantic validation remains the source of truth for compatibility.

Suggested commit:

- `refactor: move star system mechanical tables to json`

## Implementation Notes

### Preserve Determinism

Moving data can change generated output if array order changes. During migration, preserve current order unless intentionally adding new entries.

When adding entries later, output churn is expected. Treat content expansion commits differently from pure migration commits.

### Keep JSON Human-Readable

Prefer grouped records and stable ids over large anonymous arrays when the pool has meaning. The point is not just machine loading; the point is authoring clarity.

### Keep JSON Strict Enough

JSON cannot express TypeScript unions by itself. The adapter and data audit must protect the generator from typos like:

- `Moon Base` instead of `Moon base`
- `rocky_planet` instead of `rocky-planet`
- duplicate tag ids
- missing tag pressure text
- empty category arrays

### Avoid Over-Migration

If moving a table requires encoding conditional behavior, leave the condition in TypeScript and move only the option pools. For example, settlement category choice should stay in TypeScript, while the category's available locations can live in JSON.

## Documentation Updates

After Phase 1 or Phase 2, update `README.md` with:

- where creative data lives
- how to add names
- how to add settlement tags
- how to run the data audit
- the difference between content pool JSON and generator logic

After Phase 3, add a short "expansion workflow":

1. Edit the relevant JSON file.
2. Run `npm run audit:star-system-data`.
3. Run focused generator tests.
4. Run the quick generator audit.
5. Review a handful of generated systems for tone and repetition.

## Risks And Mitigations

Risk: JSON edits silently introduce invalid labels.

Mitigation: adapter typing plus data audit structural failures.

Risk: Pure migration changes generated output.

Mitigation: preserve array order and compare focused deterministic tests before and after each phase.

Risk: Large JSON files become hard to navigate.

Mitigation: split by authoring concern: names, settlements, narrative, GU, stellar, world classes.

Risk: Structured tags create migration work for existing hook synthesis.

Mitigation: keep labels identical, add ids and pressure text, then update lookup logic in one contained pass.

Risk: Mechanical tables in JSON weaken semantic safety.

Mitigation: defer mechanical tables until creative-pool migration and data auditing are stable.

## Definition Of Done

The migration is complete when:

- names and settlement narrative pools live in JSON
- generator code imports typed adapters rather than hardcoded creative arrays
- data audit reports counts and thin pools
- structural data errors fail clearly
- existing focused generator tests pass
- quick star system generator audit passes
- README explains how to expand names and narrative options

