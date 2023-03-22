(async function () {

  async function fetchPlayerData(playerId, baseUrl) {
    const res = await fetch(`${baseUrl}/api/player-data/${playerId}`);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch player data. Reason: ${
          res.status
        } -- ${await res.text()}`,
      );
    }
    const json = await res.json();
    return json;
  }

  const elements = document.querySelectorAll('[data-nordicgolftour-player-id]');
  if (!elements) {
    throw new Error(
      'nordicgolftour.app -- found no elements with data-nordicgolftour-player-id attribute',
    );
  }

  for (const element of elements) {
    const playerId = element.getAttribute('data-nordicgolftour-player-id');

    const baseUrl =
      element.getAttribute('data-nordicgolftour-baseurl') ||
      'https://nordicgolftour.app';

    const playerData = await fetchPlayerData(playerId, baseUrl);
  }
})();
