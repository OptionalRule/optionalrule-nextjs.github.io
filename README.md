# Optional Rule Static Website Generators

This is website to publishe a static site for [Optional Rule Games](https://www.optionalrule.com) using [Next.js](https://nextjs.org).

The implementation builds a statis site that is served from GitHub Pages.

## Development

To setup this app locall just clone the git repository and type `npm install` to install dependencies.  

## Useful Commands

### `npm run build`

Builds the static site, excluding any posts marked as drafts. 

### `npm run lint`

Runs strict linter over code as an error check.

### `npm run dev`

Runs the development server with hot reloading, including draft posts for preview.

## Custom Scriopts

I have created a number of custom scripts for blog management that run from the command line.  

### `npm run new-post`

Creates a new blog post with the correct frontmatter template. It will prompt for the title and automatically generate the slug, date, and other required fields.

### `npm run import-jekyll`

Imports posts from a Jekyll blog, converting the frontmatter and content to be compatible with this Next.js site. It handles:

- Converting dates to the correct format
- Updating image paths
- Transforming Jekyll-specific frontmatter fields
- Preserving excerpts and metadata

### `node scripts/tag-and-excerpt`

Runs a custom script to generate tags and a better excerpt for posts through opeanai

```bash
node scripts/tag-and-excerpt.mjs --api-key sk-xxx
# or
export MY_OPENAI_KEY="sk-xxx"
node scripts/tag-and-excerpt.mjs --api-key MY_OPENAI_KEY
```

### `npm run find-empty-links`

Scans all markdown content files for empty markdown links and reports their locations. This utility helps maintain content quality by identifying broken or incomplete link references.

The script detects various patterns of empty links:
- `[text]()` - Empty parentheses
- `[text]("")` or `[text]('')` - Empty quotes  
- `[]()` - Empty text and URL
- `[text]( )` - Whitespace-only URLs

Output includes:
- File paths containing empty links
- Line numbers and context for each issue
- Summary statistics of files scanned and issues found

Example output:
```bash
❌ content/posts/example-post.mdx
   Line 28: [Tools for Effecting Rolls]()
   Context: In my article, "[Tools for Effecting Rolls]()," I explored...

📊 Summary:
Files scanned: 88
Files with empty links: 1  
Total empty links found: 1
```

## Github Pages

This site is setup to run under github pages.  The build is automatic and run from `.github/workflows/deploy.yml`

## Site Search

Search is implemented client side using [Fuse.js](https://www.fusejs.io/).  

1. Fuse.js Integration - Added fuzzy search library for client-side search
2. Search Index Generation - Build script that creates a JSON index from all blog posts
3. Search Components - SearchInput and SearchResults components with proper styling
4. Search Page - Dedicated /search route with full search functionality
5. Navigation Integration - Added search icon to header navigation
6. Build Integration - Search index generates automatically before builds

Key Features:

- Fuzzy Search - Handles typos and partial matches
- Real-time Results - Search as you type with debouncing
- Keyboard Shortcuts - ⌘K or Ctrl+K to focus search
- Responsive Design - Matches existing site styling
- URL Sharing - Search queries are reflected in URL parameters
- Performance - Pre-built index loads once, instant search results
- SEO Friendly - Static generation compatible

Files Created/Modified:

- Added search index generation script
- Created SearchInput and SearchResults components
- Added /search page route
- Updated header navigation with search icon
- Modified build process to generate search index

The search functionality is now ready to use! The development server should be running, and you can test the search by:

1. Clicking the search icon in the header
2. Using the keyboard shortcut ⌘K
3. Navigating directly to /search

## NextJS Info

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Tailwindcss](https://tailwindcss.com/) - styling done through Tailwindcss.
