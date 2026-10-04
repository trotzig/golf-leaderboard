import fs from 'fs';
import { ImageResponse } from 'next/og';
import path from 'path';
import React from 'react';
import { Readable } from 'stream';

import CourseContours from './CourseContours.js';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// The light theme from styles.css. Satori can't read CSS variables.
const BACKGROUND = '#ffffff';
const TEXT = '#3f4341';
const PRIMARY = '#c63823';
const ACCENT = '#0f7a4a';

const PHOTO_SIZE = 340;

// Jost is the webfont the site falls back to when Futura is missing.
function loadFonts() {
  const fonts = [];
  for (const weight of [400, 700]) {
    for (const subset of ['latin', 'latin-ext']) {
      fonts.push({
        name: 'Jost',
        weight,
        style: 'normal',
        data: fs.readFileSync(
          path.join(
            process.cwd(),
            'src',
            'fonts',
            `jost-${subset}-${weight}-normal.woff`,
          ),
        ),
      });
    }
  }
  return fonts;
}

let fonts;

// The 1200x630 card that links to the site unfurl with. Rendered by satori, so
// only flexbox and inline styles are available.
export function OgCard({ label, title, details = [], winner, photoUrl }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 80px',
        backgroundColor: BACKGROUND,
        color: TEXT,
        fontFamily: 'Jost',
      }}
    >
      <CourseContours
        width={900}
        height={700}
        strokeWidth={1.2}
        style={{
          position: 'absolute',
          top: -90,
          right: -190,
          color: ACCENT,
          opacity: 0.18,
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {label && (
          <div
            style={{
              marginBottom: 20,
              color: ACCENT,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </div>
        )}
        <div
          style={{
            marginBottom: 12,
            fontSize: title.length > 40 ? 64 : 80,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        {details.map(detail => (
          <div
            key={detail}
            style={{ marginTop: 12, fontSize: 36, opacity: 0.85 }}
          >
            {detail}
          </div>
        ))}
        {winner && (
          <div
            style={{
              marginTop: 36,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                padding: '5px 18px',
                borderRadius: 999,
                backgroundColor: PRIMARY,
                color: '#fff',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Winner
            </div>
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                fontSize: 40,
                fontWeight: 700,
              }}
            >
              <div>{winner.name}</div>
              <div style={{ marginLeft: 16, flexShrink: 0, color: PRIMARY }}>
                {winner.scoreText}
              </div>
            </div>
          </div>
        )}
      </div>
      {photoUrl && (
        <img
          src={photoUrl}
          width={PHOTO_SIZE}
          height={PHOTO_SIZE}
          style={{ marginLeft: 60, borderRadius: 24, objectFit: 'cover' }}
        />
      )}
    </div>
  );
}

export async function sendOgImage(res, card) {
  fonts = fonts || loadFonts();
  const image = new ImageResponse(<OgCard {...card} />, {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    fonts,
  });
  res.setHeader('Content-Type', 'image/png');
  res.setHeader(
    'Cache-Control',
    'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
  );
  Readable.fromWeb(image.body).pipe(res);
}
