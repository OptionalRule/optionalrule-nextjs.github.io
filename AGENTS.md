# Repository Guidelines

## Project Structure & Module Organization
- App routes: `src/app/` (Next.js App Router, static export). Content-facing pages live under route groups like `(content)` and `(pages)`.
- UI & logic: `src/components/`, `src/lib/`, `src/features/`, `src/config/` (site settings in `src/config/site.ts`).
- Content: MDX in `content/posts/` and `content/pages/`; public assets in `public/`.
- Tests: `src/__tests__/` and `*.test.ts(x)` colocated with code.
- Scripts: maintenance tools in `scripts/` (ESM via `node --import tsx/esm`).

## Build, Test, and Development Commands
- `npm run dev`: Start dev server with drafts.
- `npm run graph:hooks`: Install or refresh the local post-commit and post-checkout Graphify hooks.
- `npm run graph:update`: Refresh the local `src/` code graph without semantic extraction or visualization.
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
- During multi-step development, commit at logical checkpoints after focused verification passes. Prefer small, coherent commits that leave the working tree in a reviewable state over one large end-of-session commit.
- PRs: Describe intent, link issues, include screenshots for UI changes, and add/update tests as needed.
- Checklist: `npm run lint`, `npm run test:all`, and `npm run build` should pass locally. Update docs and regenerate `public/search-index.json`/`public/rss.xml` when content changes.

## Security & Configuration Tips
- Static export with `trailingSlash` is required for GitHub Pages; avoid server-only features.
- CSP and analytics are applied via components; only add scripts from trusted domains. Update GA ID in `src/config/site.ts`.
- Remote images must match `next.config.ts` `images.remotePatterns`. Don’t commit secrets.

## Graphify

This project keeps a local, code-only knowledge graph in `graphify-out/`. The
repository root is the canonical Graphify root, while `.graphifyignore` limits
the indexed corpus to source code under `src/`.

- Before answering a codebase, architecture, dependency, or impact question,
  query the graph first when `graphify-out/graph.json` exists. Use
  `graphify query "<question>"` for broad context, `graphify path "<A>" "<B>"`
  for relationships, `graphify explain "<concept>"` for a focused symbol, and
  `graphify affected "<concept>"` for change impact.
- Expand query wording only with vocabulary found in the graph. Treat graph
  results as navigation evidence, then verify exact behavior and edit locations
  in source files before changing code.
- If the graph is missing or code under `src/` changed after the last refresh,
  run `npm run graph:update` before relying on graph results. After modifying
  code, run it again before the final response so uncommitted work is included.
- Post-commit and post-checkout Git hooks refresh committed code automatically,
  but they do not replace the manual refresh required during an uncommitted
  agent turn. Run `npm run graph:hooks` once after cloning or reinstalling
  Graphify.
- Keep Graphify deterministic and code-only. Do not run semantic extraction,
  add documentation or media to the corpus, or generate `graph.html` or other
  visualizations.
- Project-local Codex command rules in `.codex/rules/graphify.rules` pre-approve
  the non-destructive Graphify query/update workflow. They intentionally do not
  approve destructive commands such as Graphify uninstall or purge operations.
