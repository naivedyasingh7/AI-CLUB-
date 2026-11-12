import { events as entries } from "./events.js";
import { prepareEvents, validateEvents } from "./eventModel.js";
export { eventsForGallery } from "./eventModel.js";
export { eventCopy } from "./eventCopy.js";

const posters = import.meta.glob("./posters/*.{webp,png,jpg,jpeg,svg}", {
  eager: true,
  query: "?url",
  import: "default",
});
const byName = Object.fromEntries(
  Object.entries(posters).map(([path, url]) => [path.split("/").at(-1), url]),
);
export const events = prepareEvents(entries, {
  development: import.meta.env.DEV,
  resolvePoster: (filename) => byName[filename] || null,
});

if (import.meta.env.DEV) {
  const meta = Object.fromEntries(
    Object.keys(byName).map((name) => [name, {}]),
  );
  const report = validateEvents(entries, meta);
  [...report.errors, ...report.warnings].forEach((message) =>
    console.warn(message),
  );
  let disposed = false;
  const images = [];
  for (const event of Array.isArray(entries) ? entries : []) {
    if (!event || typeof event !== "object") continue;
    if (!byName[event.poster]) continue;
    const image = new Image();
    images.push(image);
    image.onload = () => {
      if (!disposed) {
        const result = validateEvents([event], {
          [event.poster]: {
            width: image.naturalWidth,
            height: image.naturalHeight,
          },
        });
        result.errors
          .filter((message) => message.includes('"poster"'))
          .forEach((message) => console.warn(message));
      }
      image.onload = image.onerror = null;
    };
    image.onerror = () => {
      if (!disposed)
        console.warn(
          `${event.id}: "poster" could not load. The default logo and title will be used.`,
        );
      image.onload = image.onerror = null;
    };
    image.src = byName[event.poster];
  }
  import.meta.hot?.dispose(() => {
    disposed = true;
    images.forEach((image) => {
      image.onload = image.onerror = null;
    });
  });
}
