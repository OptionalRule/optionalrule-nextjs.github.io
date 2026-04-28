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

## Phased Implementation Plan

### Phase 1 - Shared Validators And Audit Contract

Purpose: create one authority for semantic checks before changing generation behavior.

Work items:

- Add `generator/validation.ts` with structured validation result types.
- Move existing audit-only compatibility checks into shared validators.
- Add validator fixtures for the known failure classes: airless atmosphere, airless hydrosphere, desert hydrosphere, compact core minimum, and duplicate settlement names.
- Update the audit to consume shared validators.
- Add a deep audit npm script/profile policy that runs the larger corpus used for post-audit confidence.
- Classify duplicate settlement names and hard environment contradictions as audit errors.

Verification:

- Focused validator tests.
- Existing star system generator tests.
- Quick audit profile.
- Deep audit profile, expected to fail until later phases repair generation.

Recommended commit:

- `test: share star system validation contracts`

### Phase 2 - Environment Policy First Slice

Purpose: remove the high-volume environment contradictions with a policy layer that can be implemented against the current model.

Work items:

- Add `environmentPolicy` derivation using current body class/category/thermal strings.
- Define initial profile allowlists for `airless`, `desert`, `terrestrial`, `ocean`, `envelope`, `belt`, `anomaly`, and `facility`.
- Route atmosphere, hydrosphere, geology, climate, radiation, and biosphere detail generation through policy.
- Clamp or replace generated incompatible details through policy fallbacks.
- Ensure biosphere rolls consume normalized environment data.
- Add locked-fact conflict reporting hooks without mutating locked imported facts.
- Add regression tests for the reported contradiction families.

Verification:

- Focused generator tests for environment profiles.
- Validator fixture tests.
- Quick audit must eliminate generated airless/desert contradictions.
- Deep audit should show zero airless atmosphere, airless hydrosphere, and desert hydrosphere hard errors for generated facts.

Recommended commit:

- `fix: normalize star system environment details`

### Phase 3 - Architecture Profiles And Slot Contracts

Purpose: make architecture requirements explicit and prevent anomalies or imports from consuming required structure.

Work items:

- Introduce `ArchitectureProfile` and `ArchitectureSlot` contracts.
- Port existing architecture families into profile definitions.
- Implement slot satisfaction accounting with `countsToward`.
- Protect compact inner systems with at least three rocky-chain core slots.
- Treat anomalies as scar extras or overlays unless a profile explicitly allows them to satisfy a non-core requirement.
- Preserve known locked bodies exactly.
- Add replacement generated core slots when locked known bodies occupy required positions but do not satisfy requirements.
- Replace or retire the flat `BodyPlanKind[]` authority.

Verification:

- Architecture unit tests for each profile.
- Regression test for the compact inner core-count failure.
- Import contract tests proving locked bodies remain unchanged while replacement slots are added.
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
- Repair generated duplicates with deterministic qualifiers based on site, anchor body, authority, function, or ordinal fallback.
- Add tests for duplicate repair, locked-name preservation, and deterministic output.
- Update audit summaries to report duplicate repairs and fail on remaining duplicate names.

Verification:

- Name registry unit tests.
- Generator determinism tests.
- Deep audit should show zero duplicate settlement-name errors.

Recommended commit:

- `fix: repair duplicate star system settlement names`

### Phase 6 - Import Conflict Reporting And Final Integration

Purpose: finish the remodel by making locked-fact conflicts visible and ensuring the pipeline produces explainable results.

Work items:

- Surface locked-fact validation conflicts in generated metadata or diagnostics.
- Ensure locked conflicts do not trigger silent rewrites.
- Add tests for incompatible locked atmosphere/hydrosphere/class combinations.
- Add audit reporting for locked-fact conflicts separately from generated contradiction failures.
- Update docs or feature README with the new generation contract if needed.

Verification:

- Import conflict tests.
- Focused generator tests.
- Quick audit profile.
- Deep audit profile.
- `npm run test:star-system-generator`

Recommended commit:

- `feat: report star system locked fact conflicts`

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
