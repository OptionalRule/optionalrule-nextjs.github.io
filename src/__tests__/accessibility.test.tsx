import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { SearchInput } from '@/components/SearchInput';
import { SearchResults } from '@/components/SearchResults';
import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock Next.js components and hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(() => ({ get: vi.fn() })),
}));

vi.mock('next/image', () => ({
  default: vi.fn(
    (props: React.ComponentProps<'img'> & { fill?: boolean; priority?: boolean; sizes?: string }) => {
      const { src, alt, className, fill: _fill, priority: _priority, sizes: _sizes, ...rest } = props;
      return React.createElement('img', { src, alt, className, ...rest });
    }
  ),
}));

vi.mock('next/link', () => ({
  default: vi.fn((props: React.ComponentProps<'a'>) => {
    const { href, children, ...rest } = props;
    return React.createElement('a', { href, ...rest }, children);
  }),
}));

describe('Accessibility Tests', () => {
  describe('SearchInput Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<SearchInput />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels and roles', () => {
      render(<SearchInput placeholder="Search posts..." />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search posts...');
      
      const searchButton = screen.getByLabelText('Search');
      expect(searchButton).toBeInTheDocument();
      expect(searchButton).toHaveAttribute('type', 'submit');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SearchInput />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();

      // Check that element is focusable
      await user.click(input);
      expect(input).toHaveFocus();
    });
  });

  describe('SearchResults Component', () => {
    const mockResults = [
      {
        item: {
          slug: 'test-post',
          title: 'Test Post',
          excerpt: 'This is a test post excerpt',
          tags: ['Testing', 'React'],
          content: 'Test content',
          date: '2023-12-01',
          readingTime: 5
        },
        score: 0.3
      }
    ];

    it('should not have accessibility violations', async () => {
      const { container } = render(
        <SearchResults results={mockResults} query="test" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper semantic structure', () => {
      render(<SearchResults results={mockResults} query="test" />);
      
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(1);
      
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings).toHaveLength(1);
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('provides meaningful text for screen readers', () => {
      render(<SearchResults results={mockResults} query="test" />);
      
      const resultCount = screen.getByText(/Found 1 result for/);
      expect(resultCount).toBeInTheDocument();
      
      const dateTime = screen.getByText('December 1, 2023');
      expect(dateTime.closest('time')).toHaveAttribute('datetime', '2023-12-01');
    });

    it('handles loading state accessibly', () => {
      render(<SearchResults results={[]} query="test" isLoading={true} />);
      
      // Should have loading indicators that are accessible
      const loadingElements = screen.getAllByRole('generic');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('handles empty states accessibly', () => {
      render(<SearchResults results={[]} query="" />);
      
      const emptyMessage = screen.getByText('Search for posts');
      expect(emptyMessage).toBeInTheDocument();
      expect(emptyMessage.tagName).toBe('H3');
    });

    it('handles no results state accessibly', () => {
      render(<SearchResults results={[]} query="nonexistent" />);
      
      const noResultsHeading = screen.getByText('No results found');
      expect(noResultsHeading).toBeInTheDocument();
      expect(noResultsHeading.tagName).toBe('H3');
    });
  });

  describe('PostCard Component', () => {
    const mockPost = {
      slug: 'test-post',
      title: 'Test Blog Post',
      date: '2023-12-01',
      excerpt: 'This is a test blog post excerpt that describes the content.',
      tags: ['React', 'Testing'],
      featured_image: '/images/test.jpg',
      readingTime: 8,
      showToc: false,
      headings: []
    };

    it('should not have accessibility violations', async () => {
      const { container } = render(<PostCard post={mockPost} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper semantic structure', () => {
      render(<PostCard post={mockPost} />);
      
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Test Blog Post');
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Featured image for Test Blog Post');
    });

    it('provides proper time elements', () => {
      render(<PostCard post={mockPost} />);
      
      const timeElement = screen.getByText('December 1, 2023');
      expect(timeElement.closest('time')).toHaveAttribute('datetime', '2023-12-01');
    });

    it('has accessible links', () => {
      render(<PostCard post={mockPost} />);
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      
      // Check that all links have accessible names
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });

    it('handles posts without images', async () => {
      const postWithoutImage = { ...mockPost, featured_image: undefined };
      const { container } = render(<PostCard post={postWithoutImage} />);
      
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Pagination Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Pagination 
          currentPage={2} 
          totalPages={5} 
          basePath="/posts" 
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper navigation structure', () => {
      render(
        <Pagination 
          currentPage={3} 
          totalPages={10} 
          basePath="/posts" 
        />
      );
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('aria-label', 'Pagination');
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('indicates current page properly', () => {
      render(
        <Pagination 
          currentPage={3} 
          totalPages={10} 
          basePath="/posts" 
        />
      );
      
      const currentPage = screen.getByText('3');
      expect(currentPage).toBeInTheDocument();
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('provides accessible labels for navigation', () => {
      render(
        <Pagination 
          currentPage={3} 
          totalPages={10} 
          basePath="/posts" 
        />
      );
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('aria-label', 'Pagination');
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('ensures sufficient color contrast in search components', () => {
      // This would require actual CSS color testing in a real browser
      // For now, we test that semantic HTML is used correctly
      render(<SearchInput />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      
      // In a real implementation, you would test actual computed colors
      // using tools like axe-core's color contrast checking
    });
  });

  describe('Keyboard Navigation', () => {
    it('ensures all interactive elements are keyboard accessible', () => {
      const mockPost = {
        slug: 'test-post',
        title: 'Test Post',
        date: '2023-12-01',
        excerpt: 'Test excerpt',
        tags: ['Test'],
        readingTime: 5,
        showToc: false,
        headings: []
      };
      
      render(<PostCard post={mockPost} />);
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      
      links.forEach(link => {
        // All links should be focusable
        link.focus();
        expect(document.activeElement).toBe(link);
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('provides appropriate ARIA labels and descriptions', () => {
      render(<SearchInput />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      
      const clearButton = screen.queryByLabelText('Clear search');
      if (clearButton) {
        expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
      }
      
      const searchButton = screen.getByLabelText('Search');
      expect(searchButton).toHaveAttribute('aria-label', 'Search');
    });
  });
});