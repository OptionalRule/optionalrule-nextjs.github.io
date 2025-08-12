# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 project intended to become a static blog site for GitHub Pages. The project is currently in setup phase with the goal of implementing a complete MDX-based blog system.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Project Architecture

### Current State
- Fresh Next.js 15 installation with App Router
- TypeScript configuration with path aliases (`@/*` -> `./src/*`)
- TailwindCSS v4 for styling with inline theme configuration
- ESLint with Next.js and TypeScript rules

### Planned Architecture (from CodeInstructions.md)
The project will implement a static blog with these key components:

**URL Structure:**
- Posts: `/:year/:month/:day/:slug/` (with trailing slashes)
- Home: `/` (paginated post list)
- Pagination: `/page/:num/`
- Static pages: `/about/`, `/contact/`
- Tag pages: `/tag/:tagname/`

**Content Management:**
- MDX for blog posts and static pages
- Content stored outside `src/` directory
- Frontmatter metadata: title, date, excerpt, tags, featured image
- Automatic excerpt generation and reading time calculation

**Technical Requirements:**
- Static Site Generation (SSG) with `next export`
- Export to `out/` directory for GitHub Pages
- RSS feed and sitemap generation
- SEO optimization with proper metadata
- Mobile-responsive design

### File Structure
```
src/
  app/                  # App Router pages and layouts
    layout.tsx         # Root layout with Geist fonts
    page.tsx           # Home page (currently default Next.js)
    globals.css        # Global styles with TailwindCSS
```

## Styling System

- **TailwindCSS v4** with inline theme configuration
- **CSS Custom Properties** for theming (background, foreground colors)
- **Geist Fonts** (sans and mono) via next/font/google
- **Dark mode support** via prefers-color-scheme media query

## Key Implementation Notes

1. **Import Alias**: Use `@/*` for imports from `src/` directory
2. **Static Export**: Will need to configure `next.config.ts` for static export to GitHub Pages
3. **Content Location**: Blog content should be stored outside `src/` directory per requirements
4. **SEO Focus**: Implement comprehensive metadata, Open Graph, and Twitter cards
5. **Performance**: Focus on fast static generation and loading times

## Next Steps for Development

Based on CodeInstructions.md, the main development tasks ahead are:
1. Set up MDX processing and content management
2. Implement blog post listing and detail pages
3. Add pagination and tag filtering
4. Configure static export for GitHub Pages
5. Implement SEO metadata and feed generation
6. Create responsive design with TailwindCSS