import { getPage } from '@/lib/content';
import { generatePageTitle, generateMetaDescription } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/mdx-components';
import TableOfContents from '@/components/TableOfContents';

export async function generateMetadata(): Promise<Metadata> {
  const page = getPage('about');
  
  if (!page) {
    return {
      title: 'About | My Blog',
    };
  }

  return {
    title: generatePageTitle(page.title),
    description: generateMetaDescription(page.description, undefined),
    openGraph: {
      title: page.title,
      description: generateMetaDescription(page.description, undefined),
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: page.title,
      description: generateMetaDescription(page.description, undefined),
    },
  };
}

export default function AboutPage() {
  const page = getPage('about');

  if (!page) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb Navigation */}
      <nav className="mb-8 text-sm text-gray-600 dark:text-gray-400">
        <Link 
          href="/"
          className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          Home
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 dark:text-gray-200">{page.title}</span>
      </nav>

      <article className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-8 lg:p-12">
          {/* Page Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
              {page.title}
            </h1>
            
            {page.description && (
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed italic border-l-4 border-gray-300 dark:border-gray-600 pl-4">
                {page.description}
              </p>
            )}
          </header>

          {/* Table of Contents */}
          {page.showToc !== false && (
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <TableOfContents headings={page.headings} />
            </div>
          )}

          {/* Page Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <MDXRemote 
              source={page.content} 
              components={mdxComponents}
            />
          </div>
        </div>
      </article>

      {/* Navigation */}
      <div className="mt-12 flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Back to Home
        </Link>
        
        <Link
          href="/tags/"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          Browse by tags →
        </Link>
      </div>
    </div>
  );
}