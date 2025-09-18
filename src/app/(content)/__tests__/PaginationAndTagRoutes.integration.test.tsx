import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { generatePaginationMetadata, generateTagMetadata } from '@/lib/seo';
import type { PaginatedPosts, PostMeta, TagPage } from '@/lib/types';
import { notFound } from 'next/navigation';

vi.mock('@/lib/content', async () => {
  const actual = await vi.importActual<typeof import('@/lib/content')>('@/lib/content');
  return {
    ...actual,
    getPaginatedPosts: vi.fn(),
    getAllPostsMeta: vi.fn(),
    getPostsByTag: vi.fn(),
    getAllTags: vi.fn(),
  };
});

const contentModule = await vi.importMock<typeof import('@/lib/content')>('@/lib/content');
const mockGetPaginatedPosts = vi.mocked(contentModule.getPaginatedPosts);
const mockGetAllPostsMeta = vi.mocked(contentModule.getAllPostsMeta);
const mockGetPostsByTag = vi.mocked(contentModule.getPostsByTag);
const mockGetAllTags = vi.mocked(contentModule.getAllTags);
const POSTS_PER_PAGE = contentModule.POSTS_PER_PAGE;

const paginatedPostsFixture = [
  {
    slug: 'fixture-one',
    title: 'Fixture One',
    date: '2024-01-10',
    excerpt: 'First fixture excerpt',
    tags: ['Arcana', 'Guides'],
    featured_image: '/images/fixture-one.jpg',
    readingTime: 7,
    headings: [],
  },
  {
    slug: 'fixture-two',
    title: 'Fixture Two',
    date: '2024-01-05',
    excerpt: 'Second fixture excerpt',
    tags: ['Arcana'],
    readingTime: 5,
    headings: [],
  },
] satisfies PostMeta[];

const tagPageOnePostsFixture = [
  {
    slug: 'arcana-primer',
    title: 'Arcana Primer',
    date: '2024-02-01',
    excerpt: 'Getting started with arcana.',
    tags: ['Arcana'],
    readingTime: 6,
    headings: [],
  },
  {
    slug: 'arcane-shield-tactics',
    title: 'Arcane Shield Tactics',
    date: '2024-01-20',
    excerpt: 'Defensive arcane strategies.',
    tags: ['Arcana'],
    readingTime: 8,
    headings: [],
  },
] satisfies PostMeta[];

const tagPageTwoPostsFixture = [
  {
    slug: 'arcana-master-class',
    title: 'Arcana Master Class',
    date: '2023-12-15',
    excerpt: 'Advanced arcana lessons.',
    tags: ['Arcana'],
    readingTime: 9,
    headings: [],
  },
] satisfies PostMeta[];

async function loadPaginationRouteModule() {
  return import('../page/[page]/page');
}

async function loadTagRouteModule() {
  return import('../tag/[tag]/page');
}

async function loadTagPaginationRouteModule() {
  return import('../tag/[tag]/page/[page]/page');
}

beforeEach(() => {
  mockGetPaginatedPosts.mockReset();
  mockGetAllPostsMeta.mockReset();
  mockGetPostsByTag.mockReset();
  mockGetAllTags.mockReset();
});

describe('Paginated listing route (/page/[page])', () => {
  it('renders fixtures on page 2 and exposes pagination UI', async () => {
    const paginatedResult: PaginatedPosts = {
      posts: paginatedPostsFixture,
      totalPages: 3,
      currentPage: 2,
      hasNextPage: true,
      hasPrevPage: true,
    };
    mockGetPaginatedPosts.mockReturnValue(paginatedResult);

    const paginationRouteModule = await loadPaginationRouteModule();
    const PageComponent = paginationRouteModule.default;
    const element = await PageComponent({ params: Promise.resolve({ page: '2' }) });

    render(element);

    expect(mockGetPaginatedPosts).toHaveBeenCalledWith(2);

    const articles = await screen.findAllByRole('article');
    expect(articles).toHaveLength(paginatedPostsFixture.length);
    paginatedPostsFixture.forEach((post) => {
      expect(screen.getByRole('link', { name: post.title })).toBeInTheDocument();
    });

    expect(screen.getAllByRole('navigation', { name: /pagination/i })).toHaveLength(2);
    expect(screen.getAllByText('2 of 3')).toHaveLength(2);
    expect(notFound).not.toHaveBeenCalled();
  });

  it('returns metadata from the pagination helper', async () => {
    const paginationRouteModule = await loadPaginationRouteModule();
    const metadata = await paginationRouteModule.generateMetadata({ params: Promise.resolve({ page: '5' }) });

    expect(metadata).toEqual(generatePaginationMetadata(5));
  });

  it('derives static params from post metadata', async () => {
    mockGetAllPostsMeta.mockReturnValue(
      Array.from({ length: POSTS_PER_PAGE + 1 }, (_, index) => ({
        ...paginatedPostsFixture[index % paginatedPostsFixture.length],
        slug: `paginated-stub-${index}`,
        title: `Paginated Stub ${index}`,
      }))
    );

    const paginationRouteModule = await loadPaginationRouteModule();
    const params = await paginationRouteModule.generateStaticParams();

    expect(mockGetAllPostsMeta).toHaveBeenCalledTimes(1);
    expect(params).toEqual([{ page: '2' }]);
  });
});

describe('Tag landing route (/tag/[tag])', () => {
  it('renders tagged posts with navigation and totals', async () => {
    const tagResult: TagPage = {
      tag: 'Arcana',
      posts: tagPageOnePostsFixture,
      totalPages: 2,
      currentPage: 1,
      hasNextPage: true,
      hasPrevPage: false,
    };
    mockGetPostsByTag.mockReturnValue(tagResult);

    const tagRouteModule = await loadTagRouteModule();
    const TagPageComponent = tagRouteModule.default;
    const element = await TagPageComponent({ params: Promise.resolve({ tag: 'arcana' }) });

    render(element);

    expect(mockGetPostsByTag).toHaveBeenCalledWith('arcana', 1);

    tagPageOnePostsFixture.forEach((post) => {
      expect(screen.getByRole('link', { name: post.title })).toBeInTheDocument();
    });

    expect(screen.getAllByRole('navigation', { name: /pagination/i })).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tags' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View all tags/ })).toBeInTheDocument();
    expect(screen.getByText(/Posts tagged with/)).toBeInTheDocument();

    const expectedTotal = `${tagPageOnePostsFixture.length + (tagResult.totalPages - 1) * POSTS_PER_PAGE} posts found`;
    expect(screen.getByText(expectedTotal)).toBeInTheDocument();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('uses metadata helper and falls back when tag is empty', async () => {
    const tagRouteModule = await loadTagRouteModule();

    mockGetPostsByTag.mockReturnValueOnce({
      tag: 'Arcana',
      posts: tagPageOnePostsFixture,
      totalPages: 2,
      currentPage: 1,
      hasNextPage: true,
      hasPrevPage: false,
    });

    const metadata = await tagRouteModule.generateMetadata({ params: Promise.resolve({ tag: 'arcana' }) });
    expect(metadata).toEqual(generateTagMetadata('arcana'));

    mockGetPostsByTag.mockReturnValueOnce({
      tag: 'arcana',
      posts: [],
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false,
    });

    const fallbackMetadata = await tagRouteModule.generateMetadata({ params: Promise.resolve({ tag: 'arcana' }) });
    expect(fallbackMetadata).toEqual({ title: 'Tag Not Found' });
  });

  it('generates static params for tag listing pages', async () => {
    mockGetAllTags.mockReturnValue(['Arcana', 'Lore']);

    const tagRouteModule = await loadTagRouteModule();
    const params = await tagRouteModule.generateStaticParams();

    expect(mockGetAllTags).toHaveBeenCalledTimes(1);
    expect(mockGetPostsByTag).not.toHaveBeenCalled();
    expect(params).toEqual([
      { tag: 'arcana' },
      { tag: 'lore' },
    ]);
  });
});

describe('Tag paginated route (/tag/[tag]/page/[page])', () => {
  it('renders subsequent tag pages and returns paged metadata', async () => {
    const pageOneResult: TagPage = {
      tag: 'Arcana',
      posts: tagPageOnePostsFixture,
      totalPages: 2,
      currentPage: 1,
      hasNextPage: true,
      hasPrevPage: false,
    };

    const pageTwoResult: TagPage = {
      tag: 'Arcana',
      posts: tagPageTwoPostsFixture,
      totalPages: 2,
      currentPage: 2,
      hasNextPage: false,
      hasPrevPage: true,
    };

    mockGetPostsByTag.mockImplementation((tag: string, page = 1) => {
      return page === 2 ? pageTwoResult : pageOneResult;
    });

    const tagPaginationRouteModule = await loadTagPaginationRouteModule();
    const TagPageComponent = tagPaginationRouteModule.default;

    const element = await TagPageComponent({ params: Promise.resolve({ tag: 'arcana', page: '2' }) });
    render(element);

    expect(mockGetPostsByTag).toHaveBeenCalledWith('arcana', 2);

    tagPageTwoPostsFixture.forEach((post) => {
      expect(screen.getByRole('link', { name: post.title })).toBeInTheDocument();
    });

    expect(screen.getAllByRole('navigation', { name: /pagination/i })).toHaveLength(2);
    expect(screen.getByText(/Page 2/)).toBeInTheDocument();
    expect(notFound).not.toHaveBeenCalled();

    const metadata = await tagPaginationRouteModule.generateMetadata({
      params: Promise.resolve({ tag: 'arcana', page: '2' }),
    });
    expect(metadata).toEqual(generateTagMetadata('arcana', 2));
  });

  it('generates static params for tag pagination pages', async () => {
    mockGetAllTags.mockReturnValue(['Arcana']);
    mockGetPostsByTag.mockImplementation((tag: string, page = 1) => ({
      tag,
      posts: page === 1 ? tagPageOnePostsFixture : tagPageTwoPostsFixture,
      totalPages: 2,
      currentPage: page,
      hasNextPage: page === 1,
      hasPrevPage: page > 1,
    }));

    const tagPaginationRouteModule = await loadTagPaginationRouteModule();
    const params = await tagPaginationRouteModule.generateStaticParams();

    expect(mockGetAllTags).toHaveBeenCalledTimes(1);
    expect(mockGetPostsByTag).toHaveBeenCalledTimes(1);
    expect(params).toEqual([{ tag: 'arcana', page: '2' }]);
  });
});
