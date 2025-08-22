import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getAllPostsMeta, getPost, getPaginatedPosts } from '@/lib/content';
import { loadSearchIndex, performSearch } from '@/lib/search';
import { generatePostUrl, parseDateToUTC } from '@/lib/utils';

// Mock fs and dependencies for integration tests
vi.mock('fs');
vi.mock('gray-matter', () => ({
  default: vi.fn(),
}));
vi.mock('reading-time', () => ({
  default: vi.fn(() => ({ minutes: 5 })),
}));

const mockFs = vi.mocked(fs);
const mockMatter = vi.fn();

// Mock fetch for search tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Content to Search Pipeline', () => {
    const mockPosts = [
      {
        filename: '2023-12-01-react-testing.mdx',
        frontmatter: {
          title: 'React Testing Guide',
          date: '2023-12-01',
          excerpt: 'Learn how to test React components effectively',
          tags: ['React', 'Testing'],
          draft: false
        },
        content: 'This is a comprehensive guide to testing React components...'
      },
      {
        filename: '2023-12-02-nextjs-ssg.mdx',
        frontmatter: {
          title: 'Next.js Static Site Generation',
          date: '2023-12-02',
          excerpt: 'Master SSG with Next.js',
          tags: ['Next.js', 'SSG'],
          draft: false
        },
        content: 'Static Site Generation is a powerful feature of Next.js...'
      }
    ];

    it('processes content and makes it searchable', async () => {
      // Mock file system for content processing
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockPosts.map(p => p.filename) as any);
      
      mockPosts.forEach((post, index) => {
        mockFs.readFileSync.mockReturnValueOnce(
          `---\n${JSON.stringify(post.frontmatter, null, 2)}\n---\n${post.content}`
        );
      });

      // Mock gray-matter parsing
      const mockGrayMatter = await import('gray-matter');
      mockPosts.forEach(post => {
        mockGrayMatter.default.mockReturnValueOnce({
          data: post.frontmatter,
          content: post.content
        } as any);
      });

      // Process content
      const allPosts = getAllPostsMeta();
      expect(allPosts).toHaveLength(2);
      expect(allPosts[0].title).toBe('Next.js Static Site Generation');
      expect(allPosts[1].title).toBe('React Testing Guide');

      // Mock search index with processed content
      const searchData = allPosts.map(post => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt || '',
        tags: post.tags || [],
        content: 'Mock content for search',
        date: post.date,
        readingTime: post.readingTime
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(searchData)
      });

      // Test search functionality
      const searchResults = await performSearch({ query: 'React' });
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].item.title).toContain('React');
    });
  });

  describe('URL Generation and Routing', () => {
    it('generates consistent URLs across the application', () => {
      const testCases = [
        { date: '2023-01-01', slug: 'test-post', expected: '/2023/01/01/test-post/' },
        { date: '2023-12-25', slug: 'holiday-post', expected: '/2023/12/25/holiday-post/' },
        { date: '2023-02-14', slug: 'valentine-special', expected: '/2023/02/14/valentine-special/' }
      ];

      testCases.forEach(({ date, slug, expected }) => {
        const url = generatePostUrl(date, slug);
        expect(url).toBe(expected);
        
        // Verify URL components are correctly parsed
        const { year, month, day } = parseDateToUTC(date);
        expect(url).toContain(`/${year}/`);
        expect(url).toContain(`/${String(month).padStart(2, '0')}/`);
        expect(url).toContain(`/${String(day).padStart(2, '0')}/`);
        expect(url).toEndWith('/'); // Required for GitHub Pages
      });
    });
  });

  describe('Pagination Integration', () => {
    it('maintains consistency between content listing and pagination', () => {
      // Mock 25 posts for pagination testing
      const mockFiles = Array.from({ length: 25 }, (_, i) => `post-${i + 1}.mdx`);
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      
      // Mock each file read
      mockFiles.forEach((filename, index) => {
        mockFs.readFileSync.mockReturnValue(`---
title: Post ${index + 1}
date: 2023-12-${String(index + 1).padStart(2, '0')}
draft: false
---
Content for post ${index + 1}`);
      });

      const mockGrayMatter = require('gray-matter');
      mockFiles.forEach((_, index) => {
        mockGrayMatter.default.mockReturnValue({
          data: {
            title: `Post ${index + 1}`,
            date: `2023-12-${String(index + 1).padStart(2, '0')}`,
            draft: false
          },
          content: `Content for post ${index + 1}`
        });
      });

      // Test first page
      const page1 = getPaginatedPosts(1);
      expect(page1.posts).toHaveLength(10);
      expect(page1.totalPages).toBe(3);
      expect(page1.hasNextPage).toBe(true);
      expect(page1.hasPrevPage).toBe(false);

      // Test middle page
      const page2 = getPaginatedPosts(2);
      expect(page2.posts).toHaveLength(10);
      expect(page2.hasNextPage).toBe(true);
      expect(page2.hasPrevPage).toBe(true);

      // Test last page
      const page3 = getPaginatedPosts(3);
      expect(page3.posts).toHaveLength(5);
      expect(page3.hasNextPage).toBe(false);
      expect(page3.hasPrevPage).toBe(true);

      // Verify no duplicate posts across pages
      const allPagePosts = [
        ...page1.posts.map(p => p.slug),
        ...page2.posts.map(p => p.slug),
        ...page3.posts.map(p => p.slug)
      ];
      const uniquePosts = new Set(allPagePosts);
      expect(uniquePosts.size).toBe(allPagePosts.length);
    });
  });

  describe('Draft Filtering Integration', () => {
    it('properly filters drafts across all content operations', () => {
      const originalEnv = process.env.NODE_ENV;
      
      try {
        // Test production environment
        process.env.NODE_ENV = 'production';
        
        const mockFiles = ['draft.mdx', 'published.mdx'];
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readdirSync.mockReturnValue(mockFiles as any);
        
        // Mock draft post
        mockFs.readFileSync.mockReturnValueOnce(`---
title: Draft Post
date: 2023-12-01
draft: true
---
This is a draft`);
        
        // Mock published post
        mockFs.readFileSync.mockReturnValueOnce(`---
title: Published Post
date: 2023-12-02
draft: false
---
This is published`);
        
        const mockGrayMatter = require('gray-matter');
        mockGrayMatter.default
          .mockReturnValueOnce({
            data: { title: 'Draft Post', date: '2023-12-01', draft: true },
            content: 'This is a draft'
          })
          .mockReturnValueOnce({
            data: { title: 'Published Post', date: '2023-12-02', draft: false },
            content: 'This is published'
          });
        
        const allPosts = getAllPostsMeta();
        expect(allPosts).toHaveLength(1);
        expect(allPosts[0].title).toBe('Published Post');
        
        // Verify draft is not accessible by slug
        const draftPost = getPost('draft');
        expect(draftPost).toBeNull();
        
        const publishedPost = getPost('published');
        expect(publishedPost).toBeTruthy();
        expect(publishedPost?.title).toBe('Published Post');
        
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('Search Index Generation', () => {
    it('generates search index that matches content structure', async () => {
      // Mock content files
      const mockFiles = ['post1.mdx', 'post2.mdx'];
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      
      mockFiles.forEach((_, index) => {
        mockFs.readFileSync.mockReturnValue(`---
title: Post ${index + 1}
date: 2023-12-0${index + 1}
tags: ["Tag${index + 1}"]
excerpt: Excerpt ${index + 1}
---
Content ${index + 1}`);
      });

      const mockGrayMatter = require('gray-matter');
      mockFiles.forEach((_, index) => {
        mockGrayMatter.default.mockReturnValue({
          data: {
            title: `Post ${index + 1}`,
            date: `2023-12-0${index + 1}`,
            tags: [`Tag${index + 1}`],
            excerpt: `Excerpt ${index + 1}`
          },
          content: `Content ${index + 1}`
        });
      });

      // Get content
      const contentPosts = getAllPostsMeta();
      
      // Mock search index that should match content
      const searchIndex = contentPosts.map(post => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt || '',
        tags: post.tags || [],
        content: `Content for ${post.title}`,
        date: post.date,
        readingTime: post.readingTime
      }));
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(searchIndex)
      });
      
      const loadedIndex = await loadSearchIndex();
      
      // Verify search index matches content
      expect(loadedIndex).toHaveLength(contentPosts.length);
      loadedIndex.forEach((indexItem, i) => {
        const contentPost = contentPosts[i];
        expect(indexItem.slug).toBe(contentPost.slug);
        expect(indexItem.title).toBe(contentPost.title);
        expect(indexItem.date).toBe(contentPost.date);
        expect(indexItem.tags).toEqual(contentPost.tags);
      });
    });
  });
});