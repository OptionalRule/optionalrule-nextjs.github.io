import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
import { renderToStaticMarkup } from 'react-dom/server';
import { getAllPostsMeta, getAllPageSlugs, getAllTags, getPost, POSTS_PER_PAGE } from '@/lib/content';
import { mdxOptions } from '@/lib/mdx-options';
import { mdxComponents } from '@/lib/mdx-components';
import { siteConfig } from '@/config/site';
import { urlPaths } from '@/lib/urls';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const INTERACTIVE_DIR = path.join(ROOT, 'src', 'app', '(interactive)');

const interactiveRoutes = (dir: string, prefix = ''): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return interactiveRoutes(path.join(dir, entry.name), `${prefix}/${entry.name}`);
    }
    return entry.name === 'page.tsx' ? [`${prefix}/`] : [];
  });

const knownRoutes = (): Set<string> => {
  const posts = getAllPostsMeta();
  const routes = new Set<string>([urlPaths.home(), urlPaths.tags(), urlPaths.search()]);
  posts.forEach((post) => routes.add(urlPaths.post(post.date, post.slug)));
  getAllPageSlugs().forEach((slug) => routes.add(urlPaths.staticPage(slug)));
  getAllTags().forEach((tag) => routes.add(urlPaths.tag(tag)));
  for (let page = 2; page <= Math.ceil(posts.length / POSTS_PER_PAGE); page++) {
    routes.add(urlPaths.page(page));
  }
  interactiveRoutes(INTERACTIVE_DIR).forEach((route) => routes.add(route));
  return routes;
};

const SITE_HOST = new URL(siteConfig.url).hostname.replace(/^www\./, '');

const toSitePath = (href: string): string | null => {
  if (href.startsWith('#') || href.startsWith('//')) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
  if (!/^https?:/i.test(href)) return null;
  const url = new URL(href);
  return url.hostname.replace(/^www\./, '') === SITE_HOST ? url.pathname : null;
};

const internalLinks = (source: string): string[] => {
  const inline = Array.from(source.matchAll(/\]\(\s*([^)\s]+)[^)]*\)/g), (m) => m[1]);
  const defs = Array.from(source.matchAll(/^ {0,3}\[[^\]]+\]:\s*(\S+)/gm), (m) => m[1]);
  return [...inline, ...defs].map(toSitePath).filter((href): href is string => href !== null);
};

const resolves = (href: string, routes: Set<string>): boolean => {
  if (!href.startsWith('/')) return false;
  const pathname = decodeURI(href.split(/[?#]/)[0]);
  if (routes.has(pathname)) return true;
  const file = path.join(PUBLIC_DIR, pathname);
  return file.startsWith(PUBLIC_DIR) && fs.existsSync(file) && fs.statSync(file).isFile();
};

describe('published content links', () => {
  const posts = getAllPostsMeta().map((meta) => getPost(meta.slug)).filter((post) => post !== null);

  it('points every internal link at a route or public file', () => {
    const routes = knownRoutes();
    const broken = posts.flatMap((post) =>
      internalLinks(post.content)
        .filter((href) => !resolves(href, routes))
        .map((href) => `${post.slug}: ${href}`),
    );
    expect(broken).toEqual([]);
  });

  it('points every featured image at a URL-safe public file', () => {
    const bad = posts
      .filter((post) => post.featured_image && !/^https?:/.test(post.featured_image))
      .filter((post) => {
        const image = post.featured_image as string;
        return /\s/.test(image) || !fs.existsSync(path.join(PUBLIC_DIR, image));
      })
      .map((post) => `${post.slug}: ${post.featured_image}`);
    expect(bad).toEqual([]);
  });

  it('renders no unresolved reference-style links', async () => {
    const unresolved: string[] = [];
    for (const post of posts) {
      const { content } = await compileMDX({ source: post.content, components: mdxComponents, options: { mdxOptions } });
      const text = renderToStaticMarkup(content);
      const match = text.match(/\]\[\w+\]/);
      if (match) unresolved.push(`${post.slug}: ${match[0]}`);
    }
    expect(unresolved).toEqual([]);
  }, 60000);
});
