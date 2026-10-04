import { render } from 'react-email';

// Renders an email template element to the HTML and plain text parts of a
// message.
export async function renderEmail(element) {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  return { html, text };
}
