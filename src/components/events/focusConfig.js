export const PANEL_SIDE = "right";
export const FOCUS_CENTRE_DURATION = 0.85;
export const FOCUS_DIM_DURATION = 0.55;
export const FOCUS_DIM_DELAY = 0.08;
export const OTHERS_OPACITY = 0.35;
export const OTHERS_BACK = 1.5;
export const BADGE_SHIFT_DURATION = 0.7;
export const PANEL_REVEAL_DURATION = 0.65;
export const PANEL_EXIT_DURATION = 0.4;
export const PANEL_TEXT_STAGGER = 0.035;
export const PANEL_TEXT_DURATION = 0.45;
export const PANEL_TEXT_DELAY = 0.18;
export const PANEL_FOCUS_DELAY = 0.08;
export const PIXEL_RESOLVE_DURATION = 0.8;
export const PIXEL_RESOLVE_SIZE = 38;
export const STATIC_BLEND_DURATION = 0.55;
export const HANDOFF_RENDER_DELAY = 0.05;
export const GALLERY_RESTORE_DURATION = 0.75;
export const FOCUS_EASE = "power2.inOut";
export const PANEL_BADGE_X = 0.26;
export const MOBILE_BREAKPOINT = 768;
export const MOBILE_PANEL_ZOOM = 0.62;
export const MOBILE_BADGE_Y = 0.18;
export const DETAIL_BUTTON_GAP = 72;
export const DETAIL_BUTTON_RADIUS = 26;
export const PHYSICS_TIMESTEP = 1 / 60;
export const PHYSICS_GRAVITY = -18;
export const LINEAR_DAMPING = 2;
export const ANGULAR_DAMPING = 2.4;
export const ROPE_LENGTH = 0.75;
export const CONNECTOR = [0, 1.6, 0.1];
export const JOINT_MASS = 0.08;
export const BADGE_MASS = 1;
export const MAX_DRAG = 2.2;
export const DRAG_FOLLOW = 24;
export const FACING_SPRING = 0.4;
export const JOINT_FOLLOW_MIN = 10;
export const JOINT_FOLLOW_MAX = 50;
export const EMPTY_CLICK_SLOP = 8;
// Give GSAP a completion tick when every visual duration is zero.
export const REDUCED_TRANSITION_TICK = 0.001;

export function panelCarrier(camera, progress, mobile) {
  const height =
    (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z) /
    camera.zoom;
  return {
    x: mobile
      ? 0
      : (PANEL_SIDE === "right" ? PANEL_BADGE_X - 0.5 : 0.5 - PANEL_BADGE_X) *
        height *
        camera.aspect *
        progress,
    y: mobile
      ? (camera.position.y + (0.5 - MOBILE_BADGE_Y) * height + 0.65) * progress
      : 0,
  };
}
