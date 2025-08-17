import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string; // e.g., "/" or "/tag/react"
}

/**
 * Calculate a list of visible page numbers for the pagination component.
 * Ensures a consistent number of pages are shown even near the end of the list.
 * Responsive: shows fewer pages on mobile devices.
 */
export function getVisiblePages(
  currentPage: number,
  totalPages: number,
  maxVisiblePages = 5,
  isMobile = false
): number[] {
  // Reduce visible pages on mobile for better UX
  const effectiveMaxPages = isMobile ? 3 : maxVisiblePages;
  
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (totalPages <= effectiveMaxPages) {
    return pages;
  }

  let start = Math.max(0, currentPage - Math.floor(effectiveMaxPages / 2));
  let end = start + effectiveMaxPages;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(0, end - effectiveMaxPages);
  }

  return pages.slice(start, end);
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const generatePageUrl = (page: number): string => {
    if (page === 1) {
      // Handle different basePath scenarios
      if (basePath === '' || basePath === '/') {
        return '/';
      }
      return `${basePath}/`;
    }
    // For page 2+, always use the /page/X/ format
    if (basePath === '' || basePath === '/') {
      return `/page/${page}/`;
    }
    return `${basePath}/page/${page}/`;
  };

  const visiblePages = getVisiblePages(currentPage, totalPages, 5, false);

  return (
    <nav className="flex justify-center items-center space-x-1 sm:space-x-2 mt-8 sm:mt-12" aria-label="Pagination">
      {/* Previous button */}
      {currentPage > 1 && (
        <Link
          href={generatePageUrl(currentPage - 1)}
          className="px-2 sm:px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-sm sm:text-base"
        >
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">‹</span>
        </Link>
      )}

      {/* Mobile: Show current page info between Previous/Next */}
      <div className="sm:hidden px-3 py-2 text-sm text-[var(--muted-2)]">
        {currentPage} of {totalPages}
      </div>

      {/* Desktop: Show first page if not visible */}
      {visiblePages[0] > 1 && (
        <>
          <Link
            href={generatePageUrl(1)}
            className="hidden sm:block px-2 sm:px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-sm sm:text-base"
          >
            1
          </Link>
          {visiblePages[0] > 2 && (
            <span className="hidden sm:block px-2 text-[var(--muted-2)]">…</span>
          )}
        </>
      )}

      {/* Desktop: Page numbers - responsive sizing */}
      {visiblePages.map((page) => (
        <Link
          key={page}
          href={generatePageUrl(page)}
          className={`hidden sm:block px-2 sm:px-4 py-2 border rounded-lg transition-colors text-sm sm:text-base ${
            page === currentPage
              ? 'bg-[var(--link)] border-[var(--link)] text-white'
              : 'bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-hover)]'
          }`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </Link>
      ))}

      {/* Desktop: Show last page if not visible */}
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="hidden sm:block px-2 text-[var(--muted-2)]">…</span>
          )}
          <Link
            href={generatePageUrl(totalPages)}
            className="hidden sm:block px-2 sm:px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-sm sm:text-base"
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* Next button */}
      {currentPage < totalPages && (
        <Link
          href={generatePageUrl(currentPage + 1)}
          className="px-2 sm:px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-sm sm:text-base"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">›</span>
        </Link>
      )}
    </nav>
  );
}
