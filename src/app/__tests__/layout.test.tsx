import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

type LayoutModule = typeof import("../layout");
type SiteConfig = typeof import("@/config/site")["siteConfig"];
type DeepWriteable<T> = { -readonly [Key in keyof T]: DeepWriteable<T[Key]> };
type MutableSiteConfig = DeepWriteable<SiteConfig>;

type ConfigMutator<Config> = (config: Config) => void;

const cloneConfig = <T,>(config: T): DeepWriteable<T> => JSON.parse(JSON.stringify(config)) as DeepWriteable<T>;

async function loadLayoutModule(mutate?: ConfigMutator<MutableSiteConfig>) {
  vi.resetModules();

  const actualSiteModule = await vi.importActual<typeof import("@/config/site")>("@/config/site");

  const siteConfigClone = cloneConfig(actualSiteModule.siteConfig);
  mutate?.(siteConfigClone);

  const googleAnalyticsMock = vi.fn(() => <div data-testid="ga-component" />);

  vi.doMock("@/config/site", () => ({
    __esModule: true,
    siteConfig: siteConfigClone,
  }));

  vi.doMock("@/components/Header", () => ({
    __esModule: true,
    Header: () => <header data-testid="layout-header" />,
  }));

  vi.doMock("@/components/Footer", () => ({
    __esModule: true,
    Footer: () => <footer data-testid="layout-footer" />,
  }));

  vi.doMock("@/components/GoogleAnalytics", () => ({
    __esModule: true,
    GoogleAnalytics: googleAnalyticsMock,
  }));

  vi.doMock("next/font/google", () => ({
    __esModule: true,
    Geist: () => ({ variable: "font-geist-sans" }),
    Geist_Mono: () => ({ variable: "font-geist-mono" }),
  }));

  const layoutModule = (await import("../layout")) as LayoutModule;

  return { ...layoutModule, siteConfigClone, googleAnalyticsMock };
}

describe("layout metadata", () => {
  it("builds metadata from the site configuration", async () => {
    const { metadata, siteConfigClone } = await loadLayoutModule();

    expect(metadata).toMatchObject({
      title: {
        default: siteConfigClone.title,
        template: `%s | ${siteConfigClone.name}`,
      },
      description: siteConfigClone.description,
      keywords: siteConfigClone.keywords,
      authors: [
        {
          name: siteConfigClone.author.name,
          url: siteConfigClone.author.url,
        },
      ],
      alternates: {
        canonical: "/",
      },
      openGraph: {
        url: siteConfigClone.url,
        siteName: siteConfigClone.name,
        title: siteConfigClone.title,
        description: siteConfigClone.description,
      },
      twitter: {
        card: "summary_large_image",
        title: siteConfigClone.title,
        description: siteConfigClone.description,
      },
      robots: {
        index: siteConfigClone.robots.index,
        follow: siteConfigClone.robots.follow,
        googleBot: {
          index: siteConfigClone.robots.index,
          follow: siteConfigClone.robots.follow,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    });

    expect(metadata.icons?.icon?.[0]?.url).toBe("/favicon/favicon-16x16.png");
    expect(metadata.icons?.shortcut).toBe("/favicon/favicon.ico");
    expect(metadata.verification).toBeUndefined();
  });

  it("includes Google verification when configured", async () => {
    const { metadata } = await loadLayoutModule((config) => {
      config.verification.google = "google-site-code";
    });

    expect(metadata.verification).toEqual({ google: "google-site-code" });
  });
});

describe("RootLayout component", () => {
  it("renders the HTML shell with theme script and structure", async () => {
    const { default: RootLayout, siteConfigClone, googleAnalyticsMock } = await loadLayoutModule();

    const markup = renderToStaticMarkup(
      <RootLayout>
        <div>Page Body</div>
      </RootLayout>,
    );

    const dom = new window.DOMParser().parseFromString(markup, "text/html");

    const html = dom.documentElement;
    expect(html.getAttribute("lang")).toBe("en");
    expect(html.getAttribute("data-default-theme")).toBe(siteConfigClone.defaultTheme);
    expect(html.classList.contains("dark")).toBe(true);

    const themeScript = dom.querySelector("head script");
    expect(themeScript?.textContent).toContain("localStorage.getItem('theme')");

    const msMeta = dom.querySelector("meta[name='msapplication-config']");
    expect(msMeta?.getAttribute("content")).toBe("/favicon/browserconfig.xml");

    const body = dom.body;
    expect(body.className).toContain("antialiased");
    expect(body.className).toContain("font-sans");

    expect(dom.querySelector("[data-testid='ga-component']")).not.toBeNull();
    expect(dom.querySelector("[data-testid='layout-header']")).not.toBeNull();
    expect(dom.querySelector("[data-testid='layout-footer']")).not.toBeNull();
    expect(dom.querySelector("main")?.textContent).toContain("Page Body");

    expect(googleAnalyticsMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to system theme when no default is set", async () => {
    const { default: RootLayout } = await loadLayoutModule((config) => {
      delete (config as Record<string, unknown>).defaultTheme;
    });

    const markup = renderToStaticMarkup(
      <RootLayout>
        <div>Content</div>
      </RootLayout>,
    );

    const dom = new window.DOMParser().parseFromString(markup, "text/html");
    const html = dom.documentElement;

    expect(html.getAttribute("data-default-theme")).toBe("system");
    expect(html.classList.contains("dark")).toBe(false);
  });
});
