import { getPaginatedPosts } from '@/lib/content';
import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home | My Blog',
  description: 'A modern blog about web development, best practices, and emerging technologies.',
};

export default function Home() {
  try {
    const { posts, totalPages, currentPage } = getPaginatedPosts(1);

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
          <main>
            <div className="grid gap-8 md:gap-6">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>

            {posts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No posts found. Check back later for new content!
                </p>
              </div>
            )}

            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              basePath=""
            />
          </main>
        </div>
    );
  } catch (error) {
    console.error('Error loading posts:', error);
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Posts</h1>
          <p className="text-gray-600 dark:text-gray-400">
            There was an error loading the blog posts. Please try refreshing the page.
          </p>
          <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm overflow-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    );
  }
}
