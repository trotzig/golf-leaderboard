import data from '../.staticData.json';

export function findPlayer(slug) {
  return data.players.find(p => p.slug === slug);
}

export function getAllPlayers() {
  return data.players;
}
export function getAllCompetitions() {
  return data.competitions.map(c => ({
    ...c,
    start: new Date(c.start),
    end: new Date(c.end),
  }));
}
