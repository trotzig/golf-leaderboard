import notifySubscribers from '../../../src/notifySubscribers.mjs';

export default async function handler(req, res) {
  await notifySubscribers();

  res.status(200).send('Cron job executed successfully');
}
