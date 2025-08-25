import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from '@/lib/rehype-sanitize';
import { sanitizeSchema } from '@/lib/sanitize-schema';
import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';

function processMDX(mdx: string) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize, sanitizeSchema);

  return processor.runSync(processor.parse(mdx)) as Root;
}

describe('MDX sanitization', () => {
  it('removes script elements', () => {
    const tree = processMDX('Safe<script>alert(1)</script>');
    let hasScript = false;
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'script') hasScript = true;
    });
    expect(hasScript).toBe(false);
  });

  it('strips event handler attributes', () => {
    const tree = processMDX('<img src="x" onerror="alert(1)" />');
    let hasOnError = false;
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'img' && 'onerror' in (node.properties || {})) {
        hasOnError = true;
      }
    });
    expect(hasOnError).toBe(false);
  });
});
