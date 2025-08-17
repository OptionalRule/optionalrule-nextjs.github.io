import { ReactNode, AnchorHTMLAttributes, MouseEventHandler } from 'react';
import SmartLink from './SmartLink';

interface MarkdownLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export default function MarkdownLink({
  href,
  children,
  className,
  title,
  ...props
}: MarkdownLinkProps) {
  // Add default styling for markdown links
  const defaultClassName = 'text-[var(--link)] hover:text-[var(--link-hover)] underline transition-colors';
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
