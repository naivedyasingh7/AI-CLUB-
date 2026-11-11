# AI Club event archive

Implemented on `feat/events-lanyard-experience`, based on the existing particle-loader work. The production website remains the static Vite page. This feature is a separate Events page at `/events.html`, linked beside Contact in the desktop, mobile and footer navigation. The home page does not mount or download the archive. The existing preloader, navigation, header, footer, and legacy scrolling scripts were not rewritten.

## What is included

A supported metal rail holds a single development-preview pass. Selecting it rotates the same gallery position to the front and moves the camera closer. One suspended physics badge takes over at that exact pose. A DOM Explore event control expands the same artwork through a shader reconstruction into an accessible HTML detail dialog. Closing restores the interactive pass and focus; Return to archive restores the earlier gallery angle.

No actual event announcement, date, venue, speaker, sponsor, result, attendance figure or registration URL was supplied. The default entry is explicitly a **development preview**, not an announced event. It has no registration CTA. Replace it with verified club information before announcing the event.

## Run locally

```sh
npm install
npm run dev
npm run lint
node --test src/components/events/eventModel.test.js
npm run build
npm run preview
```

Choose Events in the top navigation, or open `/events.html` directly. No new site-wide smooth-scroll controller is installed.

## Edit event data (club head)

Edit `src/data/events.js`. It contains the full JSDoc field schema and the only production event array.

1. Replace the preview with the confirmed event title, description and stable unique ID. Set `development: false` when the announcement is real.
2. Add the official `start` and `end` as ISO 8601 instants including offsets, for example the format `YYYY-MM-DDTHH:mm:ss+05:30`. Keep `timeZone: 'Asia/Kolkata'` for display. Do not use ambiguous local date strings.
3. Place artwork under `public/img/events/` and use `/img/events/filename` paths. Set `poster`; optionally override `badgeFront` and `badgeBack`. Portrait 3:4 artwork works especially well; other ratios are contained without stretching. The fallback composition embeds the existing club SVG unchanged.
4. Supply `venue` and/or `mode`, plus the organizing `community` when confirmed.
5. Add `registrationState: 'open'` and the real `registrationUrl` to enable upcoming registration. Use `joinUrl` for a live participation link, and `externalUrl` for an optional event website. Only valid HTTP(S) links are displayed.
6. Add optional `speakers`, `judges`, `agenda`, and `highlights` only when confirmed. For past events, `recap` can contain a URL, images, highlights and labelled statistics; missing sections are omitted.
7. Add additional array entries to create more passes. There are no hardcoded event-specific scene positions.

Lifecycle uses absolute instants: UPCOMING before the start, LIVE NOW between known start/end, PAST after the end. Invalid or impossible dates get a confirmation fallback. A known start without an end supports an upcoming countdown, but does not invent an ending or live status. Calendar download is available only with valid start and end; the generated ICS uses UTC instants, escapes fields and folds UTF-8 lines.

## Architecture and changed files

- `index.html`: Events navigation links; no archive in the home-page scroll.
- `events.html`, `src/events-page.css`: dedicated page, responsive navigation and archive host.
- `vite.config.js`: explicit home and Events production HTML entries.
- `src/events-entry.jsx`: imports the feature near the viewport, or immediately for an Events deep link. It never reads or resets the loader's session flag.
- `src/data/events.js`: production content and field schema.
- `src/components/events/eventModel.js`: date/status/calendar utilities, layout calculations, valid interaction transitions and all tunable configuration.
- `EventsSection.jsx`: equivalent HTML event selection, explicit browsing, owned ScrollTrigger, viewport/reduced-motion observers, renderer fallback and interaction state.
- `EventsScene.jsx`: rail, structural supports, static suspended passes, camera continuity, procedural brushed roughness and adaptive DPR.
- `EventBadge.jsx`: common front/back geometry and proportion-correct artwork for static and physics versions.
- `InteractiveLanyard.jsx`: lazy Rapier world, fixed anchor, three rope joints, one spherical joint, badge body, rendered strap ribbon, pointer capture and keyboard impulses.
- `EventDetailPanel.jsx`: native modal dialog, focus loop, Escape/close, lifecycle content, countdown, configured actions and calendar.
- `PixelReveal.jsx`: owned shader renderer, original image sampling/reconstruction effect, resize and GPU cleanup; ordinary image fallback remains underneath.
- `events.css`: styles scoped to the event archive/dialog and existing palette/typeface names.
- `eventModel.test.js`: six Node tests for lifecycle boundaries, invalid dates, calendar output, layout, URLs and valid/invalid transition sequences.
- `public/img/events/archive-preview.svg`, `archive-fallback.svg`: labelled development artwork and a generic missing-artwork fallback containing the existing logo, not an invented logo.
- `package.json`, `package-lock.json`: the three necessary 3D dependencies and their locked dependencies.

## Dependencies

- `@react-three/fiber` 9.8.2: React 19-compatible Three.js renderer and scene lifecycle.
- `@react-three/drei` 10.7.9: shared artwork loading, rounded badge geometry and a projected accessible DOM drag surface.
- `@react-three/rapier` 2.2.0: fixed-step rigid bodies and rope/spherical constraints, loaded only when selection begins.

Their peer requirements were checked against installed React 19.2.8 and Three.js 0.185.1. No MeshLine, postprocessing or second scrolling package was added. A pre-existing local FFmpeg installation or image service is not required by this feature.

## Handoff and interaction states

`BROWSING → SELECTING → INTERACTIVE → OPENING_DETAILS → DETAILS_OPEN → CLOSING_DETAILS → INTERACTIVE → RETURNING → BROWSING`.

The event ID is separate from mode. Invalid rapid actions are ignored, and cancellation kills only the owned tween. During selection, the selected static pass stays visible while the rail brings its local angle to the front and the camera reframes. Physics initializes with the same artwork, dimensions, front world position and orientation. A Suspense fallback preserves the static pose while Rapier initializes; the final physics pass replaces it, rather than duplicating it.

The strap is a rope-constrained ribbon, inspired by the Vercel badge approach, not a full soft-body cloth simulation. Kinematic movement is bounded by the rope connector's reachable length. Only five rigid bodies are needed: the fixed anchor, three strap joints and one badge. Dragging temporarily makes the badge kinematic; release returns it to a damped dynamic body. Pointer capture, cancellation and lost capture release the interaction. On touch, only the deliberately draggable DOM badge surface disables touch scrolling; the rest of the stage keeps `pan-y` scrolling. Arrow keys can nudge the pass; dragging is never required to read details.

## Pixel reveal

The modal artwork starts from the projected pass bounds, expands to its poster area, breaks into a coarse UV grid and resolves to a sharp image. GSAP controls the shader's progress. A deterministic random reconstruction front introduces block breakup without CSS blur. UV fitting preserves the original image ratio, and the resize observer measures untransformed layout dimensions so a transforming container does not leave a small duplicate canvas.

The main scene/physics pauses during details. The poster renderer draws only when progress or size changes. Closing reverses the composition, disposes its own texture/material/geometry/renderer and releases its WebGL context. Shader failure falls back to the normal poster image; essential event information is always HTML.

## Scrolling, performance and accessibility

- One or two entries have no pinned sequence. Three or more non-preview events can pin only the desktop stage, capped at 1,800px of travel. Mobile and reduced motion never pin. Explicit Previous/Next controls and HTML event selection remain available.
- Scroll rotation is a bounded function of normalized progress, not accumulated deltas. Selection freezes its target. The existing window ScrollTrigger registry is reused; importing a competing plugin registry is avoided. Cleanup removes only the feature's own trigger. Existing triggers are refreshed after layout changes, never globally killed.
- Geometry is procedural and intentionally modest. There is no GLTF download, postprocessing, bloom or external runtime poster image.
- The 3D island is lazy; the initial shared loader entry remains approximately 92KB gzip. Events/Three is about 250KB gzip; physics is about 854KB gzip and requested during selection. Vite reports large minified lazy chunks; this is documented rather than hidden with a larger warning threshold.
- DPR is capped at 1.5, dropping to 1 after sustained slow-frame sampling. The single static pass uses demand rendering. Rendering pauses offscreen, and physics pauses while details are open.
- Body scroll styles are preserved/restored by the dialog. Native dialog semantics make the background inert; explicit Tab looping, Escape and focus restoration are implemented. Reduced motion removes physics, camera travel, pinning and the pixel transition while retaining full details/actions.
- WebGL initialization failure, context loss and failed artwork produce a branded HTML fallback using the same event data. Empty data produces a readable empty archive.
- Mutable frame work uses refs and preallocated vectors/strap buffers. Owned observers, listeners, timelines, frame requests, geometries, materials, GPU contexts and physics worlds are cleaned up. Drei artwork caching is shared intentionally; it is not globally cleared out from under another pass.

## Tunable parameters

`EVENT_CONFIG` is at the top of `eventModel.js`: rail size/thickness/height, badge dimensions, camera FOV and distances, aim height, lighting intensities, rotation span, maximum pin distance, selection/reveal/close durations, gravity/damping, rope length, strap samples, drag limits, glow/breathing, pixel size, DPR and slow-frame threshold. CSS layout changes stay in `events.css`; content changes stay in `events.js`.

## Actual verification

- Dedicated-page follow-up: production navigation to `/events.html`, details, same-tab refresh without loader replay, and Contact back to the home page passed at 360/768/1440px. The full physics/shader flow also passed at 1440px. Home no longer contains an Events mount. The standalone page shares the existing once-per-session loader and has a responsive navigation row.
- Lint: passed with zero warnings. Production build: passed, with the lazy-chunk size warning noted above.
- Six Node tests passed for lifecycle/offsets, invalid dates, UTC calendar folding/escaping, reducer transitions and layout/URL behavior.
- Automated Chrome with software WebGL: full select → physics → shader details → Escape → return flow passed at 360, 390, 768, 1024 and 1440px and an 844×390 landscape viewport. No page JavaScript errors; modal focus stayed contained and scrolling was restored.
- DPR=3 at 360px was capped to 1.5. Slow software-rendered contexts adapted down to DPR=1. These are not physical-device FPS benchmarks.
- Reduced motion had no drag surface and retained working details. Unavailable WebGL, context loss during initialization and a missing poster retained usable HTML/details.
- Isolated synthetic fixtures (not production announcements): empty, one, two and six entries; no pin for zero/one/two and a working pin for six; scroll rotation; correct selected event; actual configured registration URL and ICS link; three Strict Mode unmount/remount cycles with no page errors and no remaining owned trigger/canvas.
- Emulated native touch drag, touch cancellation, restored ordinary vertical scrolling and touch-close of the detail dialog passed. A visual-viewport fit keeps the close button visible even when legacy page content makes the layout viewport wider than the phone screen.
- Rapid clicks, selection cancellation, closing during opening, unchanged legacy trigger count, and actual movement of the existing horizontal Members section passed.
- Clicking the actual WebGL badge (raycast selection) reached one interactive pass without page errors. The desktop pin was also checked with the selected-event controls remaining inside the stage.
- Existing preloader regression: full first-load once, all 17 navigation/section clicks without remount, zero loader DOM/draw calls after cache-bypassing refresh, full loader in a fresh independent tab, blocked-storage navigation and stopped draw/listener cleanup all passed with Events integrated.

## Limitations and follow-ups

- Real event content still needs to be supplied. The shipped preview is explicitly not an announcement.
- Chrome/SwiftShader browser checks do not verify Safari/Firefox, physical touch hardware, assistive-technology output or 60fps on a physical mid-range laptop. Those remain verification work.
- The underlying site still has its existing 420px minimum body width. This island itself is constrained to the actual viewport at 360px; unrelated global mobile layout was not redesigned.
- Existing remote font assets fail CORS in the tested local environment; the site's existing font fallbacks are used. Remote legacy background videos can still be unavailable. No unrelated remote assets were replaced.
- `npm audit` reports two existing high-severity findings in Vite 8.2.2 and source-map-js 1.2.1. Those exact versions were already in the particle-loader branch; a separate tooling update is appropriate instead of broad dependency changes here.
- Very large event catalogues would benefit from texture/badge virtualization. Current layout grows with the event count and keeps the HTML list bounded, but dozens/hundreds of unique poster textures were not stress-tested.

## Review / PR breakdown

The feature is kept in three reviewable milestone commits: (1) data/static rail gallery, (2) selection/physics, (3) shader/details/accessibility/fallbacks/tests/documentation. No new changes were pushed and no Events PR was opened. The branch is based on the particle-loader work; if that base PR is still open, review it first, then submit this feature against the merged base or use stacked PRs. Separate milestone PRs would need those same dependencies in order.

## Reference study

- [Codrops cinematic scroll demo](https://tympanus.net/Tutorials/Cinematic3DScroll/) and [article](https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/): bounded scroll-driven spatial composition, adapted to a physical rail rather than an image cylinder.
- [Vercel interactive badge](https://vercel.com/blog/building-an-interactive-3d-event-badge-with-react-three-fiber): rope-joint/spherical-joint principles, fixed anchor, damped suspended body, pointer capture and kinematic dragging.
- [Pixel image reference](https://pixelimageeffect.pages.dev/) and [source](https://github.com/J0SUKE/gsap-threejs-codrops): inspected live composition and the source fragment/vertex shaders and media sizing lifecycle. The local shader is an original React implementation of quantized sampling and reconstruction; no reference images are hotlinked.
