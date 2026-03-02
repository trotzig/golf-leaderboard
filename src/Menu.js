import React from 'react';
import Link from 'next/link';

export default function Menu({ activeHref }) {
  return (
    <nav>
      {activeHref && (
        <style>{`
          nav a.menu-item-can-be-made-active[href="${activeHref}"] {
            border-color: var(--primary);
          }
            html.display-standalone nav a.menu-item-can-be-made-active[href="${activeHref}"] {
              background-color: rgba(var(--text-rgb), 0.1);
              color: var(--primary);
            }
      `}</style>
      )}

      <Link href="/" className="menu-item-can-be-made-active">
        <span className="menu-link-inner">
          <span className="menu-link-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V11L1 11L11.3273 1.6115C11.7087 1.26475 12.2913 1.26475 12.6727 1.6115L23 11L20 11V20Z" />
            </svg>
          </span>
          <span className="menu-item-short">Home</span>
        </span>
      </Link>

      <Link href="/leaderboard" className="menu-item-can-be-made-active">
        <span className="menu-link-inner">
          <span className="menu-link-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2H20C20.5523 2 21 2.44772 21 3V21C21 21.5523 20.5523 22 20 22ZM8 7V9H16V7H8ZM8 11V13H16V11H8ZM8 15V17H16V15H8Z" />
            </svg>
          </span>
          <span className="menu-link-label">Leaderboard</span>
        </span>
      </Link>

      <Link href="/players" className="menu-item-can-be-made-active">
        <span className="menu-link-inner">
          <span className="menu-link-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 22C2 17.5817 5.58172 14 10 14C14.4183 14 18 17.5817 18 22H2ZM10 13C6.685 13 4 10.315 4 7C4 3.685 6.685 1 10 1C13.315 1 16 3.685 16 7C16 10.315 13.315 13 10 13ZM17.3628 15.2332C20.4482 16.0217 22.7679 18.7235 22.9836 22H20C20 19.3902 19.0002 17.0139 17.3628 15.2332ZM15.3401 12.9569C16.9728 11.4922 18 9.36607 18 7C18 5.58266 17.6314 4.25141 16.9849 3.09687C19.2753 3.55397 21 5.57465 21 8C21 10.7625 18.7625 13 16 13C15.7763 13 15.556 12.9853 15.3401 12.9569Z" />
            </svg>
          </span>
          <span className="menu-link-label">Players</span>
        </span>
      </Link>

      <Link
        href="/schedule"
        className="menu-item-can-be-made-active menu-hide-mobile"
      >
        <span className="menu-link-inner">
          <span className="menu-link-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 11H22V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V11ZM17 3H21C21.5523 3 22 3.44772 22 4V9H2V4C2 3.44772 2.44772 3 3 3H7V1H9V3H15V1H17V3Z" />
            </svg>
          </span>
          <span className="menu-link-label">Schedule</span>
        </span>
      </Link>

      <Link href="/oom" className="menu-item-can-be-made-active">
        <span className="menu-link-inner">
          <span className="menu-link-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.0049 16.9409V19.0027H18.0049V21.0027H6.00488V19.0027H11.0049V16.9409C7.05857 16.4488 4.00488 13.0824 4.00488 9.00275V3.00275H20.0049V9.00275C20.0049 13.0824 16.9512 16.4488 13.0049 16.9409ZM1.00488 5.00275H3.00488V9.00275H1.00488V5.00275ZM21.0049 5.00275H23.0049V9.00275H21.0049V5.00275Z" />
            </svg>
          </span>
          <span className="menu-link-label">Rankings</span>
        </span>
      </Link>

      <Link href="/profile" className="menu-item-can-be-made-active">
        <span className="menu-link-inner">
          <span className="menu-link-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.13127 13.6308C1.9492 12.5349 1.95521 11.434 2.13216 10.3695C3.23337 10.3963 4.22374 9.86798 4.60865 8.93871C4.99357 8.00944 4.66685 6.93557 3.86926 6.17581C4.49685 5.29798 5.27105 4.51528 6.17471 3.86911C6.9345 4.66716 8.0087 4.99416 8.93822 4.60914C9.86774 4.22412 10.3961 3.23332 10.369 2.13176C11.4649 1.94969 12.5658 1.9557 13.6303 2.13265C13.6036 3.23385 14.1319 4.22422 15.0612 4.60914C15.9904 4.99406 17.0643 4.66733 17.8241 3.86975C18.7019 4.49734 19.4846 5.27153 20.1308 6.1752C19.3327 6.93499 19.0057 8.00919 19.3907 8.93871C19.7757 9.86823 20.7665 10.3966 21.8681 10.3695C22.0502 11.4654 22.0442 12.5663 21.8672 13.6308C20.766 13.6041 19.7756 14.1324 19.3907 15.0616C19.0058 15.9909 19.3325 17.0648 20.1301 17.8245C19.5025 18.7024 18.7283 19.4851 17.8247 20.1312C17.0649 19.3332 15.9907 19.0062 15.0612 19.3912C14.1316 19.7762 13.6033 20.767 13.6303 21.8686C12.5344 22.0507 11.4335 22.0447 10.3691 21.8677C10.3958 20.7665 9.86749 19.7761 8.93822 19.3912C8.00895 19.0063 6.93508 19.333 6.17532 20.1306C5.29749 19.503 4.51479 18.7288 3.86862 17.8252C4.66667 17.0654 4.99367 15.9912 4.60865 15.0616C4.22363 14.1321 3.23284 13.6038 2.13127 13.6308ZM11.9997 15.0002C13.6565 15.0002 14.9997 13.657 14.9997 12.0002C14.9997 10.3433 13.6565 9.00018 11.9997 9.00018C10.3428 9.00018 8.99969 10.3433 8.99969 12.0002C8.99969 13.657 10.3428 15.0002 11.9997 15.0002Z" />
            </svg>
          </span>
          <span className="menu-item-short">Profile</span>
        </span>
      </Link>
    </nav>
  );
}
