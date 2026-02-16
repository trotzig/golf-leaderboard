/**
 * Parse a datetime string like '20260214T102200' as CET (Central European Time).
 * CET is UTC+1, CEST (summer time) is UTC+2.
 *
 * date-fns `parse` interprets strings in the browser's local timezone, which
 * causes bugs for users outside of CET. This function produces a correct
 * absolute Date regardless of the user's timezone.
 */
export default function parseCET(dateStr) {
  if (!dateStr || dateStr.length < 15) {
    return new Date(NaN);
  }
  // dateStr format: "yyyyMMdd'T'HHmmss" e.g. "20260214T102200"
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10) - 1; // 0-indexed
  const day = parseInt(dateStr.slice(6, 8), 10);
  const hour = parseInt(dateStr.slice(9, 11), 10);
  const minute = parseInt(dateStr.slice(11, 13), 10);
  const second = parseInt(dateStr.slice(13, 15), 10);

  // Determine if the date falls in CEST (Central European Summer Time, UTC+2)
  // or CET (UTC+1). EU summer time: last Sunday of March to last Sunday of October.
  const utcAsIfCET = Date.UTC(year, month, day, hour, minute, second);

  // Last Sunday of March
  const marchLast = new Date(Date.UTC(year, 2, 31));
  marchLast.setUTCDate(31 - marchLast.getUTCDay());
  const cestStart = Date.UTC(year, 2, marchLast.getUTCDate(), 1, 0, 0); // 01:00 UTC

  // Last Sunday of October
  const octLast = new Date(Date.UTC(year, 9, 31));
  octLast.setUTCDate(31 - octLast.getUTCDay());
  const cestEnd = Date.UTC(year, 9, octLast.getUTCDate(), 1, 0, 0); // 01:00 UTC

  // During CEST the offset is UTC+2, otherwise UTC+1
  const offsetHours = utcAsIfCET >= cestStart && utcAsIfCET < cestEnd ? 2 : 1;

  return new Date(Date.UTC(year, month, day, hour - offsetHours, minute, second));
}
