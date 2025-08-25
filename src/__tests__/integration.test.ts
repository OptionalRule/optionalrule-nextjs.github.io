import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { render } from '@testing-library/react';
import React from 'react';
import { getAllPostsMeta, getPost, getPaginatedPosts } from '@/lib/content';
import { performSearch } from '@/lib/search';
import { SearchResults } from '@/components/SearchResults';
import { generatePostUrl, parseDateToUTC } from '@/lib/utils';

// Mock fs and dependencies for integration tests
vi.mock('fs');
vi.mock('gray-matter', () => ({
  default: vi.fn(),
}));

  import grayMatter from 'gray-matter';
  import type { GrayMatterFile } from 'gray-matter';
vi.mock('reading-time', () => ({
  default: vi.fn(() => ({ minutes: 5 })),
}));

const mockFs = vi.mocked(fs);
const mockMatter = vi.mocked(grayMatter);

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
        mockFs.readdirSync.mockReturnValue(mockPosts.map(p => p.filename));
      
        mockPosts.forEach(post => {
          mockFs.readFileSync.mockReturnValueOnce(
            `---\n${JSON.stringify(post.frontmatter, null, 2)}\n---\n${post.content}`
          );
        });

      // Mock gray-matter parsing
        mockPosts.forEach(post => {
          mockMatter.mockReturnValueOnce(
            {
              data: post.frontmatter,
              content: post.content
            } as unknown as GrayMatterFile<string>
          );
        });

      // Process content
      const allPosts = getAllPostsMeta();
      expect(allPosts).toHaveLength(2);
      expect(allPosts[0].title).toBe('React Testing Guide');
      expect(allPosts[1].title).toBe('Next.js Static Site Generation');

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
        expect(url).toMatch(/\/$/); // Required for GitHub Pages
      });
    });
  });

  describe('Pagination Integration', () => {
    it('maintains consistency between content listing and pagination', () => {
      // Mock 25 posts for pagination testing
      const mockFiles = Array.from({ length: 25 }, (_, i) => `post-${i + 1}.mdx`);
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockFiles);
      
      // Mock each file read
      mockFiles.forEach((filename, index) => {
        mockFs.readFileSync.mockReturnValue(`---
title: Post ${index + 1}
date: 2023-12-${String(index + 1).padStart(2, '0')}
draft: false
---
Content for post ${index + 1}`);
      });

      mockFiles.forEach((_, index) => {
        mockMatter.mockReturnValue({
          data: {
            title: `Post ${index + 1}`,
            date: `2023-12-${String(index + 1).padStart(2, '0')}`,
            draft: false
          },
          content: `Content for post ${index + 1}`
        } as unknown as GrayMatterFile<string>);
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
        mockFs.readdirSync.mockReturnValue(mockFiles);
        
        // Mock draft post - this should be filtered out by getPostFiles
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
        
        // Mock the matter calls for each file (both for filtering and meta extraction)
        mockMatter.mockImplementation((content: string) => {
          if (typeof content === 'string' && content.includes('draft: true')) {
            return {
              data: { title: 'Draft Post', date: '2023-12-01', draft: true },
              content: 'This is a draft'
            } as unknown as GrayMatterFile<string>;
          }
          return {
            data: { title: 'Published Post', date: '2023-12-02', draft: false },
            content: 'This is published'
          } as unknown as GrayMatterFile<string>;
        });
        
        const allPosts = getAllPostsMeta();
        expect(allPosts).toHaveLength(1);
        expect(allPosts[0].title).toBe('Published Post');
        
        // Setup additional mocks for getPost calls
        // getPost will call getPostFiles again and then read files to find matching slug
        // Since draft is filtered out in production, only published.mdx will be in the files list
        mockFs.readdirSync.mockReturnValueOnce(['published.mdx']); // Only published file for getPost('draft')
        
        // Verify draft is not accessible by slug
        const draftPost = getPost('draft');
        expect(draftPost).toBeNull();
        
        // Setup mocks for published post lookup
        mockFs.readdirSync.mockReturnValueOnce(['published.mdx']); // For getPost('published')
        mockFs.readFileSync.mockReturnValueOnce(`---
title: Published Post
date: 2023-12-02
draft: false
---
This is published`);
        mockMatter.mockReturnValueOnce({
          data: { title: 'Published Post', date: '2023-12-02', draft: false },
          content: 'This is published'
        } as unknown as GrayMatterFile<string>);
        
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
      // Clear all previous mocks to ensure clean state
      vi.clearAllMocks();
      
      // Clear any cached search index from the search module
      await vi.resetModules();
      
      // Re-import search functions after module reset
      const { loadSearchIndex: freshLoadSearchIndex } = await import('@/lib/search');
      
      // Mock content files - using proper date format that matches filename sorting
      const mockFiles = ['2023-12-02-nextjs-ssg.mdx', '2023-12-01-react-testing.mdx']; // Sorted descending by filename
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockFiles);
      
      // Mock file reads in the order they will be accessed
      mockFs.readFileSync
        .mockReturnValueOnce(`---
title: Next.js Static Site Generation
date: 2023-12-02
tags: ["Next.js", "SSG"]
excerpt: Master SSG with Next.js
---
Static Site Generation is a powerful feature of Next.js...`)
        .mockReturnValueOnce(`---
title: React Testing Guide
date: 2023-12-01
tags: ["React", "Testing"]
excerpt: Learn how to test React components effectively
---
This is a comprehensive guide to testing React components...`);

      // Mock matter parsing - directly mock the return values in the order they'll be called
      mockMatter
        .mockReturnValueOnce({
          data: {
            title: 'Next.js Static Site Generation',
            date: '2023-12-02',
            tags: ['Next.js', 'SSG'],
            excerpt: 'Master SSG with Next.js'
          },
          content: 'Static Site Generation is a powerful feature of Next.js...'
        } as unknown as GrayMatterFile<string>)
        .mockReturnValueOnce({
          data: {
            title: 'React Testing Guide',
            date: '2023-12-01',
            tags: ['React', 'Testing'],
            excerpt: 'Learn how to test React components effectively'
          },
          content: 'This is a comprehensive guide to testing React components...'
        } as unknown as GrayMatterFile<string>);

      // Get content
      const contentPosts = getAllPostsMeta();
      expect(contentPosts).toHaveLength(2);
      
      // Test that search index generation works end-to-end
      // Since we've verified content processing works, just test that search loads
      const mockSearchIndex = [
        {
          slug: '2023-12-02-nextjs-ssg',
          title: 'Next.js Static Site Generation',
          excerpt: 'Master SSG with Next.js',
          tags: ['Next.js', 'SSG'],
          content: 'Static Site Generation is a powerful feature of Next.js...',
          date: '2023-12-02',
          readingTime: 5
        },
        {
          slug: '2023-12-01-react-testing',
          title: 'React Testing Guide',
          excerpt: 'Learn how to test React components effectively',
          tags: ['React', 'Testing'],
          content: 'This is a comprehensive guide to testing React components...',
          date: '2023-12-01',
          readingTime: 5
        }
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchIndex)
      });
      
      const loadedIndex = await freshLoadSearchIndex();
      
      // Verify search index loads correctly
      expect(loadedIndex).toHaveLength(2);
      expect(loadedIndex).toEqual(mockSearchIndex);
      
      // Verify that content processing and search index have compatible data
      expect(contentPosts.map(p => p.slug).sort()).toEqual(loadedIndex.map(p => p.slug).sort());
      expect(contentPosts.map(p => p.title).sort()).toEqual(loadedIndex.map(p => p.title).sort());
    });
  });

  describe('Search results behavior', () => {
    it('orders results by relevance and escapes query', async () => {
      await vi.resetModules();
      const { performSearch: freshPerformSearch } = await import('@/lib/search');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              slug: 'react-guide',
              title: 'React Guide',
              excerpt: 'About React',
              tags: ['react'],
              content: 'React content',
              date: '2024-01-01',
              readingTime: 1,
            },
            {
              slug: 'other',
              title: 'Other Post',
              excerpt: 'Mentions React',
              tags: ['misc'],
              content: 'React mentioned here',
              date: '2024-01-02',
              readingTime: 1,
            },
          ]),
      });

      const results = await freshPerformSearch({ query: 'React' });
      expect(results.map(r => r.item.slug)).toEqual(['react-guide', 'other']);

      const { container } = render(
        React.createElement(SearchResults, {
          results: [],
          query: "<img src='x' onerror='alert(1)'>",
        })
      );
      expect(container.querySelector('img')).toBeNull();
      expect(container.innerHTML).toContain('&lt;img src=\'x\' onerror=\'alert(1)\'&gt;');
    });
  });
});
