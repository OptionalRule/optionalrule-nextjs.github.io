#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL, fileURLToPath } from 'url';

interface ProcessedImage {
  originalUrl: string;
  localPath: string;
  filename: string;
}

interface PostProcessingResult {
  filePath: string;
  processedImages: ProcessedImage[];
  errors: string[];
  modified: boolean;
}

class ExternalImageDownloader {
  private cacheDir: string;
  private postsDir: string;

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'public', 'images', 'cache');
    this.postsDir = path.join(process.cwd(), 'content', 'posts');
    
    // Ensure cache directory exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private async downloadImage(url: string, filename: string): Promise<boolean> {
    return new Promise((resolve) => {
      const filePath = path.join(this.cacheDir, filename);
      const file = fs.createWriteStream(filePath);
      
      const client = url.startsWith('https:') ? https : http;
      
      const request = client.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(true);
          });
        } else {
          file.destroy();
          fs.unlink(filePath, () => {}); // Clean up partial file
          resolve(false);
        }
      });

      request.on('error', () => {
        file.destroy();
        fs.unlink(filePath, () => {}); // Clean up partial file
        resolve(false);
      });

      file.on('error', () => {
        file.destroy();
        fs.unlink(filePath, () => {}); // Clean up partial file
        resolve(false);
      });

      // Set timeout
      request.setTimeout(10000, () => {
        request.destroy();
        file.destroy();
        fs.unlink(filePath, () => {}); // Clean up partial file
        resolve(false);
      });
    });
  }

  private generateFilename(url: string): string {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const filename = path.basename(pathname);
      
      // If there's no extension, try to guess from content-type or use .jpg as default
      if (!path.extname(filename)) {
        return `${filename}.jpg`;
      }
      
      return filename;
    } catch {
      // Generate a random filename if URL parsing fails
      return `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    }
  }

  private extractExternalImages(content: string): { url: string; fullMatch: string }[] {
    const images: { url: string; fullMatch: string }[] = [];
    
    // Match both ![alt](url) and [![alt](url)](link) patterns
    const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
    
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const url = match[2];
      
      // Only process external URLs (skip local images)
      if (url.startsWith('http://') || url.startsWith('https://')) {
        images.push({ url, fullMatch });
      }
    }
    
    return images;
  }

  private updateFrontmatter(content: string, firstSuccessfulImage: ProcessedImage): string {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);
    
    if (!match) return content;
    
    const frontmatter = match[1];
    const localImagePath = `/images/cache/${firstSuccessfulImage.filename}`;
    
    // Check if featured_image already exists
    if (frontmatter.includes('featured_image:')) {
      // Only update if it's currently pointing to an external URL or the default image
      const updatedFrontmatter = frontmatter.replace(
        /featured_image:\s*[^\n]*/,
        `featured_image: ${localImagePath}`
      );
      return content.replace(frontmatterRegex, `---\n${updatedFrontmatter}\n---`);
    } else {
      // Add featured_image if it doesn't exist
      const updatedFrontmatter = frontmatter + `\nfeatured_image: ${localImagePath}`;
      return content.replace(frontmatterRegex, `---\n${updatedFrontmatter}\n---`);
    }
  }

  async processPost(filePath: string): Promise<PostProcessingResult> {
    const result: PostProcessingResult = {
      filePath,
      processedImages: [],
      errors: [],
      modified: false
    };

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const externalImages = this.extractExternalImages(content);
      
      if (externalImages.length === 0) {
        return result;
      }

      let updatedContent = content;
      let firstSuccessfulImage: ProcessedImage | null = null;

      for (const { url, fullMatch } of externalImages) {
        try {
          const filename = this.generateFilename(url);
          const localPath = `/images/cache/${filename}`;
          
          console.log(`Downloading: ${url} -> ${filename}`);
          const success = await this.downloadImage(url, filename);
          
          if (success) {
            // Replace the image reference in content
            const altText = fullMatch.match(/!\[([^\]]*)\]/)?.[1] || '';
            const newImageRef = `![${altText}](${localPath})`;
            updatedContent = updatedContent.replace(fullMatch, newImageRef);
            
            const processedImage: ProcessedImage = {
              originalUrl: url,
              localPath,
              filename
            };
            
            result.processedImages.push(processedImage);
            
            // Track first successful image for featured_image update
            if (!firstSuccessfulImage) {
              firstSuccessfulImage = processedImage;
            }
            
            result.modified = true;
          } else {
            // Remove the image reference if download failed
            console.log(`Failed to download: ${url}, removing reference`);
            updatedContent = updatedContent.replace(fullMatch, '');
            result.errors.push(`Failed to download: ${url}`);
            result.modified = true;
          }
        } catch (error) {
          const errorMsg = `Error processing ${url}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
          
          // Remove the failed image reference
          updatedContent = updatedContent.replace(fullMatch, '');
          result.modified = true;
        }
      }

      // Update featured_image if we have a successful download
      if (firstSuccessfulImage) {
        updatedContent = this.updateFrontmatter(updatedContent, firstSuccessfulImage);
      }

      // Write the updated content back to file
      if (result.modified) {
        fs.writeFileSync(filePath, updatedContent, 'utf-8');
      }

    } catch (error) {
      result.errors.push(`Error reading file: ${error}`);
    }

    return result;
  }

  async processAllPosts(): Promise<void> {
    const files = fs.readdirSync(this.postsDir)
      .filter(file => file.endsWith('.mdx'))
      .map(file => path.join(this.postsDir, file));

    console.log(`Found ${files.length} MDX files to process`);

    let totalProcessed = 0;
    let totalErrors = 0;
    let totalImages = 0;

    for (const file of files) {
      console.log(`\nProcessing: ${path.basename(file)}`);
      const result = await this.processPost(file);
      
      if (result.modified) {
        totalProcessed++;
        totalImages += result.processedImages.length;
        
        if (result.processedImages.length > 0) {
          console.log(`  Downloaded ${result.processedImages.length} images`);
        }
        
        if (result.errors.length > 0) {
          console.log(`  Errors: ${result.errors.length}`);
          result.errors.forEach(error => console.log(`    - ${error}`));
          totalErrors += result.errors.length;
        }
      } else {
        console.log(`  No external images found`);
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Files processed: ${totalProcessed}`);
    console.log(`Images downloaded: ${totalImages}`);
    console.log(`Total errors: ${totalErrors}`);
  }
}

// Main execution - check if this script is being run directly
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  const downloader = new ExternalImageDownloader();
  downloader.processAllPosts().catch(console.error);
}

export default ExternalImageDownloader;