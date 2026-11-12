let loaded;
// Warm the module/WASM only; no world or rigid body exists until focus handoff.
export function preloadFocusPhysics() {
  loaded ||= Promise.all([
    import("./InteractiveLanyard"),
    import("@club/focus-rapier").then((runtime) => runtime.init()),
  ]).then(([module]) => module);
  return loaded;
}
