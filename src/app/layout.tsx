import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteConfig } from "@/config/site";
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
  return (
    <html lang="en">
      <head>
        <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-gray-900`}
      >
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
