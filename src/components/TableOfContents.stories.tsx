import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import TableOfContents from './TableOfContents';
import { Heading } from '@/lib/types';

const meta: Meta<typeof TableOfContents> = {
  title: 'Components/TableOfContents',
  component: TableOfContents,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A collapsible table of contents component that displays hierarchical navigation for blog posts and pages.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    headings: {
      description: 'Array of heading objects with level, text, and id',
      control: 'object',
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text',
    },
    defaultExpanded: {
      description: 'Initial expanded state',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleHeadings = [
  { level: 1, text: 'Getting Started with Next.js', id: 'getting-started-with-nextjs' },
  { level: 2, text: 'What is Next.js?', id: 'what-is-nextjs' },
  { level: 2, text: 'Key Features', id: 'key-features' },
  { level: 3, text: 'Server-Side Rendering', id: 'server-side-rendering' },
  { level: 3, text: 'Static Site Generation', id: 'static-site-generation' },
  { level: 2, text: 'Getting Started', id: 'getting-started' },
  { level: 3, text: 'Installation', id: 'installation' },
  { level: 3, text: 'Project Structure', id: 'project-structure' },
  { level: 2, text: 'Conclusion', id: 'conclusion' },
];

export const Default: Story = {
  args: {
    headings: sampleHeadings,
    defaultExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default table of contents with all headings expanded.',
      },
    },
  },
};

export const Collapsed: Story = {
  args: {
    headings: sampleHeadings,
    defaultExpanded: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table of contents initially collapsed.',
      },
    },
  },
};

export const ShortContent: Story = {
  args: {
    headings: [
      { level: 1, text: 'Simple Post', id: 'simple-post' },
      { level: 2, text: 'Introduction', id: 'introduction' },
      { level: 2, text: 'Conclusion', id: 'conclusion' },
    ],
    defaultExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table of contents for posts with fewer headings.',
      },
    },
  },
};

export const DeepNesting: Story = {
  args: {
    headings: [
      { level: 1, text: 'Complex Tutorial', id: 'complex-tutorial' },
      { level: 2, text: 'Prerequisites', id: 'prerequisites' },
      { level: 3, text: 'System Requirements', id: 'system-requirements' },
      { level: 4, text: 'Operating System', id: 'operating-system' },
      { level: 4, text: 'Node.js Version', id: 'nodejs-version' },
      { level: 3, text: 'Development Tools', id: 'development-tools' },
      { level: 4, text: 'Code Editor', id: 'code-editor' },
      { level: 4, text: 'Terminal', id: 'terminal' },
      { level: 2, text: 'Setup', id: 'setup' },
      { level: 3, text: 'Installation', id: 'installation' },
      { level: 3, text: 'Configuration', id: 'configuration' },
      { level: 2, text: 'Advanced Topics', id: 'advanced-topics' },
      { level: 3, text: 'Customization', id: 'customization' },
      { level: 3, text: 'Deployment', id: 'deployment' },
    ],
    defaultExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table of contents with deep heading nesting (up to h4).',
      },
    },
  },
};

export const EmptyHeadings: Story = {
  args: {
    headings: [],
    defaultExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component handles empty headings gracefully (renders nothing).',
      },
    },
  },
};
