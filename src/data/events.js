/**
 * @typedef {Object} ClubEvent
 * @property {string} id Stable unique identifier.
 * @property {string} title
 * @property {string} description
 * @property {string=} tagline
 * @property {boolean=} development Explicitly labels an unannounced development preview.
 * @property {string|null=} start ISO 8601 with Z or an explicit offset, never a local date string.
 * @property {string|null=} end ISO 8601 with Z or an explicit offset.
 * @property {string=} timeZone IANA zone, e.g. Asia/Kolkata.
 * @property {string=} venue
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
];
