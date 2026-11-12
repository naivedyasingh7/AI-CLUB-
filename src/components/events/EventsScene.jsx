import { Suspense, lazy, useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import {
  BufferGeometry,
  BufferAttribute,
  DoubleSide,
  Color,
  CatmullRomCurve3,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
  Quaternion,
} from "three";
import { BadgeArtwork } from "./EventBadge";
import { EVENT_CONFIG as C } from "./eventModel";
import {
  CAMERA_FILL,
  CAMERA_VERTICAL_OFFSET,
  CAMERA_SAFE_WIDTH,
  VELOCITY_REFERENCE_WIDTH,
  STRAP_ACCENT_MIX,
  DEPTH_FACTORS,
  RAIL_PARALLAX,
  SWAY_STRENGTH,
  SWAY_MAX_ANGLE,
  IDLE_SWAY,
  IDLE_FREQUENCY,
  MAX_FRAME_DELTA,
  clamp,
  advanceSway,
} from "./galleryConfig";
import {
  OTHERS_OPACITY,
  OTHERS_BACK,
  MOBILE_PANEL_ZOOM,
  panelCarrier,
} from "./focusConfig";
import { preloadFocusPhysics } from "./focusPhysicsLoader";
const FocusLanyard = lazy(() => preloadFocusPhysics());
function GalleryPass({
  event,
  index,
  palette,
  motion,
  reduced,
  onProject,
  focus,
  visual,
  onPose,
}) {
  const root = useRef(),
    pivot = useRef(),
    body = useRef(),
    band = useRef(),
    lastOpacity = useRef(1);
  const spring = useRef({ angle: 0, velocity: 0 }),
    artworkMotion = useRef({ normalizedX: 0 });
  const { camera, size } = useThree();
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
  const math = useMemo(
    () => ({
      curve: new CatmullRomCurve3(
        Array.from({ length: 4 }, () => new Vector3()),
        false,
        "chordal",
      ),
      samples: Array.from({ length: 33 }, () => new Vector3()),
      tangent: new Vector3(),
      center: new Vector3(),
      right: new Vector3(),
      upper: new Vector3(),
      worldPoints: Array.from({ length: 4 }, () => new Vector3()),
      targetPosition: new Vector3(),
      targetQuaternion: new Quaternion(),
      fromPosition: new Vector3(),
      fromQuaternion: new Quaternion(),
      pose: {
        anchor: new Vector3(),
        joints: Array.from({ length: 3 }, () => new Vector3()),
        position: new Vector3(),
        quaternion: new Quaternion(),
      },
    }),
    [],
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
  useFrame((_, delta) => {
    const state = motion.current;
    const width =
      (2 *
        Math.tan((camera.fov * Math.PI) / 360) *
        camera.position.z *
        camera.aspect) /
      camera.zoom;
    const units = width / size.width;
    const railX =
      (state.origin +
        index * state.slot -
        state.current * RAIL_PARALLAX -
        size.width / 2) *
      units;
    const factor = state.overflow
      ? DEPTH_FACTORS[index % DEPTH_FACTORS.length]
      : 1;
    const depthShift = railX * (factor - 1);
    const selected = focus.index === index;
    root.current.position.set(
      railX,
      C.railY,
      selected ? 0 : -visual.current.focus * OTHERS_BACK,
    );
    root.current.visible = !(selected && focus.physicsVisible);
    const opacity = selected
      ? 1
      : 1 - (1 - OTHERS_OPACITY) * visual.current.focus;
    if (Math.abs(lastOpacity.current - opacity) > 0.0001) {
      root.current.traverse((node) => {
        if (!node.isMesh) return;
        const materials = Array.isArray(node.material)
          ? node.material
          : [node.material];
        materials.forEach((material) => {
          const transparent = opacity < 0.999;
          if (material.transparent !== transparent) {
            material.transparent = transparent;
            material.needsUpdate = true;
          }
          material.opacity = opacity;
        });
      });
      lastOpacity.current = opacity;
    }
    if (reduced) {
      spring.current.angle = 0;
      spring.current.velocity = 0;
    } else
      advanceSway(
        spring.current,
        clamp(
          (-state.velocity / state.width) *
            VELOCITY_REFERENCE_WIDTH *
            SWAY_STRENGTH,
          -SWAY_MAX_ANGLE,
          SWAY_MAX_ANGLE,
        ),
        Math.min(delta, MAX_FRAME_DELTA),
      );
    pivot.current.rotation.z = reduced
      ? 0
      : spring.current.angle +
        Math.sin(state.time * IDLE_FREQUENCY + index * 0.7) * IDLE_SWAY;
    if (selected) pivot.current.rotation.z *= 1 - visual.current.focus;
    body.current.position.set(depthShift, C.badgeY - C.railY, 0);
    body.current.quaternion.identity();
    const endY = C.badgeY - C.railY + C.connectorY;
    math.curve.points[0].set(0, 0, 0.1);
    math.curve.points[1].set(depthShift * 0.15, -0.75, 0.1);
    math.curve.points[2].set(depthShift * 0.7, -1.5, 0.1);
    math.curve.points[3].set(depthShift, endY, 0.1);
    pivot.current.updateWorldMatrix(true, false);
    if (selected && focus.returnPose) {
      body.current.updateWorldMatrix(true, false);
      body.current.getWorldPosition(math.targetPosition);
      body.current.getWorldQuaternion(math.targetQuaternion);
      math.curve.points.forEach((point, i) =>
        math.worldPoints[i].copy(point).applyMatrix4(pivot.current.matrixWorld),
      );
      root.current.position.set(0, 0, 0);
      pivot.current.rotation.set(0, 0, 0);
      math.fromPosition.set(...focus.returnPose.position);
      math.fromQuaternion.set(...focus.returnPose.quaternion);
      body.current.position.lerpVectors(
        math.fromPosition,
        math.targetPosition,
        visual.current.blend,
      );
      body.current.quaternion.slerpQuaternions(
        math.fromQuaternion,
        math.targetQuaternion,
        visual.current.blend,
      );
      math.curve.points[0]
        .set(...focus.returnPose.anchor)
        .lerp(math.worldPoints[0], visual.current.blend);
      focus.returnPose.joints.forEach((point, i) =>
        math.curve.points[i + 1]
          .set(...point)
          .lerp(math.worldPoints[i + 1], visual.current.blend),
      );
      pivot.current.updateWorldMatrix(true, false);
    }
    const pose = math.pose;
    pose.anchor
      .copy(math.curve.points[0])
      .applyMatrix4(pivot.current.matrixWorld);
    pose.joints.forEach((point, i) =>
      point
        .copy(math.curve.points[i + 1])
        .applyMatrix4(pivot.current.matrixWorld),
    );
    body.current.updateWorldMatrix(true, false);
    body.current.getWorldPosition(pose.position);
    body.current.getWorldQuaternion(pose.quaternion);
    onPose(index, pose);
    const attribute = band.current.geometry.attributes.position;
    for (let j = 0; j <= 32; j++) {
      const point = math.curve.getPoint(j / 32, math.samples[j]);
      math.curve.getTangent(j / 32, math.tangent);
      const sideX = (-math.tangent.y * C.strapWorldWidth) / 2,
        sideY = (math.tangent.x * C.strapWorldWidth) / 2;
      attribute.setXYZ(j * 2, point.x - sideX, point.y - sideY, point.z);
      attribute.setXYZ(j * 2 + 1, point.x + sideX, point.y + sideY, point.z);
    }
    attribute.needsUpdate = true;
    body.current.updateWorldMatrix(true, false);
    body.current.localToWorld(math.center.set(0, -0.11, 0.11));
    body.current.localToWorld(math.right.set(0.9, -0.11, 0.11));
    body.current.localToWorld(math.upper.set(0, 1.19, 0.11));
    math.center.project(camera);
    math.right.project(camera);
    math.upper.project(camera);
    const x = ((math.center.x + 1) * size.width) / 2,
      y = ((1 - math.center.y) * size.height) / 2;
    artworkMotion.current.normalizedX = (x - size.width / 2) / size.width;
    onProject(
      index,
      x,
      y,
      (((math.right.x + 1) * size.width) / 2 - x) / 90,
      (((1 - math.right.y) * size.height) / 2 - y) / 90,
      (x - ((math.upper.x + 1) * size.width) / 2) / 130,
      (y - ((1 - math.upper.y) * size.height) / 2) / 130,
    );
  }, -1);
  const fabricColor = useMemo(
    () =>
      new Color(palette.text).lerp(new Color(event.accent), STRAP_ACCENT_MIX),
    [palette.text, event.accent],
  );
  return (
    <group ref={root}>
      <group ref={pivot}>
        <mesh ref={band} geometry={ribbon} frustumCulled={false}>
          <meshBasicMaterial
            color={fabricColor}
            map={fabric}
            side={DoubleSide}
          />
        </mesh>
        <group ref={body}>
          <BadgeArtwork
            event={event}
            palette={palette}
            galleryMotion={artworkMotion}
          />
        </group>
      </group>
    </group>
  );
}
export default function EventsScene({
  events,
  palette,
  motion,
  reduced,
  onProject,
  focus,
  visual,
  mobile,
  visible,
  grip,
  onPhysicalProject,
  onHandoff,
  onRigReady,
  onRigDispose,
  onDrag,
}) {
  const { camera, size, invalidate } = useThree();
  const rail = useRef(),
    poses = useRef([]),
    armed = useRef(false);
  const recordPose = useCallback((index, pose) => {
    poses.current[index] = pose;
  }, []);
  useEffect(() => {
    const bottom = C.badgeY - C.badgeHeight / 2,
      aim = (C.railY + bottom) / 2 + CAMERA_VERTICAL_OFFSET;
    const tangent = Math.tan((camera.fov * Math.PI) / 360);
    const distance = Math.max(
      (C.railY - bottom) / (2 * tangent * CAMERA_FILL),
      CAMERA_SAFE_WIDTH / (2 * tangent * (size.width / size.height)),
    );
    camera.position.set(0, aim, distance);
    camera.lookAt(0, aim, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);
  useFrame(() => {
    const zoom = mobile
      ? 1 + (MOBILE_PANEL_ZOOM - 1) * visual.current.panel
      : 1;
    if (Math.abs(camera.zoom - zoom) > 0.00001) {
      Object.assign(camera, { zoom });
      camera.updateProjectionMatrix();
    }
    const state = motion.current,
      width =
        (2 *
          Math.tan((camera.fov * Math.PI) / 360) *
          camera.position.z *
          camera.aspect) /
        camera.zoom,
      units = width / size.width;
    rail.current.position.x =
      (state.origin +
        ((events.length - 1) * state.slot) / 2 -
        state.current -
        size.width / 2) *
      units;
    // Keep the focused strap attached as the mobile carrier lifts above the sheet.
    rail.current.position.y =
      C.railY +
      0.04 +
      (mobile ? panelCarrier(camera, visual.current.panel, true).y : 0);
    rail.current.scale.x =
      (events.length - 1) * state.slot * units + width * 1.5;
  }, -3);
  useFrame(() => {
    if (focus.mode !== "ARMING") {
      armed.current = false;
      return;
    }
    const pose = poses.current[focus.index];
    if (!pose || armed.current) return;
    armed.current = true;
    onHandoff({
      anchor: pose.anchor.toArray(),
      joints: pose.joints.map((point) => point.toArray()),
      position: pose.position.toArray(),
      quaternion: pose.quaternion.toArray(),
    });
  }, 0);
  const metal = useMemo(
    () => new Color(palette.bg).lerp(new Color(palette.text), 0.19),
    [palette],
  );
  return (
    <>
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
      <mesh ref={rail} position={[0, C.railY + 0.04, 0]}>
        <boxGeometry args={[1, 0.055, 0.09]} />
        <meshStandardMaterial color={metal} metalness={0.9} roughness={0.3} />
      </mesh>
      {events.map((event, index) => (
        <GalleryPass
          key={event.id}
          event={event}
          index={index}
          palette={palette}
          motion={motion}
          reduced={reduced}
          onProject={onProject}
          focus={focus}
          visual={visual}
          onPose={recordPose}
        />
      ))}
      {focus.physicsMounted && focus.pose && (
        <Suspense fallback={null}>
          <FocusLanyard
            event={events[focus.index]}
            palette={palette}
            pose={focus.pose}
            visual={visual}
            phase={focus.mode}
            mobile={mobile}
            grip={grip}
            onProject={onPhysicalProject}
            onReady={onRigReady}
            onDispose={onRigDispose}
            onDrag={onDrag}
            paused={!visible}
          />
        </Suspense>
      )}
    </>
  );
}
