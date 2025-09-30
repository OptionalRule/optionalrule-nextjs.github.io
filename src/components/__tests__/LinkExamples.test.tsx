import { render, screen } from "@testing-library/react";
import LinkExamples from "../LinkExamples";

describe("LinkExamples", () => {
  it("renders representative SmartLink variations", () => {
    render(<LinkExamples />);

    expect(screen.getByRole("heading", { name: /smartlink component examples/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /about page/i })).toHaveAttribute("href", "/pages/about/");
    expect(screen.getByRole("link", { name: /next.js documentation/i })).toHaveAttribute("href", "https://nextjs.org");
    expect(screen.getByRole("link", { name: /send email/i })).toHaveAttribute("href", "mailto:example@example.com");
    expect(screen.getByRole("link", { name: /call us/i })).toHaveAttribute("href", "tel:+1234567890");
  });
});
