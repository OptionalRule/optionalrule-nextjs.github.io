import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string; // e.g., "/" or "/tag/react"
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const generatePageUrl = (page: number): string => {
    if (page === 1) {
      return basePath === '/' ? '/' : `${basePath}/`;
    }
    return `${basePath}/page/${page}/`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Show max 5 pages around current page
  const maxVisiblePages = 5;
  let visiblePages = pages;
  
  if (totalPages > maxVisiblePages) {
    const start = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    const end = Math.min(totalPages, start + maxVisiblePages);
    visiblePages = pages.slice(start, end);
  }

  return (
    <nav className="flex justify-center items-center space-x-2 mt-12" aria-label="Pagination">
      {/* Previous button */}
      {currentPage > 1 && (
        <Link
          href={generatePageUrl(currentPage - 1)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Previous
        </Link>
      )}

      {/* Show first page if not visible */}
      {visiblePages[0] > 1 && (
        <>
          <Link
            href={generatePageUrl(1)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            1
          </Link>
          {visiblePages[0] > 2 && (
            <span className="px-2 text-gray-500">…</span>
          )}
        </>
      )}

      {/* Page numbers */}
      {visiblePages.map((page) => (
        <Link
          key={page}
          href={generatePageUrl(page)}
          className={`px-4 py-2 border rounded-lg transition-colors ${
            page === currentPage
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </Link>
      ))}

      {/* Show last page if not visible */}
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-2 text-gray-500">…</span>
          )}
          <Link
            href={generatePageUrl(totalPages)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* Next button */}
      {currentPage < totalPages && (
        <Link
          href={generatePageUrl(currentPage + 1)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Next
        </Link>
      )}
    </nav>
  );
}