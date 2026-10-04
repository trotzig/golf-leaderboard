import React from 'react';

import Icon from './Icon';

// A sponsor placement. `variant` picks the layout: "banner" is the card on
// the start page, "inline" is the "presented by" strip on a leaderboard.
// Both tie the sponsor's offer to the venue the tour is playing.
export default function Sponsor({ sponsor, venue, variant = 'banner' }) {
  const style = {
    '--sponsor-color': sponsor.color,
    '--sponsor-on-color': sponsor.onColor,
  };
  const logo = (
    <span
      className="sponsor-logo"
      style={{ background: sponsor.logoBackground }}
    >
      <img alt={sponsor.name} src={sponsor.logoSrc} />
    </span>
  );

  if (variant === 'inline') {
    return (
      <a
        href={sponsor.href}
        className="sponsor sponsor--inline"
        style={style}
        target="_blank"
        rel="sponsored noopener"
      >
        <span className="sponsor-inline-text">
          <span className="sponsor-label">Leaderboard presented by</span>
          <span className="sponsor-inline-pitch">
            {sponsor.shortPitch(venue)} <Icon name="arrow-right" />
          </span>
        </span>
        {logo}
      </a>
    );
  }

  return (
    <a
      href={sponsor.href}
      className="sponsor sponsor--banner"
      style={style}
      target="_blank"
      rel="sponsored noopener"
    >
      <GreenContours />
      <span className="sponsor-banner-top">
        <span className="sponsor-label">Presented by</span>
        {logo}
      </span>
      <span className="sponsor-headline">{sponsor.headline}</span>
      <span className="sponsor-pitch">{sponsor.pitch(venue)}</span>
      <span className="sponsor-cta">
        {sponsor.cta} <Icon name="arrow-right" />
      </span>
    </a>
  );
}

// A putting green drawn as contour lines with a flag, in the sponsor's color.
function GreenContours() {
  return (
    <svg
      className="sponsor-contours"
      viewBox="0 0 200 160"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M22 112c-6-30 22-58 62-62s86 10 94 40-20 56-66 60-84-8-90-38z" />
      <path d="M46 110c-4-20 16-38 44-41s60 7 65 27-14 38-46 41-59-6-63-27z" />
      <path d="M70 108c-2-11 9-21 25-22s34 4 36 15-8 21-26 22-33-4-35-15z" />
      <path d="M100 104V34" strokeWidth="2.5" />
      <path d="M100 36l30 10-30 12z" fill="currentColor" stroke="none" />
      <ellipse cx="100" cy="105" rx="5" ry="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
