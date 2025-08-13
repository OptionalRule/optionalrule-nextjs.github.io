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

// Check if URL is external
function isExternalUrl(url: string): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Parse frontmatter from MDX content
function parseFrontmatter(content: string): { frontmatter: PostFrontmatter; content: string } {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  
  if (!frontmatterMatch) {
    return { frontmatter: { featured_image: '' }, content };
  }
  
  const frontmatterText = frontmatterMatch[1];
  const postContent = frontmatterMatch[2];
  
  try {
    const frontmatter: PostFrontmatter = { featured_image: '' };
    const lines = frontmatterText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmedLine.substring(0, colonIndex).trim();
          let value = trimmedLine.substring(colonIndex + 1).trim();
          
          // Handle quoted strings
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          (frontmatter as any)[key] = value;
        }
      }
    }
    
    return { frontmatter, content: postContent };
  } catch (error) {
    console.warn('Warning: Could not parse frontmatter, using empty frontmatter');
    return { frontmatter: { featured_image: '' }, content };
  }
}

// Main function
function previewExternalImages(): void {
  try {
    console.log('🔍 Preview: External Featured Images\n');
    
    const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
    
    // Get all MDX files
    const files = fs.readdirSync(POSTS_DIR)
      .filter(file => file.endsWith('.mdx'))
      .map(file => path.join(POSTS_DIR, file));
    
    if (files.length === 0) {
      console.log('❌ No MDX files found in posts directory');
      return;
    }
    
    console.log(`📝 Found ${files.length} MDX files to check\n`);
    
    // Check each file
    let processed = 0;
    let externalImages = 0;
    let noImages = 0;
    let localImages = 0;
    let errors = 0;
    
    const externalImagePosts: Array<{
      filename: string;
      title: string;
      featured_image: string;
    }> = [];
    
    for (const filepath of files) {
      try {
        const content = fs.readFileSync(filepath, 'utf8');
        const { frontmatter } = parseFrontmatter(content);
        
        if (!frontmatter.featured_image || frontmatter.featured_image.trim() === '') {
          noImages++;
        } else if (isExternalUrl(frontmatter.featured_image)) {
          externalImages++;
          externalImagePosts.push({
            filename: path.basename(filepath),
            title: frontmatter.title || 'No title',
            featured_image: frontmatter.featured_image
          });
        } else {
          localImages++;
        }
        
        processed++;
      } catch (error) {
        console.error(`❌ Error reading ${filepath}:`, error);
        errors++;
      }
    }
    
    // Summary
    console.log('📊 Summary:');
    console.log(`✅ Processed: ${processed} files`);
    console.log(`🌐 External images: ${externalImages} files`);
    console.log(`📁 Local images: ${localImages} files`);
    console.log(`❌ No images: ${noImages} files`);
    console.log(`⚠️  Errors: ${errors} files`);
    
    if (externalImagePosts.length > 0) {
      console.log('\n🌐 Posts with external featured images:');
      externalImagePosts.forEach((post, index) => {
        console.log(`\n${index + 1}. ${post.filename}`);
        console.log(`   Title: ${post.title}`);
        console.log(`   Image: ${post.featured_image}`);
      });
      
      console.log(`\n💡 Run 'npm run download-images' to download these images locally.`);
      console.log(`   Images will be saved to: /public/images/third_party/`);
      console.log(`   Failed downloads will use fallback images.`);
    } else {
      console.log('\n✅ No external images found! All posts use local images.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
previewExternalImages();
