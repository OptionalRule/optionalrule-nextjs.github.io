import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getVisiblePages, Pagination } from '@/components/Pagination';

const hrefs = (markup: string): string[] =>
  Array.from(markup.matchAll(/href="([^"]*)"/g), (m) => m[1]);

describe('getVisiblePages', () => {
  it('shows first pages when near start', () => {
    expect(getVisiblePages(2, 10)).toEqual([1,2,3,4,5]);
  });

  it('shows last pages when near end', () => {
    expect(getVisiblePages(9, 10)).toEqual([6,7,8,9,10]);
  });

  it('returns all pages when total pages less than max', () => {
    expect(getVisiblePages(1, 3)).toEqual([1,2,3]);
  });
});

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    expect(renderToStaticMarkup(<Pagination currentPage={1} totalPages={1} />)).toBe('');
  });

  it('links home pages to / and /page/N/', () => {
    const markup = renderToStaticMarkup(<Pagination currentPage={2} totalPages={3} />);
    expect(hrefs(markup)).toEqual(['/', '/', '/page/2/', '/page/3/', '/page/3/']);
    expect(markup).toContain('aria-current="page"');
  });

  it('links tag pages under the tag path', () => {
    const markup = renderToStaticMarkup(
      <Pagination currentPage={1} totalPages={2} tag="Game Development" />,
    );
    expect(hrefs(markup)).toEqual([
      '/tag/game-development/',
      '/tag/game-development/page/2/',
      '/tag/game-development/page/2/',
    ]);
  });
});
