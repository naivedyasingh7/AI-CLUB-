import test from "node:test";
import assert from "node:assert/strict";
import {
  parseEventDate,
  eventDates,
  statusAt,
  prepareEvents,
  validateEvents,
  POSTER_SPEC,
} from "./eventModel.js";
import { imageSize } from "../../scripts/poster-metadata.mjs";

const valid = { id: "fixture", title: "Test event", start: "2026-12-12 10:00" };

test("India wall-clock input is independent of the host timezone and defaults to two hours", () => {
  assert.equal(parseEventDate(valid.start), Date.parse("2026-12-12T04:30:00Z"));
  assert.deepEqual(eventDates(valid), {
    start: Date.parse("2026-12-12T04:30:00Z"),
    end: Date.parse("2026-12-12T06:30:00Z"),
  });
  for (const invalid of [
    "2026-02-30 10:00",
    "2026-13-12 10:00",
    "2026-12-12 24:00",
    "2026-12-12 10:60",
    "2026-12-12T10:00:00Z",
    "12/12/2026 10:00",
  ])
    assert.equal(parseEventDate(invalid), null, invalid);
});

test("live and past boundaries use the supplied or default end", () => {
  const { start, end } = eventDates(valid);
  assert.equal(statusAt(valid, start - 1), "upcoming");
  assert.equal(statusAt(valid, start), "live");
  assert.equal(statusAt(valid, end), "live");
  assert.equal(statusAt(valid, end + 1), "past");
  assert.equal(eventDates({ ...valid, end: "2026-12-12 09:00" }), null);
});

test("automatic order is live, upcoming soonest, then past newest", () => {
  const make = (id, start, end) => ({ ...valid, id, start, end });
  const list = [
    make("old", "2026-12-10 10:00"),
    make("far", "2026-12-14 10:00"),
    make("recent", "2026-12-11 10:00"),
    make("near", "2026-12-13 10:00"),
    make("live", "2026-12-12 10:00"),
  ];
  const result = prepareEvents(list, {
    now: parseEventDate("2026-12-12 11:00"),
  });
  assert.deepEqual(
    result.map((e) => e.id),
    ["live", "near", "far", "recent", "old"],
  );
});

test("previews remain when alone, disappear beside a real production event, and stay in dev", () => {
  const preview = {
    id: "preview",
    title: "Preview",
    start: null,
    placeholder: true,
  };
  assert.equal(prepareEvents([preview]).length, 1);
  assert.deepEqual(
    prepareEvents([preview, valid]).map((e) => e.id),
    ["fixture"],
  );
  assert.equal(
    prepareEvents([preview, valid], { development: true }).length,
    2,
  );
  assert.deepEqual(validateEvents([preview]).errors, []);
  assert.ok(
    validateEvents([{ ...preview, start: undefined }]).errors.some((e) =>
      e.includes('"start"'),
    ),
  );
});

test("optional fields fall back without creating registration or artwork URLs", () => {
  const [result] = prepareEvents([valid]);
  assert.equal(result.tagline, "To be announced");
  assert.equal(result.group, "To be announced");
  assert.equal(result.description, "To be announced");
  assert.equal(result.registrationUrl, null);
  assert.equal(result.posterSrc, null);
  assert.equal(result.accent, "#ff8c00");
  const [withPoster] = prepareEvents(
    [{ ...valid, poster: "fixture.webp", accent: "cyan" }],
    { resolvePoster: (n) => "/resolved/" + n },
  );
  assert.equal(withPoster.badgeFront, "/resolved/fixture.webp");
  assert.equal(withPoster.accent, "#00bcd4");
});

test("validation names each failing field and keeps unrelated checks", () => {
  const cases = [
    [{ ...valid, id: "" }, '"id"'],
    [{ ...valid, title: "" }, '"title"'],
    [{ ...valid, start: undefined }, '"start"'],
    [{ ...valid, start: "tomorrow" }, '"start"'],
    [{ ...valid, end: "tomorrow" }, '"end"'],
    [{ ...valid, end: "2026-12-11 10:00" }, '"end" is before "start"'],
    [{ ...valid, accent: "purple" }, '"accent"'],
    [{ ...valid, poster: "missing.webp" }, '"poster"'],
  ];
  for (const [entry, part] of cases)
    assert.ok(
      validateEvents([entry]).errors.some((message) => message.includes(part)),
      part,
    );
  assert.ok(
    validateEvents([valid, valid]).errors.some((message) =>
      message.includes("duplicated"),
    ),
  );
  assert.ok(
    validateEvents([{ ...valid, poster: "square.png" }], {
      "square.png": { width: 100, height: 100 },
    }).errors.some((message) => message.includes("wrong shape")),
  );
  assert.equal(
    validateEvents([{ ...valid, poster: "portrait.webp" }], {
      "portrait.webp": POSTER_SPEC,
    }).errors.length,
    0,
  );
});

test("poster metadata reads SVG, PNG, JPEG and the three WebP headers", () => {
  assert.deepEqual(
    imageSize(
      Buffer.from('<svg width="820" height="1070"></svg>'),
      "poster.svg",
    ),
    { width: 820, height: 1070 },
  );
  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
  png.writeUInt32BE(820, 16);
  png.writeUInt32BE(1070, 20);
  assert.deepEqual(imageSize(png, "poster.png"), { width: 820, height: 1070 });
  const jpg = Buffer.alloc(14);
  jpg[0] = 255;
  jpg[1] = 216;
  jpg[2] = 255;
  jpg[3] = 192;
  jpg.writeUInt16BE(12, 4);
  jpg.writeUInt16BE(1070, 7);
  jpg.writeUInt16BE(820, 9);
  assert.deepEqual(imageSize(jpg, "poster.jpg"), { width: 820, height: 1070 });
  for (const kind of ["VP8X", "VP8 ", "VP8L"]) {
    const webp = Buffer.alloc(32);
    webp.write("RIFF", 0);
    webp.write("WEBP", 8);
    webp.write(kind, 12);
    if (kind === "VP8X") {
      webp.writeUIntLE(819, 24, 3);
      webp.writeUIntLE(1069, 27, 3);
    }
    if (kind === "VP8 ") {
      webp.writeUInt16LE(820, 26);
      webp.writeUInt16LE(1070, 28);
    }
    if (kind === "VP8L") webp.writeUInt32LE(819 | (1069 << 14), 21);
    assert.deepEqual(imageSize(webp, "poster.webp"), {
      width: 820,
      height: 1070,
    });
  }
});

test("malformed optional fields are rejected and safe preview normalization cannot crash the panel", () => {
  const malformed = {
    ...valid,
    description: { text: "oops" },
    speakers: "Someone",
    placeholder: "false",
    registerUrl: "javascript:alert(1)",
  };
  const result = validateEvents([malformed]);
  for (const field of [
    '"description"',
    '"speakers"',
    '"placeholder"',
    '"registerUrl"',
  ])
    assert.ok(result.errors.some((message) => message.includes(field)));
  const [safe] = prepareEvents([malformed], { development: true });
  assert.equal(safe.description, "To be announced");
  assert.deepEqual(safe.speakers, []);
  assert.equal(safe.registrationUrl, null);
});
