#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { fileURLToPath } from 'url';

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

interface Post {
  filepath: string;
  frontmatter: PostFrontmatter;
  content: string;
}

// Configuration
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'third_party');
const FALLBACK_IMAGES = [
  '/images/optionalrule-escaping-fireball.png',
  '/images/optionalrule-escaping-wound.png'
];

// Ensure images directory exists
function ensureImagesDirectory(): void {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log(`📁 Created directory: ${IMAGES_DIR}`);
  }
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

// Download image from URL
async function downloadImage(url: string, filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        console.log(`❌ Failed to download ${url}: HTTP ${response.statusCode}`);
        resolve(false);
        return;
      }

      const filepath = path.join(IMAGES_DIR, filename);
      const fileStream = fs.createWriteStream(filepath);
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✅ Downloaded: ${filename}`);
        resolve(true);
      });
      
      fileStream.on('error', (err) => {
        console.log(`❌ Error writing file ${filename}: ${err.message}`);
        fs.unlink(filepath, () => {}); // Delete partial file
        resolve(false);
      });
    });
    
    request.on('error', (err) => {
      console.log(`❌ Error downloading ${url}: ${err.message}`);
      resolve(false);
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      console.log(`❌ Timeout downloading ${url}`);
      resolve(false);
    });
  });
}

// Generate filename from URL
function generateFilename(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = path.extname(pathname) || '.jpg';
    const basename = path.basename(pathname, extension);
    
    // Clean the basename and add timestamp to avoid conflicts
    const cleanBasename = basename
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    
    const timestamp = Date.now();
    return `${cleanBasename}_${timestamp}${extension}`;
  } catch {
    // Fallback if URL parsing fails
    const timestamp = Date.now();
    return `image_${timestamp}.jpg`;
  }
}

// Get random fallback image
function getRandomFallbackImage(): string {
  const randomIndex = Math.floor(Math.random() * FALLBACK_IMAGES.length);
  return FALLBACK_IMAGES[randomIndex];
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

// Update frontmatter in content
function updateFrontmatter(content: string, newFeaturedImage: string): string {
  return content.replace(
    /(featured_image:\s*["'])[^"']*(["'])/,
    `$1${newFeaturedImage}$2`
  );
}

// Process a single post
async function processPost(filepath: string): Promise<void> {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const { frontmatter, content: postContent } = parseFrontmatter(content);
    
    if (!frontmatter.featured_image || !isExternalUrl(frontmatter.featured_image)) {
      return; // Skip if no featured image or not external
    }
    
    const filename = generateFilename(frontmatter.featured_image);
    const localPath = `/images/third_party/${filename}`;
    
    console.log(`\n🔄 Processing: ${path.basename(filepath)}`);
    console.log(`   External URL: ${frontmatter.featured_image}`);
    console.log(`   Local filename: ${filename}`);
    
    // Try to download the image
    const downloadSuccess = await downloadImage(frontmatter.featured_image, filename);
    
    if (downloadSuccess) {
      // Update the content with local path
      const updatedContent = updateFrontmatter(content, localPath);
      fs.writeFileSync(filepath, updatedContent, 'utf8');
      console.log(`   ✅ Updated frontmatter to: ${localPath}`);
    } else {
      // Use fallback image
      const fallbackImage = getRandomFallbackImage();
      const updatedContent = updateFrontmatter(content, fallbackImage);
      fs.writeFileSync(filepath, updatedContent, 'utf8');
      console.log(`   🔄 Used fallback image: ${fallbackImage}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filepath}:`, error);
  }
}

// Main function
async function downloadFeaturedImages(): Promise<void> {
  try {
    console.log('🚀 Featured Image Download Script\n');
    
    // Ensure images directory exists
    ensureImagesDirectory();
    
    // Get all MDX files
    const files = fs.readdirSync(POSTS_DIR)
      .filter(file => file.endsWith('.mdx'))
      .map(file => path.join(POSTS_DIR, file));
    
    if (files.length === 0) {
      console.log('❌ No MDX files found in posts directory');
      return;
    }
    
    console.log(`📝 Found ${files.length} MDX files to process\n`);
    
    // Process each file
    let processed = 0;
    let updated = 0;
    let errors = 0;
    
    for (const filepath of files) {
      try {
        const content = fs.readFileSync(filepath, 'utf8');
        const { frontmatter } = parseFrontmatter(content);
        
        if (frontmatter.featured_image && isExternalUrl(frontmatter.featured_image)) {
          await processPost(filepath);
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
      console.log(`\n💡 Downloaded images are stored in: ${IMAGES_DIR}`);
      console.log('   You may want to review and optimize these images for web use.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
downloadFeaturedImages();
