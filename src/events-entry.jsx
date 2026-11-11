import React from "react";
import { createRoot } from "react-dom/client";
// An independent island: it never reads, mounts or resets the preloader.
const host = document.getElementById("events-root");
let mounted = false;
function mount() {
  if (mounted || !host) return;
  mounted = true;
  observer.disconnect();
  import("./components/events/EventsSection")
    .then(({ default: EventsSection }) => {
      createRoot(host).render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(EventsSection),
        ),
      );
      requestAnimationFrame(() => window.ScrollTrigger?.refresh());
    })
    .catch(() => {
      const message = host.querySelector("[data-events-loading]");
      if (message)
        message.textContent =
          "The archive could not initialize. Event details have not been announced yet.";
    });
}
const observer = new IntersectionObserver(
  (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) mount();
  },
  { rootMargin: "650px" },
);
if (host) {
  observer.observe(host);
  if (location.hash === "#events") mount();
}
