import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PostCard } from './PostCard';
import TableOfContents from './TableOfContents';
import SmartLink from './SmartLink';
import YouTubeEmbed from './YouTubeEmbed';
import MediaEmbed from './MediaEmbed';
import { PostMeta } from '@/lib/types';

const meta: Meta = {
  title: 'Component Library',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A comprehensive showcase of all blog components working together.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const samplePost: PostMeta = {
  slug: 'complete-component-guide',
  title: 'Complete Guide to Our Blog Components',
  date: '2024-01-15',
  excerpt: 'Learn how to use all the components in our blog system, from smart links to table of contents.',
  tags: ['components', 'documentation', 'guide', 'blog'],
  featured_image: '/images/components-guide.jpg',
  readingTime: 12,
  showToc: true,
  headings: [],
};

const sampleHeadings = [
  { level: 1, text: 'Component Library Overview', id: 'component-library-overview' },
  { level: 2, text: 'SmartLink Component', id: 'smartlink-component' },
  { level: 3, text: 'Internal Links', id: 'internal-links' },
  { level: 3, text: 'External Links', id: 'external-links' },
  { level: 2, text: 'Table of Contents', id: 'table-of-contents' },
  { level: 3, text: 'Collapsible Navigation', id: 'collapsible-navigation' },
  { level: 2, text: 'Post Cards', id: 'post-cards' },
  { level: 3, text: 'Post Metadata Display', id: 'post-metadata-display' },
  { level: 2, text: 'Heading Anchors', id: 'heading-anchors' },
  { level: 3, text: 'Automatic ID Generation', id: 'automatic-id-generation' },
  { level: 2, text: 'Media Embed Components', id: 'media-embed-components' },
  { level: 3, text: 'YouTube Embed', id: 'youtube-embed' },
  { level: 3, text: 'Media Embed', id: 'media-embed' },
  { level: 2, text: 'Best Practices', id: 'best-practices' },
  { level: 3, text: 'When to Use Each Component', id: 'when-to-use-each-component' },
];

export const CompleteBlogSystem: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Blog Component Library
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            A comprehensive showcase of all the components that power our blog system, 
            demonstrating how they work together to create a rich user experience.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Table of Contents */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <TableOfContents headings={sampleHeadings} defaultExpanded={true} />
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* SmartLink Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                SmartLink Component
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The SmartLink component automatically handles different types of links with appropriate behavior:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Internal:</span>
                  <SmartLink href="/pages/about/" className="text-blue-600 hover:text-blue-800 underline">
                    About Page
                  </SmartLink>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">External:</span>
                  <SmartLink href="https://nextjs.org" className="text-green-600 hover:text-green-800 underline">
                    Next.js Documentation
                  </SmartLink>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Anchor:</span>
                  <SmartLink href="#section" className="text-purple-600 hover:text-purple-800 underline">
                    Jump to Section
                  </SmartLink>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Email:</span>
                  <SmartLink href="mailto:example@example.com" className="text-orange-600 hover:text-orange-800 underline">
                    Send Email
                  </SmartLink>
                </div>
              </div>
            </section>

            {/* Post Card Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Post Card Component
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Post cards display blog post metadata in an attractive, clickable format:
              </p>
              
              <div className="max-w-md">
                <PostCard post={samplePost} />
              </div>
            </section>

            {/* Heading Anchors Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-6 group">
                Heading Anchors
                <a 
                  href="#heading-anchors" 
                  className="no-underline hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-2 text-lg font-normal align-text-top"
                  aria-label="Link to Heading Anchors"
                  title="Link to Heading Anchors"
                >
                  #
                </a>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                All headings automatically get clickable anchor links. Hover over any heading to see the # symbol:
              </p>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-medium text-gray-900 dark:text-gray-100 group">
                  Subsection Example
                  <a 
                    href="#subsection-example" 
                    className="no-underline hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-2 text-lg font-normal align-text-top"
                    aria-label="Link to Subsection Example"
                    title="Link to Subsection Example"
                  >
                    #
                  </a>
                </h3>
                
                <h4 className="text-xl font-medium text-gray-900 dark:text-gray-100 group">
                  Deep Subsection
                  <a 
                    href="#deep-subsection" 
                    className="no-underline hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-2 text-lg font-normal align-text-top"
                    aria-label="Link to Deep Subsection"
                    title="Link to Deep Subsection"
                  >
                    #
                  </a>
                </h4>
              </div>
            </section>

            {/* Media Embed Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Media Embed Components
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Our media components provide responsive, accessible embedding for various media types:
              </p>
              
              <div className="space-y-8">
                {/* YouTube Embed */}
                <div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-4">
                    YouTube Embed
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Automatically handles YouTube URLs and provides responsive embedding:
                  </p>
                  <div className="max-w-2xl">
                    <YouTubeEmbed 
                      id="P0rXo-Wp_II" 
                      title="D&D 2024 Spell Changes" 
                    />
                  </div>
                </div>

                {/* Media Embed */}
                <div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Media Embed (Vimeo Example)
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Handles various media types including Vimeo, podcasts, and other embeds:
                  </p>
                  <div className="max-w-2xl">
                    <MediaEmbed 
                      url="https://vimeo.com/123456789" 
                      title="Sample Vimeo Video" 
                    />
                  </div>
                </div>

                {/* Usage Examples */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Usage Examples:</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <div><code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">{"<YouTubeEmbed id=\"P0rXo-Wp_II\" />"}</code></div>
                    <div><code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">{"<YouTubeEmbed url=\"https://youtu.be/P0rXo-Wp_II\" />"}</code></div>
                    <div><code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">{"<MediaEmbed url=\"https://vimeo.com/123456789\" />"}</code></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Best Practices Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Best Practices
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">✅ Do</h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Use SmartLink for all links</li>
                    <li>• Enable TOC for long posts</li>
                    <li>• Add meaningful tags to posts</li>
                    <li>• Use descriptive heading text</li>
                    <li>• Use YouTubeEmbed for YouTube videos</li>
                    <li>• Use MediaEmbed for other media types</li>
                    <li>• Always provide meaningful titles for accessibility</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">❌ Don&apos;t</h3>
                  <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                    <li>• Hardcode anchor links</li>
                    <li>• Skip TOC for long content</li>
                    <li>• Use generic tag names</li>
                    <li>• Create vague headings</li>
                    <li>• Embed raw iframes directly</li>
                    <li>• Skip accessibility titles</li>
                    <li>• Use non-responsive video embeds</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A complete demonstration of all blog components working together in a realistic layout.',
      },
    },
  },
};
