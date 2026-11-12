import test from "node:test";
import assert from "node:assert/strict";
import {
  SCROLL_EASE,
  frameEase,
  advanceSway,
  galleryMetrics,
  DEV_DUMMY_LIMIT,
} from "./galleryConfig.js";
import { events as entries } from "../../events/events.js";
import { eventsForGallery, prepareEvents } from "../../events/eventModel.js";
const events = prepareEvents(entries, { development: true });

test("scroll smoothing covers the same distance at 60 and 144Hz", () => {
  const advance = (hz) => {
    let value = 0;
    for (let i = 0; i < hz; i++)
      value += (1000 - value) * frameEase(SCROLL_EASE, 1 / hz);
    return value;
  };
  assert.ok(Math.abs(advance(60) - advance(144)) < 1e-8);
});
test("analytic spring is frame independent and settles without a physics engine", () => {
  const advance = (hz) => {
    const state = { angle: 0, velocity: 0 };
    for (let i = 0; i < hz; i++) advanceSway(state, 0.1, 1 / hz);
    return state;
  };
  const a = advance(60),
    b = advance(144);
  assert.ok(Math.abs(a.angle - b.angle) < 1e-10);
  assert.ok(Math.abs(a.velocity - b.velocity) < 1e-10);
  for (let i = 0; i < 600; i++) advanceSway(a, 0, 1 / 60);
  assert.ok(Math.abs(a.angle) < 1e-10);
});
test("fitting content is centred with no scroll; multiple slots centre at both bounds", () => {
  for (const width of [360, 768, 1440]) {
    const single = galleryMetrics(width, 1);
    assert.equal(single.overflow, false);
    assert.equal(single.max, 0);
    assert.equal(single.origin, width / 2);
    const many = galleryMetrics(width, 6);
    assert.equal(many.max, 5 * width * 0.6);
    assert.equal(many.origin + 5 * many.slot - many.max, width / 2);
    assert.equal(galleryMetrics(width, 0).max, 0);
  }
});
test("dummy expansion is opt-in for development and bounded; production ignores it", () => {
  assert.equal(events.length, 2);
  assert.equal(eventsForGallery(events, "?dummies=5", false), events);
  const expanded = eventsForGallery(events, "?dummies=5", true);
  assert.equal(expanded.length, 6);
  assert.equal(new Set(expanded.map((e) => e.id)).size, 6);
  assert.ok(
    expanded.every(
      (e) => e.isPlaceholder && e.startsAt === null && e.venue === null,
    ),
  );
  assert.equal(
    eventsForGallery(events, "?dummies=999", true).length,
    DEV_DUMMY_LIMIT + 1,
  );
  assert.equal(eventsForGallery(events, "?dummies=-1", true), events);
});
