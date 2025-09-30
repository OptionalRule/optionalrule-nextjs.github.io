import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type TagModule = typeof import("./page");

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
  tag: vi.fn((tag: string) => `/tag/${tag}`),
};

const loadTagModule = async (): Promise<TagModule> => {
  vi.resetModules();

  vi.doMock("@/lib/content", () => ({
    __esModule: true,
    getPostsByTag: mockGetPostsByTag,
    getAllTags: mockGetAllTags,
    POSTS_PER_PAGE: 10,
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

type TagPageProps = Parameters<TagModule["default"]>[0];

const buildParams = (overrides: Partial<Awaited<TagPageProps["params"]>> = {}) =>
  Promise.resolve({
    tag: "swords",
    ...overrides,
  });

const tagResponse: TagPostsResponse = {
  tag: "Swords",
  posts: [
    { slug: "a", title: "Alpha" },
    { slug: "b", title: "Beta" },
  ],
  totalPages: 3,
  currentPage: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAllTags.mockReturnValue(["Swords", "Shields"]);
  mockGetPostsByTag.mockReturnValue(tagResponse);
  mockGenerateTagMetadata.mockReturnValue({ title: "Tag" });
});

describe("tag landing page", () => {
  it("creates static params for every available tag", async () => {
    const { generateStaticParams } = await loadTagModule();
    const params = await generateStaticParams();

    expect(mockGetAllTags).toHaveBeenCalled();
    expect(params).toEqual([
      { tag: "swords" },
      { tag: "shields" },
    ]);
  });

  it("returns fallback metadata when the tag has no posts", async () => {
    mockGetPostsByTag.mockReturnValueOnce({
      tag: "empty",
      posts: [],
      totalPages: 0,
      currentPage: 1,
    });

    const { generateMetadata } = await loadTagModule();
    const metadata = await generateMetadata({ params: buildParams({ tag: "empty" }) });

    expect(metadata).toEqual({ title: "Tag Not Found" });
    expect(mockGenerateTagMetadata).not.toHaveBeenCalled();
  });

  it("produces SEO metadata via helper when posts exist", async () => {
    const { generateMetadata } = await loadTagModule();
    const metadata = await generateMetadata({ params: buildParams() });

    expect(mockGenerateTagMetadata).toHaveBeenCalledWith("swords");
    expect(metadata).toEqual({ title: "Tag" });
  });

  it("404s when the tag holds no posts", async () => {
    mockGetPostsByTag.mockReturnValueOnce({
      tag: "empty",
      posts: [],
      totalPages: 0,
      currentPage: 1,
    });

    const { default: TagPage } = await loadTagModule();
    await expect(TagPage({ params: buildParams({ tag: "empty" }) })).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("renders posts, pagination, and breadcrumbs for a populated tag", async () => {
    const { default: TagPage } = await loadTagModule();
    const markup = renderToStaticMarkup(
      await TagPage({ params: buildParams() })
    );

    expect(markup).toContain("Alpha");
    expect(markup).toContain("Beta");
    expect(markup).toContain("1/3");
    expect(mockUrlPaths.home).toHaveBeenCalled();
    expect(mockUrlPaths.tags).toHaveBeenCalled();
    expect(markup).toContain("Posts tagged with");
  });
});
