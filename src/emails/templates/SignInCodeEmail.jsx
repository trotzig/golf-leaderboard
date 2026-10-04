import React from 'react';
import { Heading, Section, Text } from 'react-email';

import EmailLayout from '../components/EmailLayout.jsx';
import { siteTitle } from '../config.mjs';
import * as styles from '../styles.mjs';

export default function SignInCodeEmail({ code, validHours }) {
  return (
    <EmailLayout preview={`Your sign-in code is ${code}`}>
      <Heading as="h1" style={styles.heading}>
        Your sign-in code
      </Heading>
      <Text style={styles.text}>
        Enter this code to finish signing in to {siteTitle}:
      </Text>

      <Section className="callout" style={styles.callout}>
        <Text style={styles.code}>{code}</Text>
      </Section>

      <Text style={styles.text}>The code is valid for {validHours} hours.</Text>
      <Text
        className="muted-text"
        style={{ ...styles.mutedText, marginBottom: 0 }}
      >
        If you didn&apos;t try to sign in, it&apos;s safe to ignore this
        message.
      </Text>
    </EmailLayout>
  );
}
