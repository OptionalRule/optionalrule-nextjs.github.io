import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-[var(--muted-2)] text-sm">
              © 2020-{currentYear} Optional Rule Games.
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link
              href="/pages/about/"
              className="text-[var(--muted-2)] hover:text-[var(--foreground)] text-sm transition-colors"
            >
              About
            </Link>
            <Link
              href="/tags/"
              className="text-[var(--muted-2)] hover:text-[var(--foreground)] text-sm transition-colors"
            >
              Tags
            </Link>
            <a
              href="/rss.xml"
              className="text-[var(--muted-2)] hover:text-[var(--foreground)] text-sm transition-colors"
            >
              RSS
            </a>
            <a
              href="/sitemap.xml"
              className="text-[var(--muted-2)] hover:text-[var(--foreground)] text-sm transition-colors"
            >
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
