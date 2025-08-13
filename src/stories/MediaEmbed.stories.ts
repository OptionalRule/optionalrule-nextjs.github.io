import type { Meta, StoryObj } from '@storybook/react';
import MediaEmbed from '../components/MediaEmbed';

const meta: Meta<typeof MediaEmbed> = {
  title: 'Components/MediaEmbed',
  component: MediaEmbed,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible media embed component that handles various media types including YouTube, Vimeo, and other iframe-based embeds.',
      },
    },
  },
  argTypes: {
    url: {
      control: 'text',
      description: 'Media URL to embed',
    },
    title: {
      control: 'text',
      description: 'Accessibility title for the media',
    },
    width: {
      control: { type: 'number', min: 200, max: 1200, step: 50 },
      description: 'Media width in pixels',
    },
    height: {
      control: { type: 'number', min: 150, max: 800, step: 50 },
      description: 'Media height in pixels',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const YouTube: Story = {
  args: {
    url: 'https://www.youtube.com/watch?v=P0rXo-Wp_II',
    title: 'D&D 2024 Spell Changes',
  },
};

export const Vimeo: Story = {
  args: {
    url: 'https://vimeo.com/123456789',
    title: 'Sample Vimeo Video',
  },
};

export const AnchorFM: Story = {
  args: {
    url: 'https://anchor.fm/tc-dnd/embed/episodes/Agency-esor47/a-a527m7a',
    title: 'Podcast Episode',
  },
};

export const GenericIframe: Story = {
  args: {
    url: 'https://example.com/embed/sample',
    title: 'Generic Embedded Content',
  },
};

export const CustomDimensions: Story = {
  args: {
    url: 'https://www.youtube.com/watch?v=P0rXo-Wp_II',
    title: 'D&D 2024 Spell Changes',
    width: 800,
    height: 450,
  },
};

export const WithCustomClass: Story = {
  args: {
    url: 'https://vimeo.com/123456789',
    title: 'Sample Vimeo Video',
    className: 'border-4 border-purple-500 rounded-xl shadow-lg',
  },
};

export const LongTitle: Story = {
  args: {
    url: 'https://www.youtube.com/watch?v=P0rXo-Wp_II',
    title: 'This is a very long title that demonstrates how the component handles lengthy accessibility text for screen readers and other assistive technologies',
  },
};

export const NoTitle: Story = {
  args: {
    url: 'https://vimeo.com/123456789',
  },
};

export const UnsupportedURL: Story = {
  args: {
    url: 'https://example.com/unsupported-media',
    title: 'Unsupported Media',
  },
};

export const YouTubeShortURL: Story = {
  args: {
    url: 'https://youtu.be/P0rXo-Wp_II',
    title: 'D&D 2024 Spell Changes (Short URL)',
  },
};

export const YouTubeEmbedURL: Story = {
  args: {
    url: 'https://www.youtube.com/embed/P0rXo-Wp_II',
    title: 'D&D 2024 Spell Changes (Embed URL)',
  },
};
