import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  // Ensure all pages are statically generated
  experimental: {
    // This ensures all dynamic routes are pre-rendered
    workerThreads: false,
    cpus: 1,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.redd.it',
      },
    ],
  },
  // Configure page extensions (MDX files will be handled by next-mdx-remote)
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
};

export default nextConfig;
