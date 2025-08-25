import { getPost, getAllPostsMeta } from '@/lib/content';
import { generateBlogPostStructuredData, generatePostMetadata } from '@/lib/seo';
import { formatDate, normalizeImagePath, parseDateToUTC } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxOptions } from '@/lib/mdx-options';
import TableOfContents from '@/components/TableOfContents';
import { mdxComponents } from '@/stories/mdx-components';

interface PostPageProps {
  params: Promise<{
    year: string;
    month: string;
    day: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = getAllPostsMeta();
  
  return posts.map((post) => {
    const { year, month, day } = parseDateToUTC(post.date);
    
    return {
      year: year.toString(),
      month: String(month).padStart(2, '0'),
      day: String(day).padStart(2, '0'),
      slug: post.slug,
    };
  });
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return generatePostMetadata(post);
}

export default async function PostPage({ params }: PostPageProps) {
  const { year, month, day, slug } = await params;
  
  // Find the post by slug
  const post = getPost(slug);
  if (!post) {
    notFound();
  }

  // Validate that the URL date matches the post date
  const { year: expectedYear, month: expectedMonth, day: expectedDay } = parseDateToUTC(post.date);
  
  if (year !== expectedYear.toString() || month !== String(expectedMonth).padStart(2, '0') || day !== String(expectedDay).padStart(2, '0')) {
    notFound();
  }

  const structuredData = generateBlogPostStructuredData(post);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <div className="min-h-screen bg-[var(--surface)]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8 text-sm text-[var(--muted-2)]">
          <Link 
            href="/"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Home
          </Link>
          <span className="mx-2">›</span>
          <span>{formatDate(post.date)}</span>
        </nav>

        <article className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative aspect-video bg-[var(--surface-hover)] overflow-hidden">
              <Image
                src={normalizeImagePath(post.featured_image)}
                alt={`Featured image for ${post.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                priority={true}
              />
            </div>
          )}

          <div className="p-8 lg:p-12">
            {/* Post Header */}
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4 leading-tight">
                {post.title}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-[var(--muted-2)] mb-6">
                <time dateTime={post.date}>
                  {formatDate(post.date)}
                </time>
                <span>•</span>
                <span>{post.readingTime} min read</span>
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tag/${tag.toLowerCase()}/`}
                      className="inline-block px-3 py-1 bg-[var(--chip-bg)] text-[var(--chip-text)] rounded-full text-sm hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {post.excerpt && (
                <p className="text-lg text-[var(--muted-2)] leading-relaxed italic border-l-4 border-[var(--border)] pl-4">
                  {post.excerpt}
                </p>
              )}
            </header>

            {/* Table of Contents */}
            {post.showToc !== false && (
              <div className="mb-8 p-6 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)]">
                <TableOfContents headings={post.headings} />
              </div>
            )}

            {/* Post Content */}
            <div className="prose prose-lg max-w-none">
              <MDXRemote
                source={post.content}
                components={mdxComponents}
                options={mdxOptions}
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
            href="/pages/about/"
            className="text-[var(--muted-2)] hover:text-[var(--foreground)] transition-colors"
          >
            About this blog →
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
