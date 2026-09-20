import React, { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const current = Math.round((window.scrollY / totalHeight) * 100);
      setPercent(Math.min(100, Math.max(0, current)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="scroll-progress">
      <div className="scroll-progress__animate">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className="scroll-progress__percent">{percent}%</div>
    </div>
  );
}
