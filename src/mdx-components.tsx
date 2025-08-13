import type { MDXComponents } from 'mdx/types';
import SmartLink from '@/components/SmartLink';
import HeadingAnchor from '@/components/HeadingAnchor';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import MediaEmbed from '@/components/MediaEmbed';
import { generateHeadingId } from '@/lib/utils';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
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
    p: ({ children }) => (
      <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
        {children}
      </p>
    ),
    a: ({ href, children, ...props }) => (
      <SmartLink
        href={href || '#'}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline transition-colors"
        {...props}
      >
        {children}
      </SmartLink>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
        {children}
      </ol>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 italic text-gray-600 dark:text-gray-400">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">
        {children}
      </pre>
    ),
    // Table components
    table: ({ children }) => (
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-50 dark:bg-gray-800">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {children}
      </td>
    ),
    YouTubeEmbed,
    MediaEmbed,
    ...components,
  };
}