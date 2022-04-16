import { getAllPlayers } from './staticData';

export default async function syncFavorites() {
  const favorites = getAllPlayers()
    .filter(p => localStorage.getItem(p.memberId))
    .map(p => p.memberId);

  const res = await fetch('/api/favorites/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ favorites }),
  });
  if (!res.ok) {
    throw new Error(`${res.status} -- ${await res.text()}`);
  }

  const json = await res.json();
  for (const fav of json.favorites) {
    localStorage.setItem(fav, '1');
  }
}
