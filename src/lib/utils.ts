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

export function generateHeadingId(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

export function createHeadingIdAllocator(): (text: string) => string {
  const used = new Set<string>();
  return (text: string): string => {
    const base = generateHeadingId(text);
    let id = base;
    for (let n = 1; used.has(id); n++) {
      id = `${base}-${n}`;
    }
    used.add(id);
    return id;
  };
}

export function markdownHeadingText(markdown: string): string {
  let text = markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/<[^>]+>/g, '');
  let previous;
  do {
    previous = text;
    text = text.replace(/(\*\*|__|\*|_)(\S(?:.*?\S)?)\1/g, '$2');
  } while (text !== previous);
  return text.replace(/\\([\\`*_{}[\]()#+\-.!>])/g, '$1').trim();
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const ATX_HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const BLOCKQUOTE_PREFIX = /^(?: {0,3}> ?)+/;

export function extractHeadings(content: string): Array<{ level: number; text: string; id: string }> {
  const headings: Array<{ level: number; text: string; id: string }> = [];
  const allocateId = createHeadingIdAllocator();
  let fence: string | null = null;

  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(BLOCKQUOTE_PREFIX, '');
    const fenceMatch = FENCE.exec(line);
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) {
        fence = null;
      }
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      continue;
    }
    const match = ATX_HEADING.exec(line);
    if (!match || match[2] === '') continue;
    const text = markdownHeadingText(match[2]);
    headings.push({ level: match[1].length, text, id: allocateId(text) });
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