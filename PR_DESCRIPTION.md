# feat: particles-to-logo preloader (plays once per session)

## Summary

Replace the old video-based loading screen with particles that assemble into the club's existing logo, then dissolve to reveal the page. The loader now plays once per tab session, so members can explore sections or refresh the page without seeing it again. The site's existing colours and first-screen content are preserved.

## What's new

- An interactive particle field converges into the existing AI Club logo, with a recognisable shape while loading and a crisp finish.
- A large percentage counter follows real resource readiness instead of fixed fake percentages.
- A brief logo pulse, expanding shockwave, and outward particle burst reveal the page; page entrance animations begin at the burst.
- Reduced-motion users get the formed logo, counter, and a simple fade without particle motion.
- Section navigation scrolls in-page, including closing the mobile menu after a selection.
- The loader removes its canvas, stops drawing, removes its listeners, and restores scrolling on completion.

## Bug fixed

The loader replayed after section clicks because navigation links reloaded the whole document and the entry always mounted a loader. The session flag was checked only inside the loader, which selected a short repeat animation rather than skipping it. The dormant React app also initialized loading to true on each mount.

The session flag is now checked synchronously before rendering. Completed sessions never create loader DOM, including during a same-tab hard refresh. The repeat-loader branch has been removed, and header/menu/footer links now target existing sections without reloading. The loader stays outside changing route content; no hash, history, or pageshow event starts it again.

## How it works

The existing SVG is rasterized on an offscreen canvas, and opaque pixels are sampled into randomly assigned particle targets. A delta-time spring draws typed-array particles into those targets, while extra particles remain ambient dust. The logo itself is not redrawn or replaced.

Progress combines document readiness, font readiness, the logo, and first-screen images/videos; GSAP interpolates the counter. These are resource-readiness percentages, not downloaded-byte percentages. Loading has a two-second minimum formation interval and an eight-second absolute safety deadline, including the finish. Failed or stuck assets cannot keep the site blocked indefinitely.

Completion sets `ai-club:particle-loader:v1` in sessionStorage. The entry reads that key before creating the React root; an in-memory fallback covers subsequent client-side navigation if storage is blocked. The existing static Vite page is retained, with React mounted only for the overlay; the dormant React App uses the same guard.

## How to test

1. Run `npm run dev` and open the printed URL in a fresh independent tab. If that tab already has a completed session, run `sessionStorage.removeItem('ai-club:particle-loader:v1')` in its console and reload.
2. Confirm the full particle loader runs once, reaches 100%, forms the supplied logo, and exits into the page. Confirm scrolling works afterward.
3. Click Home, Services, About, and Contact in the header, mobile menu, and footer. Click Get started as well. Confirm the intended section scrolls into view, the document does not reload, the mobile menu closes, and no loader flashes or returns.
4. Press Ctrl+Shift+R in the same tab. Confirm the page appears without a loader. Open the URL in a separate fresh independent tab and confirm the full loader runs there.
5. Emulate `prefers-reduced-motion: reduce` in browser developer tools. Clear only the session key and reload; confirm a formed logo/counter and fade, with no moving particles.
6. Repeat first-load and navigation checks at 360px, 768px, and 1440px viewport widths. Resize while loading and confirm the logo remains centred; check the page does not shift when the overlay disappears.
7. To exercise the safety exit, block the hero video request, clear the session key, and reload. The loader must release the page within roughly eight seconds. Check that no particle draw calls continue after completion.

### Verification actually performed

- `npm run lint`: passed with zero warnings after the separate lint-cleanup commit.
- `npm run build`: passed.
- Production-build automated Chrome checks at 360/768/1440 CSS pixels: progress was monotonic to 100, the loader root was removed, scrolling restored, and no JavaScript errors or handoff layout shifts were recorded.
- Clicked 17 navigation/section links: the same document stayed active and the loader mounted only once.
- Cache-disabled, cache-bypassing reload: zero loader nodes and zero particle draw calls. A fresh independent tab in the same browser context played the full loader once.
- Verified reduced-motion, resize/orientation events, unavailable Canvas 2D, unavailable sessionStorage, and a stuck-video safety exit during this implementation session.
- Verified drawing stopped after unmount and all loader-owned AbortSignal listeners were aborted. Simulated persisted pageshow/history/hash changes did not restart the loader; actual browser back-forward-cache restoration was not tested.

## Files changed

### Loader and integration

- `src/components/Loader.jsx` — particle simulation, readiness counter, finish timeline, cleanup, and session completion.
- `src/components/Loader.css` — isolated loader layout, existing-logo mask, and counter styling.
- `src/utils/loaderSession.js` — synchronous session guard plus an in-document fallback.
- `src/loader-entry.jsx` — mount the overlay once or skip it entirely, and signal page reveal.
- `src/App.jsx` — keep loading outside route content, honour the session guard, and handle client-side routes.
- `src/utils/navigation.js` — delegated section scrolling, menu closure, and React route handling.
- `index.html` — replace old loader markup/scripts, add section IDs and hash links, and remove the forced 420px viewport override.

### Legacy loader removal

- `public/css/main.min.css`, `src/index.css` — remove obsolete loader rules and keyframes; existing section styles remain.
- `public/js/main.min.js` — remove fake counter timers and start page animations once at reveal, including late-script catch-up.
- `public/img/svg/loader-circle-1.svg`, `public/img/svg/loader-circle-2.svg` — delete unused loader-only assets.

### Validation cleanup (separate commit)

- `public/js/animate.js` — explicitly expose TextAnimator for the separate classic animation bundle instead of leaving an apparent unused declaration.
- `src/components/AwardsSection.jsx`, `src/pages/AboutPage.jsx` — remove unused imports.
- `src/components/Canvases/CyberCanvas.jsx`, `src/pages/Services.jsx` — remove unused callback arguments.
- `src/components/Menu.jsx` — remove unused hover-speed state and metadata that had no visible effect.
- `src/components/GridReveal.jsx` — compute resize dimensions and stagger delays together, removing the extra effect-driven state update.
- `src/utils/animations.js` — remove an unused catch binding.

### Documentation

- `LOADER.md` — configuration guide, diagnosis, verification details, and known limitations.
- `PR_DESCRIPTION.md` — this review text, also usable for manual PR creation when GitHub CLI is unavailable.

## Performance and compatibility notes

- One Canvas 2D surface; no WebGL and no new dependencies.
- 5,000 particles on desktop, 2,000 below 768px, with an adaptive minimum budget of 1,200 when measured frames slow down.
- Canvas devicePixelRatio is capped at 2; a DPR=3 browser test confirmed the cap.
- Float32Array particle data and delta-time updates avoid refresh-rate-dependent motion. Pointer repulsion is enabled only for fine, hover-capable pointers.
- Earlier 4x CPU-throttled Chrome testing reduced the budget from 5,000 to 3,750 and measured about 15.5ms per frame. This is an emulation, not a physical mid-range laptop benchmark or a guarantee on every device.
- Browser tested: automated headless Google Chrome on Windows. Safari, Firefox, and physical mobile devices have not been verified.

## Screenshots / screen recording

**[AUTHOR: ATTACH SCREENSHOTS / SCREEN RECORDING HERE]**

Suggested attachments: the logo forming near 50%, the completed logo/finish, a 360px capture, and the supplied `Desktop 2026.11.11 - 23.13.50.02.mp4` recording. Media is intentionally not committed to the repository.

## Checklist

- [x] `npm run lint` passes with zero warnings.
- [x] `npm run build` passes.
- [x] Tested loader handoff at 360px, 768px, and 1440px.
- [x] Verified first-load, section navigation, same-tab hard refresh, and fresh-tab behaviour.
- [x] No unrelated feature/design changes; required existing lint fixes are isolated in a separate commit.
- [x] No new dependencies, debug logs, temporary test files, or large media added.
- [ ] Author attaches screenshots / screen recording above.

## Known limitations / follow-ups

- Existing page CSS still has a 420px minimum body width. The loader fits a true 360px viewport, but this PR does not redesign the underlying page's mobile layout.
- External hero media/fonts remain network dependencies. Some final checks reached the safety timeout; the loader exited at about 7.8 seconds. A timeout releases the page even if a resource is still unavailable.
- Desktop hero media caused an existing layout change behind the opaque loader in earlier checks; no shift was measured at the handoff itself.
- If sessionStorage is blocked, client-side navigation is covered by memory, but a full document reload cannot retain that memory-only completion flag.
- Tests used fresh independent tabs. Duplicated/opener-created tabs and real back-forward-cache restoration remain unverified.
- Production uses the static HTML entry. The dormant React App was linted, but the current static-entry build does not bundle it; its separate route UI was not browser-tested.
- Cross-browser testing and testing on physical mobile/mid-range hardware remain follow-ups.
