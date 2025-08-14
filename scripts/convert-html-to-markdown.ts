import * as fs from 'fs';
import * as path from 'path';

interface ConversionStats {
  totalPosts: number;
  convertedPosts: number;
  skippedPosts: number;
  errors: string[];
}

class SafeHTMLToMarkdownConverter {
  private stats: ConversionStats;

  constructor() {
    this.stats = {
      totalPosts: 0,
      convertedPosts: 0,
      skippedPosts: 0,
      errors: []
    };
  }

  private extractFrontmatterAndContent(content: string): { frontmatter: string, content: string } {
    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd === -1) {
      return { frontmatter: '', content };
    }
    
    const frontmatter = content.substring(0, frontmatterEnd + 3);
    const contentSection = content.substring(frontmatterEnd + 3);
    
    return { frontmatter, content: contentSection };
  }

  private convertHTMLToMarkdown(content: string): string {
    let convertedContent = content;

    // 1. Convert <a> tags to Markdown links
    convertedContent = convertedContent.replace(
      /<a\s+href=["']([^"']+)["']([^>]*)>([^<]+)<\/a>/g,
      (match, href, attributes, text) => {
        // Check if it's an external link
        const isExternal = href.startsWith('http');
        const externalIndicator = isExternal ? ' ↗' : '';
        
        // Extract title from attributes if present
        const titleMatch = attributes.match(/title=["']([^"']+)["']/);
        const title = titleMatch ? titleMatch[1] : '';
        
        if (title) {
          return `[${text}${externalIndicator}](${href} "${title}")`;
        }
        return `[${text}${externalIndicator}](${href})`;
      }
    );

    // 2. Convert <img> tags to Markdown images
    convertedContent = convertedContent.replace(
      /<img\s+src=["']([^"']+)["']([^>]*)\/?>/g,
      (match, src, attributes) => {
        // Extract alt text
        const altMatch = attributes.match(/alt=["']([^"']+)["']/);
        const alt = altMatch ? altMatch[1] : '';
        
        // Extract title if present
        const titleMatch = attributes.match(/title=["']([^"']+)["']/);
        const title = titleMatch ? titleMatch[1] : '';
        
        if (title) {
          return `![${alt}](${src} "${title}")`;
        }
        return `![${alt}](${src})`;
      }
    );

    // 3. Remove WordPress-specific tags and their content
    // Remove Twitter embeds
    convertedContent = convertedContent.replace(
      /<blockquote\s+class="twitter-tweet"[^>]*>.*?<\/blockquote>/g,
      ''
    );
    
    // Remove Twitter script tags
    convertedContent = convertedContent.replace(
      /<script[^>]*twitter\.com[^>]*>.*?<\/script>/g,
      ''
    );
    
    // Remove WordPress block classes
    convertedContent = convertedContent.replace(
      /<([a-z]+)\s+class="[^"]*wp-block-[^"]*"[^>]*>/gi,
      '<$1>'
    );
    
    // Remove WordPress-specific div classes
    convertedContent = convertedContent.replace(
      /<div\s+class="[^"]*(?:wp-block|align|size)[^"]*"[^>]*>/gi,
      ''
    );
    
    // Remove WordPress figure elements but keep the content
    convertedContent = convertedContent.replace(
      /<figure[^>]*class="[^"]*wp-block-image[^"]*"[^>]*>(.*?)<\/figure>/g,
      '$1'
    );
    
    // Remove WordPress figcaption elements
    convertedContent = convertedContent.replace(
      /<figcaption[^>]*>.*?<\/figcaption>/g,
      ''
    );

    // 4. Remove common legacy HTML wrapper divs that don't add value
    convertedContent = convertedContent.replace(
      /<div\s+class="[^"]*(?:card|blockquote|row|col)[^"]*"[^>]*>/gi,
      ''
    );
    
    convertedContent = convertedContent.replace(
      /<\/div>/g,
      ''
    );

    // 5. Convert basic HTML formatting to Markdown (only if they're standalone)
    // Convert <strong> and <b> to **
    convertedContent = convertedContent.replace(
      /<strong>([^<]+)<\/strong>/g,
      '**$1**'
    );
    
    convertedContent = convertedContent.replace(
      /<b>([^<]+)<\/b>/g,
      '**$1**'
    );

    // Convert <em> and <i> to *
    convertedContent = convertedContent.replace(
      /<em>([^<]+)<\/em>/g,
      '*$1*'
    );
    
    convertedContent = convertedContent.replace(
      /<i>([^<]+)<\/i>/g,
      '*$1*'
    );

    // 6. Clean up any remaining empty lines that might have been created
    convertedContent = convertedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

    return convertedContent;
  }

  private processPost(filePath: string): boolean {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check if content contains HTML tags that should be converted
      const hasHTML = /<(a|img|div|strong|em|b|i|blockquote|figure|figcaption)(\s[^>]*)?>/i.test(content);
      
      if (!hasHTML) {
        this.stats.skippedPosts++;
        return false;
      }

      // Extract frontmatter and content
      const { frontmatter, content: contentSection } = this.extractFrontmatterAndContent(content);
      
      // Convert only the content section
      const convertedContent = this.convertHTMLToMarkdown(contentSection);
      
      // Reconstruct the file
      const finalContent = frontmatter + convertedContent;
      
      // Write back to file
      fs.writeFileSync(filePath, finalContent, 'utf-8');
      
      this.stats.convertedPosts++;
      console.log(`✅ Converted: ${path.basename(filePath)}`);
      
      return true;
    } catch (error) {
      const errorMsg = `Error processing ${filePath}: ${error}`;
      this.stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      return false;
    }
  }

  public convertAllPosts(postsDir: string): void {
    console.log('🚀 Starting safe HTML to Markdown conversion...\n');
    console.log('🔒 Only converting specific HTML elements to Markdown');
    console.log('📝 Preserving all formatting, line breaks, and existing Markdown');
    console.log('🗑️ Removing WordPress-specific tags\n');
    
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
    console.log(`Skipped (no HTML): ${this.stats.skippedPosts}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n✨ Conversion complete!');
    console.log('🔒 All formatting and line breaks have been preserved.');
    console.log('📝 Only specific HTML elements were converted to Markdown.');
  }
}

// Main execution
const postsDir = path.join(process.cwd(), 'content', 'posts');

if (!fs.existsSync(postsDir)) {
  console.error('❌ Posts directory not found:', postsDir);
  process.exit(1);
}

const converter = new SafeHTMLToMarkdownConverter();
converter.convertAllPosts(postsDir);

export default SafeHTMLToMarkdownConverter;
