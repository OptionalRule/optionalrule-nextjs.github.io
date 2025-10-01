# Repository Guidelines

## Project Structure & Module Organization
- App routes: `src/app/` (Next.js App Router, static export). Content-facing pages live under route groups like `(content)` and `(pages)`.
- UI & logic: `src/components/`, `src/lib/`, `src/features/`, `src/config/` (site settings in `src/config/site.ts`).
- Content: MDX in `content/posts/` and `content/pages/`; public assets in `public/`.
- Tests: `src/__tests__/` and `*.test.ts(x)` colocated with code.
- Scripts: maintenance tools in `scripts/` (ESM via `node --import tsx/esm`).

## Build, Test, and Development Commands
- `npm run dev`: Start dev server with drafts.
- `npm run build`: Generate search index + RSS, then static build to `out/`.
- `npm start`: Serve production build locally.
- `npm run lint`: ESLint checks.
- `npm run test`: Unit tests (Vitest). Use `test:watch`, `test:ui`, `test:coverage` as needed.
- `npm run test:integration` / `test:ssg` / `test:a11y`: Targeted CI-aligned test suites.
- `npm run test:all`: Unit + a11y + build verification.
- Content helpers: `npm run create-post`, `npm run generate-search-index`, `npm run generate-rss`.

## Coding Style & Naming Conventions
- Language: TypeScript + React. Components in `.tsx`, PascalCase filenames (e.g., `PostCard.tsx`).
- Indentation: 2 spaces; prefer named exports; keep modules small and focused.
- Imports: use path alias `@/*` for `src/*` (see `tsconfig.json`).
- Linting: ESLint (`next` + TypeScript). Run `npm run lint` before PRs.
- Styling: Tailwind v4 tokens in `src/app/globals.css`; dark mode via `.dark` class.

## Testing Guidelines
- Frameworks: Vitest + Testing Library (`happy-dom`), a11y checks (`jest-axe`).
- Locations: `src/__tests__/` and `**/*.test.ts(x)` next to code.
- Coverage: Enforced via Vitest config; keep meaningful tests for new logic.
- Naming: Mirror target file, e.g., `SearchInput.test.tsx` for `SearchInput.tsx`.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits style (e.g., `feat:`, `fix:`, `chore:`, `test:`) as seen in history.
- PRs: Describe intent, link issues, include screenshots for UI changes, and add/update tests as needed.
- Checklist: `npm run lint`, `npm run test:all`, and `npm run build` should pass locally. Update docs and regenerate `public/search-index.json`/`public/rss.xml` when content changes.

## Security & Configuration Tips
- Static export with `trailingSlash` is required for GitHub Pages; avoid server-only features.
- CSP and analytics are applied via components; only add scripts from trusted domains. Update GA ID in `src/config/site.ts`.
- Remote images must match `next.config.ts` `images.remotePatterns`. Don’t commit secrets.

