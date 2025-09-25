'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, type ReactNode } from 'react';
import { urlPaths } from '@/lib/urls';

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

type NavigationDropdown = {
  label: string;
  href?: string; // Optional href for the dropdown trigger itself
  items: NavigationItem[];
};

type NavigationGroup = NavigationItem | NavigationDropdown;

// Helper function to check if an item is a dropdown
const isDropdown = (item: NavigationGroup): item is NavigationDropdown => {
  return 'items' in item;
};

// Navigation configuration - single source of truth
const navigationItems: NavigationGroup[] = [
  {
    label: 'Blog',
    href: urlPaths.home(),
    items: [
      { href: urlPaths.tags(), label: 'Tags' },
      { href: urlPaths.search(), label: 'Search' },
      { href: urlPaths.staticPage('about'), label: 'About' }
    ]
  },
  {
    label: 'Games',
    items: [
      { href: urlPaths.game('asteroids'), label: 'Asteroids' }
    ]
  },
  {
    label: 'Tools',
    items: [
      { href: urlPaths.tool('kcd2_alchemy'), label: 'KCD2 Alchemy Scholar' },
      { href: urlPaths.tool('torch_tracker'), label: 'Torch Tracker' }
    ]
  }
];

// Utility navigation items (icons only)
const utilityItems: NavigationItem[] = [
  { 
    href: urlPaths.search(), 
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Rehydrate theme from the current document class (set by inline script)
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (openDropdown && !target.closest('.relative')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
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

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
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
        } text-sm font-semibold transition-all duration-300 hover:scale-105 ${className}`}
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
        } text-sm font-semibold transition-all duration-300 hover:scale-105 ${className}`}
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

  // Dropdown component for desktop
  const DropdownMenu = ({ dropdown }: { dropdown: NavigationDropdown }) => {
    const isOpen = openDropdown === dropdown.label;
    
    return (
      <div 
        className="relative"
        onMouseEnter={() => setOpenDropdown(dropdown.label)}
        onMouseLeave={closeDropdown}
      >
        <button
          onClick={() => handleDropdownToggle(dropdown.label)}
          className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm font-semibold transition-all duration-300 hover:scale-105 inline-flex items-center space-x-1"
        >
          {dropdown.href ? (
            <Link href={dropdown.href} className="hover:text-[var(--foreground)]">
              {dropdown.label}
            </Link>
          ) : (
            <span>{dropdown.label}</span>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div
            className="absolute top-full left-0 bg-[var(--surface)] border border-[var(--border)] rounded-md shadow-lg py-2 min-w-48 z-50"
          >
            {dropdown.items.map((item) => (
              <div key={item.href} className="px-4 py-2 hover:bg-[var(--surface-hover)]">
                <NavLink item={item} onClick={closeDropdown} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="bg-gradient-to-r from-[var(--surface)] to-[var(--surface-2)] border-b border-[var(--border)] sticky top-0 z-[100] relative shadow-lg backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <nav className="flex items-center justify-between min-h-[4rem]">
          <div className="flex items-center space-x-4">
            <Link href={urlPaths.home()} className="flex items-center space-x-4 hover:opacity-80 transition-all duration-300 group">
              <Image
                src="/brand/OptionalRuleIcon50x50XparentBG.png"
                alt="Optional Rule Logo"
                width={44}
                height={44}
                className="w-11 h-11 group-hover:scale-105 transition-transform duration-300"
                priority
              />
              <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-semibold text-[var(--foreground)] leading-tight tracking-tight">
                  Optional Rule
                </h1>
                <p className="text-xs font-medium text-[var(--text-tertiary)] leading-tight">
                  TTRPGs, game design, and all that happy stuff!
                </p>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              isDropdown(item) ? (
                <DropdownMenu key={item.label} dropdown={item} />
              ) : (
                <NavLink key={item.href} item={item} />
              )
            ))}
            {utilityItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-pressed={theme === 'dark'}
              className="inline-flex items-center justify-center w-10 h-10 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all duration-300 hover:scale-105"
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
                isDropdown(item) ? (
                  <div key={item.label} className="flex flex-col">
                    {/* Mobile dropdown trigger */}
                    <button
                      onClick={() => handleDropdownToggle(`mobile-${item.label}`)}
                      className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm font-semibold py-3 flex items-center justify-between transition-all duration-300"
                    >
                      <span className="flex items-center space-x-2">
                        {item.href ? (
                          <Link href={item.href} onClick={closeMenu}>
                            {item.label}
                          </Link>
                        ) : (
                          <span>{item.label}</span>
                        )}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${openDropdown === `mobile-${item.label}` ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {/* Mobile dropdown items */}
                    {openDropdown === `mobile-${item.label}` && (
                      <div className="pl-4 flex flex-col space-y-2">
                        {item.items.map((subItem) => (
                          <NavLink
                            key={subItem.href}
                            item={subItem}
                            onClick={closeMenu}
                            className="py-1 text-sm"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink 
                    key={item.href} 
                    item={item} 
                    onClick={closeMenu}
                    className="py-3"
                  />
                )
              ))}
              {utilityItems.map((item) => (
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
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
