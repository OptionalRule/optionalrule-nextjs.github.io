import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { siteConfig } from "@/config/site";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const createMetadata = (): Metadata => {
  const metadata: Metadata = {
    title: {
      default: siteConfig.title,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: '/',
    },
    // Favicon configuration
    icons: {
      icon: [
        { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      shortcut: '/favicon/favicon.ico',
      apple: '/favicon/apple-touch-icon.png',
      other: [
        {
          rel: 'mask-icon',
          url: '/favicon/safari-pinned-tab.svg',
          color: '#000000',
        },
      ],
    },
    manifest: '/favicon/site.webmanifest',
    openGraph: {
      type: 'website',
      locale: siteConfig.locale,
      url: siteConfig.url,
      siteName: siteConfig.name,
      title: siteConfig.title,
      description: siteConfig.description,
      images: [
        {
          url: siteConfig.socialImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.title,
      description: siteConfig.description,
      creator: siteConfig.social.twitter,
      site: siteConfig.social.twitter,
      images: [
        {
          url: siteConfig.socialImage,
          alt: siteConfig.name,
        },
      ],
    },
    robots: {
      index: siteConfig.robots.index,
      follow: siteConfig.robots.follow,
      googleBot: {
        index: siteConfig.robots.index,
        follow: siteConfig.robots.follow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  if (siteConfig.verification.google) {
    metadata.verification = {
      google: siteConfig.verification.google,
    };
  }

  return metadata;
};

export const metadata: Metadata = createMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = headers().get('x-nonce') ?? undefined;
  // Build CSS variable overrides for light/dark from siteConfig.theme
  const light = siteConfig.theme?.light;
  const dark = siteConfig.theme?.dark;
  const themeCss = light && dark ? `:root{--background:${light.background};--foreground:${light.foreground};--surface:${light.surface};--card:${light.card};--muted:${light.muted};--muted-2:${light.muted2};--border:${light.border};--surface-hover:${light.surfaceHover};--link:${light.link};--link-hover:${light.linkHover};--chip-bg:${light.chipBg};--chip-text:${light.chipText};--highlight-bg:${light.highlightBg};color-scheme:light}.dark{--background:${dark.background};--foreground:${dark.foreground};--surface:${dark.surface};--card:${dark.card};--muted:${dark.muted};--muted-2:${dark.muted2};--border:${dark.border};--surface-hover:${dark.surfaceHover};--link:${dark.link};--link-hover:${dark.linkHover};--chip-bg:${dark.chipBg};--chip-text:${dark.chipText};--highlight-bg:${dark.highlightBg};color-scheme:dark}` : '';
  const defaultTheme = siteConfig.defaultTheme ?? 'system';
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={defaultTheme === 'dark' ? 'dark' : undefined}
      data-default-theme={defaultTheme}
    >
      <head>
        {/* Pre-hydration theme script: apply user's theme choice before React mounts */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const def = document.documentElement.getAttribute('data-default-theme') || 'system';
    let isDark;
    if (stored === 'dark' || stored === 'light') {
      isDark = stored === 'dark';
    } else if (def === 'dark') {
      isDark = true;
    } else if (def === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    document.documentElement.classList.toggle('dark', !!isDark);
  } catch (_) { /* no-op */ }
})();`,
          }}
        />
        {themeCss && (
          <style id="theme-vars" dangerouslySetInnerHTML={{ __html: themeCss }} />
        )}
        <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <GoogleAnalytics nonce={nonce} />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
