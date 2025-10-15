import { render, screen, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import HeadingAnchor from "../HeadingAnchor";

describe("HeadingAnchor", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders heading with anchor link and accessible labelling", () => {
    render(<HeadingAnchor level={2}>Section 1</HeadingAnchor>);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute("id", "section-1");
    expect(heading).toHaveTextContent("Section 1");

    const anchor = screen.getByRole("link", { name: "Link to Section 1" });
    expect(anchor).toHaveAttribute("href", "#section-1");
    expect(anchor).toHaveAttribute("title", "Link to Section 1");
  });

  it("generates correct id from heading text", () => {
    render(<HeadingAnchor level={3}>My Test Heading!</HeadingAnchor>);

    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveAttribute("id", "my-test-heading");
  });

  it("renders different heading levels correctly", () => {
    const { rerender } = render(<HeadingAnchor level={1}>H1 Heading</HeadingAnchor>);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

    rerender(<HeadingAnchor level={4}>H4 Heading</HeadingAnchor>);
    expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
  });
});
