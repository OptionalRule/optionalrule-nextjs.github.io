import { Post, PostMeta } from './types';
import { generatePostUrl } from './utils';
import { siteConfig } from '@/config/site';

// Generate JSON-LD structured data for a blog post
export function generateBlogPostStructuredData(post: Post, siteUrl: string = siteConfig.url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Person',
      name: siteConfig.author,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}${siteConfig.logo}`,
      },
    },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}${generatePostUrl(post.date, post.slug)}`,
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
      name: siteConfig.name,
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
          url: `${siteUrl}${generatePostUrl(post.date, post.slug)}`,
          datePublished: post.date,
          author: {
            '@type': 'Person',
            name: siteConfig.author,
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