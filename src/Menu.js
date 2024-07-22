import React from 'react';
import Link from 'next/link';

export default function Menu({ activeHref }) {
  return (
    <nav>
      {activeHref && (
        <style>{`
          nav a[href="${activeHref}"] {
            color: #fff;
            background-color: var(--primary);
          }
      `}</style>
      )}
      <Link href="/">
        <a style={{ lineHeight: 0 }}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </a>
      </Link>
      <Link href="/leaderboard">
        <a className="menu-item-can-be-made-active">Leaderboard</a>
      </Link>
    </nav>
  );
}
