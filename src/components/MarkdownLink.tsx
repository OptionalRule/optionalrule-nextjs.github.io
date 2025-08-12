import { ReactNode } from 'react';
import SmartLink from './SmartLink';

interface MarkdownLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
  [key: string]: any;
}

export default function MarkdownLink({
  href,
  children,
  className,
  title,
  ...props
}: MarkdownLinkProps) {
  // Add default styling for markdown links
  const defaultClassName = 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors';
  const combinedClassName = className ? `${defaultClassName} ${className}` : defaultClassName;
  
  return (
    <SmartLink
      href={href}
      className={combinedClassName}
      title={title}
      {...props}
    >
      {children}
    </SmartLink>
  );
}
