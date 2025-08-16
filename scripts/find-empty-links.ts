import { globby } from 'globby';
import { readFileSync } from 'fs';
import { join } from 'path';

interface EmptyLinkResult {
  file: string;
  lineNumber: number;
  line: string;
  match: string;
}

function findEmptyLinksInContent(content: string, filename: string): EmptyLinkResult[] {
  const results: EmptyLinkResult[] = [];
  const lines = content.split('\n');
  
  // Regex patterns for empty markdown links
  const emptyLinkPatterns = [
    /\[([^\]]*)\]\(\s*\)/g,           // [text]() or [text]( )
    /\[([^\]]*)\]\(\s*["']\s*["']\s*\)/g, // [text]("") or [text]('')
    /\[\s*\]\([^)]*\)/g,              // [ ]() or []()
  ];
  
  lines.forEach((line, index) => {
    emptyLinkPatterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(line)) !== null) {
        // Check if it's actually empty (not just whitespace in URL)
        const fullMatch = match[0];
        const isEmptyUrl = 
          fullMatch.includes('()') || 
          fullMatch.includes('("")') ||
          fullMatch.includes("('')") ||
          /\(\s*\)/.test(fullMatch) ||
          /\(\s*["']\s*["']\s*\)/.test(fullMatch);
        
        if (isEmptyUrl) {
          results.push({
            file: filename,
            lineNumber: index + 1,
            line: line.trim(),
            match: fullMatch
          });
        }
      }
    });
  });
  
  return results;
}

async function findEmptyMarkdownLinks(): Promise<void> {
  console.log('🔍 Scanning for empty markdown links...\n');
  
  try {
    // Find all MDX files in content directory
    const contentFiles = await globby([
      'content/**/*.mdx',
      'content/**/*.md'
    ], {
      cwd: process.cwd(),
      absolute: true
    });
    
    console.log(`Found ${contentFiles.length} content files to scan\n`);
    
    let totalEmptyLinks = 0;
    const filesWithEmptyLinks: string[] = [];
    
    for (const filePath of contentFiles) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const relativePath = filePath.replace(process.cwd() + '/', '');
        const emptyLinks = findEmptyLinksInContent(content, relativePath);
        
        if (emptyLinks.length > 0) {
          console.log(`❌ ${relativePath}`);
          filesWithEmptyLinks.push(relativePath);
          
          emptyLinks.forEach(result => {
            console.log(`   Line ${result.lineNumber}: ${result.match}`);
            console.log(`   Context: ${result.line}`);
            console.log('');
          });
          
          totalEmptyLinks += emptyLinks.length;
        }
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
      }
    }
    
    // Summary
    console.log('📊 Summary:');
    console.log(`Files scanned: ${contentFiles.length}`);
    console.log(`Files with empty links: ${filesWithEmptyLinks.length}`);
    console.log(`Total empty links found: ${totalEmptyLinks}`);
    
    if (filesWithEmptyLinks.length === 0) {
      console.log('\n✅ No empty markdown links found!');
    } else {
      console.log('\n📋 Files with empty links:');
      filesWithEmptyLinks.forEach(file => {
        console.log(`   ${file}`);
      });
    }
    
  } catch (error) {
    console.error('Error scanning files:', error);
    process.exit(1);
  }
}

// Run the script
findEmptyMarkdownLinks().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});