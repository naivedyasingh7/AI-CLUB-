import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';


gsap.registerPlugin(ScrollTrigger);

export default function Defeat() {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(wrapperRef.current, {
        scale: 0.65,
        borderRadius: '32px',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          pin: true
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="defeat h-[200vh] relative z-20">
      <div className="defeat-body h-screen sticky top-0 overflow-hidden flex items-center justify-center p-8">
        <div 
          ref={wrapperRef} 
          className="defeat-wrapper w-full h-full relative flex flex-col items-center justify-center text-center p-12 overflow-hidden shadow-2xl bg-black"
        >
          <div className="defeat-bg">
            <video className="video" autoPlay loop muted playsInline>
              <source src="https://hackfirst.io/video/tornado-home.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="defeat-content relative z-10 max-w-4xl flex flex-col items-center gap-6">
            <div className="defeat-access">Status Confirmed:</div>
            <h2 className="defeat-title">
              They said AI was hard. But now you’re building it
            </h2>
            <p className="defeat-text">
              To master AI, you need to build with AI.
            </p>
          </div>

          <div className="defeat-notify">
            🚀 Access Granted: Environment is ready. return True else: print ("✨ Innovation Detected! Project initialization complete.") return True # The build succeeded
          </div>
        </div>
      </div>
    </section>
  );
}
