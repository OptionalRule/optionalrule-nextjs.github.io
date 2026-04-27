# Sci-Fi TTRPG Star System Generator

Planned client-side tool for generating astronomy-grounded, game-facing star systems.

- Route: `src/app/(interactive)/tools/star_system_generator/page.tsx`
- Feature: `src/features/tools/star_system_generator/`
- Source writeup: `docs/SOURCE_WRITEUP.md`
- Requirements: `docs/PRD.md`
- Implementation plan: `docs/PLAN.md`

## Development Notes

The generator should be deterministic from a seed and options object. Future known-system import is a core design constraint, so generated and imported facts should carry confidence labels and imported facts should be lockable.

Initial implementation should be client-only and static-export compatible, following the existing interactive tool pattern used by KCD2 Alchemy Scholar.

Commit work at logical checkpoints during development. For this feature, good checkpoints include completed generation-rule passes, UI/card readability passes, query-state fixes, and documentation/status updates after focused verification.
