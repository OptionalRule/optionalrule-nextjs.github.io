import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { performSearch, getSearchTags } from './search';
import { mockGlobalFetch } from '@/test-utils/mocks';

const { fetchMock, restore: restoreFetch } = mockGlobalFetch();

// Mock console methods
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Search functionality', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset any cached instances by re-importing the module
    vi.resetModules();
  });

  afterAll(() => {
    restoreFetch();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
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
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchData)
      });

      // Import fresh module
      const { loadSearchIndex: freshLoadSearchIndex } = await import('./search');
      const result = await freshLoadSearchIndex();
      expect(result).toEqual(mockSearchData);
      expect(fetchMock).toHaveBeenCalledWith('/search-index.json');
    });

    it('returns empty array on fetch failure', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const { loadSearchIndex: freshLoadSearchIndex } = await import('./search');
      const result = await freshLoadSearchIndex();
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error loading search index:',
        expect.any(Error)
      );
    });

    it('handles network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const { loadSearchIndex: freshLoadSearchIndex } = await import('./search');
      const result = await freshLoadSearchIndex();
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error loading search index:',
        expect.any(Error)
      );
    });

    it('validates search index data structure', async () => {
      const invalidData = [
        mockSearchData[0],
        { slug: 'invalid', title: 123 },
        mockSearchData[1]
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidData)
      });

      const { loadSearchIndex: freshLoadSearchIndex } = await import('./search');
      const result = await freshLoadSearchIndex();
      expect(result).toHaveLength(2);
      expect(console.warn).toHaveBeenCalledWith('Filtered out 1 invalid search index items');
    });

    it('handles non-array response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ not: 'an array' })
      });

      const { loadSearchIndex: freshLoadSearchIndex } = await import('./search');
      const result = await freshLoadSearchIndex();
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Search index is not an array:',
        { not: 'an array' }
      );
    });

    it('caches the search index after first load', async () => {
      fetchMock.mockResolvedValueOnce({
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
      expect(fetchMock).toHaveBeenCalledTimes(1); // Should only fetch once
    });
  });

  describe('performSearch', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
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
      fetchMock.mockResolvedValue({
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
      fetchMock.mockResolvedValueOnce({
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

      fetchMock.mockResolvedValue({
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