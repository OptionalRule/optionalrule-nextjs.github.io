# Sci-Fi TTRPG Star System Generator

Planned client-side tool for generating astronomy-grounded, game-facing star systems.

- Route: `src/app/(interactive)/tools/star_system_generator/page.tsx`
- Feature: `src/features/tools/star_system_generator/`
- Source writeup: `docs/SOURCE_WRITEUP.md`
- Requirements: `docs/PRD.md`
- Implementation plan: `docs/PLAN.md`
- Audit fix plan: `docs/AUDIT_FIX_PLAN.md`

## Development Notes

The generator should be deterministic from a seed and options object. Future known-system import is a core design constraint, so generated and imported facts should carry confidence labels and imported facts should be lockable.

Initial implementation should be client-only and static-export compatible, following the existing interactive tool pattern used by KCD2 Alchemy Scholar.

Commit work at logical checkpoints during development. For this feature, good checkpoints include completed generation-rule passes, UI/card readability passes, query-state fixes, and documentation/status updates after focused verification.

Run `npm run audit:star-system-generator` after generator-rule changes. The audit generates a deterministic corpus across frontier and realistic distributions, fails on hard contradictions or missing fields, and reports warnings for coverage or tuning gaps that are useful during iterative table work.

Settlement density is intentionally variable. The density control chooses a range, then reachability, GU intensity, architecture, hazards, and top presence scores nudge the final number so normal systems do not all show the same count.

Stellar generation should preserve the labels and d100 ranges in `docs/SOURCE_WRITEUP.md`. The audit reports star-type counts separately for realistic and frontier distributions so aggregate samples do not hide table drift.

Architecture generation uses the modified 2d6 table from the source writeup. Each architecture builds a weighted body plan from variable groups, with occasional crossovers, instead of forcing a single fixed belt/giant pattern.
