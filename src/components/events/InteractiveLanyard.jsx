import { useEffect, useMemo, useRef, useState } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import {
  CatmullRomCurve3,
  Plane,
  Quaternion,
  Vector2,
  Vector3,
  Raycaster,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
extend({ MeshLineGeometry, MeshLineMaterial });
import { BadgeArtwork } from "./EventBadge";
import { EVENT_CONFIG as C } from "./eventModel";

function Lanyard({ event, radius, palette, paused, onDrag, grip }) {
  const strapRef = useRef(),
    anchor = useRef(),
    j1 = useRef(),
    j2 = useRef(),
    j3 = useRef(),
    body = useRef(),
    gripElement = useRef(null);
  const [dragging, setDragging] = useState(false);
  useEffect(
    () => () => {
      onDrag?.(false);
    },
    [onDrag],
  );
  const { camera, gl, size } = useThree();
  const fabric = useTexture("/models/events/fabric.svg");
  useEffect(() => {
    Object.assign(fabric, {
      wrapS: RepeatWrapping,
      wrapT: RepeatWrapping,
      colorSpace: SRGBColorSpace,
      anisotropy: 8,
      needsUpdate: true,
    });
  }, [fabric]);
  const introduced = useRef(false);
  const drag = useRef({
    active: false,
    offset: new Vector3(),
    target: new Vector3(),
  });
  const math = useMemo(
    () => ({
      pointer: new Vector2(),
      ray: new Raycaster(),
      plane: new Plane(new Vector3(0, 0, 1), -radius),
      point: new Vector3(),
      curve: new CatmullRomCurve3(
        [new Vector3(), new Vector3(), new Vector3(), new Vector3()],
        false,
        "chordal",
      ),
      samples: Array.from({ length: C.strapSamples + 1 }, () => new Vector3()),
      sampleTarget: new Vector3(),
      smooth1: new Vector3(0.1, C.railY - C.ropeLength, radius),
      smooth2: new Vector3(0.18, C.railY - C.ropeLength * 2, radius),
      connector: new Vector3(),
      reach: new Vector3(),
      anchor: new Vector3(0, C.railY, radius),
      rotation: new Quaternion(),
      center: new Vector3(),
      right: new Vector3(),
      upper: new Vector3(),
    }),
    [radius],
  );
  useRopeJoint(anchor, j1, [[0, 0, 0], [0, 0, 0], C.ropeLength]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], C.ropeLength]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], C.ropeLength]);
  useSphericalJoint(j3, body, [
    [0, 0, 0],
    [0, C.connectorY, 0],
  ]);
  useEffect(() => {
    const element = grip.current;
    gripElement.current = element;
    const dragState = drag.current;
    if (!element || paused) return;
    const pointFromEvent = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      math.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      math.ray.setFromCamera(math.pointer, camera);
      math.ray.ray.intersectPlane(math.plane, math.point);
      return math.point;
    };
    const release = (event) => {
      if (!drag.current.active) return;
      drag.current.active = false;
      setDragging(false);
      onDrag?.(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
      body.current?.wakeUp();
    };
    const down = (e) => {
      if (!body.current) return;

      if (e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current.offset
        .copy(body.current.translation())
        .sub(pointFromEvent(e));
      drag.current.target.copy(body.current.translation());
      drag.current.active = true;
      setDragging(true);
      onDrag?.(true);
    };
    const move = (e) => {
      if (!drag.current.active) return;
      drag.current.target.copy(pointFromEvent(e)).add(drag.current.offset);
      const halfWidth =
        Math.tan((camera.fov * Math.PI) / 360) *
        Math.abs(camera.position.z - radius) *
        camera.aspect;
      const dragLimit = Math.min(
        C.maxDrag,
        Math.max(0.2, halfWidth - C.badgeWidth / 2 - 0.15),
      );
      drag.current.target.x = Math.max(
        -dragLimit,
        Math.min(dragLimit, drag.current.target.x),
      );
      drag.current.target.y = Math.max(
        -1.5,
        Math.min(0.7, drag.current.target.y),
      );
      drag.current.target.z = radius;
      // Keep the moving connector inside the anchored rope's reach.
      math.rotation.copy(body.current.rotation());
      math.connector.set(0, C.connectorY, 0).applyQuaternion(math.rotation);
      math.reach.copy(drag.current.target).add(math.connector).sub(math.anchor);
      if (math.reach.length() > C.ropeLength * 3) {
        math.reach.setLength(C.ropeLength * 3);
        drag.current.target
          .copy(math.anchor)
          .add(math.reach)
          .sub(math.connector);
      }
    };
    const key = (e) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        body.current.applyImpulse(
          {
            x: e.key === "ArrowLeft" ? -0.7 : e.key === "ArrowRight" ? 0.7 : 0,
            y: 0,
            z: e.key === "ArrowUp" ? -0.35 : e.key === "ArrowDown" ? 0.35 : 0,
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
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", release);
      element.removeEventListener("pointercancel", release);
      element.removeEventListener("lostpointercapture", release);
      element.removeEventListener("keydown", key);
      element.style.visibility = "hidden";
      dragState.active = false;
      setDragging(false);
      onDrag?.(false);
    };
  }, [grip, paused, camera, gl, math, radius, onDrag]);
  useFrame((_, delta) => {
    if (!body.current || !anchor.current || !strapRef.current || paused) return;
    if (!introduced.current) {
      body.current.applyImpulse({ x: C.introImpulse, y: 0, z: 0.035 }, true);
      introduced.current = true;
    }
    if (drag.current.active) {
      math.sampleTarget
        .copy(body.current.translation())
        .lerp(drag.current.target, 1 - Math.exp(-24 * delta));
      body.current.setNextKinematicTranslation(math.sampleTarget);
      j1.current?.wakeUp();
      j2.current?.wakeUp();
      j3.current?.wakeUp();
    } else if (!body.current.isSleeping()) {
      const velocity = body.current.angvel(),
        rotation = body.current.rotation();
      body.current.setAngvel(
        {
          x: velocity.x,
          y: velocity.y - rotation.y * C.facingSpring * Math.min(delta * 60, 2),
          z: velocity.z,
        },
        false,
      );
    }
    const follow = (smooth, target) => {
      const distance = Math.max(0.1, Math.min(1, smooth.distanceTo(target)));
      smooth.lerp(target, 1 - Math.exp(-(10 + distance * 40) * delta));
    };
    follow(math.smooth1, j1.current.translation());
    follow(math.smooth2, j2.current.translation());
    const points = math.curve.points;
    points[0].copy(j3.current.translation());
    points[1].copy(math.smooth2);
    points[2].copy(math.smooth1);
    points[3].copy(anchor.current.translation());
    for (let i = 0; i <= C.strapSamples; i++)
      math.curve.getPoint(i / C.strapSamples, math.samples[i]);
    strapRef.current.geometry.setPoints(math.samples);
    // The DOM grip belongs to the page React root, avoiding nested Html roots.
    const element = gripElement.current;
    if (element) {
      math.rotation.copy(body.current.rotation());
      math.center
        .set(0, -0.11, 0.11)
        .applyQuaternion(math.rotation)
        .add(body.current.translation());
      math.right
        .set(0.9, 0, 0)
        .applyQuaternion(math.rotation)
        .add(math.center)
        .project(camera);
      math.upper
        .set(0, 1.3, 0)
        .applyQuaternion(math.rotation)
        .add(math.center)
        .project(camera);
      math.center.project(camera);
      const x = ((math.center.x + 1) * size.width) / 2,
        y = ((1 - math.center.y) * size.height) / 2;
      const a = (((math.right.x + 1) * size.width) / 2 - x) / 90;
      const b = (((1 - math.right.y) * size.height) / 2 - y) / 90;
      const c = (x - ((math.upper.x + 1) * size.width) / 2) / 130;
      const d = (y - ((1 - math.upper.y) * size.height) / 2) / 130;
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.style.transform = `translate(-50%,-50%) matrix(${a},${b},${c},${d},0,0)`;
      element.style.visibility = "visible";
    }
  });
  const bodyProps = {
    colliders: false,
    linearDamping: C.linearDamping,
    angularDamping: C.angularDamping,
    canSleep: true,
  };
  return (
    <>
      <RigidBody ref={anchor} type="fixed" position={[0, C.railY, radius]} />
      <RigidBody
        ref={j1}
        {...bodyProps}
        position={[0.1, C.railY - C.ropeLength, radius]}
      >
        <BallCollider args={[0.04]} collisionGroups={0} mass={0.08} />
      </RigidBody>
      <RigidBody
        ref={j2}
        {...bodyProps}
        position={[0.18, C.railY - C.ropeLength * 2, radius]}
      >
        <BallCollider args={[0.04]} collisionGroups={0} mass={0.08} />
      </RigidBody>
      <RigidBody
        ref={j3}
        {...bodyProps}
        position={[0, C.railY - C.ropeLength * 3, radius]}
      >
        <BallCollider args={[0.04]} collisionGroups={0} mass={0.08} />
      </RigidBody>
      <RigidBody
        ref={body}
        {...bodyProps}
        type={dragging ? "kinematicPosition" : "dynamic"}
        position={[0, C.badgeY, radius]}
        additionalSolverIterations={6}
        ccd
      >
        <CuboidCollider args={[0.9, 1.3, 0.07]} mass={1} collisionGroups={0} />
        <BadgeArtwork event={event} palette={palette} />
      </RigidBody>
      <mesh ref={strapRef} frustumCulled={false}>
        <meshLineGeometry />
        <meshLineMaterial
          color={palette.text}
          resolution={[size.width, size.height]}
          lineWidth={C.strapWidth}
          useMap
          map={fabric}
          repeat={[-2, 1]}
          depthTest
        />
      </mesh>
    </>
  );
}
export default function InteractiveLanyard(props) {
  return (
    <Physics
      gravity={[0, C.gravity, 0]}
      timeStep={1 / 60}
      paused={props.paused}
      interpolate
    >
      <Lanyard {...props} />
    </Physics>
  );
}
