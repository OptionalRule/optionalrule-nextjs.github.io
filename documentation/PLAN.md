# Optional Rule — Consolidated Improvement Plan

Last updated: 2025-09-07

This plan consolidates recommendations and improvements from `documentation/PRD.md` and `documentation/TDD.md` into a single prioritized backlog for the site. It focuses on static-export safety, correctness, maintainability (SOLID/DRY), performance, and discoverability.

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

## High Impact (P0)

- Asteroids route safety
  - Priority: P0; Impact: High; Effort: M
  - Problem: Referenced modules (`components/*`, `hooks/*`) are missing; static export may fail.
  - Plan: Either (A) implement missing modules and ensure client-only loading with `dynamic(..., { ssr: false })`, or (B) gate behind feature flag and show a “Coming Soon” placeholder.
  - Acceptance: `npm run build` succeeds; `/games/asteroids/` loads without runtime errors in production export.

- Canonical URL centralization throughout
  - Priority: P0; Impact: High; Effort: S
  - Problem: Potential stragglers still using hard-coded URLs.
  - Plan: Provide/verify a `siteUrl()` helper backed by `siteConfig.url`; ensure robots, sitemap, feeds, JSON‑LD, and canonical tags reference it.
  - Acceptance: No hard-coded hostnames; targeted test asserts robots/sitemap/feeds use `siteConfig.url`.

- Trailing slash and link integrity tests
  - Priority: P0; Impact: High; Effort: S
  - Plan: Add unit tests that assert internal URLs render with trailing slashes; add smoke tests verifying `generateStaticParams` for posts/tags/pagination.
  - Acceptance: New tests pass and fail if regressions re-introduce redirect-causing links.

- Thin route handlers for robots/sitemap
  - Priority: P0; Impact: High; Effort: S
  - Plan: Move string-building logic into `src/lib/feeds.ts` (or adjacent) and have route handlers delegate to shared functions.
  - Acceptance: Single source of truth; route handlers under 20 LOC; feeds stay identical by snapshot test.

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

- Config consistency audit
  - Priority: P1; Impact: Medium; Effort: S
  - Plan: Verify `siteConfig.url` and environment toggles are used across SEO, analytics, JSON‑LD, and feed routes; add a simple config validation script.
  - Acceptance: Script passes on CI; any discrepancy fails CI with clear message.

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

