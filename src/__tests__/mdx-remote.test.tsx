import { describe, it, expect } from 'vitest';
import { compileMDX } from 'next-mdx-remote/rsc';
import { renderToString } from 'react-dom/server';

// Unit tests to ensure MDXRemote sanitizes potentially dangerous attributes

describe('MDXRemote sanitization', () => {
  it('removes dangerous event handlers from MDX content', async () => {
    const malicious = "<img src='x' onerror='alert(1)' /><div onclick='alert(1)'>Test</div>";
    const { content } = await compileMDX({ source: malicious });
    const html = renderToString(content);
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('alert(1)');
  });
});
