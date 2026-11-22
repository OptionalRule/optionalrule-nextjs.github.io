import { describe, it, expect } from 'vitest';
import { generateRobotsTxt, generateSitemap, generateRSSFeed } from '@/lib/feeds';
import { siteConfig } from '@/config/site';
import { getAllTags, getAllPageSlugs, getAllPostsMeta, POSTS_PER_PAGE } from '@/lib/content';
import { urlPaths } from '@/lib/urls';

describe('Feeds and Robots', () => {
  it('generateRobotsTxt includes sitemap with siteConfig.url', () => {
    const robots = generateRobotsTxt();
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain(`${siteConfig.url}/sitemap.xml`);
  });

  // Smoke tests (structure only)
  it('generateSitemap returns XML with urlset root', () => {
    const xml = generateSitemap();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('</urlset>');
  });

  it('generateRSSFeed returns XML with channel', () => {
    const xml = generateRSSFeed();
    expect(xml).toContain('<rss');
    expect(xml).toContain('<channel>');
  });
});

describe('generateSitemap routes', () => {
  const locPaths = (xml: string): string[] =>
    Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1].slice(siteConfig.url.length));

  it('emits every tag page at its routed slug', () => {
    const paths = locPaths(generateSitemap());
    const tagPaths = paths.filter((p) => p.startsWith('/tag/'));
    const expected = getAllTags().map((tag) => urlPaths.tag(tag));
    expect(new Set(tagPaths)).toEqual(new Set(expected));
  });

  it('emits only URL-safe paths with trailing slashes', () => {
    for (const p of locPaths(generateSitemap())) {
      expect(p).not.toMatch(/\s/);
      expect(p === '' || p.endsWith('/')).toBe(true);
    }
  });

  it('derives static pages and pagination from content', () => {
    const paths = locPaths(generateSitemap());
    for (const slug of getAllPageSlugs()) {
      expect(paths).toContain(urlPaths.staticPage(slug));
    }
    const totalPages = Math.ceil(getAllPostsMeta().length / POSTS_PER_PAGE);
    const pagePaths = paths.filter((p) => p.startsWith('/page/'));
    expect(pagePaths).toHaveLength(Math.max(totalPages - 1, 0));
  });
});

