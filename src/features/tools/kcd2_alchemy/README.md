# KCD2 Alchemy Scholar

Client-side tool to browse and filter Kingdom Come: Deliverance 2 alchemy recipes by level, ingredients, and effects.

- Route: `src/app/(interactive)/tools/kcd2_alchemy/page.tsx`
- Feature: `src/features/tools/kcd2_alchemy/`
- Data: `public/tools/kcd2_alchemy/potions.json`

## Development

- `npm run dev` then open `/tools/kcd2_alchemy/`
- This module is dynamically imported with `ssr: false` and runs entirely client-side.
- See `docs/PLAN.md` for milestones and `docs/PRD.md` for requirements.

## Data Schema

See `types.ts` and `docs/PRD.md`. The tool expects a JSON array of recipe objects following the schema provided in the project request.

## Notes

- Static export only; avoid server APIs. Keep all URLs with trailing slashes.
- Follow repository coding standards in `documentation/STANDARDS.md`.
