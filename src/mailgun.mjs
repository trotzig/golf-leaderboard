import Mailgun from 'mailgun.js';

import { renderEmail } from './emails/renderEmail.mjs';

const { MAILGUN_API_KEY, MAILGUN_DOMAIN, NEXT_PUBLIC_TITLE } = process.env;

const mailgun = new Mailgun(FormData);
const client = mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
  url: 'https://api.eu.mailgun.net',
});

const from = `${NEXT_PUBLIC_TITLE} <info@${MAILGUN_DOMAIN}>`;

// Sends an email. Pass a react-email `element` (see
// `src/emails/emailTemplates.mjs`) to send it as HTML with a plain text
// fallback, or `text` for a plain text email.
export async function sendMail({ to, subject, element, text, headers = {} }) {
  let html;
  if (element) {
    ({ html, text } = await renderEmail(element));
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('Sending email', { subject, to, text, headers });
  }
  const messageData = {
    from,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
    // Mailgun sends any `h:`-prefixed field as a custom message header.
    ...Object.fromEntries(
      Object.entries(headers).map(([name, value]) => [`h:${name}`, value]),
    ),
  };

  const res = await client.messages.create(MAILGUN_DOMAIN, messageData);
  console.log(res);
}
