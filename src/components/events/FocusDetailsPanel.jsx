import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import SplitType from "split-type";
import { eventCopy } from "../../events";
import { eventDateLabel, safeEventUrl } from "./eventModel";
import {
  PANEL_SIDE,
  PANEL_BADGE_X,
  PANEL_WIDE_BREAKPOINT,
  PANEL_REVEAL_DURATION,
  PANEL_EXIT_DURATION,
  PANEL_TEXT_STAGGER,
  PANEL_TEXT_DURATION,
  PANEL_TEXT_DELAY,
  PANEL_FOCUS_DELAY,
  FOCUS_EASE,
} from "./focusConfig";

export default function FocusDetailsPanel({
  ref,
  event,
  reduced,
  mobile,
  onClose,
  externalClose,
}) {
  const panel = useRef(null),
    copy = useRef(null),
    close = useRef(null),
    lines = useRef([]);
  const normalized = useMemo(
    () => ({
      ...event,
      start: event.startsAt || event.start,
      development: event.isPlaceholder || event.development,
    }),
    [event],
  );
  useLayoutEffect(() => {
    const split = new SplitType(
      copy.current.querySelectorAll("[data-panel-reveal]"),
      { types: "lines", lineClass: "focus-panel-line" },
    );
    lines.current = split.lines || [];
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
      ).filter(
        (node) =>
          node.getClientRects().length &&
          getComputedStyle(node).visibility !== "hidden",
      );
      if (!controls.length) return;
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
      focusX() {
        const element = panel.current;
        return innerWidth >= PANEL_WIDE_BREAKPOINT
          ? element.offsetLeft / (2 * element.offsetParent.clientWidth)
          : PANEL_BADGE_X;
      },
      enter(timeline, at = 0) {
        // Hand off the single visible Close control when the panel starts revealing.
        timeline.set(externalClose.current, { autoAlpha: 0 }, at);
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
      },
      exit(timeline, at = 0) {
        timeline.set(
          externalClose.current,
          { autoAlpha: 1 },
          at + (reduced ? 0 : PANEL_EXIT_DURATION),
        );
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
    [reduced, mobile, externalClose],
  );
  const placeholder = !!(event.isPlaceholder || event.development),
    registration = !placeholder && safeEventUrl(event.registrationUrl);
  const when = normalized.start
    ? eventDateLabel(normalized)
    : eventCopy.unannounced;
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
        <span>{placeholder ? eventCopy.preview : eventCopy.eyebrow}</span>
        <button ref={close} aria-label="Close event details" onClick={onClose}>
          Close <span aria-hidden="true">×</span>
        </button>
      </header>
      <div ref={copy} className="focus-panel-copy">
        <div className="focus-panel-intro">
          <div>
            <h2 id="focus-panel-title" data-panel-reveal>
              {event.title || eventCopy.unannounced}
            </h2>
            <p className="focus-panel-tagline" data-panel-reveal>
              {event.tagline || eventCopy.unannounced}
            </p>
          </div>
        </div>
        <dl className="focus-panel-facts">
          {[
            [eventCopy.when, when],
            [eventCopy.where, event.venue || eventCopy.unannounced],
            [
              eventCopy.by,
              event.group || event.community || eventCopy.unannounced,
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd data-panel-reveal>{value}</dd>
            </div>
          ))}
        </dl>
        <div
          className="focus-panel-scroll"
          tabIndex={0}
          role="region"
          aria-label="Event description and speakers"
        >
          <p
            id="focus-panel-description"
            className="focus-panel-description"
            data-panel-reveal
          >
            {event.description || eventCopy.unannounced}
          </p>
          {!!event.speakers?.length && (
            <section className="focus-panel-speakers">
              <h3 data-panel-reveal>{eventCopy.speakers}</h3>
              {event.speakers.map((person) => (
                <p key={person.name} data-panel-reveal>
                  <strong>{person.name}</strong>
                  {person.role && <span>{person.role}</span>}
                </p>
              ))}
            </section>
          )}
        </div>
      </div>
      <footer className="focus-panel-actions">
        {registration ? (
          <a href={registration} target="_blank" rel="noopener noreferrer">
            {eventCopy.register}
          </a>
        ) : (
          <button disabled>{eventCopy.registerPending}</button>
        )}
        {placeholder && <small>{eventCopy.previewActions}</small>}
      </footer>
    </aside>
  );
}
