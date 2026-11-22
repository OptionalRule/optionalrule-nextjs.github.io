import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
import { renderToStaticMarkup } from 'react-dom/server';
import { getAllPostsMeta, getPost, getAllPageSlugs, getPage } from '@/lib/content';
import { mdxComponents } from '@/lib/mdx-components';
import { mdxOptions } from '@/lib/mdx-options';
import { extractHeadings } from '@/lib/utils';
import publishedIds from './__fixtures__/page-heading-ids.json';

const GLOSSARY_PATH = path.join(
  process.cwd(),
  'src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md',
);

interface Rendered {
  key: string;
  tocIds: string[];
  pageIds: string[];
}

const renderIds = async (source: string): Promise<string[]> => {
  const { content } = await compileMDX({ source, components: mdxComponents, options: { mdxOptions } });
  const html = renderToStaticMarkup(content);
  return Array.from(html.matchAll(/<h[1-6][^>]*\sid="([^"]*)"/g), (m) => m[1]);
};

describe('heading ids across all published content', () => {
  const rendered: Rendered[] = [];

  beforeAll(async () => {
    const sources: Array<[string, string]> = [
      ...getAllPostsMeta().map((m): [string, string] => [`post:${m.slug}`, getPost(m.slug)?.content ?? '']),
      ...getAllPageSlugs().map((s): [string, string] => [`page:${s}`, getPage(s)?.content ?? '']),
      ['tool:star_system_generator/glossary', fs.readFileSync(GLOSSARY_PATH, 'utf8')],
    ];
    for (const [key, source] of sources) {
      rendered.push({
        key,
        tocIds: extractHeadings(source).map((h) => h.id),
        pageIds: await renderIds(source),
      });
    }
  }, 120000);

  it('gives the table of contents the same ids as the rendered headings', () => {
    const mismatched = rendered
      .filter(({ tocIds, pageIds }) => JSON.stringify(tocIds) !== JSON.stringify(pageIds))
      .map(({ key, tocIds, pageIds }) => ({ key, tocIds, pageIds }));
    expect(mismatched).toEqual([]);
  });

  it('keeps every published page id except the former object-object ids', () => {
    const snapshot = publishedIds as Record<string, string[]>;
    const changes: string[] = [];
    for (const { key, pageIds } of rendered) {
      const before = snapshot[key] ?? [];
      const length = Math.max(before.length, pageIds.length);
      for (let i = 0; i < length; i++) {
        if (before[i] !== pageIds[i]) changes.push(`${key}: ${before[i]} -> ${pageIds[i]}`);
      }
    }
    expect(changes).toEqual([
      'post:my-current-5e-house-rules: object-object -> spells',
      'post:thoughts-on-the-first-issue-of-arcadia: object-object -> i-do-not-do-reviews-disclaimer',
    ]);
  });
});
