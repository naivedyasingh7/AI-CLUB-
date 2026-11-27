// AI Club team members & panel coordinator
import { teams as teamEntries, board as boardEntries } from "./members.js";
import { prepareMembers, prepareBoard, validateMembers } from "./memberModel.js";

const boardPhotos = import.meta.glob(
  ["./photos/board/*.{webp,png,jpg,jpeg,svg}", "./photos/*.{webp,png,jpg,jpeg,svg}"],
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);
const boardByName = Object.fromEntries(
  Object.entries(boardPhotos).map(([path, url]) => [path.split("/").at(-1), url]),
);

export const teams = prepareMembers(teamEntries, {
  development: import.meta.env.DEV,
  resolvePhoto: (filename) => boardByName[filename] || null,
});

export const board = prepareBoard(boardEntries, {
  development: import.meta.env.DEV,
  resolvePhoto: (filename) => boardByName[filename] || null,
});

if (import.meta.env.DEV) {
  const meta = Object.fromEntries(
    Object.keys(boardByName).map((name) => [name, { width: 800, height: 1000 }]),
  );
  const report = validateMembers(teamEntries, boardEntries, meta);
  [...report.errors, ...report.warnings].forEach((message) =>
    console.warn(message),
  );
}
