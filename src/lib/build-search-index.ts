import fs from 'fs';
import path from 'path';
import { getAllPostsMeta } from './content';

export interface SearchIndexItem {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  content: string;
  date: string;
  readingTime: number;
}

// Strip markdown and HTML from content for search indexing
function stripMarkdown(content: string): string {
  return content
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    // Remove headers
    .replace(/#{1,6}\s+/g, '')
    // Remove links but keep text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Remove bold/italic
    .replace(/\*{1,2}([^*]*)\*{1,2}/g, '$1')
    .replace(/_{1,2}([^_]*)_{1,2}/g, '$1')
    // Remove lists
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up whitespace
    .replace(/\n\s*\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSearchIndex(): SearchIndexItem[] {
  const posts = getAllPostsMeta();
  
  return posts.map(post => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '',
    tags: post.tags || [],
    content: '', // We'll populate this from the full content later if needed
    date: post.date,
    readingTime: post.readingTime,
  }));
}

export function generateSearchIndexFile(): void {
  const searchIndex = buildSearchIndex();
  const outputPath = path.join(process.cwd(), 'public', 'search-index.json');
  
  // Ensure public directory exists
  const publicDir = path.dirname(outputPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(searchIndex, null, 2));
  console.log(`Search index generated: ${outputPath} (${searchIndex.length} posts)`);
}