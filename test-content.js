// Simple test to see what getAllPostsMeta() returns (ESM)
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

console.log('🔍 Testing content library functions...\n');

// Simulate what getPostFiles() does
function getPostFiles() {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }
  return fs.readdirSync(POSTS_DIR)
    .filter(file => /\.mdx?$/.test(file))
    .filter(file => {
      // Filter out draft posts during static builds
      if (process.env.NODE_ENV === 'production') {
        try {
          const filePath = path.join(POSTS_DIR, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const { data } = matter(fileContent);
          
          // Only include posts where draft is explicitly false or undefined
          return data.draft !== true;
        } catch (error) {
          // If there's an error reading the file, log it but include the post
          console.warn(`Warning: Error reading post ${file}, including it anyway:`, error);
          return true;
        }
      }
      // In development, include all posts
      return true;
    })
    .sort((a, b) => b.localeCompare(a));
}

// Simulate what getPostMeta() does
function getPostMeta(filename) {
  const filePath = path.join(POSTS_DIR, filename);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(fileContent);
  
  // Generate slug from filename (simplified)
  const slug = filename.replace(/\.mdx?$/, '');
  
  return {
    slug,
    title: data.title,
    date: data.date,
    draft: data.draft
  };
}

// Simulate what getAllPostsMeta() does
function getAllPostsMeta() {
  const files = getPostFiles();
  return files.map(getPostMeta);
}

// Test the functions
console.log('📁 Testing getPostFiles()...');
const postFiles = getPostFiles();
console.log(`Found ${postFiles.length} post files`);

// Check if our problematic post is in the list
const problematicFile = '2021-01-02-tools-for-effecting-rolls-in-dd.mdx';
const hasProblematicFile = postFiles.includes(problematicFile);
console.log(`\n🔍 Has problematic file '${problematicFile}': ${hasProblematicFile}`);

if (hasProblematicFile) {
  console.log('✅ File found in getPostFiles()');
} else {
  console.log('❌ File NOT found in getPostFiles()');
  
  // Check what happened to it
  const allFiles = fs.readdirSync(POSTS_DIR).filter(file => /\.mdx?$/.test(file));
  const hasInAllFiles = allFiles.includes(problematicFile);
  console.log(`\n🔍 File in all MDX files: ${hasInAllFiles}`);
  
  if (hasInAllFiles) {
    console.log('⚠️  File exists but was filtered out by getPostFiles()');
    
    // Check why it was filtered
    try {
      const filePath = path.join(POSTS_DIR, problematicFile);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContent);
      console.log(`📝 Draft status: ${data.draft}`);
      console.log(`📝 Title: ${data.title}`);
      console.log(`📝 Date: ${data.date}`);
    } catch (error) {
      console.log(`❌ Error reading file: ${error.message}`);
    }
  }
}

console.log('\n📊 Testing getAllPostsMeta()...');
const allPostsMeta = getAllPostsMeta();
console.log(`getAllPostsMeta() returned ${allPostsMeta.length} posts`);

// Check if our problematic post slug is in the metadata
const problematicSlug = 'tools-for-effecting-rolls-in-dd';
const hasProblematicSlug = allPostsMeta.some(post => post.slug === problematicSlug);
console.log(`\n🔍 Has problematic slug '${problematicSlug}': ${hasProblematicSlug}`);

if (hasProblematicSlug) {
  console.log('✅ Slug found in getAllPostsMeta()');
} else {
  console.log('❌ Slug NOT found in getAllPostsMeta()');
  
  // Show what slugs we do have
  console.log('\n📝 Available slugs (first 10):');
  allPostsMeta.slice(0, 10).forEach((post, index) => {
    console.log(`${index + 1}. ${post.slug} (${post.date})`);
  });
}
