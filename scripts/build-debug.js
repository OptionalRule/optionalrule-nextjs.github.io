#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging build output...\n');

// Check if out directory exists
const outDir = path.join(process.cwd(), 'out');
if (!fs.existsSync(outDir)) {
  console.log('❌ No "out" directory found. Run "npm run build" first.');
  process.exit(1);
}

console.log('📁 Checking build output structure...\n');

// List all files in out directory
function listFiles(dir, prefix = '') {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      console.log(`${prefix}📁 ${item}/`);
      listFiles(fullPath, prefix + '  ');
    } else {
      console.log(`${prefix}📄 ${item}`);
    }
  }
}

listFiles(outDir);

console.log('\n🔍 Checking for pagination pages...\n');

// Check for pagination pages
const pageDir = path.join(outDir, 'page');
if (fs.existsSync(pageDir)) {
  console.log('✅ Found /page/ directory');
  const pageItems = fs.readdirSync(pageDir);
  console.log(`   Contains: ${pageItems.join(', ')}`);
} else {
  console.log('❌ No /page/ directory found');
}

// Check for tag pagination pages
const tagDir = path.join(outDir, 'tag');
if (fs.existsSync(tagDir)) {
  console.log('✅ Found /tag/ directory');
  const tagItems = fs.readdirSync(tagDir);
  console.log(`   Contains: ${tagItems.join(', ')}`);
  
  // Check for nested page directories in tags
  for (const tag of tagItems) {
    const tagPageDir = path.join(tagDir, tag, 'page');
    if (fs.existsSync(tagPageDir)) {
      console.log(`   ✅ Tag "${tag}" has pagination: ${fs.readdirSync(tagPageDir).join(', ')}`);
    }
  }
} else {
  console.log('❌ No /tag/ directory found');
}

console.log('\n🔍 Checking for index files...\n');

// Check for index files
const indexFiles = [];
function findIndexFiles(dir, currentPath = '') {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findIndexFiles(fullPath, path.join(currentPath, item));
    } else if (item === 'index.html') {
      indexFiles.push(path.join(currentPath, item));
    }
  }
}

findIndexFiles(outDir);
console.log(`Found ${indexFiles.length} index.html files:`);
indexFiles.forEach(file => console.log(`  • ${file}`));

console.log('\n✅ Build debug complete!');
console.log('\n💡 If pagination pages are missing, check:');
console.log('   1. Dynamic routes are properly configured');
console.log('   2. generateStaticParams functions are working');
console.log('   3. Build process completed successfully');
console.log('   4. No TypeScript/compilation errors');
