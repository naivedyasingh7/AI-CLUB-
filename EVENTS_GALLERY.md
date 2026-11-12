# Horizontal lanyard gallery — phase 1

Historical Phase 1 notes. See [EVENTS_PHASE2.md](EVENTS_PHASE2.md) for the current
focus, physics and details flow and its verification.

Branch: `feat/events-lanyard-gallery`. Open `/events.html`. The dedicated page now
contains a horizontally browsable archive, reusing the existing local GLB,
laminated shell, hardware, artwork, woven fabric and product lighting.

The loader, its session flag, home navigation and existing home-page scrolling
scripts are unchanged. No dependency was added. The gallery imports neither
Rapier nor the old interactive/detail scene. Their source remains available for
phase 2, but no physics world, WASM download or details dialog is initialized here.
Each pass has a real button labelled `Open event: <title>`; activation is an
intentional no-op in this phase.

## Reference study

Inspected both HTML entry points, `src/main.ts`, the DOM gallery, `GL.ts`,
`GLMedia.ts`, both shaders, CSS, math helpers, README and MIT licence in
[David Faure's Codrops repository](https://github.com/davidfaure/horizontal-parallax-gallery-codrops).
The README links [the live demo](https://tympanus.net/Tutorials/HorizontalParallaxGallery/).

Actual source defaults:

| Source | Value / calculation |
| --- | --- |
| `src/main.ts` (both versions) | `ease: 0.07`; clamp target to content limit; interpolate current toward target each frame |
| DOM `src/gallery/index.ts` | Normalize centre distance by half the viewport, clamp to ±1, shift image by `-t * 10%` |
| DOM CSS | Image width 125%, left -12.5% |
| WebGL `GL.ts`, `GLMedia.ts` | Parallax intensity 0.4; UV scale 0.85; shader multiplier 1.0 |
| WebGL parallax | Centre distance divided by full viewport width, multiplied by intensity |
| Fragment shader | Add horizontal parallax, then scale UV around its centre |
| Renderer | DPR capped at 2 |

This is an original hook/component adaptation, credited at the hook's first line.
No reference class, DOM-query lifecycle, image, or GLSL source was copied.
There is no per-image DOM-to-WebGL measurement synchronization. Scroll pixels
are converted directly to scene units using the camera frustum and viewport.
Our per-pass texture clones preserve the reference's UV order, with travel
additionally clamped to the available crop margin to avoid edge smearing.

## Data and development previews

`src/data/events.js` includes `id`, `title`, `tagline`, `startsAt`, `venue`,
`group`, `posterSrc`, `accent` and `isPlaceholder`. Existing detail fields are
retained for later integration. Both current entries are explicitly previews:
“The next chapter.” and “Workshop Slot (TBA)”. No dates or venues were invented.
The dummy SVG embeds the original club logo unchanged; orange/cyan are its
existing colours. All runtime images and models are local.

Under `npm run dev`, `/events.html?dummies=5` keeps The next chapter and produces
five distinct workshop placeholders (six passes total). Expansion is capped at
20 dummies. Production ignores the query and always uses the configured data.

## Motion and controls

- All inputs feed one bounded target: wheel, horizontal trackpad, horizontal
  touch swipe, arrows, Home/End, previous/next, and mouse drag on empty space.
- The reusable hook uses `1 - (1 - 0.07)^(dt * 60)` for frame-independent lerp.
  It normalizes wheel line/page units, handles pointer capture/cancellation,
  observes viewport resizing, and releases all owned listeners/observers/rAF.
- Slots are 60vw. The first/last pass can be centred at the scroll bounds. A
  fitting collection is centred as a group, with zero scroll range.
- The rail moves at 1x; alternating pass factors are 1.08/0.92/1.04/0.96; faint
  background numbers move at 0.6x. Artwork sampling offsets follow screen x.
- Each assembly swings about its rail anchor using a closed-form damped spring
  driven by smoothed scroll velocity. A tiny idle sway remains. No physics
  engine is used. A curved, textured ribbon keeps the band attached to the clip.
- Reduced motion disables sway and makes target changes immediate. Rendering
  and the scroll rAF pause offscreen; the hook also handles document visibility.
- DOM buttons follow projected badge poses. Keyboard focus brings a pass into
  view. No essential action relies on raycasting or Three.js text.

## Tunables

All gallery defaults are named constants at the top of
`src/components/events/galleryConfig.js`:

| Constant | Default |
| --- | --- |
| `SCROLL_EASE` | 0.07 at 60Hz |
| `SLOT_WIDTH_VW` | 0.6 |
| `DEPTH_FACTORS` | 1.08, 0.92, 1.04, 0.96 |
| `RAIL_PARALLAX` / `LABEL_PARALLAX` | 1 / 0.6 |
| `PARALLAX_INTENSITY` / `POSTER_UV_SCALE` / `SHADER_MULTIPLIER` | 0.4 / 0.85 / 1 |
| `SWAY_STIFFNESS` / `SWAY_DAMPING` | 45 / 10 |
| `SWAY_STRENGTH` / `SWAY_MAX_ANGLE` | 0.00011 / 0.16 radians |
| `IDLE_SWAY` / `IDLE_FREQUENCY` | 0.009 radians / 0.75 |
| `VELOCITY_EASE` | 0.2 |
| `DPR_CAP` | 2 |
| `CAMERA_FOV` / `CAMERA_FILL` | 30° / 0.78 |

Other constants control camera margins, wheel normalization, maximum visual
delta, snap tolerance, accent mixing and the dev dummy limit. Existing physical
model dimensions/material values remain in `eventModel.js` / `EventBadge.jsx`.

## Exact changed files

- `src/hooks/useSmoothHorizontalScroll.js`: reusable input/lerp/lifecycle hook.
- `src/components/events/galleryConfig.js`: constants, layout and analytic math.
- `src/components/events/EventsSection.jsx`: gallery shell, DOM controls/buttons,
  reduced motion, visibility, fallbacks; old selection/details imports removed.
- `src/components/events/EventsScene.jsx`: horizontal rail, shared 3D passes,
  parallax and analytic sway; physics import removed.
- `src/components/events/EventBadge.jsx`: reuse GLB/materials; optional owned
  UV-transform textures and `posterSrc` support.
- `src/components/events/gallery.css`: scoped gallery styling.
- `src/data/events.js`: requested fields, one labelled dummy, dev-only expansion.
- `public/img/events/workshop-slot-tba.svg`: local dummy artwork.
- `src/components/events/FrameClock.js`, `vite.config.js`: a narrowly scoped
  compatibility adapter from R3F 9.8.2's deprecated Clock construction to Three
  r185's Timer. It neither patches Three globally nor suppresses console output.
  Development prebundles the renderer's required CommonJS helpers explicitly.
  Remove the adapter when the renderer itself migrates to Timer.
- `src/components/events/gallery.test.js`: frame-rate math, spring settling,
  fit/bounds and dev/production data checks.
- `EVENTS_GALLERY.md`, `EVENTS.md`: current phase notes and history pointer.

## Verification and limits

Commands: `npm run lint`, `npm run build`, and
`node --test src/components/events/gallery.test.js src/components/events/eventModel.test.js`.
All pass: zero lint warnings and ten unit tests. Vite still reports a large
lazy chunk (Events/Three about 246KB gzip; scene/helpers about 43KB gzip).
That build warning is distinct from browser console output.

Chrome/SwiftShader checks passed at 360, 768 and 1440px: visible gallery,
no horizontal page overflow, wheel/buttons/arrows, bounded progress, no-op
activation (including clicking the peeking pass), Tab focus bringing the next
pass into view, no browser console warnings or page JavaScript errors. Production
`?dummies=5` still showed only two passes, and request capture found no Rapier,
interactive-lanyard or WASM request.

Development preview showed six passes for `?dummies=5`, without console warnings.
Synthetic Strict Mode tests covered horizontal trackpad input, empty-space drag,
offscreen pausing, single-pass fit and three mount/unmount cycles. Instrumentation
found zero owned rAF callbacks and zero owned listeners after completed unmount,
and one scroll loop after remount. The nine owned listeners include context-loss
handling as well as the hook's inputs/visibility handler.

Native emulated touch swipe/cancellation, DPR=3 capped to 2, reduced-motion
no-sway/instant scrolling, keyboard activation, and actual Home → browser Back
navigation with one canvas/no loader replay were checked. Browser tests are
not a physical-device FPS benchmark. Safari/Firefox, real touch hardware and
screen-reader output have not been tested in this phase. The no-WebGL fallback
is implemented but has not been exercised in this gallery revision.

Run locally with `npm install` then `npm run dev`. Build/preview with
`npm run build` and `npm run preview`.
