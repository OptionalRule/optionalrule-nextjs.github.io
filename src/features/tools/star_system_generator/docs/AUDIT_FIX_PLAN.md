# Star System Generator Audit Fix Plan

This plan addresses the multi-agent audit findings from the generation-method review. The goal is to make the generator more source-faithful, internally sensible, varied, and testable before expanding the scripted generation audit.

## Principles

- Fix semantic contradictions before tuning distribution percentages.
- Keep deliberate deviations from `SOURCE_WRITEUP.md` documented as design choices, not accidental drift.
- Prefer shared rule helpers over duplicating compatibility logic in generator code, tests, and audit scripts.
- Add audit coverage before relying on generated samples for design decisions.
- Commit after each coherent phase with focused verification.

## Phase 1 - Guardrail Fixes

Purpose: remove known contradictions that the current audit misses.

Status: completed in checkpoint `fix: tighten star system generation guardrails`.

Work items:
- Revalidate peas-in-a-pod copied classes against the receiving orbit's thermal zone.
- Prevent hot-zone forced dwarf/rogue/debris classes from producing misleading cold-body labels.
- Split or constrain anomaly handling so `Brown-dwarf companion`, `Black-lab platform`, and similar non-planet labels do not receive ordinary planet geology, rings, or Earth-radius framing.
- Constrain GU fracture/shear settlement functions by site category so mobile/fleet functions do not appear as lava-tube cities, moon bunkers, or fixed ruins.
- ~~Fix `observerse` / `observiverse` terminology after confirming intended setting term.~~ Done in `refactor(star-gen): align with GU glossary v2.0 and overhaul local sites` — unified on `observerse` per glossary v2.0 across data, code, regex literals, and tests.
- Make no-alien guard recursive or share its text traversal with the audit.

Acceptance checks:
- Add regression tests for the cited seeds and equivalent semantic cases.
- Add audit checks for class-label-vs-zone consistency, anomaly physical/detail consistency, and function/site compatibility.
- `npm run audit:star-system-generator`
- `npm run test -- --run src/features/tools/star_system_generator`
- `npm run typecheck`

Checkpoint commit:
- `fix: tighten star system generation guardrails`

## Phase 2 - Architecture Authority And Body Planning

Purpose: remove split authority between architecture table ranges and actual body-plan output.

Status: completed in checkpoint `refactor: unify star system architecture body planning`.

Design note: broad generated body counts are retained intentionally. The source architecture table gives descriptive structure rather than exact counts for several rows, and the current generator keeps weighted variation plus rare crossovers so systems do not collapse into fixed templates.

Work items:
- Replace `bodyCount` in `architectures` with explicit architecture plan metadata, or make `generateArchitecture` return the actual body plan. Completed with explicit architecture body-plan metadata and removal of dead `bodyCount`.
- Decide whether broad body counts intentionally exceed source table counts; document that choice if retained. Completed; broad counts are intentional for variety and crossover support.
- Add required-category rules for each architecture. Completed:
  - Failed system: debris/dwarfs dominate, zero to few full planets.
  - Debris-dominated: belts/planetesimals dominate, few full planets.
  - Sparse rocky: rocky/super-terrestrial body count is primary, with rare giants and debris.
  - Compact inner system: close-in rocky/super-Earth/sub-Neptune bodies dominate.
  - Peas-in-a-pod: similar body family dominates, with limited exceptions.
  - Solar-ish mixed: variable inner rocks, variable belts, variable giants, and outer ice/dwarf bodies.
  - Migrated giant: at least one hot/warm giant plus disrupted survivors.
  - Giant-rich or chaotic: multiple giants plus debris/captured bodies.
- Add architecture-plan tests that check range intent and required category presence. Completed.

Acceptance checks:
- Architecture body count and category distribution tests pass.
- Corpus report includes body category by architecture.
- No dead `bodyCount` field remains.

Checkpoint commit:
- `refactor: unify star system architecture body planning`

## Phase 3 - Source-Method Parity Pass

Purpose: move from inspired approximations toward the writeup's actual procedures.

Work items:
- Implement multiplicity/companions. Completed in checkpoint `feat: add stellar multiplicity generation`:
  - star-type thresholds
  - result margins
  - separation bands
  - architecture/GU/reachability effects
- Apply reachable-volume modifiers. Completed in checkpoint `feat: apply source reachability and activity modifiers`:
  - multi-star systems
  - flare-heavy M dwarfs
  - chiral-resource systems, currently represented by high/fracture GU resource bias until the full GU resource-table parity pass
- Rework stellar activity modifiers. Completed in checkpoint `feat: apply source reachability and activity modifiers`:
  - very young
  - close binary
  - strong GU bleed field
- Expand GU overlay. Completed in checkpoint `feat: expand geometric unity generation`:
  - modified 2d6 intensity
  - bleed behavior
  - d20 location/resource/hazard tables
  - preference bias layered on top of the source roll
- Implement settlement presence as `2d6 + components`, not fixed baseline `7 + components`. Completed in checkpoint `feat: use rolled settlement presence scoring`.
- Replace settlement scale labels with source population/scale outputs or split `presenceTier` from `populationScale`. Completed in checkpoint `feat: use rolled settlement presence scoring`; presence tier is now separate from section 18.2 population/scale output.

Acceptance checks:
- Tests lock key source tables and modifier behavior.
- Audit reports reachability, GU intensity, settlement presence rolls, settlement presence tiers, settlement scales, and settlement score component distributions.
- Existing deterministic behavior remains stable for same seed/options after intentional snapshot updates.

Checkpoint commits:
- `feat: add stellar multiplicity generation`
- `feat: apply source reachability and activity modifiers`
- `feat: expand geometric unity generation`
- `feat: use rolled settlement presence scoring`

## Phase 4 - Planet, Moon, Belt, And Ring Tables

Purpose: improve source coverage and reduce repeated category/detail outputs.

Status: completed across checkpoints `feat: expand star system world and moon tables` and `feat: roll star system world detail tables`.

Work items:
- Expand planet class tables toward source d20 coverage by thermal zone. Completed in checkpoint `feat: expand star system world and moon tables` for the missing class labels called out below.
- Add missing classes such as carbon-rich furnace worlds, ultra-hot giants, resonant inner-chain worlds, Hycean-like candidates, CO2 ice worlds, small ice giants, super-Jovians, captured eccentric worlds, and additional debris bodies. Completed in checkpoint `feat: expand star system world and moon tables`.
- Add source-style atmosphere, hydrosphere, geology, climate, radiation, and biosphere modifier rolls instead of mostly direct array picks. Completed in checkpoint `feat: roll star system world detail tables`.
- Implement moon count tables. Completed in checkpoint `feat: expand star system world and moon tables`:
  - terrestrial 2d6 with modifiers
  - giant d6 major-moon count with modifiers
- Expand belt and ring subtype generation using source d12 tables. Completed in checkpoint `feat: expand star system world and moon tables`.
- Ensure body detail text changes when a body is non-planet, artificial, anomalous, or substellar. Completed through category-specific body profiles and anomaly/belt/environment constraints.

Acceptance checks:
- Audit reports top body-class concentration and warns when one class dominates.
- Audit reports moon-type and ring-type distributions and warns when one moon type dominates.
- Audit reports atmosphere, hydrosphere, geology, radiation, and biosphere distributions.
- Tests prove every major thermal-zone table produces several distinct source classes over a seed corpus.
- Regression tests for hot/cold, envelope, belt, anomaly, moon, and ring invariants pass.

Checkpoint commit:
- `feat: expand star system world and moon tables`

## Phase 5 - Variety And Naming

Purpose: improve replayability and reduce visibly repeated text.

Status: completed across checkpoints `feat: improve star system naming variety` and `feat: vary star system prose templates`.

Work items:
- Replace the 100-combination system-name table with a larger seeded naming system. Completed in checkpoint `feat: improve star system naming variety`.
- Make body names depend on system seed, architecture, category, or orbit instead of fixed index order. Completed in checkpoint `feat: improve star system naming variety`.
- Make settlement names depend on site category, authority, function, anchor, and scale. Completed in checkpoint `feat: improve star system naming variety`.
- Add more moon names or category-aware moon naming. Completed in checkpoint `feat: improve star system naming variety`.
- Add alternate templates for `whyInteresting`, `whyHere`, and generic settlement tag hooks. Completed in checkpoint `feat: vary star system prose templates`.
- Add phrase repetition metrics to the audit. Name concentration metrics completed in checkpoint `feat: improve star system naming variety`; prose-template metrics completed in checkpoint `feat: vary star system prose templates`.

Acceptance checks:
- Corpus report includes unique system/body/moon/settlement name counts. Completed.
- Audit warns on repeated first-body names, repeated settlement names, or top name concentration. Completed.
- Audit warns on top phrase/template concentration. Completed.
- UI remains readable with longer generated names.

Checkpoint commit:
- `feat: improve star system naming variety`
- `feat: vary star system prose templates`

## Phase 6 - Audit And Test Infrastructure

Purpose: make the scripted audit reliable enough to guide future tuning.

Status: partially completed in checkpoint `test: expand star system generator audit matrix`.

Work items:
- Add `npm run test:star-system-generator` that runs focused tests plus the generator audit. Completed.
- Add audit option matrix. Completed for:
  - `distribution`: frontier, realistic
  - `tone`: balanced, astronomy, cinematic
  - `gu`: low, normal, high, fracture
  - `settlements`: sparse, normal, crowded, hub
- Add configurable corpus profiles. Completed for:
  - quick local
  - default local
  - deep pre-release
- Add score-component distribution metrics for settlement presence.
- Add architecture-by-category metrics. Completed.
- Add GU intensity by preference metrics. Completed.
- Add frontier-vs-realistic downstream divergence metrics.
- Add golden snapshots for a small canonical seed set.
- Extract shared compatibility rules so tests and audit import generator rules instead of duplicating them.

Acceptance checks:
- `npm run test:star-system-generator` passes.
- `npm run test:all` either includes the generator audit or documents why it remains separate.
- Audit output distinguishes hard failures, warnings, and design-tuning notes.

Checkpoint commit:
- `test: expand star system generator audit coverage`

## Phase 7 - Import-Ready Contract

Purpose: keep future known-system imports from being bolted on after the generator hardens.

Status: completed in checkpoint `feat: add star system import-ready generation contract`.

Work items:
- Define a minimal `PartialKnownSystem` input contract. Completed.
- Add locked-fact merge helpers. Completed.
- Ensure imported star facts skip stellar type rolls. Completed for locked stellar type facts.
- Ensure imported planets can reserve orbital slots and generated bodies fill gaps. Completed for locked known bodies assigned to generated orbital slots.
- Add tests proving locked facts are not overwritten. Completed.
- Keep public import UI hidden until the schema is stable. Completed; the contract is generator-only.

Acceptance checks:
- Generator accepts fictional-only and partial-known inputs. Completed.
- Locked fields survive all generation stages. Completed for locked primary-star and known-body facts.
- URL seed/options behavior remains deterministic. Completed.

Checkpoint commit:
- `feat: add star system import-ready generation contract`

## Recommended Execution Order

1. Phase 1 guardrails.
2. Phase 6 audit infrastructure, at least option matrix and semantic checks.
3. Phase 2 architecture authority.
4. Phase 3 source-method parity.
5. Phase 4 expanded world/moon tables.
6. Phase 5 naming and text variety.
7. Phase 7 import-ready contract.

This order makes the next broad generation audit meaningful: it first prevents known contradictions, then broadens the audit, then resumes method and variety tuning.
