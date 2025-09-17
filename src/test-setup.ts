import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

import { createNextNavigationModuleMock, resetNextNavigationMocks } from '@/test-utils/mocks';

// Shared testing helpers:
// - Next navigation: call `setMockRouter`, `setMockSearchParams`, or `setMockPathname` from '@/test-utils/mocks'.
// - Fetch: use `mockGlobalFetch()` from '@/test-utils/mocks' and reset via the returned helpers.

// Make React available globally for JSX
(globalThis as unknown as { React: typeof React }).React = React;

// Mock Next.js navigation helpers once; tests can customise via '@/test-utils/mocks'.
vi.mock('next/navigation', () => createNextNavigationModuleMock());

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: vi.fn(
    (props: React.ComponentProps<'img'> & { fill?: boolean; priority?: boolean; sizes?: string }) => {
      const { src, alt, className, fill: _fill, priority: _priority, sizes: _sizes, ...rest } = props;
      return React.createElement('img', {
        src,
        alt,
        className,
        ...rest
      });
    }
  ),
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
  resetNextNavigationMocks();
});

// Global cleanup
afterEach(() => {
  // Clean up any mounted components
  document.body.innerHTML = '';
});
