const ROUTES = new Set(['/', '/services', '/about', '/contacts']);

// One delegated listener per application root, never owned by the loader.
export function installNavigation({ onRoute } = {}) {
  function navigate(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    const section = url.hash && url.pathname === location.pathname && url.search === location.search
      ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
    if (!section && !(onRoute && !url.hash && ROUTES.has(url.pathname))) return;
    event.preventDefault();
    if (document.querySelector('.particle-loader')) return;
    if (section) {
      if (location.hash !== url.hash) history.pushState(null, '', url.hash);
      const menu = document.querySelector('.menu.show');
      if (menu) {
        menu.classList.remove('show');
        document.body.style.overflow = '';
      }
      section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    } else {
      history.pushState(null, '', url.pathname + url.search);
      onRoute(url.pathname);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  document.addEventListener('click', navigate);
  return () => document.removeEventListener('click', navigate);
}
