import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';

interface SanitizeSchema {
  tagNames?: string[];
  attributes?: Record<string, string[]>;
}

/**
 * Minimal rehype plugin to sanitize HTML based on an allowlist schema.
 * Removes disallowed elements and attributes, including all event handlers.
 */
export default function rehypeSanitize(schema: SanitizeSchema = {}) {
  return function transformer(tree: Root) {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (!parent || typeof index !== 'number') return;

      // Remove disallowed tags
      if (schema.tagNames && !schema.tagNames.includes(node.tagName)) {
        parent.children.splice(index, 1);
        return [visit.SKIP, index];
      }

      // Filter attributes based on allowlist and remove event handlers
      const allowed = [
        ...(schema.attributes?.[node.tagName] || []),
        ...(schema.attributes?.['*'] || []),
      ];

      if (node.properties) {
        for (const key of Object.keys(node.properties)) {
          if (key.startsWith('on') || !allowed.includes(key)) {
            delete (node.properties as Record<string, unknown>)[key];
          }
        }
      }
    });
  };
}
