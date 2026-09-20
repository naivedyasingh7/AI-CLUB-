import React, { useEffect, useState } from 'react';

export default function Header({ onOpenMenu, isHome = true }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${isHome ? 'header-home' : ''} ${scrolled ? 'difference' : ''}`}>
      {!isHome && (
        <div className={`header-logo ${scrolled ? 'scrolled' : ''}`}>
          <a href="/">
            <img src="/img/svg/logo-new.svg" alt="AI Club Logo" />
          </a>
        </div>
      )}

      <ul className="header-nav">
        <li><a href="/" className="hover-effect hover-effect--bg">Home</a></li>
        <li><a href="/services" className="hover-effect hover-effect--bg">Services</a></li>
        <li><a href="/about" className="hover-effect hover-effect--bg">About</a></li>
        <li><a href="/contacts" className="hover-effect hover-effect--bg">Contact</a></li>
      </ul>

      <div className="header-burger js-open-menu" onClick={onOpenMenu}></div>
    </header>
  );
}
