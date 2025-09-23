# Scripts

This directory contains utility scripts for the Next.js blog project.

## create-post.ts

A TypeScript command-line script to generate new blog posts with proper frontmatter and sample content. Built with full type safety and modern ES module syntax.

## snyk-outdated.ts

Runs `npm outdated` and executes `snyk test` against each dependency's wanted version to surface potential vulnerabilities before upgrading.

### Usage

```bash
npm run snyk_outdated
```

### Requirements

- Global [Snyk CLI](https://docs.snyk.io/snyk-cli/install-the-snyk-cli) installation (`npm install -g snyk`)
- An authenticated Snyk session (`snyk auth`)

### What it does

1. Calls `npm outdated` and prints the standard table output for quick inspection.
2. Parses the JSON output to identify the wanted version of each outdated dependency.
3. Runs `snyk test npm:<package>@<wanted>` sequentially and records any reported issues.
4. Summarises vulnerability counts by severity and highlights command failures (e.g., missing authentication).
5. Exits with a non-zero status if vulnerabilities are detected or if Snyk cannot complete the scan.

## import-jekyll-posts.ts

A TypeScript script to migrate Jekyll blog posts to NextJS MDX format. Converts Jekyll frontmatter to NextJS gray-matter fields and preserves post content. Generates properly formatted YAML frontmatter that's compatible with the gray-matter parser.

### Usage

```bash
# Using npm script (recommended)
npm run create-post

# Or run directly with ts-node
npx ts-node scripts/create-post.ts

### import-jekyll-posts.ts

```bash
# Using npm script (recommended)
npm run import-jekyll-posts

# Or run directly with ts-node
npx ts-node scripts/import-jekyll-posts.ts
```
```

### What it does

1. **Prompts for post title**: Asks you to enter a title for your new post
2. **Generates slug**: Automatically creates a URL-friendly slug from the title
3. **Sets current date**: Uses today's date in YYYY-MM-DD format
4. **Creates file**: Generates `YYYY-MM-DD-slug.mdx` in the `content/posts/` directory
5. **Adds frontmatter**: Includes all required fields with sensible defaults
6. **Provides sample content**: Includes a comprehensive guide on Markdown features

### import-jekyll-posts.ts

1. **Prompts for source directory**: Asks for the directory containing Jekyll posts
2. **Scans for markdown files**: Finds all `.md` files in the source directory
3. **Parses Jekyll frontmatter**: Extracts metadata from Jekyll YAML frontmatter
4. **Converts to NextJS format**: Maps Jekyll fields to NextJS gray-matter fields
5. **Preserves content**: Keeps the original post content intact
6. **Generates MDX files**: Creates properly formatted NextJS posts

### Generated frontmatter

The script creates posts with this frontmatter structure:

```yaml
---
slug: "your-post-slug"
title: "Your Post Title"
date: "2024-12-19"
excerpt: "A brief description of your post that will appear in previews and summaries."
tags: ["tag1", "tag2", "tag3"]
featured_image: "/images/default-featured.jpg"
draft: true
showToc: true
---
```

### Sample content includes

- **Links**: External, internal, and anchor links
- **Images**: Basic images and clickable images
- **Code blocks**: Inline code and syntax-highlighted blocks
- **Lists**: Ordered and unordered lists with nesting
- **Emphasis**: Bold, italic, and strikethrough text
- **Blockquotes**: Highlighted quote sections
- **Tables**: Markdown table examples
- **Headers**: All heading levels (H1-H4)

### Jekyll to NextJS Field Mapping

The import script maps Jekyll frontmatter fields to NextJS fields as follows:

| Jekyll Field | NextJS Field | Notes |
|--------------|--------------|-------|
| `title` | `title` | Direct mapping |
| `date` | `date` | YYYY-MM-DD portion only |
| `description` | `excerpt` | Primary source |
| `summary` | `excerpt` | Fallback if description missing |
| `tags` | `tags` | Direct mapping |
| `categories` | `tags` | Fallback if tags missing |
| `image` | `featured_image` | Direct mapping |
| - | `featured_image` | Defaults to `/images/or_logo.png` |
| - | `slug` | Extracted from filename |
| - | `draft` | Always set to `false` |
| - | `showToc` | Always set to `false` |

### YAML Frontmatter Format

The script generates properly formatted YAML frontmatter that's compatible with the gray-matter parser:

- **Empty tags**: `tags: []` (proper YAML array format)
- **Populated tags**: Uses explicit YAML list format with `-` items
- **All strings**: Properly quoted to avoid parsing issues
- **Booleans**: Unquoted for proper YAML interpretation

### Features

- **TypeScript support**: Full type safety with interfaces for post data and frontmatter
- **Smart slug generation**: Converts titles to URL-friendly slugs
- **File conflict handling**: Warns if a file already exists and offers to overwrite
- **Directory creation**: Automatically creates the posts directory if it doesn't exist
- **Comprehensive guide**: Sample content serves as a reference for Markdown features
- **Error handling**: Graceful error handling with helpful messages
- **Modern ES modules**: Uses modern JavaScript/TypeScript syntax

### import-jekyll-posts.ts Features

- **Jekyll frontmatter parsing**: Handles YAML frontmatter with fallback parsing
- **Smart field mapping**: Maps Jekyll fields to NextJS format with fallbacks
- **Filename parsing**: Extracts slug and date from Jekyll filename pattern
- **Content preservation**: Keeps original post content intact
- **Batch processing**: Processes multiple files in one run
- **Conflict detection**: Skips files that already exist
- **Progress reporting**: Shows conversion progress and results
- **Error handling**: Gracefully handles parsing errors and continues processing

### Example output

```bash
$ npm run create-post

Enter the title for your new post: My Amazing Blog Post

✅ Post created successfully!
📁 File: /path/to/content/posts/2024-12-19-my-amazing-blog-post.mdx
🔗 Slug: my-amazing-blog-post
📅 Date: 2024-12-19

📝 The post includes:
   - Proper frontmatter with all required fields
   - Sample content with Markdown examples
   - Guide for links, images, code blocks, and more

💡 Next steps:
   1. Edit the frontmatter fields as needed
   2. Replace the sample content with your actual content
   3. Add appropriate tags and update the excerpt
   4. Add a featured image to /public/images/
```

### import-jekyll-posts.ts Example

```bash
$ npm run import-jekyll-posts

🚀 Jekyll to NextJS Post Migration Script

Enter the source directory containing Jekyll posts: /path/to/jekyll/_posts
Enter output directory (default: /path/to/content/posts): 

📁 Scanning directory: /path/to/jekyll/_posts
📁 Output directory: /path/to/content/posts

📝 Found 15 markdown files to process.

Processing: 2024-01-15-getting-started-with-nextjs.md
  ✅ Converted: 2024-01-15-getting-started-with-nextjs.mdx
Processing: 2024-02-03-mastering-typescript.md
  ✅ Converted: 2024-02-03-mastering-typescript.mdx

📊 Migration Results:
✅ Successfully converted: 15
❌ Failed: 0

🎉 Migration completed! 15 posts imported to /path/to/content/posts

💡 Next steps:
   1. Review the imported posts
   2. Update frontmatter fields as needed
   3. Verify tags and excerpts
   4. Check featured images
```

### Customization

You can modify the script to:
- Change default frontmatter values
- Add new frontmatter fields
- Modify the sample content template
- Change the file naming convention
- Add validation for specific fields

### Requirements

- Node.js
- TypeScript support (ts-node is included as a dev dependency)
- Write access to the `content/posts/` directory

### Configuration

The script uses a dedicated `tsconfig.json` and `package.json` in the scripts directory to ensure proper ES module handling and eliminate TypeScript warnings.
