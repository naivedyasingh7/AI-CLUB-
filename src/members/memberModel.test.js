import test from "node:test";
import assert from "node:assert/strict";
import {
  validateMembers,
  prepareMembers,
  prepareBoard,
  BOARD_PHOTO_SPEC,
} from "./memberModel.js";
import { memberCopy } from "./memberCopy.js";
import { imageSize } from "../../scripts/poster-metadata.mjs";

const MISSING = memberCopy.toBeAnnounced;

const baseTeam = {
  id: "technical",
  name: "Technical",
  lead: { id: "t-lead", name: "Lead (TBA)", role: "Team Lead" },
  members: [{ id: "t-m1", name: "Member (TBA)", role: "Member" }],
};

const baseBoard = [
  {
    id: "president",
    name: "President (TBA)",
    designation: "Club President",
  },
];

const validPhotos = {
  "portrait.webp": { width: 1000, height: 1250, bytes: 50 * 1024 },
  "wide.png": { width: 800, height: 400, bytes: 1000 },
};

test("a valid team and board pass validation", () => {
  assert.deepEqual(validateMembers([baseTeam], baseBoard, validPhotos), {
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
    const errors = validateMembers([entry], baseBoard, validPhotos).errors;
    assert.ok(
      errors.some((m) => m.startsWith(`${teamId}:`) || m.startsWith(`${teamId} /`)),
      `expected team ${teamId} in: ${JSON.stringify(errors)}`,
    );
    for (const part of parts) {
      assert.ok(errors.some((m) => m.includes(part)), `expected ${part} in: ${JSON.stringify(errors)}`);
    }
  }
});

test("board validation checks required fields and unique ids", () => {
  const missingId = [{ ...baseBoard[0], id: "" }];
  assert.ok(
    validateMembers([baseTeam], missingId, validPhotos).errors.some((m) =>
      m.includes("id"),
    ),
  );

  const missingName = [{ ...baseBoard[0], name: "" }];
  assert.ok(
    validateMembers([baseTeam], missingName, validPhotos).errors.some((m) =>
      m.includes("name"),
    ),
  );

  const missingDesig = [{ ...baseBoard[0], designation: "" }];
  assert.ok(
    validateMembers([baseTeam], missingDesig, validPhotos).errors.some((m) =>
      m.includes("designation"),
    ),
  );

  const dupBoard = [baseBoard[0], { ...baseBoard[0] }];
  assert.ok(
    validateMembers([baseTeam], dupBoard, validPhotos).errors.some((m) =>
      m.includes("duplicated"),
    ),
  );
});

test("duplicate team ids are rejected", () => {
  const errors = validateMembers([baseTeam, { ...baseTeam, id: "technical" }], baseBoard, validPhotos).errors;
  assert.ok(errors.some((m) => m.includes("technical") && m.includes("duplicated")));
});

test("duplicate person ids across teams are rejected unless shared", () => {
  const shared = { id: "shared-1", name: "Shared (TBA)", role: "Member", shared: true };
  const ok = validateMembers(
    [
      { ...baseTeam, id: "alpha", lead: { id: "alpha-lead", name: "L", role: "Lead" }, members: [shared] },
      { ...baseTeam, id: "beta", lead: { id: "beta-lead", name: "L", role: "Lead" }, members: [{ ...shared }] },
    ],
    baseBoard,
    validPhotos,
  );
  assert.deepEqual(ok.errors, []);

  const duped = validateMembers(
    [
      { ...baseTeam, id: "alpha", lead: { id: "alpha-lead", name: "L", role: "Lead" }, members: [{ id: "dup-1", name: "Dup (TBA)", role: "Member" }] },
      { ...baseTeam, id: "beta", lead: { id: "beta-lead", name: "L", role: "Lead" }, members: [{ id: "dup-1", name: "Dup (TBA)", role: "Member" }] },
    ],
    baseBoard,
    validPhotos,
  );
  assert.ok(duped.errors.some((m) => m.includes("duplicated across teams")));
});

test("person shared across board and team must have consistent details", () => {
  const consistent = validateMembers(
    [
      {
        ...baseTeam,
        lead: { id: "alex", name: "Alex", role: "Lead", linkedin: "https://linkedin.com/in/alex" },
      },
    ],
    [
      {
        id: "alex",
        name: "Alex",
        designation: "President",
        linkedin: "https://linkedin.com/in/alex",
      },
    ],
    validPhotos,
  );
  assert.deepEqual(consistent.errors, []);

  const inconsistent = validateMembers(
    [
      {
        ...baseTeam,
        lead: { id: "alex", name: "Alex", role: "Lead", linkedin: "https://linkedin.com/in/alex" },
      },
    ],
    [
      {
        id: "alex",
        name: "Different Name",
        designation: "President",
      },
    ],
    validPhotos,
  );
  assert.ok(inconsistent.errors.some((m) => m.includes("differ")));
});

test("team persons must NOT have photos", () => {
  const leadWithPhoto = {
    ...baseTeam,
    lead: { ...baseTeam.lead, photo: "portrait.webp" },
  };
  const memberWithPhoto = {
    ...baseTeam,
    members: [{ ...baseTeam.members[0], photo: "portrait.webp" }],
  };

  const res1 = validateMembers([leadWithPhoto], baseBoard, validPhotos);
  assert.ok(
    res1.errors.some((m) => m.includes("photo") && m.includes("not allowed")),
  );

  const res2 = validateMembers([memberWithPhoto], baseBoard, validPhotos);
  assert.ok(
    res2.errors.some((m) => m.includes("photo") && m.includes("not allowed")),
  );
});

test("linkedin and github must be https on the expected host", () => {
  const badLinkedin = {
    ...baseTeam,
    members: [{ ...baseTeam.members[0], linkedin: "http://linkedin.com/in/x" }],
  };
  assert.ok(
    validateMembers([badLinkedin], baseBoard, validPhotos).errors.some((m) => m.includes("linkedin")),
  );
  const badGithub = {
    ...baseTeam,
    members: [{ ...baseTeam.members[0], github: "https://gitlab.com/x" }],
  };
  assert.ok(
    validateMembers([badGithub], baseBoard, validPhotos).errors.some((m) => m.includes("github")),
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
  assert.deepEqual(validateMembers([good], baseBoard, validPhotos).errors, []);
});

test("board photos must exist and be close to 4:5 portrait", () => {
  const fourByFive = { width: 1000, height: 1250, bytes: 50 * 1024 };
  const wide = { width: 800, height: 400, bytes: 1000 };
  const photos = { "ok.webp": fourByFive, "wrong.png": wide };

  const ok = [{ ...baseBoard[0], photo: "ok.webp" }];
  const wrong = [{ ...baseBoard[0], photo: "wrong.png" }];
  const missing = [{ ...baseBoard[0], photo: "not-found.webp" }];

  assert.deepEqual(validateMembers([baseTeam], ok, photos).errors, []);
  assert.ok(
    validateMembers([baseTeam], wrong, photos).errors.some((m) => m.includes("4:5") || m.includes("portrait")),
  );
  assert.ok(
    validateMembers([baseTeam], missing, photos).errors.some((m) => m.includes("not found")),
  );
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

test("prepareBoard sorts by order, resolves photo and filters placeholders", () => {
  const b1 = { id: "b1", name: "B1", designation: "D1", order: 2, photo: "b1.webp" };
  const b2 = { id: "b2", name: "B2", designation: "D2", order: 1 };
  const bPlaceholder = { id: "bp", name: "BP", designation: "DP", placeholder: true };

  const prepared = prepareBoard([b1, b2, bPlaceholder], {
    development: false,
    resolvePhoto: (f) => `/assets/${f}`,
  });

  assert.equal(prepared.length, 2);
  assert.equal(prepared[0].id, "b2");
  assert.equal(prepared[1].id, "b1");
  assert.equal(prepared[1].photoSrc, "/assets/b1.webp");
});

test("BOARD_PHOTO_SPEC limits", () => {
  assert.equal(BOARD_PHOTO_SPEC.width, 1000);
  assert.equal(BOARD_PHOTO_SPEC.height, 1250);
  assert.equal(BOARD_PHOTO_SPEC.maxBytes, 200 * 1024);
  assert.equal(BOARD_PHOTO_SPEC.aspectTolerance, 0.10);
});
