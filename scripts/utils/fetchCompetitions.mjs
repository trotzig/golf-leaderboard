import { parse } from 'date-fns';

import nodeFetch from 'node-fetch';

import generateCompetitionSlug from '../../src/generateCompetitionSlug.mjs';
import { KFF_COMPETITION_ID } from '../../src/kffConfig.mjs';
import parseJson from './parseJson.mjs';

const DATE_FORMAT = "yyyyMMdd'T'HHmmssX";

function entryToCompetition(e, now) {
  return {
    id: e.ID || e.Id,
    name: e.Name,
    slug: generateCompetitionSlug(e),
    start: parse(`${e.StartDate}+00`, DATE_FORMAT, now),
    end: parse(`${e.EndDate}+00`, DATE_FORMAT, now),
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
  const now = new Date();
  // This is a one-off site for a single competition; only ever sync it.
  return [await fetchCompetition(KFF_COMPETITION_ID, now)];
}
