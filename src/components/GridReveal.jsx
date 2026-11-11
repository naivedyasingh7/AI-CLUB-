import React, { useEffect, useRef, useState } from "react";

export const GridReveal = ({ children, blockSize = 100, baseDelay = 200 }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [inView, setInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [delays, setDelays] = useState([]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        setDimensions({ width, height });
        const totalBlocks = Math.ceil(width / blockSize) * Math.ceil(height / blockSize);
        setDelays(Array.from({ length: totalBlocks }, () => Math.random() * 800));
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [blockSize]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setInView(true);
          setHasAnimated(true);
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const cols = Math.ceil(dimensions.width / blockSize);
  const rows = Math.ceil(dimensions.height / blockSize);
  const totalBlocks = cols * rows;

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      {/* The actual content being revealed */}
      <div className="relative z-0">
        {children}
      </div>

      {/* The Grid Overlay */}
      {dimensions.width > 0 && dimensions.height > 0 && totalBlocks > 0 && (
        <div 
          className="absolute inset-0 z-50 pointer-events-none flex flex-wrap leading-none"
          style={{ 
            width: `${cols * blockSize}px`,
            height: `${rows * blockSize}px`
          }}
        >
          {Array.from({ length: totalBlocks }).map((_, i) => (
            <div
              key={i}
              className="bg-white transition-opacity ease-out"
              style={{
                width: `${blockSize}px`,
                height: `${blockSize}px`,
                opacity: inView ? 0 : 1,
                transitionDuration: "400ms",
                transitionDelay: `${baseDelay + (delays[i] || 0)}ms`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
