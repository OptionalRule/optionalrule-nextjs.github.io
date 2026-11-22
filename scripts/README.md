# Scripts

This directory contains utility scripts for the Next.js blog project.

## create-post.ts

A TypeScript command-line script to generate new blog posts with proper frontmatter and sample content. Built with full type safety and modern ES module syntax.

### Usage

```bash
# Using npm script (recommended)
npm run create-post

# Or run directly
node --import tsx/esm scripts/create-post.ts
```

### What it does

1. **Prompts for post title**: Asks you to enter a title for your new post
2. **Generates slug**: Automatically creates a URL-friendly slug from the title
3. **Sets current date**: Uses today's date in YYYY-MM-DD format
4. **Creates file**: Generates `YYYY-MM-DD-slug.mdx` in the `content/posts/` directory
5. **Adds frontmatter**: Includes all required fields with sensible defaults
6. **Provides sample content**: Includes a comprehensive guide on Markdown features

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

### Customization

You can modify the script to:
- Change default frontmatter values
- Add new frontmatter fields
- Modify the sample content template
- Change the file naming convention
- Add validation for specific fields

### Requirements

- Node.js
- TypeScript support through `tsx` (a dev dependency): run scripts with `node --import tsx/esm`
- Write access to the `content/posts/` directory

### Configuration

Scripts are type-checked by the root `tsconfig.json` (`npm run typecheck`). `scripts/package.json` marks the directory as ES modules.
