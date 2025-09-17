import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('Footer navigation', () => {
  it('exposes canonical footer links with correct slashes', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'About' }).getAttribute('href')).toBe('/pages/about/');
    expect(screen.getByRole('link', { name: 'Tags' }).getAttribute('href')).toBe('/tags/');
    expect(screen.getByRole('link', { name: 'RSS' }).getAttribute('href')).toBe('/rss.xml');
    expect(screen.getByRole('link', { name: 'Sitemap' }).getAttribute('href')).toBe('/sitemap.xml');
  });
});
