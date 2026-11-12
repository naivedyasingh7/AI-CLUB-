import { DEV_DUMMY_LIMIT } from "../components/events/galleryConfig.js";

export const eventCopy = {
  unannounced: "To be announced",
  preview: "DEVELOPMENT PREVIEW",
  eyebrow: "AI CLUB / EVENTS",
  when: "WHEN",
  where: "WHERE",
  by: "BY",
  speakers: "Speakers",
  register: "Register ↗",
  registerPending: "Register · TBA",
  calendar: "Add to calendar",
  calendarPending: "Add to calendar · TBA",
  previewActions: "Preview · booking and calendar unavailable",
};

/**
 * @typedef {Object} ClubEvent
 * @property {string} id Stable unique identifier.
 * @property {string} title
 * @property {string|null} startsAt
 * @property {string|null} venue
 * @property {string} group
 * @property {string} posterSrc
 * @property {string} accent Existing club logo colour.
 * @property {boolean} isPlaceholder
 * @property {string} description
 * @property {string=} tagline
 * @property {boolean=} development Explicitly labels an unannounced development preview.
 * @property {string|null=} start ISO 8601 with Z or an explicit offset, never a local date string.
 * @property {string|null=} end ISO 8601 with Z or an explicit offset.
 * @property {string=} timeZone IANA zone, e.g. Asia/Kolkata.
 * @property {'in-person'|'online'|'hybrid'=} mode
 * @property {string=} poster Local /public path.
 * @property {string=} badgeFront Optional local artwork, defaults to poster.
 * @property {string=} badgeBack
 * @property {string=} community
 * @property {Array<{name:string,role?:string}>=} speakers
 * @property {Array<{name:string,role?:string}>=} judges
 * @property {Array<{time:string,title:string}>=} agenda
 * @property {'open'|'closed'|'unannounced'=} registrationState
 * @property {string=} registrationUrl
 * @property {string=} joinUrl Explicit live participation URL.
 * @property {string=} externalUrl
 * @property {{url?:string,images?:string[],highlights?:string[],statistics?:Array<{label:string,value:string}>}=} recap
 * @property {string[]=} highlights
 */

/** @type {ClubEvent[]} No confirmed event details/assets have been supplied. Replace this preview before announcing. */
export const events = [
  {
    id: "development-preview",
    title: "The next chapter.",
    startsAt: null,
    venue: null,
    group: "AI Club · VIT Bhopal",
    posterSrc: "/img/events/archive-preview.svg",
    accent: "#ff8c00",
    isPlaceholder: true,
    tagline: "A place for what comes next.",
    description:
      "This is a development preview of the AI Club event archive. The club has not supplied an event announcement yet. The title, artwork and pass are placeholders; date, venue and registration will appear here when confirmed.",
    development: true,
    start: null,
    end: null,
    timeZone: "Asia/Kolkata",
    poster: "/img/events/archive-preview.svg",
    badgeFront: "/img/events/badge-preview.svg",
    badgeBack: "/img/events/badge-preview.svg",
    community: "AI Club · VIT Bhopal",
    registrationState: "unannounced",
  },
  {
    id: "workshop-slot-tba",
    title: "Workshop Slot (TBA)",
    tagline: "A placeholder, not an announced workshop.",
    startsAt: null,
    venue: null,
    group: "AI Club · VIT Bhopal",
    posterSrc: "/img/events/workshop-slot-tba.svg",
    poster: "/img/events/workshop-slot-tba.svg",
    badgeFront: "/img/events/workshop-slot-tba.svg",
    badgeBack: "/img/events/workshop-slot-tba.svg",
    accent: "#00bcd4",
    isPlaceholder: true,
    development: true,
    description:
      "Dummy workshop slot for gallery development. No workshop, date, venue or registration has been announced.",
    start: null,
    end: null,
    timeZone: "Asia/Kolkata",
    community: "AI Club · VIT Bhopal",
    registrationState: "unannounced",
  },
];

// The caller passes import.meta.env.DEV: production ignores the query entirely.
export function eventsForGallery(base, search, development = false) {
  if (!development) return base;
  const value = new URLSearchParams(search).get("dummies");
  if (!value || !/^\d+$/.test(value)) return base;
  const count = Math.min(DEV_DUMMY_LIMIT, Number(value));
  if (count < 1) return base;
  const dummy = base.find((event) => event.id === "workshop-slot-tba");
  if (!dummy) return base;
  return [
    ...base.filter((event) => event.id !== dummy.id),
    ...Array.from({ length: count }, (_, index) => ({
      ...dummy,
      id: `dev-workshop-${index + 1}`,
      title: `Workshop Slot (TBA) · ${index + 1}`,
      accent: index % 2 === 0 ? "#00bcd4" : "#ff8c00",
    })),
  ];
}
