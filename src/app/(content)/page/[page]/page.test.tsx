import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type PageModule = typeof import("./page");

type PaginatedPost = {
  slug: string;
  title: string;
};

type PaginatedResult = {
  posts: PaginatedPost[];
  totalPages: number;
  currentPage: number;
};

const mockGetAllPostsMeta = vi.fn();
const mockGetPaginatedPosts = vi.fn<(page: number) => PaginatedResult>();
const mockGeneratePaginationMetadata = vi.fn();
const mockNotFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

const loadPageModule = async (): Promise<PageModule> => {
  vi.resetModules();

  vi.doMock("@/lib/content", () => ({
    __esModule: true,
    POSTS_PER_PAGE: 10,
    getPaginatedPosts: mockGetPaginatedPosts,
    getAllPostsMeta: mockGetAllPostsMeta,
  }));

  vi.doMock("@/lib/seo", () => ({
    __esModule: true,
    generatePaginationMetadata: mockGeneratePaginationMetadata,
  }));

  vi.doMock("@/components/PostCard", () => ({
    __esModule: true,
    PostCard: ({ post }: { post: PaginatedPost }) => (
      <div data-testid="post-card">{post.title}</div>
    ),
  }));

  vi.doMock("@/components/Pagination", () => ({
    __esModule: true,
    Pagination: ({ currentPage, totalPages }: PaginatedResult) => (
      <div data-testid="pagination">{`${currentPage}/${totalPages}`}</div>
    ),
  }));

  vi.doMock("next/navigation", () => ({
    __esModule: true,
    notFound: mockNotFound,
  }));

  return import("./page");
};

type PageComponentProps = Parameters<PageModule["default"]>[0];

const buildParams = (page: string): PageComponentProps["params"] =>
  Promise.resolve({ page });

const defaultResult: PaginatedResult = {
  posts: [
    { slug: "first", title: "First" },
    { slug: "second", title: "Second" },
  ],
  totalPages: 3,
  currentPage: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAllPostsMeta.mockReturnValue(new Array(25).fill(null));
  mockGetPaginatedPosts.mockReturnValue(defaultResult);
  mockGeneratePaginationMetadata.mockReturnValue({ title: "Page" });
});

let consoleErrorSpy: vi.SpyInstance;

beforeAll(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

describe("paginated blog route", () => {
  it("generates params for pages two and beyond", async () => {
    const { generateStaticParams } = await loadPageModule();
    const params = await generateStaticParams();

    expect(mockGetAllPostsMeta).toHaveBeenCalled();
    expect(params).toEqual([
      { page: "2" },
      { page: "3" },
    ]);
  });

  it("builds metadata via the SEO helper", async () => {
    const { generateMetadata } = await loadPageModule();
    const metadata = await generateMetadata({ params: buildParams("4") });

    expect(mockGeneratePaginationMetadata).toHaveBeenCalledWith(4);
    expect(metadata).toEqual({ title: "Page" });
  });

  it("404s when page is invalid or less than two", async () => {
    const { default: PagePage } = await loadPageModule();

    await expect(PagePage({ params: buildParams("1") })).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("invokes notFound when the paginator returns no posts and surfaces the fallback view", async () => {
    mockGetPaginatedPosts.mockReturnValueOnce({
      posts: [],
      totalPages: 1,
      currentPage: 2,
    });

    const { default: PagePage } = await loadPageModule();

    const markup = renderToStaticMarkup(
      await PagePage({ params: buildParams("2") })
    );

    expect(mockNotFound).toHaveBeenCalledTimes(1);
    expect(markup).toContain("Error Loading Posts");
    expect(markup).toContain("NOT_FOUND");
  });

  it("renders an error screen when pagination throws", async () => {
    mockGetPaginatedPosts.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const { default: PagePage } = await loadPageModule();
    const markup = renderToStaticMarkup(
      await PagePage({ params: buildParams("2") })
    );

    expect(markup).toContain("Error Loading Posts");
    expect(markup).toContain("boom");
  });

  it("renders the paginated posts when available", async () => {
    const { default: PagePage } = await loadPageModule();
    const markup = renderToStaticMarkup(
      await PagePage({ params: buildParams("2") })
    );

    expect(markup).toContain("First");
    expect(markup).toContain("Second");
    expect(markup).toContain("2/3");
  });
});
