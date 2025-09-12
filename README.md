# Optional Rule Static Website Generators

This is website to publishe a static site for [Optional Rule Games](https://www.optionalrule.com) using [Next.js](https://nextjs.org).

The implementation builds a statis site that is served from GitHub Pages.

## Project Overview

This is a Next.js 15 static blog site for Optional Rule Games that deploys to GitHub Pages. The project uses App Router with TypeScript and exports as a static site. Content is managed through MDX files with gray-matter frontmatter processing.

## Development Commands

- `npm run dev` - Start development server with hot reloading (includes draft posts)
- `npm run build` - Build static site for production (excludes draft posts)
- `npm run validate-config` - Validate configuration (URL/CNAME/robots/sitemap/assets/GA)
- `npm run start` - Start production server  
- `npm run lint` - Run ESLint for code quality checks
- `npm run generate-search-index` - Generate search index from all posts
- `npm run find-empty-links` - Scan content for broken markdown links
- `npm run create-post` - Create new blog post with frontmatter template

## Testing

- `npm run test` - Run all unit tests
- `npm run test:watch` - Run tests in watch mode during development
- `npm run test:ui` - Run tests with browser-based UI
- `npm run test:build` - Build verification tests (includes build + static tests)

See [Testing Strategy Documentation](docs/testing-strategy.md) for comprehensive testing approach and upgrade protection details.

## Architecture Overview

### Static Site Generation
The site uses Next.js static export (`output: 'export'`) configured in `next.config.ts`. All routes are pre-rendered at build time for GitHub Pages deployment. The build process runs through GitHub Actions using `.github/workflows/deploy.yml`.

### Content Management System
- **Content Location**: MDX files stored in `content/posts/` and `content/pages/`
- **Processing Pipeline**: `src/lib/content.ts` handles MDX parsing with gray-matter for frontmatter
- **URL Structure**: Posts follow `/:year/:month/:day/:slug/` pattern with trailing slashes
- **Draft System**: Posts with `draft: true` frontmatter are excluded from production builds

### Route Architecture  
The App Router uses route groups for organization:
- `(content)` group: Blog posts, pagination, tags, search
- `(pages)` group: Static pages like About
- Dynamic routes: `[year]/[month]/[day]/[slug]` for posts, `[tag]` for tag pages

### Search Implementation
- **Client-side search** using Fuse.js for fuzzy matching
- **Search index generation** creates JSON index from all posts during build
- **Components**: `SearchInput` and `SearchResults` with debounced typing
- **URL integration**: Search queries reflected in URL parameters

### Styling System
- **TailwindCSS v4** with inline configuration in `globals.css`
- **Geist fonts** (sans and mono) loaded via `next/font/google`
- **Theme toggle** using class-based dark mode (`.dark` on `<html>`) with persistence

## Content Structure

### Post Frontmatter Requirements
```yaml
slug: post-slug
title: Post Title
date: 'YYYY-MM-DD'
excerpt: Brief description
tags: [tag1, tag2]
featured_image: /images/image.jpg
draft: false
showToc: false
```

For static images rendered in MDX, Next.js's `<Image>` component requires explicit dimensions. Add `imageWidth` and `imageHeight` fields to your frontmatter and use them when referencing the image:

```yaml
imageWidth: 800
imageHeight: 600
```

```mdx
<img src="/images/example.png" alt="Example" width={frontmatter.imageWidth} height={frontmatter.imageHeight} />
```

### Content Processing
- **Reading time calculation** automatically added to all posts
- **Heading extraction** for table of contents generation
- **Excerpt generation** from content if not provided in frontmatter
- **Tag normalization** and slug generation for tag pages

## TypeScript Configuration

### Module Resolution
- **Path aliases**: `@/*` maps to `./src/*` for clean imports
- **ESM scripts**: Scripts use `node --import tsx/esm` for TypeScript execution
- **Type definitions**: Comprehensive types in `src/lib/types.ts`

### Search Index Types
The search system uses strictly typed interfaces for `SearchIndexItem`, `SearchResult`, and `SearchOptions` with runtime validation during index loading.

## Scripts and Utilities

### Content Management Scripts
All scripts use ESM loader pattern and are located in `scripts/` directory:
- **Search index generation**: Processes all MDX files into searchable JSON
- **Empty link detection**: Scans for broken markdown link patterns
- **Post creation**: Interactive post scaffold with proper frontmatter

### Build Process
1. Generate search index from all posts
2. Next.js static build with route pre-rendering  
3. Export to `out/` directory for GitHub Pages
4. Automatic deployment via GitHub Actions

## Key Configuration Files

- **Site config**: `src/config/site.ts` contains metadata, author info, analytics
- **Content processing**: `src/lib/content.ts` handles MDX parsing and post management
- **Route layouts**: App Router layouts in `src/app/layout.tsx` with font loading
- **Static export**: `next.config.ts` configures GitHub Pages deployment

## Important Implementation Notes

- **Content outside src/**: MDX files in `content/` directory separate from Next.js source
- **Trailing slashes required**: All routes end with `/` for GitHub Pages compatibility
- **Static-only**: No server-side rendering or API routes in production
- **Image optimization enabled**: Uses Next.js `<Image>` with static export; images require width and height in frontmatter
- **Search runs client-side**: No server dependency for search functionality

## Content Security Policy

The application emits a strict Content Security Policy (CSP) using Next.js middleware. A unique nonce is generated for every request and applied to inline `<script>` tags, allowing them to execute while blocking injected scripts. The middleware sets the `Content-Security-Policy` header with:

- `script-src 'self' 'nonce-<random>' https://www.googletagmanager.com https://platform.twitter.com https://s.imgur.com`

This restricts script execution to the site itself and the trusted domains above. Server components can read the nonce via `headers().get('x-nonce')` and pass it to `<script>` or `next/script` elements.

## Theme Toggle

- Behavior: A toggle in the header switches between Light/Dark and persists in `localStorage` under key `theme` (`light` | `dark`).
- No flash on load: An inline script in `src/app/layout.tsx` applies `.dark` to `<html>` before React hydrates, based on `localStorage` or system preference fallback.
- Tailwind v4: Dark mode is class-based via CSS. `:root` defines light tokens and `.dark` overrides tokens and sets `color-scheme: dark`.
- Reset preference: Clear local storage key `theme` (DevTools > Application > Local Storage) or run `localStorage.removeItem('theme')` in console, then reload.
- Revert to system preference: Remove the inline script in `src/app/layout.tsx` and delete the `.dark` overrides in `src/app/globals.css`, then rely on the existing `@media (prefers-color-scheme: dark)` approach.
- Default theme at loadtime can be set via `/src/config/site.ts` and theme variables changed as needed.

## Scripts

Direct script execution (not via npm commands) for maintenance and content management tasks.

### TypeScript Scripts

Run TypeScript scripts using the ESM loader:
```bash
node --import tsx/esm scripts/[script-name].ts
```

#### Content Management

**`create-post.ts`** - Interactive blog post creation  
Creates new MDX post files with proper frontmatter and filename structure.
```bash
node --import tsx/esm scripts/create-post.ts
```
- Interactive prompts for title, tags, and featured image
- Auto-generates slug and filename from title  
- Creates file in `content/posts/` with today's date

**`find-empty-links.ts`** - Scan for broken markdown links  
Scans all MDX files for empty or malformed markdown links.
```bash
node --import tsx/esm scripts/find-empty-links.ts
```
- Detects patterns like `[text]()`, `[text]("")`, `[]()` 
- Reports file, line number, and problematic content
- No command-line flags

**`generate-search-index.ts`** - Build search index  
Processes all blog posts into a searchable JSON index for client-side search.
```bash
node --import tsx/esm scripts/generate-search-index.ts
```
- Reads all MDX files from `content/posts/`
- Extracts title, excerpt, tags, and content
- Outputs to `public/search-index.json`

**`generate-rss.ts`** - Generate RSS feed  
Creates RSS/Atom feed from blog posts.
```bash
node --import tsx/esm scripts/generate-rss.ts
```
- Processes recent posts for RSS feed
- Outputs feed files to `public/`
- Uses site config for feed metadata

#### Image Management

**`download-external-images.ts`** - Cache external images locally  
Downloads external images referenced in posts and updates MDX files.
```bash
node --import tsx/esm scripts/download-external-images.ts
```
- Scans MDX files for external image URLs
- Downloads to `public/images/cache/`
- Updates MDX files with local paths

**`replace-default-images.ts`** - Update default featured images  
Replaces old/default featured images with random selections from current image set.
```bash
node --import tsx/esm scripts/replace-default-images.ts
```
- Targets specific old image paths
- Randomly assigns from curated replacement set
- Updates frontmatter in MDX files

### ECMAScript Modules

**`tag-and-excerpt.mjs`** — AI-powered content enhancement  
Generates concise excerpts and curated tags for MDX posts using OpenAI. Loads configuration from `.env`.

```bash
node scripts/tag-and-excerpt.mjs [<path>] [options]
```

- Path: `<path>` may be a directory (recurses `**/*.mdx`) or a single `.mdx` file. If omitted, defaults to `content/posts`.

Env configuration (.env):
- `OPENAI_API_KEY`: Required API key
- `OPENAI_MODEL`: Model name (e.g., `gpt-5-mini`, `gpt-4o-mini`)
- `OPENAI_REASONING`: Reasoning effort (`low` | `medium` | `high`)

Options:
- `--dry-run`: Preview changes without modifying files
- `--path <path>`: Explicit path if you don’t use the positional arg
- `--overwrite-excerpts`: Replace existing excerpts
- `--overwrite-tags`: Replace existing tags
- `--no-backup`: Skip `.bak` creation (default: true)
- `--concurrency <n>`: Parallel processing limit (default: 3)
- `--model <name>`: Override model from `.env`

Example usage:
```bash
# Dry run to preview changes on all posts
node scripts/tag-and-excerpt.mjs --dry-run

# Process a specific post file (positional path)
node scripts/tag-and-excerpt.mjs content/posts/2024-01-01-example-post.mdx

# Process a directory with custom concurrency
node scripts/tag-and-excerpt.mjs content/drafts --concurrency 5

# Override model defined in .env
node scripts/tag-and-excerpt.mjs --model gpt-4o-mini
```
