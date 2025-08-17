import React from 'react';

interface YouTubeEmbedProps {
  url?: string;
  id?: string;
  title?: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function YouTubeEmbed({ 
  url, 
  id, 
  title = "YouTube video", 
  width = 560, 
  height = 315,
  className = ""
}: YouTubeEmbedProps) {
  // Extract video ID from URL if provided
  let videoId = id;
  
  if (url && !id) {
    // Handle various YouTube URL formats
    const urlPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of urlPatterns) {
      const match = url.match(pattern);
      if (match) {
        videoId = match[1];
        break;
      }
    }
  }
  
  if (!videoId) {
    console.warn('YouTubeEmbed: No valid video ID found from URL or id prop');
    return (
      <div className={`bg-[var(--surface-hover)] p-4 rounded-lg text-center ${className}`}>
        <p className="text-[var(--muted-2)]">
          Invalid YouTube URL or ID provided
        </p>
      </div>
    );
  }
  
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  
  return (
    <div className={`my-6 ${className}`}>
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          title={title}
          width={width}
          height={height}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
