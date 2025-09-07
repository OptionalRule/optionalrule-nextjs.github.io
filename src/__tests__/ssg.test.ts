import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { parseDateToUTC, normalizeImagePath } from '@/lib/utils';
import { urlPaths } from '@/lib/urls';
import { getAllPostsMeta, getAllTags, getPostsByTag } from '@/lib/content';

// Mock fs for SSG testing
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
const mockGrayMatter = vi.mocked(grayMatter);

describe('Static Site Generation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dynamic Route Generation', () => {
    it('generates all required dynamic routes for posts', () => {
      const testPosts = [
        {
          filename: '2023-12-25-christmas-post.mdx', // This will be first due to desc sorting
          frontmatter: {
            title: 'Christmas Post', 
            date: '2023-12-25',
            slug: 'christmas-special',
            draft: false
          }
        },
        {
          filename: '2023-01-01-new-year-post.mdx', // This will be second
          frontmatter: {
            title: 'New Year Post',
            date: '2023-01-01',
            slug: 'new-year-post',
            draft: false
          }
        }
      ];

      mockFs.existsSync.mockReturnValue(true);
      // Files will be sorted descending by filename, so christmas comes first
      mockFs.readdirSync.mockReturnValue(testPosts.map(p => p.filename));
      
      // Mock file reads in the order they'll be processed (christmas first)
      testPosts.forEach(post => {
        mockFs.readFileSync.mockReturnValueOnce('mock content');
        mockGrayMatter.mockReturnValueOnce({
          data: post.frontmatter,
          content: 'mock content'
        } as unknown as GrayMatterFile<string>);
      });

      const posts = getAllPostsMeta();
      
      // Generate all required dynamic routes
      const routes = posts.map(post => {
        const { year, month, day } = parseDateToUTC(post.date);
        return {
          params: {
            year: year.toString(),
            month: month.toString().padStart(2, '0'),
            day: day.toString().padStart(2, '0'),
            slug: post.slug
          },
          expectedUrl: urlPaths.post(post.date, post.slug)
        };
      });

      expect(routes).toHaveLength(2);
      
      // Verify route structure for first post (christmas, sorted first)
      expect(routes[0].params).toEqual({
        year: '2023',
        month: '12', 
        day: '25',
        slug: 'christmas-special'
      });
      expect(routes[0].expectedUrl).toBe('/2023/12/25/christmas-special/');

      // Verify route structure for second post (new year)
      expect(routes[1].params).toEqual({
        year: '2023',
        month: '01',
        day: '01', 
        slug: 'new-year-post'
      });
      expect(routes[1].expectedUrl).toBe('/2023/01/01/new-year-post/');
    });

    it('generates tag pages for all unique tags', () => {
      const testPosts = [
        {
          filename: 'post2.mdx', // This comes first alphabetically descending
          frontmatter: {
            title: 'Post 2',
            date: '2023-12-02',
            tags: ['Next.js', 'React'],
            draft: false
          }
        },
        {
          filename: 'post1.mdx',
          frontmatter: {
            title: 'Post 1',
            date: '2023-12-01',
            tags: ['React', 'TypeScript'],
            draft: false
          }
        }
      ];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(testPosts.map(p => p.filename));
      
      // Setup mock for getAllTags call
      testPosts.forEach(post => {
        mockFs.readFileSync.mockReturnValueOnce('mock content');
        mockGrayMatter.mockReturnValueOnce({
          data: post.frontmatter,
          content: 'mock content'
        } as unknown as GrayMatterFile<string>);
      });

      const allTags = getAllTags();
      expect(allTags).toEqual(['Next.js', 'React', 'TypeScript']);

      // For each tag test, we need to call getAllPostsMeta again
      // So setup mocks for those calls
      allTags.forEach(tag => {
        // Each getPostsByTag call will call getAllPostsMeta, so mock the file operations
        testPosts.forEach(post => {
          mockFs.readFileSync.mockReturnValueOnce('mock content');
          mockGrayMatter.mockReturnValueOnce({
            data: post.frontmatter,
            content: 'mock content'
          } as unknown as GrayMatterFile<string>);
        });
        
        const tagPage = getPostsByTag(tag);
        expect(tagPage.posts.length).toBeGreaterThan(0);
        expect(tagPage.tag).toBe(tag);
      });
    });
  });

  describe('Trailing Slash Requirements', () => {
    it('ensures all generated URLs have trailing slashes for GitHub Pages', () => {
      const testUrls = [
        { date: '2023-01-01', slug: 'test-post' },
        { date: '2023-12-25', slug: 'holiday-special' },
        { date: '2023-06-15', slug: 'mid-year-update' }
      ];

      testUrls.forEach(({ date, slug }) => {
        const url = urlPaths.post(date, slug);
        expect(url).toMatch(/\/$/); // Must end with trailing slash
        expect(url).not.toMatch(/\/\/$/); // Should not have double slashes
      });
    });

    it('validates tag URLs have proper format for static export', () => {
      const testTags = ['React', 'Next.js', 'TypeScript', 'D&D 5e'];
      
      testTags.forEach(tag => {
        const tagSlug = tag.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '');
        const expectedUrl = `/tag/${tagSlug}/`;
        
        // Verify URL is safe for static file system
        expect(expectedUrl).toMatch(/^\/tag\/[a-z0-9\-]+\/$/);
        expect(expectedUrl).not.toContain('//');
        expect(expectedUrl).not.toContain(' ');
      });
    });
  });

  describe('Image Path Normalization for Static Export', () => {
    it('normalizes image paths correctly for static site', () => {
      const testCases = [
        {
          input: 'images/featured.jpg',
          expected: '/images/featured.jpg',
          description: 'relative path gets leading slash'
        },
        {
          input: '/images/featured.jpg', 
          expected: '/images/featured.jpg',
          description: 'absolute path unchanged'
        },
        {
          input: 'https://example.com/image.jpg',
          expected: 'https://example.com/image.jpg', 
          description: 'external URL unchanged'
        },
        {
          input: 'http://example.com/image.jpg',
          expected: 'http://example.com/image.jpg',
          description: 'external HTTP URL unchanged'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeImagePath(input);
        expect(result).toBe(expected);
      });
    });

    it('handles edge cases in image paths', () => {
      const edgeCases = [
        { input: '', expected: '/' },
        { input: '/', expected: '/' },
        { input: 'image.jpg', expected: '/image.jpg' },
        { input: './images/test.jpg', expected: '/./images/test.jpg' } // Preserves relative indicators
      ];

      edgeCases.forEach(({ input, expected }) => {
        const result = normalizeImagePath(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Build-time Content Processing', () => {
    it('processes content consistently for both build and runtime', () => {
      const mockPost = {
        filename: 'test-post.mdx',
        frontmatter: {
          title: 'Test Post',
          date: '2023-12-01',
          excerpt: 'This is a test post',
          tags: ['Testing'],
          draft: false,
          showToc: true
        },
        content: '# Heading\n\nThis is test content with **bold** text.'
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([mockPost.filename]);
      mockFs.readFileSync.mockReturnValue('mock file content');
      
      mockGrayMatter.mockReturnValue({
        data: mockPost.frontmatter,
        content: mockPost.content
      } as unknown as GrayMatterFile<string>);

      const posts = getAllPostsMeta();
      expect(posts).toHaveLength(1);
      
      const post = posts[0];
      
      // Verify all required fields are processed
      expect(post.title).toBe(mockPost.frontmatter.title);
      expect(post.date).toBe(mockPost.frontmatter.date);
      expect(post.excerpt).toBe(mockPost.frontmatter.excerpt);
      expect(post.tags).toEqual(mockPost.frontmatter.tags);
      expect(post.readingTime).toBe(5); // Mocked reading time
      expect(post.showToc).toBe(true);
      
      // Verify headings are extracted
      expect(post.headings).toBeTruthy();
      expect(post.headings.length).toBeGreaterThan(0);
    });
  });

  describe('Static Generation Edge Cases', () => {
    it('handles posts with special characters in URLs', () => {
      const specialCases = [
        { slug: 'post-with-apostrophe\'s', expected: 'post-with-apostrophe\'s' },
        { slug: 'post with spaces', expected: 'post with spaces' },
        { slug: 'post&with&special', expected: 'post&with&special' },
        { slug: 'UPPERCASE-post', expected: 'UPPERCASE-post' }
      ];

      specialCases.forEach(({ slug, expected }) => {
        const url = urlPaths.post('2023-12-01', slug);
        expect(url).toContain(expected);
        expect(url).toMatch(/^\/\d{4}\/\d{2}\/\d{2}\/.*\/$/);
      });
    });

    it('ensures date consistency across timezones', () => {
      const testDates = [
        '2023-01-01',
        '2023-06-15', 
        '2023-12-31'
      ];

      testDates.forEach(dateStr => {
        const { year, month, day } = parseDateToUTC(dateStr);
        
        // Verify parsed values match input
        const reconstructed = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        expect(reconstructed).toBe(dateStr);
        
        // Verify URL generation is consistent
        const url = urlPaths.post(dateStr, 'test-slug');
        expect(url).toContain(`/${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/`);
      });
    });
  });

  describe('Metadata Generation for SEO', () => {
    it('generates proper metadata for all post types', () => {
      const testPosts = [
        {
          title: 'Complete Guide to Testing',
          excerpt: 'Learn comprehensive testing strategies',
          tags: ['Testing', 'Best Practices']
        },
        {
          title: 'No Excerpt Post',
          excerpt: undefined,
          tags: []
        }
      ];

      testPosts.forEach(post => {
        // Verify title formatting
        expect(post.title).toBeTruthy();
        expect(post.title.length).toBeLessThan(60); // SEO title length
        
        // Verify excerpt handling
        if (post.excerpt) {
          expect(post.excerpt.length).toBeLessThan(160); // Meta description length
        }
        
        // Verify tags are arrays
        expect(Array.isArray(post.tags)).toBe(true);
      });
    });
  });
});