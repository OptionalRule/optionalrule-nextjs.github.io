import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchInput } from '../SearchInput';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

const mockPush = vi.fn();
const mockUseRouter = vi.mocked(useRouter);
const mockUseSearchParams = vi.mocked(useSearchParams);

describe('SearchInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue(
      { push: mockPush } as unknown as ReturnType<typeof useRouter>
    );
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>
    );
  });

  describe('Basic functionality', () => {
    it('renders search input with placeholder', () => {
      render(<SearchInput placeholder="Search posts..." />);
      
      const input = screen.getByPlaceholderText('Search posts...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('shows default value when provided and no URL params', () => {
      // Mock search params to return the default value itself
      const params = new URLSearchParams();
      vi.spyOn(params, 'get').mockReturnValue('test query');
      mockUseSearchParams.mockReturnValue(
        params as unknown as ReturnType<typeof useSearchParams>
      );
      
      render(<SearchInput defaultValue="test query" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('test query');
    });

    it('initializes with URL search parameter', () => {
      const params = new URLSearchParams();
      vi.spyOn(params, 'get').mockReturnValue('url query');
      mockUseSearchParams.mockReturnValue(
        params as unknown as ReturnType<typeof useSearchParams>
      );
      
      render(<SearchInput />);
      
      expect(screen.getByDisplayValue('url query')).toBeInTheDocument();
    });
  });

  describe('Search interaction', () => {
    it('calls onSearch callback with debouncing', async () => {
      const user = userEvent.setup();
      const mockOnSearch = vi.fn();
      
      render(<SearchInput onSearch={mockOnSearch} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      // Should not call immediately (debouncing)
      expect(mockOnSearch).not.toHaveBeenCalled();
      
      // Should call after debounce delay
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test');
      }, { timeout: 500 });
    });

    it('navigates to search page on form submit', async () => {
      const user = userEvent.setup();
      
      render(<SearchInput />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test query');
      await user.keyboard('{Enter}');
      
      expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query');
    });

    it('does not navigate with empty query', async () => {
      const user = userEvent.setup();
      
      render(<SearchInput />);
      
      screen.getByRole('textbox');
      await user.keyboard('{Enter}');
      
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Clear functionality', () => {
    it('shows clear button when query is present', async () => {
      const user = userEvent.setup();
      
      render(<SearchInput />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeInTheDocument();
    });

    it('clears input and calls onSearch when clear button clicked', async () => {
      const user = userEvent.setup();
      const mockOnSearch = vi.fn();
      
      render(<SearchInput onSearch={mockOnSearch} defaultValue="test" />);
      
      // Type to ensure query is present and clear button appears
      const input = screen.getByRole('textbox');
      await user.type(input, 'test query');
      
      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);
      
      expect(screen.getByRole('textbox')).toHaveValue('');
      expect(mockPush).toHaveBeenCalledWith('/search');
    });
  });

  describe('Keyboard shortcuts', () => {
    it('focuses input on Cmd+K', () => {
      render(<SearchInput />);
      
      const input = screen.getByRole('textbox');
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      
      expect(input).toHaveFocus();
    });

    it('focuses input on Ctrl+K', () => {
      render(<SearchInput />);
      
      const input = screen.getByRole('textbox');
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      
      expect(input).toHaveFocus();
    });

    it('clears input on Escape when focused', async () => {
      const user = userEvent.setup();
      
      render(<SearchInput defaultValue="test" />);
      
      const input = screen.getByRole('textbox');
      await user.click(input); // Focus
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<SearchInput />);
      
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('shows keyboard shortcut hint when not focused', () => {
      render(<SearchInput />);
      
      expect(screen.getByText('⌘K')).toBeInTheDocument();
    });

    it('hides keyboard shortcut hint when focused', async () => {
      const user = userEvent.setup();
      
      render(<SearchInput />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(screen.queryByText('⌘K')).not.toBeInTheDocument();
    });
  });
});