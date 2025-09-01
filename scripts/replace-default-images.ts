#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

// Types
interface PostFrontmatter {
  slug?: string;
  title?: string;
  date?: string;
  excerpt?: string | null;
  featured_image: string;
  draft?: boolean;
  showToc?: boolean;
}

// Configuration
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const OLD_IMAGES = [
  '/images/optionalrule-escaping-fireball.png',
  '/images/optionalrule-escaping-wound.png',
  '/images/OR_Screenshot-870x570.jpg',
  '/images/default-featured.jpg'
];
const REPLACEMENT_IMAGES = [
  '/images/optionalrule-escaping-fireball.webp',
  '/images/optionalrule-escaping-wound.webp',
  '/images/optionalrule-exploring-question.webp',
  '/images/optionalrule-exploring-encumbered.webp',
  '/images/optionalrule-exploring-monster.webp',
  '/images/optionalrule-exploring-wizard.webp'
];

// Get random replacement image
function getRandomReplacementImage(): string {
  const randomIndex = Math.floor(Math.random() * REPLACEMENT_IMAGES.length);
  return REPLACEMENT_IMAGES[randomIndex];
}

// Parse frontmatter from MDX content
function parseFrontmatter(content: string): { frontmatter: PostFrontmatter; content: string } {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    return { frontmatter: { featured_image: '' }, content };
  }
  const frontmatterText = frontmatterMatch[1];
  const postContent = frontmatterMatch[2];

  // Extract only the featured_image field
  const featMatch = frontmatterText.match(/^featured_image:\s*(.+)$/m);
  let featured = '';
  if (featMatch) {
    let value = featMatch[1].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    featured = value;
  }
  return { frontmatter: { featured_image: featured }, content: postContent };
}

// Update frontmatter in content
function updateFrontmatter(content: string, newFeaturedImage: string): string {
  return content.replace(
    /(featured_image:\s*["'])[^"']*(["'])/,
    `$1${newFeaturedImage}$2`
  );
}

// Process a single post
function processPost(filepath: string): void {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    
    if (!OLD_IMAGES.includes(frontmatter.featured_image)) {
      return; // Skip if not using one of the old images
    }
    
    const replacementImage = getRandomReplacementImage();
    
    console.log(`\n🔄 Processing: ${path.basename(filepath)}`);
    console.log(`   Current image: ${frontmatter.featured_image}`);
    console.log(`   New image: ${replacementImage}`);
    
    // Update the content with new image
    const updatedContent = updateFrontmatter(content, replacementImage);
    fs.writeFileSync(filepath, updatedContent, 'utf8');
    console.log(`   ✅ Updated frontmatter to: ${replacementImage}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${filepath}:`, error);
  }
}

// Main function
function replaceDefaultImages(): void {
  try {
    console.log('🎲 Default Image Replacement Script\n');
    
    // Get all MDX files
    const files = fs.readdirSync(POSTS_DIR)
      .filter(file => file.endsWith('.mdx'))
      .map(file => path.join(POSTS_DIR, file));
    
    if (files.length === 0) {
      console.log('❌ No MDX files found in posts directory');
      return;
    }
    
    console.log(`📝 Found ${files.length} MDX files to check\n`);
    console.log(`🎯 Looking for posts with one of these old images:`);
    OLD_IMAGES.forEach(img => console.log(`   • ${img}`));
    console.log(`🔄 Will replace with one of:`);
    REPLACEMENT_IMAGES.forEach(img => console.log(`   • ${img}`));
    console.log('');
    
    // Process each file
    let processed = 0;
    let updated = 0;
    let errors = 0;
    
    for (const filepath of files) {
      try {
        const content = fs.readFileSync(filepath, 'utf8');
        const { frontmatter } = parseFrontmatter(content);
        
        if (OLD_IMAGES.includes(frontmatter.featured_image)) {
          processPost(filepath);
          updated++;
        }
        
        processed++;
      } catch (error) {
        console.error(`❌ Error reading ${filepath}:`, error);
        errors++;
      }
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`✅ Processed: ${processed} files`);
    console.log(`🔄 Updated: ${updated} files`);
    console.log(`❌ Errors: ${errors} files`);
    
    if (updated > 0) {
      console.log(`\n💡 Successfully replaced ${updated} posts with random images!`);
      console.log('   Each post now has a unique featured image from your collection.');
    } else {
      console.log(`\n✅ No posts found using any of the old images`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
replaceDefaultImages();
