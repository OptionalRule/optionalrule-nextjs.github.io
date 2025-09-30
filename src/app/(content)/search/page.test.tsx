import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

let currentQueryParam = "";

const mockPerformSearch = vi.fn();
let lastSearchProps: {
  results: unknown[];
  query: string;
  isLoading: boolean;
} = { results: [], query: "", isLoading: false };
let lastOnSearch: ((query: string) => void) | undefined;

vi.mock("next/navigation", () => ({
  __esModule: true,
  useSearchParams: (() => {
    const params = { get: (key: string) => (key === "q" ? currentQueryParam : null) };
    return vi.fn(() => params);
  })(),
}));

vi.mock("@/components/SearchInput", () => ({
  __esModule: true,
  SearchInput: ({ onSearch }: { onSearch: (query: string) => void }) => {
    lastOnSearch = onSearch;
    return <div data-testid="search-input" />;
  },
}));

vi.mock("@/components/SearchResults", () => ({
  __esModule: true,
  SearchResults: (props: typeof lastSearchProps) => {
    lastSearchProps = {
      results: Array.isArray(props.results) ? [...props.results] : props.results,
      query: props.query,
      isLoading: props.isLoading,
    };
    return (
      <div data-testid="search-results">
        Results:{props.results.length};Query:{props.query};Loading:
        {String(props.isLoading)}
      </div>
    );
  },
}));

vi.mock("@/lib/search", () => ({
  __esModule: true,
  performSearch: async (...args: Parameters<typeof mockPerformSearch>) =>
    mockPerformSearch(...args),
}));

describe("search page", () => {
  let consoleErrorSpy: vi.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    currentQueryParam = "";
    mockPerformSearch.mockReset();
    mockPerformSearch.mockImplementation(() => []);
    lastSearchProps = { results: [], query: "", isLoading: false };
    lastOnSearch = undefined;
  });

  it("initializes from the URL query and renders search results", async () => {
    currentQueryParam = "wizard";
    mockPerformSearch.mockImplementationOnce(() => [
      { slug: "a", title: "Alpha" },
      { slug: "b", title: "Beta" },
    ]);

    const { default: SearchPage } = await import("./page");
    render(<SearchPage />);

    await waitFor(() => {
      expect(mockPerformSearch).toHaveBeenCalledWith({ query: "wizard", limit: 50 });
    });

    await waitFor(() => {
      expect(lastSearchProps.results).toHaveLength(2);
      expect(lastSearchProps.query).toBe("wizard");
      expect(lastSearchProps.isLoading).toBe(false);
    });

    expect(screen.queryByText("Search Tips")).toBeNull();
  });

  it("clears results for blank searches without hitting the search API", async () => {
    const { default: SearchPage } = await import("./page");
    render(<SearchPage />);

    await waitFor(() => {
      expect(typeof lastOnSearch).toBe("function");
    });

    await act(async () => {
      await lastOnSearch?.("   ");
    });

    expect(mockPerformSearch).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(lastSearchProps.results).toEqual([]);
    });

    expect(screen.queryByText("Search Tips")).toBeNull();
  });

  it("handles search failures by resetting the result list", async () => {
    const { default: SearchPage } = await import("./page");
    render(<SearchPage />);

    await waitFor(() => {
      expect(typeof lastOnSearch).toBe("function");
    });

    mockPerformSearch.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    await act(async () => {
      await lastOnSearch?.("cleric");
    });

    await waitFor(() => {
      expect(mockPerformSearch).toHaveBeenCalledWith({ query: "cleric", limit: 50 });
      expect(lastSearchProps.isLoading).toBe(false);
      expect(lastSearchProps.results).toEqual([]);
    });
  });
});
