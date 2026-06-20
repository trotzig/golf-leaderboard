import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';
import appleSplashScreens from '../src/appleSplashScreens.mjs';

const standaloneScript = `
(function() {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  if (window.matchMedia('(display-mode: standalone)').matches) {
    document.documentElement.classList.add('display-standalone');
  }
})();
`;

export default function Document() {
  return (
    <Html>
      <Head>
        {appleSplashScreens.map(({ href, media }) => (
          <link
            key={href}
            rel="apple-touch-startup-image"
            href={href}
            media={media}
          />
        ))}
      </Head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: standaloneScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
