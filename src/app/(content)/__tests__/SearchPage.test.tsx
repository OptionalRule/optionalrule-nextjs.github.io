import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import type { SearchResult as SearchHit } from '@/lib/search';

const mockSearchParams = vi.mocked(useSearchParams);

const searchInputSpy = vi.fn();
const searchResultsSpy = vi.fn();

vi.mock('@/components/SearchInput', () => ({
  SearchInput: (props: { onSearch: (query: string) => void }) => {
    searchInputSpy(props);
    return (
      <div>
        <button data-testid="trigger-search" onClick={() => props.onSearch('manual query')}>
          Trigger search
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/SearchResults', () => ({
  SearchResults: (props: { results: SearchHit[]; query: string; isLoading?: boolean }) => {
    searchResultsSpy(props);
    return (
      <div data-testid="search-results">
        {props.isLoading ? 'loading' : props.results.map((item) => item.item.title).join(',')}
      </div>
    );
  },
}));

vi.mock('@/lib/search', async () => {
  const actual = await vi.importActual<typeof import('@/lib/search')>('@/lib/search');
  return {
    ...actual,
    performSearch: vi.fn(),
  };
});

const searchModule = await vi.importMock<typeof import('@/lib/search')>('@/lib/search');
const performSearch = vi.mocked(searchModule.performSearch);

async function loadSearchPage() {
  const mod = await import('../search/page');
  return mod.default;
}

describe('Search page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue({
      get: vi.fn(() => ''),
    } as unknown as ReturnType<typeof useSearchParams>);
  });

  it('shows suspense fallback when search params suspend', async () => {
    const pending = new Promise<never>(() => {});
    mockSearchParams.mockImplementation(() => {
      throw pending;
    });

    const SearchPage = await loadSearchPage();

    render(<SearchPage />);

    expect(screen.getByText('Loading search...')).toBeInTheDocument();
  });

  it('initialises from URL query and loads results', async () => {
    const query = 'alchemy';
    mockSearchParams.mockReturnValue({
      get: vi.fn(() => query),
    } as unknown as ReturnType<typeof useSearchParams>);

    const results: SearchHit[] = [
      {
        item: {
          slug: 'alchemy-guide',
          title: 'Alchemy Guide',
          excerpt: 'Learn alchemy',
          tags: ['alchemy'],
          content: 'alchemy content',
          date: '2024-01-01',
          readingTime: 5,
        },
        score: 0.2,
      },
    ];

    performSearch.mockResolvedValueOnce(results);

    const SearchPage = await loadSearchPage();

    render(<SearchPage />);

    await waitFor(() => {
      expect(performSearch).toHaveBeenCalledWith({ query, limit: 50 });
    });

    await waitFor(() => {
      expect(searchResultsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          query,
          results,
          isLoading: false,
        })
      );
    });
  });

  it('handles manual search submission from the input', async () => {
    performSearch.mockResolvedValueOnce([]);

    const SearchPage = await loadSearchPage();

    render(<SearchPage />);

    await act(async () => {
      screen.getByTestId('trigger-search').click();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(performSearch).toHaveBeenCalledWith({ query: 'manual query', limit: 50 });
    });

    expect(searchResultsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'manual query' })
    );
  });
});
