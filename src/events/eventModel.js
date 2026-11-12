import { EVENT_TIME_ZONE, DEFAULT_DURATION_MINUTES } from "./events.js";
import { DEV_DUMMY_LIMIT } from "../components/events/galleryConfig.js";
import { eventCopy } from "./eventCopy.js";
import { safeEventUrl } from "../components/events/eventModel.js";

export const BADGE_FACE = Object.freeze({ width: 1.64, height: 2.14 });
export const POSTER_SPEC = Object.freeze({
  width: Math.round(BADGE_FACE.width * 500),
  height: Math.round(BADGE_FACE.height * 500),
  safeX: 100,
  safeY: 130,
  maxBytes: 250 * 1024,
  aspectTolerance: 0.15,
});
export const EVENT_ACCENTS = Object.freeze({
  orange: "#ff8c00",
  cyan: "#00bcd4",
});
const missing = eventCopy.unannounced;
const textOrFallback = (value) =>
  typeof value === "string" && value.trim() ? value : missing;
const clock = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

// Convert a wall-clock time using the one configured zone, never the computer's zone.
export function parseEventDate(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const probe = new Date(0);
  probe.setUTCFullYear(year, month - 1, day);
  probe.setUTCHours(hour, minute, 0, 0);
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day ||
    probe.getUTCHours() !== hour ||
    probe.getUTCMinutes() !== minute
  )
    return null;
  const parts = Object.fromEntries(
    clock.formatToParts(probe).map((p) => [p.type, p.value]),
  );
  const shifted = new Date(0);
  shifted.setUTCFullYear(+parts.year, +parts.month - 1, +parts.day);
  shifted.setUTCHours(+parts.hour, +parts.minute, +parts.second, 0);
  return probe.getTime() - (shifted.getTime() - probe.getTime());
}

export function eventDates(event) {
  const start = parseEventDate(event.start);
  if (start === null) return null;
  const end =
    event.end == null || event.end === ""
      ? start + DEFAULT_DURATION_MINUTES * 60000
      : parseEventDate(event.end);
  return end === null || end < start ? null : { start, end };
}

export function statusAt(event, now = Date.now()) {
  const dates = eventDates(event);
  if (!dates) return "unannounced";
  return now < dates.start ? "upcoming" : now <= dates.end ? "live" : "past";
}

export function validateEvents(entries, posters = {}) {
  const errors = [],
    warnings = [],
    ids = new Set();
  if (!Array.isArray(entries))
    return {
      errors: ['events.js: "events" must be a list of event entries.'],
      warnings,
    };
  entries.forEach((event, index) => {
    const id = event?.id || `entry ${index + 1}`;
    const error = (field, message) =>
      errors.push(`${id}: "${field}" ${message}`);
    if (!event || typeof event !== "object") {
      error("event", "must be an object.");
      return;
    }
    if (typeof event.id !== "string" || !event.id.trim())
      error("id", "is required. Give this event a unique name.");
    else if (ids.has(event.id))
      error("id", "is duplicated. Every event needs a different id.");
    ids.add(event.id);
    if (typeof event.title !== "string" || !event.title.trim())
      error("title", "is required.");
    const undatedPreview = event.placeholder === true && event.start === null;
    if (
      !Object.hasOwn(event, "start") ||
      event.start === "" ||
      event.start === undefined ||
      (event.start === null && !undatedPreview)
    )
      error("start", "is required. Use YYYY-MM-DD HH:mm in India time.");
    else if (!undatedPreview && parseEventDate(event.start) === null)
      error(
        "start",
        "is not a valid date. Use YYYY-MM-DD HH:mm in India time, for example 2026-12-12 10:00.",
      );
    if (event.end != null && event.end !== "") {
      if (parseEventDate(event.end) === null)
        error(
          "end",
          "is not a valid date. Use YYYY-MM-DD HH:mm in India time.",
        );
      else if (
        parseEventDate(event.start) !== null &&
        parseEventDate(event.end) < parseEventDate(event.start)
      )
        error("end", 'is before "start".');
    }
    if (event.accent != null && !Object.hasOwn(EVENT_ACCENTS, event.accent))
      error("accent", 'must be "orange" or "cyan".');
    for (const field of [
      "tagline",
      "venue",
      "group",
      "description",
      "poster",
      "registerUrl",
    ])
      if (event[field] != null && typeof event[field] !== "string")
        error(field, "must be text inside quotes.");
    if (event.placeholder != null && typeof event.placeholder !== "boolean")
      error("placeholder", "must be true or false, without quotes.");
    if (event.registerUrl && !safeEventUrl(event.registerUrl))
      error("registerUrl", "must be a complete https:// or http:// link.");
    if (
      event.speakers != null &&
      (!Array.isArray(event.speakers) ||
        event.speakers.some(
          (person) =>
            !person ||
            typeof person.name !== "string" ||
            !person.name.trim() ||
            (person.role != null && typeof person.role !== "string"),
        ))
    )
      error(
        "speakers",
        'must be a list like [{ name: "Name", role: "Role" }].',
      );
    if (event.poster) {
      if (
        !/^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:webp|png|jpe?g|svg)$/.test(event.poster)
      )
        error(
          "poster",
          "must be a lowercase filename with hyphens, not a path. Use .webp, .png, .jpg, .jpeg or .svg.",
        );
      const meta = posters[event.poster];
      if (!meta)
        error(
          "poster",
          `file "${event.poster}" was not found in src/events/posters/.`,
        );
      else if (meta.invalid)
        error(
          "poster",
          "could not be read as a supported image. Export it again.",
        );
      else if (
        meta.width &&
        meta.height &&
        Math.abs(
          meta.width / meta.height / (POSTER_SPEC.width / POSTER_SPEC.height) -
            1,
        ) > POSTER_SPEC.aspectTolerance
      )
        error(
          "poster",
          `has the wrong shape (${meta.width}×${meta.height}). Use ${POSTER_SPEC.width}×${POSTER_SPEC.height}px portrait artwork.`,
        );
      if (meta?.bytes > POSTER_SPEC.maxBytes)
        warnings.push(
          `${id}: "poster" is larger than 250KB. Export a smaller WebP if possible.`,
        );
    }
  });
  return { errors, warnings };
}

export function prepareEvents(
  entries,
  {
    development = false,
    now = Date.now(),
    resolvePoster = (name) => name,
  } = {},
) {
  const safeEntries = Array.isArray(entries)
    ? entries.filter((event) => event && typeof event === "object")
    : [];
  const hasReal = safeEntries.some((event) => event.placeholder !== true);
  return safeEntries
    .filter((event) => development || !hasReal || event.placeholder !== true)
    .map((event) => {
      const dates = eventDates(event),
        poster = event.poster ? resolvePoster(event.poster) : null;
      return {
        ...event,
        title: textOrFallback(event.title),
        tagline: textOrFallback(event.tagline),
        venue: typeof event.venue === "string" ? event.venue : null,
        group: textOrFallback(event.group),
        description: textOrFallback(event.description),
        speakers: Array.isArray(event.speakers)
          ? event.speakers
              .filter((person) => person && typeof person.name === "string")
              .map((person) => ({
                name: person.name,
                role: typeof person.role === "string" ? person.role : undefined,
              }))
          : [],
        timeZone: EVENT_TIME_ZONE,
        start: dates ? new Date(dates.start).toISOString() : null,
        startsAt: dates ? new Date(dates.start).toISOString() : null,
        end: dates ? new Date(dates.end).toISOString() : null,
        status: statusAt(event, now),
        isPlaceholder: event.placeholder === true,
        development: event.placeholder === true,
        registrationUrl: safeEventUrl(event.registerUrl),
        accent: EVENT_ACCENTS[event.accent] || EVENT_ACCENTS.orange,
        posterSrc: poster,
        poster,
        badgeFront: poster,
        badgeBack: poster,
        sortTime: dates?.start ?? 0,
      };
    })
    .sort((a, b) => {
      const rank = { live: 0, upcoming: 1, past: 2, unannounced: 3 };
      return (
        rank[a.status] - rank[b.status] ||
        (a.status === "past"
          ? b.sortTime - a.sortTime
          : a.sortTime - b.sortTime)
      );
    });
}

export function eventsForGallery(base, search, development = false) {
  if (!development) return base;
  const value = new URLSearchParams(search).get("dummies");
  if (!value || !/^\d+$/.test(value)) return base;
  const count = Math.min(DEV_DUMMY_LIMIT, Number(value));
  const dummy = base.find((event) => event.id === "workshop-slot-tba");
  if (count < 1 || !dummy) return base;
  return [
    ...base.filter((event) => event.id !== dummy.id),
    ...Array.from({ length: count }, (_, i) => ({
      ...dummy,
      id: `dev-workshop-${i + 1}`,
      title: `${dummy.title} · ${i + 1}`,
      accent: i % 2 === 0 ? EVENT_ACCENTS.cyan : EVENT_ACCENTS.orange,
    })),
  ];
}
