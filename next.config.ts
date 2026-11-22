import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    // Disable the Image Optimization API for static exports
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.redd.it',
      },
      {
        protocol: 'https',
        hostname: 'media.dndbeyond.com',
      },
    ],
  },
  // Configure page extensions (MDX files will be handled by next-mdx-remote)
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
};

export default nextConfig;
