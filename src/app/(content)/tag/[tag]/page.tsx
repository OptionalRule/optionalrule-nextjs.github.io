import { getPostsByTag, getAllTags, POSTS_PER_PAGE } from '@/lib/content';
import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';
import { generateTagMetadata } from '@/lib/seo';
import { capitalize, createTagSlug } from '@/lib/utils';
import { urlPaths } from '@/lib/urls';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface TagPageProps {
  params: Promise<{
    tag: string;
  }>;
}

export async function generateStaticParams() {
  const tags = getAllTags();
  
  return tags.map((tag) => ({
    tag: createTagSlug(tag),
  }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const tagData = getPostsByTag(tag, 1);
  
  if (tagData.posts.length === 0) {
    return {
      title: 'Tag Not Found',
    };
  }
  
  return generateTagMetadata(tag);
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const tagData = getPostsByTag(tag, 1);

  if (tagData.posts.length === 0) {
    notFound();
  }

  const { posts, totalPages, currentPage } = tagData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8 text-sm text-[var(--muted-2)]">
          <Link 
            href={urlPaths.home()}
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Home
          </Link>
          <span className="mx-2">›</span>
          <Link 
            href={urlPaths.tags()}
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Tags
          </Link>
          <span className="mx-2">›</span>
          <span className="text-[var(--foreground)]">{capitalize(tagData.tag)}</span>
        </nav>

        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
            Posts tagged with &ldquo;{capitalize(tagData.tag)}&rdquo;
          </h1>
          <p className="text-lg text-[var(--muted-2)] mb-6">
            {(() => {
              const total = tagData.posts.length + (totalPages - 1) * POSTS_PER_PAGE;
              return total === 1 ? '1 post found' : `${total} posts found`;
            })()}
          </p>
          
          {totalPages > 1 && (
            <div className="mb-6">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={`/tag/${createTagSlug(tagData.tag)}`}
              />
            </div>
          )}
          
          {/* Tag Navigation */}
          <div className="flex justify-center">
            <Link
              href={urlPaths.tags()}
              className="text-[var(--link)] hover:text-[var(--link-hover)] underline text-sm"
            >
              View all tags →
            </Link>
          </div>
        </header>

        <main>
          <div className="grid gap-8 md:gap-6">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/tag/${createTagSlug(tagData.tag)}`}
          />
        </main>
      </div>
  );
}
