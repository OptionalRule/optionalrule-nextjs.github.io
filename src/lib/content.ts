import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { Post, PostMeta, Page, PostFrontmatter, PageFrontmatter, PaginatedPosts, TagPage } from './types';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const PAGES_DIR = path.join(process.cwd(), 'content', 'pages');
const POSTS_PER_PAGE = 10;

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

// Generate excerpt from content if not provided in frontmatter
function generateExcerpt(content: string, limit: number = 160): string {
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove markdown headers
    .replace(/\*{1,2}(.*?)\*{1,2}/g, '$1') // Remove bold/italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Remove code blocks
    .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
    .replace(/\n\s*\n/g, ' ') // Replace multiple newlines with space
    .trim();

  return plainText.length > limit 
    ? `${plainText.substring(0, limit).trim()}...`
    : plainText;
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
    // If there's an error reading the file, consider it a draft
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
    // If there's an error reading the file, consider it a draft
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
          // If there's an error reading the file, exclude it
          return false;
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
          // If there's an error reading the file, exclude it
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
  
  const frontmatter = data as PostFrontmatter;
  const slug = generatePostSlug(filename, frontmatter.slug);
  const readingTimeResult = readingTime(content);
  
  return {
    slug,
    title: frontmatter.title,
    date: frontmatter.date,
    excerpt: frontmatter.excerpt || generateExcerpt(content),
    tags: frontmatter.tags || [],
    featured_image: frontmatter.featured_image,
    readingTime: Math.ceil(readingTimeResult.minutes),
  };
}

// Get full post content
export function getPost(slug: string): Post | null {
  const files = getPostFiles();
  const filename = files.find(file => {
    const filePath = path.join(POSTS_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);
    const frontmatter = data as PostFrontmatter;
    const postSlug = generatePostSlug(file, frontmatter.slug);
    return postSlug === slug;
  });
  
  if (!filename) {
    return null;
  }

  const filePath = path.join(POSTS_DIR, filename);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  
  const frontmatter = data as PostFrontmatter;
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
    post.tags.forEach(tag => tags.add(tag));
  });
  
  return Array.from(tags).sort();
}

// Get posts by tag with pagination
export function getPostsByTag(tag: string, page: number = 1): TagPage {
  const allPosts = getAllPostsMeta();
  const tagPosts = allPosts.filter(post => 
    post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
  
  const totalPosts = tagPosts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const startIndex = (page - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const posts = tagPosts.slice(startIndex, endIndex);

  return {
    tag,
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
  
  const frontmatter = data as PageFrontmatter;
  
  return {
    slug: generateSlug(filename),
    title: frontmatter.title,
    description: frontmatter.description,
    content,
  };
}

// Get all page slugs
export function getAllPageSlugs(): string[] {
  const files = getPageFiles();
  return files.map(generateSlug);
}

// Generate post URL from date and slug
export function generatePostUrl(date: string, slug: string): string {
  const postDate = new Date(date);
  const year = postDate.getFullYear();
  const month = String(postDate.getMonth() + 1).padStart(2, '0');
  const day = String(postDate.getDate()).padStart(2, '0');
  
  return `/${year}/${month}/${day}/${slug}/`;
}