interface HeadingAnchorProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children?: React.ReactNode;
}

export default function HeadingAnchor({ level, children, ...props }: HeadingAnchorProps) {
  const Tag = `h${level}` as const;
  const text = typeof children === 'string' ? children : String(children);
  const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

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
