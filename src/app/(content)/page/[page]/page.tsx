import { getPaginatedPosts, getAllPostsMeta } from '@/lib/content';
import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';
import { generatePaginationMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    page: string;
  }>;
}

export async function generateStaticParams() {
  const allPosts = getAllPostsMeta();
  const totalPages = Math.ceil(allPosts.length / 10);
  
  // Generate params for all pagination pages
  const pages = [];
  for (let i = 2; i <= totalPages; i++) {
    pages.push({ page: i.toString() });
  }
  
  return pages;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page } = await params;
  const pageNum = parseInt(page);
  
  return generatePaginationMetadata(pageNum);
}

export default async function PagePage({ params }: PageProps) {
  const { page } = await params;
  const pageNum = parseInt(page);
  
  if (isNaN(pageNum) || pageNum < 2) {
    notFound();
  }
  
  try {
    const { posts, totalPages, currentPage } = getPaginatedPosts(pageNum);
    
    if (posts.length === 0) {
      notFound();
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
            Blog Posts
          </h1>
          <div className="mb-6">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              basePath=""
            />
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
