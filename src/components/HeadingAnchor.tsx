interface HeadingAnchorProps {
  id: string;
  headingText: string;
}

export default function HeadingAnchor({ id, headingText }: HeadingAnchorProps) {
  return (
    <a 
      href={`#${id}`} 
      className="no-underline hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-2 text-lg font-normal align-text-top"
      aria-label={`Link to ${headingText}`}
      title={`Link to ${headingText}`}
    >
      #
    </a>
  );
}
