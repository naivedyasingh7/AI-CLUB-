import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';


gsap.registerPlugin(ScrollTrigger);

export default function Solution() {
  const containerRef = useRef(null);
  const screensRef = useRef([]);

  useEffect(() => {
    const screens = screensRef.current;
    if (!screens || screens.length === 0) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          pin: '.solution-container'
        },
        defaults: { ease: 'none' }
      });

      if (screens[3]) {
        gsap.set(screens[3], { y: 200, filter: 'blur(20px)', opacity: 0 });
      }

      tl.to(screens[0], { opacity: 0, duration: 0.2 }, 0.2)
        .to(screens[1], { opacity: 1, duration: 0.2 }, 0.2)
        .to(screens[1], { opacity: 0, duration: 0.2 }, 0.4)
        .to(screens[2], { opacity: 1, duration: 0.2 }, 0.4)
        .to(screens[2], { scale: 0.8, filter: 'blur(30px)', opacity: 0, duration: 0.3 }, 0.7)
        .to(screens[3], { y: 0, filter: 'blur(0px)', opacity: 1, duration: 0.3 }, 0.7);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="solution">
      <div className="solution-container relative w-full h-screen overflow-hidden">
        {/* Screen 1 */}
        <div 
          ref={(el) => (screensRef.current[0] = el)}
          className="solution-screen absolute inset-0 w-full h-screen flex flex-col justify-end p-12 transition-opacity duration-300"
        >
          <div className="solution-bg">
            <video className="video" autoPlay loop muted playsInline>
              <source src="https://hackfirst.io/video/4.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="solution-content relative z-10">
            <span className="solution-label" animate-blur-text="true">THE COMMUNITY</span>
            <h2 className="title" animate-blur-text="true">Practical Experience Can Define You</h2>
          </div>
        </div>

        {/* Screen 2 */}
        <div 
          ref={(el) => (screensRef.current[1] = el)}
          className="solution-screen absolute inset-0 w-full h-screen opacity-0 transition-opacity duration-300"
        >
          <div className="solution-bg">
            <video className="video" autoPlay loop muted playsInline>
              <source src="https://hackfirst.io/video/2.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Screen 3 */}
        <div 
          ref={(el) => (screensRef.current[2] = el)}
          className="solution-screen absolute inset-0 w-full h-screen flex flex-col justify-end p-12 opacity-0 transition-opacity duration-300"
        >
          <div className="solution-bg">
            <video className="video" autoPlay loop muted playsInline>
              <source src="https://hackfirst.io/video/3.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="solution-content relative z-10">
            <span className="solution-label" animate-blur-text="true">THE COMMUNITY</span>
            <h2 className="title" animate-blur-text="true">Collaborative learning gives you an edge</h2>
          </div>
        </div>

        {/* Screen 4 */}
        <div 
          ref={(el) => (screensRef.current[3] = el)}
          className="solution-screen problem absolute inset-0 w-full h-screen flex items-center justify-center p-12 opacity-0"
        >
          <div className="problem-content text-center max-w-lg">
            <span className="problem-label">The challenge</span>
            <h2 className="problem-title">How do standard academic methods fall short?</h2>
          </div>
        </div>
      </div>
    </section>
  );
}
