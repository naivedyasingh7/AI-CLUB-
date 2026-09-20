import React from 'react';


export default function Footer() {
  return (
    <footer className="footer relative border-t border-b border-white/10 overflow-hidden">
      <div className="footer-bg">
        <video className="video" autoPlay loop muted playsInline>
          <source src="https://hackfirst.io/video/tornado-home.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="footer-row relative z-10 flex flex-wrap border-b border-white/10 min-h-[380px]">
        <div className="footer-col flex-1 p-12 flex items-center">
          <img src="/img/svg/logo-new.svg" alt="AI Club Logo" className="footer-logo max-w-xl w-full" />
        </div>

        <div className="footer-col w-full md:w-5/12 p-12 border-l border-white/10 flex flex-col justify-center">
          <div className="footer-about font-mono text-sm uppercase tracking-wider flex flex-col gap-3 max-w-md">
            <span className="opacity-50">about</span>
            <p className="text-base leading-relaxed opacity-80 font-normal">
              AI Club: Innovating the future. Mastering Technology. At AI Club, we don’t just learn—we build.
            </p>
          </div>
        </div>
      </div>

      <div className="footer-row relative z-10 flex flex-wrap border-b border-white/10">
        <div className="footer-col flex-1 p-12">
          <div className="footer-nav font-mono uppercase text-sm">
            <p className="opacity-50 mb-4">Socials</p>
            <ul className="flex gap-8 text-base">
              <li><a href="#" className="hover-effect hover-effect--bg">Facebook</a></li>
              <li><a href="#" className="hover-effect hover-effect--bg">LinkedIn</a></li>
              <li><a href="#" className="hover-effect hover-effect--bg">X</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-col w-full md:w-5/12 p-12 border-l border-white/10">
          <div className="footer-nav font-mono uppercase text-sm">
            <p className="opacity-50 mb-4">Navigation</p>
            <ul className="flex flex-wrap gap-8 text-base">
              <li><a href="/" className="hover-effect hover-effect--bg">Home</a></li>
              <li><a href="/services" className="hover-effect hover-effect--bg">Services</a></li>
              <li><a href="/about" className="hover-effect hover-effect--bg">About</a></li>
              <li><a href="/contacts" className="hover-effect hover-effect--bg">Contact</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom relative z-10 h-14 px-12 flex items-center justify-between font-mono text-xs uppercase opacity-80">
        <div>design by <a href="https://t.me/Cassy_dark" target="_blank" rel="noreferrer" className="underline">.cassari</a></div>
      </div>
    </footer>
  );
}
