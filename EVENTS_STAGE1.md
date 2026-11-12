# Register-only panel and alignment

Stage 1 is on `feat/events-lanyard-gallery`. Register retains its original states,
110.67×44px size, left alignment, row padding and styling. The placeholder note
now says “Preview · registration unavailable” at 11px. The retired secondary
action, export generator, related helpers/copy and its sole dedicated test are
removed. All other date, status, URL, layout, transition and gallery tests remain.
`end` is retained for Live/Past status and the follow-up automatic ordering.

## Measurements (CSS pixels)

| Viewport | Left/right edge before → after | Panel top before → after | Badge centre before → after (new target) |
| --- | --- | --- | --- |
| 1440×900 | 32/39 → 32/32 | 83 → 84 | 364.47 → 394.00 (394.00) |
| 1366×768 | 32/39 → 32/32 | 83 → 84 | 345.55 → 370.00 (369.78) |
| 1280×720 | 32/39 → 32/32 | 83 → 84 | 323.56 → 345.50 (345.70) |

Breadcrumb and Close tops are 84px, and all HUD boxes remain 36px high. The shared
`--events-edge` variable accounts for the reserved 15px scrollbar gutter when
placing the panel. At 360px the responsive sheet uses symmetric 20px edge insets;
at 768px desktop insets are 32px. Existing narrower-width badge framing remains.

The wide-screen target is measured from the actual panel edge, with perspective
depth compensation for the rendered face. No spring, rope, damping, drag,
gallery easing, loader or session settings are changed.

## Checks

- Lint/build and 11 remaining Node tests pass; the build retains its existing
  lazy-chunk size advisory.
- Chrome/software WebGL at 360×844, 768×1000, 1440×900, 1366×768, 1280×720:
  actions visible without panel scrolling, one visible Close, aligned HUD,
  symmetric margins and no nav shift.
- Temporary short and very long descriptions, each with three speakers: pinned
  action, internal description scrolling and no overlapping content. These were
  injected by an external QA script; no test content was added to production.
- Enabled Register fixture: keyboard Tab → pass → Enter → Tab → Event details →
  Enter → Tab → Register → Esc; focus returns to the pass. Preview Register stays
  disabled, as before.
- Ten repeated focus/details/close cycles: zero remaining worlds/bodies after
  close; stable owned frame/listener baseline. Unmount releases frames/listeners.
- Reduced motion, forced overflow and navigation/Back checks remain covered.
  Legacy remote font failures on the untouched home page are recorded separately.

Before/after 1440px captures and browser logs live in the external local
`ai-club-events-qa` artifact folder. Real-device FPS, Safari/Firefox and assistive
technology were not tested.
