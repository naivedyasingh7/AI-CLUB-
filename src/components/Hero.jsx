import React from 'react';


export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-tornado">
        <video preload="auto" playsInline autoPlay loop muted className="hero-tornado">
          <source src="https://hackfirst.io/video/tornado-home.mp4" type="video/mp4" />
        </video>
      </div>

      <h1 className="hero-massive-title" animate-blur-text="true">HACKFIRST</h1>

      <div className="hero-content">
        <span className="hero-label" animate-blur-text="true">CYBERATTACK SIMULATIONS</span>
        <h3 className="hero-title" animate-blur-text="true">Most advanced cyberattack<br/>simulations: HackFirst™</h3>
      </div>

      <div className="hero-corner">
        <div className="hero-corner-bars"><span className="bar active"></span><span className="bar"></span><span className="bar"></span> 0%</div>
      </div>

      <div className="hero-credit">DESIGN BY .CASSARI</div>
    </section>
  );
}
