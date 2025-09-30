import { describe, expect, it, vi } from "vitest";

const feeds = vi.hoisted(() => ({
  generateSitemap: vi.fn(() => "<urlset></urlset>"),
}));

vi.mock("@/lib/feeds", () => ({
  __esModule: true,
  generateSitemap: feeds.generateSitemap,
}));

import * as module from "./route";

describe("sitemap route", () => {
  it("marks the route as static", () => {
    expect(module.dynamic).toBe("force-static");
  });

  it("returns XML sitemap content", async () => {
    const response = await module.GET();

    expect(feeds.generateSitemap).toHaveBeenCalled();
    expect(await response.text()).toBe("<urlset></urlset>");
    expect(response.headers.get("Content-Type")).toBe("application/xml");
  });
});
