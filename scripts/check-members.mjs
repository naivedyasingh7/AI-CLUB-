import { fileURLToPath } from "node:url";
import { readPosters } from "./poster-metadata.mjs";

try {
  const { teams, board } = await import("../src/members/members.js");
  const { validateMembers } = await import("../src/members/memberModel.js");

  const photosMain = await readPosters(
    fileURLToPath(new URL("../src/members/photos", import.meta.url)),
  ).catch(() => ({}));

  const photosBoard = await readPosters(
    fileURLToPath(new URL("../src/members/photos/board", import.meta.url)),
  ).catch(() => ({}));

  const photos = { ...photosMain, ...photosBoard };

  const result = validateMembers(teams, board, photos);
  result.errors.forEach((message) => console.error(message));
  result.warnings.forEach((message) => console.warn(message));
  if (result.errors.length) process.exitCode = 1;
  else
    process.stdout.write(
      `Member check passed: ${teams.length} teams, ${board ? board.length : 0} board entries. Photos and links are ready.\n`,
    );
} catch (error) {
  console.error(
    `Could not check members.js: ${error.message}. Check quotes, commas and the teams/board arrays.`,
  );
  process.exitCode = 1;
}
