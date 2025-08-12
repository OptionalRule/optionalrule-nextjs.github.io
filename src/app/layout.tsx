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
    default: "My Blog",
    template: "%s | My Blog",
  },
  description: "A modern blog about web development, best practices, and emerging technologies.",
  keywords: ["web development", "javascript", "typescript", "react", "nextjs", "programming", "technology"],
  authors: [{ name: "Blog Author" }],
  creator: "Blog Author",
  publisher: "My Blog",
  metadataBase: new URL('https://yourdomain.github.io'), // Replace with your GitHub Pages URL
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'My Blog',
    title: 'My Blog',
    description: 'A modern blog about web development, best practices, and emerging technologies.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Blog',
    description: 'A modern blog about web development, best practices, and emerging technologies.',
    creator: '@yourusername', // Replace with your Twitter handle
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900`}
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
