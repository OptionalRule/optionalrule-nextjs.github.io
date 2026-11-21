import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  INCLUDE_DRAFTS_ENV,
  isPublished,
  isPublishedFile,
  shouldIncludeDrafts,
} from './publication';

describe('shouldIncludeDrafts', () => {
  it('is false when the flag is absent, regardless of NODE_ENV', () => {
    expect(shouldIncludeDrafts({})).toBe(false);
    expect(shouldIncludeDrafts({ NODE_ENV: 'development' })).toBe(false);
    expect(shouldIncludeDrafts({ NODE_ENV: 'production' })).toBe(false);
    expect(shouldIncludeDrafts({ NODE_ENV: 'test' })).toBe(false);
  });

  it('is true when the dev flag is set outside production', () => {
    expect(shouldIncludeDrafts({ [INCLUDE_DRAFTS_ENV]: 'true', NODE_ENV: 'development' })).toBe(true);
    expect(shouldIncludeDrafts({ [INCLUDE_DRAFTS_ENV]: 'true' })).toBe(true);
  });

  it('never includes drafts in a production build even if the flag leaks in', () => {
    expect(shouldIncludeDrafts({ [INCLUDE_DRAFTS_ENV]: 'true', NODE_ENV: 'production' })).toBe(false);
  });

  it('ignores values other than "true"', () => {
    expect(shouldIncludeDrafts({ [INCLUDE_DRAFTS_ENV]: '1' })).toBe(false);
    expect(shouldIncludeDrafts({ [INCLUDE_DRAFTS_ENV]: 'false' })).toBe(false);
  });
});

describe('isPublished', () => {
  it('treats draft: true as unpublished', () => {
    expect(isPublished({ draft: true }, false)).toBe(false);
  });

  it('treats draft: false or missing as published', () => {
    expect(isPublished({ draft: false }, false)).toBe(true);
    expect(isPublished({}, false)).toBe(true);
  });

  it('shows drafts when drafts are included', () => {
    expect(isPublished({ draft: true }, true)).toBe(true);
  });

  it('defaults to excluding drafts when no flag is set', () => {
    const previous = process.env[INCLUDE_DRAFTS_ENV];
    delete process.env[INCLUDE_DRAFTS_ENV];
    try {
      expect(isPublished({ draft: true })).toBe(false);
    } finally {
      if (previous !== undefined) process.env[INCLUDE_DRAFTS_ENV] = previous;
    }
  });
});

describe('isPublishedFile', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'publication-'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  const write = (name: string, body: string): string => {
    const file = path.join(dir, name);
    fs.writeFileSync(file, body, 'utf8');
    return file;
  };

  it('reads frontmatter and excludes drafts', () => {
    const draft = write('draft.mdx', '---\ntitle: D\ndraft: true\n---\nbody');
    const live = write('live.mdx', '---\ntitle: L\n---\nbody');
    expect(isPublishedFile(draft, false)).toBe(false);
    expect(isPublishedFile(live, false)).toBe(true);
    expect(isPublishedFile(draft, true)).toBe(true);
  });

  it('treats unreadable files as not published, even when drafts are included', () => {
    const missing = path.join(dir, 'missing.mdx');
    expect(isPublishedFile(missing, false)).toBe(false);
    expect(isPublishedFile(missing, true)).toBe(false);
    expect(console.warn).toHaveBeenCalled();
  });
});
