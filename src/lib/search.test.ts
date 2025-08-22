import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadSearchIndex, performSearch, getSearchTags } from './search';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods
const consoleSpy = {
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
};

describe('Search functionality', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset any cached instances by re-importing the module
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockSearchData = [
    {
      slug: 'test-post-1',
      title: 'React Testing Guide',
      excerpt: 'Learn how to test React components',
      tags: ['React', 'Testing'],
      content: 'Complete guide to testing React applications...',
      date: '2023-12-01',
      readingTime: 5
    },
    {
      slug: 'test-post-2', 
      title: 'TypeScript Best Practices',
      excerpt: 'Write better TypeScript code',
      tags: ['TypeScript', 'Best Practices'],
      content: 'Essential TypeScript patterns and practices...',
      date: '2023-12-02',
      readingTime: 8
    }
  ];

  describe('loadSearchIndex', () => {
    it('loads search index successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchData)
      });

      // Import fresh module
      const { loadSearchIndex: freshLoadSearchIndex } = await import('./search');
      const result = await freshLoadSearchIndex();
      expect(result).toEqual(mockSearchData);
      expect(mockFetch).toHaveBeenCalledWith('/search-index.json');
    });

    it('returns empty array on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      // Import fresh module
      const { loadSearchIndex: freshLoadSearchIndex } = await import('./search');
      const result = await freshLoadSearchIndex();
      expect(result).toEqual([]);
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Import fresh module
      const { loadSearchIndex: freshLoadSearchIndex } = await import('./search');
      const result = await freshLoadSearchIndex();
      expect(result).toEqual([]);
    });

    it('validates search index data structure', async () => {
      const invalidData = [
        mockSearchData[0], // valid
        { slug: 'invalid', title: 123 }, // invalid - title should be string
        mockSearchData[1] // valid
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidData)
      });

      // Import fresh module
      const { loadSearchIndex: freshLoadSearchIndex } = await import('./search');
      const result = await freshLoadSearchIndex();
      expect(result).toHaveLength(2); // Should filter out invalid item
    });

    it('handles non-array response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ not: 'an array' })
      });

      // Import fresh module
      const { loadSearchIndex: freshLoadSearchIndex } = await import('./search');
      const result = await freshLoadSearchIndex();
      expect(result).toEqual([]);
    });

    it('caches the search index after first load', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchData)
      });

      // Import fresh module to test caching
      const { loadSearchIndex: freshLoadSearchIndex } = await import('./search');
      
      // First call
      const result1 = await freshLoadSearchIndex();
      // Second call
      const result2 = await freshLoadSearchIndex();

      expect(result1).toEqual(mockSearchData);
      expect(result2).toEqual(mockSearchData);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Should only fetch once
    });
  });

  describe('performSearch', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchData)
      });
    });

    it('returns empty array for empty query', async () => {
      const result = await performSearch({ query: '' });
      expect(result).toEqual([]);
    });

    it('returns empty array for whitespace-only query', async () => {
      const result = await performSearch({ query: '   ' });
      expect(result).toEqual([]);
    });

    it('performs basic search', async () => {
      const result = await performSearch({ query: 'React' });
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].item.title).toContain('React');
    });

    it('filters results by tags', async () => {
      const result = await performSearch({ 
        query: 'test', 
        tags: ['React'] 
      });
      
      // Should only return results that have the React tag
      result.forEach(item => {
        expect(item.item.tags).toContain('React');
      });
    });

    it('respects result limit', async () => {
      const result = await performSearch({ 
        query: 'test', 
        limit: 1 
      });
      
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('includes score and matches in results', async () => {
      const result = await performSearch({ query: 'React' });
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('score');
        expect(result[0]).toHaveProperty('matches');
        expect(result[0]).toHaveProperty('item');
      }
    });
  });

  describe('getSearchTags', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchData)
      });
    });

    it('returns unique sorted tags', async () => {
      const result = await getSearchTags();
      
      const expectedTags = ['Best Practices', 'React', 'Testing', 'TypeScript'];
      expect(result).toEqual(expectedTags);
    });

    it('handles empty search index', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      // Import fresh module
      const { getSearchTags: freshGetSearchTags } = await import('./search');
      const result = await freshGetSearchTags();
      expect(result).toEqual([]);
    });

    it('deduplicates tags', async () => {
      const dataWithDuplicates = [
        { ...mockSearchData[0], tags: ['React', 'React', 'Testing'] },
        { ...mockSearchData[1], tags: ['React', 'TypeScript'] }
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(dataWithDuplicates)
      });

      const result = await getSearchTags();
      
      // Should not have duplicate 'React' tags
      const reactCount = result.filter(tag => tag === 'React').length;
      expect(reactCount).toBe(1);
    });
  });
});