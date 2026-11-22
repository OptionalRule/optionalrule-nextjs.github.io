import { visit } from 'unist-util-visit';
import type { Root, Element, ElementContent } from 'hast';
import { createHeadingIdAllocator } from './utils';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function textOf(node: ElementContent): string {
  if (node.type === 'text') return node.value;
  if (node.type === 'element') return node.children.map(textOf).join('');
  return '';
}

export default function rehypeHeadingIds() {
  return function transformer(tree: Root) {
    const allocateId = createHeadingIdAllocator();
    visit(tree, 'element', (node: Element) => {
      if (!HEADING_TAGS.has(node.tagName)) return;
      node.properties = { ...node.properties, id: allocateId(node.children.map(textOf).join('')) };
    });
  };
}
