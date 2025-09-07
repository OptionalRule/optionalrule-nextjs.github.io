import { describe, it, expect } from 'vitest';
import {
  formatDate,
  parseDateToUTC,
  capitalize,
  generatePageTitle,
  generateMetaDescription,
  generateHeadingId,
  extractHeadings,
  normalizeImagePath,
  createTagSlug,
  tagSlugToName,
} from './utils';

describe('Date utilities', () => {
  describe('formatDate', () => {
    it('formats YYYY-MM-DD to readable date', () => {
      expect(formatDate('2023-12-25')).toBe('December 25, 2023');
    });

    it('handles single digit months and days', () => {
      expect(formatDate('2023-01-05')).toBe('January 5, 2023');
    });
  });

  describe('parseDateToUTC', () => {
    it('parses date string to UTC components', () => {
      const result = parseDateToUTC('2023-12-25');
      expect(result).toEqual({ year: 2023, month: 12, day: 25 });
    });

    it('handles single digit values', () => {
      const result = parseDateToUTC('2023-01-05');
      expect(result).toEqual({ year: 2023, month: 1, day: 5 });
    });
  });

  // generatePostUrl tests moved to urls.test.ts
});

describe('String utilities', () => {
  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('handles empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('does not change already capitalized string', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });
  });

  describe('generatePageTitle', () => {
    it('creates title with site name', () => {
      expect(generatePageTitle('About', 'My Blog')).toBe('About | My Blog');
    });

    it('returns only site name when title is empty', () => {
      expect(generatePageTitle('', 'My Blog')).toBe('My Blog');
    });

    it('uses default site name when not provided', () => {
      expect(generatePageTitle('About')).toBe('About | My Blog');
    });
  });

  describe('generateMetaDescription', () => {
    it('uses description when provided', () => {
      expect(generateMetaDescription('Custom desc', 'Excerpt', 'Default')).toBe('Custom desc');
    });

    it('falls back to excerpt when no description', () => {
      expect(generateMetaDescription(undefined, 'Excerpt', 'Default')).toBe('Excerpt');
    });

    it('uses default when no description or excerpt', () => {
      expect(generateMetaDescription(undefined, undefined, 'Default')).toBe('Default');
    });
  });
});

describe('Heading utilities', () => {
  describe('generateHeadingId', () => {
    it('converts text to valid ID', () => {
      expect(generateHeadingId('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(generateHeadingId('Hello! World?')).toBe('hello-world');
    });

    it('handles multiple spaces and hyphens', () => {
      expect(generateHeadingId('Hello   World---Test')).toBe('hello-world-test');
    });

    it('removes leading and trailing hyphens', () => {
      expect(generateHeadingId('-Hello World-')).toBe('hello-world');
    });
  });

  describe('extractHeadings', () => {
    it('extracts headings with correct levels', () => {
      const content = `# Main Title
## Section One
### Subsection
## Section Two`;
      
      const headings = extractHeadings(content);
      expect(headings).toEqual([
        { level: 1, text: 'Main Title', id: 'main-title' },
        { level: 2, text: 'Section One', id: 'section-one' },
        { level: 3, text: 'Subsection', id: 'subsection' },
        { level: 2, text: 'Section Two', id: 'section-two' },
      ]);
    });

    it('handles empty content', () => {
      expect(extractHeadings('')).toEqual([]);
    });

    it('ignores non-heading content', () => {
      const content = `Some paragraph
# Real Heading
More content`;
      
      const headings = extractHeadings(content);
      expect(headings).toEqual([
        { level: 1, text: 'Real Heading', id: 'real-heading' },
      ]);
    });
  });
});

describe('Image utilities', () => {
  describe('normalizeImagePath', () => {
    it('keeps absolute URLs unchanged', () => {
      expect(normalizeImagePath('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
      expect(normalizeImagePath('http://example.com/image.jpg')).toBe('http://example.com/image.jpg');
    });

    it('keeps paths starting with / unchanged', () => {
      expect(normalizeImagePath('/images/test.jpg')).toBe('/images/test.jpg');
    });

    it('adds leading slash to relative paths', () => {
      expect(normalizeImagePath('images/test.jpg')).toBe('/images/test.jpg');
    });
  });
});

describe('Tag utilities', () => {
  describe('createTagSlug', () => {
    it('converts tag to URL-safe slug', () => {
      expect(createTagSlug('React Development')).toBe('react-development');
    });

    it('handles special characters', () => {
      expect(createTagSlug('D&D 5e')).toBe('dd-5e');
    });

    it('handles multiple spaces and special chars', () => {
      expect(createTagSlug('  React   &   TypeScript  ')).toBe('react-typescript');
    });

    it('removes leading and trailing hyphens', () => {
      expect(createTagSlug('-React-')).toBe('react');
    });
  });

  describe('tagSlugToName', () => {
    it('converts slug back to readable name', () => {
      expect(tagSlugToName('react-development')).toBe('react development');
    });

    it('handles single words', () => {
      expect(tagSlugToName('react')).toBe('react');
    });
  });
});