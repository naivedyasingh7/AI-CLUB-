// Original AI Club model; no third-party demonstration geometry is used.
// Run: node scripts/build-event-badge.mjs (no Blender or extra dependency needed).
import { writeFile } from "node:fs/promises";
import {
  Scene,
  Shape,
  Path,
  ExtrudeGeometry,
  Mesh,
  MeshPhysicalMaterial,
  TorusGeometry,
  CylinderGeometry,
} from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = value;
      this.onloadend?.();
    });
  }
};
function rounded(x, y, width, height, r, Type = Shape) {
  const s = new Type();
  s.moveTo(x + r, y);
  s.lineTo(x + width - r, y);
  s.quadraticCurveTo(x + width, y, x + width, y + r);
  s.lineTo(x + width, y + height - r);
  s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  s.lineTo(x + r, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
const scene = new Scene();
const shell = new MeshPhysicalMaterial({
  roughness: 0.32,
  metalness: 0.12,
  clearcoat: 0.8,
});
const metal = new MeshPhysicalMaterial({ roughness: 0.27, metalness: 0.92 });
function extruded(name, shape, depth, bevel, material) {
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 16,
  });
  geometry.translate(0, 0, -depth / 2);
  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  scene.add(mesh);
  return mesh;
}
const body = rounded(-0.9, -1.3, 1.8, 2.6, 0.12);
body.holes.push(rounded(-0.23, 1.1, 0.46, 0.12, 0.05, Path));
extruded("laminated_shell", body, 0.09, 0.025, shell);
const eyelet = rounded(-0.29, 1.05, 0.58, 0.22, 0.07);
eyelet.holes.push(rounded(-0.23, 1.1, 0.46, 0.12, 0.05, Path));
extruded("reinforced_slot", eyelet, 0.145, 0.008, metal);
const clip = rounded(-0.12, 1.13, 0.24, 0.35, 0.08);
clip.holes.push(rounded(-0.075, 1.19, 0.15, 0.23, 0.04, Path));
extruded("swivel_clip", clip, 0.07, 0.012, metal).position.z = 0.1;
const ring = new Mesh(new TorusGeometry(0.105, 0.025, 10, 32), metal);
ring.name = "strap_ring";
ring.position.set(0, 1.51, 0.1);
scene.add(ring);
for (const x of [-0.36, 0.36]) {
  const rivet = new Mesh(new CylinderGeometry(0.028, 0.028, 0.028, 16), metal);
  rivet.rotation.x = Math.PI / 2;
  rivet.position.set(x, 1.16, 0.069);
  rivet.name = `rivet_${x < 0 ? "left" : "right"}`;
  scene.add(rivet);
}
const output = await new GLTFExporter().parseAsync(scene, { binary: true });
await writeFile(
  new URL("../public/models/events/ai-club-pass.glb", import.meta.url),
  Buffer.from(output),
);
process.stdout.write(`Wrote original badge GLB (${output.byteLength} bytes).\n`);
