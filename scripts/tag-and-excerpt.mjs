#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { globby } from 'globby';

const TAG_WHITELIST = [
  'DnD 5e',
  'RPG Resources',
  'DM Advice',
  'Mechanics',
  'House Rules',
  'Analysis',
  'Community',
  'Rime of the Frostmaiden',
  'Monsters',
  'Lore',
  'Encounters',
  'Shadowdark',
  'Philosophy'
];
const TAG_SET = new Set(TAG_WHITELIST);

function parseArgs(argv) {
  const opts = {
    path: 'content/posts',
    dryRun: false,
    overwrite: true,
    overwriteTags: true,
    noBackup: true,
    concurrency: 3,
    model: 'gpt-5-2025-08-07',
    apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY || ''
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--overwrite':
        opts.overwrite = true;
        break;
      case '--overwrite-tags':
        opts.overwriteTags = true;
        break;
      case '--no-backup':
        opts.noBackup = true;
        break;
      case '--path':
        opts.path = argv[++i] || opts.path;
        break;
      case '--concurrency':
        opts.concurrency = parseInt(argv[++i], 10) || opts.concurrency;
        break;
      case '--model':
        opts.model = argv[++i] || opts.model;
        break;
      case '--api-key':
        opts.apiKey = argv[++i] || opts.apiKey;
        break;
      default:
        break;
    }
  }
  if (opts.apiKey && process.env[opts.apiKey]) {
    opts.apiKey = process.env[opts.apiKey];
  }
  return opts;
}

function pLimit(concurrency) {
  let activeCount = 0;
  const queue = [];
  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      const run = queue.shift();
      run && run();
    }
  };
  return fn => (...args) => new Promise((resolve, reject) => {
    const run = () => {
      activeCount++;
      Promise.resolve(fn(...args)).then(result => {
        resolve(result);
        next();
      }).catch(err => {
        reject(err);
        next();
      });
    };
    if (activeCount < concurrency) run(); else queue.push(run);
  });
}

async function callOpenAI({ title, content, model, apiKey }) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const messages = [
    {
      role: 'system',
      content:
        'You analyze blog posts and create concise excerpts (100-160 characters, single sentence, plain text, no markdown or quotes, no trailing ellipsis, avoid repeating the title) and choose 1-4 tags from the provided whitelist.'
    },
    {
      role: 'user',
      content: `Title: ${title}\n\nContent:\n${content}\n\nTag whitelist: ${TAG_WHITELIST.join(', ')}\n\nReturn JSON with keys "excerpt" and "tags".`
    }
  ];
  let delay = 500;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages, response_format: { type: 'json_object' } })
    });
    if (res.ok) {
      const data = await res.json();
      try {
        return JSON.parse(data.choices[0].message.content);
      } catch (err) {
        throw new Error('Invalid JSON response from model');
      }
    }
    if (res.status === 429 || res.status >= 500) {
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  }
  throw new Error('Failed to fetch from OpenAI after retries');
}

async function processFile(file, opts, stats) {
  stats.scanned++;
  try {
    console.log(`Processing file: ${file}`);
    const raw = await fs.readFile(file, 'utf8');
    const parsed = matter(raw);
    const front = parsed.data;
    const body = parsed.content;
    const title = front.title || '';

    const hasExcerpt = typeof front.excerpt === 'string' && front.excerpt.trim().length > 0;
    let tags = Array.isArray(front.tags) ? front.tags.map(String) : [];
    const filteredExisting = tags.filter(t => TAG_SET.has(t));
    const hasValidTags = filteredExisting.length > 0;

    const needsExcerpt = opts.overwrite || !hasExcerpt;
    const needsTags = opts.overwriteTags || !hasValidTags;

    console.log(`  Title: ${title}`);
    console.log(`  Has excerpt: ${hasExcerpt}`);
    console.log(`  Has tags: ${tags.length > 0}`);
    console.log(`  Needs excerpt: ${needsExcerpt}`);
    console.log(`  Needs tags: ${needsTags}`);

    if (!needsExcerpt && !needsTags) {
      console.log(`  Skipping file - no updates needed`);
      stats.skipped++;
      return;
    }

    console.log(`  Calling OpenAI for analysis...`);
    const analysis = await callOpenAI({ title, content: body, model: opts.model, apiKey: opts.apiKey });
    console.log(`  OpenAI response:`, analysis);
    
    const modelExcerpt = analysis.excerpt || '';
    const modelTags = Array.isArray(analysis.tags) ? analysis.tags : [];

    if (needsExcerpt) {
      front.excerpt = modelExcerpt;
    }
    if (opts.overwriteTags) {
      front.tags = modelTags.filter(t => TAG_SET.has(t));
    } else {
      const merged = [...filteredExisting, ...modelTags];
      const unique = [...new Set(merged.filter(t => TAG_SET.has(t)))];
      front.tags = unique.slice(0, 4);
    }

    const newContent = matter.stringify(body, front, { lineWidth: 0 });
    if (newContent === raw) {
      stats.skipped++;
      return;
    }

    if (opts.dryRun) {
      console.log(`\n--- ${file} (dry run) ---`);
      console.log(newContent);
    } else {
      if (!opts.noBackup) {
        await fs.copyFile(file, `${file}.bak`);
      }
      await fs.writeFile(file, newContent, 'utf8');
    }
    stats.updated++;
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
    console.error(`Full error:`, err);
    stats.errors++;
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  console.log('Current working directory:', process.cwd());
  console.log('Path option:', opts.path);
  const basePath = path.resolve(opts.path);
  console.log('Resolved base path:', basePath);
  console.log('Base path exists:', await fs.access(basePath).then(() => true).catch(() => false));
  
  const files = await globby('**/*.mdx', { cwd: basePath, absolute: true });
  console.log('Files found by globby:', files.length);
  console.log('First few files:', files.slice(0, 5));
  
  const stats = { scanned: 0, updated: 0, skipped: 0, errors: 0 };
  console.log('Starting to process files...');
  
  const limit = pLimit(opts.concurrency);
  console.log('Concurrency limit set to:', opts.concurrency);
  
  // Process files one by one for debugging
  for (const file of files) { 
    console.log(`\n--- Processing file: ${file} ---`);
    await processFile(file, opts, stats);
  }
  
  console.log(`\nScanned: ${stats.scanned}, Updated: ${stats.updated}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
