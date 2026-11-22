// Format date for display
export function formatDate(dateString: string): string {
  return parseDateToUTCDate(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Centralized date parsing utility that ensures consistent UTC-based date handling
 * This function should be used anywhere we need to extract year, month, or day from a date string
 */
export function parseDateToUTC(dateString: string): { year: number; month: number; day: number } {
  const postDate = parseDateToUTCDate(dateString);
  return {
    year: postDate.getUTCFullYear(),
    month: postDate.getUTCMonth() + 1, // getUTCMonth() returns 0-11, so add 1
    day: postDate.getUTCDate()
  };
}

/**
 * Centralized date parsing utility that returns a Date object
 * This is the single source of truth for all date operations
 */
export function parseDateToUTCDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z'); // Force UTC midnight to avoid timezone issues
}

// Generate post URL from date and slug
export function generatePostUrl(date: string, slug: string): string {
  const { year, month, day } = parseDateToUTC(date);
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  
  return `/${year}/${monthStr}/${dayStr}/${slug}/`;
}

// Capitalize first letter of string
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate page title with site name
export function generatePageTitle(title: string, siteName: string = 'My Blog'): string {
  return title ? `${title} | ${siteName}` : siteName;
}

// Generate meta description
export function generateMetaDescription(description?: string, excerpt?: string, defaultDescription: string = 'A modern blog about TTRPGs, RPG design, game design, and game development.'): string {
  return description || excerpt || defaultDescription;
}

// Generate slugified ID from heading text
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Extract headings from MDX content
export function extractHeadings(content: string): Array<{ level: number; text: string; id: string }> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; id: string }> = [];
  
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = generateHeadingId(text);
    
    headings.push({ level, text, id });
  }
  
  return headings;
}

// Normalize image path for Next.js Image component
export function normalizeImagePath(imagePath: string): string {
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path starting with /, it's already correct for public folder
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  
  // If it's a relative path without /, add it
  return `/${imagePath}`;
}

// Create URL-safe slug from tag name
export function createTagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\w\-]/g, '')        // Remove special characters except hyphens
    .replace(/\-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^\-+|\-+$/g, '');     // Remove leading/trailing hyphens
}

// Generate excerpt from content with basic markdown stripping
export function generateExcerpt(content: string, limit: number = 160): string {
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // Remove fenced code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/#{1,6}\s+/g, '') // Remove markdown headers
    .replace(/\*{1,2}(.*?)\*{1,2}/g, '$1') // Remove bold/italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links but keep text
    .replace(/^\s*[-*+]\s+/gm, '') // Remove bullet list markers
    .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\n\s*\n/g, ' ') // Collapse multiple newlines
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();

  return plainText.length > limit
    ? `${plainText.substring(0, limit).trim()}...`
    : plainText;
}