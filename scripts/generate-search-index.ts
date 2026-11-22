#!/usr/bin/env -S node --import tsx/esm

import * as fs from 'fs';
import * as path from 'path';
import { buildSearchIndex } from '../src/lib/search-index';
import { INCLUDE_DRAFTS_ENV } from '../src/lib/publication';

function generateSearchIndexFile(): void {
  delete process.env[INCLUDE_DRAFTS_ENV];
  console.log('Generating search index...');
  
  const searchIndex = buildSearchIndex();
  const outputPath = path.join(process.cwd(), 'public', 'search-index.json');
  
  // Ensure public directory exists
  const publicDir = path.dirname(outputPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(searchIndex, null, 2));
  console.log(`✅ Search index generated: ${outputPath} (${searchIndex.length} posts)`);
}

// Run the script
try {
  generateSearchIndexFile();
} catch (error) {
  console.error('❌ Failed to generate search index:', error);
  process.exit(1);
}