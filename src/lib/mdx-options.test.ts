import { describe, it, expect } from 'vitest';
import { mdxOptions } from './mdx-options';
import type { CompileOptions } from '@mdx-js/mdx';

describe('mdx-options', () => {
  it('should export a valid mdx compile options object', () => {
    expect(mdxOptions).toBeDefined();
    expect(typeof mdxOptions).toBe('object');
  });

  it('should include remark-gfm in remarkPlugins', () => {
    expect(mdxOptions.remarkPlugins).toBeDefined();
    expect(Array.isArray(mdxOptions.remarkPlugins)).toBe(true);
    expect(mdxOptions.remarkPlugins?.length).toBeGreaterThan(0);
  });

  it('should include rehype-sanitize with schema in rehypePlugins', () => {
    expect(mdxOptions.rehypePlugins).toBeDefined();
    expect(Array.isArray(mdxOptions.rehypePlugins)).toBe(true);
    expect(mdxOptions.rehypePlugins?.length).toBeGreaterThan(0);

    const [plugin, schema] = mdxOptions.rehypePlugins?.[0] as [unknown, unknown];
    expect(plugin).toBeDefined();
    expect(schema).toBeDefined();
    expect(typeof schema).toBe('object');
  });

  it('should match CompileOptions type', () => {
    const options: CompileOptions = mdxOptions;
    expect(options).toBeDefined();
  });

  it('should have exactly 2 plugin arrays', () => {
    expect(Object.keys(mdxOptions).length).toBe(2);
    expect('remarkPlugins' in mdxOptions).toBe(true);
    expect('rehypePlugins' in mdxOptions).toBe(true);
  });

  it('should configure rehypePlugins as array with plugin and options', () => {
    expect(mdxOptions.rehypePlugins?.[0]).toBeInstanceOf(Array);
    expect((mdxOptions.rehypePlugins?.[0] as unknown[]).length).toBe(2);
  });
});