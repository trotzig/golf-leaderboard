export default function handler(req, res) {
  const { id } = req.query;
  if (req.method === 'POST') {
    const { email } = req.body;
    console.log('subscribing to', id);
  } else if (req.method === 'DELETE') {
    console.log('unsubscribing from', id);
  }
  res.status(204).send();
}
