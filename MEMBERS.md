# Members section verification

Branch: `feat/members-section`. This pass completes the Members section on the
home page (`data-layout="04"`), introducing an executive Board showcase, a
pinned scroll-driven horizontal track for team names, and typography-first team
person cards with a dark, cinematic aesthetic inspired by hackfirst.io.

## Changes

### Change 1: Pinned horizontal scroll for team names & cinematic dropdown
- `src/members/MembersSection.jsx` — Desktop (≥768px, no reduced-motion) uses
  GSAP ScrollTrigger to pin `.members-stage` when reaching the top of the
  viewport (`start: "top top"`).
- Vertical scroll slides the team names horizontally across the viewport,
  centering the active team.
- **Per-tab scale and opacity gradient:** Tabs scale and fade based on their
  distance from the viewport center (`scale: 1 - 0.42 * t`, `opacity: 1 - 0.78 * t`),
  drawing visual focus sharply to the active team.
- **Dropdown panel reveal:** On team switch, the panel reveals downward via a GSAP
  `clip-path` wipe (`inset(0 0 100% 0 round 0px)` → `inset(0 0 0% 0 round 0px)` in 0.55s `power3.out`),
  giving the visual impression of content dropping down from the active team header.
- **SplitType character line-mask:** Lead and co-lead names animate character-by-character
  (`yPercent: 110` → `0`, staggered by 0.022s in `power4.out`), masked cleanly by the overflow boundary.
- **Editorial layout:**
  - Pinned stage header (top-right): minimalist counter (`01 / 05`) and circular nav buttons (`←`, `→`).
  - Leaders block: Lead and Co-lead displayed prominently side-by-side with oversized typography.
  - Directory: Clean list layout separated by subtle 1px rules with right-aligned metadata (`CSE · 3rd Year`).
  - Progress dots: Bottom-centered indicators with animated pill expansion on active index.
- Scroll snapping lands cleanly on each team (`snapTo: 1 / (teamCount - 1)`).
- Scroll distance is tuned per team (`(teamCount - 1) * Math.max(500, Math.round(window.innerHeight * 0.75))`).
- Full bidirectional synchronization: clicking a team name, the arrow buttons,
  the progress dots, or using Left/Right/Home/End keys smoothly scrolls the window to the exact
  pinned progress point.
- Pinned stage height remains locked at `100svh`. Internal scroll on
  `.members-panel-scroll` (`overflow-y: auto`, with bottom mask fade) accommodates large rosters (e.g. 40
  members) and expanding disclosures without stage height jitter.
- Fallback for small screens (<768px) and `prefers-reduced-motion`: unpinned
  normal page scrolling with a touch-scrollable horizontal swipe rail.
- Lifecycle cleanup: reverts SplitType instances, kills ScrollTrigger instances, disconnects listeners, and
  calls `ScrollTrigger.refresh()` (both local and global `window.ScrollTrigger`)
  to ensure sticky layout title/counter (`data-layout="04"`) in `animate.js`
  re-measures the section height accurately.

### Change 2: Board members with photos
- Added an executive Board block above the pinned team stage inside
  `data-layout="04"` in normal page flow.
- Photo-first cards: 4:5 portrait frame, name, designation, LinkedIn icon link
  and optional GitHub icon link.
- Desktop: single centred row, wrapping to two rows above five people.
- Mobile (<768px): two-column grid with centered odd items.
- Board photo spec: 4:5 portrait, ~1000×1250px, WebP <200KB recommended.
  Resolved by filename from `src/members/photos/board/` (or `photos/`).
- Missing or failed photos automatically fall back to an initial-letter avatar
  in the exact 4:5 frame with accessible alt text and `loading="lazy"`.
- Shared IDs allowed between a board member and team lead with cross-scope
  consistency checks (name, links).

### Change 3: No photos for team people
- Removed all photo fields, photo resolvers, avatar elements, and photo styles
  from team leads, co-leads, and members.
- Cards emphasize typographic hierarchy: Lead and Co-lead are visually larger
  and featured first.
- Dropdown disclosure shows branch, year, bio, LinkedIn, and GitHub links.
- Deleted obsolete `src/members/photos/sample.png`.
- Validator explicitly errors if a team person specifies a `photo` property.

### Data, model, tests, and scripts
- `src/members/members.js` — exports both `teams` and `board`, with templates
  for both. All dev preview entries set to `placeholder: true`.
- `src/members/memberModel.js` — `BOARD_PHOTO_SPEC`, `validateMembers(teams, board, photos)`,
  `prepareMembers(teams, opts)`, and `prepareBoard(board, opts)`.
- `src/members/memberCopy.js` — added `board: "Board"`.
- `src/members/index.js` — imports and exports prepared `teams` and `board`.
- `scripts/check-members.mjs` — validates both `teams` and `board` against
  photos from `photos/` and `photos/board/`.
- `src/members/memberModel.test.js` — 33 tests passing, covering required
  fields, unique IDs, URL protocols, 4:5 board photo geometry, team photo
  rejection, cross-scope identity, and placeholder filtering.
- `src/members/README.md` — teammate instructions for editing board and teams.

## Tunables

| File | Constant / Setting | Value | Meaning |
| --- | --- | --- | --- |
| `src/members/memberModel.js` | `BOARD_PHOTO_SPEC.width` / `height` | 1000 × 1250 | 4:5 portrait target dimensions |
| `src/members/memberModel.js` | `BOARD_PHOTO_SPEC.aspectTolerance` | 0.10 | Allowed aspect ratio deviation |
| `src/members/memberModel.js` | `BOARD_PHOTO_SPEC.maxBytes` | 200KB | Photo warning threshold |
| `src/members/MembersSection.jsx` | `scrollDistance` | `(teamCount - 1) * Math.max(500, 0.75vh)` | Vertical scroll travel per team |
| `src/members/MembersSection.jsx` | `snap.duration` | 0.15s – 0.35s | Snapping duration |
| `src/members/MembersSection.jsx` | `scrub` | 0.4s | Scrub lag for track slide |
| `src/members/MembersSection.jsx` | `updateTabVisuals` | scale: `1 - 0.42*t`, opacity: `1 - 0.78*t` | Tab distance-based scale/opacity falloff |
| `src/members/MembersSection.jsx` | panel dropdown reveal | 0.55s `power3.out` `clip-path` wipe | Top-to-bottom dropdown panel appearance |
| `src/members/MembersSection.jsx` | SplitType character reveal | 0.65s `power4.out`, 0.022s stagger | Line-masked character reveal for leader names |
| `src/members/members.css` | `--spacing`, `clamp()` | Responsive scales | Fluid typography & track spacing |

## Verification actually run

- `npm run lint`: **0 warnings, 0 errors** (oxlint on 66 files).
- `npm test`: **33 tests pass** (19 events + 14 members), 0 failures.
- `npm run check:members`: **Passes** ("Member check passed: 5 teams, 5 board entries. Photos and links are ready.").
- `npm run build`: **Passes**; `prebuild` runs both `check:events` and `check:members`. Clean production bundle produced.
- Edge cases tested in automated test suite:
  - Valid teams and board.
  - Missing team required fields (`id`, `name`, `role`).
  - Missing board required fields (`id`, `name`, `designation`).
  - Duplicate team IDs and duplicate board IDs.
  - Cross-team duplicate person IDs (rejected unless `shared: true`).
  - Shared identity between board member and team lead with matching vs conflicting details.
  - Team persons with photo field explicitly rejected.
  - Invalid LinkedIn and GitHub URLs (non-https, wrong domain).
  - 4:5 portrait board photos accepted; wide/non-4:5 rejected; missing photos flagged.
  - PNG header parsing in `imageSize`.
  - Missing lead falls back to "To be announced".
  - Production placeholder hiding when real entries exist; retention when all are placeholders.
  - Board ordering priority and photo resolution.

## Verification NOT performed

- Browser interaction using Cline's automated browser tool — the tool was not available in this environment.
- Real physical mobile devices (iOS / Android).
- Safari and Firefox browser rendering differences.
- Screen readers (VoiceOver, NVDA, JAWS) — ARIA attributes (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-expanded`, roving `tabIndex`) are implemented according to WAI-ARIA standards but not verified with assistive hardware.
- Real camera / photo CDN upload behavior.
