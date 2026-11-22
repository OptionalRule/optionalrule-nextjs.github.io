import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import NotFound, { metadata } from "../not-found";

describe("not-found page", () => {
  it("explains the missing page and links home and to search", () => {
    const markup = renderToStaticMarkup(<NotFound />);

    expect(markup).toContain("<h1");
    expect(markup).toContain("Page not found");
    expect(markup).toContain('href="/"');
    expect(markup).toContain('href="/search/"');
    expect(markup).toContain('href="/tags/"');
  });

  it("sets a title and keeps the page out of search indexes", () => {
    expect(metadata.title).toBe("Page Not Found");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
