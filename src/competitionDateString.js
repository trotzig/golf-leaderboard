import {
  formatDistance,
  format,
  getDate,
  parse,
  startOfDay,
} from 'date-fns';

function differenceInDays(after, before) {
  return new Date(after).getDate() - new Date(before).getDate();
}

const DATE_FORMAT = "yyyyMMdd'T'HHmmss";

export default function competitionDateString(
  competition,
  initialNow = new Date(),
) {
  const now = startOfDay(initialNow);
  const start =
    competition._start ||
    competition.start ||
    parse(competition.StartDate, DATE_FORMAT, now);
  const end =
    competition._end ||
    competition.end ||
    parse(competition.EndDate, DATE_FORMAT, now);
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

  if (start - 60 * 60 * 1000 <= now && now <= end) {
    // Currently active
    suffix = ` — Playing round ${
      differenceInDays(now, start) + 1
    } of ${numberOfDays + 1}`;
  } else {
    if (now > end) {
      return `Finished ${formatDistance(end, now)} ago`;
    }
    const daysUntilStart = differenceInDays(start, now);
    if (daysUntilStart === 1) {
      return 'Starts tomorrow';
    }
    if (daysUntilStart < 8) {
      suffix = ` — Starts in ${formatDistance(now, start)}`;
    }
  }
  if (endDay < startDay) {
    // crossing into different month
    return `${format(start, 'MMMM d')}—${format(end, 'MMMM d')}${suffix}`;
  }
  return `${format(start, 'MMMM d')}—${format(end, 'd')}${suffix}`;
}
