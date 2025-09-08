import { generateRobotsTxt } from '@/lib/feeds';

export const dynamic = 'force-static';

export async function GET() {
  const robotsContent = generateRobotsTxt();

  return new Response(robotsContent, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

