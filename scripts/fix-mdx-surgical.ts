import * as fs from 'fs';
import * as path from 'path';

interface FixStats {
  totalPosts: number;
  fixedPosts: number;
  skippedPosts: number;
  errors: string[];
  issuesFound: string[];
}

class SurgicalMDXFixer {
  private stats: FixStats;

  constructor() {
    this.stats = {
      totalPosts: 0,
      fixedPosts: 0,
      skippedPosts: 0,
      errors: [],
      issuesFound: []
    };
  }

  private fixMDXIssues(content: string): string {
    let fixedContent = content;

    // 1. Remove ONLY problematic Jekyll/Liquid syntax patterns
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

    // 2. Remove problematic HTML tags that cause parsing issues
    // Remove unclosed div tags (common issue we've seen)
    fixedContent = fixedContent.replace(/<div[^>]*>(?![^<]*<\/div>)/g, '');
    
    // Remove any remaining unclosed HTML tags
    fixedContent = fixedContent.replace(/<([a-z]+)[^>]*>(?![^<]*<\/\1>)/gi, '');

    // 3. Fix common HTML formatting issues
    // Convert HTML entities to proper characters
    const htmlEntities = {
      '&ldquo;': '"',
      '&rdquo;': '"',
      '&lsquo;': "'",
      '&rsquo;': "'",
      '&hellip;': '...',
      '&mdash;': '—',
      '&ndash;': '–',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#8217;': "'",
      '&#8216;': "'",
      '&#8211;': '–',
      '&#8212;': '—'
    };

    Object.entries(htmlEntities).forEach(([entity, replacement]) => {
      fixedContent = fixedContent.replace(new RegExp(entity, 'g'), replacement);
    });

    // 4. Clean up excessive whitespace
    fixedContent = fixedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    fixedContent = fixedContent.replace(/\s+$/gm, '');

    return fixedContent;
  }

  private detectIssues(content: string): string[] {
    const issues: string[] = [];

    // Check for Jekyll syntax
    if (/\{:\s*[^}]+\}/g.test(content)) {
      issues.push('Jekyll class syntax');
    }
    if (/\{%[^%]*%\}/g.test(content)) {
      issues.push('Jekyll Liquid tags');
    }
    if (/\{\{[^}]*\}\}/g.test(content)) {
      issues.push('Jekyll expressions');
    }

    // Check for unclosed HTML tags
    if (/<([a-z]+)[^>]*>(?![^<]*<\/\1>)/gi.test(content)) {
      issues.push('Unclosed HTML tags');
    }

    // Check for HTML entities
    if (/&[a-z]+;|&#\d+;/g.test(content)) {
      issues.push('HTML entities');
    }

    // Check for excessive whitespace
    if (/\n\s*\n\s*\n/g.test(content)) {
      issues.push('Excessive whitespace');
    }

    return issues;
  }

  private processPost(filePath: string): boolean {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Detect issues in the content
      const issues = this.detectIssues(content);
      
      if (issues.length === 0) {
        this.stats.skippedPosts++;
        return false;
      }

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
      this.stats.issuesFound.push(...issues);
      console.log(`✅ Fixed: ${path.basename(filePath)} (${issues.join(', ')})`);
      
      return true;
    } catch (error) {
      const errorMsg = `Error processing ${filePath}: ${error}`;
      this.stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      return false;
    }
  }

  public fixAllPosts(postsDir: string): void {
    console.log('🚀 Starting surgical MDX fix...\n');
    console.log('🔧 Removing ONLY problematic patterns while preserving valid Markdown syntax');
    console.log('📝 Keeping images, heading IDs, and other valid Markdown elements\n');
    
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
    console.log(`Skipped (no issues): ${this.stats.skippedPosts}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n✨ Surgical MDX fix complete!');
    console.log('🔧 Only problematic patterns have been removed.');
    console.log('📝 Valid Markdown syntax has been preserved.');
    console.log('\n💡 Next step: Try building the site to verify all issues are resolved.');
  }
}

// Main execution
const postsDir = path.join(process.cwd(), 'content', 'posts');

if (!fs.existsSync(postsDir)) {
  console.error('❌ Posts directory not found:', postsDir);
  process.exit(1);
}

const fixer = new SurgicalMDXFixer();
fixer.fixAllPosts(postsDir);

export default SurgicalMDXFixer;
