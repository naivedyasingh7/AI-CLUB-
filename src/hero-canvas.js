/**
 * hero-canvas.js
 * Pixel-accurate interactive clone of the reference constellation image.
 *
 * Visual characteristics extracted from the reference image:
 *  - 37 glowing white circular orb nodes scattered in an organic cluster shape
 *  - Thin faint white edge lines connecting nearby nodes (graph/constellation)
 *  - Dense soft white/gray dusty particle cloud filling the interior of the cluster
 *  - Dark gray background (#2e2e2e), not pure black
 *  - Cluster sits on the RIGHT side of the hero on desktop
 *
 * Interaction:
 *  - Moving the cursor smoothly rotates the entire constellation in 3D (tilt + parallax)
 *  - Cluster gently floats on idle
 *  - Pauses when scrolled out of view to save GPU
 */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  Float32BufferAttribute,
  LineSegments,
  LineBasicMaterial,
  Points,
  ShaderMaterial,
  CanvasTexture,
  Group,
  AdditiveBlending,
  Vector3,
} from "three";

// ---------------------------------------------------------------------------
// Sprite textures
// ---------------------------------------------------------------------------

/** Smooth circular glow — the white orb node sprites */
function createNodeSprite(size = 128) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0.00, "rgba(255,255,255,1.00)");
  g.addColorStop(0.10, "rgba(255,255,255,0.95)");
  g.addColorStop(0.28, "rgba(230,238,255,0.55)");
  g.addColorStop(0.55, "rgba(200,215,245,0.14)");
  g.addColorStop(1.00, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fill();
  const t = new CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

/** Ultra-soft fine grain — the stardust cloud fill */
function createDustSprite(size = 32) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0.00, "rgba(255,255,255,0.80)");
  g.addColorStop(0.40, "rgba(240,242,250,0.35)");
  g.addColorStop(0.80, "rgba(220,225,240,0.08)");
  g.addColorStop(1.00, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------------------
// Node positions pixel-extracted from the reference image (normalised to [-1,1])
// and scaled to world-space units.
// ---------------------------------------------------------------------------
const SCALE = 5.5; // controls overall cluster size on screen

/** 37 node positions (x, y) in normalised image coords → world space */
const RAW_NODES = [
  [-0.964, -0.083], [-0.860, -0.369], [-0.829,  0.143], [-0.715,  0.332],
  [-0.715, -0.106], [-0.694, -0.488], [-0.591,  0.134], [-0.570, -0.419],
  [-0.487,  0.332], [-0.440, -0.138], [-0.425, -0.535], [-0.389,  0.507],
  [-0.332,  0.111], [-0.301,  0.668], [-0.249, -0.470], [-0.233,  0.323],
  [-0.150,  0.512], [-0.140, -0.171], [-0.130, -0.594], [-0.073,  0.677],
  [-0.041,  0.092], [ 0.041,  0.318], [ 0.114,  0.516], [ 0.119, -0.535],
  [ 0.181,  0.691], [ 0.207, -0.207], [ 0.207, -0.654], [ 0.280,  0.074],
  [ 0.347,  0.313], [ 0.404,  0.521], [ 0.456,  0.705], [ 0.596, -0.249],
  [ 0.627, -0.396], [ 0.642,  0.051], [ 0.689,  0.309], [ 0.689,  0.101],
  [ 0.725,  0.525],
];

/** Edges (index pairs) auto-generated from pixel proximity in the reference */
const EDGES = [
  [0,4],[1,5],[2,3],[2,6],[3,6],[3,8],[5,7],[6,8],[7,10],[8,11],[8,15],
  [10,14],[11,13],[11,15],[11,16],[12,15],[13,16],[13,19],[14,18],[15,16],
  [16,19],[18,23],[19,22],[19,24],[20,21],[21,22],[22,24],[23,26],[27,28],
  [28,29],[29,30],[31,32],[33,35],[34,35],[34,36],
];

// ---------------------------------------------------------------------------
// Main init
// ---------------------------------------------------------------------------
export function initHeroInteractiveCanvas(containerId = "hero-canvas-container") {
  const container = document.getElementById(containerId);
  if (!container) return null;

  const scene = new Scene();

  const getSize = () => ({
    w: container.clientWidth  || window.innerWidth,
    h: container.clientHeight || window.innerHeight,
  });

  let { w, h } = getSize();
  const camera = new PerspectiveCamera(38, w / h, 0.1, 100);
  camera.position.z = 11.5;

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Build node positions in 3D (z-spread gives depth for perspective tilt)
  const nodes3D = RAW_NODES.map(([nx, ny], i) => new Vector3(
    nx  * SCALE,
    ny  * SCALE,
    (Math.sin(i * 2.3) + Math.cos(i * 1.7)) * 0.55, // gentle z-depth
  ));

  // ---------------------------------------------------------------------------
  // Interactive group (everything rotates together)
  // ---------------------------------------------------------------------------
  const group = new Group();
  scene.add(group);

  // --- Thin wireframe edges ---
  const linePosArr = [];
  for (const [a, b] of EDGES) {
    const na = nodes3D[a], nb = nodes3D[b];
    linePosArr.push(na.x, na.y, na.z, nb.x, nb.y, nb.z);
  }
  const lineGeo = new BufferGeometry();
  lineGeo.setAttribute("position", new Float32BufferAttribute(linePosArr, 3));
  const lineMat = new LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.38,
    blending: AdditiveBlending,
  });
  group.add(new LineSegments(lineGeo, lineMat));

  // --- Bright glowing orb nodes ---
  const nodePosArr = [];
  const nodeSizeArr = [];
  for (let i = 0; i < nodes3D.length; i++) {
    const v = nodes3D[i];
    nodePosArr.push(v.x, v.y, v.z);
    // A few nodes are larger/brighter (matches the reference)
    nodeSizeArr.push(0.52 + Math.random() * 0.28);
  }

  const nodeSpriteTex = createNodeSprite(128);
  const nodeShaderMat = new ShaderMaterial({
    uniforms: {
      uTex:  { value: nodeSpriteTex },
      uTime: { value: 0 },
    },
    vertexShader: `
      attribute float aSz;
      attribute float aPhase;
      varying float vAlpha;
      uniform float uTime;
      void main() {
        vAlpha = 0.92 + 0.08 * sin(uTime * 1.6 + aPhase * 6.28);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position   = projectionMatrix * mv;
        gl_PointSize  = aSz * (480.0 / -mv.z);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTex;
      varying float vAlpha;
      void main() {
        vec4 tex = texture2D(uTex, gl_PointCoord);
        if (tex.a < 0.02) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, tex.a * vAlpha);
      }
    `,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });

  const nodeGeo = new BufferGeometry();
  nodeGeo.setAttribute("position", new Float32BufferAttribute(nodePosArr, 3));
  nodeGeo.setAttribute("aSz",      new Float32BufferAttribute(nodeSizeArr, 1));
  const nodePhases = new Float32Array(nodes3D.length).map(() => Math.random());
  nodeGeo.setAttribute("aPhase",   new Float32BufferAttribute(nodePhases, 1));
  group.add(new Points(nodeGeo, nodeShaderMat));

  // --- Dense soft dust cloud fill (the main volumetric body) ---
  //
  // We seed dust inside the CONVEX HULL of the cluster by interpolating random
  // triangles of node triplets, then further seeding along each edge.
  // This reproduces the dense nebula body visible in the reference.

  const DUST_INTERIOR  = 24000;  // interior volume particles
  const DUST_EDGE_PER  = 60;     // extra along each edge

  const dustPos   = [];
  const dustPhase = [];
  const dustSz    = [];
  const dustA     = [];

  // Helper: random barycentric point inside triangle abc
  function randInTri(a, b, c) {
    let r1 = Math.random(), r2 = Math.random();
    if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
    const r3 = 1 - r1 - r2;
    return new Vector3(
      a.x * r1 + b.x * r2 + c.x * r3,
      a.y * r1 + b.y * r2 + c.y * r3,
      a.z * r1 + b.z * r2 + c.z * r3,
    );
  }

  // Build a fan of triangles from centroid to each edge to fill the interior
  const centroid = new Vector3();
  for (const v of nodes3D) centroid.add(v);
  centroid.divideScalar(nodes3D.length);

  for (let i = 0; i < DUST_INTERIOR; i++) {
    const edge = EDGES[Math.floor(Math.random() * EDGES.length)];
    const p = randInTri(centroid, nodes3D[edge[0]], nodes3D[edge[1]]);
    // Jitter z a bit more for depth haze
    p.z += (Math.random() - 0.5) * 1.4;

    const dist = p.distanceTo(centroid);
    const maxDist = SCALE * 0.95;
    const radialFade = Math.max(0.05, 1.0 - (dist / maxDist) * 0.9);

    dustPos.push(p.x, p.y, p.z);
    dustPhase.push(Math.random());
    dustSz.push(0.6 + Math.random() * 0.9);
    dustA.push((0.18 + Math.random() * 0.28) * radialFade);
  }

  // Also seed particles along each edge for the visible line-haze effect
  for (const [a, b] of EDGES) {
    const na = nodes3D[a], nb = nodes3D[b];
    for (let i = 0; i < DUST_EDGE_PER; i++) {
      const t = Math.random();
      const jx = (Math.random() - 0.5) * 0.18;
      const jy = (Math.random() - 0.5) * 0.18;
      dustPos.push(
        na.x + (nb.x - na.x) * t + jx,
        na.y + (nb.y - na.y) * t + jy,
        na.z + (nb.z - na.z) * t + (Math.random() - 0.5) * 0.3,
      );
      dustPhase.push(Math.random());
      dustSz.push(0.6 + Math.random() * 0.9);
      dustA.push(0.22 + Math.random() * 0.22);
    }
  }

  const dustSpriteTex = createDustSprite(32);
  const dustShaderMat = new ShaderMaterial({
    uniforms: {
      uTex:  { value: dustSpriteTex },
      uTime: { value: 0 },
    },
    vertexShader: `
      attribute float aPhase;
      attribute float aSize;
      attribute float aAlpha;
      varying float vAlpha;
      uniform float uTime;
      void main() {
        vec3 pos = position;
        pos.x += sin(uTime * 1.05 + aPhase * 6.28) * 0.016;
        pos.y += cos(uTime * 0.88 + aPhase * 4.15) * 0.016;
        pos.z += sin(uTime * 1.22 + aPhase * 8.31) * 0.016;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position  = projectionMatrix * mv;
        gl_PointSize = aSize * (220.0 / -mv.z);
        float tw = 0.75 + 0.25 * sin(uTime * 1.9 + aPhase * 12.56);
        vAlpha = aAlpha * tw;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTex;
      varying float vAlpha;
      void main() {
        vec4 tex = texture2D(uTex, gl_PointCoord);
        if (tex.a < 0.02) discard;
        gl_FragColor = vec4(0.93, 0.95, 1.0, tex.a * vAlpha);
      }
    `,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });

  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute("position", new Float32BufferAttribute(dustPos, 3));
  dustGeo.setAttribute("aPhase",   new Float32BufferAttribute(dustPhase, 1));
  dustGeo.setAttribute("aSize",    new Float32BufferAttribute(dustSz,    1));
  dustGeo.setAttribute("aAlpha",   new Float32BufferAttribute(dustA,     1));
  group.add(new Points(dustGeo, dustShaderMat));

  // ---------------------------------------------------------------------------
  // Camera & position
  // ---------------------------------------------------------------------------
  let anchorX = 2.4;
  let anchorY = 0.1;

  function applyLayout() {
    const { w: cw } = getSize();
    if (cw < 768) {
      anchorX = 0;
      anchorY = 0.5;
      camera.position.z = 14.5;
    } else {
      anchorX = 2.4;
      anchorY = 0.1;
      camera.position.z = 11.5;
    }
    group.position.x = anchorX;
    group.position.y = anchorY;
  }
  applyLayout();

  // Initial isometric viewing angle (matches the reference diagonal view)
  const BASE_ROT_X =  0.38;
  let   baseRotY   = -0.45;

  let curRotX = BASE_ROT_X, curRotY = baseRotY;
  let curPosX = anchorX,    curPosY = anchorY;

  const tMx = { x: 0, y: 0 };
  const  mX = { x: 0, y: 0 };

  // ---------------------------------------------------------------------------
  // Interaction events
  // ---------------------------------------------------------------------------
  let isDragging = false, px = 0, py = 0;
  let dRX = 0, dRY = 0, dVX = 0, dVY = 0;

  function onMove(e) {
    tMx.x = (e.clientX / window.innerWidth)  * 2 - 1;
    tMx.y = -(e.clientY / window.innerHeight) * 2 + 1;
    if (isDragging) {
      dVY = (e.clientX - px) * 0.005; dRY += dVY;
      dVX = (e.clientY - py) * 0.005; dRX += dVX;
      px = e.clientX; py = e.clientY;
    }
  }
  function onDown(e) {
    if (e.button && e.button !== 0) return;
    isDragging = true; px = e.clientX; py = e.clientY;
    dVX = dVY = 0;
  }
  function onUp()     { isDragging = false; }
  function onLeave()  { tMx.x = 0; tMx.y = 0; isDragging = false; }

  window.addEventListener("pointermove",  onMove,  { passive: true });
  window.addEventListener("pointerdown",  onDown,  { passive: true });
  window.addEventListener("pointerup",    onUp,    { passive: true });
  window.addEventListener("pointerleave", onLeave, { passive: true });

  function onResize() {
    const { w: rw, h: rh } = getSize();
    camera.aspect = rw / rh;
    camera.updateProjectionMatrix();
    renderer.setSize(rw, rh);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    applyLayout();
  }
  window.addEventListener("resize", onResize);

  // Pause when off-screen
  let visible = true;
  const obs = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 });
  obs.observe(container);

  // ---------------------------------------------------------------------------
  // Render loop
  // ---------------------------------------------------------------------------
  let raf;

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (!visible) return;

    // Smooth mouse
    mX.x += (tMx.x - mX.x) * 0.06;
    mX.y += (tMx.y - mX.y) * 0.06;

    // Drag inertia
    if (!isDragging) { dRX += dVX; dRY += dVY; dVX *= 0.90; dVY *= 0.90; }

    // Ambient drift
    baseRotY += 0.0010;

    const tRX = BASE_ROT_X + dRX - mX.y * 0.60;
    const tRY = baseRotY   + dRY + mX.x * 0.80;
    curRotX += (tRX - curRotX) * 0.065;
    curRotY += (tRY - curRotY) * 0.065;
    group.rotation.x = curRotX;
    group.rotation.y = curRotY;

    // Float
    const floatY = Math.sin(now * 0.001) * 0.09;
    const tPX = anchorX + mX.x * 0.30;
    const tPY = anchorY + floatY + mX.y * 0.22;
    curPosX += (tPX - curPosX) * 0.055;
    curPosY += (tPY - curPosY) * 0.055;
    group.position.x = curPosX;
    group.position.y = curPosY;

    // Uniforms
    const t = now * 0.001;
    nodeShaderMat.uniforms.uTime.value = t;
    dustShaderMat.uniforms.uTime.value = t;

    renderer.render(scene, camera);
  }

  raf = requestAnimationFrame(tick);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  return function cleanup() {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove",  onMove);
    window.removeEventListener("pointerdown",  onDown);
    window.removeEventListener("pointerup",    onUp);
    window.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("resize", onResize);
    obs.disconnect();
    if (renderer.domElement.parentElement)
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    [lineGeo, nodeGeo, dustGeo].forEach((g) => g.dispose());
    [lineMat, nodeShaderMat, dustShaderMat].forEach((m) => m.dispose());
    [nodeSpriteTex, dustSpriteTex].forEach((t) => t.dispose());
    renderer.dispose();
  };
}

// Auto-mount
if (typeof document !== "undefined") {
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => initHeroInteractiveCanvas());
  else
    initHeroInteractiveCanvas();
}
