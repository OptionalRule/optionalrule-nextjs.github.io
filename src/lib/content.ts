import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { z } from 'zod';
import { Post, PostMeta, Page, PostFrontmatter, PageFrontmatter, PaginatedPosts, TagPage } from './types';
import { extractHeadings, tagSlugToName, generateExcerpt } from './utils';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const PAGES_DIR = path.join(process.cwd(), 'content', 'pages');
const POSTS_PER_PAGE = 10;

export const PostFrontmatterSchema = z.object({
  title: z.string(),
  date: z.string(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured_image: z.string().optional(),
  slug: z.string().optional(),
  draft: z.boolean().optional(),
  showToc: z.boolean().optional(),
});

export const PageFrontmatterSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  draft: z.boolean().optional(),
  showToc: z.boolean().optional(),
});

// Generate slug from filename
function generateSlug(filename: string): string {
  return filename.replace(/\.mdx?$/, '');
}

// Generate slug with fallback logic
function generatePostSlug(filename: string, customSlug?: string): string {
  // Use custom slug from frontmatter if provided and not empty
  if (customSlug && customSlug.trim() !== '') {
    return customSlug.trim();
  }
  
  // Fall back to filename-based slug
  return generateSlug(filename);
}


// Check if a post is a draft
export function isPostDraft(filename: string): boolean {
  try {
    const filePath = path.join(POSTS_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);
    const frontmatter = data as PostFrontmatter;
    
    return frontmatter.draft === true;
  } catch (error) {
    console.warn(`Warning: Error reading post ${filename} for draft check, treating as draft:`, error);
    return true;
  }
}

// Check if a page is a draft
export function isPageDraft(filename: string): boolean {
  try {
    const filePath = path.join(PAGES_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);
    const frontmatter = data as PageFrontmatter;
    
    return frontmatter.draft === true;
  } catch (error) {
    console.warn(`Warning: Error reading page ${filename} for draft check, treating as draft:`, error);
    return true;
  }
}

// Get all post files including drafts
export function getAllPostFiles(): string[] {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }
  return fs.readdirSync(POSTS_DIR)
    .filter(file => /\.mdx?$/.test(file))
    .sort((a, b) => b.localeCompare(a)); // Sort by filename desc (newest first)
}

// Get all post files
export function getPostFiles(): string[] {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }
  return fs.readdirSync(POSTS_DIR)
    .filter(file => /\.mdx?$/.test(file))
    .filter(file => {
      // Filter out draft posts during static builds
      if (process.env.NODE_ENV === 'production') {
        try {
          const filePath = path.join(POSTS_DIR, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const { data } = matter(fileContent);
          const frontmatter = data as PostFrontmatter;
          
          // Only include posts where draft is explicitly false or undefined
          return frontmatter.draft !== true;
        } catch (error) {
          // If there's an error reading the file, log it but include the post
          // This prevents posts from being silently excluded due to parsing errors
          console.warn(`Warning: Error reading post ${file}, including it anyway:`, error);
          return true;
        }
      }
      // In development, include all posts
      return true;
    })
    .sort((a, b) => b.localeCompare(a)); // Sort by filename desc (newest first)
}

// Get all page files including drafts
export function getAllPageFiles(): string[] {
  if (!fs.existsSync(PAGES_DIR)) {
    return [];
  }
  return fs.readdirSync(PAGES_DIR)
    .filter(file => /\.mdx?$/.test(file));
}

// Get all page files
export function getPageFiles(): string[] {
  if (!fs.existsSync(PAGES_DIR)) {
    return [];
  }
  return fs.readdirSync(PAGES_DIR)
    .filter(file => /\.mdx?$/.test(file))
    .filter(file => {
      // Filter out draft pages during static builds
      if (process.env.NODE_ENV === 'production') {
        try {
          const filePath = path.join(PAGES_DIR, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const { data } = matter(fileContent);
          const frontmatter = data as PageFrontmatter;
          
          // Only include pages where draft is explicitly false or undefined
          return frontmatter.draft !== true;
        } catch (error) {
          console.warn(`Warning: Error reading page ${file} for filtering, excluding from build:`, error);
          return false;
        }
      }
      // In development, include all pages
      return true;
    });
}

// Get post metadata only (for listings)
export function getPostMeta(filename: string): PostMeta {
  const filePath = path.join(POSTS_DIR, filename);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);

  const frontmatter: PostFrontmatter = PostFrontmatterSchema.parse(data);
  const slug = generatePostSlug(filename, frontmatter.slug);
  const readingTimeResult = readingTime(content);
  const headings = extractHeadings(content);
  
  return {
    slug,
    title: frontmatter.title,
    date: frontmatter.date,
    excerpt: frontmatter.excerpt || generateExcerpt(content),
    tags: frontmatter.tags || [],
    featured_image: frontmatter.featured_image,
    readingTime: Math.ceil(readingTimeResult.minutes),
    showToc: frontmatter.showToc,
    headings,
  };
}

// Get full post content
export function getPost(slug: string): Post | null {
  const files = getPostFiles();
    const filename = files.find(file => {
      const filePath = path.join(POSTS_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContent);
      const frontmatter: PostFrontmatter = PostFrontmatterSchema.parse(data);
      const postSlug = generatePostSlug(file, frontmatter.slug);
      return postSlug === slug;
    });
  
  if (!filename) {
    return null;
  }

  const filePath = path.join(POSTS_DIR, filename);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  const frontmatter: PostFrontmatter = PostFrontmatterSchema.parse(data);
  const postSlug = generatePostSlug(filename, frontmatter.slug);
  const readingTimeResult = readingTime(content);
  
  return {
    slug: postSlug,
    title: frontmatter.title,
    date: frontmatter.date,
    excerpt: frontmatter.excerpt || generateExcerpt(content),
    tags: frontmatter.tags || [],
    featured_image: frontmatter.featured_image,
    content,
    readingTime: Math.ceil(readingTimeResult.minutes),
    showToc: frontmatter.showToc,
    headings: extractHeadings(content),
  };
}

// Get all post metadata including drafts
export function getAllPostsMetaWithDrafts(): PostMeta[] {
  const files = getAllPostFiles();
  return files.map(getPostMeta);
}

// Get all post metadata
export function getAllPostsMeta(): PostMeta[] {
  const files = getPostFiles();
  return files.map(getPostMeta);
}

// Get paginated posts
export function getPaginatedPosts(page: number = 1): PaginatedPosts {
  const allPosts = getAllPostsMeta();
  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const startIndex = (page - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const posts = allPosts.slice(startIndex, endIndex);

  return {
    posts,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// Get all unique tags
export function getAllTags(): string[] {
  const allPosts = getAllPostsMeta();
  const tags = new Set<string>();
  
  allPosts.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => tags.add(tag));
    }
  });
  
  return Array.from(tags).sort();
}

// Get posts by tag with pagination (accepts slug or tag name)
export function getPostsByTag(tagSlugOrName: string, page: number = 1): TagPage {
  const allPosts = getAllPostsMeta();
  
  // Convert slug to tag name for comparison
  const tagName = tagSlugOrName.includes('-') ? tagSlugToName(tagSlugOrName) : tagSlugOrName;
  
  const tagPosts = allPosts.filter(post => 
    post.tags && post.tags.some(t => t.toLowerCase() === tagName.toLowerCase())
  );
  
  const totalPosts = tagPosts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const startIndex = (page - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const posts = tagPosts.slice(startIndex, endIndex);

  return {
    tag: tagName, // Return the actual tag name, not the slug
    posts,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// Get page content
export function getPage(slug: string): Page | null {
  const files = getPageFiles();
  const filename = files.find(file => generateSlug(file) === slug);
  
  if (!filename) {
    return null;
  }

  const filePath = path.join(PAGES_DIR, filename);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  const frontmatter: PageFrontmatter = PageFrontmatterSchema.parse(data);

  return {
    slug: generateSlug(filename),
    title: frontmatter.title,
    description: frontmatter.description,
    content,
    showToc: frontmatter.showToc,
    headings: extractHeadings(content),
  };
}

// Get all page slugs
export function getAllPageSlugs(): string[] {
  const files = getPageFiles();
  return files.map(generateSlug);
}