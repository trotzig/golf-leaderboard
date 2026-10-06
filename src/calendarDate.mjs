// Competition start and end dates are calendar days, stored as midnight UTC.
// Formatting them as-is uses the viewer's timezone, which shows the day before
// for anyone west of UTC. This returns local midnight on the same calendar
// day, safe to pass to date-fns `format`.
export default function calendarDate(date) {
  const d = new Date(date);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
