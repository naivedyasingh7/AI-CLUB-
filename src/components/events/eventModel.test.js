import test from "node:test";
import assert from "node:assert/strict";
import {
  eventStatus,
  eventTimes,
  galleryLayout,
  interactionReducer,
  safeEventUrl,
} from "./eventModel.js";
const event = {
  id: "fixture",
  title: "Test, not an announced event",
  description: "line one\nline two; escaped",
  start: "2027-01-01T10:00:00+05:30",
  end: "2027-01-01T11:00:00+05:30",
  timeZone: "Asia/Kolkata",
};
test("lifecycle uses explicit offsets and preserves start/end boundaries", () => {
  const { start, end } = eventTimes(event);
  assert.equal(start, Date.parse("2027-01-01T04:30:00Z"));
  assert.equal(eventStatus(event, start - 1), "UPCOMING");
  assert.equal(eventStatus(event, start), "LIVE NOW");
  assert.equal(eventStatus(event, end), "LIVE NOW");
  assert.equal(eventStatus(event, end + 1), "PAST");
});
test("ambiguous, missing, reversed dates and previews are never announced as live", () => {
  for (const value of [
    {},
    { ...event, start: "2027-01-01 10:00" },
    { ...event, end: "2020-01-01T00:00:00Z" },
  ])
    assert.equal(eventTimes(value), null);
  assert.equal(eventStatus({}), "TO BE ANNOUNCED");
  assert.equal(
    eventStatus({ ...event, development: true }),
    "DEVELOPMENT PREVIEW",
  );
});
test("rapid or invalid interaction actions cannot skip stages", () => {
  let state = { mode: "BROWSING", selectedId: null };
  state = interactionReducer(state, { type: "SELECT", id: "fixture" });
  assert.equal(interactionReducer(state, { type: "EXPLORE" }), state);
  assert.equal(
    interactionReducer(state, { type: "SELECT", id: "other" }),
    state,
  );
  for (const type of [
    "SETTLED",
    "EXPLORE",
    "OPENED",
    "CLOSE",
    "CLOSED",
    "RETURN",
    "RETURNED",
  ])
    state = interactionReducer(state, { type });
  assert.equal(state.mode, "BROWSING");
  assert.equal(state.selectedId, "fixture");
});
test("layout handles zero, one, two and many passes; actions reject script URLs", () => {
  for (const count of [0, 1, 2, 10, 30]) {
    const layout = galleryLayout(count);
    assert.ok(Number.isFinite(layout.radius));
    assert.ok(Number.isFinite(layout.step));
  }
  assert.ok(galleryLayout(20).radius > galleryLayout(1).radius);
  assert.equal(safeEventUrl("javascript:alert(1)"), null);
  assert.equal(safeEventUrl("#"), null);
  assert.equal(
    safeEventUrl("https://example.org/event"),
    "https://example.org/event",
  );
});

test("impossible dates are rejected and a known start supports a countdown without inventing an end", () => {
  assert.equal(eventTimes({ ...event, start: "2027-02-30T10:00:00Z" }), null);
  const partial = { ...event, end: null };
  const dates = eventTimes(partial);
  assert.equal(eventStatus(partial, dates.start - 1), "UPCOMING");
  assert.equal(eventStatus(partial, dates.start), "END TIME TO BE CONFIRMED");
});
