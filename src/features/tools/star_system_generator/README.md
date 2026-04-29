# Sci-Fi TTRPG Star System Generator

Planned client-side tool for generating astronomy-grounded, game-facing star systems.

- Route: `src/app/(interactive)/tools/star_system_generator/page.tsx`
- Feature: `src/features/tools/star_system_generator/`
- Source writeup: `docs/SOURCE_WRITEUP.md`
- Requirements: `docs/PRD.md`
- Implementation plan: `docs/PLAN.md`
- Audit fix plan: `docs/AUDIT_FIX_PLAN.md`
- Post-audit procedural remodel plan: `docs/POST_AUDIT_REMODEL_PLAN.md`

## Development Notes

The generator is deterministic from a seed, options object, and optional known-system input. Known-system import is a core design constraint: generated and imported facts carry confidence labels, imported facts may be locked, and locked facts are preserved even when they conflict with generated compatibility policy.

Initial implementation should be client-only and static-export compatible, following the existing interactive tool pattern used by KCD2 Alchemy Scholar.

Commit work at logical checkpoints during development. For this feature, good checkpoints include completed generation-rule passes, UI/card readability passes, query-state fixes, and documentation/status updates after focused verification.

Run `npm run audit:star-system-generator:quick` after generator-rule changes. Run `npm run audit:star-system-generator:deep` before marking procedural-generation work complete. The audit generates a deterministic corpus across frontier and realistic distributions, fails on hard generated contradictions or missing fields, reports locked imported contradictions separately, and reports warnings for coverage or tuning gaps that are useful during iterative table work.

Settlement density is intentionally variable. The density control chooses a range, then reachability, GU intensity, architecture, hazards, and top presence scores nudge the final number so normal systems do not all show the same count.

Stellar generation should preserve the labels and d100 ranges in `docs/SOURCE_WRITEUP.md`. The audit reports star-type counts separately for realistic and frontier distributions so aggregate samples do not hide table drift.

Architecture generation uses the modified 2d6 table from the source writeup, then expands it through slot contracts. Each architecture protects its required structure, such as compact rocky-chain cores, while allowing support bodies, crossovers, scars, anomalies, and locked known imports.

## Visual Design Memory

The current look is a compact operational TTRPG tool, not a marketing page. Future UI additions should extend the established page language instead of introducing a separate visual system.

- Reuse `components/visual.tsx` primitives before adding new presentational helpers: `SectionHeader`, `sectionShellClasses`, `FieldRow`, `SpectralChip`, `ThermalZoneTag`, `BodyCategoryIcon`, and `ZoneIcons`.
- Preserve the three semantic visual layers:
  - Physical/astronomy: `accent`
  - Geometric Unity: `accent-mystical`
  - Human/sites/settlements: `accent-warm`
  - Neutral metadata: border/text/surface tokens
- Prefer site tokens and CSS variables already used by the tool: `bg-background`, `bg-[var(--card)]`, `bg-[var(--card-elevated)]`, `border-[var(--border)]`, `text-[var(--text-primary)]`, `text-[var(--text-secondary)]`, and `text-[var(--text-tertiary)]`.
- Section shells should stay compact: rounded-lg, bordered, `bg-[var(--card)]`, `p-4`, and the thin layer bar from `sectionShellClasses`. Nested detail fields should use rounded-md, light borders, elevated card background, and dense spacing.
- Use the existing heading rhythm: `SectionHeader` with a Lucide icon in a 9x9 icon block, `text-lg`/`sm:text-xl` section titles, small tertiary captions, and uppercase micro-labels with `tracking-[0.08em]` for field labels.
- Controls should remain utilitarian and scan-friendly: compact selects/inputs, consistent focus rings, predictable grids, and no landing-page hero treatment.
- Avoid new standalone palettes, decorative cards, oversized typography, gradient-orb decoration, or UI styles that break from the layer model above.

## Procedural Contract

The source writeup is the setting and table inspiration. The implementation is compatibility-first: when a source-table roll conflicts with an explicit generator contract, the contract wins for generated facts.

- Environment details pass through `lib/generator/environmentPolicy.ts` before biosphere generation. Generated airless, desert, belt, envelope, anomaly, and facility worlds must use compatible atmosphere and hydrosphere states.
- World-class behavior is backed by structured metadata in `lib/generator/worldClassMetadata.ts`. String predicates are compatibility fallback only.
- Architecture logic lives in `lib/generator/architecture.ts`; `BodyPlanKind` is a low-level class-selection hint, not the authority for final architecture validity.
- Settlement names use `lib/generator/nameRegistry.ts` to repair generated duplicates deterministically inside a system.
- Shared semantic checks live in `lib/generator/validation.ts` and are used by tests and audit. Do not add audit-only copies of compatibility rules unless the rule is purely corpus/statistical.
- Locked imported facts are not silently rewritten. Validators report incompatible locked facts as `LOCKED_FACT_CONFLICT` findings with the original policy code stored in `policyCode`.

## Adding World Classes

When adding or changing a world class:

1. Add the table row or forced/fallback class.
2. Ensure `deriveWorldClassMetadata` can assign the intended environment profile, physical tags, architecture tags, and special handling.
3. Confirm the class satisfies environment policy and architecture expectations through focused tests.
4. Run `npm run test -- --run src/features/tools/star_system_generator` and `npm run audit:star-system-generator:quick`.
