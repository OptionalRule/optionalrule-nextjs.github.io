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
  validationErrors: string[];
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
    
    frontmatterText.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        if (key && value) {
          (frontmatter as any)[key] = value;
        }
      }
    });
    
    return { frontmatter, content: postContent };
  } catch (error) {
    console.warn('Warning: Could not parse frontmatter, using empty object');
    return { frontmatter: {}, content: postContent };
  }
}

// Function to find an image in the public/images directories
function findImageInPublicDir(imageName: string): string | null {
  const publicImagesDir = path.join(process.cwd(), 'public', 'images');
  const thirdPartyDir = path.join(publicImagesDir, 'third_party');
  
  // Try to find the image in main images directory
  const mainImagePath = path.join(publicImagesDir, imageName);
  if (fs.existsSync(mainImagePath)) {
    return `/images/${imageName}`;
  }
  
  // Try to find the image in third_party directory
  const thirdPartyImagePath = path.join(thirdPartyDir, imageName);
  if (fs.existsSync(thirdPartyImagePath)) {
    return `/images/third_party/${imageName}`;
  }
  
  return null;
}

// Function to get a random fallback image
function getRandomFallbackImage(): string {
  const fallbackImages = [
    '/images/optionalrule-escaping-fireball.png',
    '/images/optionalrule-escaping-wound.png',
    '/images/OR_Screenshot-870x570.jpg'
  ];
  
  const randomIndex = Math.floor(Math.random() * fallbackImages.length);
  return fallbackImages[randomIndex];
}

// Function to clean excerpt text for YAML frontmatter
function cleanExcerptText(text: string | null): string | null {
  if (!text) return null;
  
  // Remove quotes and other problematic characters that could break YAML
  let cleaned = text
    .replace(/["']/g, '') // Remove single and double quotes
    .replace(/&quot;/g, '') // Remove HTML quote entities
    .replace(/&#34;/g, '') // Remove HTML quote entities
    .replace(/&#39;/g, '') // Remove HTML apostrophe entities
    .trim();
  
  // If the text is now empty after cleaning, return null
  return cleaned.length > 0 ? cleaned : null;
}

// Function to convert Jekyll frontmatter to NextJS format
function convertFrontmatter(jekyll: JekyllFrontmatter, slug: string, date: string): NextJSFrontmatter {
  let featuredImage = '/images/default-featured.jpg';
  
  if (jekyll.image) {
    // Extract just the filename from various path formats
    let imageName = '';
    
    if (jekyll.image.startsWith('/assets/img/')) {
      // Convert /assets/img/filename.jpg to filename.jpg
      imageName = jekyll.image.replace('/assets/img/', '');
    } else if (jekyll.image.startsWith('http://') || jekyll.image.startsWith('https://')) {
      // Extract filename from external URL
      try {
        const url = new URL(jekyll.image);
        const pathParts = url.pathname.split('/');
        imageName = pathParts[pathParts.length - 1] || 'external-image.jpg';
      } catch (error) {
        imageName = 'external-image.jpg';
      }
    } else if (jekyll.image.startsWith('/images/')) {
      // Already in correct format, extract filename
      imageName = jekyll.image.replace('/images/', '');
    } else if (jekyll.image.startsWith('/')) {
      // Remove leading slash and use as filename
      imageName = jekyll.image.substring(1);
    } else {
      // Assume it's already a filename
      imageName = jekyll.image;
    }
    
    // Try to find the image in public/images directories
    const foundImage = findImageInPublicDir(imageName);
    if (foundImage) {
      featuredImage = foundImage;
      console.log(`    🖼️  Found image: ${imageName} -> ${foundImage}`);
    } else {
      // Use random fallback if image not found
      featuredImage = getRandomFallbackImage();
      console.log(`    ⚠️  Image not found: ${imageName}, using fallback: ${featuredImage}`);
    }
  }
  
  return {
    slug,
    title: jekyll.title || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    date,
    excerpt: cleanExcerptText(jekyll.description || jekyll.summary || jekyll.subtitle || null),
    featured_image: featuredImage,
    draft: false,
    showToc: false
  };
}

// Enhanced content conversion function that handles ALL the issues we've seen
function convertLiquidToMDX(content: string): string {
  let convertedContent = content;
  
  // Log conversion for debugging
  function logConversion(type: string, original: string, replacement: string) {
    if (original !== replacement) {
      console.log(`    🔄 ${type}: ${original.substring(0, 50)}... → ${replacement.substring(0, 50)}...`);
    }
  }

  // 1. Convert Jekyll Liquid {% include quote.html %} tags to blockquotes
  convertedContent = convertedContent.replace(
    /\{%\s*include\s+quote\.html\s+author\s*=\s*["']([^"']+)["']\s+source\s*=\s*["']([^"']+)["']\s*%\}/g,
    (match, author, source) => {
      const blockquote = `> **${author}**\n> *${source}*`;
      logConversion('quote include (author + source)', match, blockquote);
      return blockquote;
    }
  );

  convertedContent = convertedContent.replace(
    /\{%\s*include\s+quote\.html\s+author\s*=\s*["']([^"']+)["']\s*%\}/g,
    (match, author) => {
      const blockquote = `> **${author}**`;
      logConversion('quote include (author only)', match, blockquote);
      return blockquote;
    }
  );

  convertedContent = convertedContent.replace(
    /\{%\s*include\s+quote\.html\s*%\}/g,
    (match) => {
      const blockquote = `> *Quote*`;
      logConversion('quote include (no params)', match, blockquote);
      return blockquote;
    }
  );

  // 2. Convert iframe embeds to MediaEmbed components
  convertedContent = convertedContent.replace(
    /<iframe\s+src\s*=\s*["']([^"']+)["']([^>]*)>/g,
    (match, src, otherAttributes) => {
      // Extract title from other attributes if present
      const titleMatch = otherAttributes.match(/title\s*=\s*["']([^"']+)["']/);
      const title = titleMatch ? titleMatch[1] : 'Embedded content';
      
      // Check if it's a YouTube embed
      if (src.includes('youtube.com/embed/')) {
        const videoId = src.match(/youtube\.com\/embed\/([^&\n?#]+)/)?.[1];
        if (videoId) {
          const replacement = `<YouTubeEmbed id="${videoId}" title="${title}" />`;
          logConversion('YouTube iframe', match, replacement);
          return replacement;
        }
      }
      
      // Check if it's a Vimeo embed
      if (src.includes('vimeo.com')) {
        const replacement = `<MediaEmbed url="${src}" title="${title}" />`;
        logConversion('Vimeo iframe', match, replacement);
        return replacement;
      }
      
      // For other embeds, use MediaEmbed
      const replacement = `<MediaEmbed url="${src}" title="${title}" />`;
      logConversion('iframe embed', match, replacement);
      return replacement;
    }
  );

  // 3. Convert anchor.fm podcast embeds to MediaEmbed
  convertedContent = convertedContent.replace(
    /<iframe\s+src\s*=\s*["']https:\/\/anchor\.fm\/[^"']+["']([^>]*)>/g,
    (match, otherAttributes) => {
      const srcMatch = match.match(/src\s*=\s*["']([^"']+)["']/);
      if (srcMatch) {
        const src = srcMatch[1];
        const replacement = `<MediaEmbed url="${src}" title="Podcast Episode" />`;
        logConversion('anchor.fm embed', match, replacement);
        return replacement;
      }
      return match;
    }
  );

  // 4. Convert empty ose-youtube divs
  convertedContent = convertedContent.replace(
    /<div\s+class\s*=\s*["']ose-youtube[^"']*["'][^>]*>\s*<\/div>/g,
    (match) => {
      const replacement = '<!-- Converted: Empty ose-youtube div - add YouTubeEmbed component here -->';
      logConversion('empty ose-youtube div', match, replacement);
      return replacement;
    }
  );

  // 5. Convert figure elements with iframes to MediaEmbed
  convertedContent = convertedContent.replace(
    /<figure[^>]*>\s*<iframe\s+src\s*=\s*["']([^"']+)["']([^>]*)>([^<]*)<\/iframe>\s*(?:<figcaption[^>]*>([^<]*)<\/figcaption>)?\s*<\/figure>/g,
    (match, src, otherAttributes, iframeContent, figcaption) => {
      const titleMatch = otherAttributes.match(/title\s*=\s*["']([^"']+)["']/);
      const title = titleMatch ? titleMatch[1] : (figcaption || 'Embedded content');
      
      if (src.includes('youtube.com/embed/')) {
        const videoId = src.match(/youtube\.com\/embed\/([^&\n?#]+)/)?.[1];
        if (videoId) {
          const replacement = `<YouTubeEmbed id="${videoId}" title="${title}" />`;
          logConversion('YouTube iframe in figure', match, replacement);
          return replacement;
        }
      }
      
      const replacement = `<MediaEmbed url="${src}" title="${title}" />`;
      logConversion('iframe embed in figure', match, replacement);
      return replacement;
    }
  );

  // 6. Convert YouTube URLs in text to YouTubeEmbed components
  convertedContent = convertedContent.replace(
    /<a\s+href\s*=\s*["']https:\/\/www\.youtube\.com\/watch\?v=([^"']+)["'][^>]*>([^<]*)<\/a>/g,
    (match, videoId, linkText) => {
      const replacement = `<YouTubeEmbed id="${videoId}" title="${linkText.trim()}" />`;
      logConversion('YouTube link', match, replacement);
      return replacement;
    }
  );

  // 7. Convert youtu.be URLs in text to YouTubeEmbed components
  convertedContent = convertedContent.replace(
    /<a\s+href\s*=\s*["']https:\/\/youtu\.be\/([^"']+)["'][^>]*>([^<]*)<\/a>/g,
    (match, videoId, linkText) => {
      const replacement = `<YouTubeEmbed id="${videoId}" title="${linkText.trim()}" />`;
      logConversion('YouTube short link', match, replacement);
      return replacement;
    }
  );

    // 8. Convert Jekyll Liquid {% link %} tags to standard MDX links
  convertedContent = convertedContent.replace(
    /\{%\s*link\s+_posts\/([^%]+)\.md\s*%\}/g,
    (match, filename) => {
      // Extract date and slug from filename
      const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
      if (dateMatch) {
        const [, date, slug] = dateMatch;
        const [year, month, day] = date.split('-');
        // Create proper Markdown link: [text](url)
        const linkText = slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        const linkUrl = `/${year}/${month}/${day}/${slug}/`;
        const replacement = `[${linkText}](${linkUrl})`;
        logConversion('Jekyll post link', match, replacement);
        return replacement;
      }
      return match;
    }
  );
  
  // 9. Convert Jekyll Liquid {% link %} tags for assets
  convertedContent = convertedContent.replace(
    /\{%\s*link\s+assets\/([^%]+)\s*%\}/g,
    (match, assetPath) => {
      // Create proper Markdown link: [text](url)
      const linkText = assetPath;
      const linkUrl = `/assets/${assetPath}`;
      const replacement = `[${linkText}](${linkUrl})`;
      logConversion('Jekyll asset link', match, replacement);
      return replacement;
    }
  );
  
  // 9.5. Fix malformed internal links that got duplicated during conversion
  // This catches cases where the link text got duplicated in the URL section
  // Pattern: [text]([text](url)) -> [text](url)
  convertedContent = convertedContent.replace(
    /\[([^\]]+)\]\(\[([^\]]+)\]\(([^)]+)\)\)/g,
    (match, linkText, duplicatedText, url) => {
      const replacement = `[${linkText}](${url})`;
      logConversion('malformed internal link', match, replacement);
      return replacement;
    }
  );

  // 10. Convert Jekyll Liquid image includes to Markdown images
  // Handle {% include imageframe.html src="filename.jpg" alt="description" href="url" %} (clickable)
  convertedContent = convertedContent.replace(
    /\{%\s*include\s+imageframe\.html[^%]*src\s*=\s*["']([^"']+)["'][^%]*alt\s*=\s*["']([^"']+)["'][^%]*href\s*=\s*["']([^"']+)["'][^%]*%\}/g,
    (match, filename, alt, link) => {
      // Convert image path from /assets/img/ to /images/
      const convertedFilename = filename.replace(/^\/assets\/img\//, '/images/');
      const replacement = `[![${alt}](${convertedFilename})](${link})`;
      logConversion('Jekyll imageframe include (clickable)', match, replacement);
      return replacement;
    }
  );
  
  // Handle {% include imageframe.html src="filename.jpg" alt="description" %} (not clickable)
  convertedContent = convertedContent.replace(
    /\{%\s*include\s+imageframe\.html[^%]*src\s*=\s*["']([^"']+)["'][^%]*alt\s*=\s*["']([^"']+)["'][^%]*%\}/g,
    (match, filename, alt) => {
      // Convert image path from /assets/img/ to /images/
      const convertedFilename = filename.replace(/^\/assets\/img\//, '/images/');
      const replacement = `![${alt}](${convertedFilename})`;
      logConversion('Jekyll imageframe include (no link)', match, replacement);
      return replacement;
    }
  );
  
  // Handle {% include imageframe.html src="filename.jpg" %} (no alt text)
  convertedContent = convertedContent.replace(
    /\{%\s*include\s+imageframe\.html[^%]*src\s*=\s*["']([^"']+)["'][^%]*%\}/g,
    (match, filename) => {
      // Convert image path from /assets/img/ to /images/
      const convertedFilename = filename.replace(/^\/assets\/img\//, '/images/');
      const replacement = `![Image](${convertedFilename})`;
      logConversion('Jekyll imageframe include (no alt)', match, replacement);
      return replacement;
    }
  );
  
  // Handle legacy {% include image.html %} patterns (if they exist)
  // Handle {% include image.html file="filename.jpg" alt="description" %}
  convertedContent = convertedContent.replace(
    /\{%\s*include\s+image\.html\s+file\s*=\s*["']([^"']+)["']\s+alt\s*=\s*["']([^"']+)["']\s*%\}/g,
    (match, filename, alt) => {
      const replacement = `![${alt}](/images/${filename})`;
      logConversion('Jekyll image include (file)', match, replacement);
      return replacement;
    }
  );
  
  // Handle {% include image.html src="filename.jpg" alt="description" %}
  convertedContent = convertedContent.replace(
    /\{%\s*include\s+image\.html\s+src\s*=\s*["']([^"']+)["']\s+alt\s*=\s*["']([^"']+)["']\s*%\}/g,
    (match, filename, alt) => {
      const replacement = `![${alt}](/images/${filename})`;
      logConversion('Jekyll image include (src)', match, replacement);
      return replacement;
    }
  );
  
  // Handle clickable images {% include click-image.html file="filename.jpg" alt="description" link="url" %}
  convertedContent = convertedContent.replace(
    /\{%\s*include\s+click-image\.html\s+file\s*=\s*["']([^"']+)["']\s+alt\s*=\s*["']([^"']+)["']\s+link\s*=\s*["']([^"']+)["']\s*%\}/g,
    (match, filename, alt, link) => {
      const replacement = `[![${alt}](/images/${filename})](${link})`;
      logConversion('Jekyll click-image include', match, replacement);
      return replacement;
    }
  );
  
  // 10.6. Convert any remaining /assets/img/ paths to /images/ paths
  convertedContent = convertedContent.replace(
    /\/assets\/img\//g,
    (match) => {
      logConversion('Image path conversion', match, '/images/');
      return '/images/';
    }
  );
  
  // 10.5. Remove ALL remaining Jekyll/Liquid syntax that could cause MDX compilation errors
  // BUT EXCLUDE the image includes we just converted
  const jekyllPatterns = [
    /\{:\s*[^}]+\}/g, // Remove {: .class .class} patterns (Jekyll table syntax)
    /\{%\s*link[^%]*%\}/g, // Remove {% link %} tags
    /\{%[^%]*%\}/g, // Remove any remaining Liquid tags (but NOT image includes)
    /\{\{[^}]*\}\}/g, // Remove {{ }} expressions
    /\{#[^}]*\}/g // Remove {# ... } Liquid template tags
  ];

  jekyllPatterns.forEach(pattern => {
    convertedContent = convertedContent.replace(pattern, '');
  });

  // 11. Remove problematic HTML tags that cause MDX compilation errors
  // Remove div tags completely (they often cause parsing issues)
  convertedContent = convertedContent.replace(/<div[^>]*>/g, '');
  convertedContent = convertedContent.replace(/<\/div>/g, '');
  
  // Remove other problematic HTML tags
  convertedContent = convertedContent.replace(/<span[^>]*>/g, '');
  convertedContent = convertedContent.replace(/<\/span>/g, '');
  convertedContent = convertedContent.replace(/<p[^>]*>/g, '');
  convertedContent = convertedContent.replace(/<\/p>/g, '');
  
  // Remove figure tags that cause MDX compilation issues
  convertedContent = convertedContent.replace(/<figure[^>]*>/g, '');
  convertedContent = convertedContent.replace(/<\/figure>/g, '');
  convertedContent = convertedContent.replace(/<figcaption[^>]*>/g, '');
  convertedContent = convertedContent.replace(/<\/figcaption>/g, '');
  
  // Convert blockquote HTML tags to Markdown blockquotes
  convertedContent = convertedContent.replace(
    /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g,
    (match, content) => {
      // Convert the content to proper Markdown blockquote format
      const lines = content.trim().split('\n');
      const blockquoteLines = lines.map((line: string) => `> ${line.trim()}`).join('\n');
      // Add spacing above and below blockquotes for proper rendering
      const replacement = `\n\n${blockquoteLines}\n\n`;
      logConversion('HTML blockquote', match, replacement);
      return replacement;
    }
  );

  // 12. Fix common HTML formatting issues
  // Convert HTML entities to proper characters
  const htmlEntities = {
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&hellip;': '...',
    '&mdash;': '—',
    '&ndash;': '–',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#8217;': "'",
    '&#8216;': "'",
    '&#8211;': '–',
    '&#8212;': '—',
    // Additional HTML escape sequences
    '&#39;': "'",
    '&#34;': '"',
    '&#60;': '<',
    '&#62;': '>',
    '&#160;': ' ',
    '&#xa0;': ' ',
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&deg;': '°',
    '&plusmn;': '±',
    '&times;': '×',
    '&divide;': '÷',
    '&frac12;': '½',
    '&frac14;': '¼',
    '&frac34;': '¾'
  };

  Object.entries(htmlEntities).forEach(([entity, replacement]) => {
    convertedContent = convertedContent.replace(new RegExp(entity, 'g'), replacement);
  });

  // 13. Convert HTML img tags to Markdown image syntax
  convertedContent = convertedContent.replace(
    /<img\s+src\s*=\s*["']([^"']+)["']\s+alt\s*=\s*["']([^"']*)["']([^>]*)>/g,
    (match, src, alt, otherAttributes) => {
      const replacement = `![${alt}](${src})`;
      logConversion('HTML img tag', match, replacement);
      return replacement;
    }
  );

  // 14. Convert HTML anchor tags to Markdown links (when appropriate)
  // More comprehensive pattern to catch all anchor tag variations
  convertedContent = convertedContent.replace(
    /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]*)<\/a>/g,
    (match, href, linkText) => {
      // Skip if it's already been converted to a component
      if (href.includes('youtube.com') || href.includes('youtu.be') || href.includes('anchor.fm')) {
        return match;
      }
      
      // Create proper Markdown link: [text](url)
      const replacement = `[${linkText.trim()}](${href})`;
      logConversion('HTML anchor tag', match, replacement);
      return replacement;
    }
  );

  // 15. Minimal whitespace cleanup - only normalize line endings
  // Ensure proper line endings (Windows to Unix)
  convertedContent = convertedContent.replace(/\r\n/g, '\n');

  return convertedContent;
}

// Function to validate MDX content before writing
function validateMDXContent(content: string, filename: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for remaining Jekyll syntax
  if (/\{:[^}]*\}/g.test(content)) {
    errors.push('Contains Jekyll class syntax');
  }
  if (/\{%[^%]*%\}/g.test(content)) {
    errors.push('Contains Jekyll Liquid tags');
  }
  if (/\{\{[^}]*\}\}/g.test(content)) {
    errors.push('Contains Jekyll expressions');
  }
  
  // Check for unclosed HTML tags
  if (/<([a-z]+)[^>]*>(?![^<]*<\/\1>)/gi.test(content)) {
    errors.push('Contains unclosed HTML tags');
  }
  
  // Check for excessive HTML entities
  if (/&[a-z]+;|&#\d+;/g.test(content)) {
    errors.push('Contains HTML entities that should be converted');
  }
  
  // Check for basic Markdown syntax issues
  if (/\n\s*\n\s*\n\s*\n/g.test(content)) {
    errors.push('Contains excessive blank lines');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Function to get all markdown files from a directory
function getMarkdownFiles(directory: string): string[] {
  const files: string[] = [];
  
  function scanDir(dir: string) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.endsWith('.md') || item.endsWith('.markdown')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(directory);
  return files;
}

// Function to read a Jekyll post
function readJekyllPost(filepath: string): JekyllPost | null {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const filename = path.basename(filepath);
    const slug = extractSlugFromFilename(filename);
    const date = extractDateFromFilename(filename);
    const { frontmatter, content: postContent } = parseJekyllFrontmatter(content);
    
    return {
      filename,
      slug,
      date,
      content: postContent,
      frontmatter
    };
  } catch (error) {
    console.error(`Error reading ${filepath}:`, error);
    return null;
  }
}

// Function to ensure output directory exists
function ensureOutputDirectory(outputDir: string): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

// Function to ensure images/third_party directory exists
function ensureThirdPartyImagesDirectory(): void {
  const thirdPartyDir = path.join(process.cwd(), 'public', 'images', 'third_party');
  if (!fs.existsSync(thirdPartyDir)) {
    fs.mkdirSync(thirdPartyDir, { recursive: true });
    console.log('📁 Created /public/images/third_party directory for external images');
  }
}

// Function to write NextJS post
function writeNextJSPost(post: JekyllPost, frontmatter: NextJSFrontmatter, outputDir: string): boolean {
  try {
    // Convert the content
    const convertedContent = convertLiquidToMDX(post.content);
    
    // Validate the converted content
    const validation = validateMDXContent(convertedContent, post.filename);
    
    if (!validation.isValid) {
      console.warn(`  ⚠️  Validation warnings for ${post.filename}:`);
      validation.errors.forEach(error => console.warn(`    - ${error}`));
    }
    
    // Create the MDX content
    const mdxContent = `---
slug: "${frontmatter.slug}"
title: "${frontmatter.title}"
date: "${frontmatter.date}"
excerpt: ${frontmatter.excerpt ? `"${frontmatter.excerpt}"` : 'null'}
featured_image: "${frontmatter.featured_image}"
draft: ${frontmatter.draft}
showToc: ${frontmatter.showToc}
---

${convertedContent}`;
    
    // Write the file
    const outputPath = path.join(outputDir, `${frontmatter.date}-${frontmatter.slug}.mdx`);
    fs.writeFileSync(outputPath, mdxContent, 'utf-8');
    
    return true;
  } catch (error) {
    console.error(`Error writing ${post.filename}:`, error);
    return false;
  }
}

// Main import function
async function importJekyllPosts(): Promise<void> {
  try {
    console.log('🚀 Enhanced Jekyll to NextJS Post Migration Script\n');
    console.log('🔧 This script includes comprehensive fixes for all known MDX compilation issues\n');
    
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
    
    // Ensure third_party images directory exists
    ensureThirdPartyImagesDirectory();
    
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
      errors: [],
      validationErrors: []
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
      console.log('   5. Try building the site to verify all MDX compiles correctly');
    }
    
  } catch (error) {
    console.error('❌ Error during migration:', error instanceof Error ? error.message : String(error));
  } finally {
    rl.close();
  }
}

// Run the script
importJekyllPosts();

export { importJekyllPosts, convertFrontmatter, parseJekyllFrontmatter, convertLiquidToMDX, validateMDXContent };
export type { JekyllFrontmatter, NextJSFrontmatter, JekyllPost, ImportResult };
