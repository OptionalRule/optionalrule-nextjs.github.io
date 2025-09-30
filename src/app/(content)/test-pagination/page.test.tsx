import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Module = typeof import("./page");

const mockGetAllPostsMeta = vi.fn();
const mockGetPaginatedPosts = vi.fn();

const loadModule = async (): Promise<Module> => {
  vi.resetModules();

  vi.doMock("@/lib/content", () => ({
    __esModule: true,
    getAllPostsMeta: mockGetAllPostsMeta,
    getPaginatedPosts: mockGetPaginatedPosts,
    POSTS_PER_PAGE: 10,
  }));

  vi.doMock("@/components/Pagination", () => ({
    __esModule: true,
    Pagination: ({ currentPage, totalPages }: { currentPage: number; totalPages: number }) => (
      <div data-testid="pagination">{`${currentPage}/${totalPages}`}</div>
    ),
  }));

  return import("./page");
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAllPostsMeta.mockReturnValue(new Array(25).fill({}));
  mockGetPaginatedPosts.mockImplementation((page: number) => ({
    posts: new Array(page).fill({ title: `Post ${page}` }),
    totalPages: 3,
    currentPage: page,
  }));
});

describe("test pagination showcase", () => {
  it("renders debug information about pagination totals", async () => {
    const { default: TestPaginationPage } = await loadModule();
    const markup = renderToStaticMarkup(<TestPaginationPage />);

    expect(markup).toContain("Total posts: 25");
    expect(markup).toContain("Total pages: 3");
    expect(markup).toContain("Test pages: 1, 2, 3");
  });

  it("invokes the paginator for each sampled page", async () => {
    const { default: TestPaginationPage } = await loadModule();
    renderToStaticMarkup(<TestPaginationPage />);

    expect(mockGetPaginatedPosts).toHaveBeenCalledWith(1);
    expect(mockGetPaginatedPosts).toHaveBeenCalledWith(2);
    expect(mockGetPaginatedPosts).toHaveBeenCalledWith(3);
  });

  it("filters sample pages when less than three exist", async () => {
    mockGetAllPostsMeta.mockReturnValueOnce(new Array(5).fill({}));
    mockGetPaginatedPosts.mockImplementationOnce((page: number) => ({
      posts: new Array(page).fill({ title: `Post ${page}` }),
      totalPages: 1,
      currentPage: page,
    }));

    const { default: TestPaginationPage } = await loadModule();
    const markup = renderToStaticMarkup(<TestPaginationPage />);

    expect(markup).toContain("Test pages: 1");
  });
});
