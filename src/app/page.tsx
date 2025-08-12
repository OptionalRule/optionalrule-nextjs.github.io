import { getPaginatedPosts } from '@/lib/content';
import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home | My Blog',
  description: 'A modern blog about web development, best practices, and emerging technologies.',
};

export default function Home() {
  const { posts, totalPages, currentPage, hasNextPage, hasPrevPage } = getPaginatedPosts(1);

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
}
