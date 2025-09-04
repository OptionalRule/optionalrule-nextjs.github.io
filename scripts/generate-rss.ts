#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { generateRSSFeed, generateSitemap } from '../src/lib/feeds';

function main() {
  console.log('Generating RSS feed and sitemap...');

  // RSS
  const rssContent = generateRSSFeed();
  const rssPath = path.join(process.cwd(), 'public', 'rss.xml');
  fs.writeFileSync(rssPath, rssContent, 'utf8');
  console.log('✓ RSS feed generated at public/rss.xml');

  // Sitemap
  const sitemapContent = generateSitemap();
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
  console.log('✓ Sitemap generated at public/sitemap.xml');
}

main();

