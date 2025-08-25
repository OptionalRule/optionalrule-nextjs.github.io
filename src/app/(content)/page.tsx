import { getPaginatedPosts } from '@/lib/content';
import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';
import { generateHomeMetadata, generateBlogStructuredData, generateWebsiteStructuredData } from '@/lib/seo';
import type { Metadata } from 'next';
import { headers } from 'next/headers';

export const metadata: Metadata = generateHomeMetadata();

export default function Home() {
  const nonce = headers().get('x-nonce') ?? undefined;
  try {
    const { posts, totalPages, currentPage } = getPaginatedPosts(1);
    
    const blogStructuredData = generateBlogStructuredData(posts);
    const websiteStructuredData = generateWebsiteStructuredData();

    return (
      <>
        {/* JSON-LD Structured Data */}
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([blogStructuredData, websiteStructuredData]),
          }}
        />
        
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {totalPages > 1 && (
            <header className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
                Latest Posts
              </h1>
              <div className="mb-6">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  basePath=""
                />
              </div>
            </header>
          )}
          
          <main>
              <div className="grid gap-8 md:gap-6">
                {posts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>

              {posts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[var(--muted-2)]">
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
      </>
    );
  } catch (error) {
    console.error('Error loading posts:', error);
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Posts</h1>
          <p className="text-[var(--muted-2)]">
          There was an error loading the blog posts. Please try refreshing the page.
          </p>
          <pre className="mt-4 p-4 bg-[var(--surface-hover)] rounded text-sm overflow-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    );
  }
}
