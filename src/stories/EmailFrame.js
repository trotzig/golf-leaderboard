import React, { useEffect, useRef, useState } from 'react';

import { renderEmail } from '../emails/renderEmail.mjs';

// Production emails load the icon from the live site; stories use the copy
// that's bundled with Storybook.
const ICON_URL = /https?:\/\/[^"]+\/app-icon-192\.png/g;

// Renders an email the way a mail client would: as its own HTML document.
export default function EmailFrame({ element }) {
  const ref = useRef(null);
  const [html, setHtml] = useState(null);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    renderEmail(element).then(rendered => {
      setHtml(rendered.html.replace(ICON_URL, 'app-icon-192.png'));
    });
  }, [element]);

  if (!html) {
    return null;
  }

  return (
    <iframe
      ref={ref}
      srcDoc={html}
      onLoad={() =>
        setHeight(ref.current.contentDocument.documentElement.scrollHeight)
      }
      title="email"
      style={{ width: '100%', height, border: 0, display: 'block' }}
    />
  );
}
