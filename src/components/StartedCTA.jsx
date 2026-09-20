import React from 'react';


export default function StartedCTA() {
  return (
    <section className="started min-h-screen relative flex items-center justify-center p-12 overflow-hidden text-center">
      <div className="started-bg">
        <video className="video" autoPlay loop muted playsInline>
          <source src="https://hackfirst.io/video/tornado-home.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="started-content relative z-10 max-w-3xl flex flex-col items-center gap-6">
        <span className="started-label font-mono text-sm tracking-wider uppercase opacity-80" animate-blur-text="true">
          AI Club is the premier technical community
        </span>

        <h2 className="title-md font-normal" animate-blur-text="true">
          Are you truly ready to build the future of AI?
        </h2>

        <p className="started-text max-w-md text-base opacity-80 leading-relaxed font-light" animate-blur-text="true">
          With AI Club's intensive research groups, you’re not just learning theory — you’re building reality
        </p>

        <a 
          href="/contacts" 
          className="started-btn mt-8 px-10 py-3 bg-[#E9F7FC] text-black font-normal rounded-full hover:bg-[#0674f5] hover:text-white transition-colors duration-300 shadow-lg"
          animate-blur-el="true"
        >
          Get started
        </a>
      </div>
    </section>
  );
}
