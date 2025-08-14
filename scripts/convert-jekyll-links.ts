import * as fs from 'fs';
import * as path from 'path';

interface ConversionStats {
  totalPosts: number;
  convertedPosts: number;
  skippedPosts: number;
  errors: string[];
  totalLinksConverted: number;
}

class JekyllLinkConverter {
  private stats: ConversionStats;

  constructor() {
    this.stats = {
      totalPosts: 0,
      convertedPosts: 0,
      skippedPosts: 0,
      errors: [],
      totalLinksConverted: 0
    };
  }

  private parseJekyllLink(liquidTag: string): string | null {
    // Match {% link _posts/YYYY-MM-DD-title.md %}
    const postLinkMatch = liquidTag.match(/{%\s*link\s+_posts\/(\d{4}-\d{2}-\d{2}-[^.]+)\.md\s*%}/);
    
    if (postLinkMatch) {
      const filename = postLinkMatch[1]; // e.g., "2021-02-25-the-zen-of-awarding-experience-for-roleplaying"
      
      // Extract date components
      const dateMatch = filename.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
      if (!dateMatch) {
        return null;
      }

      const [, year, month, day, slug] = dateMatch;
      
      // Generate URL format: /YYYY/MM/DD/slug/
      return `/${year}/${month}/${day}/${slug}/`;
    }
    
    // Match {% link assets/... %} - convert to /assets/...
    const assetLinkMatch = liquidTag.match(/{%\s*link\s+assets\/([^}]+)\s*%}/);
    if (assetLinkMatch) {
      const assetPath = assetLinkMatch[1];
      console.log(`  🔗 Converting asset link: ${liquidTag} → /assets/${assetPath}`);
      return `/assets/${assetPath}`;
    }
    
    // Match any other {% link ... %} - log for manual review
    const otherLinkMatch = liquidTag.match(/{%\s*link\s+([^}]+)\s*%}/);
    if (otherLinkMatch) {
      console.log(`  ⚠️  Unhandled link type: ${liquidTag}`);
      return null;
    }
    
    return null;
  }

  private convertJekyllLinks(content: string): { convertedContent: string; linksConverted: number } {
    let convertedContent = content;
    let linksConverted = 0;

    // Find all Jekyll link tags (more flexible pattern)
    const jekyllLinkRegex = /{%\s*link\s+[^}]+%}/g;
    let match;

    console.log(`  🔍 Searching for Jekyll links in content...`);
    
    while ((match = jekyllLinkRegex.exec(content)) !== null) {
      const liquidTag = match[0];
      console.log(`  📝 Found Jekyll link: ${liquidTag}`);
      const convertedUrl = this.parseJekyllLink(liquidTag);
      
      if (convertedUrl) {
        convertedContent = convertedContent.replace(liquidTag, convertedUrl);
        linksConverted++;
        console.log(`  🔗 Converted: ${liquidTag} → ${convertedUrl}`);
      } else {
        console.log(`  ⚠️  Could not parse: ${liquidTag}`);
      }
    }

    return { convertedContent, linksConverted };
  }

  private processPost(filePath: string): boolean {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check if content contains Jekyll link tags (more flexible check)
      const hasJekyllLinks = /{%\s*link\s+/.test(content);
      
      if (!hasJekyllLinks) {
        this.stats.skippedPosts++;
        return false;
      }

      // Convert Jekyll links
      const { convertedContent, linksConverted } = this.convertJekyllLinks(content);
      
      // Write back to file
      fs.writeFileSync(filePath, convertedContent, 'utf-8');
      
      this.stats.convertedPosts++;
      this.stats.totalLinksConverted += linksConverted;
      console.log(`✅ Converted: ${path.basename(filePath)} (${linksConverted} links)`);
      
      return true;
    } catch (error) {
      const errorMsg = `Error processing ${filePath}: ${error}`;
      this.stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      return false;
    }
  }

  public convertAllPosts(postsDir: string): void {
    console.log('🚀 Starting Jekyll Liquid link conversion...\n');
    console.log('🔗 Converting {% link _posts/filename.md %} to /YYYY/MM/DD/slug/ format\n');
    
    try {
      const files = fs.readdirSync(postsDir);
      const mdxFiles = files.filter(file => file.endsWith('.mdx'));
      
      this.stats.totalPosts = mdxFiles.length;
      
      for (const file of mdxFiles) {
        const filePath = path.join(postsDir, file);
        this.processPost(filePath);
      }
      
      this.printStats();
      
    } catch (error) {
      console.error('❌ Error reading posts directory:', error);
    }
  }

  private printStats(): void {
    console.log('\n📊 Conversion Statistics:');
    console.log(`Total posts: ${this.stats.totalPosts}`);
    console.log(`Converted: ${this.stats.convertedPosts}`);
    console.log(`Skipped (no Jekyll links): ${this.stats.skippedPosts}`);
    console.log(`Total links converted: ${this.stats.totalLinksConverted}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n✨ Conversion complete!');
    console.log('🔗 All Jekyll Liquid link tags have been converted to proper MDX URLs.');
  }
}

// Main execution
const postsDir = path.join(process.cwd(), 'content', 'posts');

if (!fs.existsSync(postsDir)) {
  console.error('❌ Posts directory not found:', postsDir);
  process.exit(1);
}

const converter = new JekyllLinkConverter();
converter.convertAllPosts(postsDir);

export default JekyllLinkConverter;
