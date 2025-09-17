import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SearchResult as SearchHit } from "@/lib/search";
import { setMockSearchParams } from "@/test-utils/mocks";

vi.mock("@/lib/search", async () => {
  const actual = await vi.importActual<typeof import("@/lib/search")>("@/lib/search");
  return {
    ...actual,
    performSearch: vi.fn(),
  };
});

const searchModule = await vi.importMock<typeof import("@/lib/search")>("@/lib/search");
const performSearch = vi.mocked(searchModule.performSearch);
const loadSearchPage = async () => (await import("../search/page")).default;

describe("Search page integration", () => {
  beforeEach(() => {
    performSearch.mockReset();
    setMockSearchParams();
  });

  it("renders sanitized results for the initial query", async () => {
    setMockSearchParams({ q: 'alchemy' });

    const dangerousResult: SearchHit = {
      item: {
        slug: "danger",
        title: "Alchemy <script>alert(1)</script>",
        excerpt: "<img src=\"x\" onerror=\"alert(1)\">",
        tags: ["Guides", "How-To"],
        content: "Alchemy content",
        date: "2024-01-01",
        readingTime: 4,
      },
      score: 0.2,
    };

    performSearch.mockResolvedValue([dangerousResult]);

    const SearchPage = await loadSearchPage();
    const { container } = render(<SearchPage />);

    await waitFor(() =>
      expect(performSearch).toHaveBeenCalledWith({ query: "alchemy", limit: 50 })
    );

    expect(await screen.findAllByRole("article")).toHaveLength(1);

    const titleMatches = screen.getAllByText((_, element) =>
      element?.textContent?.includes("<script>alert(1)</script>") ?? false
    );
    expect(titleMatches).not.toHaveLength(0);

    const excerptMatches = screen.getAllByText((_, element) =>
      element?.textContent?.includes('<img src="x" onerror="alert(1)">') ?? false
    );
    expect(excerptMatches).not.toHaveLength(0);

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();

    expect(screen.getByRole("link", { name: "Guides" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How-To" })).toBeInTheDocument();
  });

  it("shows loading state while searching and renders results once complete", async () => {
    const deferred = (() => {
      let resolve!: (value: SearchHit[]) => void;
      const promise = new Promise<SearchHit[]>((res) => {
        resolve = res;
      });
      return { promise, resolve };
    })();

    performSearch.mockImplementation(() => deferred.promise);

    const SearchPage = await loadSearchPage();
    const { container } = render(<SearchPage />);

    const user = userEvent.setup();
    const input = await screen.findByPlaceholderText("Search for posts...");

    await user.type(input, "elixir");

    await waitFor(() =>
      expect(performSearch).toHaveBeenCalledWith({ query: "elixir", limit: 50 })
    );

    await waitFor(() => {
      expect(container.querySelector('[class*="animate-pulse"]')).not.toBeNull();
    });

    await act(async () => {
      deferred.resolve([
        {
          item: {
            slug: "elixir-guide",
            title: "Elixir Brewing",
            excerpt: "Learn how to brew.",
            tags: ["Guides"],
            content: "",
            date: "2024-02-02",
            readingTime: 5,
          },
          score: 0.1,
        },
      ]);
      await Promise.resolve();
    });

    const articles = await screen.findAllByRole("article");
    expect(articles).toHaveLength(1);
  });
});
