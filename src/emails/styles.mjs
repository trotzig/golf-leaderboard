// Inline styles for emails. The values mirror the design tokens in
// `styles.css` (email clients don't support CSS variables), so emails look
// like the website. Dark mode overrides live in `emailHeadStyles.mjs`.
export const colors = {
  // Green carries structure: links and buttons (--accent).
  accent: '#0f7a4a',
  onAccent: '#ffffff',
  // Red is reserved for scores under par (--primary).
  primary: '#c63823',

  background: '#ffffff',
  surface: '#eff6f2',
  text: '#3f4341',
  muted: '#6b716e',
  border: '#e2e6e4',
};

// Futura ships with Apple devices only; everyone else gets the fallbacks
// (webfonts like Jost aren't reliably supported by email clients).
const fontFamily =
  "Futura, Jost, 'Gill Sans', 'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif";
const headingFontFamily = "Georgia, 'Times New Roman', serif";

const container = {
  backgroundColor: colors.surface,
  fontFamily,
  color: colors.text,
  padding: '0 48px 24px',
  textAlign: 'left',
};

export const mainContainer = {
  ...container,
  backgroundColor: colors.background,
  borderRadius: '14px',
  padding: '40px 48px 44px',
  margin: '32px auto 0',
};

export const footerContainer = {
  ...container,
  padding: '28px 48px 32px',
};

export const wordmark = {
  marginBottom: '32px',
};

export const wordmarkIconCell = {
  width: '36px',
};

export const wordmarkIcon = {
  borderRadius: '7px',
  display: 'block',
};

export const wordmarkText = {
  color: colors.text,
  fontSize: '16px',
  fontWeight: 600,
  letterSpacing: '0.01em',
  textDecoration: 'none',
};

export const eyebrow = {
  fontSize: '12px',
  fontWeight: 600,
  lineHeight: '18px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: colors.muted,
  margin: '0 0 6px',
};

export const heading = {
  fontFamily: headingFontFamily,
  fontSize: '28px',
  fontWeight: 700,
  lineHeight: '1.15',
  letterSpacing: '-0.3px',
  margin: '0 0 16px',
  textWrap: 'balance',
};

export const text = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

export const mutedText = {
  ...text,
  fontSize: '13px',
  lineHeight: '20px',
  color: colors.muted,
};

export const link = {
  color: colors.accent,
  textDecoration: 'underline',
};

export const ctaSection = {
  margin: '28px 0 12px',
};

export const button = {
  backgroundColor: colors.accent,
  borderRadius: '999px',
  color: colors.onAccent,
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '1',
  padding: '14px 24px',
  textDecoration: 'none',
  textAlign: 'center',
};

/** A shaded box that sets key facts apart from the text around it. */
export const callout = {
  backgroundColor: colors.surface,
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '8px 0 16px',
};

/** The "presented by" box at the end of a notification email. */
export const sponsorBox = {
  backgroundColor: colors.surface,
  borderRadius: '0 10px 10px 0',
  padding: '16px 20px',
  margin: '28px 0 0',
};

export const sponsorLogo = {
  display: 'block',
  // Keeps very wide wordmarks from dominating the box.
  maxWidth: '120px',
  objectFit: 'contain',
  borderRadius: '6px',
  padding: '5px 9px',
  margin: '4px 0 12px',
};

export const sponsorHeadline = {
  fontFamily: headingFontFamily,
  fontSize: '20px',
  fontWeight: 700,
  lineHeight: '1.2',
  margin: '0 0 4px',
};

export const sponsorPitch = {
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 8px',
};

export const sponsorLink = {
  ...link,
  fontWeight: 'bold',
};

export const statLabel = {
  ...eyebrow,
  fontSize: '11px',
  margin: '0 0 2px',
};

export const statValue = {
  fontSize: '22px',
  fontWeight: 600,
  lineHeight: '28px',
  margin: 0,
};

export const statValueUnderPar = {
  ...statValue,
  color: colors.primary,
};

export const code = {
  fontFamily: "'SF Mono', Menlo, Consolas, monospace",
  fontSize: '36px',
  fontWeight: 700,
  lineHeight: '44px',
  letterSpacing: '0.3em',
  // Balance the trailing letter-spacing so the code looks centered.
  paddingLeft: '0.3em',
  textAlign: 'center',
  margin: 0,
};
