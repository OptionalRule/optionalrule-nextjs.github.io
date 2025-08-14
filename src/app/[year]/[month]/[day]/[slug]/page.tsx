import { getPost, getAllPostsMeta } from '@/lib/content';
import { generateBlogPostStructuredData } from '@/lib/seo';
import { formatDate, normalizeImagePath } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import TableOfContents from '@/components/TableOfContents';
import SmartLink from '@/components/SmartLink';
import HeadingAnchor from '@/components/HeadingAnchor';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import MediaEmbed from '@/components/MediaEmbed';
import { generateHeadingId } from '@/lib/utils';
import type { MDXComponents } from 'mdx/types';

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
    const postDate = new Date(post.date);
    const year = postDate.getFullYear().toString();
    const month = String(postDate.getMonth() + 1).padStart(2, '0');
    const day = String(postDate.getDate()).padStart(2, '0');
    
    return {
      year,
      month,
      day,
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

  return {
    title: `${post.title} | My Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      ...(post.tags && post.tags.length > 0 && { tags: post.tags }),
      ...(post.featured_image && {
        images: [
          {
            url: post.featured_image,
            alt: post.title,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      ...(post.featured_image && {
        images: [post.featured_image],
      }),
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { year, month, day, slug } = await params;
  
  // Find the post by slug
  const post = getPost(slug);
  if (!post) {
    notFound();
  }

  // Validate that the URL date matches the post date
  const postDate = new Date(post.date);
  const expectedYear = postDate.getFullYear().toString();
  const expectedMonth = String(postDate.getMonth() + 1).padStart(2, '0');
  const expectedDay = String(postDate.getDate()).padStart(2, '0');
  
  if (year !== expectedYear || month !== expectedMonth || day !== expectedDay) {
    notFound();
  }

  // Use default MDX components
  const structuredData = generateBlogPostStructuredData(post);
  const mdxComponents: MDXComponents = {
    h1: ({ children, ...props }) => {
      const headingText = typeof children === 'string' ? children : '';
      const id = generateHeadingId(headingText);
      
      return (
        <h1 
          id={id} 
          className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6 scroll-mt-20 group"
          {...props}
        >
          {children}
          <HeadingAnchor id={id} headingText={headingText} />
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const headingText = typeof children === 'string' ? children : '';
      const id = generateHeadingId(headingText);
      
      return (
        <h2 
          id={id} 
          className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mt-8 scroll-mt-20 group"
          {...props}
        >
          {children}
          <HeadingAnchor id={id} headingText={headingText} />
        </h2>
      );
    },
    a: ({ href, children, ...props }) => (
      <SmartLink
        href={href || '#'}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline transition-colors"
        {...props}
      >
        {children}
      </SmartLink>
    ),
    YouTubeEmbed,
    MediaEmbed,
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
          <span>{formatDate(post.date)}</span>
        </nav>

        <article className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
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
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                {post.title}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
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
                      className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {post.excerpt && (
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed italic border-l-4 border-gray-300 dark:border-gray-600 pl-4">
                  {post.excerpt}
                </p>
              )}
            </header>

            {/* Table of Contents */}
            {post.showToc !== false && (
              <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <TableOfContents headings={post.headings} />
              </div>
            )}

            {/* Post Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <MDXRemote 
                source={post.content} 
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
            href="/about/"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            About this blog →
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}