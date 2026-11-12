import { teams as entries } from "./members.js";
import { prepareMembers, validateMembers } from "./memberModel.js";

const photos = import.meta.glob("./photos/*.{webp,png,jpg,jpeg,svg}", {
  eager: true,
  query: "?url",
  import: "default",
});
const byName = Object.fromEntries(
  Object.entries(photos).map(([path, url]) => [path.split("/").at(-1), url]),
);

export const teams = prepareMembers(entries, {
  development: import.meta.env.DEV,
  resolvePhoto: (filename) => byName[filename] || null,
});

if (import.meta.env.DEV) {
  const report = validateMembers(entries, {});
  [...report.errors, ...report.warnings].forEach((message) =>
    console.warn(message),
  );
}
