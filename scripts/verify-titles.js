// Simple checker to inspect <title> tags in the static export under out/
// Usage:
//   node scripts/verify-titles.js                # checks common pages + scans all
//   node scripts/verify-titles.js out/path.html  # check specific files

import fs from 'node:fs';
import path from 'node:path';

const SITE_NAME = process.env.SITE_NAME || 'Optional Rule';

function readTitle(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const m = html.match(/<title>(.*?)<\/title>/i);
    return m ? m[1].trim() : null;
  } catch (e) {
    return null;
  }
}

function hasDuplicateSiteName(title, site = 'Optional Rule') {
  if (!title) return false;
  const t = title.toLowerCase();
  const s = site.toLowerCase();
  let count = 0;
  let idx = 0;
  while (true) {
    const pos = t.indexOf(s, idx);
    if (pos === -1) break;
    count += 1;
    idx = pos + s.length;
  }
  return count > 1;
}

function checkFiles(files) {
  for (const f of files) {
    const exists = fs.existsSync(f);
    const title = exists ? readTitle(f) : null;
    const dup = hasDuplicateSiteName(title, SITE_NAME);
    const status = !exists ? 'MISSING' : !title ? 'NO_TITLE' : dup ? 'DUPLICATE' : 'OK';
    console.log(`${status.padEnd(10)} ${f} -> ${title ?? '(none)'}`);
  }
}

function scanAll(outDir = 'out') {
  const results = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && p.endsWith('.html')) results.push(p);
    }
  }
  if (fs.existsSync(outDir)) walk(outDir);
  let dupCount = 0;
  for (const f of results) {
    const title = readTitle(f);
    if (hasDuplicateSiteName(title, SITE_NAME)) {
      dupCount++;
      console.log(`DUPLICATE    ${f} -> ${title}`);
    }
  }
  if (results.length) {
    console.log(`\nScanned ${results.length} HTML files. Duplicates: ${dupCount}.`);
  } else {
    console.log('No HTML files found under out/. Did you run the build?');
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length) {
    checkFiles(args);
    return;
  }
  // Default sample pages to spot-check if present
  const samples = [
    'out/index.html',
    'out/search/index.html',
    'out/tags/index.html',
    'out/games/asteroids/index.html',
  ];
  console.log('Spot-checking common pages...');
  checkFiles(samples);
  console.log('\nScanning all HTML files for duplicate site titles...');
  scanAll('out');
}

main();
