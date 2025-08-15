'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

// Navigation configuration - single source of truth
const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/pages/about/', label: 'About' },
  { href: '/tags/', label: 'Tags' },
  { 
    href: '/rss.xml', 
    label: 'Feed', 
    isSpecial: true
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Reusable navigation link component
  const NavLink = ({ item, onClick, className = '' }: { 
    item: typeof navigationItems[0], 
    onClick?: () => void, 
    className?: string 
  }) => (
    <Link
      href={item.href}
      onClick={onClick}
      target={item.isExternal ? '_blank' : undefined}
      rel={item.isExternal ? 'noopener noreferrer' : undefined}
      className={`${
        item.isSpecial 
          ? 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200' 
          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
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
    </Link>
  );

  return (
    <header className="bg-slate-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Optional Rule
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-3 pt-4">
              {navigationItems.map((item) => (
                <NavLink 
                  key={item.href} 
                  item={item} 
                  onClick={closeMenu}
                  className="py-2"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}