import Link from 'next/link';
import type { Metadata } from 'next';
import { urlPaths } from '@/lib/urls';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
      <p className="text-sm font-semibold text-[var(--muted-2)] mb-2">404</p>
      <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">Page not found</h1>
      <p className="text-lg text-[var(--muted-2)] mb-8">
        The page you were looking for has moved or never existed.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href={urlPaths.home()} className="btn-secondary">
          ← Back to Home
        </Link>
        <Link href={urlPaths.search()} className="btn-secondary">
          Search posts
        </Link>
        <Link href={urlPaths.tags()} className="btn-secondary">
          Browse tags
        </Link>
      </div>
    </div>
  );
}
