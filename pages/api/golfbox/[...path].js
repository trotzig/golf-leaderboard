import fetchGolfboxUrl from '../../../src/fetchGolfboxUrl';

export default async function handler(req, res) {
  const path = req.query.path.join('/');
  try {
    const data = await fetchGolfboxUrl(path);
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
