import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { preloadFocusPhysics } from "../components/events/focusPhysicsLoader";
import {
  FOCUS_CENTRE_DURATION,
  FOCUS_DIM_DURATION,
  FOCUS_DIM_DELAY,
  BADGE_SHIFT_DURATION,
  STATIC_BLEND_DURATION,
  HANDOFF_RENDER_DELAY,
  GALLERY_RESTORE_DURATION,
  PANEL_EXIT_DURATION,
  DETAIL_BUTTON_GAP,
  DETAIL_BUTTON_RADIUS,
  FOCUS_EASE,
  REDUCED_TRANSITION_TICK,
  PIXEL_RESOLVE_DURATION,
  PANEL_BADGE_X,
} from "../components/events/focusConfig";

const initial = {
  mode: "BROWSING",
  index: null,
  pose: null,
  returnPose: null,
  physicsMounted: false,
  physicsVisible: false,
  panelMounted: false,
};
export function useEventFocus({
  motion,
  viewport,
  passButtons,
  frame,
  reduced,
  onLock,
}) {
  const [focus, setFocus] = useState(initial),
    [dragging, setDragging] = useState(false);
  const state = useRef(initial),
    visual = useRef({
      focus: 0,
      panel: 0,
      blend: 1,
      pixel: 1,
      focusX: PANEL_BADGE_X,
    }),
    saved = useRef(null),
    rig = useRef(null),
    ready = useRef(false),
    unavailable = useRef(false),
    context = useRef(null),
    timeline = useRef(null),
    restore = useRef(false);
  const grip = useRef(null),
    details = useRef(null),
    connector = useRef(null),
    panel = useRef(null);
  const commit = useCallback((patch) => {
    const next = { ...state.current, ...patch };
    state.current = next;
    setFocus(next);
  }, []);
  useLayoutEffect(() => {
    context.current = gsap.context(() => {}, viewport);
    return () => {
      timeline.current?.kill();
      context.current?.revert();
      rig.current?.stopDrag();
      rig.current = null;
    };
  }, [viewport]);
  useLayoutEffect(() => {
    if (!focus.panelMounted) return;
    const measure = () => {
      visual.current.focusX = panel.current?.focusX() ?? PANEL_BADGE_X;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [focus.panelMounted, viewport]);
  useEffect(() => {
    let cancelled = false;
    preloadFocusPhysics()
      .then(() => {
        if (cancelled) return;
        ready.current = true;
        if (state.current.mode === "WAITING") commit({ mode: "ARMING" });
      })
      .catch(() => {
        if (cancelled) return;
        unavailable.current = true;
        if (state.current.mode === "WAITING") commit({ mode: "ARMING" });
      });
    return () => {
      cancelled = true;
    };
  }, [commit]);
  const select = useCallback(
    (index) => {
      if (state.current.mode !== "BROWSING") return;
      saved.current = {
        current: motion.current.current,
        target: motion.current.target,
      };
      gsap.set(motion.current, { target: motion.current.current, velocity: 0 });
      Object.assign(visual.current, { focus: 0, panel: 0, blend: 1, pixel: 1 });
      onLock(true);
      commit({ ...initial, mode: "SELECTING", index });
    },
    [motion, commit, onLock],
  );
  const close = useCallback(() => {
    if (["BROWSING", "CLOSING"].includes(state.current.mode)) return;
    rig.current?.stopDrag();
    commit({ mode: "CLOSING" });
  }, [commit]);
  const open = useCallback(() => {
    if (state.current.mode !== "FOCUSED" || dragging) return;
    commit({ mode: "OPENING_DETAILS", panelMounted: true });
  }, [commit, dragging]);
  const active = focus.mode !== "BROWSING";
  useEffect(() => {
    if (!active) return;
    const previous = {
      overflow: document.body.style.overflow,
      padding: document.body.style.paddingRight,
    };
    const scrollbar = innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) {
      if (
        getComputedStyle(document.documentElement).scrollbarGutter !== "stable"
      )
        document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`;
    }
    document.body.style.overflow = "hidden";
    const escape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("keydown", escape, true);
      document.body.style.overflow = previous.overflow;
      document.body.style.paddingRight = previous.padding;
    };
  }, [active, close]);
  useEffect(() => {
    if (focus.mode === "FOCUSED")
      (grip.current || details.current)?.focus({ preventScroll: true });
    if (focus.mode === "BROWSING" && restore.current) {
      const index = restore.current - 1;
      passButtons.current[index]?.focus({ preventScroll: true });
      restore.current = false;
    }
  }, [focus.mode, passButtons]);
  useEffect(() => {
    const duration = (value) => (reduced ? 0 : value);
    let owned;
    context.current.add(() => {
      if (focus.mode === "SELECTING") {
        owned = gsap.timeline({
          paused: true,
          onComplete: () => {
            if (state.current.mode === "SELECTING")
              commit({
                mode:
                  ready.current || unavailable.current ? "ARMING" : "WAITING",
              });
          },
        });
        owned
          .addLabel("lock", 0)
          .addLabel("centre", 0)
          .to(
            motion.current,
            {
              current: focus.index * motion.current.slot,
              target: focus.index * motion.current.slot,
              velocity: 0,
              duration: duration(FOCUS_CENTRE_DURATION),
              ease: FOCUS_EASE,
              onUpdate: () => frame(motion.current),
            },
            "centre",
          )
          .addLabel("dim", duration(FOCUS_DIM_DELAY))
          .to(
            visual.current,
            {
              focus: 1,
              duration: duration(FOCUS_DIM_DURATION),
              ease: FOCUS_EASE,
            },
            "dim",
          )
          .addLabel("handoff");
      }
      if (focus.mode === "OPENING_DETAILS") {
        owned = gsap.timeline({
          paused: true,
          onComplete: () => {
            if (state.current.mode === "OPENING_DETAILS")
              commit({ mode: "DETAILS_OPEN" });
          },
        });
        owned
          .addLabel("badge-aside", 0)
          .fromTo(
            visual.current,
            { pixel: reduced ? 1 : 0.5 },
            {
              pixel: 1,
              duration: duration(PIXEL_RESOLVE_DURATION),
              ease: "power2.out",
            },
            "badge-aside",
          )
          .to(
            visual.current,
            {
              panel: 1,
              duration: duration(BADGE_SHIFT_DURATION),
              ease: FOCUS_EASE,
            },
            "badge-aside",
          )
          .addLabel("panel-in");
        panel.current?.enter(owned, duration(BADGE_SHIFT_DURATION));
        owned.addLabel("details-ready");
      }
      if (focus.mode === "CLOSING") {
        const hadPanel = state.current.panelMounted,
          hadPhysics = state.current.physicsMounted;
        owned = gsap.timeline({
          paused: true,
          onComplete: () => {
            const index = state.current.index;
            restore.current = index + 1;
            Object.assign(visual.current, {
              focus: 0,
              panel: 0,
              blend: 1,
              pixel: 1,
            });
            onLock(false);
            commit(initial);
            context.current?.clear();
            frame(motion.current);
          },
        });
        owned.addLabel("panel-out", 0);
        if (hadPanel) panel.current?.exit(owned, 0);
        const centreAt = hadPanel ? duration(PANEL_EXIT_DURATION) : 0;
        owned.addLabel("badge-centre", centreAt).to(
          visual.current,
          {
            panel: 0,
            duration: hadPanel ? duration(BADGE_SHIFT_DURATION) : 0,
            ease: FOCUS_EASE,
          },
          "badge-centre",
        );
        const releaseAt =
          centreAt + (hadPanel ? duration(BADGE_SHIFT_DURATION) : 0);
        owned.addLabel("release-physics", releaseAt).call(
          () => {
            const pose = rig.current?.getPose() || null;
            visual.current.blend = pose ? 0 : 1;
            commit({
              physicsMounted: false,
              physicsVisible: false,
              returnPose: pose,
            });
          },
          null,
          "release-physics",
        );
        const blendAt =
          releaseAt + (hadPhysics ? duration(HANDOFF_RENDER_DELAY) : 0);
        owned.addLabel("static-blend", blendAt).to(
          visual.current,
          {
            blend: 1,
            duration: hadPhysics ? duration(STATIC_BLEND_DURATION) : 0,
            ease: FOCUS_EASE,
          },
          "static-blend",
        );
        const restoreAt =
          blendAt + (hadPhysics ? duration(STATIC_BLEND_DURATION) : 0);
        owned
          .call(
            () => commit({ returnPose: null, panelMounted: false }),
            null,
            restoreAt,
          )
          .addLabel("restore-gallery", restoreAt)
          .to(
            visual.current,
            {
              focus: 0,
              duration: duration(GALLERY_RESTORE_DURATION),
              ease: FOCUS_EASE,
            },
            "restore-gallery",
          )
          .to(
            motion.current,
            {
              current: saved.current?.current || 0,
              target: saved.current?.target || 0,
              velocity: 0,
              duration: duration(GALLERY_RESTORE_DURATION),
              ease: FOCUS_EASE,
              onUpdate: () => frame(motion.current),
            },
            "restore-gallery",
          )
          .addLabel("unlock");
      }
    });
    if (owned) {
      if (reduced && owned.duration() === 0)
        owned.to({}, { duration: REDUCED_TRANSITION_TICK });
      timeline.current = owned;
      owned.play(0);
    }
    return () => owned?.kill();
  }, [focus.mode, focus.index, reduced, motion, frame, commit, onLock]);
  const onHandoff = useCallback(
    (pose) => {
      if (state.current.mode !== "ARMING") return;
      commit({
        mode: unavailable.current ? "FOCUSED" : "ACTIVATING",
        pose,
        physicsMounted: !unavailable.current,
        physicsVisible: false,
      });
    },
    [commit],
  );
  const onRigReady = useCallback(
    (api) => {
      rig.current = api;
      if (state.current.mode === "ACTIVATING")
        commit({ mode: "FOCUSED", physicsVisible: true });
    },
    [commit],
  );
  const onRigDispose = useCallback((api) => {
    if (rig.current === api) rig.current = null;
  }, []);
  const project = useCallback(
    (x, y, a, b, c, d) => {
      const element = grip.current;
      if (element) {
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.transform = `translate(-50%,-50%) matrix(${a},${b},${c},${d},0,0)`;
        // Publish the keyboard grip and its next Tab stop in the same frame.
        element.style.visibility =
          state.current.physicsVisible &&
          (state.current.mode !== "FOCUSED" || details.current)
            ? "visible"
            : "hidden";
      }
      const halfWidth = Math.abs(a * 90) + Math.abs(c * 130),
        width = viewport.current?.clientWidth || innerWidth;
      const buttonX = Math.max(
        DETAIL_BUTTON_RADIUS + 12,
        Math.min(
          width - DETAIL_BUTTON_RADIUS - 12,
          x + halfWidth + DETAIL_BUTTON_GAP,
        ),
      );
      if (details.current) {
        const firstProjection = details.current.style.visibility !== "visible";
        details.current.style.visibility = "visible";
        if (firstProjection)
          (grip.current || details.current).focus({ preventScroll: true });
        details.current.style.left = `${buttonX}px`;
        details.current.style.top = `${y}px`;
      }
      if (connector.current) {
        connector.current.setAttribute("x1", String(x + halfWidth));
        connector.current.setAttribute("y1", String(y));
        connector.current.setAttribute(
          "x2",
          String(buttonX - DETAIL_BUTTON_RADIUS),
        );
        connector.current.setAttribute("y2", String(y));
      }
    },
    [viewport],
  );
  const resetAfterError = useCallback(() => {
    timeline.current?.kill();
    rig.current?.stopDrag();
    if (saved.current) gsap.set(motion.current, saved.current);
    Object.assign(visual.current, { focus: 0, panel: 0, blend: 1, pixel: 1 });
    onLock(false);
    commit(initial);
  }, [motion, onLock, commit]);
  return {
    focus,
    state,
    visual,
    grip,
    details,
    connector,
    panel,
    select,
    close,
    open,
    onHandoff,
    onRigReady,
    onRigDispose,
    onDrag: setDragging,
    dragging,
    project,
    restore,
    resetAfterError,
  };
}
