export const MAX_COUNT = 2147483647;
export function parseCount(value) {
  if (value === '' || value === null) return 0;
  if (!/^\d+$/.test(String(value))) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n <= MAX_COUNT ? n : null;
}
export function summarize(snapshot) {
  // The C# analyzer remains the authority for totals and profile offsets.
  const matches = Array.isArray(snapshot.matches) ? snapshot.matches : [];
  const sum = matches.reduce((n, m) => n + (Number(m.chestsOpened) || 0), 0);
  const total = snapshot.total ?? 0;
  const destroyed = snapshot.destroyed ?? matches.reduce((n, m) => n + (Number(m.chestsDestroyed) || 0), 0);
  const opened = snapshot.opened ?? Math.max(0, total - destroyed);
  const lastMatch = snapshot.lastMatch ?? 0;
  const lastMatchDestroyed = snapshot.lastMatchDestroyed ?? (matches.length > 0 ? (Number(matches[0].chestsDestroyed) || 0) : 0);
  const lastMatchOpened = snapshot.lastMatchOpened ?? Math.max(0, lastMatch - lastMatchDestroyed);
  const session = snapshot.session ?? 0;
  const sessionDestroyed = snapshot.sessionDestroyed ?? 0;
  const sessionOpened = snapshot.sessionOpened ?? Math.max(0, session - sessionDestroyed);

  return {
    total,
    opened,
    destroyed,
    session,
    sessionOpened,
    sessionDestroyed,
    lastMatch,
    lastMatchOpened,
    lastMatchDestroyed,
    average: matches.length ? Math.round(sum / matches.length * 10) / 10 : 0,
    victories: matches.filter(m => m.placement === 1).length
  };
}
export function localDay(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
export function activityDays(matches, now = new Date()) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29 + i);
    return { date, count: 0 };
  });
  const byDay = new Map(days.map(day => [localDay(day.date), day]));
  for (const match of matches) {
    const day = byDay.get(localDay(new Date(match.matchStart)));
    if (day) day.count += Number(match.chestsOpened) || 0;
  }
  return days;
}
export function csvCell(value) {
  // Keep names with quotes/newlines intact and prevent spreadsheet formula execution.
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function matchesCsv(matches) {
  const keys = ['matchStart', 'playlist', 'playerName', 'placement', 'chestsOpened', 'chestsSearched', 'chestsDestroyed', 'eliminations', 'fileName'];
  return '\uFEFF' + [keys.join(','), ...matches.map(m => keys.map(key => csvCell(m[key])).join(','))].join('\r\n');
}
