#!/usr/bin/env node
/*
  enhance-post.mjs

  Fresh implementation to enhance MDX posts with an excerpt and curated tags
  using OpenAI. Uses the Responses API with a fallback to Chat Completions.

  Key requirements implemented:
  - Requires a path argument (file or directory). Throws without a path.
  - Skips draft posts (frontmatter: draft: true).
  - Does not overwrite existing excerpt/tags unless flags provided.
  - Tags are restricted to a fixed whitelist and capped to 1–4.
  - Excerpts are post-processed to enforce style rules.
  - Optional --backup to create .bak files; default is in-place change.
  - Supports --dry-run.

  Usage:
    node scripts/enhance-post.mjs <path> [options]

  Options:
    --dry-run              Preview changes without writing files
    --overwrite-excerpt    Overwrite existing excerpt
    --overwrite-tags       Overwrite existing tags
    --overwrite-all        Overwrite both excerpt and tags
    --backup               Write a <file>.bak before saving
    --model <name>         Override model from env

  Environment (.env or process env):
    OPENAI_API_KEY   (required)
    OPENAI_MODEL     (required)
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function loadDotEnv(fileName = '.env') {
  const envPath = path.join(ROOT_DIR, fileName);
  try {
    const raw = await fs.readFile(envPath, 'utf8');
    const env = {};
    for (const lineRaw of raw.split('\n')) {
      const line = lineRaw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      value = value.replace(/^['"]|['"]$/g, '');
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

async function resolveConfig() {
  const fileEnv = await loadDotEnv('.env');
  const apiKey = (process.env.OPENAI_API_KEY || fileEnv.OPENAI_API_KEY || '').trim();
  const model = (process.env.OPENAI_MODEL || fileEnv.OPENAI_MODEL || '').trim();
  return { apiKey, model };
}

function parseArgs(argv, defaults) {
  const opts = {
    path: '',
    dryRun: false,
    overwriteExcerpt: false,
    overwriteTags: false,
    backup: false,
    model: defaults.model,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;
    if (!arg.startsWith('-') && !opts.path) {
      opts.path = arg;
      continue;
    }
    switch (arg) {
      case '--dry-run':
        opts.dryRun = true; break;
      case '--overwrite-excerpt':
        opts.overwriteExcerpt = true; break;
      case '--overwrite-tags':
        opts.overwriteTags = true; break;
      case '--overwrite-all':
        opts.overwriteExcerpt = true; opts.overwriteTags = true; break;
      case '--backup':
        opts.backup = true; break;
      case '--model':
        opts.model = argv[++i] || opts.model; break;
      default:
        // ignore unknown flags for now
        break;
    }
  }
  return opts;
}

function isMdxFile(p) {
  return /\.mdx$/i.test(p);
}

function normalizeWhitespace(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .trim();
}

function sanitizeExcerpt({ excerpt, title }) {
  let out = String(excerpt || '')
    // Remove backticks/quotes around the whole string
    .replace(/^\s*["'`]+|["'`]+\s*$/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Remove trailing ellipsis characters
  out = out.replace(/(\u2026|\.\.\.)\s*$/u, '');

  // Enforce single sentence by cutting at the first sentence terminator
  const match = out.match(/^[^.!?]*[.!?]/);
  if (match) out = match[0].trim();

  // Avoid repeating the title (case-insensitive, basic heuristic)
  if (title) {
    const t = title.trim();
    if (t) {
      const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${esc}\\b`, 'gi');
      out = out.replace(re, '').replace(/\s{2,}/g, ' ').trim();
    }
  }

  // Target 100–160 chars; if too long, truncate to 160 respecting words
  if (out.length > 160) {
    out = out.slice(0, 160);
    // Trim to last full word or sentence punctuation
    const lastBreak = Math.max(out.lastIndexOf('.'), out.lastIndexOf(' '));
    if (lastBreak > 80) out = out.slice(0, lastBreak + 1).trim();
  }
  // If the result ended with an ellipsis after trimming, remove again
  out = out.replace(/(\u2026|\.\.\.)\s*$/u, '').trim();

  return out;
}

function filterAndCapTags(tags) {
  const arr = Array.isArray(tags) ? tags : [];
  const filtered = [];
  for (const t of arr) {
    const s = String(t || '').trim();
    if (TAG_SET.has(s) && !filtered.includes(s)) {
      filtered.push(s);
      if (filtered.length >= 4) break;
    }
  }
  return filtered;
}

function extractFirstJSONObject(text) {
  if (!text) return '';
  // Prefer fenced JSON if present
  const fenced = /```json\n?([\s\S]*?)\n?```/i.exec(text) || /```\n?([\s\S]*?)\n?```/i.exec(text);
  if (fenced) return fenced[1];
  // Fallback: scan for first balanced JSON object
  let start = -1, depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') { if (depth === 0) start = i; depth++; }
    else if (ch === '}') { if (depth > 0) depth--; if (depth === 0 && start !== -1) return text.slice(start, i + 1); }
  }
  return '';
}

function buildPrompt({ title, content }) {
  return [
    'You analyze blog posts and create concise excerpts (100-160 characters, single sentence, plain text, no markdown or quotes, no trailing ellipsis, avoid repeating the title) and choose 1-4 tags from the provided whitelist.',
    '',
    `Title: ${title}`,
    '',
    'Content:',
    content,
    '',
    `Tag whitelist: ${TAG_WHITELIST.join(', ')}`,
    '',
    'Respond with JSON only: {"excerpt": string, "tags": string[1..4]}.'
  ].join('\n');
}

async function callOpenAIResponses({ apiKey, model, title, content }) {
  const url = 'https://api.openai.com/v1/responses';
  const input = buildPrompt({ title, content });
  const isGpt5 = /gpt-5/i.test(model);

  // Adaptive attempts: try with max_output_tokens and modalities for gpt-5,
  // then relax if the API returns a 400 complaining about those fields.
  let includeMaxOutput = isGpt5;
  let includeModalities = isGpt5;
  const maxOutputTokens = 600;

  for (let attempt = 0; attempt < 3; attempt++) {
    const body = { model, input };
    if (includeMaxOutput) body.max_output_tokens = maxOutputTokens;
    if (includeModalities) body.modalities = ['text'];

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      // Try common fields observed from Responses API
      let raw = '';
      if (typeof data?.output_text === 'string') raw = data.output_text;
      if (!raw && Array.isArray(data?.output) && data.output.length) {
        const first = data.output[0];
        if (Array.isArray(first?.content) && first.content.length) {
          raw = String(first.content[0]?.text || '');
        } else if (typeof first?.text === 'string') {
          raw = first.text;
        }
      }
      if (!raw && typeof data?.content === 'string') raw = data.content;

      let parsed;
      try { parsed = JSON.parse(raw); } catch {
        const ext = extractFirstJSONObject(raw);
        if (ext) { try { parsed = JSON.parse(ext); } catch {} }
      }
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Responses API returned non-JSON or unparsable output');
      }
      return parsed;
    }

    // Handle 400 adaptively
    if (res.status === 400) {
      const text = await res.text().catch(() => '');
      const msg = String(text || '');
      if (includeMaxOutput && /max_output_tokens/i.test(msg)) {
        includeMaxOutput = false; // retry without it
        continue;
      }
      if (includeModalities && /modalities/i.test(msg)) {
        includeModalities = false; // retry without it
        continue;
      }
      throw new Error(`Responses API error 400: ${msg}`);
    }

    const text = await res.text().catch(() => '');
    throw new Error(`Responses API error ${res.status}: ${text || res.statusText}`);
  }
  throw new Error('Responses API failed after retries');
}

async function callOpenAIChat({ apiKey, model, title, content }) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const isGpt5 = /gpt-5/i.test(model);
  const messages = [
    { role: 'system', content: 'You analyze blog posts and create concise excerpts (100-160 characters, single sentence, plain text, no markdown or quotes, no trailing ellipsis, avoid repeating the title) and choose 1-4 tags from the provided whitelist. Respond with JSON only — no commentary or code fences.' },
    { role: 'user', content: buildPrompt({ title, content }) }
  ];

  let includeTemperature = !isGpt5; // omit for gpt-5 models
  let includeResponseFormat = true;  // json_object format if supported

  for (let attempt = 0; attempt < 3; attempt++) {
    const body = { model, messages };
    if (includeTemperature) body.temperature = 0.2;
    if (includeResponseFormat) body.response_format = { type: 'json_object' };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const raw = data?.choices?.[0]?.message?.content || '';
      let parsed;
      try { parsed = JSON.parse(raw); } catch {
        const ext = extractFirstJSONObject(raw);
        if (ext) { try { parsed = JSON.parse(ext); } catch {} }
      }
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Chat API returned non-JSON or unparsable output');
      }
      return parsed;
    }

    if (res.status === 400) {
      const text = await res.text().catch(() => '');
      const msg = String(text || '');
      if (includeTemperature && /temperature/i.test(msg)) { includeTemperature = false; continue; }
      if (includeResponseFormat && /response_format/i.test(msg)) { includeResponseFormat = false; continue; }
      throw new Error(`Chat API error 400: ${msg}`);
    }

    const text = await res.text().catch(() => '');
    throw new Error(`Chat API error ${res.status}: ${text || res.statusText}`);
  }

  throw new Error('Chat API failed after retries');
}

async function analyzeWithOpenAI({ apiKey, model, title, content }) {
  // Try Responses API first, then fall back to Chat Completions
  try {
    return await callOpenAIResponses({ apiKey, model, title, content });
  } catch (err) {
    // console.warn('Responses API failed, falling back to Chat:', err?.message || err);
    return await callOpenAIChat({ apiKey, model, title, content });
  }
}

async function processFile(file, { dryRun, overwriteExcerpt, overwriteTags, backup, apiKey, model }) {
  const raw = await fs.readFile(file, 'utf8');
  const parsed = matter(raw);
  const front = parsed.data || {};
  const body = parsed.content || '';

  // Skip drafts
  if (front?.draft === true) {
    console.log(`Skipping draft: ${file}`);
    return { skipped: true };
  }

  const title = normalizeWhitespace(front?.title || path.basename(file, path.extname(file)));
  if (!title) {
    console.log(`Skipping (missing title): ${file}`);
    return { skipped: true };
  }

  const hasExcerpt = typeof front.excerpt === 'string' && front.excerpt.trim().length > 0;
  const hasTags = Array.isArray(front.tags) && front.tags.length > 0;
  const needExcerpt = overwriteExcerpt || !hasExcerpt;
  const needTags = overwriteTags || !hasTags;
  if (!needExcerpt && !needTags) {
    console.log(`No updates needed: ${file}`);
    return { skipped: true };
  }

  // Send content; to be safe, cap extremely long bodies
  const contentForAI = body.length > 20000 ? body.slice(0, 20000) : body;
  const result = await analyzeWithOpenAI({ apiKey, model, title, content: contentForAI });

  // Normalize response
  const rawExcerpt = normalizeWhitespace(result?.excerpt || '');
  const rawTags = Array.isArray(result?.tags) ? result.tags.map((t) => String(t)) : [];
  const newExcerpt = sanitizeExcerpt({ excerpt: rawExcerpt, title });
  const newTags = filterAndCapTags(rawTags);

  if (needExcerpt) {
    if (newExcerpt) front.excerpt = newExcerpt;
  }
  if (needTags) {
    // Overwrite only; do not touch existing tags unless overwrite is requested
    if (overwriteTags || !hasTags) front.tags = newTags;
  }

  const nextContent = matter.stringify(body, front, { lineWidth: 0 });
  if (nextContent === raw) {
    console.log(`Unchanged after analysis: ${file}`);
    return { skipped: true };
  }

  if (dryRun) {
    console.log(`\n--- ${file} (dry run) ---`);
    console.log(nextContent);
    return { updated: false };
  }

  if (backup) {
    await fs.copyFile(file, `${file}.bak`).catch(() => {});
  }
  await fs.writeFile(file, nextContent, 'utf8');
  console.log(`Updated: ${file}`);
  return { updated: true };
}

async function main() {
  const cfg = await resolveConfig();
  const opts = parseArgs(process.argv.slice(2), cfg);

  if (!opts.path) {
    console.error('Error: path is required. Usage: node scripts/enhance-post.mjs <file-or-directory> [options]');
    process.exit(1);
  }
  if (!cfg.apiKey) {
    console.error('Error: OPENAI_API_KEY is required in environment or .env');
    process.exit(1);
  }
  if (!opts.model) {
    console.error('Error: OPENAI_MODEL is required in environment or .env, or pass --model');
    process.exit(1);
  }

  const target = path.resolve(opts.path);
  let st;
  try { st = await fs.stat(target); } catch {
    console.error(`Error: Path not found: ${target}`);
    process.exit(1);
  }

  const runOpts = {
    dryRun: opts.dryRun,
    overwriteExcerpt: opts.overwriteExcerpt,
    overwriteTags: opts.overwriteTags,
    backup: opts.backup,
    apiKey: cfg.apiKey,
    model: opts.model,
  };

  let files = [];
  if (st.isFile()) {
    if (!isMdxFile(target)) {
      console.error('Error: File must have .mdx extension');
      process.exit(1);
    }
    files = [target];
  } else if (st.isDirectory()) {
    files = await globby(['**/*.mdx'], { cwd: target, absolute: true });
  } else {
    console.error('Error: Path is neither file nor directory');
    process.exit(1);
  }

  if (files.length === 0) {
    console.log('No MDX files found to process.');
    return;
  }

  let updated = 0, skipped = 0, failed = 0;
  for (const f of files) {
    try {
      const res = await processFile(f, runOpts);
      if (res?.updated) updated++; else skipped++;
    } catch (err) {
      failed++;
      console.error(`Error processing ${f}:`, err?.message || err);
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
