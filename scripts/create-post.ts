#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

// Types
interface PostFrontmatter {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  featured_image: string;
  draft: boolean;
  showToc: boolean;
}

interface PostData {
  title: string;
  slug: string;
  date: string;
  filename: string;
  filepath: string;
}

// Available featured images for random selection
const FEATURED_IMAGES = [
  '/images/optionalrule-escaping-fireball.webp',
  '/images/optionalrule-escaping-wound.webp',
  '/images/optionalrule-exploring-question.webp',
  '/images/optionalrule-exploring-encumbered.webp',
  '/images/optionalrule-exploring-monster.webp',
  '/images/optionalrule-exploring-wizard.webp'
];

// Function to randomly select a featured image
function getRandomFeaturedImage(): string {
  const randomIndex = Math.floor(Math.random() * FEATURED_IMAGES.length);
  return FEATURED_IMAGES[randomIndex];
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to create slug from title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Function to get current date in YYYY-MM-DD format
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to generate sample content
function generateSampleContent(title: string): string {
  return `# ${title}

Welcome to your new blog post! This is a sample introduction that you can replace with your actual content.

## Getting Started with Content

Here's a guide on how to use various Markdown features in your posts:

### Links

You can create links in several ways:

- **External links**: [Visit Next.js](https://nextjs.org)
- **Internal links**: [About page](/about)
- **Anchor links**: [Jump to conclusion](#conclusion)

### Images

Add images to your posts:

![Alt text for image](/images/optionalrule-escaping-fireball.png)

You can also add images with links:

[![Clickable image](/images/optionalrule-escaping-wound.png)](https://optionalrule.com)

### Code Blocks

Inline code: \`console.log('Hello World')\`

Code blocks with syntax highlighting:

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

### Lists

**Unordered lists:**
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

**Ordered lists:**
1. First step
2. Second step
3. Third step

### Emphasis

- **Bold text** for important information
- *Italic text* for emphasis
- ***Bold and italic*** for strong emphasis
- ~~Strikethrough~~ for removed content

### Blockquotes

> This is a blockquote. Use it to highlight important quotes or call attention to specific information.

### Tables

| Feature | Description | Status |
|---------|-------------|--------|
| Markdown | Full support | ✅ |
| Images | Supported | ✅ |
| Links | Internal & external | ✅ |
| Code | Syntax highlighting | ✅ |

### Headers

Use headers to organize your content:

# Main Title (H1)
## Section (H2)
### Subsection (H3)
#### Sub-subsection (H4)

## Conclusion

This is where you can wrap up your post with a summary or call to action.

Remember to:
- Replace this sample content with your actual content
- Update the frontmatter fields as needed
- Add appropriate tags for categorization
- Include relevant images in the \`/public/images/\` directory

Happy writing!
`;
}

// Function to generate frontmatter
function generateFrontmatter(data: PostData): string {
  const frontmatter: PostFrontmatter = {
    slug: data.slug,
    title: data.title,
    date: data.date,
    excerpt: "A brief description of your post that will appear in previews and summaries.",
    tags: ["tag1", "tag2", "tag3"],
    featured_image: getRandomFeaturedImage(),
    draft: false,
    showToc: false
  };

  return `---
slug: "${frontmatter.slug}"
title: "${frontmatter.title}"
date: "${frontmatter.date}"
excerpt: "${frontmatter.excerpt}"
tags: ${JSON.stringify(frontmatter.tags)}
featured_image: "${frontmatter.featured_image}"
draft: ${frontmatter.draft}
showToc: ${frontmatter.showToc}
---`;
}

// Function to prompt user for input
function promptUser(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Function to validate title
function validateTitle(title: string): boolean {
  return title.trim().length > 0;
}

// Function to check if user wants to overwrite existing file
async function confirmOverwrite(filename: string): Promise<boolean> {
  const response = await promptUser(`File "${filename}" exists. Overwrite? (y/N): `);
  return response.toLowerCase() === 'y' || response.toLowerCase() === 'yes';
}

// Function to create post data
function createPostData(title: string): PostData {
  const slug = createSlug(title);
  const date = getCurrentDate();
  const filename = `${date}-${slug}.mdx`;
  
  // Get the directory of the current script file (ES module equivalent of __dirname)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const filepath = path.join(__dirname, '..', 'content', 'posts', filename);

  return {
    title,
    slug,
    date,
    filename,
    filepath
  };
}

// Function to ensure directory exists
function ensureDirectoryExists(filepath: string): void {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Function to write post file
function writePostFile(filepath: string, content: string): void {
  fs.writeFileSync(filepath, content, 'utf8');
}

// Function to display success message
function displaySuccessMessage(data: PostData): void {
  console.log('\n✅ Post created successfully!');
  console.log(`📁 File: ${data.filepath}`);
  console.log(`🔗 Slug: ${data.slug}`);
  console.log(`📅 Date: ${data.date}`);
  console.log('\n📝 The post includes:');
  console.log('   - Proper frontmatter with all required fields');
  console.log('   - Randomly selected featured image from available options');
  console.log('   - Sample content with Markdown examples');
  console.log('   - Guide for links, images, code blocks, and more');
  console.log('\n💡 Next steps:');
  console.log('   1. Edit the frontmatter fields as needed');
  console.log('   2. Replace the sample content with your actual content');
  console.log('   3. Add appropriate tags and update the excerpt');
  console.log('   4. Change the featured image if desired (currently randomly selected)');
}

// Main function to create the post
async function createPost(): Promise<void> {
  try {
    // Get post title from user
    const title = await promptUser('Enter the title for your new post: ');

    if (!validateTitle(title)) {
      console.log('Title cannot be empty. Exiting...');
      return;
    }

    // Create post data
    const postData = createPostData(title);

    // Check if file already exists
    if (fs.existsSync(postData.filepath)) {
      console.log(`\n⚠️  Warning: A file with the name "${postData.filename}" already exists.`);
      const shouldOverwrite = await confirmOverwrite(postData.filename);
      
      if (!shouldOverwrite) {
        console.log('Post creation cancelled.');
        return;
      }
    }

    // Generate content
    const frontmatter = generateFrontmatter(postData);
    const content = generateSampleContent(postData.title);
    const fullContent = frontmatter + '\n\n' + content;

    // Ensure the posts directory exists
    ensureDirectoryExists(postData.filepath);

    // Write the file
    writePostFile(postData.filepath, fullContent);

    // Display success message
    displaySuccessMessage(postData);

  } catch (error) {
    console.error('❌ Error creating post:', error instanceof Error ? error.message : String(error));
  } finally {
    rl.close();
  }
}

// Run the script
createPost();

export { createPost, createSlug, getCurrentDate };
export type { PostData, PostFrontmatter };
