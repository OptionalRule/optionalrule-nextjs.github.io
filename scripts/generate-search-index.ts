#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { PostFrontmatterSchema } from '../src/lib/content';
import { generateExcerpt } from '../src/lib/utils';

interface SearchIndexItem {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  content: string;
  date: string;
  readingTime: number;
}

// Generate slug from filename
function generateSlug(filename: string): string {
  return filename.replace(/\.mdx?$/, '');
}

// Generate slug with fallback logic
function generatePostSlug(filename: string, customSlug?: string): string {
  if (customSlug && customSlug.trim() !== '') {
    return customSlug.trim();
  }
  return generateSlug(filename);
}


function buildSearchIndex(): SearchIndexItem[] {
  const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
  
  if (!fs.existsSync(POSTS_DIR)) {
    console.warn('Posts directory not found:', POSTS_DIR);
    return [];
  }

  const files = fs.readdirSync(POSTS_DIR)
    .filter(file => /\.mdx?$/.test(file))
    .filter(file => {
      // Filter out draft posts from search index
      try {
        const filePath = path.join(POSTS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContent);
        const frontmatter = PostFrontmatterSchema.parse(data);
        return frontmatter.draft !== true;
      } catch (error) {
        console.warn(`Warning: Error reading post ${file}, excluding from search index:`, error);
        return false;
      }
    })
    .sort((a, b) => b.localeCompare(a));

  return files.map(filename => {
    const filePath = path.join(POSTS_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    const frontmatter = PostFrontmatterSchema.parse(data);
    const slug = generatePostSlug(filename, frontmatter.slug);
    const readingTimeResult = readingTime(content);
    
    return {
      slug,
      title: frontmatter.title,
      excerpt: frontmatter.excerpt || generateExcerpt(content),
      tags: frontmatter.tags || [],
      content: '', // We don't need full content for search, just title/excerpt/tags
      date: frontmatter.date,
      readingTime: Math.ceil(readingTimeResult.minutes),
    };
  });
}

function generateSearchIndexFile(): void {
  console.log('Generating search index...');
  
  const searchIndex = buildSearchIndex();
  const outputPath = path.join(process.cwd(), 'public', 'search-index.json');
  
  // Ensure public directory exists
  const publicDir = path.dirname(outputPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(searchIndex, null, 2));
  console.log(`✅ Search index generated: ${outputPath} (${searchIndex.length} posts)`);
}

// Run the script
try {
  generateSearchIndexFile();
} catch (error) {
  console.error('❌ Failed to generate search index:', error);
  process.exit(1);
}