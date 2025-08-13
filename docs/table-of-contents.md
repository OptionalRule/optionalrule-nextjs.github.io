# Table of Contents Features

## Overview

Your blog now has automatic table of contents (TOC) generation with collapsible functionality and conditional display control.

## Features

### 1. **Automatic Heading IDs**

- All headings (h1-h6) automatically get unique, slugified IDs
- No more manual ID management
- SEO-friendly anchor links

### 2. **Collapsible Table of Contents**

- Click the TOC header to expand/collapse
- Smooth animations with CSS transitions
- Accessible with proper ARIA attributes
- Default state is expanded (configurable)

### 3. **Conditional Display**

- TOC shows by default for all posts/pages
- Explicitly hide with `showToc: false` in frontmatter
- Explicitly show with `showToc: true` in frontmatter

## Usage

### **Show TOC (Default Behavior)**

```mdx
---
title: "My Post"
date: "2024-01-15"
# showToc: true (optional, this is the default)
---

# Main Title
## Section One
### Subsection
```

### **Hide TOC**

```mdx
---
title: "My Post"
date: "2024-01-15"
showToc: false
---

# Main Title
## Section One
```

### **Explicitly Show TOC**

```mdx
---
title: "My Post"
date: "2024-01-15"
showToc: true
---

# Main Title
## Section One
```

## How It Works

1. **Frontmatter Processing**: The `showToc` field is read from your MDX frontmatter
2. **Conditional Rendering**: TOC only renders when `showToc !== false`
3. **Heading Extraction**: All headings are automatically scanned and processed
4. **ID Generation**: Unique, collision-free IDs are created for each heading
5. **Interactive TOC**: Users can expand/collapse the TOC as needed

## Best Practices

### **When to Show TOC**

- ✅ **Long posts** (1000+ words)
- ✅ **Posts with many sections** (5+ headings)
- ✅ **Technical tutorials** with multiple steps
- ✅ **Reference guides** with many subsections

### **When to Hide TOC**

- ❌ **Short posts** (< 500 words)
- ❌ **Simple announcements**
- ❌ **Posts with minimal structure**
- ❌ **Personal stories** with few sections

### **Default Behavior**

- **Posts**: TOC shows by default (can be hidden with `showToc: false`)
- **Pages**: TOC shows by default (can be hidden with `showToc: false`)
- **No frontmatter**: TOC shows (default behavior)

## Examples

### **Long Tutorial Post**

```mdx
---
title: "Complete Next.js Tutorial"
date: "2024-01-15"
showToc: true  # Explicitly show for long content
---

# Introduction
## Prerequisites
### Node.js Setup
### Code Editor
## Getting Started
### Installation
### Configuration
### First Steps
## Advanced Topics
### Routing
### API Routes
### Deployment
## Conclusion
```

### **Short Announcement**

```mdx
---
title: "Site Update"
date: "2024-01-15"
showToc: false  # Hide for short content
---

# Site Update

We've made some improvements to the blog...
```

## Technical Details

- **Component**: `TableOfContents` with collapsible functionality
- **State Management**: React useState for expand/collapse
- **Accessibility**: ARIA attributes and keyboard navigation
- **Styling**: Tailwind CSS with smooth transitions
- **Performance**: Client-side rendering with hydration

## Customization

The TOC component accepts these props:

- `headings`: Array of heading objects
- `className`: Additional CSS classes
- `defaultExpanded`: Initial state (default: true)

## Future Enhancements

- [ ] TOC positioning options (left sidebar, right sidebar, inline)
- [ ] Sticky TOC that follows scroll
- [ ] TOC depth control (show only h1, h2, etc.)
- [ ] Custom TOC styling per post
- [ ] TOC search/filter functionality
