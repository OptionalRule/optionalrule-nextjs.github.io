import { fireEvent, render, screen } from "@testing-library/react";
import TableOfContents from "../TableOfContents";

const headings = [
  { level: 1, text: "Intro", id: "intro" },
  { level: 2, text: "Getting Started", id: "getting-started" },
  { level: 3, text: "Deep Dive", id: "deep-dive" },
  { level: 4, text: "Extras", id: "extras" },
];

describe("TableOfContents", () => {
  it("returns null when no headings are supplied", () => {
    const { container } = render(<TableOfContents headings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders heading links with indentation and aria metadata", () => {
    render(<TableOfContents headings={headings} className="custom" />);

    const container = screen.getByRole("navigation");
    expect(container.className).toContain("custom");

    const topLevel = screen.getByRole("link", { name: "Intro" });
    expect(topLevel).toHaveAttribute("href", "#intro");
    expect(topLevel.className).toContain("font-semibold");

    const nested = screen.getByRole("link", { name: "Getting Started" });
    expect(nested.className).toContain("ml-4");
  });

  it("toggles visibility when the header button is clicked", () => {
    render(<TableOfContents headings={headings} defaultExpanded={false} />);

    const button = screen.getByRole("button", { name: /table of contents/i });
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    const panel = screen.getByRole("list").parentElement;
    expect(panel?.className).toContain("max-h-96");
  });
});
