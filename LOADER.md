# Particle loader

The production entry is static HTML served by Vite. `src/loader-entry.jsx` mounts only `<Loader />`; it deliberately preserves the current page. The dormant React App uses the same component and burst callback. Both roots use the shared synchronous session guard.

## Changed files

- `src/components/Loader.jsx`: new Canvas 2D particle engine, real readiness tracking, GSAP progress/finish timeline, session-only mounting, reduced-motion path, resize, adaptive performance, and cleanup.
- `src/components/Loader.css`: isolated overlay, original SVG mask, counter, and status styles.
- `src/loader-entry.jsx`: React overlay mount/unmount and entrance handoff event.
- `index.html`: removed static loader/video/clock interval; mounted the React overlay. Removed the forced 420px viewport so a 360px viewport is real.
- `public/js/main.min.js`: removed fake counter timers; existing page setup runs once at `ai-club:reveal`, including a catch-up for a late deferred script.
- `public/css/main.min.css`, `src/index.css`: removed legacy loader styles and keyframes.
- `src/App.jsx`: gates React entrance animations on burst and removes its old delayed initialization timer.
- Deleted `public/img/svg/loader-circle-1.svg` and `loader-circle-2.svg`. The remote loader-only video is no longer referenced. The shared hero video remains in use.

## Tweaking the look

All animation constants are in `LOADER_CONFIG` at the top of `src/components/Loader.jsx`.

| Look | Settings |
| --- | --- |
| Density | `desktopParticles`, `mobileParticles`, `mobileWidth` |
| Particle size | `minSize`, `maxSize` in CSS pixels |
| Formation speed | `stiffness`, `damping`, `delaySpread` |
| Ambient motion | `drift` |
| Interaction | `pointerRadius`, `pointerForce`; fine pointers only |
| Burst speed | `burstSpeed` |
| Duration | `minimumMs`, `maximumMs`, `hold`, `wave`, `burst`, `fade` |
| Easing | `progressEase`, `finishEase` |
| Colours | Existing `--color-bg`, `--color-text`, `--color-white`; `paletteVariables` selects particle colours |
| Sampling | `gridStep`, `alphaThreshold` |

The original `/img/svg/ai-club-logo-custom.svg` is rasterized to an offscreen canvas. The same asset supplies the crisp completion mask; no paths are recreated. It is tinted with the site palette. Logo size/position live in `resize()` and the corresponding loader-only CSS variables.

The full sequence takes at least two seconds of readiness/formation plus the finish timeline. The absolute safety deadline is eight seconds, including the finish. Failed assets settle their task; a stuck asset is abandoned near the deadline so the normal exit still runs. A completed session renders no loader at all. The existing session key is checked synchronously in the entry before React renders; there is no repeat animation or loader flash. A shared in-memory flag also survives client-side navigation when sessionStorage is blocked. Actual progress can pause if a resource pauses; it is never inflated by a fake clock. The exit timeline labels are `hold`, `shockwave`, `textExit`, and `burst`.

## Verification

- `npm run lint`: passes with zero warnings after the separate validation-cleanup commit.
- `npm run build`: passes. No dependencies added.
- Automated Chrome checks at 360, 768, and 1440 CSS pixels: monotonic progress through 100, one reveal event, restored scrolling, removed loader root, no JavaScript errors, unchanged hero bounding box, and zero layout-shift entries during handoff.
- Visually inspected a recognizable, still-forming logo near 50% and the completed page.
- Desktop begins with 5,000 particles; 360px uses 2,000; a DPR=3 test caps the canvas at DPR=2.
- Normal observed frame intervals were approximately 7–11 ms on this machine. With 4x CPU throttling, adaptive reduction changed 5,000 to 3,750 particles and measured 15.5 ms per frame (approximately 64 fps). This is an emulation, not a physical mid-range laptop benchmark.
- Reduced motion: formed logo, counter/fade, zero particle draw calls.
- Resize/orientation: re-sampled at 360px with 2,000 particles.
- Stuck hero video: full exit completed at approximately 7.85 seconds.
- Missing Canvas 2D and unavailable sessionStorage: graceful completion.
- After unmount, draw-call counts stop increasing and every loader-owned AbortSignal listener is aborted.

The existing page stylesheet still specifies a 420px minimum body width; that pre-existing content constraint was preserved. The loader fits a true 360px viewport. Desktop hero media can cause an existing layout change behind the opaque loader while it loads; no change was measured at the loader handoff.

## Session replay fix

Diagnosis: (a) the old repeat branch intentionally rendered a short loader, (c) navigation anchors caused full document reloads, and (d) the dormant React App reset loading to true on mount. The active loader root was already outside page sections (not b); no pageshow/hashchange/popstate handler restarted it (not e).

Files changed for the fix:
- `src/utils/loaderSession.js`: shared session read/write and in-document fallback; retains `ai-club:particle-loader:v1` so existing completed sessions are respected.
- `src/loader-entry.jsx`: checks before createRoot/render; skips loader DOM entirely in completed sessions; installs navigation independently of the loader.
- `src/components/Loader.jsx`: removes all repeat-loader branches/timers; marks the session only on completion. First-load configuration and finish visuals are unchanged.
- `src/App.jsx`: synchronous initial session guard and client-side route handling; root loader is outside route content and its state is never reset on navigation.
- `src/utils/navigation.js`: delegated section scrolling, mobile menu closure, and client-side route handling for the React app. Modified clicks and external links retain normal browser behavior.
- `index.html`: header/menu/footer links target `#home`, `#services`, `#about`, `#contacts`; IDs point to the existing hero, solution, about, and footer. The Get started link also targets the footer.
- `LOADER.md`: updated session behavior and this diagnosis.

No visual styles, particle physics, first-load minimum/maximum, or finish timings changed in this fix.

Regression verification for the replay fix (production Chrome): first fresh-tab load mounted exactly one full particle loader and set the session flag; 17 navigation/section links retained the same document and never remounted it; simulated popstate, hashchange, and persisted pageshow did not restart it. Cache-disabled, cache-bypassing reload created zero loader nodes and zero particle draw calls. A second fresh tab in the same browser context played the full loader. Blocked sessionStorage did not break first load or subsequent section navigation. Loader draw calls stopped after finish and all loader-owned AbortSignal listeners were aborted. Lint and build both pass; the PR preparation also cleared existing lint warnings in a separate commit.

## PR preparation

Work is on `feat/particle-loader`. The loader, session/navigation integration, and existing lint cleanup are separate conventional commits. Validation cleanup removed unused imports/arguments/menu state, explicitly exposed the shared classic-script TextAnimator, and computed GridReveal resize dimensions and delays together. No dependencies or media files were added.

The final production build was rechecked at 360/768/1440px and against all 17 navigation/section links, a cache-bypassing reload, fresh independent tabs, and blocked storage. There were no JavaScript errors or handoff shifts. Some external media reached the existing safety timeout; those loads completed in approximately 7.8 seconds. Full reviewer-facing context and manual test steps are in `PR_DESCRIPTION.md`.
