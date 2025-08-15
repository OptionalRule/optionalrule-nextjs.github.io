import { getPostsByTag, getAllTags } from '@/lib/content';
import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';
import { generateTagMetadata } from '@/lib/seo';
import { capitalize, createTagSlug } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface TagPageProps {
  params: Promise<{
    tag: string;
    page: string;
  }>;
}

export async function generateStaticParams() {
  const tags = getAllTags();
  const params: { tag: string; page: string }[] = [];
  
  for (const tag of tags) {
    const tagSlug = createTagSlug(tag);
    const tagData = getPostsByTag(tag, 1);
    
    // Generate params for pages 2 and beyond
    for (let page = 2; page <= tagData.totalPages; page++) {
      params.push({
        tag: tagSlug,
        page: page.toString()
      });
    }
  }
  
  return params;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag, page } = await params;
  const pageNum = parseInt(page);
  
  return generateTagMetadata(tag, pageNum);
}

export default async function TagPagePage({ params }: TagPageProps) {
  const { tag, page } = await params;
  const pageNum = parseInt(page);
  
  if (isNaN(pageNum) || pageNum < 2) {
    notFound();
  }
  
  const tagData = getPostsByTag(tag, pageNum);

  if (tagData.posts.length === 0) {
    notFound();
  }

  const { posts, totalPages, currentPage } = tagData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8 text-sm text-gray-600 dark:text-gray-400">
          <Link 
            href="/"
            className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            Home
          </Link>
          <span className="mx-2">›</span>
          <span>Tags</span>
          <span className="mx-2">›</span>
          <Link 
            href={`/tag/${createTagSlug(tagData.tag)}/`}
            className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            {capitalize(tagData.tag)}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900 dark:text-gray-200">Page {pageNum}</span>
        </nav>

        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Posts tagged with &ldquo;{capitalize(tagData.tag)}&rdquo;
          </h1>
          <div className="mb-6">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              basePath={`/tag/${createTagSlug(tagData.tag)}`}
            />
          </div>
          
          {/* Tag Navigation */}
          <div className="flex justify-center">
            <Link
              href="/tags/"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline text-sm"
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
    </div>
  );
}
