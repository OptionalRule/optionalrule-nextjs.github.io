import { siteConfig } from '@/config/site';

export const dynamic = 'force-static';

export async function GET() {
  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${siteConfig.url}/sitemap.xml`;

  return new Response(robotsContent, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

