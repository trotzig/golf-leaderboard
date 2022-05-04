export default async function syncFavorites() {
  const playersRes = await fetch('/api/players');
  if (!playersRes.ok) {
    throw new Error(`${playersRes.status} -- ${await playersRes.text()}`);
  }
  const players = await playersRes.json();
  const favorites = players
    .filter(p => localStorage.getItem(p.id))
    .map(p => p.id);

  const res = await fetch('/api/favorites/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ favorites }),
  });
  if (!res.ok) {
    if (res.status === 401) {
      return;
    }
    throw new Error(`${res.status} -- ${await res.text()}`);
  }

  const json = await res.json();
  for (const fav of json.favorites) {
    localStorage.setItem(fav, '1');
  }
}
