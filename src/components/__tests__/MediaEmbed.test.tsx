import { render, screen } from '@testing-library/react';
import MediaEmbed from '../MediaEmbed';

const originalIframeSrcDescriptor = Object.getOwnPropertyDescriptor(window.HTMLIFrameElement.prototype, 'src');

beforeAll(() => {
  Object.defineProperty(window.HTMLIFrameElement.prototype, 'src', {
    configurable: true,
    get() {
      return '';
    },
    set() {
      // no-op to prevent happy-dom from attempting network requests
    },
  });
});

afterAll(() => {
  if (originalIframeSrcDescriptor) {
    Object.defineProperty(window.HTMLIFrameElement.prototype, 'src', originalIframeSrcDescriptor);
  }
});

describe('MediaEmbed', () => {
  it('renders fallback for disallowed hosts', () => {
    render(<MediaEmbed url="https://example.com/evil" />);

    expect(screen.getByText('Unsupported media URL')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Open in new tab' });
    expect(link).toHaveAttribute('href', 'https://example.com/evil');
    expect(link).toHaveAttribute('target', '_blank');
    const rel = link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  it('rejects non-https urls and shows fallback link', () => {
    render(<MediaEmbed url="http://youtube.com/watch?v=abc123" />);
    expect(screen.getByText('Unsupported media URL')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open in new tab' }).getAttribute('href')).toBe('http://youtube.com/watch?v=abc123');
  });

  it('embeds youtube videos via iframe', () => {
    render(<MediaEmbed url="https://www.youtube.com/watch?v=abc123" title="Sample video" />);
    const iframe = screen.getByTitle('Sample video');
    expect(iframe.tagName).toBe('IFRAME');
  });

  it('normalizes vimeo links to player embed', () => {
    render(<MediaEmbed url="https://vimeo.com/123456" title="Vimeo clip" />);
    const iframe = screen.getByTitle('Vimeo clip');
    expect(iframe.tagName).toBe('IFRAME');
  });
});
