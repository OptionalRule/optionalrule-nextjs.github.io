# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **Dark mode support** through CSS custom properties and `prefers-color-scheme`

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

## Code Quality and Best Practices Guidelines (Next.js with TypeScript)

### Architecture and Design Principles

- **Architecture-First Approach**: Design the application structure using Next.js conventions (pages/app router, API routes, middleware). Plan component hierarchy, state management, and data flow before implementation.
- **Single Responsibility Principle**: Each React component, custom hook, utility function, and API route should have one clear purpose. Separate business logic from presentation logic.
- **Encapsulation**: Use proper TypeScript access modifiers, private methods, and module boundaries. Expose only necessary props and interfaces from components and modules.
- **DRY (Don't Repeat Yourself)**: Extract common functionality into custom hooks, utility functions, shared components, and reusable TypeScript types/interfaces.

### Next.js Specific Best Practices

- **App Router Structure**: Use the app directory structure with proper layout nesting, loading states, and error boundaries.
- **Server vs Client Components**: Explicitly mark client components with 'use client' and prefer server components for data fetching and static content.
- **API Route Security**: Implement proper HTTP method handling, request validation, and error responses in API routes.
- **Performance Optimization**: Utilize Next.js built-in optimizations (Image component, dynamic imports, static generation) and implement proper caching strategies.
- **SEO and Metadata**: Implement proper metadata API usage, structured data, and semantic HTML for better search engine optimization.

### TypeScript Standards

- **Type Safety**: Use strict TypeScript configuration with `strict: true` and additional strict flags (`noImplicitReturns`, `noFallthroughCasesInSwitch`).
- **NO `any` TYPES**: **NEVER use `any` type**. Always specify proper types. Use `unknown` for truly unknown data, specific interfaces for objects, or union types for multiple possibilities.
- **Unused Variables**: Prefix unused parameters with underscore (e.g., `_event`, `_index`) to indicate intentional non-use and avoid linting errors.
- **Interface Design**: Define clear interfaces for props, API responses, and data models. Use generic types for reusable components.
- **Type Guards**: Implement proper runtime type checking using type guards or validation libraries like Zod for external data.
- **Utility Types**: Leverage TypeScript utility types (`Omit`, `Pick`, `Partial`, etc.) for type transformations and avoid duplication.

### React and Component Best Practices

- **Component Design**: Create small, focused components with clear prop interfaces. Use composition over inheritance.
- **State Management**: Choose appropriate state management (useState, useReducer, Zustand, Redux Toolkit) based on complexity and scope.
- **Custom Hooks**: Extract complex logic into custom hooks for reusability and testability.
- **Error Boundaries**: Implement error boundaries for graceful error handling in component trees.
- **Accessibility**: Follow WCAG guidelines with proper ARIA attributes, semantic HTML, and keyboard navigation support.

### Security Best Practices

- **Input Validation**: Validate all user inputs using schema validation libraries (Zod, Yup) on both client and server sides.
- **API Security**: Implement CSRF protection, rate limiting, and proper authentication/authorization for API routes.
- **XSS Prevention**: Sanitize user-generated content and avoid dangerouslySetInnerHTML unless absolutely necessary.
- **Environment Variables**: Use Next.js environment variable conventions (`NEXT_PUBLIC_` for client-side, secure server-only variables).
- **Content Security Policy**: Implement CSP headers through next.config.js or middleware for additional security.
- **Dependency Security**: Regular dependency updates, use of `npm audit`, and careful evaluation of third-party packages.

### Performance and Optimization

- **Bundle Optimization**: Use dynamic imports for code splitting, optimize bundle size with proper tree shaking.
- **Image Optimization**: Always use Next.js Image component with proper sizing, lazy loading, and format optimization.
- **Caching Strategies**: Implement appropriate caching with Next.js cache functions, SWR/React Query for client-side caching.
- **Core Web Vitals**: Monitor and optimize for LCP, FID, CLS, and other performance metrics.

### Testing and Quality Assurance

- **Testing Stack**: Use Jest with React Testing Library for unit/integration tests, Playwright or Cypress for E2E tests.
- **Component Testing**: Test component behavior, user interactions, and accessibility features.
- **API Testing**: Test API routes with proper mocking and error scenarios.
- **Type Testing**: Use TypeScript compiler tests and tools like `tsd` for type-level testing.

### Development Workflow

- **Linting and Formatting**: Configure ESLint with Next.js rules, Prettier, and TypeScript-specific linting rules.
- **Git Hooks**: Implement pre-commit hooks for linting, type checking, and testing using Husky or similar tools.
- **Code Review**: Review for TypeScript type safety, React patterns, Next.js best practices, and security considerations.

### Implementation Standards

- Follow Next.js and React conventions for file naming (kebab-case for files, PascalCase for components)
- Use ESLint rules: `@next/eslint-plugin-next`, `@typescript-eslint/recommended`
- Implement proper TypeScript path mapping in `tsconfig.json` for clean imports
- Use Next.js built-in features (middleware, route handlers) over custom solutions
- Implement proper loading states and error handling for async operations
- Consider accessibility from the start with proper semantic HTML and ARIA attributes

### Performance Monitoring

- Implement analytics and monitoring (Web Vitals, error tracking)
- Use Next.js built-in performance metrics and bundle analysis
- Regular lighthouse audits and performance testing

Remember: These guidelines should enhance development velocity while maintaining code quality. Leverage TypeScript's type system and Next.js optimizations to build robust, scalable applications.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
NEVER use `any` type in TypeScript - always specify proper types or use `unknown` for truly unknown data.
ALWAYS prefix unused function parameters with underscore (e.g., `_event`, `_props`) to indicate intentional non-use.
NEVER add comments to code unless explicitly requested by the user.
