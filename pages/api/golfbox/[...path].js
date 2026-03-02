function parseGolfboxJson(raw) {
  return JSON.parse(raw.replace(/:!0/g, ':false').replace(/:!1/g, ':true'));
}

export default async function handler(req, res) {
  const path = req.query.path.join('/');
  const url = `https://scores.golfbox.dk/Handlers/${path}/`;
  const response = await fetch(url);
  if (!response.ok) {
    return res.status(response.status).end();
  }
  const data = parseGolfboxJson(await response.text());
  res.status(200).json(data);
}
