interface HeadingAnchorProps {
  id: string;
  headingText: string;
}

export default function HeadingAnchor({ id, headingText }: HeadingAnchorProps) {
  return (
    <a 
      href={`#${id}`} 
      className="no-underline hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-[var(--link)] hover:text-[var(--link-hover)] ml-2 text-lg font-normal align-text-top"
      aria-label={`Link to ${headingText}`}
      title={`Link to ${headingText}`}
    >
      #
    </a>
  );
}
