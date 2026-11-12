import test from "node:test";
import assert from "node:assert/strict";
import { validateMembers, prepareMembers, PHOTO_SPEC } from "./memberModel.js";
import { memberCopy } from "./memberCopy.js";
import { imageSize } from "../../scripts/poster-metadata.mjs";

const MISSING = memberCopy.toBeAnnounced;

const baseTeam = {
  id: "technical",
  name: "Technical",
  lead: { id: "t-lead", name: "Lead (TBA)", role: "Team Lead" },
  members: [{ id: "t-m1", name: "Member (TBA)", role: "Member" }],
};

const validPhotos = {
  "square.png": { width: 800, height: 800, bytes: 1000 },
  "wide.png": { width: 800, height: 400, bytes: 1000 },
};

test("a valid team passes validation", () => {
  assert.deepEqual(validateMembers([baseTeam], validPhotos), {
    errors: [],
    warnings: [],
  });
});

test("validation names the team id and field for missing required fields", () => {
  const cases = [
    [{ ...baseTeam, id: "" }, "team 1", "\"id\""],
    [{ ...baseTeam, name: "" }, "technical", "\"name\""],
    [{ ...baseTeam, lead: { ...baseTeam.lead, name: "" } }, "technical", "t-lead", "\"name\""],
    [{ ...baseTeam, members: [{ ...baseTeam.members[0], role: "" }] }, "technical", "t-m1", "\"role\""],
  ];
  for (const [entry, teamId, ...parts] of cases) {
    const errors = validateMembers([entry], validPhotos).errors;
    assert.ok(
      errors.some((m) => m.startsWith(`${teamId}:`) || m.startsWith(`${teamId} /`)),
      `expected team ${teamId} in: ${JSON.stringify(errors)}`,
    );
    for (const part of parts) {
      assert.ok(errors.some((m) => m.includes(part)), `expected ${part} in: ${JSON.stringify(errors)}`);
    }
  }
});

test("duplicate team ids are rejected", () => {
  const errors = validateMembers([baseTeam, { ...baseTeam, id: "technical" }], validPhotos).errors;
  assert.ok(errors.some((m) => m.includes("technical") && m.includes("duplicated")));
});

test("duplicate person ids across teams are rejected unless shared", () => {
  const shared = { id: "shared-1", name: "Shared (TBA)", role: "Member", shared: true };
  const ok = validateMembers(
    [
      { ...baseTeam, id: "alpha", lead: { id: "alpha-lead", name: "L", role: "Lead" }, members: [shared] },
      { ...baseTeam, id: "beta", lead: { id: "beta-lead", name: "L", role: "Lead" }, members: [{ ...shared }] },
    ],
    validPhotos,
  );
  assert.deepEqual(ok.errors, []);

  const duped = validateMembers(
    [
      { ...baseTeam, id: "alpha", lead: { id: "alpha-lead", name: "L", role: "Lead" }, members: [{ id: "dup-1", name: "Dup (TBA)", role: "Member" }] },
      { ...baseTeam, id: "beta", lead: { id: "beta-lead", name: "L", role: "Lead" }, members: [{ id: "dup-1", name: "Dup (TBA)", role: "Member" }] },
    ],
    validPhotos,
  );
  assert.ok(duped.errors.some((m) => m.includes("duplicated across teams")));
});

test("linkedin and github must be https on the expected host", () => {
  const badLinkedin = {
    ...baseTeam,
    members: [{ ...baseTeam.members[0], linkedin: "http://linkedin.com/in/x" }],
  };
  assert.ok(
    validateMembers([badLinkedin], validPhotos).errors.some((m) => m.includes("linkedin")),
  );
  const badGithub = {
    ...baseTeam,
    members: [{ ...baseTeam.members[0], github: "https://gitlab.com/x" }],
  };
  assert.ok(
    validateMembers([badGithub], validPhotos).errors.some((m) => m.includes("github")),
  );
  const good = {
    ...baseTeam,
    members: [
      {
        ...baseTeam.members[0],
        linkedin: "https://linkedin.com/in/x",
        github: "https://github.com/x",
      },
    ],
  };
  assert.deepEqual(validateMembers([good], validPhotos).errors, []);
});

test("photo must exist and be roughly square", () => {
  const withPhoto = {
    ...baseTeam,
    lead: { ...baseTeam.lead, photo: "missing.png" },
  };
  assert.ok(
    validateMembers([withPhoto], validPhotos).errors.some((m) => m.includes("photo")),
  );
  const wide = {
    ...baseTeam,
    lead: { ...baseTeam.lead, photo: "wide.png" },
  };
  assert.ok(
    validateMembers([wide], validPhotos).errors.some((m) => m.includes("square")),
  );
});

test("non-square tolerance boundary", () => {
  const photos = { "ok.png": { width: 800, height: 750, bytes: 1000 } }; // ratio 1.066
  const team = { ...baseTeam, lead: { ...baseTeam.lead, photo: "ok.png" } };
  assert.deepEqual(validateMembers([team], photos).errors, []);
});

test("imageSize reads PNG headers", () => {
  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
  png.writeUInt32BE(800, 16);
  png.writeUInt32BE(800, 20);
  assert.deepEqual(imageSize(png, "photo.png"), { width: 800, height: 800 });
});

test("prepareMembers falls back missing lead to To be announced", () => {
  const [result] = prepareMembers([{ ...baseTeam, lead: undefined }]);
  assert.equal(result.lead.name, MISSING);
  assert.equal(result.coLead, null);
});

test("prepareMembers hides previews in production unless none are real", () => {
  const real = { ...baseTeam, id: "real", placeholder: false };
  const preview = { ...baseTeam, id: "preview", placeholder: true };
  assert.deepEqual(
    prepareMembers([preview, real]).map((t) => t.id),
    ["real"],
  );
  assert.deepEqual(
    prepareMembers([preview]).map((t) => t.id),
    ["preview"],
  );
  assert.deepEqual(
    prepareMembers([preview, real], { development: true }).map((t) => t.id),
    ["preview", "real"],
  );
});

test("prepareMembers resolves photo URLs by filename only", () => {
  const withPhoto = {
    ...baseTeam,
    lead: { ...baseTeam.lead, photo: "square.png" },
  };
  const [result] = prepareMembers([withPhoto], {
    resolvePhoto: (n) => `/photos/${n}`,
  });
  assert.equal(result.lead.photoSrc, "/photos/square.png");
});

test("PHOTO_SPEC limits", () => {
  assert.equal(PHOTO_SPEC.maxBytes, 150 * 1024);
  assert.equal(PHOTO_SPEC.aspectTolerance, 0.25);
});
