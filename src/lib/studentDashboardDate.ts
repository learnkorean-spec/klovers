/** Compare calendar dates in the student's timezone, never hours until noon. */
export function studentCalendarDaysUntil(date: string, timeZone: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find(p => p.type === type)?.value);
  const [year, month, day] = date.split("-").map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(part("year"), part("month") - 1, part("day"))) / 86400000);
}
