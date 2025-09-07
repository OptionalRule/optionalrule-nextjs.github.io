# Optional Rule Static Site – Product Requirements Document (PRD)

## 1. Purpose & Overview

Optional Rule is a statically‑exported Next.js 15 site for Optional Rule Games. It publishes long‑form articles (MDX), lightweight pages, a client‑only “Interactive” area (starting with an Asteroids game), and supporting discovery features (search, tags, pagination, RSS, sitemap). The site targets GitHub Pages hosting and therefore avoids server‑only capabilities and SSR. All content is built at compile time and delivered as static files.

This PRD defines the product goals, scope, user journeys, functional and non‑functional requirements, content model, navigation and IA, SEO, analytics, accessibility, security, and operational tooling required to support the site.


## 2. Goals & Non‑Goals

### Goals
- Deliver a fast, accessible, static site for articles and pages.
- Provide content discovery (tags, search, pagination) and shareable URLs.
- Offer an “Interactive” section for game and tool experiments (Asteroids MVP).
- Ensure robust SEO via metadata, JSON‑LD, RSS, and sitemap.
- Enable safe authoring via MDX with sanitization and a content toolkit.
- Support GitHub Pages constraints (static export, trailing slashes, no server).

### Non‑Goals
- No server‑side rendering or runtime APIs in production.
- No headless CMS integration (content resides in repo MDX).
- No authenticated experiences, comments, or user accounts.
- No image optimization API (images served unoptimized for static export).


## 3. Target Users & Use Cases

### Users
- Readers: tabletop RPG players/designers seeking articles and resources.
- Fans: community followers discovering content by tags and search.
- Editors/Maintainers: repository contributors adding content via MDX.

### Core Use Cases
- Browse latest posts, paginate through archives.
- Open a post page, read content, navigate via headings table of contents.
- Discover content by tag and browse all tags.
- Search posts by title/excerpt/tags with fuzzy matching.
- View informational pages (e.g., About).
- Explore interactive features (Asteroids game) on desktop.
- Subscribe via RSS; web crawlers index via sitemap.


## 4. Information Architecture & Navigation

- Global header with branded home link, primary navigation (Blog, Tags, Search, About), “Interactive” section (Games), and utility icons (Search shortcut, external social links) with theme toggle.
- Footer with About, Tags, RSS, Sitemap links and copyright.
- Route groups (Next.js App Router):
  - (content): home, posts, tags, search, pagination.
  - (pages): static pages by slug (e.g., /pages/about/).
  - (interactive): client‑only features (e.g., /games/asteroids/).


## 5. Content Model

### MDX Posts (content/posts/YYYY-MM-DD-slug.mdx)
Required frontmatter:
- slug: string
- title: string
- date: YYYY‑MM‑DD (UTC semantics)
- excerpt?: string
- tags?: string[]
- featured_image?: string (absolute path under /public)
- draft?: boolean (exclude on production build if true)
- showToc?: boolean (default true)

Derived at build/runtime:
- readingTime: minutes (ceil)
- headings: extracted from markdown (#..######) for Table of Contents

URL pattern (with trailing slash): /YYYY/MM/DD/slug/

Drafting rules:
- dev includes draft content; production excludes `draft: true` posts.

### MDX Pages (content/pages/slug.mdx)
Frontmatter:
- title: string
- description?: string
- draft?: boolean
- showToc?: boolean

URL pattern: /pages/slug/


## 6. Key Features & Requirements

### 6.1 Home & Pagination
- Home lists newest posts (descending by filename) with `PostCard` cards.
- Pagination at 10 posts/page. Page 1: `/`, Page N: `/page/N/`.
- Acceptance:
  - Pagination renders “Previous/Next” and numbered links; reflects current page.
  - All pagination pages are statically generated.

### 6.2 Post Page
- Static page renders MDX content via `next-mdx-remote/rsc` with sanitized HTML.
- Displays: featured image, title, date, reading time, tags, excerpt, ToC.
- Validates URL date segments match post date; otherwise 404.
- Acceptance:
  - MDX renders with custom components (links, headings with anchors, images, media embeds) and ToC.
  - JSON‑LD BlogPosting emitted.

### 6.3 Tags & Tag Pages
- “All Tags” index sorted by descending usage count (with counts).
- Tag page at `/tag/{slug}/` paginated with `Pagination` component.
- Slug creation: lowercase, hyphenated, safe URL; case‑insensitive matching.
- Acceptance:
  - Tag list shows counts; clicking navigates to tag page with results.
  - Tag pages include pagination and accept `/tag/{slug}/page/{n}/`.

### 6.4 Search
- Client‑side fuzzy search (Fuse.js) over JSON index `public/search-index.json`.
- Query parameter `?q=` drives results on `/search` page; debounced input.
- Ranking weights: title (0.7), excerpt (0.2), tags (0.1).
- Acceptance:
  - Empty query shows tips; loading skeleton; no results state messaging.
  - Results show date, reading time, tags, and highlighted matches.

### 6.5 Static Pages
- Rendered like posts but with `Page` model and canonical `/pages/{slug}/`.
- Optional ToC from headings.

### 6.6 Interactive: Asteroids Game (Desktop MVP)
- Client-only (no SSR) dynamic import under `/games/asteroids/`.
- HTML5 Canvas game loop; entities (Ship, Asteroid, Saucer, Bullet, Explosion).
- Systems: Render, Collision, Sound; hooks for state and responsiveness.
- Keyboard controls: Arrow keys (rotate/thrust), Space (shoot), Esc (pause), Enter (restart).
- Audio with user gesture unlock, categories (effects, ui, ambient), and variants.
- Mobile: not supported; show overlay notice.
- Acceptance:
  - Start, pause/resume, restart flows function; lives/levels/score update.
  - Asteroids split; saucers spawn with level-based behavior; bullets expire.
  - Sound events trigger (start, pause/unpause, thrust, fire, explosions, level).
  - Detailed PRD: `documentation/asteroids/PRD.md`

### 6.7 Discovery & Feeds
- RSS feed at `/rss.xml` generated from posts (title, link, pubDate, category).
- Sitemap at `/sitemap.xml` includes home, pages, tags, posts, pagination.
- robots.txt at `/robots.txt` allows all and links sitemap.

### 6.8 Theming & Design System
- Tailwind v4 tokens in `globals.css` with CSS variables for light/dark.
- Class‑based dark mode (`.dark`); default theme configurable in `siteConfig`.
- Pre‑hydration inline script applies theme quickly to avoid FOUC.


## 7. System Architecture

- Framework: Next.js App Router (v15), static export (`output: 'export'`).
- Hosting: GitHub Pages; `trailingSlash: true` enforced for path semantics.
- Images: `unoptimized: true`; allow‑listed remote hosts in `next.config.ts`.
- Content pipeline: filesystem MDX + gray‑matter; runtime MDX render with sanitization composed via `rehype-sanitize` (allow‑list tags/attributes; drop event handlers).
- Search pipeline: build‑time script `scripts/generate-search-index.ts` writes `public/search-index.json`; client loads and queries with Fuse.
- SEO helpers in `src/lib/seo.ts` supply Metadata and JSON‑LD for posts/home/tags/pages.
- Site configuration in `src/config/site.ts` (title, URLs, authors, analytics, theme tokens).
- Interactive games: isolated under `src/features/games/...`; client‑only pages in `(interactive)`.


## 8. Security & Privacy

- Static‑only: no server runtime; avoid API routes and dynamic server features.
- MDX sanitization: allow‑list elements and attributes; remove all `on*` handlers; no `<script>`.
- Images: remote domains restricted via Next config; featured images must be local or allowed.
- CSP: inline scripts limited to first‑party and trusted domains (Google Tag Manager, etc.). Nonce plumbing supported via component props; future middleware‐based nonce issuance may be added.
- Secrets: do not commit API keys; scripts that require APIs accept env vars at run time.


## 9. Accessibility (a11y)

- Use semantic HTML for articles, headings, navigation; ARIA labels where needed.
- Keyboard‑accessible controls in Header, SearchInput, Pagination, and game start/pause.
- Color contrast and focus styles validated; no critical violations (jest‑axe tests).
- Table of Contents links jump to anchored headings; smooth scroll behavior enabled.


## 10. Performance

- Static export; no server hops; client search only.
- Bundle hygiene through modular components; dynamic import for interactive game.
- No Next Image optimization; prefer appropriately sized assets and dimensions in MDX.
- Goals: LCP < 2.5s on 3G Fast, CLS < 0.1; ship critical CSS via Tailwind variables.


## 11. SEO Requirements

- Page metadata: titles, descriptions, canonical URLs, OpenGraph/Twitter cards.
- JSON‑LD: BlogPosting for posts, Blog summary on home, WebSite with search action.
- Trailing slashes in all URLs; tag slugs normalized; date consistency enforced (UTC).
- Feeds: `/rss.xml` syndicated; `/sitemap.xml` comprehensive and valid.


## 12. Analytics

- Google Analytics via `<Script>` components using GA ID from `siteConfig`.
- Respect CSP (scripts loaded from GTM domain). Future nonce support via middleware if adopted.


## 13. Operational Tooling & Scripts

All scripts run with ESM loader: `node --import tsx/esm scripts/<name>.ts`.

- generate-search-index.ts: builds `public/search-index.json` from posts
- generate-rss.ts: outputs RSS/Atom feed files to `public/`
- find-empty-links.ts: reports malformed or empty markdown links
- create-post.ts: interactive scaffold for dated MDX with frontmatter + sample content
- replace-default-images.ts: updates frontmatter to newer featured images
- download-external-images.ts: caches external images to `public/images/cache/` and rewrites MDX
- tag-and-excerpt.mjs: optional AI‑assisted excerpt/tag generation (requires OPENAI_API_KEY; supports dry‑run and overwrite flags)


## 14. Pages & Routes (Authoritative)

- / — Home (latest posts + pagination if applicable)
- /page/{n}/ — Paginated archive (n ≥ 2)
- /{yyyy}/{mm}/{dd}/{slug}/ — Post detail
- /tags/ — All tags with counts
- /tag/{slug}/ — Tag listing (page 1)
- /tag/{slug}/page/{n}/ — Tag pagination (n ≥ 2)
- /pages/{slug}/ — Static pages
- /search — Search UI powered by JSON index
- /games/asteroids/ — Desktop client‑only interactive game
- /rss.xml — RSS feed
- /sitemap.xml — Sitemap
- /robots.txt — Robots policy (must reference production sitemap URL)

All routes must end with a trailing slash where applicable.


## 15. Acceptance Criteria (E2E)

- Linting: ESLint passes (`lint:ci`) with zero warnings; coverage directory ignored.
- Unit tests: Vitest unit suite passes; a11y suite shows no violations in key components.
- Build: `npm run build` emits static site in `out/` and generates search index + RSS.
- SSG: All dynamic params generated for posts, tags, and pagination; URLs include trailing slashes.
- Security: MDX sanitization strips scripts and event handlers; only allowed tags/attrs remain.
- Search: typing updates URL param; fuzzy matching returns weighted results; empty/no‑result states render appropriately.
- Game: working on desktop with keyboard controls; mobile renders not‑supported overlay; audio unlock on gesture.


## 16. Constraints & Risks

- GitHub Pages hosting mandates full static generation (no SSR, no image optimization API).
- Third‑party embeds (YouTube/Vimeo) must be sanitized and iframe‑based with HTTPS only.
- CSP strictness must accommodate required analytics and embeds; ensure whitelist alignment.
- Large MDX or media can impact bundle size or load time; editorial discipline required.


## 17. Telemetry & Quality

- Monitor GA pageviews, engagement, and search usage (query lengths, result clicks via eventing optional).
- Track build verification: ensure `out/` exists post‑build, `public/search-index.json` present and valid.
- A11y: periodic jest‑axe runs and manual audits for new components.


## 18. Release & Deployment

- Branch/PR flow with Conventional Commits; CI to run lint, tests, and build.
- GitHub Actions deploy to Pages from `out/`.
- Version site content via git history; no database.


## 19. Definitions & References

- Code structure: see `src/app`, `src/components`, `src/lib`, `src/features`, `src/config`.
- Types: `src/lib/types.ts` (Post, Page, PaginatedPosts, TagPage, Heading, etc.).
- Search: `src/lib/search.ts` (Fuse options, index loading, tag extraction).
- Content: `src/lib/content.ts` (frontmatter parsing, drafts, pagination, tags).
- SEO: `src/lib/seo.ts` (Metadata, JSON‑LD helpers).
- MDX: `src/lib/mdx-options.ts`, `src/lib/rehype-sanitize.ts`, `src/lib/sanitize-schema.ts`.
- Game: `src/features/games/asteroids` (engine, systems, hooks, components, sounds, constants).
- Config: `next.config.ts`, `src/config/site.ts`, `tsconfig.json`.

---
This PRD reflects the current architecture and repository conventions while specifying product‑level requirements to guide ongoing development, testing, and content operations.

