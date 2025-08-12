export const dynamic = 'force-static';

export async function GET() {
  const robotsContent = `User-agent: *
Allow: /

Sitemap: https://yourdomain.github.io/sitemap.xml`;

  return new Response(robotsContent, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}