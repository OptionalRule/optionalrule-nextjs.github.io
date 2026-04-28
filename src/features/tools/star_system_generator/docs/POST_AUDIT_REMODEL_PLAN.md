# Star System Generator Post-Audit Procedural Remodel Plan

## Purpose

This is the next plan of record after the completed `AUDIT_FIX_PLAN.md`. The prior plan should remain historically clean as the record of the first repair pass. This document captures the post-audit remodel needed to move the Star System Generator from source-inspired table stitching into a more durable procedural system with explicit compatibility contracts.

The user has accepted moving beyond the original dice ranges where needed. `SOURCE_WRITEUP.md` remains the inspiration, setting procedure, and tone reference, but generated output must now be governed by semantic contracts that prevent impossible or incoherent systems. When exact dice-table fidelity conflicts with compatibility, architecture integrity, imported locked facts, or auditability, the compatibility contract wins and the deviation should be documented.

Deep audit findings to address:

- 1 compact inner architecture core-count failure in 4,800 generated systems.
- 691 airless atmosphere contradictions.
- 335 airless hydrosphere contradictions.
- 268 desert hydrosphere contradictions.
- 126 systems with duplicate settlement names.

## Implementation Status

Implemented through the procedural remodel checkpoint series on `develop`:

- Phase 0: `refactor: expose star system generator domain contracts`.
- Phase 1: `test: share star system validation contracts`.
- Phase 2: `fix: normalize star system environment details`.
- Phase 3: `refactor: add star system architecture slot contracts`.
- Phase 4: `refactor: add world class compatibility metadata`.
- Phase 5: `fix: repair duplicate star system settlement names`.
- Phase 6: `feat: improve star system narrative coherence`.
- Phase 7: `feat: report star system locked fact conflicts`.
- Phase 8: `docs: document star system procedural contracts`.

The current acceptance baseline is: focused star-system generator tests pass, quick and deep star-system audits report zero generated errors and zero warnings, and locked imported contradictions are reported separately as locked-fact conflicts instead of being silently rewritten.

## Design Principles

- Make validity a first-class generation artifact, not an after-the-fact cleanup pass.
- Prefer explicit policies and slot contracts over scattered string checks.
- Keep generated systems deterministic for a seed/options/input tuple.
- Preserve locked imported facts exactly; validate and report conflicts instead of silently rewriting them.
- Keep source tables as weighted inputs, then normalize through compatibility contracts.
- Export shared predicates and compatibility sets so generator code, tests, and audits use the same rules.
- Add minimal repair behavior where needed, but keep official audit failures for violations that should never ship.
- Commit at coherent phase boundaries after focused verification.

## Agent Review Summary

### Environment Review

The current detail generation can roll plausible-looking but incompatible combinations: airless bodies with ordinary atmospheres or hydrospheres, deserts with excessive water, and special classes that inherit terrestrial detail assumptions.

Recommended direction:

- Add a shared `environmentPolicy` model derived from body class, category, thermal zone, physical properties, and stellar context.
- Use profile families such as `airless`, `desert`, `terrestrial`, `ocean`, `envelope`, `belt`, `anomaly`, and `facility`.
- Generate details by deriving policy first, rolling within profile-aware tables, then clamping or replacing invalid values through allowlists.
- Generate biosphere only from the normalized environment, not from pre-normalized table rolls.
- First slice may use string predicates against existing class/category labels.
- Durable slice should add structured metadata to `WorldClassOption` so profile selection is not dependent on label text.
- Locked imported facts should be validated and reported when incompatible with policy, not overwritten.

### Architecture Review

The current flat `BodyPlanKind[]` body plan makes it too easy for anomalies, locked imports, or rare crossovers to consume slots that the architecture description expects to remain part of the core planetary chain.

Recommended direction:

- Replace flat body-plan kinds with `ArchitectureProfile` and `ArchitectureSlot` contracts.
- Slots should carry roles such as `core`, `support`, `crossover`, `scar`, and `known`.
- Slot contracts should define `allowedCategories`, `countsToward`, and `replacementPolicy`.
- Compact systems must protect at least three rocky-chain core slots.
- Anomalies should be extra scar slots or overlays, not replacements for required core slots.
- Known locked bodies must not be mutated. If a locked known body occupies a required slot but does not satisfy it, add a replacement generated core slot instead of reshaping the locked body.

### Audit And Naming Review

Settlement names still collide often enough to be visible in deep corpora, and semantic validation remains split between tests, generator logic, and audit scripts.

Recommended direction:

- Add deterministic settlement `NameRegistry` behavior with repair before final output.
- Treat duplicate settlement names as official audit errors.
- Extract shared semantic validators under `generator/validation.ts`.
- Use the same validators in generator tests and audit scripts.
- Add a deep audit npm script/profile policy for pre-release runs.
- Add tests for duplicate-name repair and validator fixtures.

## Target Architecture

### Environment Policy Model

Add a generator-level policy layer that sits between world class selection and detail generation.

Policy inputs:

- Body category and class option.
- Thermal zone and orbit context.
- Radius/mass/density/gravity where available.
- Stellar activity and radiation context.
- GU anomaly or artificial/facility flags.
- Locked imported detail facts.

Policy outputs:

- Profile family: `airless`, `desert`, `terrestrial`, `ocean`, `envelope`, `belt`, `anomaly`, `facility`, or a small extension set if required.
- Allowed atmosphere tags and replacement fallbacks.
- Allowed hydrosphere tags and replacement fallbacks.
- Allowed geology/climate/radiation ranges where relevant.
- Biosphere eligibility and modifiers.
- Conflict reports for locked facts.

Generation flow:

1. Select or preserve body class.
2. Derive `environmentPolicy`.
3. Roll atmosphere, hydrosphere, geology, climate, and radiation from profile-aware tables.
4. Normalize or replace invalid generated values through policy allowlists.
5. Validate locked facts against policy and record conflicts without mutation.
6. Generate biosphere from the normalized detail state.
7. Emit validation metadata for audit visibility.

### Architecture Profiles And Slots

Replace architecture output that behaves like a plain array with profile contracts.

`ArchitectureProfile` should define:

- Architecture id and display label.
- Slot templates with role, count/range, category allowlist, and ordering hints.
- Minimum required slot satisfaction by semantic category.
- Optional support and crossover slot behavior.
- Scar/anomaly overlay policy.
- Known-body placement and replacement policy.

`ArchitectureSlot` should define:

- `role`: `core`, `support`, `crossover`, `scar`, or `known`.
- `allowedCategories`: semantic body categories accepted for that slot.
- `countsToward`: named architectural requirements, such as `rockyChainCore`, `giantPresence`, or `debrisDominance`.
- `replacementPolicy`: whether an incompatible locked or anomaly body can consume, overlay, skip, or require an added generated slot.

Compact inner system contract:

- Require at least three rocky-chain core slots.
- Keep anomalies as scar extras or overlays.
- Keep imported locked bodies intact.
- If a known locked body occupies one of the first inner positions but is not rocky-chain compatible, generate an additional compatible core slot so the architecture still satisfies its minimum.

### Shared Validation

Create shared validators under `generator/validation.ts` and make the audit import them instead of duplicating rules.

Initial validators:

- Environment compatibility for atmosphere/hydrosphere/profile.
- Desert hydrosphere compatibility.
- Airless atmosphere and hydrosphere compatibility.
- Architecture minimum slot satisfaction.
- Settlement name uniqueness.
- Locked-fact conflict reporting.

Validators should return structured results with severity, code, message, target id/path, and enough context for test fixtures and audit summaries.

### Deterministic Name Registry

Settlement naming should reserve and repair names before final output.

Requirements:

- Deterministic for seed/options/input.
- Scope names per generated system.
- Preserve locked imported settlement names when future imports expose them.
- Repair generated duplicates by adding meaningful site, authority, orbital, or ordinal qualifiers.
- Emit validation errors if duplicates remain after repair.
- Add duplicate settlement names as official deep-audit failures, not warnings.

## Implementation Blueprint

This section turns the remodel into file-level work. The goal is to make each phase small enough to commit independently while still moving toward the final procedural contract.

### Specialist Review Addendum

This plan was reviewed from four angles: code architecture, procedural generation systems, narrative procedural generation, and test/audit strategy. The review confirmed the direction but identified several required refinements before implementation:

- Add an early foundation phase because planned modules depend on generator-local types such as `WorldClassOption` and `BodyPlanKind`.
- Make diagnostics and repair metadata available from the start of the remodel instead of deferring the decision to the final integration phase.
- Define an explicit RNG consumption contract so repairs, replacement slots, and name uniqueness do not destabilize unrelated output.
- Model architecture generation as slot templates, occupants, filtered occupants, and satisfaction results so replacement behavior is observable and testable.
- Expand validation beyond the current audit rules to include the exact airless/desert contradiction families that motivated the remodel.
- Gate duplicate-name findings carefully until the registry repair phase lands, because quick audit samples already contain duplicate settlement names that the current audit does not catch.
- Preserve narrative value during repairs by turning invalid raw rolls into structured diagnostics or GM-useful implications instead of silently flattening them to generic safe values.
- Add a narrative coherence phase for settlement hooks, body-interest prose, scale/crisis compatibility, and fracture-system settlement ecology.

### Current Code Seams

- Main generator: `src/features/tools/star_system_generator/lib/generator/index.ts`.
- Shared public types: `src/features/tools/star_system_generator/types.ts`.
- Source tables: `src/features/tools/star_system_generator/lib/generator/tables.ts`.
- Deterministic helpers: `src/features/tools/star_system_generator/lib/generator/rng.ts`, `dice.ts`, and `calculations.ts`.
- Main regression tests: `src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts`.
- Audit script: `scripts/audit-star-system-generator.ts`.
- Current detail seam: `generateDetail`, `rollAtmosphere`, `rollHydrosphere`, `rollGeology`, `generateClimate`, and `generateBiosphere`.
- Current architecture seam: `BodyPlanKind`, `architectureBodyPlanRules`, `generateBodyPlan`, `selectWorldClassForPlanKind`, `reservedKnownSlots`, and `generateBodies`.
- Current settlement-name seam: `generateSettlementName` and `generateSettlements`.
- Current audit duplication seam: audit-local sets and functions such as `auditArchitectureIntent`, `auditBody`, `hasDuplicates`, and category/profile predicates.

### New Modules

Add these modules under `src/features/tools/star_system_generator/lib/generator/` unless implementation pressure shows a clearer split:

- `validation.ts`: shared validation types, compatibility predicates, semantic category sets, and validators used by tests and audit.
- `environmentPolicy.ts`: derives environment policy from class/category/thermal/physical/star context and normalizes generated detail rolls.
- `architecture.ts`: owns architecture profiles, slot templates, slot expansion, known-body placement, and slot satisfaction accounting.
- `nameRegistry.ts`: owns deterministic reservation and duplicate repair for generated settlement names.
- `domain.ts` or `worldClasses.ts`: early home for exported generator-domain types such as `WorldClassOption`, `BodyPlanKind`, semantic category sets, forced classes, and world-class registries.
- `worldClassMetadata.ts` or a future `worldClasses.ts`: durable home for structured world class metadata after the first slices are stable.
- `hookSynthesis.ts`: later narrative coherence pass for settlement tags, crises, hidden truths, and encounter implications.
- `bodyInterest.ts`: later play-facing body-interest synthesis that balances astronomy fact, pressure point, and table use.
- `repairNarratives.ts`: later bridge from validation repairs to concise GM-facing implications.

Keep `index.ts` as the orchestrator during the remodel. It should call these modules rather than continuing to accumulate policy logic.

### Determinism And RNG Contract

Every new generation module must be deterministic for the same seed/options/known-system tuple. Avoid accidental output churn by isolating new randomness behind stable forks:

- Policy derivation and validation should be pure and should not consume RNG.
- Environment repair should use deterministic transforms where possible. If a repair needs random selection, use a stable fork such as `body-${slotId}:environment-repair`.
- Architecture replacements should use stable slot ids and forks such as `slot-${slotId}:replacement`.
- Settlement name repair should use the settlement id or stable selected-settlement ordinal, for example `settlement-${id}:name-repair`.
- New randomness must not consume from the same sequential stream used by later body details, moons, settlements, or hooks unless the resulting output churn is intentional and documented in the phase notes.
- Tests must prove repair determinism independently from whole-system determinism.

### Shared Validation Contract

`validation.ts` should expose a small, stable result shape:

```ts
export type ValidationSeverity = 'error' | 'warning' | 'info'
export type ValidationSource = 'generated-error' | 'locked-conflict' | 'repair-applied' | 'audit' | 'test'

export interface ValidationFinding {
  severity: ValidationSeverity
  code: string
  path: string
  message: string
  targetId?: string
  targetKind?: 'system' | 'body' | 'moon' | 'settlement' | 'architecture' | 'locked-fact'
  source?: ValidationSource
  observed?: unknown
  expected?: unknown
  rawValue?: unknown
  finalValue?: unknown
  policyCode?: string
  locked?: boolean
  gmImplication?: string
}
```

Initial validator exports:

- `validateSystem(system: GeneratedSystem): ValidationFinding[]`.
- `validateBodyEnvironment(body: OrbitingBody, path?: string): ValidationFinding[]`.
- `validateBodyPhysicalContract(body: OrbitingBody, path?: string): ValidationFinding[]`.
- `validateArchitecture(system: GeneratedSystem): ValidationFinding[]`.
- `validateSettlementNames(system: GeneratedSystem): ValidationFinding[]`.
- `validateSettlementCompatibility(system: GeneratedSystem, settlement: Settlement, path?: string): ValidationFinding[]`.
- `validateMoonAnchors(system: GeneratedSystem): ValidationFinding[]`.
- `validateNoAlienText(system: GeneratedSystem): ValidationFinding[]`.
- `validateLockedBodyDetail(body: OrbitingBody, policy: EnvironmentPolicy, path?: string): ValidationFinding[]`.
- Shared predicate helpers such as `isEnvelopeCategory`, `isSolidSurfaceCategory`, `isRockyChainCategory`, `isAirlessClass`, `isAirlessAtmosphere`, `isAirlessHydrosphere`, `isDesertClass`, `isAtmosphereCompatible`, `isHydrosphereCompatible`, and `isDesertCompatibleHydrosphere`.

The audit may still own corpus statistics, coverage checks, and distribution checks. It should not own semantic compatibility rules that generator tests also need.

### Environment Policy Contract

`environmentPolicy.ts` should define a summary profile plus facets. The profile is useful for audit grouping, but compatibility decisions should use facets so hybrid cases do not get flattened.

```ts
export type EnvironmentProfile =
  | 'airless'
  | 'desert'
  | 'terrestrial'
  | 'ocean'
  | 'envelope'
  | 'belt'
  | 'anomaly'
  | 'facility'

export interface EnvironmentPolicyFacets {
  substrate: 'solid' | 'minor-body' | 'envelope' | 'metric-phenomenon' | 'engineered'
  atmosphereRegime: 'airless' | 'trace' | 'thin' | 'moderate' | 'dense' | 'envelope' | 'controlled' | 'exotic'
  volatileState: 'none' | 'dry' | 'buried' | 'ice' | 'local-liquid' | 'ocean' | 'deep-envelope' | 'imported' | 'exotic'
  surfaceAccess: 'open-surface' | 'hostile-surface' | 'sealed-habitat' | 'cloud-tops' | 'no-surface'
  management: 'natural' | 'terraformed' | 'failed-terraforming' | 'active-facility' | 'gu-distorted'
  biosphereEligibility: 'none' | 'prebiotic' | 'microbial' | 'open'
  specialTags: string[]
}

export interface EnvironmentPolicy {
  profile: EnvironmentProfile
  facets: EnvironmentPolicyFacets
  atmosphere: {
    allowed: ReadonlySet<string>
    fallback: string
  }
  hydrosphere: {
    allowed: ReadonlySet<string>
    fallback: string
  }
  geology?: {
    allowed?: ReadonlySet<string>
    fallback?: string
  }
  climate?: {
    allowed?: ReadonlySet<string>
  }
  biosphere: {
    allowed: boolean
    forced?: string
  }
  notes: string[]
}
```

First-slice derivation can use existing strings:

- `airless`: class names containing `Airless`, stripped remnant classes with hard-vacuum behavior, belts with no normal atmosphere, or tiny/dwarf bodies where atmosphere was clearly stripped.
- `desert`: class names containing `desert`, `Dry`, `Mars-like`, `Mercury-like`, hot stripped cores, or hot super-Earth conversions that explicitly note `Hot Neptune desert`.
- `ocean`: class names containing `Ocean`, `Waterworld`, `Hycean`, ice-shell ocean candidates, or hydrosphere rolls that must preserve ocean identity.
- `envelope`: `sub-neptune`, `gas-giant`, or `ice-giant`.
- `belt`: `belt`.
- `anomaly`: `anomaly` unless it is clearly a human facility.
- `facility`: artificial platforms, shielded facility worlds, corporate industry worlds, failed terraforming sites, Trojan settlement zones, and similar human-built or human-managed worlds.
- `terrestrial`: default solid-world profile after the more specific profiles are excluded.

Policy application order:

1. Roll source-inspired raw detail values.
2. Apply nearest-compatible policy replacement to generated atmosphere, hydrosphere, geology, and climate values. Preserve valid raw rolls unchanged.
3. Apply locked imported facts through `mergeLockedFact`.
4. Recompute nonlocked dependent facts, especially biosphere, from the final post-lock detail state.
5. Validate locked facts against the same policy and report conflicts instead of repairing them.
6. Feed final detail into body profile and body-interest generation.

Generated repairs should keep structured provenance out of player-facing prose. Emit a `repair-applied` finding with `rawValue`, `finalValue`, `policyCode`, and optional `gmImplication`. Example: an invalid ocean roll on an airless body should not silently become `Bone dry`; it can become a compatible value such as `sealed briny aquifers`, `buried volatile lens`, or `false survey claim` depending on body class and context, with the raw roll preserved for audit and GM notes.

### Architecture Slot Contract

`architecture.ts` should replace `BodyPlanKind[]` as the authoritative body plan with slot-aware output. `BodyPlanKind` may remain a low-level class-selection hint, but slot satisfaction must be based on final occupants after filters and locked imports.

```ts
export type ArchitectureSlotRole = 'core' | 'support' | 'crossover' | 'scar' | 'known'
export type ArchitectureRequirement = 'rockyChainCore' | 'giantPresence' | 'debrisDominance' | 'fullPlanetLimit'
export type ArchitectureOccupantSource = 'generated' | 'locked-known' | 'replacement'

export interface ArchitectureSlot {
  id: string
  role: Exclude<ArchitectureSlotRole, 'known'>
  planKind: BodyPlanKind
  allowedCategories: ReadonlySet<BodyCategory>
  countsToward: ArchitectureRequirement[]
  replacementPolicy: 'consume' | 'overlay' | 'skip' | 'add-replacement'
  orderHint: number
  source: string
}

export interface ArchitectureProfile {
  name: string
  bodyRange: readonly [number, number]
  intent: string
  minimums: Partial<Record<ArchitectureRequirement, number>>
  maximums?: Partial<Record<ArchitectureRequirement, number>>
  buildSlots(rng: SeededRng): ArchitectureSlot[]
}

export interface ArchitectureSlotOccupant {
  slotId: string
  source: ArchitectureOccupantSource
  plannedKind: BodyPlanKind
  finalBodyId: string
  finalCategory: BodyCategory
  satisfies: ArchitectureRequirement[]
  replacementForSlotId?: string
}

export interface ArchitectureGenerationResult {
  slots: ArchitectureSlot[]
  occupants: ArchitectureSlotOccupant[]
  findings: ValidationFinding[]
}
```

Slot migration rules:

- Keep `BodyPlanKind` initially as the low-level world-class selection hint.
- Add slots around the existing architecture distributions first, then move count logic out of `generateBodyPlan`.
- Slot satisfaction should follow `slot template -> candidate -> filtered occupant -> satisfaction result`.
- Locked known bodies are an occupant source, not a slot role. A locked known rocky body may satisfy a core slot; a locked incompatible body may occupy an orbit but should not satisfy that requirement.
- If a locked known body blocks a required `core` slot, add a generated replacement core slot and orbit rather than mutating the locked body.
- Anomaly slots should be `scar` slots by default. They can overlay or append, but they should not consume required `rockyChainCore` or `giantPresence` slots unless a profile explicitly allows that.
- Slot expansion must happen before orbit allocation. Use deterministic slot ids and per-slot RNG forks. Added replacement slots must receive deterministic, sorted orbits without changing locked orbit facts.
- Architecture generation metadata may be internal at first, but validators and tests must be able to inspect it. If adding it to `GeneratedSystem` would create UI churn, pass an internal `ArchitectureGenerationResult` through the generator/test path until diagnostics are surfaced.

Compact inner system acceptance contract:

- At least three final bodies must satisfy `rockyChainCore`.
- Scar/anomaly bodies can coexist with the compact chain but cannot reduce the core count below three.
- The test should include a locked incompatible body placed inside the compact-chain region and prove an additional compatible core body is generated.

### World Class Metadata Contract

`WorldClassOption` should eventually become metadata-backed:

```ts
interface WorldClassOption {
  className: string
  category: BodyCategory
  massClass: string
  environmentProfileHint?: EnvironmentProfile
  architectureTags?: ArchitectureRequirement[]
  physicalTags?: Array<'airless' | 'volatile-rich' | 'desert' | 'ocean' | 'facility' | 'gu-anomaly' | 'stripped-core'>
  specialHandling?: Array<'no-moons' | 'no-rings' | 'managed-habitat' | 'metric-phenomenon'>
}
```

Migration should be incremental:

- Phase 2 may use string predicates because it reduces the largest contradiction classes quickly.
- Phase 4 must add metadata completeness tests for every world-class option in every thermal-zone table plus forced/fallback classes, belt tables, filter-created classes, and runtime replacement classes.
- Create an `allWorldClassOptions` registry or metadata builder used by table rows, forced classes, filters, and fallback outputs so metadata coverage is auditable.
- After metadata is complete, validators and policies should use metadata first and string predicates only as compatibility fallback.

### Name Registry Contract

`nameRegistry.ts` should expose a deterministic registry:

```ts
export interface NameRepairContext {
  bodyName?: string
  anchorName?: string
  anchorKind?: string
  location?: string
  siteCategory?: string
  authority?: string
  functionName?: string
  settlementId?: string
  ordinal: number
}

export class NameRegistry {
  reserve(name: string): void
  uniqueGeneratedName(baseName: string, context: NameRepairContext): string
}
```

Repair order:

1. Use the base generated name if unused.
2. Canonicalize collision keys by case-folding, trimming, collapsing whitespace, and ignoring punctuation variants.
3. Add a site/category qualifier, such as `Node`, `Base`, `Platform`, or `Dome`.
4. Add an authority/function qualifier, such as `Cordon`, `Refinery`, `Commons`, or `Harbor`.
5. Add route-specific or anchor-specific qualifiers for repeated gate/route names, such as `Customs Node`, `Quarantine Throat`, `Freeport Queue`, or `Transit Yard`.
6. Add an anchor/body qualifier if it is not already present.
7. Fall back to deterministic ordinal suffix, such as `02`, only after semantic qualifiers collide.

Reserve locked names first. Add a deterministic tie-breaker for settlement processing order, such as presence score, orbit, body id, and settlement id. Keep the original random base name and only repair duplicates.

### Narrative Coherence Contract

Validity is necessary but not enough for a TTRPG-facing generator. Repair and compatibility layers should improve table usability rather than merely suppress invalid values.

Narrative modules should add:

- Weighted settlement hook synthesis using site category, function, body detail, scale, authority, condition, crisis, and GU context.
- Scale-aware authority/crisis/condition behavior. `Automated only` and `Abandoned` sites should bias toward AI, remote authority, salvage, maintenance, quarantine, probe-era mysteries, or post-event exploitation rather than ordinary civic crises.
- Fracture-system settlement ecology that includes support settlements, clinics, repair yards, food culture labs, debt courts, salvage docks, and refugee warrens instead of converting every site into a GU extraction or containment function.
- Body-interest synthesis that chooses one astronomy fact, one pressure point, and one play use, instead of relying only on the first few generated reason strings.
- Repair narratives that convert invalid raw rolls into concise GM implications such as rumor, false survey, hidden resource, legal dispute, or containment problem.

Tests should cover contextual naming, hook coherence, scale/crisis compatibility, body-interest phrase diversity, and no-alien preservation.

Settlement duplicate-name validation should become an audit error after the registry repair phase lands. Before then it can run in report-only or baseline mode so Phase 1 does not knowingly break quick/default audit. Corpus-level name concentration can remain a warning.

## Phased Implementation Plan

### Phase 0 - Domain Extraction And Instrumentation Contract

Purpose: create stable module boundaries before moving policy logic out of `index.ts`.

Work items:

- Move or export generator-domain types needed by new modules: `WorldClassOption`, `BodyPlanKind`, semantic body-category sets, forced/fallback classes, and world-class option registries.
- Add the initial `ValidationFinding` type and code/category constants with `generated-error`, `locked-conflict`, and `repair-applied` sources.
- Add explicit quick/deep audit scripts in `package.json`.
- Define the RNG fork contract for new modules and document it near `rng.ts` or in this plan.
- Keep behavior unchanged.

Verification:

- TypeScript compile through existing tests.
- Existing star system generator tests.
- Quick audit.

Recommended commit:

- `refactor: expose star system generator domain contracts`

### Phase 1 - Shared Validators And Audit Contract

Purpose: create one authority for semantic checks before changing generation behavior.

Work items:

- Add `generator/validation.ts` with structured validation result types.
- Move existing audit-only compatibility checks into shared validators while leaving audit-only coverage and distribution checks in the script.
- Add new semantic validators for the known failure classes that are not fully represented in the current audit: airless atmosphere, airless hydrosphere, desert hydrosphere, compact core minimum, duplicate settlement names, envelope geology, anomaly ordinary-geology misuse, belt physical estimates, and settlement site/function mismatches.
- Add handcrafted minimal fixtures with one failing condition each plus paired positive controls. Add fixed regression seeds from known corpus failures where available.
- Update the audit to consume shared validators.
- Add explicit npm scripts for quick and deep audits so developers do not need to remember environment variables.
- Classify hard generated environment contradictions as audit errors immediately.
- Add duplicate settlement-name findings in report-only or baseline mode until Phase 5 repairs names; do not break quick/default audit before the registry exists.
- Keep `generateSystem` output unchanged in this phase except where type exports require no behavioral change.

Verification:

- Focused validator tests in a new `validation.test.ts`.
- Existing star system generator tests.
- Quick audit profile.
- Deep audit profile, expected to report known generated failures until later phases repair generation.

Recommended commit:

- `test: share star system validation contracts`

### Phase 2 - Environment Policy First Slice

Purpose: remove the high-volume environment contradictions with a policy layer that can be implemented against the current model.

Work items:

- Add `environmentPolicy` derivation using current body class/category/thermal strings.
- Define initial profile allowlists for `airless`, `desert`, `terrestrial`, `ocean`, `envelope`, `belt`, `anomaly`, and `facility`.
- Route atmosphere, hydrosphere, geology, climate, radiation, and biosphere detail generation through policy inside `generateDetail`.
- Use policy facets and nearest-compatible replacements, not only one fallback per profile.
- Preserve valid source-table rolls unchanged and emit repair findings for replacements.
- Apply locked facts before recomputing nonlocked dependent facts. Ensure biosphere rolls consume normalized final environment data.
- Add locked-fact conflict reporting hooks without mutating locked imported facts.
- Add regression tests for the reported contradiction families.
- Keep ordinary terrestrial output diverse by preserving source-table rolls when they already satisfy the policy.
- Add repair-rate audit summaries and warning thresholds for repair concentration so valid output does not become bland output.

Verification:

- Focused generator tests for environment profiles.
- Validator fixture tests.
- Repair determinism tests.
- Quick audit must eliminate generated airless/desert contradictions.
- Deep audit should show zero airless atmosphere, airless hydrosphere, and desert hydrosphere hard errors for generated facts.

Recommended commit:

- `fix: normalize star system environment details`

### Phase 3 - Architecture Profiles And Slot Contracts

Purpose: make architecture requirements explicit and prevent anomalies or imports from consuming required structure.

Work items:

- Introduce `ArchitectureProfile` and `ArchitectureSlot` contracts.
- Port existing architecture families into profile definitions.
- Implement slot satisfaction accounting with `countsToward` and final-body validation.
- Protect compact inner systems with at least three rocky-chain core slots.
- Treat anomalies as scar extras or overlays unless a profile explicitly allows them to satisfy a non-core requirement.
- Preserve known locked bodies exactly.
- Add replacement generated core slots when locked known bodies occupy required positions but do not satisfy requirements.
- Replace or retire the flat `BodyPlanKind[]` authority after the profile builder is covered. `BodyPlanKind` may remain as a low-level slot hint.
- Model `slot template -> candidate -> filtered occupant -> satisfaction result`.
- Update orbit generation so added replacement slots get deterministic, sorted orbits without changing locked orbit facts.
- Make architecture slot/occupant metadata visible to validators and tests, either as an internal generation result or emitted diagnostics.

Verification:

- Architecture unit tests for each profile.
- Regression test for the compact inner core-count failure.
- Import contract tests proving locked bodies remain unchanged while replacement slots are added.
- Tests proving replacement slots do not reorder or mutate unrelated locked bodies.
- Deep audit should show zero compact inner core-count errors.

Recommended commit:

- `refactor: add star system architecture slot contracts`

### Phase 4 - Durable World Class Metadata

Purpose: replace fragile string predicates with structured class metadata.

Work items:

- Extend `WorldClassOption` with metadata needed for policy and architecture decisions.
- Include environment profile hints, semantic category tags, physical assumptions, and special handling flags.
- Migrate first-slice string predicates to metadata lookups.
- Keep compatibility predicates exported for tests and audit, but implement them against metadata.
- Add fixtures proving class labels can change without breaking compatibility behavior.
- Move large world-class tables out of `index.ts` if the metadata change makes the orchestrator too large.
- Ensure metadata covers runtime-created classes from filters, forced classes, belt classes, fallback outputs, and replacement slots, not just static thermal-zone table entries.

Verification:

- Type-level coverage where practical.
- Metadata completeness tests for all world class table entries.
- Focused generator tests.
- Quick and deep audit profiles.

Recommended commit:

- `refactor: add world class compatibility metadata`

### Phase 5 - Deterministic Settlement Name Registry

Purpose: eliminate duplicate settlement names while preserving deterministic generation.

Work items:

- Add a system-scoped `NameRegistry` for settlements.
- Reserve locked or imported names before generated names.
- Repair generated duplicates with deterministic qualifiers based on site, location, anchor kind, anchor body, authority, function, route role, or ordinal fallback.
- Add canonical collision keys that normalize case, whitespace, and punctuation variants.
- Normalize descriptor matching to lowercase before classifying authorities/functions.
- Add tests for duplicate repair, locked-name preservation, and deterministic output.
- Update audit summaries to report duplicate repairs and fail on remaining duplicate names.
- Keep generated IDs stable unless a later UI requirement needs IDs to follow repaired names.

Verification:

- Name registry unit tests.
- Generator determinism tests.
- Deep audit should show zero duplicate settlement-name errors.

Recommended commit:

- `fix: repair duplicate star system settlement names`

### Phase 6 - Narrative Coherence And Repair Implications

Purpose: keep the generator useful at the table after semantic repair and validation become stricter.

Work items:

- Add settlement hook synthesis that weights tags, crisis, hidden truth, and encounter sites by site category, function, body detail, scale, authority, condition, and GU context.
- Add scale-aware crisis/authority/condition compatibility, especially for `Abandoned` and `Automated only` settlements.
- Rebalance fracture/shear settlement functions so GU sites are common but do not replace support settlement ecology.
- Add body-interest synthesis that combines astronomy fact, pressure point, and play use.
- Add repair narrative mapping from `repair-applied` findings to optional GM-facing implications without polluting player-facing prose.

Verification:

- Hook coherence tests.
- Scale/crisis compatibility tests.
- Body-interest phrase and reason diversity tests.
- No-alien preservation tests.
- Quick audit and focused generator tests.

Recommended commit:

- `feat: improve star system narrative coherence`

### Phase 7 - Import Conflict Reporting And Final Integration

Purpose: finish the remodel by making locked-fact conflicts visible and ensuring the pipeline produces explainable results.

Work items:

- Surface locked-fact validation conflicts in generated metadata or diagnostics.
- Ensure locked conflicts do not trigger silent rewrites.
- Add tests for incompatible locked atmosphere/hydrosphere/class combinations.
- Add audit reporting for locked-fact conflicts separately from generated contradiction failures.
- Update docs or feature README with the new generation contract if needed.
- Decide whether diagnostics live on `GeneratedSystem` as `diagnostics?: ValidationFinding[]` or as exported validator output plus internal generation results consumed by audit/UI. If diagnostics are added to `GeneratedSystem`, update UI tests and generated-system snapshots intentionally.

Verification:

- Import conflict tests.
- Focused generator tests.
- Quick audit profile.
- Deep audit profile.
- `npm run test:star-system-generator`

Recommended commit:

- `feat: report star system locked fact conflicts`

### Phase 8 - Cleanup And Documentation

Purpose: remove transitional logic and make the new procedural contract understandable to future work.

Work items:

- Remove obsolete string-predicate fallbacks once metadata coverage is complete.
- Remove dead architecture helpers after slot profiles become authoritative.
- Update `README.md` and `PRD.md` with the compatibility-first generation contract.
- Add a short maintainer note describing how to add new world classes without bypassing policy and validation.
- Ensure audit output clearly separates hard errors, locked-fact conflicts, distribution warnings, and flavor/diversity warnings.
- Ensure `npm run audit:star-system-generator:quick` passes for normal development and `npm run audit:star-system-generator:deep` passes before marking the remodel complete.

Verification:

- `npm run lint`.
- `npm run test:star-system-generator`.
- `npm run test`.
- `npm run build` if UI or exported data shape changed.

Recommended commit:

- `docs: document star system procedural contracts`

## Verification Plan

Use layered verification so each phase can be trusted independently.

- Unit tests for validators, environment policy, architecture slots, metadata coverage, and name registry behavior.
- Generator regression tests for the exact failure families reported by deep audit.
- Determinism tests for seed/options/input stability after intentional snapshot updates.
- Import tests proving locked known bodies and locked facts survive generation unchanged.
- Quick audit for local iteration.
- Deep audit profile before marking the remodel complete.
- Broader project checks before user-facing release work: `npm run lint`, `npm run test`, and `npm run build` when scope warrants.

Deep audit completion targets:

- 0 compact inner architecture core-count failures.
- 0 generated airless atmosphere contradictions.
- 0 generated airless hydrosphere contradictions.
- 0 generated desert hydrosphere contradictions.
- 0 systems with duplicate settlement names after repair.
- Locked imported contradictions reported as locked-fact conflicts, not rewritten generated facts.
- Repair-rate summaries stay below warning thresholds unless intentionally accepted with documented rationale.
- Narrative coherence tests pass for settlement hooks, scale/crisis compatibility, and body-interest diversity.

## Risks And Decisions

- Source fidelity vs. semantic validity: compatibility contracts override exact dice-table fidelity where the two conflict. Source tables remain weighted inspiration and setting procedure.
- String predicates are acceptable only for the first environment-policy slice. The durable target is structured `WorldClassOption` metadata.
- Repair can hide problems if overused. Generated environment repair should be constrained by profile allowlists, while validators remain authoritative and audit-visible.
- Locked imported facts may be impossible. The system should report those conflicts clearly and preserve the locked data.
- Architecture remodel may change deterministic outputs. Snapshot changes are acceptable if documented and covered by deterministic tests after the new contract lands.
- Name repair should prefer meaningful qualifiers over arbitrary suffixes, but deterministic ordinal fallback is acceptable when all semantic qualifiers collide.

## Completion Criteria

The remodel is complete when:

- `POST_AUDIT_REMODEL_PLAN.md` phases are implemented or superseded by an explicit successor plan.
- Environment details are generated through shared policy and validated by shared predicates.
- Architecture body planning uses profiles and slot contracts with protected core requirements.
- World class compatibility behavior is backed by structured metadata rather than label-only string checks.
- Settlement names are deterministic, repaired, and audited as official uniqueness errors.
- Locked imported facts are preserved and incompatible locked facts are reported.
- Quick and deep star system generator audits pass with the post-audit hard-error targets at zero.
- Recommended phase commits exist or their equivalent logical checkpoints are recorded in project history.
