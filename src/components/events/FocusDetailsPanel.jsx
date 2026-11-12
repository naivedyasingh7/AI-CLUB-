import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import SplitType from "split-type";
import PixelReveal from "./PixelReveal";
import { calendarText, eventDateLabel, safeEventUrl } from "./eventModel";
import {
  PANEL_SIDE,
  PANEL_REVEAL_DURATION,
  PANEL_EXIT_DURATION,
  PANEL_TEXT_STAGGER,
  PANEL_TEXT_DURATION,
  PANEL_TEXT_DELAY,
  PANEL_FOCUS_DELAY,
  PIXEL_RESOLVE_DURATION,
  FOCUS_EASE,
} from "./focusConfig";

export default function FocusDetailsPanel({
  ref,
  event,
  palette,
  reduced,
  mobile,
  onClose,
}) {
  const panel = useRef(null),
    copy = useRef(null),
    close = useRef(null),
    pixel = useRef(null),
    lines = useRef([]),
    calendarLink = useRef(null);
  const normalized = useMemo(
    () => ({
      ...event,
      start: event.startsAt || event.start,
      development: event.isPlaceholder || event.development,
    }),
    [event],
  );
  const calendar = useMemo(() => calendarText(normalized), [normalized]);
  useEffect(() => {
    if (!calendar) return;
    const url = URL.createObjectURL(
      new Blob([calendar], { type: "text/calendar;charset=utf-8" }),
    );
    if (calendarLink.current) calendarLink.current.href = url;
    return () => URL.revokeObjectURL(url);
  }, [calendar]);
  useLayoutEffect(() => {
    const split = new SplitType(
      copy.current.querySelectorAll("[data-panel-reveal]"),
      { types: "lines", lineClass: "focus-panel-line" },
    );
    lines.current = split.lines || [];
    pixel.current?.draw(0.5);
    return () => {
      split.revert();
      lines.current = [];
    };
  }, [event]);
  useEffect(() => {
    close.current.focus({ preventScroll: true });
    const trap = (event) => {
      if (event.key !== "Tab") return;
      const controls = Array.from(
        panel.current.querySelectorAll(
          'button:not(:disabled),a[href],[tabindex="0"]',
        ),
      ).filter((node) => node.getClientRects().length);
      const first = controls[0],
        last = controls.at(-1),
        outside = !panel.current.contains(document.activeElement);
      if (
        outside ||
        controls.length === 1 ||
        (!event.shiftKey && document.activeElement === last) ||
        (event.shiftKey && document.activeElement === first)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    };
    document.addEventListener("keydown", trap, true);
    return () => document.removeEventListener("keydown", trap, true);
  }, []);
  useImperativeHandle(
    ref,
    () => ({
      enter(timeline, at = 0) {
        const duration = reduced ? 0 : PANEL_REVEAL_DURATION;
        const hidden = mobile
          ? "inset(100% 0% 0% 0%)"
          : PANEL_SIDE === "right"
            ? "inset(0% 0% 0% 100%)"
            : "inset(0% 100% 0% 0%)";
        timeline.fromTo(
          panel.current,
          {
            autoAlpha: 0,
            clipPath: hidden,
            xPercent: mobile ? 0 : PANEL_SIDE === "right" ? 12 : -12,
            yPercent: mobile ? 12 : 0,
          },
          {
            autoAlpha: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            xPercent: 0,
            yPercent: 0,
            duration,
            ease: FOCUS_EASE,
          },
          at,
        );
        timeline.fromTo(
          lines.current,
          { yPercent: reduced ? 0 : 105, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: reduced ? 0 : PANEL_TEXT_DURATION,
            stagger: reduced ? 0 : PANEL_TEXT_STAGGER,
            ease: "power2.out",
          },
          at + (reduced ? 0 : PANEL_TEXT_DELAY),
        );
        timeline.call(
          () => close.current?.focus({ preventScroll: true }),
          null,
          at + (reduced ? 0 : PANEL_FOCUS_DELAY),
        );
        const reveal = { value: 0.5 };
        timeline.to(
          reveal,
          {
            value: 1,
            duration: reduced ? 0 : PIXEL_RESOLVE_DURATION,
            ease: "power2.out",
            onUpdate: () => pixel.current?.draw(reveal.value),
          },
          at,
        );
      },
      exit(timeline, at = 0) {
        timeline.to(
          panel.current,
          {
            autoAlpha: 0,
            clipPath: mobile
              ? "inset(100% 0% 0% 0%)"
              : PANEL_SIDE === "right"
                ? "inset(0% 0% 0% 100%)"
                : "inset(0% 100% 0% 0%)",
            duration: reduced ? 0 : PANEL_EXIT_DURATION,
            ease: FOCUS_EASE,
          },
          at,
        );
      },
    }),
    [reduced, mobile],
  );
  const placeholder = !!(event.isPlaceholder || event.development),
    registration = !placeholder && safeEventUrl(event.registrationUrl);
  const when = normalized.start
    ? eventDateLabel(normalized)
    : "To be announced";
  return (
    <aside
      ref={panel}
      className="focus-panel"
      data-focus-panel
      data-side={PANEL_SIDE}
      role="dialog"
      aria-modal="false"
      aria-labelledby="focus-panel-title"
      aria-describedby="focus-panel-description"
    >
      <header className="focus-panel-bar">
        <span>{placeholder ? "DEVELOPMENT PREVIEW" : "AI CLUB / EVENTS"}</span>
        <button ref={close} aria-label="Close event details" onClick={onClose}>
          Close <span aria-hidden="true">×</span>
        </button>
      </header>
      <div ref={copy} className="focus-panel-copy">
        <div className="focus-panel-intro">
          <div>
            <h2 id="focus-panel-title" data-panel-reveal>
              {event.title || "To be announced"}
            </h2>
            <p className="focus-panel-tagline" data-panel-reveal>
              {event.tagline || "To be announced"}
            </p>
          </div>
          <div className="focus-panel-art">
            <PixelReveal
              ref={pixel}
              src={event.posterSrc || event.poster || event.badgeFront}
              palette={palette}
              reduced={reduced}
            />
          </div>
        </div>
        <dl className="focus-panel-facts">
          {[
            ["WHEN", when],
            ["WHERE", event.venue || "To be announced"],
            ["BY", event.group || event.community || "To be announced"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd data-panel-reveal>{value}</dd>
            </div>
          ))}
        </dl>
        <p
          id="focus-panel-description"
          className="focus-panel-description"
          data-panel-reveal
        >
          {event.description || "To be announced"}
        </p>
        {!!event.speakers?.length && (
          <section className="focus-panel-speakers">
            <h3 data-panel-reveal>Speakers</h3>
            {event.speakers.map((person) => (
              <p key={person.name} data-panel-reveal>
                <strong>{person.name}</strong>
                {person.role && <span>{person.role}</span>}
              </p>
            ))}
          </section>
        )}
        <footer className="focus-panel-actions">
          {registration ? (
            <a href={registration} target="_blank" rel="noopener noreferrer">
              Register ↗
            </a>
          ) : (
            <button disabled>Register · TBA</button>
          )}
          {!placeholder && calendar ? (
            <a ref={calendarLink} download={`${event.id}.ics`}>
              Add to calendar
            </a>
          ) : (
            <button disabled>Add to calendar · TBA</button>
          )}
          {placeholder && (
            <small>Preview · booking and calendar unavailable</small>
          )}
        </footer>
      </div>
    </aside>
  );
}
