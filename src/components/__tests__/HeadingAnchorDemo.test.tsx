import { render, screen } from "@testing-library/react";
import HeadingAnchorDemo from "../HeadingAnchorDemo";

describe("HeadingAnchorDemo", () => {
  it("displays example headings with anchor links", () => {
    render(<HeadingAnchorDemo />);

    const mainHeading = screen.getByRole("heading", { level: 1, name: /main title/i });
    expect(mainHeading).toBeInTheDocument();

    const anchor = screen.getByRole("link", { name: "Link to Main Title" });
    expect(anchor).toHaveAttribute("href", "#main-title");
  });
});
