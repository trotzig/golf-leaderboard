import syncData from '../../../src/syncData.mjs';

export default async function handler(req, res) {
  await syncData({ full: false });

  res.status(200).send('Cron job executed successfully');
}
