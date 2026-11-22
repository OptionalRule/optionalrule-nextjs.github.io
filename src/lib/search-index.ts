import { getAllPostsMeta } from './content';
import type { SearchIndexItem } from './search';

export function buildSearchIndex(): SearchIndexItem[] {
  return getAllPostsMeta().map(post => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? '',
    tags: post.tags ?? [],
    content: '',
    date: post.date,
    readingTime: post.readingTime,
  }));
}
