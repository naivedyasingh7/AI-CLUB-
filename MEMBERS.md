# Members section verification

Branch: `feat/members-section`. This pass replaces the placeholder members
gallery on the home page (`data-layout="04"`) with a scrollable team rail and an
expandable team panel, authored like the events section.

## Changes

### Data / validation
- `src/members/members.js` — ordered `teams` list with a fully commented copyable
  TEMPLATE. Five placeholder teams (Technical, Web Development, Design, PR, Event
  Management) with `(TBA)` people; no invented real names, bios or URLs.
- `src/members/memberCopy.js` — UI copy (Lead / Co-lead / Members / To be
  announced / link accessible names).
- `src/members/memberModel.js` — `validateMembers` and `prepareMembers` plus
  `PHOTO_SPEC`. Validation names the team id, person id and field: unique team
  and person ids, required fields, https linkedin/github on the expected hosts,
  photo file exists and is roughly square, no cross-team duplicate people unless
  `shared: true`.
- `src/members/index.js` — filename-only `import.meta.glob` photo resolver
  keyed by basename; prepares teams (previews hidden in production unless no real
  team exists).
- `scripts/check-members.mjs` — validation entry; errors to stderr, exit code 1
  on failure.

### Component / integration
- `src/members/MembersSection.jsx` — React island: ARIA tablist rail (roving
  tabindex, arrow/Home/End, wheel/touch/mouse-drag/arrow-button scrolling, active
  team scrolled into view), selected-team panel with Lead/Co-lead shown larger,
  per-person disclosure (click + Esc, one open at a time), GSAP subtle panel
  reveal/disclosure motion gated on `prefers-reduced-motion`, real `<a>` links
  (`target="_blank" rel="noopener noreferrer"`, https only, accessible names).
- `src/members/members.css` — `.members-*` styles reusing the site CSS variables;
  mobile (360px+) stack, ≥44px touch targets, no horizontal page overflow;
  reduced-motion overrides.
- `src/members-entry.jsx` — lazy IntersectionObserver mount into `#members-root`
  (650px rootMargin), mirroring `src/events-entry.jsx`.
- `index.html` — removed inline members `<style>` block, legacy placeholder
  markup and the `/js/members-animation.js` script tag; added `#members-root`
  fallback inside `<section data-layout="04">` (kept `.layout-head` "Members /
  04" and `style="position:relative"`); added lazy module script tag.
- `public/js/members-animation.js` — deleted (confirmed unused elsewhere).

### Scripts / tests / docs
- `package.json` — added `check:members`, chained into `prebuild`
  (`check:events && check:members`), extended `test` glob to include
  `src/members/*.test.js`.
- `src/members/memberModel.test.js` — node tests for validation, ordering,
  fallbacks, URL checks, photo checks.
- `src/members/photos/sample.png` — valid 800×800 PNG proving the photo pipeline.
- `src/members/README.md` — non-developer teammate guide.
- `MEMBERS.md` — this file.
- `.clinerules` — project rules; added to `.gitignore`.

## Tunables

| File | Constant | Meaning |
| --- | --- | --- |
| `src/members/memberModel.js` | `PHOTO_SPEC.aspectTolerance` | 0.25 = roughly square allowed deviation |
| `src/members/memberModel.js` | `PHOTO_SPEC.maxBytes` | 150KB photo warning threshold |
| `src/members/MembersSection.jsx` | GSAP durations 0.25–0.45s | panel reveal / disclosure motion |
| `src/members/members.css` | `--spacing`, `clamp()` values | spacing and typographic scale |
| `src/members-entry.jsx` | `rootMargin: "650px"` | how early the island mounts |

## Verification actually run

- `npm run lint`: **0 warnings, 0 errors**, exit 0.
- `npm test`: **31 tests pass** (19 events + 12 members), 0 failures.
- `npm run check:members`: **passes** against the placeholder data ("Member check passed: 5 entries.").
- `npm run build`: **passes**; prebuild runs both `check:events` and `check:members`. The members island builds into `dist/assets/MembersSection-*.js`/`.css` and is lazy-loaded from `dist/assets/home-*.js`.
- `npm run dev`: starts cleanly; home page returns **200** and includes `#members-root` plus the lazy members entry chunk. No startup/runtime errors logged.

## Verification NOT performed

- Browser interaction at 360 / 768 / 1440 px (rail wheel/swipe/drag, ARIA tabbing, disclosure open/close, horizontal overflow, layout title/counter swap) — no browser automation was available in this environment.
- Real physical devices.
- Safari and Firefox.
- Screen readers (VoiceOver/NVDA/JAWS) — ARIA attributes are in place but not verified with assistive technology.
- Production deployment behind a CDN; photo CORS or image CDN behaviour.
- The legacy `public/js/main.min.js` / `public/js/animate.js` title-swap behaviour with the new taller interactive section was not exercised in a browser.
