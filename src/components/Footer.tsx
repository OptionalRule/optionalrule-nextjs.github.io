import Link from 'next/link';
import { urlPaths } from '@/lib/urls';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-l from-[var(--surface)] to-[var(--surface-2)] border-t border-[var(--border)] shadow-lg">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-[var(--text-tertiary)] text-sm font-medium">
              © 2020-{currentYear} Optional Rule Games.
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href={urlPaths.staticPage('about')}
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm font-semibold transition-all duration-300 hover:scale-105"
            >
              About
            </Link>
            <Link
              href={urlPaths.tags()}
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm font-semibold transition-all duration-300 hover:scale-105"
            >
              Tags
            </Link>
            <Link
              href={urlPaths.tool('torch_tracker')}
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm font-semibold transition-all duration-300 hover:scale-105"
            >
              Torch Tracker
            </Link>
            <a
              href={urlPaths.rss()}
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm font-semibold transition-all duration-300 hover:scale-105"
            >
              RSS
            </a>
            <a
              href={urlPaths.sitemap()}
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm font-semibold transition-all duration-300 hover:scale-105"
            >
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
