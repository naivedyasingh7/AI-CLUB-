// Credit: David Faure / Codrops horizontal-parallax-gallery-codrops (MIT); original React adaptation.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SCROLL_EASE,
  MAX_FRAME_DELTA,
  VELOCITY_EASE,
  WHEEL_LINE_PIXELS,
  SCROLL_SNAP_EPSILON,
  clamp,
  frameEase,
  galleryMetrics,
} from "../components/events/galleryConfig";

export function useSmoothHorizontalScroll({
  viewportRef,
  count,
  active,
  reduced,
  onFrame,
}) {
  const motion = useRef({
    current: 0,
    target: 0,
    velocity: 0,
    width: 1,
    slot: 1,
    origin: 0,
    max: 0,
    overflow: false,
    time: 0,
  });
  const callback = useRef(onFrame);
  const command = useRef(null);
  const [navigation, setNavigation] = useState({
    previous: false,
    next: false,
    index: 0,
    overflow: false,
  });
  useEffect(() => {
    callback.current = onFrame;
  }, [onFrame]);
  const goTo = useCallback((value) => command.current?.(value), []);
  const step = useCallback((direction) => {
    const state = motion.current;
    command.current?.(
      (Math.round(state.target / state.slot) + direction) * state.slot,
    );
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const state = motion.current;
    let frame = 0,
      last = 0,
      disposed = false;
    let pointer = null;
    const originalTouchAction = viewport.style.touchAction;
    const publish = () => {
      const next = {
        previous: state.target > SCROLL_SNAP_EPSILON,
        next: state.target < state.max - SCROLL_SNAP_EPSILON,
        index: Math.round(state.target / state.slot),
        overflow: state.overflow,
      };
      setNavigation((old) =>
        old.previous === next.previous &&
        old.next === next.next &&
        old.index === next.index &&
        old.overflow === next.overflow
          ? old
          : next,
      );
      callback.current?.(state);
    };
    const moveTo = (value) => {
      if (!active || document.hidden) return;
      state.target = clamp(value, 0, state.max);
      if (reduced) {
        state.current = state.target;
        state.velocity = 0;
      }
      publish();
    };
    command.current = moveTo;
    const resize = () => {
      const index = state.target / state.slot,
        currentIndex = state.current / state.slot;
      Object.assign(state, galleryMetrics(viewport.clientWidth, count));
      state.target = clamp(index * state.slot, 0, state.max);
      state.current = reduced
        ? state.target
        : clamp(currentIndex * state.slot, 0, state.max);
      state.velocity = 0;
      viewport.style.touchAction = state.overflow
        ? "pan-y"
        : originalTouchAction;
      publish();
    };
    const tick = (timestamp) => {
      if (disposed || !active || document.hidden) return;
      const dt = last
        ? Math.min(MAX_FRAME_DELTA, (timestamp - last) / 1000)
        : 1 / 60;
      last = timestamp;
      const previous = state.current;
      state.current +=
        (state.target - state.current) * frameEase(SCROLL_EASE, dt);
      if (Math.abs(state.current - state.target) < SCROLL_SNAP_EPSILON)
        state.current = state.target;
      const velocity = dt > 0 ? (state.current - previous) / dt : 0;
      state.velocity +=
        (velocity - state.velocity) * frameEase(VELOCITY_EASE, dt);
      state.time += dt;
      callback.current?.(state);
      frame = requestAnimationFrame(tick);
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      state.velocity = 0;
      if (active && !document.hidden && !reduced)
        frame = requestAnimationFrame(tick);
    };
    const wheel = (event) => {
      if (!active || !state.overflow || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const scale =
        event.deltaMode === 1
          ? WHEEL_LINE_PIXELS
          : event.deltaMode === 2
            ? state.width
            : 1;
      moveTo(
        state.target +
          (Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : event.deltaY) *
            scale,
      );
    };
    const key = (event) => {
      if (
        !active ||
        !state.overflow ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        moveTo(
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? state.max
              : state.target +
                (event.key === "ArrowLeft" ? -state.slot : state.slot),
        );
      }
    };
    const down = (event) => {
      const control = event.target.closest(
        "button, a, input, select, textarea",
      );
      const swipingPass =
        event.pointerType === "touch" &&
        control?.classList.contains("gallery-pass");
      if (
        !active ||
        !state.overflow ||
        event.button !== 0 ||
        (control && !swipingPass)
      )
        return;
      pointer = { id: event.pointerId, x: event.clientX, target: state.target };
      viewport.setPointerCapture(event.pointerId);
      viewport.dataset.dragging = "true";
    };
    const drag = (event) => {
      if (pointer?.id === event.pointerId)
        moveTo(pointer.target + pointer.x - event.clientX);
    };
    const release = () => {
      if (pointer && viewport.hasPointerCapture(pointer.id))
        viewport.releasePointerCapture(pointer.id);
      pointer = null;
      delete viewport.dataset.dragging;
    };
    viewport.addEventListener("wheel", wheel, { passive: false });
    viewport.addEventListener("keydown", key);
    viewport.addEventListener("pointerdown", down);
    viewport.addEventListener("pointermove", drag);
    viewport.addEventListener("pointerup", release);
    viewport.addEventListener("pointercancel", release);
    viewport.addEventListener("lostpointercapture", release);
    document.addEventListener("visibilitychange", visibility);
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    resize();
    visibility();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      command.current = null;
      release();
      observer.disconnect();
      viewport.removeEventListener("wheel", wheel);
      viewport.removeEventListener("keydown", key);
      viewport.removeEventListener("pointerdown", down);
      viewport.removeEventListener("pointermove", drag);
      viewport.removeEventListener("pointerup", release);
      viewport.removeEventListener("pointercancel", release);
      viewport.removeEventListener("lostpointercapture", release);
      document.removeEventListener("visibilitychange", visibility);
      viewport.style.touchAction = originalTouchAction;
      state.velocity = 0;
    };
  }, [viewportRef, count, active, reduced]);
  return { motion, navigation, goTo, step };
}
