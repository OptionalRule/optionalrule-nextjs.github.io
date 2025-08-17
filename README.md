# Optional Rule Static Website Generators

This is website to publishe a static site for [Optional Rule Games](https://www.optionalrule.com) using [Next.js](https://nextjs.org).

The implementation builds a statis site that is served from GitHub Pages.

## Project Overview

This is a Next.js 15 static blog site for Optional Rule Games that deploys to GitHub Pages. The project uses App Router with TypeScript and exports as a static site. Content is managed through MDX files with gray-matter frontmatter processing.

## Development Commands

- `npm run dev` - Start development server with hot reloading (includes draft posts)
- `npm run build` - Build static site for production (excludes draft posts)
- `npm run start` - Start production server  
- `npm run lint` - Run ESLint for code quality checks
- `npm run generate-search-index` - Generate search index from all posts
- `npm run find-empty-links` - Scan content for broken markdown links
- `npm run create-post` - Create new blog post with frontmatter template

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
- **Image optimization disabled**: Required for static export to GitHub Pages
- **Search runs client-side**: No server dependency for search functionality

## Theme Toggle

- Behavior: A toggle in the header switches between Light/Dark and persists in `localStorage` under key `theme` (`light` | `dark`).
- No flash on load: An inline script in `src/app/layout.tsx` applies `.dark` to `<html>` before React hydrates, based on `localStorage` or system preference fallback.
- Tailwind v4: Dark mode is class-based via CSS. `:root` defines light tokens and `.dark` overrides tokens and sets `color-scheme: dark`.
- Reset preference: Clear local storage key `theme` (DevTools > Application > Local Storage) or run `localStorage.removeItem('theme')` in console, then reload.
- Revert to system preference: Remove the inline script in `src/app/layout.tsx` and delete the `.dark` overrides in `src/app/globals.css`, then rely on the existing `@media (prefers-color-scheme: dark)` approach.
