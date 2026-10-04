import React from 'react';
import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from 'react-email';

import { baseUrl, siteTitle } from '../config.mjs';
import * as styles from '../styles.mjs';
import { emailHeadStyles } from './emailHeadStyles.mjs';

// The wordmark from the site header (`src/Menu.js`): app icon + site title.
// Left out of the plain text part, where the footer already names the site.
function Wordmark() {
  return (
    <Row style={styles.wordmark} data-skip-in-text="true">
      <Column style={styles.wordmarkIconCell}>
        <Link href={baseUrl}>
          <Img
            src={`${baseUrl}/app-icon-192.png`}
            alt=""
            width={26}
            height={26}
            style={styles.wordmarkIcon}
          />
        </Link>
      </Column>
      <Column>
        <Link
          href={baseUrl}
          className="wordmark-text"
          style={styles.wordmarkText}
        >
          {siteTitle}
        </Link>
      </Column>
    </Row>
  );
}

export default function EmailLayout({
  preview,
  unsubscribeUrl,
  reasonText,
  children,
}) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{emailHeadStyles}</style>
      </Head>
      {preview ? <Preview>{preview}</Preview> : null}
      <Body
        className="body"
        style={{
          // This needs to match the font size of the main text so that emails
          // will get the correct width when rendered in Gmail.
          fontSize: '16px',
          margin: 0,
        }}
      >
        <Container
          className="container main-container"
          style={styles.mainContainer}
        >
          <Section>
            <Wordmark />
          </Section>

          <Section>{children}</Section>
        </Container>

        <Container
          className="container footer-container"
          style={styles.footerContainer}
        >
          <Section>
            <Text className="muted-text" style={styles.mutedText}>
              <Link href={baseUrl} style={styles.link}>
                {siteTitle}
              </Link>{' '}
              – the unofficial home of the Cutter &amp; Buck Tour.
            </Text>

            {unsubscribeUrl ? (
              <Text className="muted-text" style={styles.mutedText}>
                {reasonText
                  ? `This email was sent to you because ${reasonText}. `
                  : null}
                Don&apos;t want these emails?{' '}
                <Link href={unsubscribeUrl} style={styles.link}>
                  Unsubscribe here
                </Link>
                .
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
