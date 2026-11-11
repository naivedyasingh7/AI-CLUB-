import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, lazy } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import { BadgeArtwork } from "./EventBadge";
const ActiveLanyard = lazy(() => import("./InteractiveLanyard"));
import {
  Color,
  DataTexture,
  MathUtils,
  RGBAFormat,
  RepeatWrapping,
  Vector3,
} from "three";
import gsap from "gsap";
import { EVENT_CONFIG as C, galleryLayout } from "./eventModel";

function StaticPass({ event, index, layout, palette, onSelect }) {
  const angle = index * layout.step;
  return (
    <group
      position={[
        Math.sin(angle) * layout.radius,
        0,
        Math.cos(angle) * layout.radius,
      ]}
      rotation={[0, angle, 0]}
    >
      <mesh position={[0, (C.railY + C.badgeY + C.connectorY) / 2, 0]}>
        <boxGeometry
          args={[C.strapWorldWidth, C.railY - C.badgeY - C.connectorY, 0.025]}
        />
        <meshStandardMaterial color={palette.text} roughness={0.9} />
      </mesh>
      <group
        position={[0, C.badgeY, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(event.id);
        }}
      >
        <BadgeArtwork event={event} palette={palette} />
      </group>
    </group>
  );
}
export default function EventsScene({
  events,
  palette,
  progress,
  selection,
  onSelect,
  onSettled,
  visible,
  reduced,
  onDrag,
  grip,
}) {
  const gallery = useRef();
  const cameraTarget = useRef(new Vector3(0, C.cameraAimY, 0));
  const { camera, invalidate, setDpr, size } = useThree();
  const single = events.length === 1;
  const performance = useRef({ frames: 0, slow: 0, low: false });
  const roughness = useMemo(() => {
    const values = new Uint8Array(32 * 32 * 4);
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const p = (y * 32 + x) * 4;
        const grain =
          150 + Math.floor((Math.sin(y * 21.7 + x * 0.23) + 1) * 45);
        values[p] = values[p + 1] = values[p + 2] = grain;
        values[p + 3] = 255;
      }
    const texture = new DataTexture(values, 32, 32, RGBAFormat);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(12, 1);
    texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => () => roughness.dispose(), [roughness]);
  const layout = galleryLayout(events.length);
  const metal = new Color(palette.bg).lerp(new Color(palette.text), 0.19);
  useEffect(() => {
    if (!single) return;
    const bottom = C.badgeY - C.badgeHeight / 2;
    const height = C.railY - bottom;
    const tangent = Math.tan((camera.fov * Math.PI) / 360);
    const distance = Math.max(
      height / (2 * tangent * C.heroFill),
      C.heroSafeWidth / (2 * tangent * (size.width / size.height)),
    );
    const aim = (C.railY + bottom) / 2;
    camera.position.set(0, aim, layout.radius + distance);
    camera.lookAt(0, aim, layout.radius);
    camera.updateProjectionMatrix();
    invalidate();
  }, [single, size.width, size.height, camera, invalidate, layout.radius]);
  useEffect(() => {
    const index = Math.max(
      0,
      events.findIndex((event) => event.id === selection.selectedId),
    );
    const selecting = selection.mode === "SELECTING";
    const returning = selection.mode === "RETURNING";
    if (!selecting && !returning) return;
    const bottom = C.badgeY - C.badgeHeight / 2;
    const aim = (C.railY + bottom) / 2;
    const tangent = Math.tan((camera.fov * Math.PI) / 360);
    const fittedDistance = Math.max(
      (C.railY - bottom) / (2 * tangent * C.heroFill),
      C.heroSafeWidth / (2 * tangent * (size.width / size.height)),
    );
    const timeline = (window.gsap || gsap).timeline({
      onUpdate: invalidate,
      onComplete: () => onSettled(returning ? "RETURNED" : "SETTLED"),
    });
    timeline
      .to(
        gallery.current.rotation,
        {
          y: selecting ? -index * layout.step : progress.current.angle,
          duration: reduced ? 0 : C.selectionDuration,
          ease: "power2.inOut",
        },
        0,
      )
      .to(
        camera.position,
        {
          z: selecting
            ? layout.radius + fittedDistance
            : layout.radius + C.browseDistance,
          y: selecting ? aim : 1.1,
          duration: reduced ? 0 : C.selectionDuration,
          ease: "power2.inOut",
        },
        0,
      );
    timeline.to(
      cameraTarget.current,
      {
        y: selecting ? aim : C.cameraAimY,
        z: selecting ? layout.radius : 0,
        duration: reduced ? 0 : C.selectionDuration,
        ease: "power2.inOut",
      },
      0,
    );
    return () => timeline.kill();
  }, [
    selection.mode,
    selection.selectedId,
    events,
    layout.step,
    layout.radius,
    camera,
    invalidate,
    onSettled,
    reduced,
    progress,
    size.width,
    size.height,
  ]);
  useFrame((_, delta) => {
    if (!visible) return;
    const stats = performance.current;
    if (!stats.low) {
      stats.frames++;
      if (delta > C.slowFrameSeconds) stats.slow++;
      if (stats.frames >= 120) {
        if (stats.slow > 30) {
          setDpr(1);
          stats.low = true;
        }
        stats.frames = stats.slow = 0;
      }
    }
    if (selection.mode === "BROWSING")
      gallery.current.rotation.y = MathUtils.damp(
        gallery.current.rotation.y,
        progress.current.angle,
        6,
        delta,
      );
    if (!single) camera.lookAt(cameraTarget.current);
  });
  const physicsActive =
    !reduced &&
    [
      "INTERACTIVE",
      "OPENING_DETAILS",
      "DETAILS_OPEN",
      "CLOSING_DETAILS",
    ].includes(selection.mode);
  const selected = events.find((event) => event.id === selection.selectedId);
  return (
    <>
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.bg, 15, 36]} />
      <ambientLight intensity={0.7} />
      <Environment resolution={128} frames={1}>
        <Lightformer
          intensity={2.5}
          color={palette.text}
          position={[-4, 3, 5]}
          rotation={[0, 0.45, -0.35]}
          scale={[3, 7, 1]}
        />
        <Lightformer
          intensity={1.4}
          color={palette.text}
          position={[4, 1, 4]}
          rotation={[0, -0.5, 0.2]}
          scale={[2, 5, 1]}
        />
        <Lightformer
          intensity={3}
          color={palette.text}
          position={[0, 5, -2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[5, 2, 1]}
        />
      </Environment>
      <directionalLight
        position={[4, 8, 8]}
        intensity={C.keyLightIntensity}
        color={palette.text}
      />
      <directionalLight
        position={[-5, 2, 4]}
        intensity={C.fillLightIntensity}
        color={palette.text}
      />
      <group ref={gallery}>
        {single && (
          <group position={[0, C.railY, layout.radius]}>
            <mesh position={[0, 0.04, 0]}>
              <boxGeometry args={[0.34, 0.1, 0.18]} />
              <meshStandardMaterial
                color={metal}
                metalness={0.9}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 1.5, 8]} />
              <meshStandardMaterial
                color={metal}
                metalness={0.8}
                roughness={0.4}
              />
            </mesh>
          </group>
        )}
        {!single && (
          <mesh position={[0, C.railY, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[layout.radius, C.railThickness, 12, 100]} />
            <meshStandardMaterial
              color={metal}
              metalness={0.85}
              roughness={0.32}
              roughnessMap={roughness}
            />
          </mesh>
        )}
        {!single &&
          [0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => (
            <mesh
              key={angle}
              position={[
                Math.sin(angle) * layout.radius,
                5.1,
                Math.cos(angle) * layout.radius,
              ]}
            >
              <cylinderGeometry args={[0.018, 0.018, 3.8, 6]} />
              <meshStandardMaterial
                color={metal}
                metalness={0.8}
                roughness={0.45}
              />
            </mesh>
          ))}
        {events
          .filter(
            (event) => !(physicsActive && event.id === selection.selectedId),
          )
          .map((event) => (
            <StaticPass
              key={event.id}
              event={event}
              index={events.indexOf(event)}
              layout={layout}
              palette={palette}
              onSelect={onSelect}
            />
          ))}
      </group>
      {physicsActive && selected && (
        <Suspense
          fallback={
            <StaticPass
              event={selected}
              index={0}
              layout={layout}
              palette={palette}
              onSelect={() => {}}
            />
          }
        >
          <ActiveLanyard
            event={selected}
            radius={layout.radius}
            palette={palette}
            paused={selection.mode !== "INTERACTIVE" || !visible}
            onDrag={onDrag}
            grip={grip}
          />
        </Suspense>
      )}
    </>
  );
}
