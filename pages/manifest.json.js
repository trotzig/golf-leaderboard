import React from 'react';

// dummy, it's all handled in getServerSideProps
const Manifest = () => {};

export async function getServerSideProps({ res }) {
  const manifest = {
    name: process.env.NEXT_PUBLIC_TITLE,
    short_name: 'Golf Tour',
    scope: '/',
    display: 'standalone',
    background_color: '#e54e37',
    theme_color: '#e54e37',
    icons: [
      {
        src: '/app-icon.svg',
        type: 'image/svg+xml',
        sizes: '512x512',
      },
      {
        src: '/app-icon-192.png',
        type: 'image/png',
        sizes: '192x192',
      },
      {
        src: '/app-icon-512.png',
        type: 'image/png',
        sizes: '512x512',
      },
    ],
  };
  res.setHeader('Content-Type', 'application/json');
  res.write(JSON.stringify(manifest));
  res.end();

  return {
    props: {},
  };
}

export default Manifest;
