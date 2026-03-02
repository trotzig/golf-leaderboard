import React, { useEffect, useRef, useState } from 'react';

function defer(callback) {
  if (window.requestIdleCallback) {
    const id = window.requestIdleCallback(callback);
    return () => window.cancelIdleCallback(id);
  }
  const id = window.requestAnimationFrame(callback);
  return () => window.cancelAnimationFrame(id);
}

export default function Lazy({ children, minHeight, minWidth, className }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(
    typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelDefer;
    const observer = new IntersectionObserver(
      entries => {
        if (cancelDefer) cancelDefer();
        cancelDefer = defer(() => setVisible(entries[0].isIntersecting));
      },
      { rootMargin: '50% 0px 50% 0px' },
    );
    observer.observe(el);
    return () => {
      if (cancelDefer) cancelDefer();
      observer.unobserve(el);
    };
  }, []);

  return (
    <div ref={ref} className={className} style={{ minHeight, minWidth }}>
      {visible && children}
    </div>
  );
}
