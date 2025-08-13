#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

// Types
interface JekyllFrontmatter {
  title?: string;
  author?: string;
  layout?: string;
  image?: string;
  description?: string;
  date?: string;
  subtitle?: string;
  summary?: string;
}

interface NextJSFrontmatter {
  slug: string;
  title: string;
  date: string;
  excerpt: string | null;
  featured_image: string;
  draft: boolean;
  showToc: boolean;
}

interface JekyllPost {
  filename: string;
  slug: string;
  date: string;
  content: string;
  frontmatter: JekyllFrontmatter;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function promptUser(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Function to extract slug from filename
function extractSlugFromFilename(filename: string): string {
  // Remove .md extension and extract slug part after date
  const withoutExtension = filename.replace(/\.md$/, '');
  const parts = withoutExtension.split('-');
  
  // Skip first 3 parts (YYYY-MM-DD) and join the rest as slug
  if (parts.length >= 4) {
    return parts.slice(3).join('-');
  }
  
  return withoutExtension;
}

// Function to extract date from filename
function extractDateFromFilename(filename: string): string {
  // Extract YYYY-MM-DD from filename
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  
  // Fallback to current date if no date found
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to parse Jekyll frontmatter
function parseJekyllFrontmatter(content: string): { frontmatter: JekyllFrontmatter; content: string } {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  
  if (!frontmatterMatch) {
    return { frontmatter: {}, content };
  }
  
  const frontmatterText = frontmatterMatch[1];
  const postContent = frontmatterMatch[2];
  
  try {
    // Simple YAML parsing for basic key-value pairs
    const frontmatter: JekyllFrontmatter = {};
    const lines = frontmatterText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmedLine.substring(0, colonIndex).trim();
          let value = trimmedLine.substring(colonIndex + 1).trim();
          
          // Handle quoted strings
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          // Handle arrays (simple case)
          if (value.startsWith('[') && value.endsWith(']')) {
            const arrayContent = value.slice(1, -1);
            if (arrayContent.trim()) {
              (frontmatter as any)[key] = arrayContent.split(',').map(item => item.trim().replace(/['"]/g, ''));
            } else {
              (frontmatter as any)[key] = [];
            }
          } else {
            (frontmatter as any)[key] = value;
          }
        }
      }
    }
    
    return { frontmatter, content: postContent };
  } catch (error) {
    console.warn(`Warning: Could not parse frontmatter for file, using empty frontmatter`);
    return { frontmatter: {}, content };
  }
}

// Function to convert Jekyll frontmatter to NextJS frontmatter
function convertFrontmatter(jekyll: JekyllFrontmatter, slug: string, date: string): NextJSFrontmatter {
  // Extract date portion only (remove timestamp if present)
  const dateOnly = date.split('T')[0].split(' ')[0];
  
  // Determine excerpt (description > summary > null)
  let excerpt: string | null = null;
  if (jekyll.description && typeof jekyll.description === 'string' && jekyll.description.trim() !== '') {
    excerpt = jekyll.description.trim();
  } else if (jekyll.summary && typeof jekyll.summary === 'string' && jekyll.summary.trim() !== '') {
    excerpt = jekyll.summary.trim();
  }
  
  // Clean up quotes from excerpt
  if (excerpt) {
    excerpt = excerpt.replace(/"/g, '').replace(/'/g, '');
  }
  
  // Determine featured image
  let featured_image = jekyll.image || '/images/or_logo.png';
  if (typeof featured_image !== 'string' || featured_image.trim() === '') {
    featured_image = '/images/or_logo.png';
  } else {
    featured_image = featured_image.trim();
    // Fix paths from /assets/images/* to /images/*
    if (featured_image.startsWith('/assets/images/')) {
      featured_image = featured_image.replace('/assets/images/', '/images/');
    }
    // Fix paths from /assets/img/* to /images/*
    if (featured_image.startsWith('/assets/img/')) {
      featured_image = featured_image.replace('/assets/img/', '/images/');
    }
  }
  
  // Ensure title is always valid
  let title = jekyll.title;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  } else {
    title = title.trim();
  }
  
  return {
    slug,
    title,
    date: dateOnly,
    excerpt,
    featured_image,
    draft: false,
    showToc: false
  };
}

// Function to generate NextJS frontmatter string
function generateNextJSFrontmatter(frontmatter: NextJSFrontmatter): string {
  const excerptValue = frontmatter.excerpt ? `"${frontmatter.excerpt}"` : 'null';
  
  return `---
slug: "${frontmatter.slug}"
title: "${frontmatter.title}"
date: "${frontmatter.date}"
excerpt: ${excerptValue}
featured_image: "${frontmatter.featured_image}"
draft: ${frontmatter.draft}
showToc: ${frontmatter.showToc}
---`;
}

// Function to convert Jekyll Liquid syntax to MDX-compatible content
function convertLiquidToMDX(content: string): string {
  let convertedContent = content;
  
  // Convert link attributes: [text](url){:target="_blank"} -> <a href="url" target="_blank">text</a>
  convertedContent = convertedContent.replace(
    /\[([^\]]+)\]\(([^)]+)\)\{:([^}]+)\}/g,
    (match, text, url, attributes) => {
      const attrPairs = attributes.split(' ').map((attr: string) => attr.trim());
      const attrString = attrPairs.map((attr: string) => {
        if (attr.includes('=')) {
          return attr;
        } else {
          return `${attr}="${attr}"`;
        }
      }).join(' ');
      return `<a href="${url}" ${attrString}>${text}</a>`;
    }
  );
  
  // Convert link attributes: [text](url target="_blank") -> <a href="url" target="_blank">text</a>
  convertedContent = convertedContent.replace(
    /\[([^\]]+)\]\(([^)]+)\s+([^)]+)\)/g,
    (match, text, url, attributes) => {
      // Check if the attributes part contains actual attributes (not just URL)
      if (attributes.includes('=') || attributes.includes('target') || attributes.includes('rel')) {
        const attrPairs = attributes.split(' ').map((attr: string) => attr.trim());
        const attrString = attrPairs.map((attr: string) => {
          if (attr.includes('=')) {
            return attr;
          } else if (attr === 'target="_blank"' || attr === 'target=\'_blank\'') {
            return 'target="_blank"';
          } else if (attr === 'rel="noopener"' || attr === 'rel=\'noopener\'') {
            return 'rel="noopener"';
          } else {
            return `${attr}="${attr}"`;
          }
        }).join(' ');
        return `<a href="${url}" ${attrString}>${text}</a>`;
      }
      // If it's just a URL with spaces, treat it as a regular markdown link
      return match;
    }
  );
  
  // Convert image includes: {% include imageframe.html ... %} -> <img src="..." alt="..." />
  convertedContent = convertedContent.replace(
    /{%\s*include\s+imageframe\.html\s*([^%]*)%}/g,
    (match, attributes) => {
      // Parse the attributes
      const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/);
      const altMatch = attributes.match(/alt\s*=\s*["']([^"']+)["']/);
      const widthMatch = attributes.match(/width\s*=\s*["']([^"']+)["']/);
      const heightMatch = attributes.match(/height\s*=\s*["']([^"']+)["']/);
      
      if (srcMatch) {
        let src = srcMatch[1];
        // Convert /assets/img/ to /images/
        if (src.startsWith('/assets/img/')) {
          src = src.replace('/assets/img/', '/images/');
        }
        
        let imgTag = `<img src="${src}"`;
        if (altMatch) {
          imgTag += ` alt="${altMatch[1]}"`;
        }
        if (widthMatch) {
          imgTag += ` width="${widthMatch[1]}"`;
        }
        if (heightMatch) {
          imgTag += ` height="${heightMatch[1]}"`;
        }
        imgTag += ' />';
        return imgTag;
      }
      
      // If we can't parse it properly, return a comment for manual review
      return `<!-- Could not convert image include: ${match} -->`;
    }
  );
  
  // Global path conversion: /assets/img/ -> /images/
  convertedContent = convertedContent.replace(/\/assets\/img\//g, '/images/');
  
  return convertedContent;
}

// Function to read and parse Jekyll post file
function readJekyllPost(filepath: string): JekyllPost | null {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const filename = path.basename(filepath);
    const slug = extractSlugFromFilename(filename);
    const date = extractDateFromFilename(filename);
    
    const { frontmatter, content: postContent } = parseJekyllFrontmatter(content);
    
    // Convert Liquid syntax to MDX-compatible content
    const convertedContent = convertLiquidToMDX(postContent);
    
    return {
      filename,
      slug,
      date,
      content: convertedContent,
      frontmatter
    };
  } catch (error) {
    console.error(`Error reading file ${filepath}:`, error);
    return null;
  }
}

// Function to write NextJS post file
function writeNextJSPost(post: JekyllPost, nextJSFrontmatter: NextJSFrontmatter, outputDir: string): boolean {
  try {
    const filename = `${nextJSFrontmatter.date}-${nextJSFrontmatter.slug}.mdx`;
    const filepath = path.join(outputDir, filename);
    
    // Check if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`⚠️  Warning: File ${filename} already exists, skipping...`);
      return false;
    }
    
    const fullContent = generateNextJSFrontmatter(nextJSFrontmatter) + '\n\n' + post.content;
    fs.writeFileSync(filepath, fullContent, 'utf8');
    
    return true;
  } catch (error) {
    console.error(`Error writing file ${nextJSFrontmatter.date}-${nextJSFrontmatter.slug}.mdx:`, error);
    return false;
  }
}

// Function to get all markdown files from directory
function getMarkdownFiles(dir: string): string[] {
  try {
    const files = fs.readdirSync(dir);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => path.join(dir, file));
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

// Function to ensure output directory exists
function ensureOutputDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Main import function
async function importJekyllPosts(): Promise<void> {
  try {
    console.log('🚀 Jekyll to NextJS Post Migration Script\n');
    
    // Get source directory from user
    const sourceDir = await promptUser('Enter the source directory containing Jekyll posts: ');
    
    if (!sourceDir.trim()) {
      console.log('❌ Source directory cannot be empty. Exiting...');
      return;
    }
    
    if (!fs.existsSync(sourceDir)) {
      console.log(`❌ Directory "${sourceDir}" does not exist. Exiting...`);
      return;
    }
    
    // Get output directory (default to content/posts)
    const defaultOutputDir = path.join(process.cwd(), 'content', 'posts');
    const outputDirInput = await promptUser(`Enter output directory (default: ${defaultOutputDir}): `);
    const outputDir = outputDirInput.trim() || defaultOutputDir;
    
    // Ensure output directory exists
    ensureOutputDirectory(outputDir);
    
    console.log(`\n📁 Scanning directory: ${sourceDir}`);
    console.log(`📁 Output directory: ${outputDir}\n`);
    
    // Get all markdown files
    const markdownFiles = getMarkdownFiles(sourceDir);
    
    if (markdownFiles.length === 0) {
      console.log('❌ No markdown files found in the source directory.');
      return;
    }
    
    console.log(`📝 Found ${markdownFiles.length} markdown files to process.\n`);
    
    // Process each file
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const filepath of markdownFiles) {
      console.log(`Processing: ${path.basename(filepath)}`);
      
      const post = readJekyllPost(filepath);
      if (!post) {
        result.failed++;
        result.errors.push(`Failed to read: ${path.basename(filepath)}`);
        continue;
      }
      
      const nextJSFrontmatter = convertFrontmatter(post.frontmatter, post.slug, post.date);
      
      if (writeNextJSPost(post, nextJSFrontmatter, outputDir)) {
        result.success++;
        console.log(`  ✅ Converted: ${nextJSFrontmatter.date}-${nextJSFrontmatter.slug}.mdx`);
        console.log(`  🔄 Applied Liquid-to-MDX conversions`);
      } else {
        result.failed++;
      }
    }
    
    // Display results
    console.log('\n📊 Migration Results:');
    console.log(`✅ Successfully converted: ${result.success}`);
    console.log(`❌ Failed: ${result.failed}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (result.success > 0) {
      console.log(`\n🎉 Migration completed! ${result.success} posts imported to ${outputDir}`);
      console.log('\n💡 Next steps:');
      console.log('   1. Review the imported posts');
      console.log('   2. Update frontmatter fields as needed');
      console.log('   3. Verify excerpts');
      console.log('   4. Check featured images');
    }
    
  } catch (error) {
    console.error('❌ Error during migration:', error instanceof Error ? error.message : String(error));
  } finally {
    rl.close();
  }
}

// Run the script
importJekyllPosts();

export { importJekyllPosts, convertFrontmatter, parseJekyllFrontmatter, convertLiquidToMDX };
export type { JekyllFrontmatter, NextJSFrontmatter, JekyllPost };
