import React from 'react';

export default function AboutPage() {
  const edges = [
    { num: '01', text: 'Proprietary AI Offensive Hacking Engine' },
    { num: '02', text: 'Top 1 Ranked Hall of Fame Security Researchers' },
    { num: '03', text: 'Zero Downtime & Controlled Environment Simulations' },
    { num: '04', text: 'Deep Web3 & Cryptographic Protocol Specialization' },
    { num: '05', text: 'Real Adversary Emulation (Fancy Bear, Lazarus Tactics)' },
    { num: '06', text: 'Actionable Remediation Guidance & Retesting' }
  ];

  return (
    <div className="about-page">
      <div className="back mb-8">
        <a href="/" className="hover-effect">Back to Home</a>
      </div>

      <div className="about-head">
        <h1 className="about-title">About HackFirst</h1>
        <p className="about-desc">
          We are an elite collective of independent ethical hackers dedicated to outsmarting cyber attackers before real damage occurs.
        </p>
      </div>

      <div className="about-info my-16">
        <div className="about-info__item border-b border-white/10">
          <b>Our Mission</b>
          <p>
            Standard compliance audits create a false sense of security. HackFirst exists to forge organizations in fire through offensive cyberattack simulations that reveal non-obvious attack vectors.
          </p>
        </div>

        <div className="about-info__item border-b border-white/10">
          <b>Black Hat Mindset, White Hat Integrity</b>
          <p>
            Our team consists of over 10 world-class security researchers ranked at the very top of global hacker leaderboards for major cryptocurrency exchanges, financial platforms, and tech enterprises.
          </p>
        </div>
      </div>

      <div className="about-edge">
        <div className="about-edge__head">
          <span className="about-edge__badge font-mono text-cyan-400">Competitive Edge</span>
          <h2 className="about-edge__title">Why Organizations Choose Us</h2>
        </div>

        <div className="about-edge__grid">
          {edges.map((edge) => (
            <div key={edge.num} className="about-edge__item">
              <span className="text-4xl font-light font-mono mb-auto">{edge.num}</span>
              <p className="mt-8 font-mono text-sm tracking-wider uppercase">{edge.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
