# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/app` (routes, layouts), `src/components` (UI), `src/lib` (utils), `src/config` (site settings).
- Content: Markdown/MDX posts in `content/posts`, static pages in `content/pages`.
- Assets: `public/` for images and static files.
- Stories: `src/stories` and `*.stories.tsx` for Storybook.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js in dev mode at `http://localhost:3000`.
- `npm run build`: Generate search index + RSS, then static-export to `out/`.
- `npm start`: Serve the production build locally.
- `npm run lint`: Run ESLint with Next.js + Storybook rules.
- `npm run storybook`: Launch Storybook on port 6006; `npm run build-storybook` to build.
- Content tooling: `npm run create-post`, `npm run generate-search-index`, `npm run generate-rss`.
- Tests: Run `npx vitest` (UI/story tests via Storybook addon), `npx vitest --coverage`.

## Coding Style & Naming Conventions
- Language: TypeScript, React Server Components (Next.js App Router).
- Indentation: 2 spaces; prefer explicit types and `strict` TS.
- Filenames: Components `PascalCase.tsx`; tests `*.test.ts`; stories `*.stories.tsx`.
- Imports: Use path alias `@/*` (see `tsconfig.json`).
- Linting: Next.js core-web-vitals + Storybook plugin (`npm run lint`).
- Styling: Tailwind CSS; keep utility classes readable and grouped logically.

## Testing Guidelines
- Framework: Vitest with `@storybook/addon-vitest` and Playwright browser runner.
- What to test: Pure utils in `src/lib/**`, component logic (props/variants), pagination/search behavior.
- Naming: Co-locate or place in `src/**` as `*.test.ts[x]`.
- Run: `npx vitest` for watch; `npx vitest run --coverage` for CI-like checks.

## Commit & Pull Request Guidelines
- Commits: Clear, imperative summaries (e.g., "Fix RSS feed for static export").
- PRs: Include purpose, linked issues, and screenshots for UI changes.
- Checks: Ensure `npm run lint` and tests pass. Do not commit `out/` or `.next/`.

## Security & Configuration Tips
- Site settings: Edit `src/config/site.ts` (URLs, analytics, social). Avoid hardcoding in components.
- Images: `next.config.ts` uses `images.unoptimized` for static export; prefer `public/` assets when possible.
- Secrets: Never commit `.env*`; scripts may read `OPENAI_API_KEY` when used.
