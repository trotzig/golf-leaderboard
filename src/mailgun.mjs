import formData from 'form-data';
import Mailgun from 'mailgun.js';

const { MAILGUN_API_KEY, MAILGUN_DOMAIN } = process.env;

const mailgun = new Mailgun(formData);
const client = mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
  url: 'https://api.eu.mailgun.net',
});

export async function sendMail({ to, subject, text }) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Sending email', { subject, to, text });
  }
  const messageData = {
    from: 'Nordic Golf Tour <info@nordicgolftour.app>',
    to,
    subject,
    text,
  };

  const res = await client.messages.create(MAILGUN_DOMAIN, messageData);
  console.log(res);
}
