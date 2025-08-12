import { generateSitemap } from '@/lib/feeds';

export const dynamic = 'force-static';

export async function GET() {
  const sitemapContent = generateSitemap();

  return new Response(sitemapContent, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}