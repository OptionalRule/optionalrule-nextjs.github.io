'use client';

import Link from 'next/link';
import { SearchResult, highlightMatches } from '@/lib/search';
import { formatDate, generatePostUrl } from '@/lib/utils';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
}

export function SearchResults({ results, query, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-zinc-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Search for posts
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Enter a search term to find relevant blog posts.
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No results found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No posts match your search for &quot;<span className="font-medium">{query}</span>&quot;.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Try different keywords or browse all posts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Found {results.length} result{results.length === 1 ? '' : 's'} for &quot;<span className="font-medium text-gray-900 dark:text-gray-100">{query}</span>&quot;
      </div>

      {/* Results list */}
      <div className="space-y-4">
        {results.map((result) => {
          const postUrl = generatePostUrl(result.item.date, result.item.slug);
          
          return (
            <article 
              key={result.item.slug} 
              className="bg-zinc-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden drop-shadow-lg hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                {/* Meta information */}
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                  <time dateTime={result.item.date}>
                    {formatDate(result.item.date)}
                  </time>
                  <span>•</span>
                  <span>{result.item.readingTime} min read</span>
                  {result.score && (
                    <>
                      <span>•</span>
                      <span className="text-xs">
                        {Math.round((1 - result.score) * 100)}% match
                      </span>
                    </>
                  )}
                </div>

                {/* Title with highlighting */}
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  <Link 
                    href={postUrl}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span 
                      dangerouslySetInnerHTML={{
                        __html: highlightMatches(result.item.title, result.matches)
                      }}
                    />
                  </Link>
                </h2>

                {/* Excerpt with highlighting */}
                {result.item.excerpt && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    <span 
                      dangerouslySetInnerHTML={{
                        __html: highlightMatches(result.item.excerpt, result.matches)
                      }}
                    />
                  </p>
                )}

                {/* Tags and read more */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {result.item.tags?.map((tag) => (
                      <Link
                        key={tag}
                        href={`/tag/${tag.toLowerCase()}/`}
                        className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>

                  <Link
                    href={postUrl}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium text-sm transition-colors"
                  >
                    Read more →
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}