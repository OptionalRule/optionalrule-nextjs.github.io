import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Module = typeof import("./page");

const mockGetAllTags = vi.fn();
const mockGetPostsByTag = vi.fn();
const mockUrlPaths = {
  home: vi.fn(() => "/"),
  tag: vi.fn((tag: string) => `/tag/${tag}`),
};

const loadModule = async (): Promise<Module> => {
  vi.resetModules();

  vi.doMock("@/lib/content", () => ({
    __esModule: true,
    getAllTags: mockGetAllTags,
    getPostsByTag: mockGetPostsByTag,
    POSTS_PER_PAGE: 10,
  }));

  vi.doMock("@/lib/urls", () => ({
    __esModule: true,
    urlPaths: mockUrlPaths,
  }));

  return import("./page");
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAllTags.mockReturnValue(["swords", "shields"]);
  mockGetPostsByTag.mockImplementation((tag: string) => ({
    tag,
    posts: new Array(tag === "swords" ? 3 : 1).fill({}),
    totalPages: tag === "swords" ? 2 : 1,
  }));
});

describe("tags directory page", () => {
  it("exports descriptive metadata", async () => {
    const tagsModule = await loadModule();
    expect(tagsModule.metadata).toMatchObject({ title: "All Tags" });
  });

  it("renders a helpful message when no tags are available", async () => {
    mockGetAllTags.mockReturnValueOnce([]);

    const { default: TagsPage } = await loadModule();
    const markup = renderToStaticMarkup(<TagsPage />);

    expect(markup).toContain("No tags found");
  });

  it("lists tags sorted by post count and links to tag pages", async () => {
    const { default: TagsPage } = await loadModule();
    const markup = renderToStaticMarkup(<TagsPage />);

    expect(mockGetPostsByTag).toHaveBeenCalledWith("swords", 1);
    expect(mockGetPostsByTag).toHaveBeenCalledWith("shields", 1);
    expect(mockUrlPaths.home).toHaveBeenCalled();
    expect(mockUrlPaths.tag).toHaveBeenCalledWith("swords");
    expect(markup.indexOf("Swords")).toBeLessThan(markup.indexOf("Shields"));
    expect(markup).toContain("3 posts");
    expect(markup).toContain("1 post");
  });
});
