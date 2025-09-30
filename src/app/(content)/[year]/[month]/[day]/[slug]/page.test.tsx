import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type PageModule = typeof import("./page");

type Post = {
  slug: string;
  date: string;
  title: string;
  content: string;
  readingTime: number;
  tags: string[];
  excerpt?: string;
  featured_image?: string;
  headings: Array<{ depth: number; value: string; id: string }>;
};

const mockGetAllPostsMeta = vi.fn();
const mockGetPost = vi.fn<(slug: string) => Post | undefined>();
const mockGeneratePostMetadata = vi.fn();
const mockGenerateBlogPostStructuredData = vi.fn();
const mockFormatDate = vi.fn();
const mockNormalizeImagePath = vi.fn();
const mockNotFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

const mockUrlPaths = {
  home: vi.fn(() => "/"),
  tag: vi.fn((tag: string) => `/tag/${tag}`),
  staticPage: vi.fn((slug: string) => `/pages/${slug}/`),
};

const loadPageModule = async (): Promise<PageModule> => {
  vi.resetModules();

  vi.doMock("@/lib/content", () => ({
    __esModule: true,
    getAllPostsMeta: mockGetAllPostsMeta,
    getPost: mockGetPost,
  }));

  vi.doMock("@/lib/seo", () => ({
    __esModule: true,
    generatePostMetadata: mockGeneratePostMetadata,
    generateBlogPostStructuredData: mockGenerateBlogPostStructuredData,
  }));

  vi.doMock("@/lib/utils", async () => {
    const actual = await vi.importActual<typeof import("@/lib/utils")>("@/lib/utils");
    return {
      __esModule: true,
      ...actual,
      formatDate: mockFormatDate,
      normalizeImagePath: mockNormalizeImagePath,
    };
  });

  vi.doMock("@/lib/urls", () => ({
    __esModule: true,
    urlPaths: mockUrlPaths,
  }));

  vi.doMock("@/lib/mdx-options", () => ({
    __esModule: true,
    mdxOptions: { remarkPlugins: [], rehypePlugins: [] },
  }));

  vi.doMock("@/components/TableOfContents", () => ({
    __esModule: true,
    default: ({ headings }: { headings: Post["headings"] }) => (
      <div data-testid="toc">{JSON.stringify(headings)}</div>
    ),
  }));

  vi.doMock("@/stories/mdx-components", () => ({
    __esModule: true,
    mdxComponents: {},
  }));

  vi.doMock("next/image", () => ({
    __esModule: true,
    default: ({
      src,
      alt,
      className,
    }: { src: string; alt: string; className?: string }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img data-testid="next-image" src={src} alt={alt} className={className} />
    ),
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

const buildParams = (overrides: Partial<Awaited<PostPageProps["params"]>>) =>
  Promise.resolve({
    year: "2023",
    month: "09",
    day: "01",
    slug: "test-slug",
    ...overrides,
  });

type PostPageProps = Parameters<PageModule["default"]>[0];

const basePost: Post = {
  slug: "test-slug",
  date: "2023-09-01",
  title: "Test Title",
  content: "<p>MDX content</p>",
  readingTime: 5,
  featured_image: "/images/post.jpg",
  tags: ["Next.js", "Testing"],
  excerpt: "An example post excerpt.",
  headings: [
    { depth: 2, value: "Intro", id: "intro" },
    { depth: 2, value: "Details", id: "details" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPost.mockReturnValue(basePost);
  mockGeneratePostMetadata.mockReturnValue({ title: "Generated" });
  mockGenerateBlogPostStructuredData.mockReturnValue({
    '@type': 'BlogPosting',
  });
  mockFormatDate.mockImplementation(() => "Sep 01, 2023");
  mockNormalizeImagePath.mockImplementation((path: string) => path);
  mockGetAllPostsMeta.mockReturnValue([
    { slug: "test-slug", date: basePost.date },
  ]);
});

describe("blog post route", () => {
  it("creates static params for each post meta entry", async () => {
    const { generateStaticParams } = await loadPageModule();
    const params = await generateStaticParams();

    expect(mockGetAllPostsMeta).toHaveBeenCalledTimes(1);
    expect(params).toEqual([
      {
        year: "2023",
        month: "09",
        day: "01",
        slug: "test-slug",
      },
    ]);
  });

  it("returns fallback metadata when the post is missing", async () => {
    mockGetPost.mockReturnValueOnce(undefined);
    const { generateMetadata } = await loadPageModule();
    const metadata = await generateMetadata({ params: buildParams({ slug: "missing" }) });

    expect(metadata).toEqual({ title: "Post Not Found" });
  });

  it("delegates metadata generation to the SEO helper", async () => {
    const { generateMetadata } = await loadPageModule();
    const metadata = await generateMetadata({ params: buildParams({}) });

    expect(mockGeneratePostMetadata).toHaveBeenCalledWith(basePost);
    expect(metadata).toEqual({ title: "Generated" });
  });

  it("renders the full post layout with structured data", async () => {
    const { default: PostPage } = await loadPageModule();
    const markup = renderToStaticMarkup(
      await PostPage({ params: buildParams({}) })
    );

    const dom = new window.DOMParser().parseFromString(markup, "text/html");

    const structuredScript = dom.querySelector("script[type='application/ld+json']");
    expect(structuredScript?.textContent).toContain("BlogPosting");

    expect(dom.querySelector("[data-testid='toc']")?.textContent).toContain("intro");
    expect(dom.querySelector("[data-testid='mdx']")?.textContent).toBe(basePost.content);
    expect(dom.querySelector("[data-testid='next-image']")?.getAttribute("src")).toBe(basePost.featured_image);

    const navLinks = [...dom.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(navLinks).toContain("/");
    expect(navLinks).toContain("/pages/about/");

    expect(mockFormatDate).toHaveBeenCalled();
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("triggers a 404 when the post slug does not resolve", async () => {
    mockGetPost.mockReturnValueOnce(undefined);
    const { default: PostPage } = await loadPageModule();

    await expect(PostPage({ params: buildParams({ slug: "missing" }) })).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("triggers a 404 when the url date does not match the post", async () => {
    const { default: PostPage } = await loadPageModule();
    await expect(PostPage({ params: buildParams({ month: "08" }) })).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
