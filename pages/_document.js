import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

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
      <Head />
      <body>
        <script dangerouslySetInnerHTML={{ __html: standaloneScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
