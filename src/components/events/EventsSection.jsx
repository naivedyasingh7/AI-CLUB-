import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
  events as configuredEvents,
  eventsForGallery,
} from "../../data/events";
import { useSmoothHorizontalScroll } from "../../hooks/useSmoothHorizontalScroll";
import { DPR_CAP, CAMERA_FOV, LABEL_PARALLAX } from "./galleryConfig";
import "./gallery.css";
const Scene = lazy(() => import("./EventsScene"));
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export default function EventsSection({
  events: suppliedEvents = configuredEvents,
}) {
  const events = useMemo(
    () =>
      eventsForGallery(suppliedEvents, location.search, import.meta.env.DEV),
    [suppliedEvents],
  );
  const viewport = useRef(null),
    passButtons = useRef([]),
    labels = useRef([]),
    progress = useRef(null),
    invalidate = useRef(null),
    fallbackTrack = useRef(null);
  const cameraConfig = useMemo(
    () => ({ position: [0, 0.975, 13], fov: CAMERA_FOV }),
    [],
  );
  const [visible, setVisible] = useState(false),
    [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [revealed, setRevealed] = useState(
    () =>
      !document.getElementById("loader-root") ||
      document.documentElement.dataset.loaderRevealed === "true",
  );
  const [palette] = useState(() => {
    const css = getComputedStyle(document.documentElement);
    return {
      bg: css.getPropertyValue("--color-bg").trim(),
      text: css.getPropertyValue("--color-text").trim(),
    };
  });
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)"),
      change = () => setReduced(media.matches),
      reveal = () => setRevealed(true);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.01 },
    );
    observer.observe(viewport.current);
    media.addEventListener("change", change);
    document.addEventListener("ai-club:reveal", reveal);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", change);
      document.removeEventListener("ai-club:reveal", reveal);
    };
  }, []);
  const frame = useCallback((state) => {
    const fraction = state.max ? state.current / state.max : 0;
    if (progress.current) {
      progress.current.style.transform = `scaleX(${fraction})`;
      progress.current.parentElement.setAttribute(
        "aria-valuenow",
        String(Math.round(fraction * 100)),
      );
    }
    labels.current.forEach((label, index) => {
      if (label)
        label.style.left = `${state.origin + (index * state.slot - state.current) * LABEL_PARALLAX}px`;
    });
    if (fallbackTrack.current) {
      fallbackTrack.current.style.transform = `translateX(${state.origin - state.slot / 2 - state.current}px)`;
      passButtons.current.forEach((button, index) => {
        if (button) {
          button.style.left = `${state.origin + index * state.slot - state.current}px`;
          button.style.top = "50%";
          button.style.transform = "translate(-50%,-50%)";
        }
      });
    }
    invalidate.current?.();
  }, []);
  const { motion, navigation, goTo, step } = useSmoothHorizontalScroll({
    viewportRef: viewport,
    count: events.length,
    active: visible && revealed,
    reduced,
    onFrame: frame,
  });
  useEffect(() => {
    frame(motion.current);
  }, [failed, frame, motion]);
  const project = useCallback((index, x, y, a, b, c, d) => {
    const button = passButtons.current[index];
    if (!button) return;
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
    button.style.transform = `translate(-50%,-50%) matrix(${a},${b},${c},${d},0,0)`;
    button.style.visibility = "visible";
  }, []);
  const fail = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const element = viewport.current;
    const lost = (event) => {
      event.preventDefault();
      fail();
    };
    element.addEventListener("webglcontextlost", lost, true);
    return () => element.removeEventListener("webglcontextlost", lost, true);
  }, [fail]);
  const fallback = (
    <div ref={fallbackTrack} className="gallery-fallback">
      {events.map((event) => (
        <div key={event.id}>
          <img
            src={event.badgeFront || event.posterSrc}
            alt=""
            draggable="false"
          />
        </div>
      ))}
    </div>
  );
  return (
    <section
      id="events"
      className="lanyard-gallery"
      aria-labelledby="events-heading"
      data-renderer={failed ? "fallback" : "webgl"}
    >
      <div
        ref={viewport}
        className="gallery-viewport"
        data-overflow={navigation.overflow}
        tabIndex={0}
        role="region"
        aria-label="Event lanyards; use arrow keys, scroll or swipe to browse"
      >
        <header className="gallery-heading">
          <h1 id="events-heading">AI CLUB / EVENTS</h1>
          <span>
            {String(navigation.index + 1).padStart(2, "0")} /{" "}
            {String(events.length).padStart(2, "0")}
          </span>
        </header>
        <div className="gallery-labels" aria-hidden="true">
          {events.map((event, index) => (
            <span
              key={event.id}
              ref={(element) => {
                labels.current[index] = element;
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          ))}
        </div>
        {events.length ? (
          failed ? (
            fallback
          ) : (
            <SceneBoundary onError={fail} fallback={fallback}>
              <Suspense
                fallback={
                  <p className="gallery-loading" role="status">
                    Preparing the event passes…
                  </p>
                }
              >
                <Canvas
                  dpr={[1, DPR_CAP]}
                  frameloop={visible && revealed ? "demand" : "never"}
                  camera={cameraConfig}
                  gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "low-power",
                  }}
                  onCreated={(state) => {
                    state.gl.domElement.setAttribute("aria-hidden", "true");
                    invalidate.current = state.invalidate;
                    state.invalidate();
                  }}
                >
                  <Scene
                    events={events}
                    palette={palette}
                    motion={motion}
                    reduced={reduced}
                    onProject={project}
                  />
                </Canvas>
              </Suspense>
            </SceneBoundary>
          )
        ) : (
          <p className="gallery-loading">
            Events will appear here when announced.
          </p>
        )}
        {events.map((event, index) => (
          <button
            key={event.id}
            ref={(element) => {
              passButtons.current[index] = element;
            }}
            className={`gallery-pass ${failed ? "gallery-pass-fallback" : ""}`}
            style={{
              visibility: failed ? "visible" : "hidden",
              "--pass-accent": event.accent,
            }}
            aria-label={`Open event: ${event.title}`}
            onFocus={(event) => {
              if (event.currentTarget.matches(":focus-visible"))
                goTo(index * motion.current.slot);
            }}
            onClick={() => {}}
          >
            <span className="gallery-pass-caption">
              <strong>{event.title}</strong>
              <small>
                {event.isPlaceholder ? "DEVELOPMENT PREVIEW" : event.group}
              </small>
              <span className="gallery-explore">
                <span aria-hidden="true">⌗</span> Explore event ↗
              </span>
            </span>
          </button>
        ))}
        <footer className="gallery-controls">
          <span>
            {navigation.overflow
              ? "SCROLL / SWIPE / DRAG TO BROWSE"
              : "THE EVENT ARCHIVE"}
          </span>
          <nav aria-label="Browse event lanyards">
            <button
              aria-label="Previous event"
              disabled={!navigation.previous}
              onClick={() => step(-1)}
            >
              ←
            </button>
            <div
              className="gallery-progress"
              role="progressbar"
              aria-label="Gallery scroll progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={0}
            >
              <span ref={progress} />
            </div>
            <button
              aria-label="Next event"
              disabled={!navigation.next}
              onClick={() => step(1)}
            >
              →
            </button>
          </nav>
        </footer>
      </div>
    </section>
  );
}
