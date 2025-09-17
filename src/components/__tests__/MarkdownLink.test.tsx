import { render, screen } from '@testing-library/react';
import MarkdownLink from '../MarkdownLink';

describe('MarkdownLink', () => {
  it('composes SmartLink with default styling for internal links', () => {
    render(<MarkdownLink href="/pages/about/">About page</MarkdownLink>);
    const link = screen.getByRole('link', { name: 'About page' });
    expect(link).toHaveAttribute('href', '/pages/about/');
    expect(link.className).toContain('text-[var(--link)]');
    expect(link.className).toContain('underline');
  });

  it('inherits external link hardening from SmartLink', () => {
    render(<MarkdownLink href="https://example.com">External</MarkdownLink>);
    const link = screen.getByRole('link', { name: 'External' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    const rel = link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });
});
