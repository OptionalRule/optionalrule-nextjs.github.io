import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "../Header";

describe("Header navigation", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("ensures internal navigation links retain trailing slashes", async () => {
    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle navigation menu" }));

    const clickLastButton = (label: string) => {
      const buttons = screen.getAllByRole("button", { name: label });
      fireEvent.click(buttons[buttons.length - 1]);
    };

    clickLastButton("Blog");
    clickLastButton("Games");
    clickLastButton("Tools");

    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
    const internalHrefs = anchors
      .map((anchor) => anchor.getAttribute("href"))
      .filter((href): href is string => Boolean(href) && href.startsWith("/") && !href.includes("."));

    expect(internalHrefs).toContain("/");
    expect(internalHrefs).toContain("/search/");

    internalHrefs.forEach((href) => {
      expect(href === "/" || href.endsWith("/")).toBe(true);
    });
  });

  it("marks external utility links with security attributes", () => {
    render(<Header />);

    const externalLink = screen.getByTitle("X (Twitter)");
    expect(externalLink).toHaveAttribute("href", "https://x.com/optionalrule");
    expect(externalLink).toHaveAttribute("target", "_blank");
    const rel = externalLink.getAttribute("rel");
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
  });
});
