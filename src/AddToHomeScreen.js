import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const DISMISSED_KEY = 'add-to-home-screen-dismissed-v2';

export default function AddToHomeScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    const isDismissed = localStorage.getItem(DISMISSED_KEY);
    const isTouchDevice = navigator.maxTouchPoints > 0;

    if (!isStandalone && !isDismissed && isTouchDevice) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="add-to-home-screen-banner">
      <Link href="/add-to-home-screen">Add to your home screen</Link> for quick
      access to live scores.
      <button
        className="add-to-home-screen-dismiss"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
