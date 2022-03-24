const data = require('../.staticData.json');

export function findPlayer(slug) {
  return data.players.find(p => p.slug === slug);
}
