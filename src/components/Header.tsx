'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, type ReactNode } from 'react';

type NavigationItem = {
  href: string;
  label: string;
  icon?: ReactNode;
  iconOnly?: boolean;
  isSpecial?: boolean;
  isExternal?: boolean;
  // When true, render as a plain <a> (e.g., static files like RSS)
  isFile?: boolean;
};

// Navigation configuration - single source of truth
const navigationItems: NavigationItem[] = [
  { href: '/', label: 'Home' },
  { href: '/pages/about/', label: 'About' },
  { href: '/tags/', label: 'Tags' },
  { 
    href: '/search', 
    label: 'Search',
    icon: (
      <svg
        className="w-5 h-5"
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
    ),
    iconOnly: true
  },
  { 
    href: '/rss.xml', 
    label: 'Feed',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"
        />
      </svg>
    ),
    isSpecial: true,
    iconOnly: true,
    // Using a regular anchor prevents Next.js prefetch of RSC flight data
    isFile: true
  },
  { 
    href: 'https://x.com/optionalrule', 
    label: 'X (Twitter)', 
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    isSpecial: true,
    isExternal: true,
    iconOnly: true
  }
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  // Rehydrate theme from the current document class (set by inline script)
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch (_) {
      // ignore storage failures
    }
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Reusable navigation link component
  const NavLink = ({ item, onClick, className = '' }: { 
    item: NavigationItem; 
    onClick?: () => void; 
    className?: string; 
  }) => (
    item.isExternal || item.isFile ? (
      <a
        href={item.href}
        onClick={onClick}
        target={item.isExternal ? '_blank' : undefined}
        rel={item.isExternal ? 'noopener noreferrer' : undefined}
        className={`${
          item.isSpecial 
            ? 'text-[var(--muted-2)] hover:text-[var(--foreground)]'
            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
        } font-medium transition-colors ${className}`}
        title={item.label}
      >
        {item.icon && (
          <span className="inline-flex items-center space-x-2">
            {item.icon}
            {!item.iconOnly && <span>{item.label}</span>}
          </span>
        )}
        {!item.icon && item.label}
      </a>
    ) : (
      <Link
        href={item.href}
        onClick={onClick}
        className={`${
          item.isSpecial 
            ? 'text-[var(--muted-2)] hover:text-[var(--foreground)]'
            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
        } font-medium transition-colors ${className}`}
        title={item.label}
        prefetch={false}
      >
        {item.icon && (
          <span className="inline-flex items-center space-x-2">
            {item.icon}
            {!item.iconOnly && <span>{item.label}</span>}
          </span>
        )}
        {!item.icon && item.label}
      </Link>
    )
  );

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-[100] relative shadow-sm">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <Image
                src="/brand/OptionalRuleIcon50x50XparentBG.png"
                alt="Optional Rule Logo"
                width={40}
                height={40}
                className="w-10 h-10"
                priority
              />
              <div>
                <h1 className="text-2xl font-bold text-[var(--foreground)]">
                  Optional Rule
                </h1>
                <p className="text-sm text-[var(--muted-2)] mt-1">
                  TTRPGs, game design, and all that happy stuff!
                </p>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-pressed={theme === 'dark'}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {/* Icon */}
              {theme === 'dark' ? (
                // Sun icon
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.95 6.95l-1.414-1.414M7.464 7.464 6.05 6.05m11.314 0-1.414 1.414M7.464 16.536 6.05 17.95M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                // Moon icon
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3c.05 0 .09 0 .14.01A7 7 0 0021 12.79z" />
                </svg>
              )}
              <span className="text-sm hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-[var(--border)]">
            <div className="flex flex-col space-y-3 pt-4">
              {navigationItems.map((item) => (
                <NavLink 
                  key={item.href} 
                  item={item} 
                  onClick={closeMenu}
                  className="py-2"
                />
              ))}
              <button
                type="button"
                onClick={() => { toggleTheme(); closeMenu(); }}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                aria-pressed={theme === 'dark'}
                className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.95 6.95l-1.414-1.414M7.464 7.464 6.05 6.05m11.314 0-1.414 1.414M7.464 16.536 6.05 17.95M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3c.05 0 .09 0 .14.01A7 7 0 0021 12.79z" />
                  </svg>
                )}
                <span className="text-sm">{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
