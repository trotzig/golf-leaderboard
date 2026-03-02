function parseGolfboxJson(raw) {
  return JSON.parse(raw.replace(/:!0/g, ':false').replace(/:!1/g, ':true'));
}

export default async function fetchGolfboxUrl(path) {
  const url = `https://scores.golfbox.dk/Handlers/${path}/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GolfBox ${path} responded with ${response.status}`);
  }
  return parseGolfboxJson(await response.text());
}
