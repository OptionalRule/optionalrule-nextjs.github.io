import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Make React available globally for JSX
(global as any).React = React;

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn(),
    append: vi.fn(),
    delete: vi.fn(),
    set: vi.fn(),
    sort: vi.fn(),
    toString: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: vi.fn((props) => {
    const { src, alt, fill, priority, sizes, className, ...rest } = props;
    return React.createElement('img', { 
      src, 
      alt, 
      className,
      ...rest 
    });
  }),
}));

// Mock Next.js Link component  
vi.mock('next/link', () => ({
  default: vi.fn((props) => {
    const { href, children, ...rest } = props;
    return React.createElement('a', { href, ...rest }, children);
  }),
}));

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

// Global cleanup
afterEach(() => {
  // Clean up any mounted components
  document.body.innerHTML = '';
});