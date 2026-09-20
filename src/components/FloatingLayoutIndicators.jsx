import React, { useEffect, useState } from 'react';

export default function FloatingLayoutIndicators() {
  const [activeLayout, setActiveLayout] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[data-layout]');
      let current = null;

      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.2) {
          current = sec.getAttribute('data-layout');
        }
      });

      setActiveLayout(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const layouts = [
    { id: '01', title: 'Solution' },
    { id: '02', title: 'About' },
    { id: '03', title: 'Technologies' },
    { id: '04', title: 'Awards' }
  ];

  return (
    <>
      {layouts.map((item) => {
        const isActive = activeLayout === item.id;
        return (
          <React.Fragment key={item.id}>
            <div 
              className="layout-title" 
              data-layout={item.id}
              style={{ opacity: isActive ? 1 : 0, filter: isActive ? 'blur(0px)' : 'blur(10px)' }}
            >
              {item.title}
            </div>
            <div 
              className="layout-count" 
              data-layout={item.id}
              style={{ opacity: isActive ? 1 : 0, filter: isActive ? 'blur(0px)' : 'blur(10px)' }}
            >
              {item.id}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
}
