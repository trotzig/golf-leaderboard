import { formatDistance, format, getDate, parse } from 'date-fns';

import calendarDate from './calendarDate.mjs';

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
  { finished, parts } = {},
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
  const startDate = calendarDate(start);
  const endDate = calendarDate(end);
  const startDay = getDate(startDate);
  const endDay = getDate(endDate);

  if (numberOfDays > 4) {
    // If the entry spans more than 4 days, we assume it's a "Sign up" entry.
    // These will show the entire date.
    if (endDay < startDay) {
      // crossing into different month
      return `${format(startDate, 'MMMM d')}—${format(endDate, 'MMMM d')}`;
    }
    return `${format(startDate, 'MMMM d')}—${format(endDate, 'd')}`;
  }

  let suffix = '';

  if (finished) {
    suffix = `Played ${numberOfDays + 1} rounds`;
  } else if (start - 60 * 60 * 1000 <= utcMidnight && utcMidnight <= end) {
    // Currently active
    suffix = `Round ${differenceInDays(utcMidnight, start) + 1} of ${
      numberOfDays + 1
    }`;
  } else {
    if (utcMidnight > end) {
      return parts
        ? { date: `Finished ${formatDistance(end, utcMidnight)} ago` }
        : `Finished ${formatDistance(end, utcMidnight)} ago`;
    }
    const daysUntilStart = differenceInDays(start, utcMidnight);
    if (daysUntilStart === 1) {
      return parts ? { date: 'Starts tomorrow' } : 'Starts tomorrow';
    }
    if (daysUntilStart < 8) {
      suffix = `Starts in ${formatDistance(utcMidnight, start)}`;
    }
  }
  const dateStr =
    endDay < startDay
      ? `${format(startDate, 'MMMM d')}—${format(endDate, 'MMMM d')}`
      : `${format(startDate, 'MMMM d')}—${format(endDate, 'd')}`;

  if (parts) {
    return { date: dateStr, suffix };
  }
  return suffix ? `${dateStr} — ${suffix}` : dateStr;
}
