// All dates use India time. A missing end means a two-hour event.
export const EVENT_TIME_ZONE = "Asia/Kolkata";
export const DEFAULT_DURATION_MINUTES = 120;

/* TEMPLATE: copy this object into the events array below, including the comma.
{
  id: "intro-to-llms",                 // REQUIRED: unique lowercase name; never reuse it.
  title: "Introduction to LLMs",       // REQUIRED: the event's public name.
  start: "2026-12-12 10:00",           // REQUIRED: YYYY-MM-DD HH:mm, India time (24-hour clock).
  end: "2026-12-12 12:00",             // Optional; omitted = start + 120 minutes.
  tagline: "Build your first language-model app.", // Optional short subtitle.
  venue: "Seminar Hall",              // Optional; omitted = To be announced.
  group: "AI Club · VIT Bhopal",       // Optional organiser; omitted = To be announced.
  description: "What people will learn and what to bring.", // Optional paragraph.
  speakers: [{ name: "Speaker Name", role: "Guest speaker" }], // Optional; omit if unknown.
  registerUrl: "https://example.com/register", // Optional; omitted = disabled Register.
  poster: "intro-to-llms.webp",         // Optional filename from posters/; no paths/imports.
  accent: "orange",                    // Optional: orange or cyan; default orange.
  placeholder: false,                   // Optional: true = preview, not a real announcement.
},
For an undated preview only: start: null AND placeholder: true.
Everything except id, title and start may be left out. Do not add a status field.
*/
export const events = [
  {
    id: "development-preview",
    title: "Cute dog",
    start: null,
    tagline: "who doesnt love dog",
    group: "AI Club · VIT Bhopal",
    description:
      "This is a development preview of the AI Club event archive. The club has not supplied an event announcement yet. The title, artwork and pass are placeholders; date, venue and registration will appear here when confirmed.",
    poster: "dog.jpg",
    accent: "orange",
    placeholder: true,
  },
  {
    id: "workshop-slot-tba",
    title: "Workshop Slot (TBA)",
    start: null,
    tagline: "A placeholder, not an announced workshop.",
    group: "AI Club · VIT Bhopal",
    description:
      "Dummy workshop slot for gallery development. No workshop, date, venue or registration has been announced.",
    poster: "workshop-slot-tba.svg",
    accent: "cyan",
    placeholder: true,
  },
];
