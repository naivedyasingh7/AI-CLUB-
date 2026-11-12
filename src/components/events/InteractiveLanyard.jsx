// Original rig, informed by reference mechanics; no reference source/assets copied.
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  Physics,
  RigidBody,
  BallCollider,
  CuboidCollider,
  useRopeJoint,
  useSphericalJoint,
  useBeforePhysicsStep,
  useRapier,
} from "@react-three/rapier";
import {
  BufferGeometry,
  BufferAttribute,
  CatmullRomCurve3,
  DoubleSide,
  Quaternion,
  Vector2,
  Vector3,
  Raycaster,
  Plane,
  Color,
} from "three";
import { BadgeArtwork } from "./EventBadge";
import { EVENT_CONFIG as C } from "./eventModel";
import {
  PHYSICS_TIMESTEP,
  PHYSICS_GRAVITY,
  LINEAR_DAMPING,
  ANGULAR_DAMPING,
  ROPE_LENGTH,
  CONNECTOR,
  JOINT_MASS,
  BADGE_MASS,
  MAX_DRAG,
  DRAG_FOLLOW,
  FACING_SPRING,
  JOINT_FOLLOW_MIN,
  JOINT_FOLLOW_MAX,
  panelCarrier,
  PANEL_WIDE_BREAKPOINT,
} from "./focusConfig";
import { STRAP_ACCENT_MIX } from "./galleryConfig";
function FocusRig({
  event,
  palette,
  pose,
  visual,
  phase,
  mobile,
  grip,
  onProject,
  onReady,
  onDispose,
  onDrag,
}) {
  const anchor = useRef(),
    j1 = useRef(),
    j2 = useRef(),
    j3 = useRef(),
    body = useRef(),
    badge = useRef(),
    band = useRef(),
    elementRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  const { camera, gl, size } = useThree(),
    { rapier } = useRapier();
  const artworkMotion = useRef({ normalizedX: 0 }),
    carrier = useRef({ x: 0, y: 0 });
  const drag = useRef({
    active: false,
    id: null,
    offset: new Vector3(),
    target: new Vector3(),
  });
  const fabric = useTexture("/models/events/fabric.svg");
  const math = useMemo(
    () => ({
      pointer: new Vector2(),
      ray: new Raycaster(),
      plane: new Plane(new Vector3(0, 0, 1), 0),
      point: new Vector3(),
      next: new Vector3(),
      rotation: new Quaternion(),
      connector: new Vector3(),
      reach: new Vector3(),
      smooth1: new Vector3(...pose.joints[0]),
      smooth2: new Vector3(...pose.joints[1]),
      curve: new CatmullRomCurve3(
        Array.from({ length: 4 }, () => new Vector3()),
        false,
        "chordal",
      ),
      samples: Array.from({ length: 33 }, () => new Vector3()),
      tangent: new Vector3(),
      shift: new Vector3(),
      center: new Vector3(),
      right: new Vector3(),
      upper: new Vector3(),
      position: new Vector3(),
      quaternion: new Quaternion(),
    }),
    [pose],
  );
  const ribbon = useMemo(() => {
    const geometry = new BufferGeometry(),
      positions = new Float32Array(33 * 6),
      uv = new Float32Array(33 * 4),
      indices = [];
    for (let i = 0; i <= 32; i++) {
      uv.set([i / 16, 0, i / 16, 1], i * 4);
      if (i < 32) {
        const k = i * 2;
        indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    return geometry;
  }, []);
  useEffect(() => () => ribbon.dispose(), [ribbon]);
  useRopeJoint(anchor, j1, [[0, 0, 0], [0, 0, 0], ROPE_LENGTH]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], ROPE_LENGTH]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], ROPE_LENGTH]);
  useSphericalJoint(j3, body, [[0, 0, 0], CONNECTOR]);
  const stopRef = useRef(() => {});
  useEffect(() => {
    const api = {
      stopDrag: () => stopRef.current(),
      getPose: () => {
        badge.current.updateWorldMatrix(true, false);
        badge.current.getWorldPosition(math.position);
        badge.current.getWorldQuaternion(math.quaternion);
        return {
          anchor: math.curve.points[0].toArray(),
          joints: math.curve.points.slice(1).map((point) => point.toArray()),
          position: math.position.toArray(),
          quaternion: math.quaternion.toArray(),
        };
      },
    };
    // All bodies start at the captured pose, at rest. No introductory impulse.
    for (const ref of [anchor, j1, j2, j3, body]) {
      ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      ref.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
    math.curve.points[0].set(...pose.anchor);
    pose.joints.forEach((point, i) => math.curve.points[i + 1].set(...point));
    onReady(api);
    return () => onDispose(api);
  }, [math, pose, onReady, onDispose]);
  useBeforePhysicsStep(() => {
    if (!body.current) return;
    // Centre the rendered face, accounting for its perspective depth, without altering swing.
    badge.current.updateWorldMatrix(true, false);
    badge.current.localToWorld(math.position.set(0, -0.11, 0.11));
    const target = panelCarrier(
        camera,
        visual.current.panel,
        mobile,
        visual.current.focusX,
        innerWidth >= PANEL_WIDE_BREAKPOINT ? math.position.z : 0,
      ),
      dx = target.x - carrier.current.x,
      dy = target.y - carrier.current.y;
    if (dx || dy) {
      for (const ref of [anchor, j1, j2, j3, body]) {
        const point = ref.current.translation();
        ref.current.setTranslation(
          { x: point.x + dx, y: point.y + dy, z: point.z },
          true,
        );
      }
      math.shift.set(dx, dy, 0);
      math.smooth1.add(math.shift);
      math.smooth2.add(math.shift);
      drag.current.offset.x += dx;
      drag.current.offset.y += dy;
      drag.current.target.x += dx;
      drag.current.target.y += dy;
      carrier.current = target;
    }
    if (drag.current.active) {
      math.next
        .copy(body.current.translation())
        .lerp(
          drag.current.target,
          1 - Math.exp(-DRAG_FOLLOW * PHYSICS_TIMESTEP),
        );
      body.current.setNextKinematicTranslation(math.next);
      for (const ref of [j1, j2, j3, body]) ref.current.wakeUp();
    }
  });
  useEffect(() => {
    const element = grip.current,
      state = drag.current;
    elementRef.current = element;
    if (!element) return;
    let bound = true;
    const release = () => {
      state.active = false;
      if (state.id !== null && element.hasPointerCapture(state.id))
        element.releasePointerCapture(state.id);
      state.id = null;
      if (bound) body.current?.setBodyType(rapier.RigidBodyType.Dynamic, true);
      setDragging(false);
      onDrag(false);
    };
    stopRef.current = release;
    const point = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      math.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      math.ray.setFromCamera(math.pointer, camera);
      math.ray.ray.intersectPlane(math.plane, math.point);
      return math.point;
    };
    const down = (event) => {
      if (event.button !== 0 || !body.current || phaseRef.current === "CLOSING")
        return;
      event.preventDefault();
      event.stopPropagation();
      math.plane.constant = -body.current.translation().z;
      state.offset.copy(body.current.translation()).sub(point(event));
      state.target.copy(body.current.translation());
      state.active = true;
      state.id = event.pointerId;
      element.setPointerCapture(event.pointerId);
      body.current.setBodyType(
        rapier.RigidBodyType.KinematicPositionBased,
        true,
      );
      setDragging(true);
      onDrag(true);
    };
    const move = (event) => {
      if (!state.active) return;
      state.target.copy(point(event)).add(state.offset);
      const height =
          (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z) /
          camera.zoom,
        width = height * camera.aspect;
      state.target.x = Math.max(
        Math.max(
          -width / 2 + C.badgeWidth / 2 + 0.12,
          carrier.current.x - MAX_DRAG,
        ),
        Math.min(
          Math.min(
            width / 2 - C.badgeWidth / 2 - 0.12,
            carrier.current.x + MAX_DRAG,
          ),
          state.target.x,
        ),
      );
      state.target.y = Math.max(
        camera.position.y - height / 2 + C.badgeHeight / 2 + 0.12,
        Math.min(
          camera.position.y + height / 2 - C.badgeHeight / 2 - 0.12,
          state.target.y,
        ),
      );
      math.rotation.copy(body.current.rotation());
      math.connector.set(...CONNECTOR).applyQuaternion(math.rotation);
      math.reach
        .copy(state.target)
        .add(math.connector)
        .sub(anchor.current.translation());
      if (math.reach.length() > ROPE_LENGTH * 3) {
        math.reach.setLength(ROPE_LENGTH * 3);
        state.target
          .copy(anchor.current.translation())
          .add(math.reach)
          .sub(math.connector);
      }
    };
    const key = (event) => {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
      ) {
        event.preventDefault();
        body.current.applyImpulse(
          {
            x:
              event.key === "ArrowLeft"
                ? -0.65
                : event.key === "ArrowRight"
                  ? 0.65
                  : 0,
            y: 0,
            z:
              event.key === "ArrowUp"
                ? -0.3
                : event.key === "ArrowDown"
                  ? 0.3
                  : 0,
          },
          true,
        );
      }
    };
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", release);
    element.addEventListener("pointercancel", release);
    element.addEventListener("lostpointercapture", release);
    element.addEventListener("keydown", key);
    return () => {
      bound = false;
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", release);
      element.removeEventListener("pointercancel", release);
      element.removeEventListener("lostpointercapture", release);
      element.removeEventListener("keydown", key);
      release();
      element.style.visibility = "hidden";
    };
  }, [grip, gl, camera, math, rapier, onDrag]);
  useFrame((_, delta) => {
    if (!body.current || !band.current) return;
    const dt = Math.min(delta, 0.05);
    if (!drag.current.active && !body.current.isSleeping()) {
      const velocity = body.current.angvel(),
        rotation = body.current.rotation();
      body.current.setAngvel(
        {
          x: velocity.x,
          y: velocity.y - rotation.y * FACING_SPRING * dt * 60,
          z: velocity.z,
        },
        false,
      );
    }
    const follow = (smooth, target) => {
      const distance = Math.max(0.1, Math.min(1, smooth.distanceTo(target)));
      smooth.lerp(
        target,
        1 -
          Math.exp(
            -(
              JOINT_FOLLOW_MIN +
              distance * (JOINT_FOLLOW_MAX - JOINT_FOLLOW_MIN)
            ) * dt,
          ),
      );
    };
    follow(math.smooth1, j1.current.translation());
    follow(math.smooth2, j2.current.translation());
    math.curve.points[0].copy(anchor.current.translation());
    math.curve.points[1].copy(math.smooth1);
    math.curve.points[2].copy(math.smooth2);
    math.curve.points[3].copy(j3.current.translation());
    const attribute = band.current.geometry.attributes.position;
    for (let i = 0; i <= 32; i++) {
      const value = math.curve.getPoint(i / 32, math.samples[i]);
      math.curve.getTangent(i / 32, math.tangent);
      const sx = (-math.tangent.y * C.strapWorldWidth) / 2,
        sy = (math.tangent.x * C.strapWorldWidth) / 2;
      attribute.setXYZ(i * 2, value.x - sx, value.y - sy, value.z);
      attribute.setXYZ(i * 2 + 1, value.x + sx, value.y + sy, value.z);
    }
    attribute.needsUpdate = true;
    badge.current.updateWorldMatrix(true, false);
    badge.current.localToWorld(math.center.set(0, -0.11, 0.11));
    badge.current.localToWorld(math.right.set(0.9, -0.11, 0.11));
    badge.current.localToWorld(math.upper.set(0, 1.19, 0.11));
    math.center.project(camera);
    math.right.project(camera);
    math.upper.project(camera);
    const x = ((math.center.x + 1) * size.width) / 2,
      y = ((1 - math.center.y) * size.height) / 2;
    artworkMotion.current.normalizedX = (x - size.width / 2) / size.width;
    onProject(
      x,
      y,
      (((math.right.x + 1) * size.width) / 2 - x) / 90,
      (((1 - math.right.y) * size.height) / 2 - y) / 90,
      (x - ((math.upper.x + 1) * size.width) / 2) / 130,
      (y - ((1 - math.upper.y) * size.height) / 2) / 130,
    );
  });
  const props = {
    colliders: false,
    linearDamping: LINEAR_DAMPING,
    angularDamping: ANGULAR_DAMPING,
    canSleep: true,
  };
  const color = useMemo(
    () =>
      new Color(palette.text).lerp(new Color(event.accent), STRAP_ACCENT_MIX),
    [palette, event.accent],
  );
  return (
    <group visible={phase !== "ACTIVATING"}>
      <RigidBody ref={anchor} type="fixed" position={pose.anchor} />
      {[
        [j1, 0],
        [j2, 1],
        [j3, 2],
      ].map(([ref, index]) => (
        <RigidBody
          key={index}
          ref={ref}
          {...props}
          position={pose.joints[index]}
        >
          <BallCollider args={[0.04]} collisionGroups={0} mass={JOINT_MASS} />
        </RigidBody>
      ))}
      <RigidBody
        ref={body}
        {...props}
        position={pose.position}
        quaternion={pose.quaternion}
        type={dragging ? "kinematicPosition" : "dynamic"}
        additionalSolverIterations={8}
        ccd
      >
        <CuboidCollider
          args={[0.9, 1.3, 0.07]}
          mass={BADGE_MASS}
          collisionGroups={0}
        />
        <group ref={badge}>
          <BadgeArtwork
            event={event}
            palette={palette}
            galleryMotion={artworkMotion}
            pixelVisual={visual}
          />
        </group>
      </RigidBody>
      <mesh ref={band} geometry={ribbon} frustumCulled={false}>
        <meshBasicMaterial color={color} map={fabric} side={DoubleSide} />
      </mesh>
    </group>
  );
}
export default function FocusLanyard(props) {
  return (
    <Physics
      gravity={[0, PHYSICS_GRAVITY, 0]}
      timeStep={PHYSICS_TIMESTEP}
      interpolate
      paused={props.paused || props.phase === "ACTIVATING"}
      numSolverIterations={8}
    >
      <FocusRig {...props} />
    </Physics>
  );
}
