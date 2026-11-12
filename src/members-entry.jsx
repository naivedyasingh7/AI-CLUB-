import React from "react";
import { createRoot } from "react-dom/client";
// This island never reads, mounts or resets the loader or its session flag.
const host = document.getElementById("members-root");
let mounted = false,
  root = null,
  generation = 0;
function mount() {
  if (mounted || !host) return;
  mounted = true;
  observer.disconnect();
  const request = ++generation;
  import("./members/MembersSection")
    .then(({ default: MembersSection }) => {
      if (request !== generation || !host.isConnected) return;
      root = createRoot(host);
      root.render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(MembersSection),
        ),
      );
    })
    .catch(() => {
      if (request !== generation) return;
      const message = host.querySelector("[data-members-loading]");
      if (message)
        message.textContent =
          "The members section could not initialize. Team details have not been announced yet.";
    });
}
function release() {
  generation++;
  root?.unmount();
  root = null;
  mounted = false;
  observer.disconnect();
}
function restore(event) {
  if (event.persisted) mount();
}
const observer = new IntersectionObserver(
  (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) mount();
  },
  { rootMargin: "650px" },
);
if (host) {
  observer.observe(host);
  if (location.hash === "#members") mount();
  window.addEventListener("pagehide", release);
  window.addEventListener("pageshow", restore);
}
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    release();
    window.removeEventListener("pagehide", release);
    window.removeEventListener("pageshow", restore);
  });
