// UV quantization and reconstruction math reused from the original PixelReveal.
// Inject into the badge's map stage so its existing PBR lighting is preserved.
export function applyPixelResolve(shader, uniforms) {
  Object.assign(shader.uniforms, uniforms);
  shader.fragmentShader =
    `
uniform float uClubProgress;
uniform float uClubPixelSize;
uniform vec2 uClubResolution;
uniform vec3 uClubBackground;
float clubPixelHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
` + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <map_fragment>",
    `#ifdef USE_MAP
      vec2 clubUV = vMapUv;
      float clubPhase = sin(clamp(uClubProgress, 0., 1.) * 3.14159265);
      float clubBlock = 1. + (uClubPixelSize - 1.) * clubPhase;
      vec2 clubCell = floor(clubUV * uClubResolution / clubBlock);
      vec2 clubQuantized = (clubCell + .5) * clubBlock / uClubResolution;
      clubUV = mix(clubUV, clubQuantized, smoothstep(0., .25, clubPhase));
      vec4 clubArtwork = texture2D(map, clubUV);
      float clubFront = smoothstep(uClubProgress - .3, uClubProgress + .3, vMapUv.y);
      float clubBreakup = step(clubPixelHash(clubCell), clubPhase * .23 * clubFront);
      clubArtwork.rgb = mix(clubArtwork.rgb, uClubBackground, clubBreakup);
      diffuseColor *= clubArtwork;
    #endif`,
  );
}
