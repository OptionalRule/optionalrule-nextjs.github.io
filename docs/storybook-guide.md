# Storybook Guide

## 🎯 **Overview**

Storybook is set up in this project to document and showcase all the blog components. It provides an interactive development environment where you can view, test, and document your components in isolation.

## 🚀 **Getting Started**

### **Installation**

Storybook has already been installed with the following command:

```bash
npx storybook@latest init --yes
```

### **Running Storybook**

```bash
npm run storybook
```

This will start Storybook on `http://localhost:6006`

### **Building Storybook**

```bash
npm run build-storybook
```

This creates a static build for deployment.

## 📚 **Available Stories**

### **1. SmartLink Component** (`src/components/SmartLink.stories.tsx`)

- **Internal Link**: Shows how internal links use Next.js Link
- **External Link**: Demonstrates external link security features
- **Anchor Link**: Shows anchor link behavior
- **Email Link**: Protocol link examples
- **Phone Link**: Mobile-friendly link examples
- **Custom Styling**: How to apply custom CSS

### **2. TableOfContents Component** (`src/components/TableOfContents.stories.tsx`)

- **Default**: Expanded TOC with sample headings
- **Collapsed**: Initially collapsed TOC
- **Short Content**: TOC for posts with few headings
- **Deep Nesting**: TOC with multiple heading levels
- **Empty Headings**: Graceful handling of no headings

### **3. HeadingAnchor Component** (`src/components/HeadingAnchor.stories.tsx`)

- **Default**: Basic anchor link
- **Long Heading**: Handling of extended text
- **Special Characters**: Question marks and punctuation
- **With Context**: Anchor in heading context
- **Multiple Anchors**: Complete heading system

### **4. PostCard Component** (`src/components/PostCard.stories.tsx`)

- **Default**: Standard post card
- **Without Featured Image**: No image variant
- **Short Excerpt**: Minimal content
- **Many Tags**: Tag overflow handling
- **No Tags**: Empty tag state
- **Long Title**: Text wrapping behavior
- **Recent Post**: Current date handling
- **Old Post**: Past date display

### **5. Component Library** (`src/components/ComponentLibrary.stories.tsx`)

- **Complete Blog System**: All components working together
- **Realistic Layout**: Production-like page structure
- **Interactive Examples**: Live component demonstrations
- **Best Practices**: Usage guidelines and examples

## 🛠️ **Storybook Features**

### **Addons Installed**

- **@storybook/addon-a11y**: Accessibility testing
- **@storybook/addon-vitest**: Component testing integration
- **@storybook/addon-docs**: Automatic documentation generation

### **Controls Panel**

- **Interactive Props**: Modify component props in real-time
- **Type Safety**: Full TypeScript support
- **Validation**: Input validation for props

### **Documentation**
- **Auto-generated Docs**: Component API documentation
- **Usage Examples**: Code snippets and examples
- **Best Practices**: Guidelines for each component

## 📝 **Creating New Stories**

### **Basic Story Structure**
```tsx
import type { Meta, StoryObj } from '@storybook/react';
import YourComponent from './YourComponent';

const meta: Meta<typeof YourComponent> = {
  title: 'Components/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Description of what this component does.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Define prop controls
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};
```

### **Story Variants**
```tsx
export const WithCustomProps: Story = {
  args: {
    // Custom props
  },
  parameters: {
    docs: {
      description: {
        story: 'Explanation of this variant.',
      },
    },
  },
};
```

### **Complex Stories**
```tsx
export const ComplexExample: Story = {
  render: () => (
    <div className="complex-layout">
      <YourComponent />
      <OtherComponent />
    </div>
  ),
};
```

## 🎨 **Styling and Layout**

### **Layout Options**
- **centered**: Component centered in viewport
- **fullscreen**: Full viewport layout
- **padded**: Component with padding
- **custom**: Custom layout decorators

### **Decorators**
```tsx
decorators: [
  (Story) => (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg border">
      <Story />
    </div>
  ),
],
```

### **Dark Mode Support**
- **Automatic**: Respects system preference
- **Manual Toggle**: Available in Storybook toolbar
- **Consistent**: Matches your app's theme

## 🧪 **Testing with Storybook**

### **Vitest Integration**
- **Component Tests**: Test components in isolation
- **Interaction Tests**: Test user interactions
- **Accessibility Tests**: Ensure a11y compliance

### **Running Tests**
```bash
npx vitest
```

### **Coverage Reports**
```bash
npx vitest --coverage
```

## 📱 **Responsive Testing**

### **Viewport Sizes**
- **Mobile**: 375px, 768px
- **Tablet**: 1024px
- **Desktop**: 1440px, 1920px

### **Device Simulation**
- **Touch Events**: Mobile interaction testing
- **Orientation**: Portrait/landscape testing
- **Network**: Slow/fast connection simulation

## 🚀 **Deployment**

### **Static Build**
```bash
npm run build-storybook
```

### **Deploy Options**
- **Netlify**: Drag and drop `storybook-static` folder
- **Vercel**: Automatic deployment with build command
- **GitHub Pages**: Push to `gh-pages` branch

### **Environment Variables**
```bash
# .env.local
STORYBOOK_BASE_URL=https://your-domain.com
```

## 🔧 **Configuration**

### **Main Configuration** (`.storybook/main.ts`)
- **Framework**: Next.js with Vite
- **Stories**: `../src/**/*.stories.@(js|jsx|ts|tsx)`
- **Addons**: a11y, vitest, docs

### **Preview Configuration** (`.storybook/preview.ts`)
- **Global Decorators**: Theme providers, layout wrappers
- **Global Parameters**: Default viewport, backgrounds
- **Global Types**: Custom story types

### **Vite Configuration** (`.storybook/vite.config.ts`)
- **PostCSS**: Compatible with Next.js
- **Tailwind**: Full CSS support
- **Aliases**: Path resolution

## 📚 **Best Practices**

### **Story Organization**
- **Group by Component**: `Components/ComponentName`
- **Use Descriptive Names**: `Default`, `WithError`, `Loading`
- **Include Edge Cases**: Empty states, error states

### **Documentation**
- **Clear Descriptions**: What each story demonstrates
- **Usage Examples**: How to use the component
- **Props Documentation**: All available props with examples

### **Testing**
- **Cover All Props**: Test different prop combinations
- **Edge Cases**: Handle empty, null, undefined values
- **Accessibility**: Ensure a11y compliance

## 🆘 **Troubleshooting**

### **Common Issues**
- **PostCSS Errors**: Fixed by updating `postcss.config.mjs`
- **Build Failures**: Check TypeScript errors
- **Styling Issues**: Verify Tailwind CSS imports

### **Getting Help**
- **Storybook Discord**: Community support
- **Documentation**: [storybook.js.org](https://storybook.js.org)
- **GitHub Issues**: Report bugs and request features

## 🎉 **Benefits**

### **For Developers**
- **Component Isolation**: Test components independently
- **Visual Testing**: See how components look in different states
- **Documentation**: Self-documenting component library

### **For Designers**
- **Design System**: Visual component catalog
- **Prototyping**: Quick component experimentation
- **Collaboration**: Shared component understanding

### **For Stakeholders**
- **Component Overview**: See all available components
- **Feature Planning**: Understand component capabilities
- **Quality Assurance**: Visual component testing

---

**Happy Storybooking! 🚀**
