import React from 'react';
import YouTubeEmbed from './YouTubeEmbed';

interface MediaEmbedProps {
  url: string;
  title?: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function MediaEmbed({ 
  url, 
  title, 
  width, 
  height, 
  className 
}: MediaEmbedProps) {
  // YouTube URLs
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return (
      <YouTubeEmbed 
        url={url} 
        title={title} 
        width={width} 
        height={height} 
        className={className} 
      />
    );
  }
  
  // Vimeo URLs
  if (url.includes('vimeo.com')) {
    const vimeoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    if (vimeoId) {
      return (
        <div className={`my-6 ${className || ''}`}>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}`}
              title={title || 'Vimeo video'}
              width={width || 560}
              height={height || 315}
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      );
    }
  }
  
  // Generic iframe support for other embeds
  if (url.includes('iframe') || url.includes('embed')) {
    return (
      <div className={`my-6 ${className || ''}`}>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={url}
            title={title || 'Embedded content'}
            width={width || 560}
            height={height || 315}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            frameBorder="0"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    );
  }
  
  // Fallback for unsupported URLs
  return (
    <div className={`bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center ${className || ''}`}>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        Unsupported media URL
      </p>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        Open in new tab
      </a>
    </div>
  );
}
