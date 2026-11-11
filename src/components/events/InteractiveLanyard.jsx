import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Plane,
  Quaternion,
  Vector2,
  Vector3,
  Raycaster,
} from "three";
import { BadgeArtwork } from "./EventBadge";
import { EVENT_CONFIG as C } from "./eventModel";

function Lanyard({ event, radius, palette, paused, onDrag }) {
  const strapRef = useRef(),
    anchor = useRef(),
    j1 = useRef(),
    j2 = useRef(),
    j3 = useRef(),
    body = useRef();
  const [dragging, setDragging] = useState(false);
  useEffect(
    () => () => {
      onDrag?.(false);
    },
    [onDrag],
  );
  const { camera, gl } = useThree();
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
      curve: new CatmullRomCurve3([
        new Vector3(),
        new Vector3(),
        new Vector3(),
        new Vector3(),
      ]),
      sample: new Vector3(),
      connector: new Vector3(),
      reach: new Vector3(),
      anchor: new Vector3(0, C.railY, radius),
      rotation: new Quaternion(),
    }),
    [radius],
  );
  const strap = useMemo(() => {
    const geometry = new BufferGeometry(),
      positions = new Float32Array((C.strapSamples + 1) * 6),
      indices = [];
    for (let i = 0; i < C.strapSamples; i++) {
      const k = i * 2;
      indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    return geometry;
  }, []);
  useEffect(() => () => strap.dispose(), [strap]);
  useRopeJoint(anchor, j1, [[0, 0, 0], [0, 0, 0], C.ropeLength]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], C.ropeLength]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], C.ropeLength]);
  useSphericalJoint(j3, body, [
    [0, 0, 0],
    [0, 1.3, 0],
  ]);
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
  useFrame(() => {
    if (!body.current || !anchor.current || paused) return;
    if (drag.current.active) {
      body.current.setNextKinematicTranslation(drag.current.target);
      j1.current?.wakeUp();
      j2.current?.wakeUp();
      j3.current?.wakeUp();
    }
    const points = math.curve.points;
    points[0].copy(anchor.current.translation());
    points[1].copy(j1.current.translation());
    points[2].copy(j2.current.translation());
    points[3].copy(j3.current.translation());
    const attribute = strapRef.current.geometry.attributes.position;
    for (let i = 0; i <= C.strapSamples; i++) {
      math.curve.getPoint(i / C.strapSamples, math.sample);
      attribute.setXYZ(
        i * 2,
        math.sample.x - 0.045,
        math.sample.y,
        math.sample.z,
      );
      attribute.setXYZ(
        i * 2 + 1,
        math.sample.x + 0.045,
        math.sample.y,
        math.sample.z,
      );
    }
    attribute.needsUpdate = true;
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
        position={[0, C.railY - C.ropeLength, radius]}
      >
        <BallCollider args={[0.04]} collisionGroups={0} mass={0.08} />
      </RigidBody>
      <RigidBody
        ref={j2}
        {...bodyProps}
        position={[0, C.railY - C.ropeLength * 2, radius]}
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
        <CuboidCollider args={[0.9, 1.2, 0.06]} mass={1} collisionGroups={0} />
        <BadgeArtwork event={event} palette={palette} />
        {!paused && (
          <Html center position={[0, 0, 0.1]} zIndexRange={[5, 4]}>
            <button
              data-event-grip
              className={`events-drag-surface ${dragging ? "is-dragging" : ""}`}
              aria-label={`Drag ${event.title} pass; arrow keys swing the badge`}
              onPointerDown={(e) => {
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
              }}
              onPointerMove={(e) => {
                if (!drag.current.active) return;
                drag.current.target
                  .copy(pointFromEvent(e))
                  .add(drag.current.offset);
                drag.current.target.x = Math.max(
                  -C.maxDrag,
                  Math.min(C.maxDrag, drag.current.target.x),
                );
                drag.current.target.y = Math.max(
                  -1.5,
                  Math.min(0.7, drag.current.target.y),
                );
                drag.current.target.z = radius;
                // Keep the moving connector inside the anchored rope's reach.
                math.rotation.copy(body.current.rotation());
                math.connector.set(0, 1.3, 0).applyQuaternion(math.rotation);
                math.reach
                  .copy(drag.current.target)
                  .add(math.connector)
                  .sub(math.anchor);
                if (math.reach.length() > C.ropeLength * 3) {
                  math.reach.setLength(C.ropeLength * 3);
                  drag.current.target
                    .copy(math.anchor)
                    .add(math.reach)
                    .sub(math.connector);
                }
              }}
              onPointerUp={release}
              onPointerCancel={release}
              onLostPointerCapture={release}
              onKeyDown={(e) => {
                if (
                  ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    e.key,
                  )
                ) {
                  e.preventDefault();
                  body.current.applyImpulse(
                    {
                      x:
                        e.key === "ArrowLeft"
                          ? -0.7
                          : e.key === "ArrowRight"
                            ? 0.7
                            : 0,
                      y: 0,
                      z:
                        e.key === "ArrowUp"
                          ? -0.35
                          : e.key === "ArrowDown"
                            ? 0.35
                            : 0,
                    },
                    true,
                  );
                }
              }}
            >
              <span>⠿ DRAG YOUR PASS</span>
            </button>
          </Html>
        )}
      </RigidBody>
      <mesh ref={strapRef} geometry={strap} frustumCulled={false}>
        <meshBasicMaterial color={palette.text} side={DoubleSide} />
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
