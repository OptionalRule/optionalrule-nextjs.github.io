import React from "react";
import { describe, expect, it, vi } from "vitest";

const seoMocks = vi.hoisted(() => ({
  generateMetadata: vi.fn(() => ({ title: "Search" })),
}));

vi.mock("@/lib/seo", () => ({
  __esModule: true,
  generateMetadata: seoMocks.generateMetadata,
}));

describe("search layout", () => {
  it("exports metadata generated from SEO helper", async () => {
    const layoutModule = await import("./layout");

    expect(seoMocks.generateMetadata).toHaveBeenCalledWith({
      title: "Search",
      description: "Search posts by title, excerpt, or tags",
      canonical: "/search/",
    });
    expect(layoutModule.metadata).toEqual({ title: "Search" });
  });

  it("renders child content transparently", async () => {
    const layoutModule = await import("./layout");
    const child = <div data-testid="child" />;

    expect(layoutModule.default({ children: child })).toBe(child);
  });
});
