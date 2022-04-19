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

export function getCompetition(id) {
  const comp = data.competitions.find(c => `${c.id}` === `${id}`);
  if (!comp) {
    return;
  }
  return {
    ...comp,
    start: new Date(comp.start),
    end: new Date(comp.end),
  };
}
