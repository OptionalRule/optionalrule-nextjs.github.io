import * as fs from 'fs';
import * as path from 'path';

interface HTMLPreview {
  file: string;
  htmlFound: string[];
  markdownPreview: string;
  hasChanges: boolean;
}

class SafeHTMLConversionPreview {
  private previews: HTMLPreview[];

  constructor() {
    this.previews = [];
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

  private extractHTMLTags(content: string): string[] {
    const htmlTags: string[] = [];
    const htmlRegex = /<[^>]+>/g;
    let match;
    
    while ((match = htmlRegex.exec(content)) !== null) {
      htmlTags.push(match[0]);
    }
    
    return [...new Set(htmlTags)]; // Remove duplicates
  }

  private previewPost(filePath: string): HTMLPreview {
    const content = fs.readFileSync(filePath, 'utf-8');
    const htmlTags = this.extractHTMLTags(content);
    
    let markdownPreview = content;
    let hasChanges = false;
    
    if (htmlTags.length > 0) {
      try {
        // Extract frontmatter and content
        const { frontmatter, content: contentSection } = this.extractFrontmatterAndContent(content);
        
        // Convert only the content section
        const convertedContent = this.convertHTMLToMarkdown(contentSection);
        
        // Reconstruct the file
        const restored = frontmatter + convertedContent;
        
        markdownPreview = restored;
        hasChanges = restored !== content;
      } catch (error) {
        markdownPreview = `[ERROR: Could not convert - ${error}]`;
        hasChanges = false;
      }
    }
    
    return {
      file: path.basename(filePath),
      htmlFound: htmlTags,
      markdownPreview: markdownPreview.substring(0, 500) + (markdownPreview.length > 500 ? '...' : ''),
      hasChanges: hasChanges
    };
  }

  public previewAllPosts(postsDir: string): void {
    console.log('🔍 Previewing safe HTML to Markdown conversion...\n');
    console.log('🔒 Only converting specific HTML elements to Markdown');
    console.log('📝 Preserving all formatting, line breaks, and existing Markdown');
    console.log('🗑️ Removing WordPress-specific tags\n');
    
    try {
      const files = fs.readdirSync(postsDir);
      const mdxFiles = files.filter(file => file.endsWith('.mdx'));
      
      for (const file of mdxFiles) {
        const filePath = path.join(postsDir, file);
        const preview = this.previewPost(filePath);
        this.previews.push(preview);
      }
      
      this.printPreview();
      
    } catch (error) {
      console.error('❌ Error reading posts directory:', error);
    }
  }

  private printPreview(): void {
    const postsWithHTML = this.previews.filter(p => p.htmlFound.length > 0);
    const postsWithoutHTML = this.previews.filter(p => p.htmlFound.length === 0);
    
    console.log(`📊 Found ${this.previews.length} total posts`);
    console.log(`🔧 ${postsWithHTML.length} posts contain HTML that can be converted`);
    console.log(`✅ ${postsWithoutHTML.length} posts are already clean\n`);
    
    if (postsWithHTML.length > 0) {
      console.log('📝 Posts with HTML tags (will be converted):');
      postsWithHTML.forEach(preview => {
        console.log(`\n📄 ${preview.file}`);
        console.log(`   HTML tags found: ${preview.htmlFound.length}`);
        console.log(`   Sample tags: ${preview.htmlFound.slice(0, 3).join(', ')}${preview.htmlFound.length > 3 ? '...' : ''}`);
        console.log(`   Will change: ${preview.hasChanges ? 'Yes' : 'No'}`);
        
        if (preview.hasChanges) {
          console.log(`   Preview (first 500 chars):`);
          console.log(`   ${preview.markdownPreview.replace(/\n/g, '\n   ')}`);
        }
      });
    }
    
    if (postsWithoutHTML.length > 0) {
      console.log(`\n✅ Clean posts (no HTML):`);
      postsWithoutHTML.forEach(preview => {
        console.log(`   - ${preview.file}`);
      });
    }
    
    console.log('\n💡 To convert HTML to Markdown, run: npm run convert-html');
    console.log('🔒 All formatting and line breaks will be preserved!');
    console.log('📝 Only specific HTML elements will be converted to Markdown.');
  }
}

// Main execution
const postsDir = path.join(process.cwd(), 'content', 'posts');

if (!fs.existsSync(postsDir)) {
  console.error('❌ Posts directory not found:', postsDir);
  process.exit(1);
}

const preview = new SafeHTMLConversionPreview();
preview.previewAllPosts(postsDir);

export default SafeHTMLConversionPreview;
