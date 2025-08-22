import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Build Verification', () => {
  const projectRoot = process.cwd();
  
  describe('Configuration files', () => {
    it('should have required config files', () => {
      const requiredFiles = [
        'package.json',
        'next.config.ts',
        'tsconfig.json',
        'vitest.config.ts',
        'vitest.unit.config.ts'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have valid package.json', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check required dependencies
      expect(packageJson.dependencies).toHaveProperty('next');
      expect(packageJson.dependencies).toHaveProperty('react');
      expect(packageJson.dependencies).toHaveProperty('react-dom');
      
      // Check required scripts
      expect(packageJson.scripts).toHaveProperty('build');
      expect(packageJson.scripts).toHaveProperty('test');
      expect(packageJson.scripts).toHaveProperty('lint');
    });
  });

  describe('Source structure', () => {
    it('should have required source directories', () => {
      const requiredDirs = [
        'src',
        'src/app',
        'src/lib',
        'src/components',
        'content',
        'content/posts',
        'content/pages'
      ];

      requiredDirs.forEach(dir => {
        const dirPath = path.join(projectRoot, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });

    it('should have core library files', () => {
      const coreFiles = [
        'src/lib/content.ts',
        'src/lib/search.ts',
        'src/lib/utils.ts',
        'src/lib/types.ts'
      ];

      coreFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Content validation', () => {
    it('should have sample content files', () => {
      const postsDir = path.join(projectRoot, 'content/posts');
      const pagesDir = path.join(projectRoot, 'content/pages');
      
      if (fs.existsSync(postsDir)) {
        const posts = fs.readdirSync(postsDir).filter(file => file.endsWith('.mdx') || file.endsWith('.md'));
        expect(posts.length).toBeGreaterThan(0);
      }
      
      if (fs.existsSync(pagesDir)) {
        const pages = fs.readdirSync(pagesDir).filter(file => file.endsWith('.mdx') || file.endsWith('.md'));
        expect(pages.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Build artifacts', () => {
    it('should create out directory when built', () => {
      const outDir = path.join(projectRoot, 'out');
      
      // This test only runs if build has been executed
      if (fs.existsSync(outDir)) {
        expect(fs.statSync(outDir).isDirectory()).toBe(true);
        
        // Check for essential build artifacts
        const indexPath = path.join(outDir, 'index.html');
        if (fs.existsSync(indexPath)) {
          expect(fs.statSync(indexPath).isFile()).toBe(true);
        }
      }
    });

    it('should generate search index', () => {
      const searchIndexPath = path.join(projectRoot, 'public/search-index.json');
      
      // This test only runs if search index has been generated
      if (fs.existsSync(searchIndexPath)) {
        const searchIndex = JSON.parse(fs.readFileSync(searchIndexPath, 'utf8'));
        expect(Array.isArray(searchIndex)).toBe(true);
        
        if (searchIndex.length > 0) {
          const firstItem = searchIndex[0];
          expect(firstItem).toHaveProperty('slug');
          expect(firstItem).toHaveProperty('title');
          expect(firstItem).toHaveProperty('excerpt');
          expect(firstItem).toHaveProperty('tags');
        }
      }
    });
  });
});