export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function iso(date) {
  return date.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 86400000);
}
