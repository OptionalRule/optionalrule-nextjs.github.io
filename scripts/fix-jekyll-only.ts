import * as fs from 'fs';
import * as path from 'path';

interface FixStats {
  totalPosts: number;
  fixedPosts: number;
  skippedPosts: number;
  errors: string[];
}

class JekyllOnlyFixer {
  private stats: FixStats;

  constructor() {
    this.stats = {
      totalPosts: 0,
      fixedPosts: 0,
      skippedPosts: 0,
      errors: []
    };
  }

  private fixJekyllOnly(content: string): string {
    let fixedContent = content;

    // Remove ONLY Jekyll/Liquid syntax patterns, preserve everything else
    const jekyllPatterns = [
      // Remove {: .class .class} patterns (Jekyll table syntax)
      /\{:\s*[^}]+\}/g,
      // Remove {% include %} tags
      /\{%\s*include[^%]*%\}/g,
      // Remove {% link %} tags (these should have been converted already)
      /\{%\s*link[^%]*%\}/g,
      // Remove any remaining Liquid tags
      /\{%[^%]*%\}/g,
      // Remove {{ }} expressions
      /\{\{[^}]*\}\}/g
    ];

    jekyllPatterns.forEach(pattern => {
      fixedContent = fixedContent.replace(pattern, '');
    });

    return fixedContent;
  }

  private processPost(filePath: string): boolean {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check if content contains Jekyll syntax that needs fixing
      const hasJekyllSyntax = /(\{:\s*[^}]+\}|\{%[^%]*%\}|\{\{[^}]*\}\})/g.test(content);
      
      if (!hasJekyllSyntax) {
        this.stats.skippedPosts++;
        return false;
      }

      // Fix ONLY the Jekyll syntax
      const fixedContent = this.fixJekyllOnly(content);
      
      // Write back to file
      fs.writeFileSync(filePath, fixedContent, 'utf-8');
      
      this.stats.fixedPosts++;
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
      
      return true;
    } catch (error) {
      const errorMsg = `Error processing ${filePath}: ${error}`;
      this.stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      return false;
    }
  }

  public fixAllPosts(postsDir: string): void {
    console.log('🚀 Starting Jekyll-only syntax cleanup...\n');
    console.log('🔧 Removing ONLY Jekyll/Liquid syntax patterns');
    console.log('📝 Preserving ALL other content (HTML, entities, formatting, etc.)\n');
    
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
    console.log('\n📊 Fix Statistics:');
    console.log(`Total posts: ${this.stats.totalPosts}`);
    console.log(`Fixed: ${this.stats.fixedPosts}`);
    console.log(`Skipped (no Jekyll syntax): ${this.stats.skippedPosts}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n✨ Jekyll-only syntax cleanup complete!');
    console.log('🔧 Only problematic Jekyll/Liquid syntax has been removed.');
    console.log('📝 All other content has been preserved.');
    console.log('\n💡 Next step: Try building the site to verify all issues are resolved.');
  }
}

// Main execution
const postsDir = path.join(process.cwd(), 'content', 'posts');

if (!fs.existsSync(postsDir)) {
  console.error('❌ Posts directory not found:', postsDir);
  process.exit(1);
}

const fixer = new JekyllOnlyFixer();
fixer.fixAllPosts(postsDir);

export default JekyllOnlyFixer;
