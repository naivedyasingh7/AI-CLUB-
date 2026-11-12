# Events focus and details — phase 2

See [EVENTS_POLISH.md](EVENTS_POLISH.md) for the subsequent panel/HUD polish and
latest verification. Pixel resolve now runs on the badge face during its glide;
the thumbnail and standalone PixelReveal renderer described below were removed.

Branch: `feat/events-lanyard-gallery`. Open `/events.html`.

Activate a badge to centre it, dim the other passes and enable one physical rig.
The circular Event details button opens a right-hand panel while the same badge
moves aside and remains draggable. Below 768px, details use a bottom sheet.
Closing restores the saved gallery position and keyboard focus. Static passes
never mount a Physics provider. The loader and its session flag are unchanged.

## Changed files

| File | Reason |
| --- | --- |
| `src/hooks/useEventFocus.js` | State machine, named GSAP timelines, scroll lock, connector projection and restoration |
| `src/components/events/focusConfig.js` | Focus/panel/mobile/physics constants |
| `src/components/events/focusPhysicsLoader.js` | Cached lazy imports and WASM prewarming without a world |
| `src/components/events/InteractiveLanyard.jsx` | Exact-pose activation, offset-preserving drag, rope bounds, keyboard impulses and teardown |
| `src/components/events/EventsScene.jsx` | Pose capture, dimming, panel framing and physical-to-static closing blend |
| `src/components/events/EventsSection.jsx` | Focus controls, grip, connector and panel integration |
| `src/components/events/FocusDetailsPanel.jsx` | SplitType reveal, existing PixelReveal, focus trap, field fallbacks, registration |
| `src/components/events/focus.css` | Focus controls, desktop panel/mobile sheet, readable breadcrumb/counter backgrounds |
| `src/hooks/useSmoothHorizontalScroll.js` | Focus input lock and delayed pointer capture to distinguish touch taps/swipes |
| `src/components/events/galleryConfig.js` | Adds only the 8px touch swipe threshold; Phase 1 motion constants retained |
| `src/components/events/gallery.css` | Removes obsolete static Explore-control styling |
| `src/events-entry.jsx` | pagehide unmount, clean bfcache restore, HMR cleanup |
| `src/events-page.css` | Equal navigation line boxes and underline alignment |
| `vite.config.js` | Share nested Rapier runtime; narrow initialization/teardown compatibility fixes |
| `src/components/events/focusConfig.test.js` | Desktop/mobile camera-placement checks |
| Removed `EventDetailPanel.jsx`, `events.css` | Remove the old full-screen overlay and obsolete styles |

The local GLB, artwork, fabric, event data, `EventBadge.jsx`, `PixelReveal.jsx`
and loader files are unchanged. No dependency was added.

## Tunables

Main Phase 2 constants are at the top of `focusConfig.js`:

- `PANEL_SIDE = 'right'`, `PANEL_BADGE_X = 0.26`.
- Centre 0.85s; dim 0.55s; other opacity 0.35 and backward offset 1.5.
- Badge shift 0.7s; panel reveal 0.65s, exit 0.4s; text stagger 0.035s.
- Pixel resolve 0.8s; static blend 0.55s; gallery restore 0.75s.
- Mobile breakpoint 768px; zoom 0.62; badge screen height fraction 0.18.
- Physics step 1/60s; gravity -18; damping 2/2.4; rope length 0.75;
  drag follow 24; max drag 2.2; facing correction 0.4.
- Reduced motion: zero visual durations plus a 1ms GSAP completion tick;
  no idle sway or CSS pulse. Intentional dragging remains available.

Panel spacing, glow and the 54svh bottom-sheet height are in `focus.css`.
Colours use the existing CSS palette/event accents. Phase 1 smoothing and
parallax defaults remain in `galleryConfig.js`.

## Physics reference

Read [daffahaidar/interactive-3d-event-badge](https://github.com/daffahaidar/interactive-3d-event-badge),
especially `components/band.tsx`: fixed anchor, three rope joints of length 1,
spherical badge joint `[0, 1.45, 0]`, damping 2, offset-preserving pointer
projection, kinematic dragging, waking connected bodies and facing correction 0.25.

Our original rig adapts those mechanics to the existing 0.75 ropes and actual
hardware connector `[0, 1.6, 0.1]`. It retains the fabric ribbon, materials,
viewport/rope limits and pointer cancellation; adds persistent smoothing vectors,
zero-velocity handoff, rigid carrier movement preserving swing, and closing pose
blending. The reference's reconstructed per-frame smoothing vector was not used.

No licence file appeared in the inspected reference tree. No reference code,
assets, Next.js directives or dependencies were copied.

## Runtime compatibility

react-three-rapier 2.2.0 uses nested Rapier 0.19.2, different from the project's
top-level version. Prewarming resolves that same nested runtime.

Scoped Vite transforms pass embedded WASM through wasm-bindgen's options API
and defer world disposal until child body/joint cleanup, with a Strict Mode replay
guard and event-queue disposal. Immediate proxy reset otherwise allowed child
cleanup to create an orphan empty world. These adapters must be rechecked on
Rapier upgrades. Warnings are not suppressed; node_modules is not modified.

## Verified

- `npm run lint`, `npm run build`, and 12 Node tests pass. Vite reports its
  large-chunk advisory; physics WASM is separately lazy-loaded/prewarmed.
- Headless Windows Chrome/software WebGL at 360×844, 768×1000 and 1440×1000,
  default two passes and dev `?dummies=5` (six passes): Enter activation,
  zero initial velocities, exactly five focused bodies, dragging before/during
  details, responsive panel placement, Tab containment, close, restored focus,
  restored input-listener baseline, zero worlds/bodies after close. All six cases
  had no page errors or console warnings.
- Three consecutive focus/close cycles; cancellation during selection; close
  during panel opening; empty-space dismissal; reduced-motion completion.
- Home navigation and browser Back with details open: browsing restored, one
  gallery canvas, zero physical worlds/bodies and unlocked scrolling.
- Native CDP touch swipe, tap, physical drag/cancel and mobile close; focus-only
  touch-action restored to pan-y after closing. No page errors or warnings.
- Explicit pagehide/pageshow unmount/remount with details open: zero owned gallery
  animation frames, owned interaction listeners, physics worlds and canvases after
  unmount; clean browsing remount with one canvas and no world.
- Instrumented physics steps stopped while the gallery was offscreen and resumed
  when it returned. Production bundle checks passed at all three widths, including
  production dummy-flag gating and a reduced-motion focus/details/close cycle.
- Virtual QA-only event under React Strict Mode: registration URL, speakers,
  date formatting. No real event
  was added and no external registration page was opened or submitted.

Browser scripts, results and screenshots are outside the repository in the local
`ai-club-events-qa` artifact folder.

## Limits

The supplied events remain placeholders; their registration actions are
disabled. Register
requires a valid HTTP(S) URL. With WebGL unavailable, static images remain and
interaction controls are disabled.

Physical phones, Safari/Firefox, screen readers and real-GPU FPS are not verified.
Prewarming downloads WASM on Events-page mount, but creates no world until focus.
