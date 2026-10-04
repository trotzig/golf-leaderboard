import { sendOgImage } from '../../../src/ogImage.js';

// The default share image for pages that don't have a more specific one.
export default async function handler(req, res) {
  await sendOgImage(res, {
    label: process.env.NEXT_PUBLIC_TITLE,
    title: process.env.NEXT_PUBLIC_INTRO_TITLE,
    details: ['Leaderboards, tee times, results and order of merit'],
  });
}
