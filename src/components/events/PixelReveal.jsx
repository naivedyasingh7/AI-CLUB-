import { useEffect, useImperativeHandle, useRef } from "react";
import {
  Color,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from "three";
import { EVENT_CONFIG as C, FALLBACK_POSTER } from "./eventModel";
const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
// Original implementation informed by the reference's quantized UV grid and
// randomised reconstruction front. No framework-specific reference code copied.
const fragmentShader = `
precision highp float;
uniform sampler2D uImage; uniform vec2 uResolution; uniform vec2 uImageSize;
uniform float uProgress; uniform float uPixelSize; uniform vec3 uBackground;
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 float viewAspect=uResolution.x/max(1.,uResolution.y);
 float imageAspect=uImageSize.x/max(1.,uImageSize.y);
 vec2 fit=viewAspect>imageAspect?vec2(viewAspect/imageAspect,1.):vec2(1.,imageAspect/viewAspect);
 float phase=sin(clamp(uProgress,0.,1.)*3.14159265);
 float block=1.+(uPixelSize-1.)*phase;
 vec2 cell=floor(vUv*uResolution/block);
 vec2 quantized=(cell+.5)*block/uResolution;
 vec2 uv=(mix(vUv,quantized,smoothstep(0.,.25,phase))-.5)*fit+.5;
 if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.){gl_FragColor=vec4(uBackground,1.);}
 else{
  vec4 artwork=texture2D(uImage,uv);
  float front=smoothstep(uProgress-.3,uProgress+.3,vUv.y);
  float breakup=step(hash(cell),phase*.23*front);
  gl_FragColor=vec4(mix(artwork.rgb,uBackground,breakup),1.);
 }
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export default function PixelReveal({ src, ref, palette, reduced }) {
  const host = useRef(null),
    runtimeRef = useRef({ progress: 0, draw: null });
  useImperativeHandle(
    ref,
    () => ({
      draw(progress) {
        runtimeRef.current.progress = progress;
        runtimeRef.current.draw?.();
      },
    }),
    [],
  );
  useEffect(() => {
    if (reduced) return;
    const element = host.current,
      runtime = runtimeRef.current;
    let renderer,
      texture,
      disposed = false,
      contextLost = false;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      element.dataset.pixelState = "fallback";
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, C.dpr));
    const scene = new Scene(),
      camera = new OrthographicCamera(-1, 1, 1, -1, 0, 2);
    camera.position.z = 1;
    const uniforms = {
      uImage: { value: null },
      uResolution: { value: new Vector2(1, 1) },
      uImageSize: { value: new Vector2(720, 960) },
      uProgress: { value: 0 },
      uPixelSize: { value: C.pixelSize },
      uBackground: { value: new Color(palette.bg) },
    };
    const material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
      }),
      geometry = new PlaneGeometry(2, 2);
    scene.add(new Mesh(geometry, material));
    const render = () => {
      if (!disposed && !contextLost && uniforms.uImage.value) {
        uniforms.uProgress.value = runtime.progress;
        renderer.render(scene, camera);
      }
    };
    runtime.draw = render;
    const lose = (event) => {
      event.preventDefault();
      contextLost = true;
      renderer.domElement.remove();
      element.dataset.pixelState = "fallback";
    };
    renderer.domElement.addEventListener("webglcontextlost", lose);
    texture = new TextureLoader().load(
      src,
      (loaded) => {
        if (disposed || contextLost) {
          loaded.dispose();
          return;
        }
        loaded.colorSpace = SRGBColorSpace;
        uniforms.uImage.value = loaded;
        uniforms.uImageSize.value.set(loaded.image.width, loaded.image.height);
        element.appendChild(renderer.domElement);
        element.dataset.pixelState = "ready";
        resize();
      },
      undefined,
      () => {
        element.dataset.pixelState = "fallback";
      },
    );
    function resize() {
      if (disposed || contextLost) return;
      const width = element.clientWidth,
        height = element.clientHeight;
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
      uniforms.uResolution.value.set(Math.max(1, width), Math.max(1, height));
      render();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => {
      disposed = true;
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", lose);
      if (runtime.draw === render) runtime.draw = null;
      renderer.domElement.remove();
      texture?.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (!contextLost) renderer.forceContextLoss();
    };
  }, [src, palette, reduced]);
  return (
    <div ref={host} className="events-pixel">
      <img
        src={src}
        onError={(e) => {
          if (e.currentTarget.src.endsWith(FALLBACK_POSTER)) {
            e.currentTarget.style.display = "none";
            return;
          }
          e.currentTarget.src = FALLBACK_POSTER;
        }}
        alt=""
      />
    </div>
  );
}
