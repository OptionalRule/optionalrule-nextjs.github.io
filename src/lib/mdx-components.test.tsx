import { describe, it, expect } from 'vitest';
import { compileMDX } from 'next-mdx-remote/rsc';
import { renderToStaticMarkup } from 'react-dom/server';
import { mdxComponents } from './mdx-components';
import { mdxOptions } from './mdx-options';

const render = async (source: string): Promise<string> => {
  const { content } = await compileMDX({ source, components: mdxComponents, options: { mdxOptions } });
  return renderToStaticMarkup(content);
};

describe('mdxComponents', () => {
  it('renders markdown headings through HeadingAnchor with a self-link', async () => {
    const html = await render('## Getting Started');
    expect(html).toContain('<h2 id="getting-started"');
    expect(html).toContain('href="#getting-started"');
  });

  it.each([
    ['## Design & Running', 'design--running'],
    ['### Rule Zero – No Risk, No Roll', 'rule-zero--no-risk-no-roll'],
    ['#### Integration and Discovery:', 'integration-and-discovery'],
  ])('keeps the published id for %s', async (source, id) => {
    expect(await render(source)).toContain(`id="${id}"`);
  });

  it('suffixes duplicate heading ids per render without leaking between pages', async () => {
    const html = await render('## Rare\n\n## Rare');
    expect(html).toContain('<h2 id="rare"');
    expect(html).toContain('<h2 id="rare-1"');
    expect(html).toContain('href="#rare-1"');
    expect(await render('## Rare')).toContain('<h2 id="rare"');
  });

  it('routes links through MarkdownLink', async () => {
    const html = await render('[About](/pages/about/)');
    expect(html).toContain('href="/pages/about/"');
  });
});
