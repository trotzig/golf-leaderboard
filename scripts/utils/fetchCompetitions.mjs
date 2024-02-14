import { parse } from 'date-fns';

import nodeFetch from 'node-fetch';

import generateCompetitionSlug from '../../src/generateCompetitionSlug.mjs';
import parseJson from './parseJson.mjs';

const { QUICKRUN } = process.env;
const DATE_FORMAT = "yyyyMMdd'T'HHmmssX";

function entryToCompetition(e, now) {
  return {
    id: e.ID || e.Id,
    name: e.Name,
    slug: generateCompetitionSlug(e),
    start: parse(`${e.StartDate}+02`, DATE_FORMAT, now),
    end: parse(`${e.EndDate}+02`, DATE_FORMAT, now),
  };
}

async function fetchCompetition(competitionId, now) {
  const resPromise = nodeFetch(
    `https://scores.golfbox.dk/Handlers/CompetitionHandler/GetCompetition/CompetitionId/${competitionId}/`,
  );

  const res = await resPromise;
  if (!res.ok) {
    throw new Error(
      `Failed to fetch comp ${competitionId}`,
      res.status,
      await res.text(),
    );
  }
  const json = parseJson(await res.text());
  return entryToCompetition(json.CompetitionData, now);
}

export default async function fetchCompetitions() {
  const result = [];
  const now = new Date();
  if (process.env.NEXT_PUBLIC_GOLFBOX_COMPETITION_IDS) {
    for (const competitionId of process.env.NEXT_PUBLIC_GOLFBOX_COMPETITION_IDS.split(
      ',',
    )) {
      result.push(await fetchCompetition(competitionId, now));
    }
    return result;
  }

  const res = await nodeFetch(
    `https://scores.golfbox.dk/Handlers/ScheduleHandler/GetSchedule/CustomerId/${process.env.NEXT_PUBLIC_GOLFBOX_CUSTOMER_ID}/Season/2024/CompetitionId/0/language/2057/`,
  );
  if (!res.ok) {
    throw new Error('Failed to fetch comps', res.status, await res.text());
  }
  const json = parseJson(await res.text());
  if (json.ErrorMessage) {
    console.log('Got error from API', json);
    return [];
  }
  for (const year of Object.values(json.CompetitionData)) {
    for (const month of Object.values(year.Months)) {
      result.push(
        ...Object.values(month.Entries).map(e => {
          return entryToCompetition(e, now);
        }),
      );
    }
  }
  if (QUICKRUN) {
    return result.slice(0, 1);
  }
  return result;
}
