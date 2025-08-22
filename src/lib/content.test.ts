import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';

// Mock fs module
vi.mock('fs');
const mockFs = vi.mocked(fs);

// Mock gray-matter
vi.mock('gray-matter', () => ({
  default: vi.fn(),
}));

// Mock reading-time
vi.mock('reading-time', () => ({
  default: vi.fn(() => ({ minutes: 5 })),
}));

// Import after mocking
import {
  isPostDraft,
  isPageDraft,
  getAllPostFiles,
  getPostFiles,
  getAllPageFiles,
  getPageFiles
} from './content';
import matter from 'gray-matter';
import type { GrayMatterFile } from 'gray-matter';

const mockMatter = vi.mocked(matter);

describe('Content Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Draft detection', () => {
    describe('isPostDraft', () => {
      it('returns true for draft posts', () => {
        mockFs.readFileSync.mockReturnValue('content');
        mockMatter.mockReturnValue({
          data: { draft: true },
          content: 'content'
        } as unknown as GrayMatterFile<string>);

        expect(isPostDraft('test.mdx')).toBe(true);
      });

      it('returns false for published posts', () => {
        mockFs.readFileSync.mockReturnValue('content');
        mockMatter.mockReturnValue({
          data: { draft: false },
          content: 'content'
        } as unknown as GrayMatterFile<string>);

        expect(isPostDraft('test.mdx')).toBe(false);
      });

      it('returns false when draft property is undefined', () => {
        mockFs.readFileSync.mockReturnValue('content');
        mockMatter.mockReturnValue({
          data: {},
          content: 'content'
        } as unknown as GrayMatterFile<string>);

        expect(isPostDraft('test.mdx')).toBe(false);
      });

      it('returns true on error', () => {
        mockFs.readFileSync.mockImplementation(() => {
          throw new Error('File not found');
        });

        expect(isPostDraft('test.mdx')).toBe(true);
      });
    });

    describe('isPageDraft', () => {
      it('returns true for draft pages', () => {
        mockFs.readFileSync.mockReturnValue('content');
        mockMatter.mockReturnValue({
          data: { draft: true },
          content: 'content'
        } as unknown as GrayMatterFile<string>);

        expect(isPageDraft('test.mdx')).toBe(true);
      });

      it('returns false for published pages', () => {
        mockFs.readFileSync.mockReturnValue('content');
        mockMatter.mockReturnValue({
          data: { draft: false },
          content: 'content'
        } as unknown as GrayMatterFile<string>);

        expect(isPageDraft('test.mdx')).toBe(false);
      });
    });
  });

  describe('File listing', () => {
    describe('getAllPostFiles', () => {
      it('returns empty array when directory does not exist', () => {
        mockFs.existsSync.mockReturnValue(false);
        expect(getAllPostFiles()).toEqual([]);
      });

      it('filters MDX files and sorts them', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue([
          'post1.mdx',
          'post2.md', 
          'image.jpg',
          'post3.mdx',
          'README.txt'
        ] as unknown as string[]);

        const result = getAllPostFiles();
        expect(result).toEqual(['post3.mdx', 'post2.md', 'post1.mdx']);
      });

      it('handles empty directory', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue([]);
        expect(getAllPostFiles()).toEqual([]);
      });
    });

    describe('getPostFiles', () => {
      it('includes all posts in development', () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue(['post1.mdx', 'post2.mdx']);

        const result = getPostFiles();
        expect(result).toEqual(['post2.mdx', 'post1.mdx']);

        process.env.NODE_ENV = originalNodeEnv;
      });

      it('filters drafts in production', () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue(['draft.mdx', 'published.mdx']);
        
        mockFs.readFileSync
          .mockReturnValueOnce('draft content')
          .mockReturnValueOnce('published content');
        
        mockMatter
            .mockReturnValueOnce(
              { data: { draft: true }, content: 'content' } as unknown as GrayMatterFile<string>
            )
            .mockReturnValueOnce(
              { data: { draft: false }, content: 'content' } as unknown as GrayMatterFile<string>
            );

        const result = getPostFiles();
        expect(result).toEqual(['published.mdx']);

        process.env.NODE_ENV = originalNodeEnv;
      });
    });

    describe('getAllPageFiles', () => {
      it('returns MDX files from pages directory', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue([
          'about.mdx',
          'contact.md',
          'style.css'
          ] as unknown as string[]);

        const result = getAllPageFiles();
        expect(result).toEqual(['about.mdx', 'contact.md']);
      });
    });

    describe('getPageFiles', () => {
      it('includes all pages in development', () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue(['about.mdx']);

        const result = getPageFiles();
        expect(result).toEqual(['about.mdx']);

        process.env.NODE_ENV = originalNodeEnv;
      });

      it('filters draft pages in production', () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue(['draft-page.mdx', 'about.mdx']);
        
        mockFs.readFileSync
          .mockReturnValueOnce('draft content')
          .mockReturnValueOnce('about content');
        
        mockMatter
            .mockReturnValueOnce(
              { data: { draft: true }, content: 'content' } as unknown as GrayMatterFile<string>
            )
            .mockReturnValueOnce(
              { data: {}, content: 'content' } as unknown as GrayMatterFile<string>
            );

        const result = getPageFiles();
        expect(result).toEqual(['about.mdx']);

        process.env.NODE_ENV = originalNodeEnv;
      });
    });
  });
});