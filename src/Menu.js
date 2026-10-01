import React from 'react';
import Link from 'next/link';

import Icon from './Icon';

export default function Menu({ activeHref }) {
  return (
    <>
      <Link
        href="/"
        className="site-wordmark"
        aria-hidden="true"
        tabIndex={-1}
      >
        <svg viewBox="0 0 512 512" aria-hidden="true">
          <rect width="512" height="512" fill="#e54e37" />
          <circle
            cx="256"
            cy="256"
            r="185"
            fill="none"
            stroke="white"
            strokeWidth="28"
          />
          <circle cx="381" cy="223" r="25" fill="white" />
          <circle cx="377" cy="300" r="25" fill="white" />
          <circle cx="330" cy="362" r="25" fill="white" />
          <rect x="0" y="468" width="512" height="44" fill="white" />
        </svg>
        Nordic Golf Tour
      </Link>
      <nav aria-label="Main">
        <Link
          href="/"
          className="menu-item-can-be-made-active"
          aria-label="Home"
          aria-current={activeHref === '/' ? 'page' : undefined}
        >
          <span className="menu-link-inner">
            <span className="menu-link-icon">
              <Icon name="home" />
            </span>
            <span className="menu-item-short">Home</span>
          </span>
        </Link>

        <Link
          href="/leaderboard"
          className="menu-item-can-be-made-active"
          aria-current={activeHref === '/leaderboard' ? 'page' : undefined}
        >
          <span className="menu-link-inner">
            <span className="menu-link-icon">
              <Icon name="leaderboard" />
            </span>
            <span className="menu-link-label">Leaderboard</span>
          </span>
        </Link>

        <Link
          href="/players"
          className="menu-item-can-be-made-active"
          aria-current={activeHref === '/players' ? 'page' : undefined}
        >
          <span className="menu-link-inner">
            <span className="menu-link-icon">
              <Icon name="players" />
            </span>
            <span className="menu-link-label">Players</span>
          </span>
        </Link>

        <Link
          href="/schedule"
          className="menu-item-can-be-made-active menu-hide-mobile"
          aria-current={activeHref === '/schedule' ? 'page' : undefined}
        >
          <span className="menu-link-inner">
            <span className="menu-link-icon">
              <Icon name="calendar" />
            </span>
            <span className="menu-link-label">Schedule</span>
          </span>
        </Link>

        <Link
          href="/oom"
          className="menu-item-can-be-made-active"
          aria-current={activeHref === '/oom' ? 'page' : undefined}
        >
          <span className="menu-link-inner">
            <span className="menu-link-icon">
              <Icon name="trophy" />
            </span>
            <span className="menu-link-label">Rankings</span>
          </span>
        </Link>

        <Link
          href="/profile"
          className="menu-item-can-be-made-active"
          aria-label="Profile"
          aria-current={activeHref === '/profile' ? 'page' : undefined}
        >
          <span className="menu-link-inner">
            <span className="menu-link-icon">
              <Icon name="user" />
            </span>
            <span className="menu-item-short">Profile</span>
          </span>
        </Link>
      </nav>
    </>
  );
}
