import type { MDXComponents } from 'mdx/types';
import SmartLink from '@/components/SmartLink';
import HeadingAnchor from '@/components/HeadingAnchor';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import MediaEmbed from '@/components/MediaEmbed';
import { generateHeadingId } from '@/lib/utils';

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
        className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6 scroll-mt-20 group"
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
        className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mt-8 scroll-mt-20 group"
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
        className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-3 mt-6 scroll-mt-20 group"
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
        className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2 mt-4 scroll-mt-20 group"
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
        className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 mt-4 scroll-mt-20 group"
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
        className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2 mt-4 scroll-mt-20 group"
        {...props}
      >
        {children}
        <HeadingAnchor id={id} headingText={headingText} />
      </h6>
    );
  },

  // Text elements with consistent spacing and typography
  p: ({ children, ...props }) => (
    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props}>
      {children}
    </p>
  ),

  // Links with consistent styling and smart link behavior
  a: ({ href, children, ...props }) => (
    <SmartLink
      href={href || '#'}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline transition-colors"
      {...props}
    >
      {children}
    </SmartLink>
  ),

  // Lists with consistent spacing and styling
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1" {...props}>
      {children}
    </ul>
  ),
  
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1" {...props}>
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
    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 italic text-gray-600 dark:text-gray-400" {...props}>
      {children}
    </blockquote>
  ),

  // Code elements with consistent styling
  code: ({ children, ...props }) => (
    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
      {children}
    </code>
  ),
  
  pre: ({ children, ...props }) => (
    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4" {...props}>
      {children}
    </pre>
  ),

  // Table components with consistent styling and responsive behavior
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto mb-6" {...props}>
      <table className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg">
        {children}
      </table>
    </div>
  ),
  
  thead: ({ children, ...props }) => (
    <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
      {children}
    </thead>
  ),
  
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-gray-300 dark:divide-gray-600" {...props}>
      {children}
    </tbody>
  ),
  
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" {...props}>
      {children}
    </tr>
  ),
  
  th: ({ children, ...props }) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600" {...props}>
      {children}
    </th>
  ),
  
  td: ({ children, ...props }) => (
    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" {...props}>
      {children}
    </td>
  ),

  // Horizontal rules
  hr: ({ ...props }) => (
    <hr className="border-gray-300 dark:border-gray-600 my-8" {...props} />
  ),

  // Strong and emphasis
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </strong>
  ),
  
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),

  // Images with centering and responsive styling
  // Using img instead of next/image for static export compatibility
  img: ({ src, alt, ...props }) => (
    <div className="flex justify-center my-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-w-full h-auto rounded-lg shadow-md"
        {...props}
      />
    </div>
  ),

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