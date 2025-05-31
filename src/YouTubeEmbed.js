import React from 'react';

function extractYouTubeId(url) {
  // Match YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/, // Standard YouTube URLs
    /youtube\.com\/embed\/([^&\n?#]+)/, // Embed URLs
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export default function YouTubeEmbed({ url }) {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return null;
  }

  return (
    <div className="youtube-embed">
      <iframe
        width="100%"
        height="315"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
