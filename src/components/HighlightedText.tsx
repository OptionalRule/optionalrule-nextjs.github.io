import React from 'react';

interface HighlightedTextProps {
  text: string;
  searchQuery?: string; // The actual search query to highlight
  className?: string;
}

interface TextSegment {
  text: string;
  isHighlighted: boolean;
}

export function HighlightedText({ text, searchQuery, className = '' }: HighlightedTextProps) {
  // If no search query, return plain text
  if (!searchQuery || !searchQuery.trim()) {
    return <span className={className}>{text}</span>;
  }

  const query = searchQuery.trim();
  
  // Find all occurrences of the search query (case-insensitive)
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchRanges: Array<[number, number]> = [];
  
  let searchIndex = 0;
  while (searchIndex < text.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, searchIndex);
    if (matchIndex === -1) break;
    
    matchRanges.push([matchIndex, matchIndex + query.length - 1]);
    searchIndex = matchIndex + query.length;
  }

  // If no matches found, return plain text
  if (matchRanges.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Split text into segments
  const segments: TextSegment[] = [];
  let currentIndex = 0;

  matchRanges.forEach(([start, end]) => {
    // Add text before highlight (if any)
    if (currentIndex < start) {
      segments.push({
        text: text.slice(currentIndex, start),
        isHighlighted: false,
      });
    }

    // Add highlighted text
    segments.push({
      text: text.slice(start, end + 1),
      isHighlighted: true,
    });

    currentIndex = end + 1;
  });

  // Add remaining text after last highlight (if any)
  if (currentIndex < text.length) {
    segments.push({
      text: text.slice(currentIndex),
      isHighlighted: false,
    });
  }

  // Render segments
  return (
    <span className={className}>
      {segments.map((segment, index) => (
        segment.isHighlighted ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded-sm"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      ))}
    </span>
  );
}