import { getAllPostsMeta } from './content';
import { urlPaths } from './urls';
import { siteConfig } from '../config/site';

// Generate RSS feed XML
export function generateRSSFeed(): string {
  const posts = getAllPostsMeta();
  
  const rssItems = posts.map(post => {
    const postUrl = `${siteConfig.url}${urlPaths.post(post.date, post.slug)}`;
    const pubDate = new Date(post.date).toUTCString();
    
    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <category><![CDATA[${post.tags?.join(', ') || ''}]]></category>
    </item>`;
  }).join('');

  const lastBuildDate = posts.length > 0 
    ? new Date(posts[0].date).toUTCString()
    : new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${siteConfig.title}]]></title>
    <description><![CDATA[${siteConfig.description}]]></description>
    <link>${siteConfig.url}</link>
    <atom:link href="${siteConfig.url}/rss.xml" rel="self" type="application/rss+xml" />
    <language>${siteConfig.language}</language>
    <managingEditor>${siteConfig.author.email} (${siteConfig.author.name})</managingEditor>
    <webMaster>${siteConfig.author.email} (${siteConfig.author.name})</webMaster>
    <copyright>Copyright ${new Date().getFullYear()} ${siteConfig.publisher}</copyright>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <ttl>60</ttl>
    ${rssItems}
  </channel>
</rss>`;
}

// Generate sitemap XML
export function generateSitemap(): string {
  const posts = getAllPostsMeta();
  
  // Static pages
  const staticPages = [
    { url: '', priority: '1.0' },
    { url: '/pages/about/', priority: '0.8' },
    { url: '/tags/', priority: '0.7' },
  ];
  
  // Dynamic post pages
  const postPages = posts.map(post => ({
    url: urlPaths.post(post.date, post.slug),
    lastmod: post.date,
    priority: '0.9',
  }));
  
  // Pagination pages (if needed)
  const totalPages = Math.ceil(posts.length / 10);
  const paginationPages = [];
  for (let i = 2; i <= totalPages; i++) {
    paginationPages.push({
      url: `/page/${i}/`,
      priority: '0.6',
    });
  }
  
  // Get unique tags
  const tags = new Set<string>();
  posts.forEach(post => {
    post.tags?.forEach(tag => tags.add(tag.toLowerCase()));
  });
  
  const tagPages = Array.from(tags).map(tag => ({
    url: `/tag/${tag}/`,
    priority: '0.6',
  }));
  
  const allPages = [...staticPages, ...postPages, ...paginationPages, ...tagPages];
  
  const urlEntries = allPages.map(page => {
    const fullUrl = `${siteConfig.url}${page.url}`;
    const lastmod = ('lastmod' in page) ? `<lastmod>${page.lastmod}</lastmod>` : '';
    const priority = page.priority ? `<priority>${page.priority}</priority>` : '';
    
    return `
  <url>
    <loc>${fullUrl}</loc>
    ${lastmod}
    <changefreq>weekly</changefreq>
    ${priority}
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlEntries}
</urlset>`;
}