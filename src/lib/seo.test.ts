import { describe, it, expect, vi } from 'vitest';
import {
  generateMetadata,
  generatePostMetadata,
  generateHomeMetadata,
  generateTagMetadata,
  generatePaginationMetadata,
  generatePageMetadata,
  generateBlogPostStructuredData,
  generateBlogStructuredData,
  generateWebsiteStructuredData,
} from './seo';
import type { Post, PostMeta } from './types';

vi.mock('@/config/site', () => ({
  siteConfig: {
    name: 'Test Blog',
    title: 'Test Blog',
    description: 'A test blog description',
    url: 'https://test.com',
    defaultImage: '/images/default.jpg',
    keywords: ['test', 'blog'],
    author: {
      name: 'Test Author',
      url: 'https://test.com/author',
    },
    creator: 'Test Creator',
    publisher: 'Test Publisher',
    logo: '/logo.png',
    locale: 'en_US',
    social: {
      twitter: '@testblog',
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: 'test-verification-code',
    },
  },
}));

describe('seo.ts', () => {
  describe('generateMetadata', () => {
    it('should generate basic metadata with defaults', () => {
      const metadata = generateMetadata();

      expect(metadata.description).toBe('A test blog description');
      expect(metadata.keywords).toEqual(['test', 'blog']);
      expect(metadata.authors).toEqual([{ name: 'Test Author', url: 'https://test.com/author' }]);
    });

    it('should generate metadata with custom title', () => {
      const metadata = generateMetadata({ title: 'Custom Title' });

      expect(metadata.title).toBe('Custom Title');
      expect(metadata.openGraph?.title).toBe('Custom Title | Test Blog');
      expect(metadata.twitter?.title).toBe('Custom Title | Test Blog');
    });

    it('should generate metadata with custom description', () => {
      const metadata = generateMetadata({ description: 'Custom description' });

      expect(metadata.description).toBe('Custom description');
      expect(metadata.openGraph?.description).toBe('Custom description');
      expect(metadata.twitter?.description).toBe('Custom description');
    });

    it('should generate metadata with custom image', () => {
      const metadata = generateMetadata({ image: '/custom-image.jpg' });

      expect(metadata.openGraph?.images).toEqual([
        {
          url: 'https://test.com/custom-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Test Blog',
        },
      ]);
    });

    it('should handle absolute image URLs', () => {
      const metadata = generateMetadata({ image: 'https://external.com/image.jpg' });

      expect(metadata.openGraph?.images).toEqual([
        {
          url: 'https://external.com/image.jpg',
          width: 1200,
          height: 630,
          alt: 'Test Blog',
        },
      ]);
    });

    it('should generate metadata with canonical URL', () => {
      const metadata = generateMetadata({ canonical: '/about/' });

      expect(metadata.alternates?.canonical).toBe('/about/');
      expect(metadata.openGraph?.url).toBe('https://test.com/about/');
    });

    it('should set noIndex in robots when specified', () => {
      const metadata = generateMetadata({ noIndex: true });

      expect(metadata.robots).toEqual({
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      });
    });

    it('should generate article type metadata with publishedTime', () => {
      const metadata = generateMetadata({
        type: 'article',
        publishedTime: '2024-01-01',
      });

      expect(metadata.openGraph?.type).toBe('article');
      expect(metadata.openGraph?.publishedTime).toBe('2024-01-01');
    });

    it('should include tags in OpenGraph when provided', () => {
      const metadata = generateMetadata({
        tags: ['tag1', 'tag2'],
      });

      expect(metadata.openGraph?.tags).toEqual(['tag1', 'tag2']);
    });

    it('should not include tags when empty array', () => {
      const metadata = generateMetadata({
        tags: [],
      });

      expect(metadata.openGraph?.tags).toBeUndefined();
    });

    it('should include Google verification when configured', () => {
      const metadata = generateMetadata();

      expect(metadata.verification).toEqual({
        google: 'test-verification-code',
      });
    });

    it('should use metadataBase from siteConfig', () => {
      const metadata = generateMetadata();

      expect(metadata.metadataBase).toEqual(new URL('https://test.com'));
    });

    it('should set creator and publisher', () => {
      const metadata = generateMetadata();

      expect(metadata.creator).toBe('Test Creator');
      expect(metadata.publisher).toBe('Test Publisher');
    });
  });

  describe('generatePostMetadata', () => {
    const mockPost: Post = {
      slug: 'test-post',
      title: 'Test Post',
      date: '2024-01-15',
      excerpt: 'Test excerpt',
      tags: ['test', 'post'],
      featured_image: '/images/post.jpg',
      content: 'Test content',
      readingTime: 5,
      headings: [],
    };

    it('should generate metadata for a post', () => {
      const metadata = generatePostMetadata(mockPost);

      expect(metadata.title).toBe('Test Post');
      expect(metadata.description).toBe('Test excerpt');
      expect(metadata.openGraph?.type).toBe('article');
      expect(metadata.openGraph?.publishedTime).toBe('2024-01-15');
      expect(metadata.openGraph?.tags).toEqual(['test', 'post']);
    });

    it('should generate correct canonical URL for post', () => {
      const metadata = generatePostMetadata(mockPost);

      expect(metadata.alternates?.canonical).toBe('/2024/01/15/test-post/');
    });

    it('should use featured_image when provided', () => {
      const metadata = generatePostMetadata(mockPost);

      expect(metadata.openGraph?.images).toEqual([
        {
          url: 'https://test.com/images/post.jpg',
          width: 1200,
          height: 630,
          alt: 'Test Post',
        },
      ]);
    });

    it('should use default image when featured_image is not provided', () => {
      const postWithoutImage = { ...mockPost, featured_image: undefined };
      const metadata = generatePostMetadata(postWithoutImage);

      expect(metadata.openGraph?.images).toEqual([
        {
          url: 'https://test.com/images/default.jpg',
          width: 1200,
          height: 630,
          alt: 'Test Post',
        },
      ]);
    });
  });

  describe('generateHomeMetadata', () => {
    it('should generate homepage metadata', () => {
      const metadata = generateHomeMetadata();

      expect(metadata.title).toBe('Home');
      expect(metadata.description).toBe('A test blog description');
      expect(metadata.alternates?.canonical).toBe('/');
    });
  });

  describe('generateTagMetadata', () => {
    it('should generate metadata for tag page', () => {
      const metadata = generateTagMetadata('gaming');

      expect(metadata.title).toBe('Posts tagged "gaming"');
      expect(metadata.description).toBe('All posts tagged with "gaming" on Test Blog');
      expect(metadata.alternates?.canonical).toBe('/tag/gaming/');
    });

    it('should generate metadata for tag page with pagination', () => {
      const metadata = generateTagMetadata('gaming', 2);

      expect(metadata.title).toBe('Posts tagged "gaming" - Page 2');
      expect(metadata.description).toBe('All posts tagged with "gaming" on Test Blog');
      expect(metadata.alternates?.canonical).toBe('/tag/gaming/page/2/');
    });

    it('should not add page suffix for page 1', () => {
      const metadata = generateTagMetadata('gaming', 1);

      expect(metadata.title).toBe('Posts tagged "gaming"');
      expect(metadata.alternates?.canonical).toBe('/tag/gaming/');
    });
  });

  describe('generatePaginationMetadata', () => {
    it('should generate metadata for pagination pages', () => {
      const metadata = generatePaginationMetadata(2);

      expect(metadata.title).toBe('Posts - Page 2');
      expect(metadata.description).toBe('Browse posts on Test Blog - Page 2');
      expect(metadata.alternates?.canonical).toBe('/page/2/');
    });

    it('should handle different page numbers', () => {
      const metadata = generatePaginationMetadata(5);

      expect(metadata.title).toBe('Posts - Page 5');
      expect(metadata.alternates?.canonical).toBe('/page/5/');
    });
  });

  describe('generatePageMetadata', () => {
    it('should generate metadata for static page with all params', () => {
      const metadata = generatePageMetadata('About', 'About us page', '/pages/about/');

      expect(metadata.title).toBe('About');
      expect(metadata.description).toBe('About us page');
      expect(metadata.alternates?.canonical).toBe('/pages/about/');
    });

    it('should use default description when not provided', () => {
      const metadata = generatePageMetadata('About');

      expect(metadata.description).toBe('A test blog description');
    });

    it('should generate canonical from title when not provided', () => {
      const metadata = generatePageMetadata('About');

      expect(metadata.alternates?.canonical).toBe('/about/');
    });
  });

  describe('generateBlogPostStructuredData', () => {
    const mockPost: Post = {
      slug: 'test-post',
      title: 'Test Post Title',
      date: '2024-01-15',
      excerpt: 'Test post excerpt',
      tags: ['gaming', 'rpg'],
      featured_image: '/images/post.jpg',
      content: 'Test content',
      readingTime: 5,
      headings: [],
    };

    it('should generate blog post structured data', () => {
      const structuredData = generateBlogPostStructuredData(mockPost);

      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('BlogPosting');
      expect(structuredData.headline).toBe('Test Post Title');
      expect(structuredData.description).toBe('Test post excerpt');
    });

    it('should include author information', () => {
      const structuredData = generateBlogPostStructuredData(mockPost);

      expect(structuredData.author).toEqual({
        '@type': 'Person',
        name: 'Test Author',
        url: 'https://test.com/author',
      });
    });

    it('should include publisher information', () => {
      const structuredData = generateBlogPostStructuredData(mockPost);

      expect(structuredData.publisher).toEqual({
        '@type': 'Organization',
        name: 'Test Publisher',
        logo: {
          '@type': 'ImageObject',
          url: 'https://test.com/logo.png',
        },
      });
    });

    it('should include publish and modified dates', () => {
      const structuredData = generateBlogPostStructuredData(mockPost);

      expect(structuredData.datePublished).toBe('2024-01-15');
      expect(structuredData.dateModified).toBe('2024-01-15');
    });

    it('should include mainEntityOfPage', () => {
      const structuredData = generateBlogPostStructuredData(mockPost);

      expect(structuredData.mainEntityOfPage).toEqual({
        '@type': 'WebPage',
        '@id': 'https://test.com/2024/01/15/test-post/',
      });
    });

    it('should include image when featured_image is present', () => {
      const structuredData = generateBlogPostStructuredData(mockPost);

      expect(structuredData.image).toEqual({
        '@type': 'ImageObject',
        url: 'https://test.com/images/post.jpg',
        width: 1200,
        height: 630,
      });
    });

    it('should not include image when featured_image is missing', () => {
      const postWithoutImage = { ...mockPost, featured_image: undefined };
      const structuredData = generateBlogPostStructuredData(postWithoutImage);

      expect(structuredData.image).toBeUndefined();
    });

    it('should include keywords when tags are present', () => {
      const structuredData = generateBlogPostStructuredData(mockPost);

      expect(structuredData.keywords).toBe('gaming, rpg');
    });

    it('should not include keywords when tags are missing', () => {
      const postWithoutTags = { ...mockPost, tags: undefined };
      const structuredData = generateBlogPostStructuredData(postWithoutTags);

      expect(structuredData.keywords).toBeUndefined();
    });

    it('should use custom siteUrl when provided', () => {
      const structuredData = generateBlogPostStructuredData(mockPost, 'https://custom.com');

      expect(structuredData.mainEntityOfPage['@id']).toContain('https://custom.com');
      expect(structuredData.publisher.logo.url).toContain('https://custom.com');
    });
  });

  describe('generateBlogStructuredData', () => {
    const mockPosts: PostMeta[] = Array.from({ length: 15 }, (_, i) => ({
      slug: `post-${i + 1}`,
      title: `Post ${i + 1}`,
      date: '2024-01-15',
      excerpt: `Excerpt ${i + 1}`,
      readingTime: 5,
      headings: [],
    }));

    it('should generate blog structured data', () => {
      const structuredData = generateBlogStructuredData(mockPosts);

      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('Blog');
      expect(structuredData.name).toBe('Test Blog');
      expect(structuredData.description).toBe('A test blog description');
      expect(structuredData.url).toBe('https://test.com');
    });

    it('should include publisher information', () => {
      const structuredData = generateBlogStructuredData(mockPosts);

      expect(structuredData.publisher).toEqual({
        '@type': 'Organization',
        name: 'Test Publisher',
        logo: {
          '@type': 'ImageObject',
          url: 'https://test.com/logo.png',
        },
      });
    });

    it('should limit posts to first 10 items', () => {
      const structuredData = generateBlogStructuredData(mockPosts);

      expect(structuredData.mainEntity.itemListElement).toHaveLength(10);
    });

    it('should include correct post information in itemList', () => {
      const structuredData = generateBlogStructuredData(mockPosts);

      const firstItem = structuredData.mainEntity.itemListElement[0];
      expect(firstItem['@type']).toBe('ListItem');
      expect(firstItem.position).toBe(1);
      expect(firstItem.item['@type']).toBe('BlogPosting');
      expect(firstItem.item.headline).toBe('Post 1');
    });

    it('should use custom siteUrl when provided', () => {
      const structuredData = generateBlogStructuredData(mockPosts, 'https://custom.com');

      expect(structuredData.url).toBe('https://custom.com');
      expect(structuredData.publisher.logo.url).toBe('https://custom.com/logo.png');
    });
  });

  describe('generateWebsiteStructuredData', () => {
    it('should generate website structured data', () => {
      const structuredData = generateWebsiteStructuredData();

      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('WebSite');
      expect(structuredData.name).toBe('Test Blog');
      expect(structuredData.description).toBe('A test blog description');
      expect(structuredData.url).toBe('https://test.com');
    });

    it('should include search action', () => {
      const structuredData = generateWebsiteStructuredData();

      expect(structuredData.potentialAction).toEqual({
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://test.com/search?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      });
    });

    it('should use custom siteUrl when provided', () => {
      const structuredData = generateWebsiteStructuredData('https://custom.com');

      expect(structuredData.url).toBe('https://custom.com');
      expect(structuredData.potentialAction.target.urlTemplate).toBe('https://custom.com/search?q={search_term_string}');
    });
  });
});
