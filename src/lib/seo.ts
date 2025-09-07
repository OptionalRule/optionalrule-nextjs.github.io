import { Post, PostMeta } from './types';
import { urlPaths } from './urls';
import { siteConfig } from '@/config/site';
import type { Metadata } from 'next';

interface MetadataOptions {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
  publishedTime?: string;
  tags?: string[];
}

// Generate complete metadata for any page
export function generateMetadata(options: MetadataOptions = {}): Metadata {
  const {
    title,
    description = siteConfig.description,
    image = siteConfig.defaultImage,
    canonical,
    noIndex = false,
    type = 'website',
    publishedTime,
    tags,
  } = options;

  // Compute share titles (OpenGraph/Twitter) explicitly, while letting the
  // root layout control the <title> template ("%s | Site").
  const shareTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title;
  const absoluteImage = image.startsWith('http') ? image : `${siteConfig.url}${image}`;
  const canonicalUrl = canonical ? `${siteConfig.url}${canonical}` : siteConfig.url;

  const metadata: Metadata = {
    // Only set a bare page title here; the layout's template appends the site name.
    ...(title ? { title } : {}),
    description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonical || '/',
    },
    robots: {
      index: !noIndex && siteConfig.robots.index,
      follow: !noIndex && siteConfig.robots.follow,
      googleBot: {
        index: !noIndex && siteConfig.robots.index,
        follow: !noIndex && siteConfig.robots.follow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url: canonicalUrl,
      siteName: siteConfig.name,
      title: shareTitle,
      description,
      images: [
        {
          url: absoluteImage,
          width: 1200,
          height: 630,
          alt: title || siteConfig.name,
        },
      ],
      ...(type === 'article' && publishedTime && { publishedTime }),
      ...(tags && tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      creator: siteConfig.social.twitter,
      site: siteConfig.social.twitter,
      images: [
        {
          url: absoluteImage,
          alt: title || siteConfig.name,
        },
      ],
    },
  };

  if (siteConfig.verification.google) {
    metadata.verification = {
      google: siteConfig.verification.google,
    };
  }

  return metadata;
}

// Generate metadata specifically for blog posts
export function generatePostMetadata(post: Post): Metadata {
  const canonicalUrl = urlPaths.post(post.date, post.slug);
  
  return generateMetadata({
    title: post.title,
    description: post.excerpt,
    image: post.featured_image || siteConfig.defaultImage,
    canonical: canonicalUrl,
    type: 'article',
    publishedTime: post.date,
    tags: post.tags,
  });
}

// Generate metadata for the homepage
export function generateHomeMetadata(): Metadata {
  return generateMetadata({
    title: 'Home',
    description: siteConfig.description,
    canonical: '/',
  });
}

// Generate metadata for tag pages
export function generateTagMetadata(tag: string, page?: number): Metadata {
  const title = `Posts tagged "${tag}"${page && page > 1 ? ` - Page ${page}` : ''}`;
  const description = `All posts tagged with "${tag}" on ${siteConfig.name}`;
  const canonical = `/tag/${tag.toLowerCase()}/${page && page > 1 ? `page/${page}/` : ''}`;

  return generateMetadata({
    title,
    description,
    canonical,
  });
}

// Generate metadata for pagination pages
export function generatePaginationMetadata(page: number): Metadata {
  const title = `Posts - Page ${page}`;
  const description = `Browse posts on ${siteConfig.name} - Page ${page}`;
  const canonical = `/page/${page}/`;

  return generateMetadata({
    title,
    description,
    canonical,
  });
}

// Generate metadata for static pages
export function generatePageMetadata(title: string, description?: string, canonical?: string): Metadata {
  return generateMetadata({
    title,
    description: description || siteConfig.description,
    canonical: canonical || `/${title.toLowerCase()}/`,
  });
}

// Generate JSON-LD structured data for a blog post
export function generateBlogPostStructuredData(post: Post, siteUrl: string = siteConfig.url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Person',
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.publisher,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}${siteConfig.logo}`,
      },
    },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}${urlPaths.post(post.date, post.slug)}`,
    },
    ...(post.featured_image && {
      image: {
        '@type': 'ImageObject',
        url: `${siteUrl}${post.featured_image}`,
        width: 1200,
        height: 630,
      },
    }),
    ...(post.tags && post.tags.length > 0 && { keywords: post.tags.join(', ') }),
  };
}

// Generate JSON-LD structured data for the blog homepage
export function generateBlogStructuredData(posts: PostMeta[], siteUrl: string = siteConfig.url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteUrl,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.publisher,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}${siteConfig.logo}`,
      },
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.slice(0, 10).map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          url: `${siteUrl}${urlPaths.post(post.date, post.slug)}`,
          datePublished: post.date,
          author: {
            '@type': 'Person',
            name: siteConfig.author.name,
          },
        },
      })),
    },
  };
}

// Generate JSON-LD structured data for website
export function generateWebsiteStructuredData(siteUrl: string = siteConfig.url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
