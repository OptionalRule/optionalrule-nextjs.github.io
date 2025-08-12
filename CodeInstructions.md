# NextJS Static Blog Project Requirements

Act as an expert in NextJS for developing static websites to be hosted on Github pages.

You have a passion for best practices, great user experiences, and simplicity.

## Goal

Design and implement a modern NextJS static blog that exports to GitHub Pages, built from a newly generated NextJS isntance using best practices.

## Assumptions

Assume the next JS site was installed with the following enabled:

- typescript
- eslint
- app director
- src-dir
- import-alias "@/*"

## Key Requirements

### Content & Structure

- Blog posts written in Markdown with frontmatter
- Static pages (about, etc.) also in Markdown
- Post listings with excerpts, dates, reading time, and tags
- Pagination for post listings (10 posts per page)
- Individual post detail pages with full content
- Tag-based post filtering and tag pages

### URL Patterns (Must Preserve)

- Individual posts: /:year/:month/:day/:slug/ (with trailing slashes)
- Home page: / (paginated post list)
- Pagination: /page/:num/
- Static pages: /about/, /contact/, etc.
- Tag pages: /tag/:tagname/ (with pagination)

### Technical Requirements

- NextJS 14+ with App Router
- TypeScript throughout
- Static site generation (SSG) with next export
- Export to out/ directory for GitHub Pages
- Proper SEO with metadata, Open Graph, Twitter cards
- RSS feed generation
- Sitemap generation
- Mobile-responsive design
- Using Tailwindcss for styling


### Content Management

- Content stored outside of src/ directory
- Clean separation between content and code
- Support for post metadata: title, date, excerpt, tags, featured image, any other best practice tags 
- Automatic excerpt generation if not provided
- Reading time calculation

### Content Strategy

- Assume use of MDX for blog posts and pages.
- Include at least 2 sample blog posts using lorem ipsum
- Include at least 1 page (an about page)

## Constraints

- Use modern dependencies with good community support.
- Avoid bloat.
- Avoid repeating yourself needlessly.
- Follow coding best practices for encapsulation and reusability.
- Add brief but helpful comments where appropriate in any code generated.

## Success Criteria

### Architecture

- Clean, maintainable NextJS codebase following current best practices
- Proper TypeScript types and interfaces
- Component-based architecture with clear separation of concerns
- Scalable file structure that can grow with additional features

### Performance & SEO

- Fast static site generation and loading
- Proper metadata and structured data
- Accessible HTML with semantic markup
- Search engine friendly URLs and content structure

### Developer Experience

- Clear, logical file organization
- Easy content authoring workflow
- Simple build and deployment process
- Good TypeScript developer experience with proper types

## Deliverables Needed

1. Proper NextJS project structure and configuration
2. Core components for blog functionality (post lists, pagination, post detail)
3. Content parsing and management utilities
4. SEO and metadata handling
5. Build process for static export to GitHub Pages
6. Basic styling structure (content focused, minimal initial styling)

## Current Experience Level

- Experienced with Python, architecture, typescript, and coding best practices
- Familiar with Jekyll and static sites
- Learning NextJS specifics and want to follow current best practices
- Prefer clean, maintainable code over quick solutions
