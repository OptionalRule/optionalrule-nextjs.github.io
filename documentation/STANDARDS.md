# Coding Standards - Optional Rule Games

Version: 1.0  
Last Updated: September 2025
Applies to: Optional Rule static site and interactive features

## Table of Contents

- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [File Organization](#file-organization)
- [TypeScript Standards](#typescript-standards)
- [React & Next.js Standards](#react--nextjs-standards)
- [MDX Content Standards](#mdx-content-standards)
- [Interactive Features Standards](#interactive-features-standards)
- [Styling Standards](#styling-standards)
- [URL & Routing Standards](#url--routing-standards)
- [Performance Standards](#performance-standards)
- [Security Standards](#security-standards)
- [Testing Standards](#testing-standards)
- [Build & Deployment Standards](#build--deployment-standards)
- [Documentation Standards](#documentation-standards)
- [Git & Version Control Standards](#git--version-control-standards)

## Overview

This document establishes coding standards for the Optional Rule static site project, which combines MDX-based content publishing with client-side interactive features. These standards ensure consistency, maintainability, and adherence to SOLID and DRY principles while supporting static export to GitHub Pages.

### Core Principles

- **Single Responsibility**: Each module, component, or function should have one clear purpose
- **Open/Closed**: Systems should be extensible without modifying existing code
- **Liskov Substitution**: Derived types must be substitutable for base types
- **Interface Segregation**: Depend only on interfaces you use
- **Dependency Inversion**: Depend on abstractions, not concrete implementations
- **DRY (Don't Repeat Yourself)**: Single source of truth for all data and logic
- **Spec-Driven Development**: All features must trace back to PRD requirements
- **Sustainability**: Code should be maintainable by future developers

## Architecture Principles

### Static-First Design

```typescript
// ✅ GOOD: Static generation with precomputed data
export async function generateStaticParams() {
  const posts = await getAllPostFiles();
  return posts.map(post => ({
    year: post.year.toString(),
    month: post.month.toString().padStart(2, '0'),
    day: post.day.toString().padStart(2, '0'),
    slug: post.slug
  }));
}

// ❌ AVOID: Runtime API calls in production
async function getPostData() {
  const response = await fetch('/api/posts'); // Won't work in static export
}
```

### Separation of Concerns

```typescript
// ✅ GOOD: Clear separation between data, presentation, and behavior
// src/lib/content.ts - Data layer
export async function getPost(slug: string): Promise<Post> { }

// src/components/PostCard.tsx - Presentation layer
export function PostCard({ post }: { post: PostMeta }) { }

// src/app/(content)/[year]/[month]/[day]/[slug]/page.tsx - Route layer
export default async function PostPage({ params }) { }
```

## File Organization

### Directory Structure

```
src/
├── app/                           # Next.js App Router
│   ├── layout.tsx                # Root layout with theme injection
│   ├── (content)/                # Content route group
│   │   ├── page.tsx             # Home/blog listing
│   │   ├── [year]/[month]/[day]/[slug]/  # Post URLs
│   │   ├── tags/                # Tag discovery
│   │   └── search/              # Search interface
│   ├── (pages)/                 # Static pages route group
│   │   └── pages/[slug]/        # MDX pages
│   └── (interactive)/           # Client-only features
│       └── games/asteroids/     # Interactive game
├── components/                   # Reusable UI components
│   ├── Header.tsx               # Site navigation
│   ├── Footer.tsx               # Site footer
│   ├── PostCard.tsx             # Post preview card
│   └── SearchInput.tsx          # Search interface
├── features/                     # Feature-specific modules
│   └── games/asteroids/         # Asteroids game implementation
│       ├── index.tsx            # Game entry point
│       ├── config.ts            # Game configuration
│       ├── types.ts             # Type definitions
│       ├── components/          # Game-specific components
│       └── hooks/               # Game-specific hooks
├── lib/                         # Core utilities and helpers
│   ├── content.ts               # Content processing
│   ├── utils.ts                 # URL builders, date parsing
│   ├── seo.ts                   # SEO and metadata
│   ├── search.ts                # Search configuration
│   └── feeds.ts                 # RSS/sitemap generation
├── config/                      # Configuration
│   └── site.ts                  # Site-wide configuration
└── stories/                     # MDX components mapping
    └── mdx-components.tsx       # Custom MDX renderers

content/                         # MDX content (outside src)
├── posts/                       # Blog posts
│   └── YYYY-MM-DD-slug.mdx    # Date-prefixed posts
└── pages/                       # Static pages
    └── slug.mdx                 # Page content

public/                          # Static assets
├── images/                      # Images
├── games/asteroids/sounds/      # Game assets
└── search-index.json           # Generated search index
```

### Naming Conventions

- **Files**: 
  - Components: PascalCase (`PostCard.tsx`, `TableOfContents.tsx`)
  - Utilities: camelCase (`content.ts`, `utils.ts`)
  - Config: camelCase with descriptive names (`site.ts`, `mdx-options.ts`)
  - MDX: `YYYY-MM-DD-slug.mdx` for posts, `slug.mdx` for pages
- **Exports**:
  - React components: PascalCase
  - Functions: camelCase
  - Constants: SCREAMING_SNAKE_CASE for module-level, camelCase for config objects
  - Types/Interfaces: PascalCase

### Import Organization

```typescript
// ✅ GOOD: Organized imports
// 1. React/Next.js
import { Metadata } from 'next';
import Link from 'next/link';

// 2. Third-party libraries
import { MDXRemote } from 'next-mdx-remote/rsc';

// 3. Internal absolute imports
import { siteConfig } from '@/config/site';
import { getPost } from '@/lib/content';

// 4. Internal relative imports
import { PostCard } from './PostCard';

// 5. Type imports
import type { Post, PostMeta } from '@/lib/types';
```

## TypeScript Standards

### Type Safety

```typescript
// ✅ GOOD: Use Zod schemas for runtime validation
import { z } from '@/lib/zod'; // Local minimal implementation

export const PostFrontmatterSchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured_image: z.string().optional(),
  draft: z.boolean().optional().default(false),
  showToc: z.boolean().optional().default(true)
});

export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;

// ✅ GOOD: Extend types with computed properties
export interface PostMeta extends PostFrontmatter {
  year: number;
  month: number;
  day: number;
  url: string;
  readingTime: number;
}

// ❌ AVOID: Using 'any' or loose typing
const post: any = await getPost(slug);
```

### Error Handling

```typescript
// ✅ GOOD: Explicit error handling with proper types
export async function getPost(slug: string): Promise<Post | null> {
  try {
    const filePath = await findPostFile(slug);
    if (!filePath) {
      console.warn(`Post not found: ${slug}`);
      return null;
    }
    
    const { frontmatter, content } = await processMarkdown(filePath);
    const validated = PostFrontmatterSchema.parse(frontmatter);
    
    return {
      ...validated,
      content,
      readingTime: calculateReadingTime(content)
    };
  } catch (error) {
    console.error(`Error loading post ${slug}:`, error);
    return null;
  }
}

// ❌ AVOID: Silent failures
function getPost(slug) {
  try {
    // ...
  } catch {
    return {};
  }
}
```

## React & Next.js Standards

### Component Architecture

```typescript
// ✅ GOOD: Single responsibility components with clear interfaces
interface PostCardProps {
  post: PostMeta;
  featured?: boolean;
  className?: string;
}

export function PostCard({ post, featured = false, className }: PostCardProps) {
  const cardClasses = cn(
    'block border rounded-lg p-4 hover:shadow-lg transition-shadow',
    featured && 'border-primary bg-primary/5',
    className
  );
  
  return (
    <Link href={post.url} className={cardClasses}>
      {/* Component content */}
    </Link>
  );
}

// ❌ AVOID: Components with multiple responsibilities
function PostCardWithAnalyticsAndSearch({ post, onSearch, trackEvent }) {
  // Too many concerns in one component
}
```

### Server vs Client Components

```typescript
// ✅ GOOD: Server component by default
// src/app/(content)/page.tsx
export default async function HomePage() {
  const posts = await getPaginatedPosts(1);
  
  return (
    <div>
      {posts.items.map(post => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}

// ✅ GOOD: Client component only when needed
// src/components/SearchInput.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function SearchInput() {
  const [query, setQuery] = useState('');
  // Interactive search logic
}

// ❌ AVOID: Unnecessary client components
'use client';
export function StaticFooter() {
  return <footer>© 2024</footer>; // Could be server component
}
```

### Route Organization

```typescript
// ✅ GOOD: Semantic URL structure with route groups
src/app/
├── (content)/                    # Content routes
│   ├── page.tsx                 # /
│   ├── page/[page]/             # /page/2/
│   ├── [year]/[month]/[day]/[slug]/ # /2024/03/15/post-title/
│   ├── tags/                    # /tags/
│   └── tag/[tag]/              # /tag/gaming/
├── (pages)/                     # Static pages
│   └── pages/[slug]/           # /pages/about/
└── (interactive)/              # Interactive features
    └── games/asteroids/        # /games/asteroids/
```

## MDX Content Standards

### Frontmatter Requirements

```yaml
# ✅ GOOD: Complete frontmatter for posts
---
slug: getting-started-with-rpgs
title: "Getting Started with Tabletop RPGs"
date: 2024-03-15
excerpt: "A beginner's guide to tabletop role-playing games"
tags: [rpg, beginner, guide]
featured_image: /images/posts/rpg-dice.jpg
draft: false
showToc: true
---

# ❌ AVOID: Missing required fields or invalid formats
---
title: My Post
date: March 15, 2024  # Wrong format
---
```

### File Naming

```
content/posts/
├── 2024-03-15-getting-started.mdx      # ✅ GOOD: YYYY-MM-DD-slug
├── 2024-04-20-advanced-mechanics.mdx   # ✅ GOOD: Consistent format
└── draft-future-ideas.mdx              # ❌ AVOID: Non-standard naming
```

### MDX Component Usage

```mdx
# ✅ GOOD: Using custom components properly
import { Callout } from '@/components/Callout'

<Callout type="info">
  Remember to bring dice to your first session!
</Callout>

![Game setup](/images/posts/game-setup.jpg)

# ❌ AVOID: Inline scripts or unsafe content
<script>alert('hello')</script>  // Will be sanitized out
```

## Interactive Features Standards

### Feature Isolation

```typescript
// ✅ GOOD: Self-contained feature module
// src/features/games/asteroids/index.tsx
export { AsteroidsGame as default } from './components/AsteroidsGame';

// src/features/games/asteroids/config.ts
export const GAME_CONFIG = {
  canvas: {
    width: 800,
    height: 600
  },
  ship: {
    acceleration: 300,
    maxSpeed: 400,
    rotationSpeed: 3
  }
  // Centralized configuration
} as const;

// ❌ AVOID: Scattered configuration
const CANVAS_WIDTH = 800; // In one file
const SHIP_SPEED = 400;   // In another file
```

### Client-Only Loading

```typescript
// ✅ GOOD: Dynamic import with SSR disabled
// src/app/(interactive)/games/asteroids/page.tsx
import dynamic from 'next/dynamic';

const AsteroidsGame = dynamic(
  () => import('@/features/games/asteroids'),
  { 
    ssr: false,
    loading: () => <div>Loading game...</div>
  }
);

export default function AsteroidsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <AsteroidsGame />
    </div>
  );
}
```

### Game State Management

```typescript
// ✅ GOOD: Centralized state with clear types
// src/features/games/asteroids/hooks/useGameState.ts
interface GameState {
  status: 'menu' | 'playing' | 'paused' | 'gameOver';
  score: number;
  lives: number;
  level: number;
  highScore: number;
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Clear action dispatchers
  const startGame = () => dispatch({ type: 'START_GAME' });
  const pauseGame = () => dispatch({ type: 'PAUSE_GAME' });
  
  return { state, startGame, pauseGame };
}
```

## Styling Standards

### Tailwind CSS Usage

```typescript
// ✅ GOOD: Consistent utility patterns with semantic grouping
const buttonStyles = {
  base: 'px-4 py-2 rounded font-medium transition-colors',
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  disabled: 'opacity-50 cursor-not-allowed'
};

// ✅ GOOD: Responsive utilities
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// ❌ AVOID: Inline styles when utilities exist
<div style={{ padding: '1rem', backgroundColor: '#3b82f6' }}>
```

### CSS Variables

```css
/* ✅ GOOD: Design tokens via CSS variables */
:root {
  --color-primary: #2563eb;
  --color-background: #ffffff;
  --font-sans: system-ui, -apple-system, sans-serif;
}

.dark {
  --color-background: #0f172a;
  --color-text: #f1f5f9;
}

/* ❌ AVOID: Hard-coded values throughout stylesheets */
.header {
  background: #2563eb; /* Use var(--color-primary) instead */
}
```

## URL & Routing Standards

### URL Helpers

```typescript
// ✅ GOOD: Centralized URL generation
// src/lib/utils.ts
export const urlPaths = {
  home: () => '/',
  post: (date: Date, slug: string) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `/${year}/${month}/${day}/${slug}/`;
  },
  tag: (slug: string, page?: number) => 
    page && page > 1 ? `/tag/${slug}/page/${page}/` : `/tag/${slug}/`,
  page: (n: number) => `/page/${n}/`,
  search: (query?: string) => 
    query ? `/search/?q=${encodeURIComponent(query)}` : '/search/'
};

// ❌ AVOID: Hardcoded URLs throughout codebase
<Link href="/search">  // Should use urlPaths.search()
<Link href={`/tag/${tag}`}>  // Should use urlPaths.tag(tag)
```

### Trailing Slash Consistency

```typescript
// ✅ GOOD: All internal URLs include trailing slashes
export const internalLinks = [
  '/about/',
  '/tags/',
  '/search/'
];

// ❌ AVOID: Inconsistent trailing slashes
const links = ['/about', '/tags/', '/search'];
```

## Performance Standards

### Build-Time Optimization

```typescript
// ✅ GOOD: Pre-compute at build time
// scripts/generate-search-index.ts
const posts = await getAllPosts();
const searchIndex = posts.map(post => ({
  title: post.title,
  excerpt: post.excerpt,
  tags: post.tags,
  url: post.url
}));
await writeFile('public/search-index.json', JSON.stringify(searchIndex));

// ❌ AVOID: Runtime computation for static data
const searchIndex = posts.map(post => {
  // Computing this on every page load
  return computeSearchData(post);
});
```

### Image Optimization

```typescript
// ✅ GOOD: Specify dimensions for local images
<img 
  src="/images/hero.jpg" 
  width={1200} 
  height={630}
  alt="Hero image"
  loading="lazy"
/>

// ❌ AVOID: Images without dimensions (causes layout shift)
<img src="/images/hero.jpg" alt="Hero">
```

### Bundle Size Management

```typescript
// ✅ GOOD: Code splitting for large features
const AsteroidsGame = dynamic(() => import('@/features/games/asteroids'));

// ✅ GOOD: Tree-shakeable imports
import { formatDate } from '@/lib/utils';

// ❌ AVOID: Importing entire libraries
import * as utils from '@/lib/utils';
```

## Security Standards

### Content Sanitization

```typescript
// ✅ GOOD: Sanitize MDX content
// src/lib/sanitize-schema.ts
export const sanitizeSchema = {
  tagNames: ['p', 'span', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  attributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height']
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
};

// ❌ AVOID: Rendering unsanitized content
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

### External Links

```typescript
// ✅ GOOD: Secure external links
export function ExternalLink({ href, children }: Props) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="external-link"
    >
      {children}
    </a>
  );
}
```

### Environment Variables

```typescript
// ✅ GOOD: Validate environment configuration
// src/config/site.ts
export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.optionalrule.com',
  title: 'Optional Rule Games',
  analytics: {
    googleId: process.env.NEXT_PUBLIC_GA_ID
  }
};

// ❌ AVOID: Direct environment variable usage
const url = process.env.SITE_URL; // Not validated, might be undefined
```

## Testing Standards

### Test Organization

```typescript
// ✅ GOOD: Comprehensive test coverage
// src/__tests__/integration.test.ts
describe('Content Pipeline', () => {
  describe('getAllPosts', () => {
    it('excludes draft posts in production', async () => {
      process.env.NODE_ENV = 'production';
      const posts = await getAllPosts();
      expect(posts.every(p => !p.draft)).toBe(true);
    });
    
    it('includes draft posts in development', async () => {
      process.env.NODE_ENV = 'development';
      const posts = await getAllPosts();
      expect(posts.some(p => p.draft)).toBe(true);
    });
  });
});

// ✅ GOOD: Component testing
// src/components/__tests__/PostCard.test.tsx
describe('PostCard', () => {
  it('renders post metadata correctly', () => {
    const post = createMockPost();
    render(<PostCard post={post} />);
    
    expect(screen.getByText(post.title)).toBeInTheDocument();
    expect(screen.getByText(post.excerpt)).toBeInTheDocument();
  });
});
```

### Accessibility Testing

```typescript
// ✅ GOOD: Test for accessibility
import { axe } from 'jest-axe';

it('should have no accessibility violations', async () => {
  const { container } = render(<Header />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Build & Deployment Standards

### Build Scripts

```json
// ✅ GOOD: Comprehensive build pipeline
{
  "scripts": {
    "dev": "next dev",
    "build": "npm run build:search && npm run build:feeds && next build",
    "build:search": "tsx scripts/generate-search-index.ts",
    "build:feeds": "tsx scripts/generate-rss.ts",
    "test": "vitest",
    "test:a11y": "vitest src/__tests__/accessibility.test.tsx",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "verify": "npm run typecheck && npm run lint && npm run test"
  }
}
```

### Static Export Configuration

```typescript
// ✅ GOOD: Proper static export setup
// next.config.ts
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' }
    ]
  }
};
```

### GitHub Pages Deployment

```yaml
# ✅ GOOD: GitHub Actions deployment
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

jobs:
  deploy:
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: actions/upload-pages-artifact@v2
        with:
          path: ./out
```

## Documentation Standards

### Code Documentation

```typescript
// ✅ GOOD: Clear JSDoc for public APIs
/**
 * Retrieves a post by its slug, including full content and metadata.
 * 
 * @param slug - The URL-safe slug of the post
 * @returns The complete post with content, or null if not found
 * @example
 * ```typescript
 * const post = await getPost('getting-started');
 * if (post) {
 *   console.log(post.title, post.readingTime);
 * }
 * ```
 */
export async function getPost(slug: string): Promise<Post | null> {
  // Implementation
}

// ❌ AVOID: Missing or unhelpful documentation
// Gets a post
function getPost(s) { }
```

### README Structure

```markdown
# ✅ GOOD: Comprehensive README
## Optional Rule Games

### Quick Start
- Prerequisites
- Installation steps
- Development commands

### Architecture
- Overview diagram
- Key directories
- Data flow

### Content Management
- Adding posts
- Managing pages
- Using interactive features

### Deployment
- GitHub Pages setup
- Environment variables
- Build verification
```

### Inline Comments

```typescript
// ✅ GOOD: Explain business logic and edge cases
// Calculate reading time assuming 200 words per minute
// Round up to ensure we don't show "0 min read"
const readingTime = Math.ceil(wordCount / 200);

// GitHub Pages requires trailing slashes for proper routing
// Without this, /tags would redirect to /tags/ causing a flash
const url = ensureTrailingSlash(path);

// ❌ AVOID: Obvious comments
i++; // Increment i
const sum = a + b; // Add a and b
```

## Git & Version Control Standards

### Commit Messages

```bash
# ✅ GOOD: Conventional commit format
feat: add pagination to tag pages
fix: correct search index generation for drafts
docs: update README with WSL setup instructions
refactor: extract URL helpers to centralized module
test: add integration tests for content pipeline
chore: update dependencies to latest versions
perf: optimize search index size by excluding content

# ❌ AVOID: Vague or non-standard messages
update files
fix bug
WIP
```

### Branch Strategy

```bash
# ✅ GOOD: Feature branch workflow
main                 # Production-ready code
├── feat/search-improvements
├── fix/pagination-bug
├── docs/api-documentation
└── refactor/content-pipeline

# ❌ AVOID: Long-lived feature branches
main
└── dev  # Months old, hundreds of commits behind
```

### Pull Request Standards

```markdown
# ✅ GOOD: PR template
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Follows coding standards
- [ ] Updates documentation
- [ ] No console errors
```

## Configuration Management

### Constants Organization

```typescript
// ✅ GOOD: Centralized configuration
// src/config/site.ts
export const siteConfig = {
  url: 'https://www.optionalrule.com',
  title: 'Optional Rule Games',
  description: 'Tabletop RPG content and tools',
  postsPerPage: 10,
  defaultTheme: 'dark'
} as const;

// src/lib/content.ts
export const POSTS_PER_PAGE = siteConfig.postsPerPage;

// ❌ AVOID: Magic numbers scattered throughout
const posts = await getPaginatedPosts(1, 10); // Magic number
```

### Feature Flags

```typescript
// ✅ GOOD: Centralized feature flags
export const features = {
  enableSearch: true,
  enableComments: false,  // Future feature
  enableAsteroids: true,
  debugMode: process.env.NODE_ENV === 'development'
};

// Usage
if (features.enableAsteroids) {
  // Render game link
}
```

## Enforcement

These standards are enforced through:

- **TypeScript**: Strict mode with comprehensive type checking
- **ESLint**: Code quality and style consistency
- **Vitest**: Unit and integration test suites
- **jest-axe**: Accessibility testing
- **GitHub Actions**: Automated CI/CD pipeline
- **Pre-commit hooks**: Via husky (if configured)
- **Code Reviews**: Required PR reviews before merging

### Quality Gates

All code must pass the following before merge:

1. TypeScript compilation (`npm run typecheck`)
2. ESLint validation (`npm run lint`)
3. Test suites (`npm run test`)
4. Build verification (`npm run build`)
5. Accessibility tests (`npm run test:a11y`)

### Continuous Improvement

- Standards are reviewed quarterly
- Propose changes via GitHub Issues
- Major changes require team consensus
- Document exceptions in code comments with justification

---

For questions about these standards or to propose changes, please create an issue in the repository with the `standards` label.