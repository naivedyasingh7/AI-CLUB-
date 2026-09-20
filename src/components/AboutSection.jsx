import React from 'react';


export default function AboutSection() {
  const tickerWords = ['A', 'community', 'of', 'the', 'best', 'independent', 'student', 'researchers'];

  return (
    <>
      <section className="about-video relative h-[600px] overflow-hidden">
        <video className="video" autoPlay loop muted playsInline>
          <source src="https://hackfirst.io/video/1.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay"></div>
      </section>

      <section className="about" data-layout="02">
        <div className="about-line">
          {tickerWords.map((word, idx) => (
            <span key={idx}>{word}</span>
          ))}
        </div>

        <div className="about-content">
          <span className="about-label" animate-blur-text="true">Community &amp; Projects</span>
          <h2 className="title-md" animate-blur-text="true">
            <span>AI Club teams build state-of-the-art models in</span> collaborative environments that push boundaries
          </h2>
          <p className="about-text" animate-blur-el="true">
            Capitalize Leveraging our proprietary research, and deploying whole teams of elite students working in unison — learners with a builder mindset.
          </p>
        </div>

        <div className="about-list">
          <div className="about-list__item" data-index="S / 01">
            <span>Deep Learning</span>
          </div>
          <div className="about-list__item" data-index="S / 02">
            <span>Computer Vision</span>
          </div>
          <div className="about-list__item" data-index="S / 03">
            <span>Generative AI</span>
          </div>
        </div>
      </section>
    </>
  );
}
