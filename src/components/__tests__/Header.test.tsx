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
      .filter((href): href is string => href !== null && href.startsWith("/") && !href.includes("."));

    expect(internalHrefs).toContain("/");
    expect(internalHrefs).toContain("/search/");

    internalHrefs.forEach((href) => {
      expect(href === "/" || href.endsWith("/")).toBe(true);
    });
  });

  it("closes an open dropdown when clicking elsewhere in the header", () => {
    render(<Header />);

    fireEvent.click(screen.getAllByRole("button", { name: "Tools" })[0]);
    expect(screen.getByText("Torch Tracker")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByAltText("Optional Rule Logo"));
    expect(screen.queryByText("Torch Tracker")).not.toBeInTheDocument();
  });

  it("keeps an open dropdown open when clicking inside it", () => {
    render(<Header />);

    fireEvent.click(screen.getAllByRole("button", { name: "Tools" })[0]);
    fireEvent.mouseDown(screen.getByText("Torch Tracker"));
    expect(screen.getByText("Torch Tracker")).toBeInTheDocument();
  });

  it("keeps a mobile submenu open when pressing one of its links", () => {
    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle navigation menu" }));
    const toolsButtons = screen.getAllByRole("button", { name: "Tools" });
    fireEvent.click(toolsButtons[toolsButtons.length - 1]);

    fireEvent.mouseDown(screen.getByText("Torch Tracker"));
    expect(screen.getByText("Torch Tracker")).toBeInTheDocument();
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
