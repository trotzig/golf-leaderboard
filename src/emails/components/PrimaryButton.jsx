import React from 'react';
import { Button, Section } from 'react-email';

import * as styles from '../styles.mjs';

export default function PrimaryButton({ href, children }) {
  return (
    <Section style={styles.ctaSection}>
      <Button href={href} style={styles.button} className="cta-button">
        {children}
      </Button>
    </Section>
  );
}
