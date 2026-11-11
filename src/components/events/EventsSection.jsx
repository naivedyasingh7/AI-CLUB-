import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import { events as configuredEvents } from "../../data/events";
import {
  EVENT_CONFIG as C,
  FALLBACK_POSTER,
  eventStatus,
  eventDateLabel,
  galleryLayout,
  interactionReducer,
} from "./eventModel";
import "./events.css";
const Scene = lazy(() => import("./EventsScene"));
import Details from "./EventDetailPanel";
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function usePreference(query) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query);
    const update = () => setMatches(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}
function Status({ event }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!event.start) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [event.start]);
  return <small>{eventStatus(event, now)}</small>;
}
export default function EventsSection({ events = configuredEvents }) {
  const section = useRef(null),
    progress = useRef({ angle: 0 }),
    mode = useRef("BROWSING"),
    explore = useRef(null);
  const [selection, dispatch] = useReducer(interactionReducer, {
    mode: "BROWSING",
    selectedId: null,
  });
  const [visible, setVisible] = useState(false);
  const [browseIndex, setBrowseIndex] = useState(0);
  const [origin, setOrigin] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);
  const closeDetails = useCallback(() => dispatch({ type: "CLOSE" }), []);
  useEffect(() => {
    if (failed && selection.mode === "SELECTING") dispatch({ type: "SETTLED" });
    if (failed && selection.mode === "RETURNING")
      dispatch({ type: "RETURNED" });
  }, [failed, selection.mode]);
  useEffect(() => {
    if (selection.mode === "INTERACTIVE")
      explore.current?.focus({ preventScroll: true });
    if (selection.mode === "BROWSING" && selection.selectedId)
      section.current
        .querySelector(`[data-event-id="${CSS.escape(selection.selectedId)}"]`)
        ?.focus({ preventScroll: true });
  }, [selection.mode, selection.selectedId]);
  useEffect(() => {
    mode.current = selection.mode;
  }, [selection.mode]);
  const reduced = usePreference("(prefers-reduced-motion: reduce)"),
    mobile = usePreference(
      "(max-width: 767px), (pointer: coarse), (max-height: 500px)",
    );
  const [palette] = useState(() => {
    const css = getComputedStyle(document.documentElement);
    return {
      bg: css.getPropertyValue("--color-bg").trim(),
      text: css.getPropertyValue("--color-text").trim(),
    };
  });
  const selected = events.find((event) => event.id === selection.selectedId);
  const settle = useCallback((type) => dispatch({ type }), []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(
      section.current.querySelector(".events-stage") || section.current,
    );
    return () => observer.disconnect();
  }, [events.length]);
  useEffect(() => {
    if (
      events.filter((event) => !event.development).length < 3 ||
      reduced ||
      mobile
    )
      return;
    // Only this instance is owned here. Existing horizontal/section triggers survive.
    const trigger = window.ScrollTrigger?.create({
      id: "events-archive",
      trigger: section.current.querySelector(".events-stage"),
      start: "top top+=70",
      end: `+=${Math.min(C.maximumPin, events.length * C.galleryScrollPerEvent)}`,
      pin: section.current.querySelector(".events-stage"),
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (mode.current === "BROWSING") {
          progress.current.angle =
            (-self.progress * C.rotationRadians * (events.length - 1)) /
            events.length;
          setBrowseIndex(
            Math.min(
              events.length - 1,
              Math.round(self.progress * (events.length - 1)),
            ),
          );
        }
      },
    });
    window.ScrollTrigger?.sort();
    window.ScrollTrigger?.refresh();
    return () => trigger?.kill();
  }, [events, reduced, mobile]);
  useEffect(() => {
    let frame = 0;
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        window.ScrollTrigger?.refresh();
      });
    });
    resize.observe(section.current.querySelector(".events-shell"));
    return () => {
      resize.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);
  useEffect(() => {
    const stage = section.current.querySelector(".events-stage");
    if (!stage) return;
    const lose = (event) => {
      event.preventDefault();
      fail();
    };
    stage.addEventListener("webglcontextlost", lose, true);
    return () => stage.removeEventListener("webglcontextlost", lose, true);
  }, [events.length, fail]);
  useEffect(() => {
    if (
      selection.selectedId &&
      !events.some((event) => event.id === selection.selectedId)
    )
      dispatch({ type: "RESET" });
  }, [events, selection.selectedId]);
  useEffect(() => {
    if (location.hash !== "#events") return;
    const frame = requestAnimationFrame(() => {
      window.ScrollTrigger?.refresh();
      section.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const choose = (id) => {
    if (selection.mode === "BROWSING") {
      if (!reduced) import("./InteractiveLanyard").catch(fail);
      mode.current = "SELECTING";
      const stage = section.current.querySelector(".events-stage");
      const pin = window.ScrollTrigger?.getById("events-archive");
      if (pin) {
        window.scrollTo({
          top: Math.max(pin.start + 2, Math.min(pin.end - 2, scrollY)),
          behavior: "instant",
        });
      } else {
        stage?.scrollIntoView({
          block: "center",
          behavior: reduced ? "instant" : "smooth",
        });
      }
      dispatch({ type: "SELECT", id });
    }
  };
  const fallback = (
    <div className="events-fallback">
      <img
        src={selected?.poster || events[0]?.poster || FALLBACK_POSTER}
        onError={(e) => {
          if (e.currentTarget.src.endsWith(FALLBACK_POSTER)) {
            e.currentTarget.style.display = "none";
            return;
          }
          e.currentTarget.src = FALLBACK_POSTER;
        }}
        alt="AI Club development preview pass"
      />
      <p>A collection of moments, made together.</p>
    </div>
  );
  return (
    <section
      ref={section}
      className="events-archive"
      style={{
        "--event-glow": `${C.glow * 20}px`,
        "--event-breathe": `${C.indicatorBreathSeconds}s`,
      }}
      id="events"
      aria-labelledby="events-heading"
      data-mode={selection.mode}
      data-renderer={failed ? "fallback" : "webgl"}
      onKeyDown={(e) => {
        if (
          e.key === "Escape" &&
          selection.mode === "INTERACTIVE" &&
          !dragging
        ) {
          e.preventDefault();
          dispatch({ type: "RETURN" });
        }
      }}
    >
      <div className="events-shell">
        <header className="events-heading">
          <div className="events-eyebrow">
            <span>AI CLUB / VIT BHOPAL</span>
            <span>THE EVENT ARCHIVE</span>
          </div>
          <h2 id="events-heading">
            Good things
            <br />
            <span>bring us together.</span>
          </h2>
          <div className="events-intro">
            <span className="events-index">
              [ E / {String(events.length).padStart(2, "0")} ]
            </span>
            <p>
              A pass to the next possibility.
              <br />
              Choose a lanyard. Step inside.
            </p>
          </div>
        </header>
        {events.length ? (
          <>
            <div
              className="events-stage"
              aria-label="Suspended event pass gallery"
            >
              <div className="events-stage-label">
                <span>PASS ARCHIVE</span>
                <span>
                  {String(events.length).padStart(2, "0")}{" "}
                  {events.length === 1 ? "ENTRY" : "ENTRIES"}
                </span>
              </div>
              {failed ? (
                fallback
              ) : (
                <SceneBoundary fallback={fallback} onError={fail}>
                  <Suspense fallback={fallback}>
                    <Canvas
                      fallback={fallback}
                      onCreated={({ gl }) =>
                        gl.domElement.setAttribute("aria-hidden", "true")
                      }
                      dpr={[1, C.dpr]}
                      frameloop={
                        visible &&
                        !reduced &&
                        ![
                          "OPENING_DETAILS",
                          "DETAILS_OPEN",
                          "CLOSING_DETAILS",
                        ].includes(selection.mode) &&
                        (events.length > 1 || selection.mode !== "BROWSING")
                          ? "always"
                          : "demand"
                      }
                      camera={{
                        position: [
                          0,
                          1.1,
                          galleryLayout(events.length).radius +
                            C.browseDistance,
                        ],
                        fov: C.cameraFov,
                      }}
                      gl={{
                        antialias: true,
                        alpha: false,
                        powerPreference: "low-power",
                      }}
                    >
                      <Scene
                        events={events}
                        palette={palette}
                        progress={progress}
                        selection={selection}
                        onSelect={choose}
                        onSettled={settle}
                        visible={visible}
                        reduced={reduced}
                        onDrag={setDragging}
                      />
                    </Canvas>
                  </Suspense>
                </SceneBoundary>
              )}
              {selected && selection.mode !== "BROWSING" && (
                <div className="events-selection-controls">
                  <span aria-live="polite">
                    {selection.mode === "SELECTING"
                      ? "Bringing your pass into view…"
                      : selected.title}
                  </span>
                  <button
                    disabled={dragging}
                    className="events-text-button"
                    onClick={() =>
                      dispatch({
                        type:
                          selection.mode === "SELECTING" ? "CANCEL" : "RETURN",
                      })
                    }
                  >
                    Return to archive ↗
                  </button>
                </div>
              )}
              {[
                "INTERACTIVE",
                "OPENING_DETAILS",
                "DETAILS_OPEN",
                "CLOSING_DETAILS",
              ].includes(selection.mode) && (
                <div className="events-explore-row">
                  <p>
                    {reduced
                      ? "Your event pass is ready."
                      : "Drag the pass. Feel the weight. Then step inside."}
                  </p>
                  <button
                    ref={explore}
                    className="events-explore"
                    disabled={dragging || selection.mode !== "INTERACTIVE"}
                    onClick={() => {
                      setOrigin(
                        section.current
                          .querySelector("[data-event-grip]")
                          ?.getBoundingClientRect() || null,
                      );
                      dispatch({ type: "EXPLORE" });
                    }}
                  >
                    <span aria-hidden="true">⌗</span> Explore event{" "}
                    <span aria-hidden="true">↗</span>
                  </button>
                </div>
              )}
              <div className="events-stage-footer">
                <span>
                  {selection.mode === "BROWSING"
                    ? "SELECT A PASS TO ENTER"
                    : "YOUR PASS. YOUR PERSPECTIVE."}
                </span>
                <span>↗</span>
              </div>
            </div>
            {events.length > 1 && (
              <nav className="events-browse" aria-label="Browse event passes">
                <button
                  disabled={selection.mode !== "BROWSING"}
                  onClick={() => {
                    const index =
                      (browseIndex - 1 + events.length) % events.length;
                    setBrowseIndex(index);
                    progress.current.angle =
                      -index * galleryLayout(events.length).step;
                  }}
                >
                  ← Previous pass
                </button>
                <span>
                  {String(browseIndex + 1).padStart(2, "0")} /{" "}
                  {String(events.length).padStart(2, "0")}
                </span>
                <button
                  disabled={selection.mode !== "BROWSING"}
                  onClick={() => {
                    const index = (browseIndex + 1) % events.length;
                    setBrowseIndex(index);
                    progress.current.angle =
                      -index * galleryLayout(events.length).step;
                  }}
                >
                  Next pass →
                </button>
              </nav>
            )}
            <div className="events-bottom">
              <div className="events-event-list" aria-label="Choose an event">
                {events.map((event, index) => (
                  <button
                    key={event.id}
                    data-event-id={event.id}
                    onClick={() => choose(event.id)}
                    disabled={selection.mode !== "BROWSING"}
                  >
                    <span className="events-list-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <Status event={event} />
                      <strong>{event.title}</strong>
                      <span>{eventDateLabel(event)}</span>
                    </span>
                    <span className="events-list-arrow">↗</span>
                  </button>
                ))}
              </div>
              <p className="events-note">
                {events.every((event) => event.development) ? (
                  <>
                    Every gathering starts
                    <br />
                    with an idea. This one
                    <br />
                    is still taking shape.
                  </>
                ) : (
                  <>
                    Ideas become gatherings.
                    <br />
                    Gatherings become
                    <br />
                    our shared archive.
                  </>
                )}
              </p>
            </div>
            {selected &&
              ["OPENING_DETAILS", "DETAILS_OPEN", "CLOSING_DETAILS"].includes(
                selection.mode,
              ) && (
                <Suspense
                  fallback={<p role="status">Opening event details…</p>}
                >
                  <Details
                    event={selected}
                    mode={selection.mode}
                    onTransition={settle}
                    onClose={closeDetails}
                    reduced={reduced}
                    palette={palette}
                    origin={origin}
                  />
                </Suspense>
              )}
          </>
        ) : (
          <p className="events-empty">
            The archive is open. Events will appear here when announced.
          </p>
        )}
      </div>
    </section>
  );
}
