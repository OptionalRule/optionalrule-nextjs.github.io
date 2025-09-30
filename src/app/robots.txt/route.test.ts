import { describe, expect, it, vi } from "vitest";

const feeds = vi.hoisted(() => ({
  generateRobotsTxt: vi.fn(() => "User-agent: *\nAllow: /"),
}));

vi.mock("@/lib/feeds", () => ({
  __esModule: true,
  generateRobotsTxt: feeds.generateRobotsTxt,
}));

import * as module from "./route";

describe("robots.txt route", () => {
  it("marks the route as static", () => {
    expect(module.dynamic).toBe("force-static");
  });

  it("returns plain text robots content", async () => {
    const response = await module.GET();

    expect(feeds.generateRobotsTxt).toHaveBeenCalled();
    expect(await response.text()).toBe("User-agent: *\nAllow: /");
    expect(response.headers.get("Content-Type")).toBe("text/plain");
  });
});
