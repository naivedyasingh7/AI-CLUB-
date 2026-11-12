# Events polish verification

Branch: `feat/events-lanyard-gallery`. This pass changes presentation and cleanup,
not event functionality, gallery motion, the model or loader/session behavior.

## Changes

- Compact fixed panel header, title and facts; sticky bottom actions. Only the
  description/speakers region scrolls, including when long content is supplied.
- Thin palette-based dark scrollbar and black track, with Firefox and WebKit CSS.
- Other 3D passes, their captions and large background numbers fade completely
  away during details. The gallery counter and browsing controls are hidden.
- One visible Close control, handed between the rail and panel by the existing
  timeline. HUD boxes use the same 36px height; desktop Close aligns with the
  breadcrumb on the rail.
- WHEN/WHERE/BY and Event details use at least 11px mono text with brighter
  palette-based contrast. Events uses its existing system-font fallbacks directly
  instead of attempting legacy remote font URLs that reject cross-origin loads.
- Persistent Events-page scrollbar gutter; no inline gutter toggling on focus.
- Panel fallback/action copy is centralized in `src/data/events.js`. Development
  dummy expansion is behind the compile-time development branch and is absent
  from the production Events bundle.

## Pixel effect choice

Moved the existing quantized-UV/reconstruction math to the badge face during its
leftward glide, resolving over 0.8s. It runs in the existing physical material's
map stage, preserving PBR lighting, existing artwork, parallax UVs and dragging.
Reduced motion keeps the face sharp. The tiny panel thumbnail and its standalone
WebGL renderer are removed, closing the gap below the tagline without adding
another canvas or model.

The unused `PixelReveal.jsx` component and thumbnail styles were deleted; its
reused shader math now lives in `pixelResolve.js`. No dependency was added.

## Files

| Group | Files | Purpose |
| --- | --- | --- |
| Panel/HUD | `FocusDetailsPanel.jsx`, `focus.css`, `EventsSection.jsx` | Pinned actions, internal scrolling, Close handoff, typography, hidden HUD and captions |
| Badge/scene | `EventBadge.jsx`, `pixelResolve.js`, `InteractiveLanyard.jsx`, `EventsScene.jsx` | Reuse pixel resolve on the physical face; hide other passes completely |
| Controller | `src/hooks/useEventFocus.js`, `focusConfig.js` | Pixel tween, atomic keyboard readiness, stable scroll lock, remove unused hint ref |
| Copy | `src/data/events.js` | Shared event labels, fallbacks and action copy |
| Page styles | `src/events-page.css`, `gallery.css` | Persistent gutter and explicit system-font fallbacks |
| Removed | `PixelReveal.jsx` | Superseded standalone thumbnail renderer |

Component filenames above are relative to `src/components/events` unless noted.
The model, textures, event descriptions, loader files, session flag and dependencies
are unchanged. Pixel block size/duration remain named constants at the top of
`focusConfig.js`; panel spacing and scrollbar colours are in `focus.css`.

## Verification actually run

- `npm run lint`: passes without warnings.
- `npm run build`: passes; Vite retains its existing large-chunk advisory.
- 12 Node tests covering event/date validation, gallery/dummy logic and focus
  placement pass.
- Headless Windows Chrome with software WebGL: 360×844, 768×1000, 1440×900,
  1366×768 and 1280×720, using the six-pass development gallery. All checked action
  visibility without panel scrolling, dark scrollbar colours, hidden other 3D
  passes/ghost labels, one visible Close, and 11px fact labels. A QA-only overflow
  fixture confirmed description scrolling does not move the action row.
- Keyboard only: Tab to a pass, Enter, Tab from the focused grip to Event details,
  Enter, Esc; focus returns to the original pass. Also checked reduced motion.
- Ten consecutive open/details/close cycles: each focus creates one world and five
  bodies; every close returns to zero worlds/bodies and the same browsing listener
  and animation-frame baseline. Unmount returns owned listeners, animation frames
  and canvases to zero; remount starts cleanly. No Events console warnings or
  runtime errors were recorded.
- Actual badge shader uniforms were instrumented outside the repository: pixel
  progress changed below 1 during the glide and settled at 1. Only one canvas
  exists while details are open.
- No nav movement was reproduced in Chrome. Persistent gutter checks kept nav
  bounds within 0.5px through focus/details/close, also with forced page overflow.
- Built output inspection confirmed neither the dummy query string nor development
  dummy IDs remain in the production Events bundle. Running the production build
  with/without `?dummies=5` rendered the same two events.
- Production 1280×720: visible actions, 36px aligned HUD/Close boxes, keyboard path,
  actual first loader completion and session flag, Home → Back, and same-session
  reload. Navigation/reload did not mount or flash the loader again.

Browser scripts, logs and screenshots are outside the repository in the local
`ai-club-events-qa` artifact folder. No test event was shipped or registration
submitted.

## Limits

Physical phones, Safari/Firefox rendering, screen readers and real-GPU FPS were
not tested. The untouched loader and home page still request legacy remote fonts
that produce CORS resource errors. Those were recorded separately from the clean
Events interaction checks; they were not suppressed or hidden in application code.
