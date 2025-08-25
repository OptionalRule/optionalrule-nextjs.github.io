import React from 'react';
import YouTubeEmbed from './YouTubeEmbed';

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'youtu.be']);
const VIMEO_HOSTS = new Set(['vimeo.com', 'player.vimeo.com']);

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
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
  } catch {
    return (
      <div className={`bg-[var(--surface-hover)] p-4 rounded-lg text-center ${className || ''}`}>
        <p className="text-[var(--muted-2)] mb-2">
          Unsupported media URL
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--link)] hover:underline"
        >
          Open in new tab
        </a>
      </div>
    );
  }

  const host = parsed.hostname;

  if (YOUTUBE_HOSTS.has(host)) {
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

  if (VIMEO_HOSTS.has(host)) {
    const match = url.match(/(?:vimeo\.com\/|video\/)(\d+)/);
    const vimeoId = match?.[1];
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

  return (
    <div className={`bg-[var(--surface-hover)] p-4 rounded-lg text-center ${className || ''}`}>
      <p className="text-[var(--muted-2)] mb-2">
        Unsupported media URL
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--link)] hover:underline"
      >
        Open in new tab
      </a>
    </div>
  );
}
