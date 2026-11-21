#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { generateRSSFeed } from '../src/lib/feeds';
import { INCLUDE_DRAFTS_ENV } from '../src/lib/publication';

function main() {
  delete process.env[INCLUDE_DRAFTS_ENV];
  console.log('Generating RSS feed...');

  const rssContent = generateRSSFeed();
  const rssPath = path.join(process.cwd(), 'public', 'rss.xml');
  fs.writeFileSync(rssPath, rssContent, 'utf8');
  console.log('✓ RSS feed generated at public/rss.xml');
}

main();

