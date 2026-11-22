import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

type ContentModule = typeof import('./content');

const post = (frontmatter: string, body = 'Body text.'): string => `---\n${frontmatter}\n---\n\n${body}\n`;

describe('content against a fixture directory', () => {
  let root: string;
  let content: ContentModule;

  beforeAll(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'content-fixture-'));
    const postsDir = path.join(root, 'content', 'posts');
    const pagesDir = path.join(root, 'content', 'pages');
    fs.mkdirSync(postsDir, { recursive: true });
    fs.mkdirSync(pagesDir, { recursive: true });

    fs.writeFileSync(
      path.join(postsDir, '2024-01-02-dnd.mdx'),
      post("title: DnD\ndate: '2024-01-02'\ntags: ['D&D 5e', 'Game Design']"),
    );
    fs.writeFileSync(
      path.join(postsDir, '2024-01-01-plain.mdx'),
      post("title: Plain\ndate: '2024-01-01'\ntags: ['game design']"),
    );
    fs.writeFileSync(
      path.join(pagesDir, 'about.mdx'),
      post("title: About\ndescription: About page", '## Who\n\nUs.'),
    );
    fs.writeFileSync(
      path.join(pagesDir, 'hidden.mdx'),
      post('title: Hidden\ndraft: true'),
    );

    vi.spyOn(process, 'cwd').mockReturnValue(root);
    vi.resetModules();
    content = await import('./content');
  });

  afterAll(() => {
    vi.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe('getPostsByTag', () => {
    it('finds a tag with punctuation by its URL slug', () => {
      const result = content.getPostsByTag('dd-5e');
      expect(result.tag).toBe('D&D 5e');
      expect(result.posts.map((p) => p.slug)).toEqual(['2024-01-02-dnd']);
    });

    it('matches multi-word tags case-insensitively by slug', () => {
      const result = content.getPostsByTag('game-design');
      expect(result.posts).toHaveLength(2);
    });

    it('still accepts a tag name', () => {
      expect(content.getPostsByTag('D&D 5e').posts).toHaveLength(1);
    });

    it('returns no posts for an unknown slug', () => {
      expect(content.getPostsByTag('nope').posts).toEqual([]);
    });
  });

  describe('pages', () => {
    it('lists published page slugs only', () => {
      expect(content.getAllPageSlugs()).toEqual(['about']);
    });

    it('loads a page with headings', () => {
      const page = content.getPage('about');
      expect(page?.title).toBe('About');
      expect(page?.description).toBe('About page');
      expect(page?.headings).toEqual([{ level: 2, text: 'Who', id: 'who' }]);
    });

    it('returns null for a missing or draft page', () => {
      expect(content.getPage('missing')).toBeNull();
      expect(content.getPage('hidden')).toBeNull();
    });
  });

  describe('PostFrontmatterSchema', () => {
    it('accepts YYYY-MM-DD dates', () => {
      expect(content.PostFrontmatterSchema.parse({ title: 't', date: '2024-03-15' }).date).toBe('2024-03-15');
    });

    it.each(['2024-03-15T10:00', '15/03/2024', '2024-3-5'])('rejects %s', (date) => {
      expect(() => content.PostFrontmatterSchema.parse({ title: 't', date })).toThrow();
    });
  });
});
