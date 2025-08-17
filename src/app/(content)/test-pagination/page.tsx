import { getPaginatedPosts, getAllPostsMeta } from '@/lib/content';
import { Pagination } from '@/components/Pagination';

export default function TestPaginationPage() {
  const allPosts = getAllPostsMeta();
  const totalPages = Math.ceil(allPosts.length / 10);
  
  // Test different page numbers
  const testPages = [1, 2, 3].filter(page => page <= totalPages);
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Pagination Test Page</h1>
      
      <div className="mb-8 p-4 bg-[var(--surface-hover)] rounded">
        <h2 className="text-xl font-semibold mb-2">Debug Info:</h2>
        <p>Total posts: {allPosts.length}</p>
        <p>Posts per page: 10</p>
        <p>Total pages: {totalPages}</p>
        <p>Test pages: {testPages.join(', ')}</p>
      </div>
      
      <div className="space-y-8">
        {testPages.map(page => {
          const { posts, totalPages: pageTotalPages, currentPage } = getPaginatedPosts(page);
          
          return (
            <div key={page} className="border border-[var(--border)] rounded p-4">
              <h3 className="text-lg font-semibold mb-2">Page {page} (showing {posts.length} posts)</h3>
              <p className="text-sm text-[var(--muted-2)] mb-2">
                Current: {currentPage}, Total: {pageTotalPages}
              </p>
              
              <div className="mb-4">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={pageTotalPages}
                  basePath=""
                />
              </div>
              
              <div className="text-sm">
                <p>First post: {posts[0]?.title || 'None'}</p>
                <p>Last post: {posts[posts.length - 1]?.title || 'None'}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 p-4 rounded" style={{background:"color-mix(in oklab, var(--link) 10%, transparent)"}}>
        <h2 className="text-lg font-semibold mb-2">Expected URLs:</h2>
        <ul className="text-sm space-y-1">
          <li>• Page 1: <code>/</code></li>
          <li>• Page 2: <code>/page/2/</code></li>
          <li>• Page 3: <code>/page/3/</code></li>
        </ul>
      </div>
    </div>
  );
}
