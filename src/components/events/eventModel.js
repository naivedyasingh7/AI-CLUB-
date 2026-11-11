export const EVENT_CONFIG = Object.freeze({
  dpr: 1.5, railY: 3.2, badgeY: -0.35, baseRadius: 3.2,
  badgeWidth: 1.8, badgeHeight: 2.4, cameraFov: 38,
  selectionDuration: 1.05, revealDuration: 1.25, closeDuration: 0.7,
  galleryScrollPerEvent: 250, maximumPin: 1800,
  gravity: -18, linearDamping: 2.8, angularDamping: 3.5,
  ropeLength: 0.75, strapSamples: 32, maxDrag: 2.2,
  pixelSize: 38, glow: 0.25, slowFrameSeconds: 0.035,
});
export const FALLBACK_POSTER = '/img/events/archive-preview.svg';
export function galleryLayout(count) {
  return { radius: Math.max(EVENT_CONFIG.baseRadius, count * 0.58), step: count > 1 ? Math.PI * 2 / count : 0 };
}
const offsetDate = /T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
export function eventTimes(event) {
  if (!offsetDate.test(event.start || '') || !offsetDate.test(event.end || '')) return null;
  const start = Date.parse(event.start), end = Date.parse(event.end);
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? { start, end } : null;
}
export function eventStatus(event, now = Date.now()) {
  if (event.development) return 'DEVELOPMENT PREVIEW';
  const dates = eventTimes(event);
  return !dates ? 'TO BE ANNOUNCED' : now < dates.start ? 'UPCOMING' : now <= dates.end ? 'LIVE NOW' : 'PAST';
}
export function eventDateLabel(event) {
  const dates = eventTimes(event);
  if (!dates) return 'Date to be announced';
  try { return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: event.timeZone || 'Asia/Kolkata' }).format(dates.start); }
  catch { return 'Date / time zone needs confirmation'; }
}
export function safeEventUrl(url) {
  try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null; } catch { return null; }
}
export function calendarText(event) {
  const dates = eventTimes(event);
  if (!dates || event.development) return null;
  const escape = value => String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const utc = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AI Club VIT Bhopal//Events//EN','BEGIN:VEVENT',`UID:${escape(event.id)}@aiclub.vitbhopal`,`DTSTAMP:${utc(Date.now())}`,`DTSTART:${utc(dates.start)}`,`DTEND:${utc(dates.end)}`,`SUMMARY:${escape(event.title)}`,`DESCRIPTION:${escape(event.description)}`,`LOCATION:${escape(event.venue || event.mode || '')}`,'END:VEVENT','END:VCALENDAR'];
  // RFC 5545 line folding at UTF-8 byte boundaries, not JavaScript character counts.
  return lines.map(line => { let folded = '', length = 0; for (const char of line) { const bytes = new TextEncoder().encode(char).length; if (length + bytes > 73) { folded += '\r\n '; length = 1; } folded += char; length += bytes; } return folded; }).join('\r\n') + '\r\n';
}
export const TRANSITIONS = {
  BROWSING: { SELECT: 'SELECTING' }, SELECTING: { SETTLED: 'INTERACTIVE', CANCEL: 'RETURNING' },
  INTERACTIVE: { EXPLORE: 'OPENING_DETAILS', RETURN: 'RETURNING' },
  OPENING_DETAILS: { OPENED: 'DETAILS_OPEN', CLOSE: 'CLOSING_DETAILS' },
  DETAILS_OPEN: { CLOSE: 'CLOSING_DETAILS' }, CLOSING_DETAILS: { CLOSED: 'INTERACTIVE' },
  RETURNING: { RETURNED: 'BROWSING' },
};
export function interactionReducer(state, action) {
  const next = TRANSITIONS[state.mode]?.[action.type];
  return next ? { mode: next, selectedId: action.type === 'SELECT' ? action.id : state.selectedId } : state;
}
