#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

// Site config (copied from src/config/site.ts)
const siteConfig = {
  title: "Optional Rule",
  description: "Analysis, advice, and adventures for tabletop RPG enthusiasts.",
  url: "https://optionalrule.com",
  language: "en",
  author: {
    name: "Mike Bernier",
    email: "optionalrule@gmail.com"
  },
  publisher: "Optional Rule Games"
};

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
}

function generatePostUrl(date: string, slug: string): string {
  const postDate = new Date(date);
  const year = postDate.getFullYear();
  const month = String(postDate.getMonth() + 1).padStart(2, '0');
  const day = String(postDate.getDate()).padStart(2, '0');
  return `/${year}/${month}/${day}/${slug}/`;
}

function getAllPostsMeta(): PostMeta[] {
  const contentDir = path.join(process.cwd(), 'content', 'posts');
  const files = fs.readdirSync(contentDir);
  
  const posts = files
    .filter(file => file.endsWith('.mdx'))
    .map(file => {
      const filePath = path.join(contentDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContent);
      
      return {
        slug: data.slug,
        title: data.title,
        date: data.date,
        excerpt: data.excerpt || '',
        tags: data.tags || [],
        draft: data.draft || false
      };
    })
    .filter(post => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
  return posts;
}

function generateRSSFeed(): string {
  const posts = getAllPostsMeta();
  
  const rssItems = posts.map(post => {
    const postUrl = `${siteConfig.url}${generatePostUrl(post.date, post.slug)}`;
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

function generateSitemap(): string {
  const posts = getAllPostsMeta();
  
  // Static pages
  const staticPages = [
    { url: '', priority: '1.0' },
    { url: '/pages/about/', priority: '0.8' },
    { url: '/tags/', priority: '0.7' },
  ];
  
  // Dynamic post pages
  const postPages = posts.map(post => ({
    url: generatePostUrl(post.date, post.slug),
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

function main() {
  console.log('Generating RSS feed and sitemap...');
  
  // Generate RSS feed
  const rssContent = generateRSSFeed();
  const rssPath = path.join(process.cwd(), 'public', 'rss.xml');
  fs.writeFileSync(rssPath, rssContent, 'utf8');
  console.log('✓ RSS feed generated at public/rss.xml');
  
  // Generate sitemap
  const sitemapContent = generateSitemap();
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
  console.log('✓ Sitemap generated at public/sitemap.xml');
}

main();