import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Optional Rule",
    template: "%s | Optional Rule",
  },
  description: "A modern blog about TTRPG and RPG design.",
  keywords: ["ttrpg", "gaming", "rpg", "dungeons and dragons", "shadowdark", "role-playing", "game design"],
  authors: [{ name: "Scott Turnbull" }],
  creator: "Tech-Tavern",
  publisher: "Optional Rule Games",
  metadataBase: new URL('https://optionalrule-nextjs.github.io'), // 
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Optional Rule',
    title: 'Optional Rule',
    description: 'A modern blog about TTRPG and RPG design.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Optional Rule',
    description: 'A modern blog about TTRPG and RPG design.',
    creator: '@optionalrule', // Replace with your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
