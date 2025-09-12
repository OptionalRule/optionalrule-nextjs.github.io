#!/usr/bin/env node
/*
  tag-and-excerpt.mjs
  Uses OpenAI to generate concise excerpts and curated tags for MDX posts.

  Usage:
    node scripts/tag-and-excerpt.mjs [<path>] [options]

  Path:
    - <path> can be a directory (scans .mdx) or a single .mdx file.
    - If omitted, defaults to content/posts.

  Environment (.env):
    - OPENAI_API_KEY=...        (required)
    - OPENAI_MODEL=gpt-5-mini   (optional; defaults applied if absent)
    - OPENAI_REASONING=medium   (optional; low|medium|high)

  Options:
    --dry-run                Preview changes without writing files
    --path <path>            Explicit path if you don't use positional arg
    --overwrite-excerpts     Replace existing excerpts
    --overwrite-tags         Replace existing tags
    --no-backup              Do not create .bak files (default: true)
    --concurrency <n>        Limit concurrent files (default: 3)
    --model <name>           Override model from env

  Examples:
    node scripts/tag-and-excerpt.mjs --dry-run
    node scripts/tag-and-excerpt.mjs content/posts/2025-01-01-example.mdx
    node scripts/tag-and-excerpt.mjs content/drafts --concurrency 5
    node scripts/tag-and-excerpt.mjs --model gpt-4o-mini
*/
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
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

// Resolve repo root relative to this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Simple .env parser inspired by tmp_local/article-enrichment.js
async function loadEnvFromFile(fileName = '.env') {
  const envPath = path.join(ROOT_DIR, fileName);
  try {
    const content = await fs.readFile(envPath, 'utf8');
    const env = {};
    for (const lineRaw of content.split('\n')) {
      const line = lineRaw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (key) env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

async function resolveOpenAIConfig() {
  const fileEnv = await loadEnvFromFile('.env');
  const apiKey = (process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY || fileEnv.OPENAI_API_KEY || '').trim();
  const model = (process.env.OPENAI_MODEL || fileEnv.OPENAI_MODEL || 'gpt-4o-mini').trim();
  const reasoningEffort = (process.env.OPENAI_REASONING || fileEnv.OPENAI_REASONING || 'medium').trim();
  return { apiKey, model, reasoningEffort };
}

function parseArgs(argv, defaults) {
  const opts = {
    path: 'content/posts',
    dryRun: false,
    overwriteExcerpts: false,
    overwriteTags: false,
    noBackup: true,
    concurrency: 3,
    model: defaults.model,
    apiKey: defaults.apiKey,
    reasoningEffort: defaults.reasoningEffort,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;
    if (!arg.startsWith('-') && !opts._positionalConsumed) {
      // First positional non-flag argument treated as path (file or dir)
      opts.path = arg;
      opts._positionalConsumed = true;
      continue;
    }
    switch (arg) {
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--overwrite-excerpts':
        opts.overwriteExcerpts = true;
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
        // Allow override via CLI if provided, but prefer env by default
        opts.model = argv[++i] || opts.model;
        break;
      // Intentionally omit --api-key; we load from .env/env vars per request
      default:
        break;
    }
  }
  delete opts._positionalConsumed;
  return opts;
}

function pLimit(concurrency) {
  let activeCount = 0;
  const queue = [];
  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      const run = queue.shift();
      if (run) run();
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

async function callOpenAI({ title, content, model, apiKey, reasoningEffort }) {
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
      body: JSON.stringify({
        model,
        // For reasoning-capable models, allow tuning effort similar to tmp_local/article-enrichment.js
        reasoning: { effort: reasoningEffort },
        messages,
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })
    });
    if (res.ok) {
      const data = await res.json();
      try {
        return JSON.parse(data.choices[0].message.content);
      } catch (_err) {
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

    const needsExcerpt = opts.overwriteExcerpts || !hasExcerpt;
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
    const analysis = await callOpenAI({ title, content: body, model: opts.model, apiKey: opts.apiKey, reasoningEffort: opts.reasoningEffort });
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
  const envConfig = await resolveOpenAIConfig();
  const opts = parseArgs(process.argv.slice(2), envConfig);

  // Validate required parameters
  if (!opts.apiKey) {
    console.error('Error: OpenAI API key is required. Add OPENAI_API_KEY to .env or environment variables.');
    process.exit(1);
  }
  if (!opts.model) {
    console.error('Error: OpenAI model is required. Add OPENAI_MODEL to .env or pass --model.');
    process.exit(1);
  }
  console.log('Current working directory:', process.cwd());
  console.log('Path option:', opts.path);
  const targetPath = path.resolve(opts.path);
  console.log('Resolved target path:', targetPath);
  
  // Check if path exists
  let pathStats;
  try {
    pathStats = await fs.stat(targetPath);
  } catch {
    console.error(`Error: Path '${targetPath}' does not exist.`);
    process.exit(1);
  }
  
  let files = [];
  
  if (pathStats.isFile()) {
    // Single file mode
    if (!targetPath.endsWith('.mdx')) {
      console.error(`Error: File '${targetPath}' is not an MDX file.`);
      process.exit(1);
    }
    files = [targetPath];
    console.log('Processing single file:', targetPath);
  } else if (pathStats.isDirectory()) {
    // Directory mode
    files = await globby('**/*.mdx', { cwd: targetPath, absolute: true });
    console.log('Files found in directory:', files.length);
    console.log('First few files:', files.slice(0, 5));
  } else {
    console.error(`Error: Path '${targetPath}' is neither a file nor a directory.`);
    process.exit(1);
  }
  
  const stats = { scanned: 0, updated: 0, skipped: 0, errors: 0 };
  console.log('Starting to process files...');
  
  const limit = pLimit(opts.concurrency);
  console.log('Concurrency limit set to:', opts.concurrency);
  
  // Process files with concurrency control
  const processWithLimit = limit(async (file) => {
    console.log(`\n--- Processing file: ${file} ---`);
    return processFile(file, opts, stats);
  });
  
  await Promise.all(files.map(processWithLimit));
  
  console.log(`\nScanned: ${stats.scanned}, Updated: ${stats.updated}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
