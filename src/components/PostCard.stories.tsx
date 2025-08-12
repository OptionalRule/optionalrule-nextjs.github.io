import type { Meta, StoryObj } from '@storybook/react';
import { PostCard } from './PostCard';
import { PostMeta } from '@/lib/types';

const meta: Meta<typeof PostCard> = {
  title: 'Components/PostCard',
  component: PostCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A card component that displays blog post metadata with title, excerpt, tags, and reading time.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    post: {
      description: 'Post metadata object',
      control: 'object',
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-gray-100 dark:bg-gray-900 min-w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const samplePost: PostMeta = {
  slug: 'getting-started-with-nextjs',
  title: 'Getting Started with Next.js: A Modern Web Framework',
  date: '2024-01-15',
  excerpt: 'Discover the power of Next.js and learn how to build fast, scalable web applications with this comprehensive guide to the React-based framework.',
  tags: ['nextjs', 'react', 'javascript', 'web-development'],
  featured_image: '/images/nextjs-intro.jpg',
  readingTime: 8,
  showToc: true,
  headings: [],
};

export const Default: Story = {
  args: {
    post: samplePost,
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard post card with all features enabled.',
      },
    },
  },
};

export const WithoutFeaturedImage: Story = {
  args: {
    post: {
      ...samplePost,
      featured_image: undefined,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Post card without a featured image.',
      },
    },
  },
};

export const ShortExcerpt: Story = {
  args: {
    post: {
      ...samplePost,
      excerpt: 'A brief introduction to Next.js.',
      readingTime: 3,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Post card with a shorter excerpt and reading time.',
      },
    },
  },
};

export const ManyTags: Story = {
  args: {
    post: {
      ...samplePost,
      tags: ['nextjs', 'react', 'javascript', 'typescript', 'web-development', 'frontend', 'backend', 'fullstack'],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Post card with many tags to show wrapping behavior.',
      },
    },
  },
};

export const NoTags: Story = {
  args: {
    post: {
      ...samplePost,
      tags: [],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Post card without any tags.',
      },
    },
  },
};

export const LongTitle: Story = {
  args: {
    post: {
      ...samplePost,
      title: 'This is a Very Long Post Title That Might Wrap to Multiple Lines and Show How the Component Handles Extended Text Content',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Post card with a very long title to test text wrapping.',
      },
    },
  },
};

export const RecentPost: Story = {
  args: {
    post: {
      ...samplePost,
      date: new Date().toISOString(),
      title: 'Just Published: Latest Updates',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Post card for a recently published article.',
      },
    },
  },
};

export const OldPost: Story = {
  args: {
    post: {
      ...samplePost,
      date: '2023-01-15',
      title: 'Classic Post from Last Year',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Post card for an older article.',
      },
    },
  },
};
