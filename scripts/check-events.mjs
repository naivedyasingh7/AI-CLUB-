import { fileURLToPath } from "node:url";
import { readPosters } from "./poster-metadata.mjs";

try {
  const { events } = await import("../src/events/events.js");
  const { validateEvents } = await import("../src/events/eventModel.js");
  const posters = await readPosters(
    fileURLToPath(new URL("../src/events/posters", import.meta.url)),
  );
  const result = validateEvents(events, posters);
  result.errors.forEach((message) => console.error(message));
  result.warnings.forEach((message) => console.warn(message));
  if (result.errors.length) process.exitCode = 1;
  else
    process.stdout.write(
      `Event check passed: ${events.length} entries. Dates use India time; posters are ready.\n`,
    );
} catch (error) {
  console.error(
    `Could not check events.js: ${error.message}. Check quotes, commas and the events array.`,
  );
  process.exitCode = 1;
}
