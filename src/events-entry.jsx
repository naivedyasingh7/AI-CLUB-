// This island is deliberately independent of the preloader root and legacy GSAP.
const host = document.getElementById('events-root');
let mounted = false;
const observer = new IntersectionObserver(entries => {
  if (!entries.some(entry=>entry.isIntersecting) || mounted) return;
  mounted = true;
  observer.disconnect();
  Promise.all([import('react'),import('react-dom/client'),import('./components/events/EventsSection')]).then(([React,{createRoot},{default:EventsSection}])=>{
    createRoot(host).render(React.createElement(React.StrictMode,null,React.createElement(EventsSection)));
    requestAnimationFrame(()=>window.ScrollTrigger?.refresh());
  }).catch(()=>{ host.querySelector('[data-events-loading]').textContent='The archive could not initialize. Event details have not been announced yet.'; });
},{rootMargin:'650px'});
if (host) observer.observe(host);
