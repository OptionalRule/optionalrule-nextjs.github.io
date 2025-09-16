# Optional Rule — Consolidated Improvement Plan

Last updated: 2025-09-07

This plan consolidates recommendations and improvements from `documentation/PRD.md` and `documentation/TDD.md` into a single prioritized backlog for the site. It focuses on static-export safety, correctness, maintainability (SOLID/DRY), performance, and discoverability.

## Testing Strategy Overhaul (P1, Impact: High, Effort: M)

- [x] Expand React Testing Library coverage for App Router pages and src/features/tools/kcd2_alchemy hooks/components; render with mocked content to exercise Suspense fallbacks, query parameter initialisation, pagination, and post rendering paths.
- [x] Replace low-signal filesystem assertions in src/__tests__/build.test.ts with fixture-based tests that validate src/lib/content.ts and src/lib/feeds.ts end-to-end using in-memory file data, covering draft filtering and RSS generation.
- [ ] Increase Vitest coverage thresholds (for example 50% statements/lines as a first step, scaling toward 70%) and refine coverage.exclude so Storybook stories and generated files are ignored while critical application modules remain in scope.
- [ ] Add integration tests for SearchPageContent and other composed views to confirm wiring between SearchInput, SearchResults, loading/error states, and sanitisation of untrusted input.
- [ ] Centralise common mocks (Next.js router, global fetch) in shared helpers to keep new tests concise and consistent, and document the pattern in src/test-setup.ts.

## Prioritization

- Impact: High / Medium / Low — expected benefit to reliability, UX, SEO, or maintenance.
- Priority: P0 (urgent), P1 (next), P2 (later), Done (completed already).
- Effort: S (small: <0.5d), M (1–2d), L (3–5d).

## Summary of Completed Items

- Priority: Done; Impact: High; Effort: S — Normalize search links and trailing slashes in search flows; update tests.
- Priority: Done; Impact: High; Effort: S — Robots sitemap URL reads from `siteConfig.url` (no hard-coded host).
- Priority: Done; Impact: Medium; Effort: S — Centralize pagination via exported `POSTS_PER_PAGE` used across pages.
- Priority: Done; Impact: Medium; Effort: S — Refactor feed script to import shared config/logic from `src/lib/feeds.ts`.
- Priority: Done; Impact: Medium; Effort: S — Fix `public/CNAME` to exact domain (no extraneous characters).
- Priority: Done; Impact: High; Effort: M — Centralized URL generation (`src/lib/urls.ts`) with comprehensive tests and adoption across components/routes.
- Priority: Done; Impact: High; Effort: S — Canonical URL centralization: `siteConfig.url` used as single base in `src/lib/seo.ts` (metadataBase, canonical), `src/app/robots.txt/route.ts` (sitemap URL), `src/lib/feeds.ts` (RSS + sitemap), and `src/app/sitemap.xml/route.ts` delegates to shared generator.
- Priority: Done; Impact: High; Effort: S — Trailing slash and link integrity tests: `src/lib/urls.test.ts` validates trailing slashes for all helpers; `src/__tests__/ssg.test.ts` enforces trailing slashes on generated URLs; `src/components/__tests__/SearchInput.test.tsx` asserts navigation to `/search/` and `/search/?q=...`.
- Priority: Done; Impact: High; Effort: S — Thin route handler (sitemap): `src/app/sitemap.xml/route.ts` delegates to `generateSitemap()` in `src/lib/feeds.ts`; handler is static and minimal.
- Priority: Done; Impact: Medium; Effort: S — Config consistency audit: Added `scripts/validate-config.ts` and `npm run validate-config`; GA component now conditionally renders only when a valid GA ID is configured; test added in `src/__tests__/config.validation.test.ts`.
  - CI: Wired into `.github/workflows/deploy.yml` in both `test` and `build` jobs.
- Priority: Done; Impact: High; Effort: M — Asteroids route safety verified: modules present (`components/*`, `hooks/*`, engine, assets), dynamic client-only import (`ssr: false`), static export-safe; route loads with desktop, mobile overlay handled.

## High Impact (P0)

- Asteroids route safety — Implemented/Verified
  - Priority: Done; Impact: High; Effort: M
  - Notes: Verified all modules exist and route uses dynamic client-only loading. No action needed.
  - Residual checks: Confirm `npm run build` emits `out/games/asteroids/index.html`; spot check desktop load and mobile overlay.

 - Canonical URL centralization — Implemented/Verified
  - Priority: Done; Impact: High; Effort: S
  - Notes: Verified no hard‑coded hostnames remain. `siteConfig.url` is the base for metadata (`src/lib/seo.ts:33-46`), robots (`src/app/robots.txt/route.ts:9`), RSS/sitemap (`src/lib/feeds.ts:10,33-35,88`), and app layout metadataBase (`src/app/layout.tsx:30`).
  - Residual checks: Add a small test asserting robots and sitemap include `siteConfig.url`; grep on CI for disallowed hard‑coded hosts.

- Trailing slash and link integrity tests — Implemented/Verified
  - Priority: Done; Impact: High; Effort: S
  - Notes: URL helper tests cover trailing/slash rules; SSG tests validate generated URLs; SearchInput tests cover search link behavior. Most components render URLs via `urlPaths`.
  - Residual checks: Optionally add nav link tests for `Header` and `Footer` to snapshot hrefs; keep CI grep to detect hard-coded paths without trailing slashes.

- Robots.txt thin route handler — Implemented/Verified
  - Priority: Done; Impact: High; Effort: S
  - Notes: Added `generateRobotsTxt()` in `src/lib/feeds.ts` and refactored `src/app/robots.txt/route.ts` to delegate to it. Added `src/__tests__/feeds.test.ts` to assert robots includes `${siteConfig.url}/sitemap.xml`.
  - Residual checks: None required beyond existing unit tests.

## Medium Impact (P1)

- Search fidelity: optional content snippets
  - Priority: P1; Impact: Medium; Effort: M
  - Plan: Keep current copy aligned (title/excerpt/tags). Optionally add sanitized, truncated body snippets to index and add `content` to Fuse keys at low weight (0.05–0.1) with size guard.
  - Acceptance: Index size growth < 25%; relevance stable or improved in manual checks; performance acceptable on mid‑range device.

- Static image pipeline (build-time)
  - Priority: P1; Impact: Medium–High; Effort: M–L
  - Plan: Add a build step to generate responsive sizes for local images (e.g., sharp) and rewrite MDX to `srcset` where feasible.
  - Acceptance: Largest contentful images served <= 1080w by default; measurable LCP improvement on posts with large media.

- Tag pages enrichment
  - Priority: P1; Impact: Medium; Effort: S–M
  - Plan: Support optional tag descriptions and featured imagery (config/json map) and render on tag index/detail.
  - Acceptance: Tag description/hero renders when provided; no layout regressions without data.

 - Config consistency audit — Implemented/Verified
  - Priority: Done; Impact: Medium; Effort: S
  - Notes: Validator checks site URL, CNAME, robots/sitemap/feeds usage of `siteConfig.url`, required assets, GA ID format, and warns on hard‑coded hosts. GA scripts are skipped when ID is unset or invalid.
  - Usage: `npm run validate-config` (runs ESM script with tsx loader). Integrate into CI as a pre-build check if desired.

## Low Impact (P2)

- Header refactor and UI constants
  - Priority: P2; Impact: Low–Medium; Effort: S–M
  - Plan: Factor `Header` into smaller subcomponents; extract nav/utility items to a config module; reduce inline SVG duplication.
  - Acceptance: Same visual behavior; simpler diffs for future nav tweaks; unit tests cover menu generation.

- Enhanced search facets and command palette
  - Priority: P2; Impact: Medium; Effort: M
  - Plan: Add optional tag/date filters and/or a quick-open command palette for navigation and recent posts.
  - Acceptance: Keyboard accessibility verified; no regressions to base search performance.

- Author pages and series collections
  - Priority: P2; Impact: Medium; Effort: M
  - Plan: Introduce author metadata and series groupings rendered as index pages; generate `generateStaticParams` accordingly.
  - Acceptance: Pages SSG correctly; internal links use centralized URL helpers.

## Research / Future (Investigate)

- CSP nonce and stricter policy
  - Status: Investigate; Impact: Medium; Effort: M
  - Constraint: GitHub Pages static hosting does not support runtime middleware; achieving nonces may require alternate hosting or a different approach (build-time hashing, strict CSP without nonces).
  - Next step: Document options and tradeoffs; prototype on a branch with a deploy preview.

## Test Additions (Cross-cutting)

- Robots/sitemap snapshot tests using `siteConfig.url`.
- Link normalization tests for all top-level nav/components to ensure trailing slashes.
- Smoke tests ensuring `generateStaticParams` enumerate all posts/tags/pages.
- Optional: Index size budget test to guard search payload growth.

## Dependencies & Notes

- Static export with `trailingSlash: true` remains a hard constraint for GitHub Pages.
- Remote images must match `next.config.ts` `images.remotePatterns` if used.
- Keep using `src/lib/urls.ts` as the single source for URL generation.






