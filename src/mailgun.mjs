import formData from 'form-data';
import Mailgun from 'mailgun.js';

const { MAILGUN_API_KEY, MAILGUN_DOMAIN, NEXT_PUBLIC_TITLE } = process.env;

const mailgun = new Mailgun(formData);
const client = mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
  url: 'https://api.eu.mailgun.net',
});

const from = `${NEXT_PUBLIC_TITLE} <info@${MAILGUN_DOMAIN}>`;

export async function sendMail({ to, subject, text }) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Sending email', { subject, to, text });
  }
  const messageData = {
    from,
    to,
    subject,
    text,
  };

  const res = await client.messages.create(MAILGUN_DOMAIN, messageData);
  console.log(res);
}
