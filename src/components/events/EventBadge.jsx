import { RoundedBox, useTexture } from "@react-three/drei";
import { EVENT_CONFIG as C, FALLBACK_POSTER } from "./eventModel";
export function BadgeArtwork({ event, palette }) {
  const [texture, back] = useTexture([
    event.badgeFront || event.poster || FALLBACK_POSTER,
    event.badgeBack || event.poster || FALLBACK_POSTER,
  ]);
  const aspect = texture.image.width / texture.image.height;
  const width = Math.min(1.7, 2.28 * aspect),
    height = Math.min(2.28, 1.7 / aspect);
  const backAspect = back.image.width / back.image.height;
  return (
    <group>
      <RoundedBox
        args={[C.badgeWidth, C.badgeHeight, 0.12]}
        radius={0.09}
        smoothness={3}
      >
        <meshStandardMaterial
          color={palette.text}
          roughness={0.35}
          metalness={0.55}
        />
      </RoundedBox>
      <mesh position={[0, 0, 0.066]}>
        <planeGeometry args={[1.7, 2.28]} />
        <meshBasicMaterial color={palette.bg} />
      </mesh>
      <mesh position={[0, 0, 0.067]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.066]} rotation={[0, Math.PI, 0]}>
        <planeGeometry
          args={[
            Math.min(1.7, 2.28 * backAspect),
            Math.min(2.28, 1.7 / backAspect),
          ]}
        />
        <meshStandardMaterial roughness={0.5} map={back} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <torusGeometry args={[0.09, 0.025, 8, 18]} />
        <meshStandardMaterial
          color={palette.text}
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}
