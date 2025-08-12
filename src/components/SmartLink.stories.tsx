import type { Meta, StoryObj } from '@storybook/react';
import SmartLink from './SmartLink';

const meta: Meta<typeof SmartLink> = {
  title: 'Components/SmartLink',
  component: SmartLink,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A smart link component that automatically handles internal vs external links with proper security practices.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    href: {
      description: 'The URL for the link',
      control: 'text',
    },
    children: {
      description: 'The link text/content',
      control: 'text',
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text',
    },
    target: {
      description: 'Target attribute (overridden for external links)',
      control: 'text',
    },
    rel: {
      description: 'Rel attribute (automatically set for external links)',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InternalLink: Story = {
  args: {
    href: '/about',
    children: 'About Page',
    className: 'text-blue-600 hover:text-blue-800 underline',
  },
  parameters: {
    docs: {
      description: {
        story: 'Internal links use Next.js Link component for optimal performance.',
      },
    },
  },
};

export const ExternalLink: Story = {
  args: {
    href: 'https://nextjs.org',
    children: 'Next.js Documentation',
    className: 'text-green-600 hover:text-green-800 underline',
  },
  parameters: {
    docs: {
      description: {
        story: 'External links automatically open in new tab with security attributes (noopener, noreferrer).',
      },
    },
  },
};

export const AnchorLink: Story = {
  args: {
    href: '#section',
    children: 'Jump to Section',
    className: 'text-purple-600 hover:text-purple-800 underline',
  },
  parameters: {
    docs: {
      description: {
        story: 'Anchor links use Next.js Link for smooth scrolling.',
      },
    },
  },
};

export const EmailLink: Story = {
  args: {
    href: 'mailto:example@example.com',
    children: 'Send Email',
    className: 'text-orange-600 hover:text-orange-800 underline',
  },
  parameters: {
    docs: {
      description: {
        story: 'Protocol links (mailto:, tel:) use regular anchor tags.',
      },
    },
  },
};

export const PhoneLink: Story = {
  args: {
    href: 'tel:+1234567890',
    children: 'Call Us',
    className: 'text-red-600 hover:text-red-800 underline',
  },
  parameters: {
    docs: {
      description: {
        story: 'Phone links use regular anchor tags for proper mobile behavior.',
      },
    },
  },
};

export const WithCustomStyling: Story = {
  args: {
    href: '/contact',
    children: 'Contact Us',
    className: 'inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom styling can be applied through className prop.',
      },
    },
  },
};
