import { render, screen } from '@testing-library/react';
import SmartLink from '../SmartLink';

describe('SmartLink', () => {
  it('renders internal links without forcing new tab', () => {
    render(<SmartLink href="/pages/about/">About</SmartLink>);
    const link = screen.getByRole('link', { name: 'About' });
    expect(link).toHaveAttribute('href', '/pages/about/');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('adds security attributes for external links', () => {
    render(<SmartLink href="https://example.com/docs">Docs</SmartLink>);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('target', '_blank');
    const rel = link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  it('handles protocol links without overriding target', () => {
    render(<SmartLink href="mailto:test@example.com" target="_self">Email us</SmartLink>);
    const link = screen.getByRole('link', { name: 'Email us' });
    expect(link).toHaveAttribute('href', 'mailto:test@example.com');
    expect(link).toHaveAttribute('target', '_self');
  });

  it('falls back to anchor for relative URLs', () => {
    render(<SmartLink href="docs/guide">Guide</SmartLink>);
    const link = screen.getByRole('link', { name: 'Guide' });
    expect(link).toHaveAttribute('href', 'docs/guide');
    expect(link).not.toHaveAttribute('target');
  });
});
