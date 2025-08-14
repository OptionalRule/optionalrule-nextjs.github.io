import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import HeadingAnchor from './HeadingAnchor';

const meta: Meta<typeof HeadingAnchor> = {
  title: 'Components/HeadingAnchor',
  component: HeadingAnchor,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A reusable anchor link component that provides clickable links to heading sections.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      description: 'The heading ID for the anchor link',
      control: 'text',
    },
    headingText: {
      description: 'The heading text for accessibility',
      control: 'text',
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg border min-w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'getting-started',
    headingText: 'Getting Started',
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic anchor link with heading ID and text.',
      },
    },
  },
};

export const LongHeading: Story = {
  args: {
    id: 'getting-started-with-nextjs-and-react',
    headingText: 'Getting Started with Next.js and React: A Comprehensive Guide',
  },
  parameters: {
    docs: {
      description: {
        story: 'Anchor link for a longer heading text.',
      },
    },
  },
};

export const SpecialCharacters: Story = {
  args: {
    id: 'what-is-nextjs',
    headingText: 'What is Next.js?',
  },
  parameters: {
    docs: {
      description: {
        story: 'Anchor link with question mark in heading text.',
      },
    },
  },
};

export const WithContext: Story = {
  args: {
    id: 'installation',
    headingText: 'Installation',
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg border min-w-[400px]">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4 group">
          Installation
          <Story />
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This shows how the anchor link appears in context with a heading.
        </p>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Anchor link shown in context with a heading to demonstrate the hover effect.',
      },
    },
  },
};

export const MultipleAnchors: Story = {
  render: () => (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6 group">
        Main Title
        <HeadingAnchor id="main-title" headingText="Main Title" />
      </h1>
      
      <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4 group">
        Section One
        <HeadingAnchor id="section-one" headingText="Section One" />
      </h2>
      
      <h3 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-3 group">
        Subsection
        <HeadingAnchor id="subsection" headingText="Subsection" />
      </h3>
      
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-800 dark:text-blue-200">
        <strong>How it works:</strong>
        <ul className="mt-2 space-y-1">
          <li>• Hover over any heading to see the # anchor link appear</li>
          <li>• The # link appears after the heading text</li>
          <li>• Click the # to copy the direct link to that section</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple heading levels with anchor links to show the complete system.',
      },
    },
  },
};
