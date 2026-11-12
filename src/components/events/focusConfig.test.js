import test from "node:test";
import assert from "node:assert/strict";
import { panelCarrier, PANEL_BADGE_X, MOBILE_BADGE_Y } from "./focusConfig.js";

const camera = {
  fov: 30,
  position: { y: 0.975, z: 13 },
  aspect: 1.44,
  zoom: 1,
};
const height = (camera) =>
  (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z) /
  camera.zoom;

test("details carrier places the resting desktop badge beside the panel", () => {
  const shift = panelCarrier(camera, 1, false);
  const screenX = 0.5 + shift.x / (height(camera) * camera.aspect);
  assert.ok(Math.abs(screenX - PANEL_BADGE_X) < 1e-12);
  assert.equal(shift.y, 0);
  assert.deepEqual(panelCarrier(camera, 0, false), { x: -0, y: 0 });
});

test("mobile badge stays above the bottom sheet at different camera zooms", () => {
  for (const zoom of [1, 0.62]) {
    const mobileCamera = { ...camera, zoom, aspect: 360 / 724 };
    const shift = panelCarrier(mobileCamera, 1, true);
    const badgeY = -0.65 + shift.y;
    const screenY = 0.5 - (badgeY - camera.position.y) / height(mobileCamera);
    assert.ok(Math.abs(screenY - MOBILE_BADGE_Y) < 1e-12);
    assert.equal(shift.x, 0);
  }
});
