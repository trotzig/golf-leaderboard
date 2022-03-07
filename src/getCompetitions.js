const { parse } = require('date-fns');

const DATE_FORMAT = "yyyyMMdd'T'HHmmss";

export default function getCompetitions(data, now) {
  const result = [];
  for (const c of Object.values(data.CompetitionData)) {
    for (const m of Object.values(c.Months)) {
      result.push(...Object.values(m.Entries));
    }
  }
  for (const entry of result) {
    entry._start = parse(entry.StartDate, DATE_FORMAT, now);
    entry._end = parse(entry.EndDate, DATE_FORMAT, now);
  }
  return result;
}
