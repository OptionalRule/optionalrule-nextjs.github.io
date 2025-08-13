import type { Meta, StoryObj } from '@storybook/react';
import YouTubeEmbed from '../components/YouTubeEmbed';

const meta: Meta<typeof YouTubeEmbed> = {
  title: 'Components/YouTubeEmbed',
  component: YouTubeEmbed,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A responsive YouTube video embed component that automatically handles various YouTube URL formats and provides responsive embedding.',
      },
    },
  },
  argTypes: {
    url: {
      control: 'text',
      description: 'YouTube URL (will extract video ID automatically)',
    },
    id: {
      control: 'text',
      description: 'YouTube video ID (e.g., "P0rXo-Wp_II")',
    },
    title: {
      control: 'text',
      description: 'Accessibility title for the video',
    },
    width: {
      control: { type: 'number', min: 200, max: 1200, step: 50 },
      description: 'Video width in pixels',
    },
    height: {
      control: { type: 'number', min: 150, max: 800, step: 50 },
      description: 'Video height in pixels',
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

export const Default: Story = {
  args: {
    id: 'P0rXo-Wp_II',
    title: 'D&D 2024 Spell Changes',
  },
};

export const WithURL: Story = {
  args: {
    url: 'https://www.youtube.com/watch?v=P0rXo-Wp_II',
    title: 'D&D 2024 Spell Changes',
  },
};

export const ShortURL: Story = {
  args: {
    url: 'https://youtu.be/P0rXo-Wp_II',
    title: 'D&D 2024 Spell Changes',
  },
};

export const CustomDimensions: Story = {
  args: {
    id: 'P0rXo-Wp_II',
    title: 'D&D 2024 Spell Changes',
    width: 800,
    height: 450,
  },
};

export const WithCustomClass: Story = {
  args: {
    id: 'P0rXo-Wp_II',
    title: 'D&D 2024 Spell Changes',
    className: 'border-4 border-blue-500 rounded-xl',
  },
};

export const InvalidID: Story = {
  args: {
    id: '',
    title: 'Invalid Video',
  },
};

export const InvalidURL: Story = {
  args: {
    url: 'https://example.com/not-youtube',
    title: 'Invalid URL',
  },
};

export const LongTitle: Story = {
  args: {
    id: 'P0rXo-Wp_II',
    title: 'This is a very long title that demonstrates how the component handles lengthy accessibility text for screen readers and other assistive technologies',
  },
};

export const NoTitle: Story = {
  args: {
    id: 'P0rXo-Wp_II',
  },
};
