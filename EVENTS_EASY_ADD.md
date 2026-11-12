# Event-authoring refactor

Follow-up branch: `refactor/events-easy-add`, based on Stage 1 commit `909f803`.
The teammate guide is [src/events/README.md](src/events/README.md).

## What changed

- `src/events/events.js` is the only event-details file to edit. It includes a
  fully commented copyable template, the India time-zone constant and the
  120-minute default duration. Undated previews explicitly use `start: null` and
  `placeholder: true`; real events require a valid confirmed start.
- `src/events/posters/` is the only event-artwork directory. The existing two SVG
  posters were moved byte-for-byte. A filename-only `import.meta.glob` resolver
  supplies Vite-managed URLs; teammates write no paths/imports.
- `src/events/eventModel.js` validates and normalizes authoring fields into the
  existing rendering shape. Status/order are computed on page load: live first,
  upcoming soonest, past newest. Production removes previews once real data exists;
  development keeps them and the existing dummy flag remains development-only.
- The same file shares measured badge geometry (1.64×2.14) with `EventBadge` and
  the recommended 820×1070px/82:107 poster spec. Safe margins are 100px on each side
  and 130px top/bottom; preferred WebP target is under 250KB. The existing 0.85 UV
  crop is unchanged. Images more than 15% from the face ratio fail validation.
- `badgeTextures.js` caches safe texture promises. Missing/failed images resolve
  to the existing club logo plus event title, retaining the same model, material,
  lighting and UV behavior. No additional canvas or page/UI element was added.
- `scripts/check-events.mjs` and `poster-metadata.mjs` check event fields and image
  headers without dependencies. `check:events` runs automatically as `prebuild`.
  The development module reports plain messages naming the event id and field.
- UI copy is kept separately in `src/events/eventCopy.js`; legacy data-path
  imports were removed. Existing motion, physics, loader and session files are
  unchanged by this follow-up. No package dependency was added.

## Verification actually run

- Lint, build (including prebuild), data check and 19 tests pass. The original 11
  non-retired tests are retained; new tests cover time conversion, duration,
  sorting, production filtering, defaults, validation and image header formats.
- The same India start produced `2026-12-12T04:30:00.000Z` in separate Node
  processes using UTC, America/New_York and Asia/Tokyo as their host zone.
- Actual Chrome-generated WebP, PNG and JPEG buffers at 820×1070 were read by the
  metadata checker successfully, in addition to the format-header unit fixtures.
- Compared Stage 1 and Stage 2 at 1440×900 with reduced motion: gallery screenshot
  pixel differences were zero; open-panel text and element bounds were identical.
  No runtime errors/warnings were recorded in that comparison.
- Added a real temporary entry and its temporary 820×1070 SVG by editing only the
  authoring file and poster directory. It appeared on the lanyard, opened its
  details and exposed the configured Register link. The entry and image were
  removed afterward and the production build was rebuilt with the real data.
- Omitted artwork and intentionally undecodable SVG artwork both used the logo
  and title fallback without losing the WebGL gallery. The intentional failures
  emitted the expected plain development warnings, not page errors.
- An intentionally invalid accent emitted the expected development-console
  validation message. The checker was also run against actual temporary edits
  for missing id/title/start, duplicate id, invalid start/end, reversed end,
  missing poster, unknown accent and incorrect aspect ratio. Every case failed
  with its id/field message. A bad entry stopped prebuild before Vite ran.
- A temporary real-event production build hid both preview entries and ignored
  the dummy query. The restored final build contains neither the temporary event
  nor its image; production with all-preview data still displays both previews.
- Final repeated interaction checks retain the prior focus/cleanup behavior.
  Stage 1's viewport, registration-keyboard and measurement results are recorded
  in [EVENTS_STAGE1.md](EVENTS_STAGE1.md).

The test fixtures/scripts/screenshots/logs live outside the repository in the
local `ai-club-events-qa` artifact folder. The shipped website contains no test
event or new visible controls. Date ordering is evaluated when the page loads;
reload a page left open across an event boundary to refresh its order.

Build still reports the existing large-chunk advisory. Physical-device FPS,
Safari/Firefox and screen-reader behavior were not tested. Existing remote-font
CORS errors in the untouched loader/home page remain outside this refactor.
