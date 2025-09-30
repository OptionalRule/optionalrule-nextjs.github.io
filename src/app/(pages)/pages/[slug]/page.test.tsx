import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type PageModule = typeof import("./page");

type StaticPage = {
  slug: string;
  title: string;
  description?: string;
  content: string;
  headings: Array<{ depth: number; value: string; id: string }>;
  showToc?: boolean;
};

const mockGetPage = vi.fn<(slug: string) => StaticPage | undefined>();
const mockGetAllPageSlugs = vi.fn();
const mockGeneratePageMetadata = vi.fn();
const mockNotFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

const mockUrlPaths = {
  home: vi.fn(() => "/"),
  tags: vi.fn(() => "/tags/"),
};

const loadModule = async (): Promise<PageModule> => {
  vi.resetModules();

  vi.doMock("@/lib/content", () => ({
    __esModule: true,
    getPage: mockGetPage,
    getAllPageSlugs: mockGetAllPageSlugs,
  }));

  vi.doMock("@/lib/seo", () => ({
    __esModule: true,
    generatePageMetadata: mockGeneratePageMetadata,
  }));

  vi.doMock("@/lib/urls", () => ({
    __esModule: true,
    urlPaths: mockUrlPaths,
  }));

  vi.doMock("@/components/TableOfContents", () => ({
    __esModule: true,
    default: ({ headings }: { headings: StaticPage["headings"] }) => (
      <div data-testid="toc">{JSON.stringify(headings)}</div>
    ),
  }));

  vi.doMock("@/stories/mdx-components", () => ({
    __esModule: true,
    mdxComponents: {},
  }));

  vi.doMock("@/lib/mdx-options", () => ({
    __esModule: true,
    mdxOptions: {},
  }));

  vi.doMock("next-mdx-remote/rsc", () => ({
    __esModule: true,
    MDXRemote: ({ source }: { source: string }) => (
      <div data-testid="mdx">{source}</div>
    ),
  }));

  vi.doMock("next/navigation", () => ({
    __esModule: true,
    notFound: mockNotFound,
  }));

  return import("./page");
};

type StaticPageProps = Parameters<PageModule["default"]>[0];
const buildParams = (slug: string): StaticPageProps["params"] =>
  Promise.resolve({ slug });

const basePage: StaticPage = {
  slug: "about",
  title: "About",
  description: "About the site",
  content: "<p>Content</p>",
  headings: [{ depth: 2, value: "Intro", id: "intro" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAllPageSlugs.mockReturnValue(["about", "contact"]);
  mockGetPage.mockReturnValue(basePage);
  mockGeneratePageMetadata.mockReturnValue({ title: "Page" });
});

describe("static page route", () => {
  it("exposes static params for all known slugs", async () => {
    const { generateStaticParams } = await loadModule();
    const params = await generateStaticParams();

    expect(mockGetAllPageSlugs).toHaveBeenCalled();
    expect(params).toEqual([
      { slug: "about" },
      { slug: "contact" },
    ]);
  });

  it("returns fallback metadata when the page is missing", async () => {
    mockGetPage.mockReturnValueOnce(undefined);

    const { generateMetadata } = await loadModule();
    const metadata = await generateMetadata({ params: buildParams("missing") });

    expect(metadata).toEqual({ title: "Page Not Found" });
  });

  it("delegates metadata creation to the SEO helper when present", async () => {
    const { generateMetadata } = await loadModule();
    const metadata = await generateMetadata({ params: buildParams("about") });

    expect(mockGeneratePageMetadata).toHaveBeenCalledWith("About", "About the site", "/pages/about/");
    expect(metadata).toEqual({ title: "Page" });
  });

  it("404s when the page cannot be located", async () => {
    mockGetPage.mockReturnValueOnce(undefined);

    const { default: StaticPage } = await loadModule();
    await expect(StaticPage({ params: buildParams("missing") })).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("renders the page with description, toc, and mdx content", async () => {
    const { default: StaticPage } = await loadModule();
    const markup = renderToStaticMarkup(
      await StaticPage({ params: buildParams("about") })
    );

    expect(markup).toContain("About the site");
    expect(markup).toContain("intro");
    expect(markup).toContain("&lt;p&gt;Content&lt;/p&gt;");
    expect(mockUrlPaths.home).toHaveBeenCalled();
  });

  it("omits the table of contents when disabled", async () => {
    mockGetPage.mockReturnValueOnce({ ...basePage, slug: "contact", title: "Contact", showToc: false });

    const { default: StaticPage } = await loadModule();
    const markup = renderToStaticMarkup(
      await StaticPage({ params: buildParams("contact") })
    );

    expect(markup).not.toContain("data-testid=\"toc\"");
  });
});
