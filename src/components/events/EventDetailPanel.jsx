import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import PixelReveal from "./PixelReveal";
import {
  EVENT_CONFIG as C,
  FALLBACK_POSTER,
  calendarText,
  eventDateLabel,
  eventStatus,
  eventTimes,
  safeEventUrl,
} from "./eventModel";
function Countdown({ event, now }) {
  const dates = eventTimes(event);
  if (!dates || now >= dates.start) return null;
  const seconds = Math.max(0, Math.floor((dates.start - now) / 1000));
  return (
    <p className="event-countdown" aria-label="Time until event starts">
      {Math.floor(seconds / 86400)}d{" "}
      <span>
        {String(Math.floor(seconds / 3600) % 24).padStart(2, "0")}h{" "}
        {String(Math.floor(seconds / 60) % 60).padStart(2, "0")}m{" "}
        {String(seconds % 60).padStart(2, "0")}s
      </span>
    </p>
  );
}
export default function EventDetailPanel({
  event,
  mode,
  onTransition,
  onClose,
  reduced,
  palette,
  origin,
}) {
  const dialog = useRef(null),
    art = useRef(null),
    copy = useRef(null),
    closeButton = useRef(null),
    target = useRef(null);
  const motion = useRef({ progress: 0 }),
    pixel = useRef(null);
  const [now, setNow] = useState(Date.now);
  const status = eventStatus(event, now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const node = dialog.current,
      body = document.body,
      html = document.documentElement;
    const previous = {
      overflow: body.style.overflow,
      padding: body.style.paddingRight,
      gutter: html.style.scrollbarGutter,
    };
    const gutter = innerWidth - html.clientWidth;
    if (gutter > 0) html.style.scrollbarGutter = "stable";
    if (gutter > 0 && getComputedStyle(html).scrollbarGutter !== "stable")
      body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gutter}px`;
    // Mobile pages can have a wider layout viewport than the visible viewport.
    // Fit this dialog to the visual viewport without changing global page styles.
    const fitViewport = () => {
      const viewport = window.visualViewport;
      if (viewport && matchMedia("(max-width: 767px)").matches) {
        Object.assign(node.style, {
          left: `${viewport.offsetLeft}px`,
          top: `${viewport.offsetTop}px`,
          width: `${viewport.width}px`,
          height: `${viewport.height}px`,
          right: "auto",
          bottom: "auto",
          margin: "0",
        });
      } else {
        for (const property of [
          "left",
          "top",
          "width",
          "height",
          "right",
          "bottom",
          "margin",
        ])
          node.style.removeProperty(property);
      }
    };
    fitViewport();
    window.visualViewport?.addEventListener("resize", fitViewport);
    window.visualViewport?.addEventListener("scroll", fitViewport);
    window.addEventListener("resize", fitViewport);
    body.style.overflow = "hidden";
    node.showModal();
    closeButton.current.focus({ preventScroll: true });
    target.current = art.current.getBoundingClientRect();
    return () => {
      window.visualViewport?.removeEventListener("resize", fitViewport);
      window.visualViewport?.removeEventListener("scroll", fitViewport);
      window.removeEventListener("resize", fitViewport);
      node.close();
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.padding;
      html.style.scrollbarGutter = previous.gutter;
    };
  }, []);
  useEffect(() => {
    if (!["OPENING_DETAILS", "CLOSING_DETAILS"].includes(mode)) return;
    const opening = mode === "OPENING_DETAILS";
    const rect = target.current || art.current.getBoundingClientRect();
    const source = origin || {
      left: innerWidth / 2 - 90,
      top: innerHeight / 2 - 120,
      width: 180,
      height: 240,
    };
    const from = {
      x: source.left - rect.left,
      y: source.top - rect.top,
      scaleX: source.width / Math.max(1, rect.width),
      scaleY: source.height / Math.max(1, rect.height),
    };
    const duration = reduced
      ? 0.15
      : opening
        ? C.revealDuration
        : C.closeDuration;
    const timeline = (window.gsap || gsap).timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => onTransition(opening ? "OPENED" : "CLOSED"),
    });
    if (opening) {
      timeline
        .fromTo(
          art.current,
          from,
          { x: 0, y: 0, scaleX: 1, scaleY: 1, duration },
          0,
        )
        .fromTo(
          copy.current,
          { opacity: 0, y: reduced ? 0 : 20 },
          { opacity: 1, y: 0, duration: Math.min(duration, 0.55) },
          reduced ? 0 : 0.45,
        );
    } else {
      timeline
        .to(art.current, { ...from, opacity: 0, duration }, 0)
        .to(
          copy.current,
          { opacity: 0, y: reduced ? 0 : 12, duration: duration * 0.6 },
          0,
        );
    }
    timeline.to(
      motion.current,
      {
        progress: opening ? 1 : 0,
        duration,
        ease: "none",
        onUpdate: () => pixel.current?.draw(motion.current.progress),
      },
      0,
    );
    return () => timeline.kill();
  }, [mode, reduced, onTransition, origin]);
  const hasRecap =
    event.recap?.highlights?.length ||
    event.recap?.images?.length ||
    event.recap?.statistics?.length;
  const recapUrl =
    safeEventUrl(event.recap?.url) || (hasRecap ? "#event-recap" : null);
  const registration =
    event.registrationState === "open"
      ? safeEventUrl(event.registrationUrl)
      : null;
  const join = safeEventUrl(event.joinUrl);
  const cta =
    status === "PAST"
      ? recapUrl
      : status === "LIVE NOW"
        ? join
        : status === "UPCOMING"
          ? registration
          : null;
  const ctaLabel =
    status === "PAST"
      ? "View recap"
      : status === "LIVE NOW"
        ? "Join event"
        : "Register for event";
  const calendar = calendarText(event);
  const people = (label, items) =>
    items?.length ? (
      <section className="event-people">
        <h3>{label}</h3>
        {items.map((person) => (
          <p key={person.name}>
            <strong>{person.name}</strong>
            {person.role && <span>{person.role}</span>}
          </p>
        ))}
      </section>
    ) : null;
  return createPortal(
    <dialog
      ref={dialog}
      className="event-dialog"
      aria-labelledby="event-detail-title"
      aria-describedby="event-detail-description"
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const controls = Array.from(
          dialog.current.querySelectorAll(
            'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
          ),
        ).filter((node) => node.getClientRects().length);
        const first = controls[0],
          last = controls[controls.length - 1];
        if (
          controls.length === 1 ||
          (!e.shiftKey && document.activeElement === last) ||
          (e.shiftKey && document.activeElement === first)
        ) {
          e.preventDefault();
          (e.shiftKey ? last : first)?.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="event-dialog-bar">
        <span>AI CLUB / EVENT ARCHIVE</span>
        <button
          ref={closeButton}
          onClick={onClose}
          aria-label="Close event details"
        >
          Close <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="event-dialog-layout">
        <div className="event-dialog-art" ref={art}>
          <PixelReveal
            src={event.poster || FALLBACK_POSTER}
            ref={pixel}
            palette={palette}
            reduced={reduced}
          />
          <p>
            {event.development
              ? "DEVELOPMENT PREVIEW — NOT AN ANNOUNCED EVENT"
              : "AI CLUB / VIT BHOPAL"}
          </p>
        </div>
        <div className="event-dialog-copy" ref={copy}>
          <p className="event-status">
            {status === "LIVE NOW" && (
              <span className="event-live-dot" aria-hidden="true" />
            )}
            {status}
          </p>
          <h2 id="event-detail-title">{event.title}</h2>
          {event.tagline && <p className="event-tagline">{event.tagline}</p>}
          <dl className="event-facts">
            <div>
              <dt>WHEN</dt>
              <dd>
                {eventDateLabel(event)}
                {eventTimes(event) && (
                  <small>{event.timeZone || "Asia/Kolkata"}</small>
                )}
              </dd>
            </div>
            <div>
              <dt>WHERE</dt>
              <dd>
                {event.venue ||
                  (event.mode === "online"
                    ? "Online"
                    : "Venue to be announced")}
              </dd>
            </div>
            {event.community && (
              <div>
                <dt>BY</dt>
                <dd>{event.community}</dd>
              </div>
            )}
          </dl>
          <p className="event-description" id="event-detail-description">
            {event.description}
          </p>
          {status === "UPCOMING" && <Countdown event={event} now={now} />}
          {cta && (
            <a
              className="event-primary-action"
              href={cta}
              target={cta.startsWith("#") ? undefined : "_blank"}
              rel="noopener noreferrer"
            >
              {ctaLabel}
              <span aria-hidden="true">↗</span>
            </a>
          )}
          {status === "UPCOMING" && calendar && (
            <a
              className="event-calendar"
              download={`${event.id}.ics`}
              href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`}
            >
              Add to calendar ↗
            </a>
          )}
          {safeEventUrl(event.externalUrl) && (
            <a
              className="event-calendar"
              href={safeEventUrl(event.externalUrl)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Event website ↗
            </a>
          )}
          {!event.development &&
            event.registrationState === "closed" &&
            status === "UPCOMING" && <p>Registration is closed.</p>}
          {people("Speakers", event.speakers)}
          {people("Judges", event.judges)}
          {event.agenda?.length > 0 && (
            <section>
              <h3>On the programme</h3>
              <ol className="event-agenda">
                {event.agenda.map((item) => (
                  <li key={`${item.time}-${item.title}`}>
                    <time>{item.time}</time>
                    <span>{item.title}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <div id="event-recap">
            {(status === "PAST" ? event.recap?.highlights : event.highlights)
              ?.length > 0 && (
              <section>
                <h3>{status === "PAST" ? "From the event" : "Highlights"}</h3>
                <ul>
                  {(status === "PAST"
                    ? event.recap.highlights
                    : event.highlights
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
            {status === "PAST" && event.recap?.images?.length > 0 && (
              <div className="event-recap-images">
                {event.recap.images.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt={`${event.title} recap ${i + 1}`}
                    loading="lazy"
                  />
                ))}
              </div>
            )}
            {status === "PAST" && event.recap?.statistics?.length > 0 && (
              <dl className="event-facts">
                {event.recap.statistics.map((stat) => (
                  <div key={stat.label}>
                    <dt>{stat.label}</dt>
                    <dd>{stat.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
