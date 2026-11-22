import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { INCLUDE_DRAFTS_ENV } from './publication';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
  },
}));
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
  getAllPostFiles,
  getPostFiles,
  getAllPageFiles,
  getPageFiles
} from './content';
import matter from 'gray-matter';
import type { GrayMatterFile } from 'gray-matter';

const mockMatter = vi.mocked(matter);

const originalNodeEnv = process.env.NODE_ENV;
const originalIncludeDrafts = process.env[INCLUDE_DRAFTS_ENV];

const setNodeEnv = (value: string | undefined): void => {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) {
    delete env.NODE_ENV;
  } else {
    env.NODE_ENV = value;
  }
};

describe('Content Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    delete process.env[INCLUDE_DRAFTS_ENV];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setNodeEnv(originalNodeEnv);
    if (originalIncludeDrafts === undefined) {
      delete process.env[INCLUDE_DRAFTS_ENV];
    } else {
      process.env[INCLUDE_DRAFTS_ENV] = originalIncludeDrafts;
    }
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
        ] as unknown as ReturnType<typeof fs.readdirSync>);

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
      it('includes drafts when the dev draft flag is set', () => {
        process.env[INCLUDE_DRAFTS_ENV] = 'true';
        setNodeEnv('development');

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue(['post1.mdx', 'post2.mdx'] as unknown as ReturnType<typeof fs.readdirSync>);
        mockFs.readFileSync.mockReturnValue('content');
        mockMatter.mockReturnValue(
          { data: { draft: true }, content: 'content' } as unknown as GrayMatterFile<string>
        );

        expect(getPostFiles()).toEqual(['post2.mdx', 'post1.mdx']);
      });

      it.each([undefined, 'development', 'production', 'test'])(
        'filters drafts without the dev flag (NODE_ENV=%s)',
        (nodeEnv) => {
          setNodeEnv(nodeEnv);

          mockFs.existsSync.mockReturnValue(true);
          mockFs.readdirSync.mockReturnValue(['draft.mdx', 'published.mdx'] as unknown as ReturnType<typeof fs.readdirSync>);
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

          expect(getPostFiles()).toEqual(['published.mdx']);
        }
      );

      it('excludes unreadable posts', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue(['broken.mdx', 'ok.mdx'] as unknown as ReturnType<typeof fs.readdirSync>);
        mockFs.readFileSync
          .mockImplementationOnce(() => {
            throw new Error('EACCES');
          })
          .mockReturnValueOnce('ok content');
        mockMatter.mockReturnValue(
          { data: {}, content: 'content' } as unknown as GrayMatterFile<string>
        );

        expect(getPostFiles()).toEqual(['ok.mdx']);
        expect(console.warn).toHaveBeenCalled();
      });
    });

    describe('getAllPageFiles', () => {
      it('returns MDX files from pages directory', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue([
          'about.mdx',
          'contact.md',
          'style.css'
          ] as unknown as ReturnType<typeof fs.readdirSync>);

        const result = getAllPageFiles();
        expect(result).toEqual(['about.mdx', 'contact.md']);
      });
    });

    describe('getPageFiles', () => {
      it('includes draft pages when the dev draft flag is set', () => {
        process.env[INCLUDE_DRAFTS_ENV] = 'true';
        setNodeEnv('development');

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue(['about.mdx'] as unknown as ReturnType<typeof fs.readdirSync>);
        mockFs.readFileSync.mockReturnValue('content');
        mockMatter.mockReturnValue(
          { data: { draft: true }, content: 'content' } as unknown as GrayMatterFile<string>
        );

        expect(getPageFiles()).toEqual(['about.mdx']);
      });

      it('filters draft pages without the dev flag', () => {
        setNodeEnv(undefined);

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue(['draft-page.mdx', 'about.mdx'] as unknown as ReturnType<typeof fs.readdirSync>);
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

        expect(getPageFiles()).toEqual(['about.mdx']);
      });

      it('excludes unreadable pages', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue(['broken.mdx', 'about.mdx'] as unknown as ReturnType<typeof fs.readdirSync>);
        mockFs.readFileSync
          .mockImplementationOnce(() => {
            throw new Error('EACCES');
          })
          .mockReturnValueOnce('about content');
        mockMatter.mockReturnValue(
          { data: {}, content: 'content' } as unknown as GrayMatterFile<string>
        );

        expect(getPageFiles()).toEqual(['about.mdx']);
        expect(console.warn).toHaveBeenCalled();
      });
    });
  });
});