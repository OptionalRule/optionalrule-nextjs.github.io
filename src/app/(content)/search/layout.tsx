import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata({
  title: 'Search',
  description: 'Search posts by title, content, or tags',
  canonical: '/search/',
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}

