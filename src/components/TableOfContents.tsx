'use client';

import { ReactNode, useState } from 'react';

interface Heading {
  level: number;
  text: string;
  id: string;
}

interface TableOfContentsProps {
  headings: Heading[];
  className?: string;
  defaultExpanded?: boolean;
}

export default function TableOfContents({ 
  headings, 
  className = '', 
  defaultExpanded = true 
}: TableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className={`toc ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="toc-content"
      >
        <span>Table of Contents</span>
        <svg
          className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div
        id="toc-content"
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <ul className="space-y-2">
          {headings.map((heading, index) => (
            <li key={index}>
              <a
                href={`#${heading.id}`}
                className={`
                  block text-sm transition-colors
                  ${heading.level === 1 ? 'font-semibold text-gray-900 dark:text-gray-100' : ''}
                  ${heading.level === 2 ? 'font-medium text-gray-800 dark:text-gray-200 ml-4' : ''}
                  ${heading.level === 3 ? 'text-gray-700 dark:text-gray-300 ml-8' : ''}
                  ${heading.level === 4 ? 'text-gray-600 dark:text-gray-400 ml-12' : ''}
                  ${heading.level === 5 ? 'text-gray-500 dark:text-gray-500 ml-16' : ''}
                  ${heading.level === 6 ? 'text-gray-400 dark:text-gray-600 ml-20' : ''}
                  hover:text-blue-600 dark:hover:text-blue-400
                `}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
