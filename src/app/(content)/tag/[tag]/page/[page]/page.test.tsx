import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type TagPageModule = typeof import("./page");

type TagPostsResponse = {
  tag: string;
  posts: Array<{ slug: string; title: string }>;
  totalPages: number;
  currentPage: number;
};

const mockGetPostsByTag = vi.fn<(tag: string, page: number) => TagPostsResponse>();
const mockGetAllTags = vi.fn();
const mockGenerateTagMetadata = vi.fn();
const mockNotFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

const mockUrlPaths = {
  home: vi.fn(() => "/"),
  tags: vi.fn(() => "/tags/"),
  tag: vi.fn((slug: string) => `/tag/${slug}`),
};

const loadModule = async (): Promise<TagPageModule> => {
  vi.resetModules();

  vi.doMock("@/lib/content", () => ({
    __esModule: true,
    getPostsByTag: mockGetPostsByTag,
    getAllTags: mockGetAllTags,
  }));

  vi.doMock("@/lib/seo", () => ({
    __esModule: true,
    generateTagMetadata: mockGenerateTagMetadata,
  }));

  vi.doMock("@/components/PostCard", () => ({
    __esModule: true,
    PostCard: ({ post }: { post: { title: string } }) => (
      <div data-testid="post-card">{post.title}</div>
    ),
  }));

  vi.doMock("@/components/Pagination", () => ({
    __esModule: true,
    Pagination: ({ currentPage, totalPages }: { currentPage: number; totalPages: number }) => (
      <div data-testid="pagination">{`${currentPage}/${totalPages}`}</div>
    ),
  }));

  vi.doMock("@/lib/urls", () => ({
    __esModule: true,
    urlPaths: mockUrlPaths,
  }));

  vi.doMock("next/navigation", () => ({
    __esModule: true,
    notFound: mockNotFound,
  }));

  return import("./page");
};

type PageProps = Parameters<TagPageModule["default"]>[0];
const buildParams = (overrides: Partial<Awaited<PageProps["params"]>>) =>
  Promise.resolve({
    tag: "swords",
    page: "2",
    ...overrides,
  });

const tagResult: TagPostsResponse = {
  tag: "Swords",
  posts: [
    { slug: "a", title: "Alpha" },
  ],
  totalPages: 4,
  currentPage: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAllTags.mockReturnValue(["Swords", "Shields"]);
  mockGetPostsByTag.mockImplementation((tag, page) => ({
    tag: tag.charAt(0).toUpperCase() + tag.slice(1),
    posts: page > 3 ? [] : tagResult.posts,
    totalPages: 4,
    currentPage: page,
  }));
  mockGenerateTagMetadata.mockReturnValue({ title: "Tag Page" });
});

describe("tag pagination route", () => {
  it("creates params for tag pages beyond the first", async () => {
    const { generateStaticParams } = await loadModule();
    const params = await generateStaticParams();

    expect(mockGetAllTags).toHaveBeenCalled();
    expect(params).toEqual([
      { tag: "swords", page: "2" },
      { tag: "swords", page: "3" },
      { tag: "swords", page: "4" },
      { tag: "shields", page: "2" },
      { tag: "shields", page: "3" },
      { tag: "shields", page: "4" },
    ]);
  });

  it("generates metadata for the requested page", async () => {
    const { generateMetadata } = await loadModule();
    const metadata = await generateMetadata({ params: buildParams({ page: "3" }) });

    expect(mockGenerateTagMetadata).toHaveBeenCalledWith("swords", 3);
    expect(metadata).toEqual({ title: "Tag Page" });
  });

  it("404s for invalid page numbers", async () => {
    const { default: TagPagePage } = await loadModule();

    await expect(TagPagePage({ params: buildParams({ page: "1" }) })).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("404s when the page has no posts", async () => {
    const { default: TagPagePage } = await loadModule();

    await expect(TagPagePage({ params: buildParams({ page: "5" }) })).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("renders the paginated tag view when posts exist", async () => {
    const { default: TagPagePage } = await loadModule();
    const markup = renderToStaticMarkup(
      await TagPagePage({ params: buildParams({ page: "2" }) })
    );

    expect(markup).toContain("Alpha");
    expect(markup).toContain("2/4");
    expect(mockUrlPaths.tag).toHaveBeenCalled();
  });
});
