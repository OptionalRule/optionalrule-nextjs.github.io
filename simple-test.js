const fs = require('fs');
const path = require('path');

console.log('🔍 Simple test...\n');

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const problematicFile = '2021-01-02-tools-for-effecting-rolls-in-dd.mdx';

console.log(`📁 Posts directory: ${POSTS_DIR}`);
console.log(`📝 Looking for file: ${problematicFile}`);

// Check if file exists
const filePath = path.join(POSTS_DIR, problematicFile);
const fileExists = fs.existsSync(filePath);
console.log(`\n🔍 File exists: ${fileExists}`);

if (fileExists) {
  try {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`✅ File read successfully (${content.length} characters)`);
    
    // Check for frontmatter markers
    const hasFrontmatterStart = content.startsWith('---');
    const hasFrontmatterEnd = content.includes('\n---\n');
    console.log(`📋 Has frontmatter start (---): ${hasFrontmatterStart}`);
    console.log(`📋 Has frontmatter end (---): ${hasFrontmatterEnd}`);
    
    if (hasFrontmatterStart && hasFrontmatterEnd) {
      // Extract frontmatter section
      const frontmatterEnd = content.indexOf('\n---\n');
      const frontmatter = content.substring(0, frontmatterEnd + 4);
      console.log('\n📋 Frontmatter content:');
      console.log(frontmatter);
      
      // Check for key fields
      const hasSlug = frontmatter.includes('slug:');
      const hasTitle = frontmatter.includes('title:');
      const hasDate = frontmatter.includes('date:');
      const hasDraft = frontmatter.includes('draft:');
      
      console.log(`\n🔍 Frontmatter fields:`);
      console.log(`  - slug: ${hasSlug}`);
      console.log(`  - title: ${hasTitle}`);
      console.log(`  - date: ${hasDate}`);
      console.log(`  - draft: ${hasDraft}`);
      
      // Check draft value specifically
      const draftMatch = frontmatter.match(/draft:\s*(true|false)/);
      if (draftMatch) {
        console.log(`📝 Draft value: ${draftMatch[1]}`);
      } else {
        console.log(`📝 No draft value found`);
      }
    } else {
      console.log('❌ Frontmatter markers not found');
    }
    
  } catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
  }
} else {
  console.log('❌ File not found');
}
