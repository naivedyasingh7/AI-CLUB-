import { useEffect, useMemo } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Color, SRGBColorSpace } from "three";
import { FALLBACK_POSTER } from "./eventModel";
import {
  PARALLAX_INTENSITY,
  POSTER_UV_SCALE,
  SHADER_MULTIPLIER,
  clamp,
} from "./galleryConfig";
export function BadgeArtwork({ event, palette, galleryMotion }) {
  const { scene } = useGLTF("/models/events/ai-club-pass.glb");
  const [texture, back] = useTexture([
    event.badgeFront || event.posterSrc || event.poster || FALLBACK_POSTER,
    event.badgeBack || event.posterSrc || event.poster || FALLBACK_POSTER,
  ]);
  const maps = useMemo(
    () => (galleryMotion ? [texture.clone(), back.clone()] : [texture, back]),
    [texture, back, galleryMotion],
  );
  useEffect(() => {
    if (!galleryMotion) return;
    maps.forEach((map) => {
      Object.assign(map, {
        colorSpace: SRGBColorSpace,
        anisotropy: 8,
        needsUpdate: true,
      });
      map.repeat.set(POSTER_UV_SCALE, POSTER_UV_SCALE);
      map.offset.set((1 - POSTER_UV_SCALE) / 2, (1 - POSTER_UV_SCALE) / 2);
    });
    return () => maps.forEach((map) => map.dispose());
  }, [maps, galleryMotion]);
  useFrame(() => {
    if (!galleryMotion) return;
    const margin = (1 - POSTER_UV_SCALE) / 2;
    const offset = clamp(
      galleryMotion.current.normalizedX *
        PARALLAX_INTENSITY *
        SHADER_MULTIPLIER *
        POSTER_UV_SCALE,
      -margin,
      margin,
    );
    maps.forEach((map) => map.offset.set(margin + offset, margin));
  });
  useEffect(() => {
    for (const map of [texture, back]) {
      map.colorSpace = SRGBColorSpace;
      map.anisotropy = 8;
      map.needsUpdate = true;
    }
  }, [texture, back]);
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((mesh) => {
      if (!mesh.isMesh) return;
      mesh.material = mesh.material.clone();
      mesh.material.color.set(
        mesh.name === "laminated_shell"
          ? new Color(palette.bg).lerp(new Color(palette.text), 0.025)
          : new Color(palette.text).multiplyScalar(0.65),
      );
      mesh.material.envMapIntensity = 0.9;
    });
    return copy;
  }, [scene, palette]);
  useEffect(
    () => () =>
      model.traverse((mesh) => {
        if (mesh.isMesh) mesh.material.dispose();
      }),
    [model],
  );
  const aspect = texture.image.width / texture.image.height;
  const backAspect = back.image.width / back.image.height;
  return (
    <group>
      <primitive object={model} dispose={null} />
      <mesh position={[0, -0.11, 0.073]}>
        <planeGeometry
          args={[Math.min(1.64, 2.14 * aspect), Math.min(2.14, 1.64 / aspect)]}
        />
        <meshPhysicalMaterial
          map={maps[0]}
          roughness={0.42}
          metalness={0.05}
          clearcoat={0.65}
          clearcoatRoughness={0.24}
          envMapIntensity={0.35}
        />
      </mesh>
      <mesh position={[0, -0.11, -0.073]} rotation={[0, Math.PI, 0]}>
        <planeGeometry
          args={[
            Math.min(1.64, 2.14 * backAspect),
            Math.min(2.14, 1.64 / backAspect),
          ]}
        />
        <meshPhysicalMaterial map={maps[1]} roughness={0.48} clearcoat={0.4} />
      </mesh>
    </group>
  );
}
