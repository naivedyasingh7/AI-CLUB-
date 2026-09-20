import React, { useEffect, useState } from 'react';


export default function Loader({ onComplete }) {
  const [count, setCount] = useState(0);
  const [utcTime, setUtcTime] = useState({ utc: 'UTC +00:00', time: '00:00:00' });
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const offset = now.getTimezoneOffset();
      const absOffset = Math.abs(offset);
      const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
      const minutes = String(absOffset % 60).padStart(2, '0');
      const sign = offset <= 0 ? '+' : '-';
      const utcStr = `UTC ${sign}${hours}:${minutes}`;

      setUtcTime({ utc: utcStr, time: timeStr });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    const t1 = setTimeout(() => setCount(30), 400);
    const t2 = setTimeout(() => setCount(33), 900);
    const t3 = setTimeout(() => setCount(99), 1400);
    const t4 = setTimeout(() => {
      setCount(100);
      setTimeout(() => {
        setHidden(true);
        if (onComplete) onComplete();
      }, 600);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className={`loader ${hidden ? 'hide' : ''}`}>
      <div className="loader-bg absolute inset-0 z-0">
        <video className="video" autoPlay loop muted playsInline>
          <source src="https://hackfirst.io/video/tornado-home.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="loader-dots">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <img src="/img/svg/loader-circle-1.svg" alt="" className="loader-circle-1" />
      <img src="/img/svg/loader-circle-2.svg" alt="" className="loader-circle-2" />

      <div className="loader-count">
        <div className="odometer">{String(count).padStart(2, '0')}</div>
        <div className="loader-percent">%</div>
      </div>

      <div className="loader-utc">{utcTime.utc}</div>
      <div className="loader-time">{utcTime.time}</div>

      <div className="loader-text">
        AI Club: Innovating the future. Mastering Technology. At AI Club, we believe that building is the best learning
      </div>
    </div>
  );
}
