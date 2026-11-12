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
  eventCopy,
} from "../../events";
import { useSmoothHorizontalScroll } from "../../hooks/useSmoothHorizontalScroll";
import { DPR_CAP, CAMERA_FOV, LABEL_PARALLAX } from "./galleryConfig";
import { useEventFocus } from "../../hooks/useEventFocus";
import FocusDetailsPanel from "./FocusDetailsPanel";
import { defaultBadgeFace } from "../../events/badgeTextures";
import {
  EMPTY_CLICK_SLOP,
  OTHERS_OPACITY,
  MOBILE_BREAKPOINT,
} from "./focusConfig";
import "./gallery.css";
import "./focus.css";
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
      import.meta.env.DEV
        ? eventsForGallery(suppliedEvents, location.search, true)
        : suppliedEvents,
    [suppliedEvents],
  );
  const viewport = useRef(null),
    passButtons = useRef([]),
    labels = useRef([]),
    progress = useRef(null),
    invalidate = useRef(null),
    fallbackTrack = useRef(null),
    mainCanvas = useRef(null),
    emptyDown = useRef(null);
  const labelLayer = useRef(null);
  const focusClose = useRef(null);
  const cameraConfig = useMemo(
    () => ({ position: [0, 0.975, 13], fov: CAMERA_FOV }),
    [],
  );
  const [scrollLocked, setScrollLocked] = useState(false);
  const [mobile, setMobile] = useState(
    () => matchMedia(`(max-width:${MOBILE_BREAKPOINT - 1}px)`).matches,
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
    const mobileMedia = matchMedia(`(max-width:${MOBILE_BREAKPOINT - 1}px)`),
      changeMobile = () => setMobile(mobileMedia.matches);
    mobileMedia.addEventListener("change", changeMobile);
    media.addEventListener("change", change);
    document.addEventListener("ai-club:reveal", reveal);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", change);
      mobileMedia.removeEventListener("change", changeMobile);
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
    locked: scrollLocked,
  });
  const {
    focus,
    visual,
    state: focusState,
    grip: focusGrip,
    details: detailsButton,
    connector: connectorLine,
    panel: detailsPanel,
    select: selectEvent,
    close: closeFocus,
    open: openDetails,
    onHandoff,
    onRigReady,
    onRigDispose,
    onDrag,
    dragging,
    project: projectFocus,
    restore: restoringFocus,
    resetAfterError,
  } = useEventFocus({
    motion,
    viewport,
    passButtons,
    frame,
    reduced,
    onLock: setScrollLocked,
  });
  const selected = focus.index === null ? null : events[focus.index];
  const focusActive = focus.mode !== "BROWSING";
  useEffect(() => {
    frame(motion.current);
  }, [failed, frame, motion]);
  const project = (index, x, y, a, b, c, d) => {
    if (labelLayer.current)
      labelLayer.current.style.opacity = String(1 - visual.current.panel);
    if (focusState.current.index === index && focusState.current.physicsVisible)
      return;
    const button = passButtons.current[index];
    if (!button) return;
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
    button.style.transform = `translate(-50%,-50%) matrix(${a},${b},${c},${d},0,0)`;
    button.style.visibility = "visible";
    button.style.opacity = String(
      focusState.current.index === index
        ? 1
        : (1 - (1 - OTHERS_OPACITY) * visual.current.focus) *
            (1 - visual.current.panel),
    );
    if (
      focusState.current.index === index &&
      focusState.current.mode === "FOCUSED" &&
      !focusState.current.physicsMounted
    )
      projectFocus(x, y, a, b, c, d);
  };
  const fail = useCallback(() => {
    resetAfterError();
    setFailed(true);
  }, [resetAfterError]);
  useEffect(() => {
    const element = viewport.current;
    const lost = (event) => {
      if (event.target !== mainCanvas.current) return;
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
            src={
              event.badgeFront ||
              event.posterSrc ||
              defaultBadgeFace(event.title)
            }
            onError={(e) => {
              if (e.currentTarget.dataset.fallback) return;
              e.currentTarget.dataset.fallback = "true";
              e.currentTarget.src = defaultBadgeFace(event.title);
            }}
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
      data-focus-state={focus.mode}
      data-physics={focus.physicsMounted ? "active" : "none"}
    >
      <div
        ref={viewport}
        className="gallery-viewport"
        data-overflow={navigation.overflow}
        tabIndex={0}
        role="region"
        aria-label="Event lanyards; use arrow keys, scroll or swipe to browse"
        onPointerDownCapture={(event) => {
          emptyDown.current = { x: event.clientX, y: event.clientY };
        }}
        onClick={(event) => {
          if (
            !focusActive ||
            event.target.closest("button,a,[data-focus-panel]")
          )
            return;
          const start = emptyDown.current;
          if (
            start &&
            Math.hypot(event.clientX - start.x, event.clientY - start.y) <=
              EMPTY_CLICK_SLOP
          )
            closeFocus();
        }}
      >
        <header className="gallery-heading">
          <h1 id="events-heading">{eventCopy.eyebrow}</h1>
          <span hidden={focus.panelMounted}>
            {String(
              focusActive ? focus.index + 1 : navigation.index + 1,
            ).padStart(2, "0")}{" "}
            / {String(events.length).padStart(2, "0")}
          </span>
        </header>
        <div ref={labelLayer} className="gallery-labels" aria-hidden="true">
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
                  frameloop={
                    visible && revealed
                      ? focus.physicsMounted
                        ? "always"
                        : "demand"
                      : "never"
                  }
                  camera={cameraConfig}
                  gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "low-power",
                  }}
                  onCreated={(state) => {
                    state.gl.domElement.setAttribute("aria-hidden", "true");
                    mainCanvas.current = state.gl.domElement;
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
                    focus={focus}
                    visual={visual}
                    mobile={mobile}
                    visible={visible && revealed}
                    grip={focusGrip}
                    onPhysicalProject={projectFocus}
                    onHandoff={onHandoff}
                    onRigReady={onRigReady}
                    onRigDispose={onRigDispose}
                    onDrag={onDrag}
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
            className={`gallery-pass ${failed ? "gallery-pass-fallback" : ""} ${focusActive && focus.index !== index ? "is-unfocused" : ""} ${focus.index === index && focus.physicsVisible ? "is-physical" : ""}`}
            style={{
              visibility: failed ? "visible" : "hidden",
              "--pass-accent": event.accent,
            }}
            aria-label={`Open event: ${event.title}`}
            disabled={focusActive || failed}
            onFocus={(event) => {
              if (
                !restoringFocus.current &&
                event.currentTarget.matches(":focus-visible")
              )
                goTo(index * motion.current.slot);
            }}
            onClick={() => selectEvent(index)}
          >
            <span className="gallery-pass-caption">
              <strong>{event.title}</strong>
              <small>
                {event.isPlaceholder ? eventCopy.preview : event.group}
              </small>
            </span>
          </button>
        ))}
        {focusActive && (
          <button
            ref={focusClose}
            className="gallery-focus-close"
            aria-label="Close focused event"
            onClick={closeFocus}
          >
            Close <span aria-hidden="true">×</span>
          </button>
        )}
        {focus.physicsMounted && (
          <button
            ref={focusGrip}
            className={`focus-grip ${dragging ? "is-dragging" : ""}`}
            style={{ visibility: "hidden" }}
            aria-label={`Drag ${selected.title} pass; arrow keys swing the badge`}
          />
        )}
        {focus.mode === "FOCUSED" && (
          <>
            <p className="focus-hint" role="status">
              {focus.physicsVisible ? "Drag to interact" : "Event preview"}
            </p>
            <svg className="focus-connector" aria-hidden="true">
              <line ref={connectorLine} />
            </svg>
            <button
              ref={detailsButton}
              className="focus-details-button"
              style={{
                "--focus-accent": selected.accent,
                visibility: "hidden",
              }}
              aria-label="Event details"
              disabled={dragging}
              onClick={openDetails}
            >
              <span aria-hidden="true">⌗</span>
              <small>Event details</small>
            </button>
          </>
        )}
        {["WAITING", "ARMING", "ACTIVATING"].includes(focus.mode) && (
          <p className="focus-hint" role="status">
            Preparing interaction…
          </p>
        )}
        {focus.panelMounted && selected && (
          <FocusDetailsPanel
            ref={detailsPanel}
            event={selected}
            reduced={reduced}
            mobile={mobile}
            onClose={closeFocus}
            externalClose={focusClose}
          />
        )}
        <footer className="gallery-controls" hidden={focusActive}>
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
