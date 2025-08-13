import { Post, PostMeta } from './types';

// Generate JSON-LD structured data for a blog post
export function generateBlogPostStructuredData(post: Post, siteUrl: string = 'https://yourdomain.github.io') {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Person',
      name: 'Blog Author', // Replace with actual author name
    },
    publisher: {
      '@type': 'Organization',
      name: 'My Blog',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`, // Add your logo
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
export function generateBlogStructuredData(posts: PostMeta[], siteUrl: string = 'https://yourdomain.github.io') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'My Blog',
    description: 'A modern blog about web development, best practices, and emerging technologies.',
    url: siteUrl,
    publisher: {
      '@type': 'Organization',
      name: 'My Blog',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`, // Add your logo
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
            name: 'Blog Author',
          },
        },
      })),
    },
  };
}

// Generate JSON-LD structured data for website
export function generateWebsiteStructuredData(siteUrl: string = 'https://yourdomain.github.io') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'My Blog',
    description: 'A modern blog about web development, best practices, and emerging technologies.',
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

// Helper function to generate post URL (duplicated from utils for this file's independence)
function generatePostUrl(date: string, slug: string): string {
  const postDate = new Date(date);
  const year = postDate.getFullYear();
  const month = String(postDate.getMonth() + 1).padStart(2, '0');
  const day = String(postDate.getDate()).padStart(2, '0');
  
  return `/${year}/${month}/${day}/${slug}/`;
}