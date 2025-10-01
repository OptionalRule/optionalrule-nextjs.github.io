import { getPage, getAllPageSlugs } from '@/lib/content';
import { generatePageMetadata } from '@/lib/seo';
import { urlPaths } from '@/lib/urls';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxOptions } from '@/lib/mdx-options';
import { mdxComponents } from '@/lib/mdx-components';
import TableOfContents from '@/components/TableOfContents';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPageSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug);

  if (!page) {
    return { title: 'Page Not Found' };
  }

  return generatePageMetadata(page.title, page.description, `/pages/${slug}/`);
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <nav className="mb-8 text-sm text-[var(--muted-2)]">
        <Link
          href={urlPaths.home()}
          className="hover:text-[var(--foreground)] transition-colors"
        >
          Home
        </Link>
        <span className="mx-2">›</span>
        <span className="text-[var(--foreground)]">{page.title}</span>
      </nav>

      <article className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="p-8 lg:p-12">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4 leading-tight">
              {page.title}
            </h1>

            {page.description && (
              <p className="text-lg text-[var(--muted-2)] leading-relaxed italic border-l-4 border-[var(--border)] pl-4">
                {page.description}
              </p>
            )}
          </header>

          {page.showToc !== false && (
            <div className="mb-8 p-6 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)]">
              <TableOfContents headings={page.headings} />
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <MDXRemote
              source={page.content}
              components={mdxComponents}
              options={{ mdxOptions }}
            />
          </div>
        </div>
      </article>

      <div className="mt-12 flex justify-between items-center">
        <Link
          href={urlPaths.home()}
          className="btn-secondary"
        >
          ← Back to Home
        </Link>

        <Link
          href={urlPaths.tags()}
          className="text-[var(--muted-2)] hover:text-[var(--foreground)] transition-colors"
        >
          Browse by tags →
        </Link>
      </div>
    </div>
  );
}
