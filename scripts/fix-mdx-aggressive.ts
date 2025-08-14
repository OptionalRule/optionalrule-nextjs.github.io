import * as fs from 'fs';
import * as path from 'path';

interface FixStats {
  totalPosts: number;
  fixedPosts: number;
  skippedPosts: number;
  errors: string[];
}

class AggressiveMDXFixer {
  private stats: FixStats;

  constructor() {
    this.stats = {
      totalPosts: 0,
      fixedPosts: 0,
      skippedPosts: 0,
      errors: []
    };
  }

  private fixMDXIssues(content: string): string {
    let fixedContent = content;

    // Remove ALL potential problematic patterns that could cause MDX compilation errors
    
    // 1. Remove all Jekyll/Liquid syntax patterns
    fixedContent = fixedContent.replace(/\{:[^}]*\}/g, ''); // Any {: ...} pattern
    fixedContent = fixedContent.replace(/\{%[^%]*%\}/g, ''); // Any {% ... %} pattern
    fixedContent = fixedContent.replace(/\{\{[^}]*\}\}/g, ''); // Any {{ ... }} pattern
    
    // 2. Remove all HTML tags and attributes (keep only content)
    fixedContent = fixedContent.replace(/<[^>]*>/g, '');
    
    // 3. Remove all HTML entities
    fixedContent = fixedContent.replace(/&[a-z]+;|&#\d+;/gi, '');
    
    // 4. Remove any remaining special characters that might cause parsing issues
    fixedContent = fixedContent.replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII characters
    
    // 5. Clean up excessive whitespace
    fixedContent = fixedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    fixedContent = fixedContent.replace(/\s+$/gm, '');
    
    // 6. Ensure proper line endings
    fixedContent = fixedContent.replace(/\r\n/g, '\n');
    
    return fixedContent;
  }

  private processPost(filePath: string): boolean {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Fix the MDX issues
      const fixedContent = this.fixMDXIssues(content);
      
      // Check if content actually changed
      if (fixedContent === content) {
        this.stats.skippedPosts++;
        return false;
      }

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
    console.log('🚀 Starting aggressive MDX fix...\n');
    console.log('🔧 Removing ALL potential problematic patterns that could cause MDX compilation errors');
    console.log('⚠️  This will remove HTML tags, Jekyll syntax, and other potentially problematic content');
    console.log('📝 Preserving text content and basic formatting\n');
    
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
    console.log(`Skipped (no changes): ${this.stats.skippedPosts}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n✨ Aggressive MDX fix complete!');
    console.log('🔧 All potentially problematic patterns have been removed.');
    console.log('📝 Posts should now compile without errors.');
    console.log('\n💡 Next step: Try building the site to verify all issues are resolved.');
  }
}

// Main execution
const postsDir = path.join(process.cwd(), 'content', 'posts');

if (!fs.existsSync(postsDir)) {
  console.error('❌ Posts directory not found:', postsDir);
  process.exit(1);
}

const fixer = new AggressiveMDXFixer();
fixer.fixAllPosts(postsDir);

export default AggressiveMDXFixer;
