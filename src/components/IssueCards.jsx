import React, { useEffect, useRef, useState } from 'react';


export default function IssueCards() {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemsRef = useRef([]);

  useEffect(() => {
    const handleScroll = () => {
      itemsRef.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
          setActiveIndex(idx);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const issues = [
    {
      title: 'Theory ≠ Practice',
      text: 'Completing a standard course does not translate into real-world AI skills.',
      index: '01'
    },
    {
      title: 'Limited coursework',
      text: 'Most classes only cover obvious algorithms and do not build complete systems.',
      index: '02'
    },
    {
      title: 'Real industry uses dynamic AI models',
      text: 'Real industry uses dynamic AI models that adapt to new data instantly.',
      index: '03'
    }
  ];

  return (
    <section className="issue relative z-10">
      {issues.map((issue, idx) => {
        const isActive = activeIndex === idx;
        return (
          <div
            key={issue.title}
            ref={(el) => (itemsRef.current[idx] = el)}
            className={`issue-item ${isActive ? 'show' : ''}`}
          >
            <div className="issue-item__bg">
              <video className="video" autoPlay loop muted playsInline>
                <source src="https://hackfirst.io/video/tornado-home.mp4" type="video/mp4" />
              </video>
            </div>

            <div className={`fixed top-1/2 left-10 -translate-y-1/2 font-mono text-sm transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
              {issue.index}
            </div>

            <div className="issue-item__content">
              <h2 className="issue-item__title">{issue.title}</h2>
              <p className="issue-item__text">{issue.text}</p>
            </div>

            <div className="issue-item__label">
              {issue.title}
            </div>
          </div>
        );
      })}
    </section>
  );
}
