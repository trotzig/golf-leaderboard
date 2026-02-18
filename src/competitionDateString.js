import { formatDistance, format, getDate, parse } from 'date-fns';

function differenceInDays(after, before) {
  return Math.ceil(
    (new Date(after).getTime() - new Date(before).getTime()) /
      (24 * 60 * 60 * 1000),
  );
}

const DATE_FORMAT = "yyyyMMdd'T'HHmmss";

export default function competitionDateString(
  competition,
  initialNow = new Date(),
  { finished } = {},
) {
  const utcMidnight = new Date(
    Date.UTC(
      initialNow.getUTCFullYear(),
      initialNow.getUTCMonth(),
      initialNow.getUTCDate(),
    ),
  );
  const start =
    competition._start ||
    competition.start ||
    parse(competition.StartDate, DATE_FORMAT, utcMidnight);
  const end =
    competition._end ||
    competition.end ||
    parse(competition.EndDate, DATE_FORMAT, utcMidnight);
  const numberOfDays = differenceInDays(end, start);
  const startDay = getDate(start);
  const endDay = getDate(end);

  if (numberOfDays > 4) {
    // If the entry spans more than 4 days, we assume it's a "Sign up" entry.
    // These will show the entire date.
    if (endDay < startDay) {
      // crossing into different month
      return `${format(start, 'MMMM d')}—${format(end, 'MMMM d')}`;
    }
    return `${format(start, 'MMMM d')}—${format(end, 'd')}`;
  }

  let suffix = '';

  if (finished) {
    suffix = ` — Played ${numberOfDays + 1} rounds`;
  } else if (start - 60 * 60 * 1000 <= utcMidnight && utcMidnight <= end) {
    // Currently active
    suffix = ` — Round ${differenceInDays(utcMidnight, start) + 1} of ${
      numberOfDays + 1
    }`;
  } else {
    if (utcMidnight > end) {
      return `Finished ${formatDistance(end, utcMidnight)} ago`;
    }
    const daysUntilStart = differenceInDays(start, utcMidnight);
    if (daysUntilStart === 1) {
      return 'Starts tomorrow';
    }
    if (daysUntilStart < 8) {
      suffix = ` — Starts in ${formatDistance(utcMidnight, start)}`;
    }
  }
  if (endDay < startDay) {
    // crossing into different month
    return `${format(start, 'MMMM d')}—${format(end, 'MMMM d')}${suffix}`;
  }
  return `${format(start, 'MMMM d')}—${format(end, 'd')}${suffix}`;
}
