import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import HeadingIdDemo from "../HeadingIdDemo";

vi.mock("@/lib/utils", () => ({
  __esModule: true,
  generateHeadingId: (text: string) => text.toLowerCase().replace(/\s+/g, "-")
}));

describe("HeadingIdDemo", () => {
  it("lists generated ids for sample headings", () => {
    render(<HeadingIdDemo />);

    expect(screen.getByText(/heading id generation examples/i)).toBeInTheDocument();
    expect(screen.getByText(/#getting-started-with-next.js/i)).toBeInTheDocument();
    expect(screen.getByText(/#conclusion/i)).toBeInTheDocument();
  });
});
