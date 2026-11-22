import { isValidElement, type ReactNode } from 'react';
import { generateHeadingId } from '@/lib/utils';

interface HeadingAnchorProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children?: ReactNode;
}

function nodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
  return '';
}

export default function HeadingAnchor({ level, children, id: providedId, ...props }: HeadingAnchorProps) {
  const Tag = `h${level}` as const;
  const text = nodeText(children);
  const id = providedId ?? generateHeadingId(text);

  return (
    <Tag id={id} className="group scroll-mt-20" {...props}>
      {children}
      <a
        href={`#${id}`}
        className="no-underline hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-[var(--link)] hover:text-[var(--link-hover)] ml-2 text-lg font-normal align-text-top"
        aria-label={`Link to ${text}`}
        title={`Link to ${text}`}
      >
        #
      </a>
    </Tag>
  );
}
