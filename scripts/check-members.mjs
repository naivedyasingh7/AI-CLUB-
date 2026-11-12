import { fileURLToPath } from "node:url";
import { readPosters } from "./poster-metadata.mjs";

try {
  const { teams } = await import("../src/members/members.js");
  const { validateMembers } = await import("../src/members/memberModel.js");
  const photos = await readPosters(
    fileURLToPath(new URL("../src/members/photos", import.meta.url)),
  );
  const result = validateMembers(teams, photos);
  result.errors.forEach((message) => console.error(message));
  result.warnings.forEach((message) => console.warn(message));
  if (result.errors.length) process.exitCode = 1;
  else
    process.stdout.write(
      `Member check passed: ${teams.length} entries. Photos and links are ready.\n`,
    );
} catch (error) {
  console.error(
    `Could not check members.js: ${error.message}. Check quotes, commas and the teams array.`,
  );
  process.exitCode = 1;
}
