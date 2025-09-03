import { getAllTags, getPostsByTag } from '@/lib/content';
import { capitalize, createTagSlug } from '@/lib/utils';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Tags',
  description: 'Browse all tags used across the blog posts. Find content by topic and category.',
};

export default function TagsPage() {
  const tags = getAllTags();
  
  // Get post count for each tag
  const tagsWithCounts = tags.map(tag => ({
    name: tag,
    count: getPostsByTag(tag, 1).posts.length + (getPostsByTag(tag, 1).totalPages - 1) * 10,
    slug: createTagSlug(tag),
  })).sort((a, b) => b.count - a.count); // Sort by post count descending

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8 text-sm text-[var(--muted-2)]">
          <Link 
            href="/"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Home
          </Link>
          <span className="mx-2">›</span>
          <span className="text-[var(--foreground)]">All Tags</span>
        </nav>

        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
            All Tags
          </h1>
          <p className="text-lg text-[var(--muted-2)]">
            Browse content by topic and category
          </p>
        </header>

        <main>
          {tagsWithCounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--muted-2)]">
                No tags found. Create some blog posts with tags to see them here!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tagsWithCounts.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/tag/${tag.slug}/`}
                  className="group block p-6 bg-[var(--card)] rounded-lg border border-[var(--border)] hover:shadow-lg hover:border-[var(--link)] transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-[var(--foreground)] group-hover:text-[var(--link)] transition-colors">
                      {capitalize(tag.name)}
                    </h2>
                    <span className="text-sm text-[var(--muted-2)] bg-[var(--surface-hover)] px-2 py-1 rounded-full">
                      {tag.count} {tag.count === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-[var(--muted-2)]">
                    View all posts tagged with {tag.name.toLowerCase()}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
