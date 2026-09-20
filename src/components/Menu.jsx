import React, { useState } from 'react';


export default function Menu({ isOpen, onClose }) {
  const [activeSpeed, setActiveSpeed] = useState(1.0);

  const menuItems = [
    { label: 'Home', href: '/', speed: 1.0, index: '[ 00 - 01 ]' },
    { label: 'Services', href: '/services', speed: 1.5, index: '[ 00 - 02 ]' },
    { label: 'About', href: '/about', speed: 0.8, index: '[ 00 - 03 ]' },
    { label: 'Contact', href: '/contacts', speed: 2.0, index: '[ 00 - 04 ]' }
  ];

  return (
    <div className={`menu ${isOpen ? 'show' : ''}`}>
      <div className="menu-head">
        <img src="/img/svg/logo-new.svg" alt="" className="menu-logo" />
        <div className="menu-close js-open-menu" onClick={onClose}>
          close
        </div>
      </div>

      <div className="menu-main">
        <div className="menu-row">
          <div className="menu-side">
            <div className="menu-label">Discover</div>
          </div>
          <div className="menu-content">
            <ul className="menu-nav">
              {menuItems.map((item) => (
                <li 
                  key={item.label} 
                  onMouseEnter={() => setActiveSpeed(item.speed)}
                >
                  <a href={item.href} data-index={item.index}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="menu-bottom">
        <div className="menu-row">
          <div className="menu-side">
            <div className="menu-label">Socials</div>
          </div>
          <div className="menu-content">
            <ul className="menu-socials">
              <li><a href="#" className="hover-effect hover-effect--bg">Facebook</a></li>
              <li><a href="#" className="hover-effect hover-effect--bg">LinkedIn</a></li>
              <li><a href="#" className="hover-effect hover-effect--bg">X</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="menu-video__wrapper">
        <video className="menu-video" autoPlay loop muted playsInline>
          <source src="https://hackfirst.io/video/tornado-home.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
