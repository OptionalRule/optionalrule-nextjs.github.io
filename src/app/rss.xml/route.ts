import { generateRSSFeed } from '@/lib/feeds';

export const dynamic = 'force-static';

export async function GET() {
  const rssContent = generateRSSFeed();

  return new Response(rssContent, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}