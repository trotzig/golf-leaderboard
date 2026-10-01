import React from 'react';

// The site's icon set. Everything is drawn on a 24px grid as rounded line
// art. Shapes marked `icon-tone` also get a soft tint of the current color,
// which is turned up for active/selected states (see `--icon-tone` in
// styles.css).
const ICONS = {
  home: (
    <>
      <path
        className="icon-tone"
        d="M4 10.2 12 3.5l8 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"
      />
      <path d="M9.5 20.5V15a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5.5" />
    </>
  ),
  leaderboard: (
    <>
      <rect className="icon-tone" x="3" y="13" width="4.5" height="7.5" rx="1" />
      <rect className="icon-tone" x="9.75" y="3.5" width="4.5" height="17" rx="1" />
      <rect className="icon-tone" x="16.5" y="8.5" width="4.5" height="12" rx="1" />
    </>
  ),
  players: (
    <>
      <circle className="icon-tone" cx="9" cy="8" r="3.5" />
      <path className="icon-tone" d="M2.5 20a6.5 6.5 0 0 1 13 0z" />
      <path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4" />
      <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </>
  ),
  calendar: (
    <>
      <rect
        className="icon-tone"
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="2.5"
      />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
    </>
  ),
  trophy: (
    <>
      <path className="icon-tone" d="M7 4h10v6a5 5 0 0 1-10 0z" />
      <path d="M7 6H4.5a1 1 0 0 0-1 1v.5A3.5 3.5 0 0 0 7 11" />
      <path d="M17 6h2.5a1 1 0 0 1 1 1v.5A3.5 3.5 0 0 1 17 11" />
      <path d="M12 15v5.5M8 20.5h8" />
    </>
  ),
  user: (
    <>
      <circle className="icon-tone" cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.2 18.9a6.5 6.5 0 0 1 11.6 0" />
    </>
  ),
  star: (
    <path
      className="icon-tone"
      d="M12 3.2l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17.1 6.6 20l1.1-6.1-4.5-4.3 6.1-.8z"
    />
  ),
  pin: (
    <>
      <path
        className="icon-tone"
        d="M12 21.5s-7-6.2-7-11.5a7 7 0 0 1 14 0c0 5.3-7 11.5-7 11.5z"
      />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 4v14a2 2 0 0 0 2 2h14" />
      <path d="M8 15l4-5 3 3 5-6" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V3.5M7.5 7.5 12 3l4.5 4.5" />
      <path d="M5 12v6.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V12" />
    </>
  ),
  'sign-out': (
    <>
      <path d="M10 4H6.5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2H10" />
      <path d="M15 8l4 4-4 4M19 12H9" />
    </>
  ),
  more: <path d="M12 5h.01M12 12h.01M12 19h.01" strokeWidth="3" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
};

export default function Icon({ name, className, ...rest }) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {ICONS[name]}
    </svg>
  );
}
