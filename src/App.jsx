import React, { useState, useEffect } from 'react';
import Loader from './components/Loader';
import Header from './components/Header';
import Menu from './components/Menu';
import ScrollProgress from './components/ScrollProgress';
import FloatingLayoutIndicators from './components/FloatingLayoutIndicators';
import Footer from './components/Footer';

import Home from './pages/Home';
import Services from './pages/Services';
import AboutPage from './pages/AboutPage';
import ContactsPage from './pages/ContactsPage';

import { initGlobalAnimations } from './utils/animations';
import { hasLoaderPlayed } from './utils/loaderSession';
import { installNavigation } from './utils/navigation';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(() => !hasLoaderPlayed());
  const [entranceReady, setEntranceReady] = useState(hasLoaderPlayed);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => installNavigation({ onRoute: path => {
    setMenuOpen(false);
    setCurrentPath(path);
  } }), []);

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (entranceReady) {
      initGlobalAnimations();
    }
  }, [entranceReady, currentPath]);

  const renderPage = () => {
    switch (currentPath) {
      case '/services':
        return <Services />;
      case '/about':
        return <AboutPage />;
      case '/contacts':
        return <ContactsPage />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="wrapper bg-black text-[#E9F7FC] min-h-screen relative">
      {loading && <Loader onBurst={() => setEntranceReady(true)} onComplete={() => setLoading(false)} />}

      <Header onOpenMenu={() => setMenuOpen(true)} isHome={currentPath === '/'} />
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {currentPath === '/' && <FloatingLayoutIndicators />}

      {renderPage()}

      <Footer />
      <ScrollProgress />
    </div>
  );
}
