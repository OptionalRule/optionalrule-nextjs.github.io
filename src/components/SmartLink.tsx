import Link from 'next/link';
import { ReactNode } from 'react';

interface SmartLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  title?: string;
  [key: string]: any; // Allow other HTML attributes
}

export default function SmartLink({
  href,
  children,
  className,
  target,
  rel,
  onClick,
  title,
  ...props
}: SmartLinkProps) {
  // Normalize the href to handle edge cases
  const normalizedHref = href?.trim() || '';
  
  // Check if it's an internal link (starts with / or #)
  const isInternalLink = normalizedHref.startsWith('/') || normalizedHref.startsWith('#');
  
  // Check if it's an external link (starts with http:// or https://)
  const isExternalLink = normalizedHref.startsWith('http://') || normalizedHref.startsWith('https://');
  
  // Check if it's a protocol link (mailto:, tel:, etc.)
  const isProtocolLink = normalizedHref.includes(':') && !isExternalLink;
  
  // For internal links, use Next.js Link component
  if (isInternalLink) {
    return (
      <Link 
        href={normalizedHref} 
        className={className}
        onClick={onClick}
        title={title}
        {...props}
      >
        {children}
      </Link>
    );
  }
  
  // For external links, use regular anchor tag with security best practices
  if (isExternalLink) {
    const externalRel = [
      'noopener', // Prevents the new page from accessing window.opener
      'noreferrer', // Prevents passing referrer information
      rel // Include any additional rel attributes passed as props
    ].filter(Boolean).join(' ');
    
    return (
      <a
        href={normalizedHref}
        className={className}
        target="_blank" // Always open in new tab for external links
        rel={externalRel}
        onClick={onClick}
        title={title}
        {...props}
      >
        {children}
      </a>
    );
  }
  
  // For protocol links (mailto:, tel:, etc.), use regular anchor
  if (isProtocolLink) {
    return (
      <a
        href={normalizedHref}
        className={className}
        target={target}
        rel={rel}
        onClick={onClick}
        title={title}
        {...props}
      >
        {children}
      </a>
    );
  }
  
  // For relative links or other cases, use regular anchor
  return (
    <a
      href={normalizedHref}
      className={className}
      target={target}
      rel={rel}
      onClick={onClick}
      title={title}
      {...props}
    >
      {children}
    </a>
  );
}
