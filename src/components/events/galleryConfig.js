// Reference defaults: davidfaure/horizontal-parallax-gallery-codrops, DOM and WebGL.
export const SCROLL_EASE = 0.07;
export const REFERENCE_DOM_SHIFT_PERCENT = 10;
export const REFERENCE_DOM_IMAGE_SCALE = 1.25;
export const PARALLAX_INTENSITY = 0.4;
export const POSTER_UV_SCALE = 0.85;
export const SHADER_MULTIPLIER = 1.0;
export const SLOT_WIDTH_VW = 0.6;
export const DEPTH_FACTORS = [1.08, 0.92, 1.04, 0.96];
export const LABEL_PARALLAX = 0.6;
export const RAIL_PARALLAX = 1;
export const SWAY_STIFFNESS = 45;
export const SWAY_DAMPING = 10;
export const SWAY_STRENGTH = 0.00011;
export const SWAY_MAX_ANGLE = 0.16;
export const IDLE_SWAY = 0.009;
export const IDLE_FREQUENCY = 0.75;
export const DPR_CAP = 2;
export const CAMERA_FOV = 30;
export const CAMERA_FILL = 0.78;
export const CAMERA_VERTICAL_OFFSET = -0.45;
export const CAMERA_SAFE_WIDTH = 3.5;
export const VELOCITY_REFERENCE_WIDTH = 1440;
export const STRAP_ACCENT_MIX = 0.14;
export const MAX_FRAME_DELTA = 0.05;
export const VELOCITY_EASE = 0.2;
export const WHEEL_LINE_PIXELS = 16;
export const SCROLL_SNAP_EPSILON = 0.02;
export const DEV_DUMMY_LIMIT = 20;

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const frameEase = (ease, dt) => 1 - (1 - ease) ** (dt * 60);

// Closed-form solution for an underdamped spring; no numerical physics world.
export function advanceSway(state, target, dt) {
  const halfDamping = SWAY_DAMPING / 2;
  const frequency = Math.sqrt(SWAY_STIFFNESS - halfDamping ** 2);
  const decay = Math.exp(-halfDamping * dt);
  const sine = Math.sin(frequency * dt),
    cosine = Math.cos(frequency * dt);
  const offset = state.angle - target,
    velocity = state.velocity;
  state.angle =
    target +
    decay *
      (offset * cosine +
        ((velocity + halfDamping * offset) / frequency) * sine);
  state.velocity =
    decay *
    (velocity * cosine -
      ((halfDamping * velocity + SWAY_STIFFNESS * offset) / frequency) * sine);
}

export function galleryMetrics(width, count) {
  const slot = width * SLOT_WIDTH_VW;
  const overflow = count * slot > width + 1;
  return {
    width,
    slot,
    overflow,
    max: overflow ? Math.max(0, (count - 1) * slot) : 0,
    origin: overflow ? width / 2 : (width - Math.max(0, count - 1) * slot) / 2,
  };
}
