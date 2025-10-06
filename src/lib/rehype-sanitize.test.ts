import { describe, it, expect } from 'vitest';
import rehypeSanitize from './rehype-sanitize';
import type { Element, Root, Properties } from 'hast';
import { visit } from 'unist-util-visit';

const testSchema = {
  tagNames: [
    'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'hr', 'img', 'li', 'ol', 'p', 'pre', 'span', 'strong', 'table', 'tbody', 'td', 'th',
    'thead', 'tr', 'ul'
  ],
  attributes: {
    a: ['href', 'title', 'rel', 'target'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    '*': ['className']
  }
};

function createTree(element: Element): Root {
  return {
    type: 'root',
    children: [element],
  };
}

function createElement(tagName: string, properties?: Properties, children: unknown[] = []): Element {
  return {
    type: 'element',
    tagName,
    properties: properties || {},
    children: children as Element[],
  };
}

describe('rehype-sanitize', () => {
  describe('tag filtering', () => {
    it('should remove disallowed tags', () => {
      const tree = createTree(createElement('script', {}, []));
      const transformer = rehypeSanitize(testSchema);
      transformer(tree);

      expect(tree.children.length).toBe(0);
    });

    it('should preserve allowed tags', () => {
      const tree = createTree(createElement('p', {}, []));
      const transformer = rehypeSanitize(testSchema);
      transformer(tree);

      expect(tree.children.length).toBe(1);
      expect((tree.children[0] as Element).tagName).toBe('p');
    });

    it('should remove multiple disallowed tags', () => {
      const tree: Root = {
        type: 'root',
        children: [
          createElement('script', {}),
          createElement('p', {}),
          createElement('iframe', {}),
        ],
      };
      const transformer = rehypeSanitize(testSchema);
      transformer(tree);

      expect(tree.children.length).toBe(1);
      expect((tree.children[0] as Element).tagName).toBe('p');
    });
  });

  describe('attribute filtering', () => {
    it('should remove event handler attributes (onclick)', () => {
      const tree = createTree(createElement('div', { onClick: 'alert(1)', className: 'test' }));
      const transformer = rehypeSanitize(testSchema);
      transformer(tree);

      const element = tree.children[0] as Element;
      expect(element.properties).toBeDefined();
      expect('onClick' in (element.properties || {})).toBe(false);
      expect((element.properties as Record<string, unknown>).className).toBe('test');
    });

    it('should remove event handler attributes (onerror)', () => {
      const tree = createTree(createElement('img', { src: 'x.jpg', onerror: 'alert(1)' }));
      const transformer = rehypeSanitize(testSchema);
      transformer(tree);

      const element = tree.children[0] as Element;
      expect(element.properties).toBeDefined();
      expect('onerror' in (element.properties || {})).toBe(false);
      expect((element.properties as Record<string, unknown>).src).toBe('x.jpg');
    });

    it('should remove disallowed attributes', () => {
      const tree = createTree(createElement('a', { href: '/test', 'data-custom': 'value' }));
      const transformer = rehypeSanitize(testSchema);
      transformer(tree);

      const element = tree.children[0] as Element;
      expect((element.properties as Record<string, unknown>).href).toBe('/test');
      expect('data-custom' in (element.properties || {})).toBe(false);
    });

    it('should preserve allowed tag-specific attributes', () => {
      const tree = createTree(createElement('a', { href: '/test', title: 'Test', rel: 'noopener', target: '_blank' }));
      const transformer = rehypeSanitize(testSchema);
      transformer(tree);

      const element = tree.children[0] as Element;
      const props = element.properties as Record<string, unknown>;
      expect(props.href).toBe('/test');
      expect(props.title).toBe('Test');
      expect(props.rel).toBe('noopener');
      expect(props.target).toBe('_blank');
    });

    it('should preserve wildcard (*) attributes like className', () => {
      const tree = createTree(createElement('p', { className: 'text-red' }));
      const transformer = rehypeSanitize(testSchema);
      transformer(tree);

      const element = tree.children[0] as Element;
      expect((element.properties as Record<string, unknown>).className).toBe('text-red');
    });
  });

  describe('edge cases', () => {
    it('should handle elements without properties', () => {
      const element: Partial<Element> = { type: 'element', tagName: 'p', children: [] };
      const tree = createTree(element as Element);
      const transformer = rehypeSanitize(testSchema);

      expect(() => transformer(tree)).not.toThrow();
    });

    it('should handle empty schema - preserves elements when no tagNames restriction', () => {
      const tree = createTree(createElement('p', { className: 'test' }));
      const transformer = rehypeSanitize({});
      transformer(tree);

      expect(tree.children.length).toBe(1);
      const element = tree.children[0] as Element;
      expect(Object.keys(element.properties || {}).length).toBe(0);
    });

    it('should handle schema with only tagNames', () => {
      const tree = createTree(createElement('p', { className: 'test', id: 'test' }));
      const transformer = rehypeSanitize({ tagNames: ['p'] });
      transformer(tree);

      const element = tree.children[0] as Element;
      expect(element.tagName).toBe('p');
      expect(Object.keys(element.properties || {}).length).toBe(0);
    });

    it('should handle schema with only attributes - preserves elements when no tagNames restriction', () => {
      const tree = createTree(createElement('script', { src: 'bad.js' }));
      const transformer = rehypeSanitize({ attributes: { script: ['src'] } });
      transformer(tree);

      expect(tree.children.length).toBe(1);
      const element = tree.children[0] as Element;
      expect((element.properties as Record<string, unknown>).src).toBe('bad.js');
    });

    it('should handle nested elements correctly', () => {
      const nestedElement = createElement('span', { className: 'inner' });
      const tree = createTree(createElement('p', { className: 'outer' }, [nestedElement]));
      const transformer = rehypeSanitize(testSchema);
      transformer(tree);

      let visitedElements = 0;
      visit(tree, 'element', () => {
        visitedElements++;
      });
      expect(visitedElements).toBe(2);
    });

    it('should handle elements with parent and index undefined', () => {
      const tree = createTree(createElement('p', {}));
      const transformer = rehypeSanitize(testSchema);

      expect(() => transformer(tree)).not.toThrow();
    });
  });

  describe('combined filtering', () => {
    it('should remove disallowed tag and all its attributes', () => {
      const tree = createTree(createElement('script', { src: 'bad.js', async: true }));
      const transformer = rehypeSanitize(testSchema);
      transformer(tree);

      expect(tree.children.length).toBe(0);
    });

    it('should preserve allowed tag but remove disallowed attributes', () => {
      const tree = createTree(createElement('img', {
        src: 'test.jpg',
        alt: 'Test',
        onerror: 'alert(1)',
        'data-custom': 'value'
      }));
      const transformer = rehypeSanitize(testSchema);
      transformer(tree);

      const element = tree.children[0] as Element;
      const props = element.properties as Record<string, unknown>;
      expect(props.src).toBe('test.jpg');
      expect(props.alt).toBe('Test');
      expect('onerror' in props).toBe(false);
      expect('data-custom' in props).toBe(false);
    });

    it('should handle all event handler prefixes', () => {
      const tree = createTree(createElement('div', {
        onclick: 'bad',
        onload: 'bad',
        onmouseover: 'bad',
        onfocus: 'bad',
        className: 'safe'
      }));
      const transformer = rehypeSanitize(testSchema);
      transformer(tree);

      const element = tree.children[0] as Element;
      const props = element.properties as Record<string, unknown>;
      expect((element.properties as Record<string, unknown>).className).toBe('safe');
      expect('onclick' in props).toBe(false);
      expect('onload' in props).toBe(false);
      expect('onmouseover' in props).toBe(false);
      expect('onfocus' in props).toBe(false);
    });
  });
});