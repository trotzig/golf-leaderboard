import React from 'react';
import { Img, Link, Section, Text } from 'react-email';

import * as styles from '../styles.mjs';

// The sponsor of the notification emails: a "presented by" box at the end of
// the message. The sponsor's color is only used for the bar on the left, so
// the box reads the same in dark mode.
export default function SponsorBlock({ sponsor }) {
  return (
    <Section
      className="sponsor-box"
      style={{
        ...styles.sponsorBox,
        borderLeft: `4px solid ${sponsor.color}`,
      }}
    >
      <Text className="muted-text" style={styles.eyebrow}>
        Presented by {sponsor.name}
      </Text>
      {/* The line above already names the sponsor in the plain text part. */}
      <Img
        src={sponsor.logoSrc}
        alt=""
        height={24}
        style={{
          ...styles.sponsorLogo,
          backgroundColor: sponsor.logoBackground || '#ffffff',
        }}
      />
      <Text style={styles.sponsorHeadline}>{sponsor.headline}</Text>
      <Text style={styles.sponsorPitch}>{sponsor.pitch}</Text>
      <Text style={{ ...styles.sponsorPitch, margin: 0 }}>
        <Link href={sponsor.href} style={styles.sponsorLink}>
          {sponsor.cta} →
        </Link>
      </Text>
    </Section>
  );
}
