#!/usr/bin/env node
/*
  Config Consistency Audit
  - Validates that siteConfig is consistently used across SEO, feeds, and routes
  - Verifies CNAME coherence, assets existence, GA ID format, and absence of hard-coded hosts
  - Exit code: 0 on success, 1 on errors (warnings reported but do not fail)
*/

import fs from 'fs';
import path from 'path';
import { siteConfig } from '../src/config/site';
import { generateRobotsTxt, generateSitemap } from '../src/lib/feeds';

type Finding = { level: 'error' | 'warning'; message: string };

function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function assertUrl(): Finding[] {
  const findings: Finding[] = [];
  try {
    const url = new URL(siteConfig.url);
    if (url.protocol !== 'https:') {
      findings.push({ level: 'error', message: `siteConfig.url must use https: (${siteConfig.url})` });
    }
    if (siteConfig.url.endsWith('/')) {
      findings.push({ level: 'error', message: `siteConfig.url should not end with a trailing slash (${siteConfig.url})` });
    }
  } catch (e) {
    findings.push({ level: 'error', message: `siteConfig.url is not a valid URL: ${String(e)}` });
  }
  return findings;
}

function checkCname(): Finding[] {
  const findings: Finding[] = [];
  const cnamePath = path.join(process.cwd(), 'public', 'CNAME');
  const content = readFileSafe(cnamePath)?.trim();
  if (!content) {
    findings.push({ level: 'warning', message: 'public/CNAME not found; if using a custom domain, add it here.' });
    return findings;
  }
  try {
    const host = new URL(siteConfig.url).hostname;
    if (content !== host) {
      findings.push({ level: 'error', message: `CNAME (${content}) does not match siteConfig.url hostname (${host}).` });
    }
  } catch {
    findings.push({ level: 'error', message: 'Unable to parse siteConfig.url when validating CNAME.' });
  }
  return findings;
}

function checkFeedsAndRobots(): Finding[] {
  const findings: Finding[] = [];
  const robots = generateRobotsTxt();
  if (!robots.includes(`${siteConfig.url}/sitemap.xml`)) {
    findings.push({ level: 'error', message: 'robots.txt does not reference the correct sitemap URL from siteConfig.url.' });
  }
  const sitemap = generateSitemap();
  if (!sitemap.includes(`<loc>${siteConfig.url}/`)) {
    findings.push({ level: 'error', message: 'sitemap XML does not include absolute URLs built from siteConfig.url.' });
  }
  return findings;
}

function checkAssets(): Finding[] {
  const findings: Finding[] = [];
  const publicDir = path.join(process.cwd(), 'public');
  const assets = [siteConfig.logo, siteConfig.defaultImage, siteConfig.socialImage];
  for (const asset of assets) {
    if (!asset || typeof asset !== 'string') {
      findings.push({ level: 'error', message: 'One or more required image paths are missing in siteConfig.' });
      continue;
    }
    // Convert "/images/foo.png" -> public/images/foo.png
    const normalized = asset.startsWith('/') ? asset.slice(1) : asset;
    const assetPath = path.join(publicDir, normalized);
    if (!fs.existsSync(assetPath)) {
      findings.push({ level: 'error', message: `Missing file referenced in siteConfig: ${asset} (expected at ${assetPath})` });
    }
  }
  return findings;
}

function checkAnalytics(): Finding[] {
  const findings: Finding[] = [];
  const id = (siteConfig.analytics?.googleAnalyticsId || '').trim();
  if (id && !/^G-[A-Za-z0-9]+$/.test(id)) {
    findings.push({ level: 'warning', message: `Google Analytics ID format looks unusual: ${id}` });
  }
  return findings;
}

function checkHardcodedHosts(): Finding[] {
  const findings: Finding[] = [];
  const srcDir = path.join(process.cwd(), 'src');
  const ignoreDirs = ['__tests__', 'stories'];
  const hostRegex = /(https?:\/\/[^\s'"`]+)/g;
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (ignoreDirs.some(d => full.includes(path.sep + d + path.sep))) continue;
        walk(full);
      } else if (entry.isFile() && /\.(t|j)sx?$/.test(entry.name)) {
        if (ignoreDirs.some(d => full.includes(path.sep + d + path.sep))) continue;
        const content = readFileSafe(full) || '';
        const matches = content.match(hostRegex) || [];
        for (const m of matches) {
          // Allow common external references in SVGs; we've filtered those directories already
          if (m.startsWith(siteConfig.url)) continue;
          // Allow GA script URL in GA component
          if (m.startsWith('https://www.googletagmanager.com/')) continue;
          findings.push({ level: 'warning', message: `Hard-coded host found in ${path.relative(process.cwd(), full)}: ${m}` });
        }
      }
    }
  }
  if (fs.existsSync(srcDir)) walk(srcDir);
  return findings;
}

function main() {
  const findings: Finding[] = [];
  findings.push(...assertUrl());
  findings.push(...checkCname());
  findings.push(...checkFeedsAndRobots());
  findings.push(...checkAssets());
  findings.push(...checkAnalytics());
  findings.push(...checkHardcodedHosts());

  const errors = findings.filter(f => f.level === 'error');
  const warnings = findings.filter(f => f.level === 'warning');

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✓ Config validation passed with no issues.');
  } else {
    if (errors.length) {
      console.error('Errors:');
      errors.forEach(e => console.error(`  - ${e.message}`));
    }
    if (warnings.length) {
      console.warn('Warnings:');
      warnings.forEach(w => console.warn(`  - ${w.message}`));
    }
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main();

