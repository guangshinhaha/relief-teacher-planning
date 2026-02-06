/** Get ISO week number for a date */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  // Set to nearest Thursday (current date + 4 - current day number, week starts Monday)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Determine if a date falls in an odd or even week */
export function getWeekType(date: Date): "ODD" | "EVEN" {
  return getISOWeekNumber(date) % 2 === 1 ? "ODD" : "EVEN";
}
