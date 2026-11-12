import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
    exclude: ["@react-three/fiber"],
    include: ["use-sync-external-store/shim/with-selector.js", "scheduler"],
  },
  build: {
    rolldownOptions: {
      input: {
        home: fileURLToPath(new URL("./index.html", import.meta.url)),
        events: fileURLToPath(new URL("./events.html", import.meta.url)),
      },
    },
  },
});
