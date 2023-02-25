import nodeFetch from 'node-fetch';
import { parse } from 'date-fns';

import parseJson from './parseJson.mjs';

const { QUICKRUN } = process.env;
const DATE_FORMAT = "yyyyMMdd'T'HHmmssX";

export default async function fetchCompetitions() {
  const res = await nodeFetch(
    'https://scores.golfbox.dk/Handlers/ScheduleHandler/GetSchedule/CustomerId/1/Season/2023/CompetitionId/0/language/2057/',
  );
  if (!res.ok) {
    throw new Error('Failed to fetch comps', res.status, await res.text());
  }
  const json = parseJson(await res.text());
  if (json.ErrorMessage) {
    console.log('Got error from API', json);
    return [];
  }
  const result = [];
  const now = new Date();
  for (const year of Object.values(json.CompetitionData)) {
    for (const month of Object.values(year.Months)) {
      result.push(
        ...Object.values(month.Entries).map(e => ({
          id: e.ID,
          name: e.Name,
          start: parse(`${e.StartDate}+00`, DATE_FORMAT, now),
          end: parse(`${e.EndDate}+00`, DATE_FORMAT, now),
        })),
      );
    }
  }
  if (QUICKRUN) {
    return result.slice(0, 1);
  }
  return result;
}
