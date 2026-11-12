import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const rapierEntry = join(
  dirname(
    createRequire(require.resolve("@react-three/rapier")).resolve(
      "@dimforge/rapier3d-compat",
    ),
  ),
  "rapier.mjs",
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "rapier-world-cleanup-order",
      enforce: "pre",
      transform(code, id) {
        if (!id.replaceAll("\\", "/").includes("/@react-three/rapier/dist/"))
          return;
        // Release after descendant effects, and keep Strict Mode's replay world alive.
        // Otherwise resetWorldProxy can create an orphan during child handle checks.
        return {
          code: code.replace(
            /useEffect\(\(\) => \{\s*return \(\) => \{\s*worldProxy\.free\(\);\s*resetWorldProxy\(\);\s*\};\s*\}, \[\]\);/,
            `const releaseGeneration = useRef(0);
  useEffect(() => {
    const generation = ++releaseGeneration.current;
    return () => queueMicrotask(() => {
      if (releaseGeneration.current !== generation) return;
      worldProxy.free();
      resetWorldProxy();
      eventQueue.free();
    });
  }, []);`,
          ),
          map: null,
        };
      },
    },
    {
      name: "rapier-init-options-compatibility",
      enforce: "pre",
      transform(code, id) {
        if (
          !id
            .replaceAll("\\", "/")
            .includes("/@dimforge/rapier3d-compat/rapier.mjs")
        )
          return;
        // Rapier 0.19.2 embeds WASM but calls wasm-bindgen's deprecated positional API.
        // Pass the documented options object; do not filter or silence its warning.
        return {
          code: code.replace(
            /yield (\w+)\((\w+\.toByteArray\("[A-Za-z0-9+/=]+"\)(?:\.buffer)?)\)/,
            "yield $1({module_or_path:$2})",
          ),
          map: null,
        };
      },
    },
    {
      name: "fiber-timer-compatibility",
      enforce: "pre",
      transform(code, id) {
        if (!id.replaceAll("\\", "/").includes("/@react-three/fiber/dist/"))
          return;
        const before = "clock: new THREE.Clock()";
        if (!code.includes(before)) return;
        return {
          code:
            'import { FrameClock } from "/src/components/events/FrameClock.js";\n' +
            code.replace(before, "clock: new FrameClock()"),
          map: null,
        };
      },
    },
  ],
  // Keep this one dependency available to the narrow Timer compatibility transform.
  optimizeDeps: {
    exclude: [
      "@react-three/fiber",
      "@react-three/rapier",
      "@dimforge/rapier3d-compat",
      "@club/focus-rapier",
    ],
    include: ["use-sync-external-store/shim/with-selector.js", "scheduler"],
  },
  resolve: { alias: { "@club/focus-rapier": rapierEntry } },
  build: {
    rolldownOptions: {
      input: {
        home: fileURLToPath(new URL("./index.html", import.meta.url)),
        events: fileURLToPath(new URL("./events.html", import.meta.url)),
      },
    },
  },
});
