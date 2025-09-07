import { parseDateToUTC } from './utils';
import { createTagSlug } from './utils';

/**
 * Centralized URL generation helpers for the Optional Rule site.
 * 
 * This module provides a single source of truth for all URL generation
 * to ensure consistency and adherence to GitHub Pages requirements
 * (trailing slashes, proper static export paths).
 */

/**
 * Base URL paths for all site routes.
 * All URLs include trailing slashes as required by GitHub Pages static export.
 */
export const urlPaths = {
  /**
   * Home page URL
   * @returns The home page path with trailing slash
   * @example
   * ```typescript
   * urlPaths.home() // "/"
   * ```
   */
  home: (): string => '/',

  /**
   * Generate a post URL from date and slug
   * @param date - Post date in YYYY-MM-DD format
   * @param slug - Post URL slug
   * @returns Formatted post URL with trailing slash
   * @example
   * ```typescript
   * urlPaths.post('2024-03-15', 'getting-started') // "/2024/03/15/getting-started/"
   * ```
   */
  post: (date: string, slug: string): string => {
    const { year, month, day } = parseDateToUTC(date);
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    
    return `/${year}/${monthStr}/${dayStr}/${slug}/`;
  },

  /**
   * Generate a tag page URL
   * @param tagName - Tag name (will be slugified for URL safety)
   * @param page - Optional page number for pagination (defaults to 1)
   * @returns Tag page URL with trailing slash
   * @example
   * ```typescript
   * urlPaths.tag('Gaming') // "/tag/gaming/"
   * urlPaths.tag('Role Playing', 2) // "/tag/role-playing/page/2/"
   * ```
   */
  tag: (tagName: string, page?: number): string => {
    const slug = createTagSlug(tagName);
    if (page && page > 1) {
      return `/tag/${slug}/page/${page}/`;
    }
    return `/tag/${slug}/`;
  },

  /**
   * Generate URL for all tags index page
   * @returns Tags index page URL with trailing slash
   * @example
   * ```typescript
   * urlPaths.tags() // "/tags/"
   * ```
   */
  tags: (): string => '/tags/',

  /**
   * Generate pagination URL
   * @param pageNumber - Page number (must be >= 2, page 1 is home)
   * @returns Pagination URL with trailing slash
   * @example
   * ```typescript
   * urlPaths.page(2) // "/page/2/"
   * urlPaths.page(5) // "/page/5/"
   * ```
   */
  page: (pageNumber: number): string => {
    if (pageNumber <= 1) {
      return urlPaths.home();
    }
    return `/page/${pageNumber}/`;
  },

  /**
   * Generate search page URL with optional query parameter
   * @param query - Optional search query to include in URL
   * @returns Search page URL with trailing slash and optional query param
   * @example
   * ```typescript
   * urlPaths.search() // "/search/"
   * urlPaths.search('rpg mechanics') // "/search/?q=rpg%20mechanics"
   * ```
   */
  search: (query?: string): string => {
    if (query && query.trim()) {
      return `/search/?q=${encodeURIComponent(query.trim())}`;
    }
    return '/search/';
  },

  /**
   * Generate static page URL
   * @param slug - Page slug
   * @returns Static page URL with trailing slash
   * @example
   * ```typescript
   * urlPaths.page('about') // "/pages/about/"
   * ```
   */
  staticPage: (slug: string): string => `/pages/${slug}/`,

  /**
   * Generate interactive game URL
   * @param gameName - Name of the game
   * @returns Game URL with trailing slash
   * @example
   * ```typescript
   * urlPaths.game('asteroids') // "/games/asteroids/"
   * ```
   */
  game: (gameName: string): string => `/games/${gameName}/`,

  /**
   * RSS feed URL
   * @returns RSS feed path
   * @example
   * ```typescript
   * urlPaths.rss() // "/rss.xml"
   * ```
   */
  rss: (): string => '/rss.xml',

  /**
   * Sitemap URL
   * @returns Sitemap path
   * @example
   * ```typescript
   * urlPaths.sitemap() // "/sitemap.xml"
   * ```
   */
  sitemap: (): string => '/sitemap.xml',

  /**
   * Robots.txt URL
   * @returns Robots.txt path
   * @example
   * ```typescript
   * urlPaths.robots() // "/robots.txt"
   * ```
   */
  robots: (): string => '/robots.txt',
} as const;

/**
 * Legacy function maintained for backward compatibility.
 * @deprecated Use urlPaths.post() instead
 */
export const generatePostUrl = urlPaths.post;

/**
 * URL path type for type-safe URL generation
 */
export type UrlPath = keyof typeof urlPaths;

/**
 * Helper function to validate if a URL has the required trailing slash
 * @param url - URL to validate
 * @returns True if URL has trailing slash or is a file (.xml, .txt, etc.)
 * @example
 * ```typescript
 * hasTrailingSlash('/about/') // true
 * hasTrailingSlash('/about') // false
 * hasTrailingSlash('/rss.xml') // true (files don't need trailing slash)
 * ```
 */
export function hasTrailingSlash(url: string): boolean {
  // Files (with extensions) don't need trailing slashes
  if (/\.[a-zA-Z0-9]+$/.test(url)) {
    return true;
  }
  
  // All other URLs should end with /
  return url.endsWith('/');
}

/**
 * Helper function to ensure a URL has the required trailing slash
 * @param url - URL to normalize
 * @returns URL with trailing slash if needed
 * @example
 * ```typescript
 * ensureTrailingSlash('/about') // '/about/'
 * ensureTrailingSlash('/about/') // '/about/'
 * ensureTrailingSlash('/rss.xml') // '/rss.xml' (files unchanged)
 * ```
 */
export function ensureTrailingSlash(url: string): string {
  if (hasTrailingSlash(url)) {
    return url;
  }
  
  return `${url}/`;
}