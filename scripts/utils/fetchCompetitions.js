const nodeFetch = require('node-fetch');

const parseJson = require('./parseJson');

const { QUICKRUN } = process.env;

module.exports = async function fetchCompetitions() {
  const res = await nodeFetch(
    'https://scores.golfbox.dk/Handlers/ScheduleHandler/GetSchedule/CustomerId/1/Season/2022/CompetitionId/0/language/2057/',
  );
  if (!res.ok) {
    throw new Error('Failed to fetch comps', res.status, await res.text());
  }
  const json = parseJson(await res.text());
  const result = [];
  for (const year of Object.values(json.CompetitionData)) {
    for (const month of Object.values(year.Months)) {
      result.push(
        ...Object.values(month.Entries).map(e => ({ id: e.ID, name: e.Name })),
      );
    }
  }
  if (QUICKRUN) {
    return result.slice(0, 1);
  }
  return result;
}
