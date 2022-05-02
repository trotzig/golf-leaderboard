import syncData from '../../../src/syncData.mjs';

const { CRON_AUTH_KEY, BASE_URL } = process.env;

export default async function handler(req, res) {
  if (!/localhost/.test(BASE_URL)) {
    if (req.method !== 'POST') {
      return res.status(400).send('This endpoint accepts POST requests');
    }
    const { authToken } = req.body;
    if (authToken !== CRON_AUTH_KEY) {
      return res.status(401).send('Invalid credentials');
    }
  }
  await syncData();

  res.status(200).send('Cron job executed successfully');
}
