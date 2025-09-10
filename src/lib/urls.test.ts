import { describe, it, expect } from 'vitest';
import { 
  urlPaths, 
  generatePostUrl, 
  hasTrailingSlash, 
  ensureTrailingSlash 
} from './urls';

describe('URL Helpers', () => {
  describe('urlPaths.home', () => {
    it('should return root path with trailing slash', () => {
      expect(urlPaths.home()).toBe('/');
    });
  });

  describe('urlPaths.post', () => {
    it('should generate correct post URLs with trailing slash', () => {
      expect(urlPaths.post('2024-03-15', 'getting-started')).toBe('/2024/03/15/getting-started/');
      expect(urlPaths.post('2023-12-25', 'holiday-post')).toBe('/2023/12/25/holiday-post/');
    });

    it('should handle single digit months and days with zero padding', () => {
      expect(urlPaths.post('2024-01-05', 'test-post')).toBe('/2024/01/05/test-post/');
      expect(urlPaths.post('2024-09-08', 'another-post')).toBe('/2024/09/08/another-post/');
    });

    it('should handle edge cases', () => {
      expect(urlPaths.post('2024-02-29', 'leap-year')).toBe('/2024/02/29/leap-year/');
    });
  });

  describe('urlPaths.tag', () => {
    it('should generate tag URLs with proper slugification', () => {
      expect(urlPaths.tag('Gaming')).toBe('/tag/gaming/');
      expect(urlPaths.tag('RPG')).toBe('/tag/rpg/');
      expect(urlPaths.tag('tabletop')).toBe('/tag/tabletop/');
      expect(urlPaths.tag('Role Playing')).toBe('/tag/role-playing/');
      expect(urlPaths.tag('D&D 5e')).toBe('/tag/dd-5e/');
    });

    it('should handle pagination', () => {
      expect(urlPaths.tag('Gaming', 1)).toBe('/tag/gaming/');
      expect(urlPaths.tag('Gaming', 2)).toBe('/tag/gaming/page/2/');
      expect(urlPaths.tag('Gaming', 5)).toBe('/tag/gaming/page/5/');
      expect(urlPaths.tag('Role Playing', 2)).toBe('/tag/role-playing/page/2/');
    });

    it('should treat page 1 as no pagination', () => {
      expect(urlPaths.tag('Gaming', 1)).toBe('/tag/gaming/');
    });

    it('should handle undefined page parameter', () => {
      expect(urlPaths.tag('Gaming', undefined)).toBe('/tag/gaming/');
    });

    it('should handle special characters and spaces', () => {
      expect(urlPaths.tag('C++ Programming')).toBe('/tag/c-programming/');
      expect(urlPaths.tag('Test & Debug')).toBe('/tag/test-debug/');
      expect(urlPaths.tag('Game Master Tips')).toBe('/tag/game-master-tips/');
    });
  });

  describe('urlPaths.tags', () => {
    it('should return tags index URL', () => {
      expect(urlPaths.tags()).toBe('/tags/');
    });
  });

  describe('urlPaths.page', () => {
    it('should generate pagination URLs', () => {
      expect(urlPaths.page(2)).toBe('/page/2/');
      expect(urlPaths.page(10)).toBe('/page/10/');
    });

    it('should return home URL for page 1 or less', () => {
      expect(urlPaths.page(1)).toBe('/');
      expect(urlPaths.page(0)).toBe('/');
      expect(urlPaths.page(-1)).toBe('/');
    });
  });

  describe('urlPaths.search', () => {
    it('should return search URL without query', () => {
      expect(urlPaths.search()).toBe('/search/');
      expect(urlPaths.search('')).toBe('/search/');
      expect(urlPaths.search('   ')).toBe('/search/');
    });

    it('should include encoded query parameter', () => {
      expect(urlPaths.search('rpg mechanics')).toBe('/search/?q=rpg%20mechanics');
      expect(urlPaths.search('D&D rules')).toBe('/search/?q=D%26D%20rules');
      expect(urlPaths.search('game design')).toBe('/search/?q=game%20design');
    });

    it('should trim whitespace from query', () => {
      expect(urlPaths.search('  test query  ')).toBe('/search/?q=test%20query');
    });

    it('should handle special characters in query', () => {
      expect(urlPaths.search('C++ & JavaScript')).toBe('/search/?q=C%2B%2B%20%26%20JavaScript');
    });
  });

  describe('urlPaths.staticPage', () => {
    it('should generate static page URLs', () => {
      expect(urlPaths.staticPage('about')).toBe('/pages/about/');
      expect(urlPaths.staticPage('contact')).toBe('/pages/contact/');
      expect(urlPaths.staticPage('privacy-policy')).toBe('/pages/privacy-policy/');
    });
  });

  describe('urlPaths.game', () => {
    it('should generate game URLs', () => {
      expect(urlPaths.game('asteroids')).toBe('/games/asteroids/');
      expect(urlPaths.game('dice-roller')).toBe('/games/dice-roller/');
    });
  });

  describe('urlPaths.tool', () => {
    it('should generate tool URLs', () => {
      expect(urlPaths.tool('kcd2_alchemy')).toBe('/tools/kcd2_alchemy/');
      expect(urlPaths.tool('builder')).toBe('/tools/builder/');
    });
  });

  describe('urlPaths.rss', () => {
    it('should return RSS feed URL', () => {
      expect(urlPaths.rss()).toBe('/rss.xml');
    });
  });

  describe('urlPaths.sitemap', () => {
    it('should return sitemap URL', () => {
      expect(urlPaths.sitemap()).toBe('/sitemap.xml');
    });
  });

  describe('urlPaths.robots', () => {
    it('should return robots.txt URL', () => {
      expect(urlPaths.robots()).toBe('/robots.txt');
    });
  });

  describe('generatePostUrl (legacy)', () => {
    it('should maintain backward compatibility', () => {
      expect(generatePostUrl('2024-03-15', 'test-post')).toBe('/2024/03/15/test-post/');
      expect(generatePostUrl).toBe(urlPaths.post);
    });
  });

  describe('hasTrailingSlash', () => {
    it('should detect trailing slashes correctly', () => {
      expect(hasTrailingSlash('/')).toBe(true);
      expect(hasTrailingSlash('/about/')).toBe(true);
      expect(hasTrailingSlash('/tag/gaming/')).toBe(true);
    });

    it('should detect missing trailing slashes', () => {
      expect(hasTrailingSlash('/about')).toBe(false);
      expect(hasTrailingSlash('/tag/gaming')).toBe(false);
      expect(hasTrailingSlash('/search')).toBe(false);
    });

    it('should allow files without trailing slashes', () => {
      expect(hasTrailingSlash('/rss.xml')).toBe(true);
      expect(hasTrailingSlash('/sitemap.xml')).toBe(true);
      expect(hasTrailingSlash('/robots.txt')).toBe(true);
      expect(hasTrailingSlash('/favicon.ico')).toBe(true);
      expect(hasTrailingSlash('/image.jpg')).toBe(true);
      expect(hasTrailingSlash('/script.js')).toBe(true);
    });

    it('should handle query parameters and fragments', () => {
      expect(hasTrailingSlash('/search/?q=test')).toBe(false);
      expect(hasTrailingSlash('/about/#section')).toBe(false);
    });
  });

  describe('ensureTrailingSlash', () => {
    it('should add trailing slash when missing', () => {
      expect(ensureTrailingSlash('/about')).toBe('/about/');
      expect(ensureTrailingSlash('/tag/gaming')).toBe('/tag/gaming/');
      expect(ensureTrailingSlash('/search')).toBe('/search/');
    });

    it('should preserve existing trailing slashes', () => {
      expect(ensureTrailingSlash('/')).toBe('/');
      expect(ensureTrailingSlash('/about/')).toBe('/about/');
      expect(ensureTrailingSlash('/tag/gaming/')).toBe('/tag/gaming/');
    });

    it('should not modify file URLs', () => {
      expect(ensureTrailingSlash('/rss.xml')).toBe('/rss.xml');
      expect(ensureTrailingSlash('/sitemap.xml')).toBe('/sitemap.xml');
      expect(ensureTrailingSlash('/robots.txt')).toBe('/robots.txt');
      expect(ensureTrailingSlash('/favicon.ico')).toBe('/favicon.ico');
    });

    it('should handle edge cases', () => {
      expect(ensureTrailingSlash('')).toBe('/');
      expect(ensureTrailingSlash('test')).toBe('test/');
    });
  });

  describe('URL consistency validation', () => {
    it('should ensure all generated URLs have proper trailing slashes', () => {
      const urlsToTest = [
        urlPaths.home(),
        urlPaths.post('2024-01-01', 'test'),
        urlPaths.tag('test'),
        urlPaths.tag('test', 2),
        urlPaths.tag('Test Tag'),
        urlPaths.tag('Test Tag', 2),
        urlPaths.tags(),
        urlPaths.page(2),
        urlPaths.search(),
        urlPaths.staticPage('about'),
        urlPaths.game('asteroids'),
        urlPaths.tool('kcd2_alchemy'),
      ];

      urlsToTest.forEach(url => {
        expect(hasTrailingSlash(url)).toBe(true);
      });
    });

    it('should ensure file URLs do not have trailing slashes', () => {
      const fileUrls = [
        urlPaths.rss(),
        urlPaths.sitemap(),
        urlPaths.robots(),
      ];

      fileUrls.forEach(url => {
        expect(url.endsWith('/')).toBe(false);
        expect(/\.[a-zA-Z0-9]+$/.test(url)).toBe(true);
      });
    });
  });

  describe('Integration with existing utility functions', () => {
    it('should work with date parsing from utils', () => {
      // Test that our URL generation works with the date formats from the content system
      const testDate = '2024-03-15';
      const result = urlPaths.post(testDate, 'test-slug');
      
      expect(result).toBe('/2024/03/15/test-slug/');
      expect(hasTrailingSlash(result)).toBe(true);
    });
  });
});
