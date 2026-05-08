const linksByName = {
  'Stefan Idstam': [
    { label: 'YouTube', url: 'https://www.youtube.com/@stefanidstamgolf' },
  ],
  'Adam Andersson': [
    { label: 'Website', url: 'https://adamanderssongolf.com/' },
  ],
  'Fredrik Lindblom': [
    { label: 'YouTube', url: 'https://www.youtube.com/@FredrikandHannah' },
  ],
};

export default function getPlayerLinks(player) {
  const key = `${player.firstName} ${player.lastName}`;
  return linksByName[key] || [];
}
