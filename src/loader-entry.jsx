import { createRoot } from 'react-dom/client';
import Loader from './components/Loader';
import { hasLoaderPlayed } from './utils/loaderSession';
import { installNavigation } from './utils/navigation';

// Preserve the existing static production page; mount only its React loader.
const host = document.getElementById('loader-root');
// Decide before createRoot/render: a completed session never creates loader DOM.
const shouldPlayLoader = !hasLoaderPlayed();
installNavigation();
let revealed = false;
function reveal() {
  if (revealed) return;
  revealed = true;
  document.documentElement.dataset.loaderRevealed = 'true';
  document.dispatchEvent(new Event('ai-club:reveal'));
}
if (!shouldPlayLoader) {
  host.remove();
  reveal();
} else {
  const root = createRoot(host);
  root.render(<Loader onBurst={reveal} onComplete={() => {
    reveal();
    root.unmount();
    host.remove();
  }} />);
}
