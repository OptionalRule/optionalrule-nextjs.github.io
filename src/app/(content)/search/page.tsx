'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SearchInput } from '@/components/SearchInput';
import { SearchResults } from '@/components/SearchResults';
import { performSearch, SearchResult } from '@/lib/search';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');

  // Initialize search from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setCurrentQuery(urlQuery);
    if (urlQuery) {
      handleSearch(urlQuery);
    }
  }, [searchParams]);

  const handleSearch = async (searchQuery: string) => {
    setCurrentQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await performSearch({
        query: searchQuery,
        limit: 50, // Show more results on dedicated search page
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8 text-sm text-[var(--muted-2)]">
          <Link 
            href="/"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Home
          </Link>
          <span className="mx-2">›</span>
          <span className="text-[var(--foreground)]">Search</span>
        </nav>

        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
            Search Posts
          </h1>
          <p className="text-lg text-[var(--muted-2)] mb-8">
            Find blog posts by title, excerpt, or tags
          </p>
          
          {/* Search Input */}
          <div className="max-w-2xl mx-auto">
            <SearchInput
              onSearch={handleSearch}
              placeholder="Search for posts..."
              className="w-full"
            />
          </div>
        </header>

        <main>
          <SearchResults 
            results={results} 
            query={currentQuery} 
            isLoading={isLoading}
          />

          {/* Search Tips */}
          {!currentQuery && (
            <div className="mt-12 bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
                Search Tips
              </h3>
              <ul className="space-y-2 text-sm text-[var(--muted-2)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--link)] mt-0.5">•</span>
                  Use keywords from post titles, excerpts, or tags
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--link)] mt-0.5">•</span>
                  Search is fuzzy - typos and partial matches are supported
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--link)] mt-0.5">•</span>
                  Use <kbd className="px-2 py-1 bg-[var(--surface-hover)] rounded text-xs font-mono">⌘K</kbd> or <kbd className="px-2 py-1 bg-[var(--surface-hover)] rounded text-xs font-mono">Ctrl+K</kbd> to quickly focus the search box
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--link)] mt-0.5">•</span>
                  Results are ranked by relevance with title matches weighted highest
                </li>
              </ul>
            </div>
          )}

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="btn-secondary"
            >
              ← Back to Home
            </Link>
          </div>
        </main>
      </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--muted-2)]">Loading search...</div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
