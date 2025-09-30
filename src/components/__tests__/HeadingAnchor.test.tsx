import { render, screen } from "@testing-library/react";
import HeadingAnchor from "../HeadingAnchor";

describe("HeadingAnchor", () => {
  it("links to the provided heading id with accessible labelling", () => {
    render(<HeadingAnchor id="section-1" headingText="Section 1" />);

    const anchor = screen.getByRole("link", { name: "Link to Section 1" });
    expect(anchor).toHaveAttribute("href", "#section-1");
    expect(anchor).toHaveAttribute("title", "Link to Section 1");
  });
});
