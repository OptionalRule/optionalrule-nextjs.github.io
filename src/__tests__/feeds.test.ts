import { describe, it, expect } from 'vitest';
import { generateRobotsTxt, generateSitemap, generateRSSFeed } from '@/lib/feeds';
import { siteConfig } from '@/config/site';

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

