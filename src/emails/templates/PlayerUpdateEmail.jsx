import React from 'react';
import { Column, Heading, Link, Row, Section, Text } from 'react-email';

import EmailLayout from '../components/EmailLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import * as styles from '../styles.mjs';

function Stat({ label, value, width }) {
  const underPar = `${value}`.startsWith('-');
  return (
    <Column style={{ width }}>
      <Text className="muted-text" style={styles.statLabel}>
        {label}
      </Text>
      <Text
        className={underPar ? 'under-par' : undefined}
        style={underPar ? styles.statValueUnderPar : styles.statValue}
      >
        {value}
      </Text>
    </Column>
  );
}

// Sent to subscribers when one of their favorite players starts a round,
// finishes a round or makes an eagle or better.
export default function PlayerUpdateEmail({
  heading,
  body,
  competitionName,
  roundNumber,
  stats,
  firstName,
  lastName,
  leaderboardUrl,
  playerUrl,
  unsubscribeUrl,
}) {
  return (
    <EmailLayout
      preview={body}
      unsubscribeUrl={unsubscribeUrl}
      reasonText={`${firstName} ${lastName} is one of your favorite players`}
    >
      <Text className="muted-text" style={styles.eyebrow}>
        {competitionName} · Round {roundNumber}
      </Text>
      <Heading as="h1" style={styles.heading}>
        {heading}
      </Heading>
      <Text style={styles.text}>{body}</Text>

      {/* The stats repeat what the body says, so the plain text part skips them. */}
      <Section
        className="callout"
        style={styles.callout}
        data-skip-in-text="true"
      >
        <Row>
          {stats.map(stat => (
            <Stat
              key={stat.label}
              width={`${100 / stats.length}%`}
              {...stat}
            />
          ))}
        </Row>
      </Section>

      <PrimaryButton href={leaderboardUrl}>View full leaderboard</PrimaryButton>

      <Text style={{ ...styles.text, marginBottom: 0 }}>
        <Link href={playerUrl} style={styles.link}>
          More about {firstName} {lastName}
        </Link>
      </Text>
    </EmailLayout>
  );
}
