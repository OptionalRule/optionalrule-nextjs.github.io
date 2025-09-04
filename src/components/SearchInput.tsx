'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  defaultValue?: string;
}

export function SearchInput({ 
  placeholder = "Search posts...", 
  className = "",
  onSearch,
  defaultValue = ""
}: SearchInputProps) {
  const [query, setQuery] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize with URL search param if available
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setQuery(urlQuery);
  }, [searchParams]);

  // Handle input changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onSearch) {
        onSearch(query);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Navigate to search page with query (ensure trailing slash for static export)
      router.push(`/search/?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
    // Update URL to remove query parameter
    router.push('/search/');
    if (onSearch) {
      onSearch('');
    }
  }, [router, onSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search input with Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Clear search with Escape
      if (e.key === 'Escape' && isFocused) {
        handleClear();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, handleClear]);

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-[var(--muted-2)]"
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
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-12 py-3 
            border border-[var(--border)] 
            rounded-md 
            bg-[var(--card)] 
            text-[var(--foreground)] 
            placeholder-[var(--muted-2)]
            focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent
            transition-colors
            ${isFocused ? 'ring-2 ring-blue-500' : ''}
          `}
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-8 flex items-center pr-3 text-[var(--muted-2)] hover:text-[var(--muted)] transition-colors"
            aria-label="Clear search"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted-2)] hover:text-[var(--muted)] transition-colors"
          aria-label="Search"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>

      {/* Keyboard Shortcut Hint */}
      {!isFocused && !query && (
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <span className="text-xs text-[var(--muted-2)] bg-[var(--surface-hover)] px-2 py-1 rounded border border-[var(--border)]">
            ⌘K
          </span>
        </div>
      )}
    </form>
  );
}
