import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PostMeta } from '@/lib/types';

vi.mock('@/lib/content', () => ({
  getPaginatedPosts: vi.fn(),
}));

const postCardSpy = vi.fn(({ post }: { post: PostMeta }) => (
  <div data-testid="post-card">{post.title}</div>
));
const paginationSpy = vi.fn(({ currentPage, totalPages }: { currentPage: number; totalPages: number }) => (
  <div data-testid="pagination">Page {currentPage} of {totalPages}</div>
));

vi.mock('@/components/PostCard', () => ({
  PostCard: (props: { post: PostMeta }) => postCardSpy(props),
}));

vi.mock('@/components/Pagination', () => ({
  Pagination: (props: { currentPage: number; totalPages: number }) => paginationSpy(props),
}));

const contentModule = await vi.importMock<typeof import('@/lib/content')>('@/lib/content');
const getPaginatedPosts = vi.mocked(contentModule.getPaginatedPosts);

let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined;

async function loadHome() {
  const mod = await import('../page');
  return mod.default;
}

describe('Home page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  it('renders posts and pagination when content is available', async () => {
    const posts: PostMeta[] = [
      {
        slug: 'welcome',
        title: 'Welcome to the blog',
        date: '2024-01-01',
        excerpt: 'first post',
        tags: ['intro'],
        featured_image: '/img.png',
        readingTime: 3,
        showToc: false,
        headings: [],
      },
      {
        slug: 'second',
        title: 'Another Post',
        date: '2024-01-02',
        excerpt: 'second post',
        tags: ['update'],
        featured_image: undefined,
        readingTime: 4,
        showToc: false,
        headings: [],
      },
    ];

    getPaginatedPosts.mockReturnValue({
      posts,
      totalPages: 3,
      currentPage: 1,
      hasNextPage: true,
      hasPrevPage: false,
    });

    const Home = await loadHome();

    render(<Home />);

    expect(getPaginatedPosts).toHaveBeenCalledWith(1);
    expect(screen.getAllByTestId('post-card')).toHaveLength(2);
    expect(screen.getAllByTestId('pagination')).toHaveLength(2);
    expect(screen.getByText('Latest Posts')).toBeInTheDocument();
  });

  it('renders an error state when loading fails', async () => {
    getPaginatedPosts.mockImplementation(() => {
      throw new Error('boom');
    });

    const Home = await loadHome();

    render(<Home />);

    expect(screen.getByText('Error Loading Posts')).toBeInTheDocument();
    expect(
      screen.getByText('There was an error loading the blog posts. Please try refreshing the page.')
    ).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
