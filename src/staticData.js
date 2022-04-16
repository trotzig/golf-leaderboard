import data from '../.staticData.json';

export function findPlayer(slug) {
  return data.players.find(p => p.slug === slug);
}

export function getAllPlayers() {
  return data.players;
}
