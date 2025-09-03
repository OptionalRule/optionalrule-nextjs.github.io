import type { MDXComponents } from 'mdx/types';
import Image, { ImageProps } from 'next/image';
import SmartLink from '@/components/SmartLink';
import HeadingAnchor from '@/components/HeadingAnchor';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import MediaEmbed from '@/components/MediaEmbed';
import { generateHeadingId } from '@/lib/utils';

type MDXImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  src: string;
  alt?: string;
};

function MDXImage({
  src,
  alt = '',
  width,
  height,
  className,
  ...props
}: MDXImageProps) {
  const parsedWidth = typeof width === 'string' ? parseInt(width, 10) : width;
  const parsedHeight = typeof height === 'string' ? parseInt(height, 10) : height;

  // If width/height are missing (common in Markdown images), fall back to a plain <img>
  // This avoids Next/Image throwing during dev/export while keeping images responsive.
  if (!parsedWidth || !parsedHeight) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`mx-auto my-6 rounded-lg shadow-md ${className ?? ''}`}
        style={{ maxWidth: '100%', height: 'auto' }}
        {...(props as any)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={parsedWidth}
      height={parsedHeight}
      className={`mx-auto my-6 rounded-lg shadow-md ${className ?? ''}`}
      style={{ width: '100%', height: 'auto' }}
      {...props}
    />
  );
}

/**
 * Comprehensive MDX component overrides for consistent rendering
 * This replaces the previous useMDXComponents approach with a cleaner implementation
 */
export const mdxComponents: MDXComponents = {
  // Headings with consistent styling and anchor links
  h1: ({ children, ...props }) => {
    const headingText = typeof children === 'string' ? children : '';
    const id = generateHeadingId(headingText);
    
    return (
      <h1 
        id={id} 
        className="text-4xl font-bold text-[var(--foreground)] mb-6 scroll-mt-20 group"
        {...props}
      >
        {children}
        <HeadingAnchor id={id} headingText={headingText} />
      </h1>
    );
  },
  
  h2: ({ children, ...props }) => {
    const headingText = typeof children === 'string' ? children : '';
    const id = generateHeadingId(headingText);
    
    return (
      <h2 
        id={id} 
        className="text-3xl font-semibold text-[var(--foreground)] mb-4 mt-8 scroll-mt-20 group"
        {...props}
      >
        {children}
        <HeadingAnchor id={id} headingText={headingText} />
      </h2>
    );
  },
  
  h3: ({ children, ...props }) => {
    const headingText = typeof children === 'string' ? children : '';
    const id = generateHeadingId(headingText);
    
    return (
      <h3 
        id={id} 
        className="text-2xl font-medium text-[var(--foreground)] mb-3 mt-6 scroll-mt-20 group"
        {...props}
      >
        {children}
        <HeadingAnchor id={id} headingText={headingText} />
      </h3>
    );
  },
  
  h4: ({ children, ...props }) => {
    const headingText = typeof children === 'string' ? children : '';
    const id = generateHeadingId(headingText);
    
    return (
      <h4 
        id={id} 
        className="text-xl font-medium text-[var(--foreground)] mb-2 mt-4 scroll-mt-20 group"
        {...props}
      >
        {children}
        <HeadingAnchor id={id} headingText={headingText} />
      </h4>
    );
  },
  
  h5: ({ children, ...props }) => {
    const headingText = typeof children === 'string' ? children : '';
    const id = generateHeadingId(headingText);
    
    return (
      <h5 
        id={id} 
        className="text-lg font-medium text-[var(--foreground)] mb-2 mt-4 scroll-mt-20 group"
        {...props}
      >
        {children}
        <HeadingAnchor id={id} headingText={headingText} />
      </h5>
    );
  },
  
  h6: ({ children, ...props }) => {
    const headingText = typeof children === 'string' ? children : '';
    const id = generateHeadingId(headingText);
    
    return (
      <h6 
        id={id} 
        className="text-base font-medium text-[var(--foreground)] mb-2 mt-4 scroll-mt-20 group"
        {...props}
      >
        {children}
        <HeadingAnchor id={id} headingText={headingText} />
      </h6>
    );
  },

  // Text elements with consistent spacing and typography
  p: ({ children, ...props }) => (
    <p className="text-[var(--muted)] mb-4 leading-relaxed" {...props}>
      {children}
    </p>
  ),

  // Links with consistent styling and smart link behavior
  a: ({ href, children, ...props }) => (
    <SmartLink
      href={href || '#'}
      className="text-[var(--link)] hover:text-[var(--link-hover)] underline transition-colors"
      {...props}
    >
      {children}
    </SmartLink>
  ),

  // Lists with consistent spacing and styling
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside text-[var(--muted)] mb-4 space-y-1" {...props}>
      {children}
    </ul>
  ),
  
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside text-[var(--muted)] mb-4 space-y-1" {...props}>
      {children}
    </ol>
  ),
  
  li: ({ children, ...props }) => (
    <li className="mb-1" {...props}>
      {children}
    </li>
  ),

  // Blockquotes with consistent styling
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-4 border-[var(--link)] pl-4 py-2 mb-4 italic text-[var(--muted-2)]" {...props}>
      {children}
    </blockquote>
  ),

  // Code elements with consistent styling
  code: ({ children, ...props }) => (
    <code className="bg-[var(--surface-hover)] px-1 py-0.5 rounded text-sm font-mono" {...props}>
      {children}
    </code>
  ),
  
  pre: ({ children, ...props }) => (
    <pre className="bg-[var(--surface-hover)] p-4 rounded-lg overflow-x-auto mb-4" {...props}>
      {children}
    </pre>
  ),

  // Table components with consistent styling and responsive behavior
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto mb-6" {...props}>
      <table className="min-w-full border border-[var(--border)] rounded-lg">
        {children}
      </table>
    </div>
  ),
  
  thead: ({ children, ...props }) => (
    <thead className="bg-[var(--surface-hover)]" {...props}>
      {children}
    </thead>
  ),
  
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-[var(--border)]" {...props}>
      {children}
    </tbody>
  ),
  
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-[var(--surface-hover)] transition-colors" {...props}>
      {children}
    </tr>
  ),
  
  th: ({ children, ...props }) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--foreground)] border-b border-[var(--border)]" {...props}>
      {children}
    </th>
  ),
  
  td: ({ children, ...props }) => (
    <td className="px-4 py-3 text-sm text-[var(--muted)]" {...props}>
      {children}
    </td>
  ),

  // Horizontal rules
  hr: ({ ...props }) => (
    <hr className="border-[var(--border)] my-8" {...props} />
  ),

  // Strong and emphasis
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-[var(--foreground)]" {...props}>
      {children}
    </strong>
  ),
  
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),

  // Images wrapped with next/image for optimization
  img: (props) => <MDXImage {...props as any} />,

  // Custom components
  YouTubeEmbed,
  MediaEmbed,
};

/**
 * Legacy function for backward compatibility - now just returns the components
 * This can be removed in future versions once all usage is updated
 */
export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  };
}
