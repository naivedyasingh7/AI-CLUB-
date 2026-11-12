import React, { useEffect, useRef } from 'react';

export default function CyberCanvas({ type = 'tornado', className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle setup based on type
    const count = type === 'tornado' ? 140 : type === 'defeat' ? 90 : 70;
    const particles = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * canvas.width,
      y: (Math.random() - 0.5) * canvas.height,
      z: Math.random() * canvas.width,
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * 200 + 40,
      speed: Math.random() * 0.02 + 0.005,
      size: Math.random() * 2.5 + 1,
      color: type === 'defeat' 
        ? `rgba(255, ${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 80)}, ${Math.random() * 0.8 + 0.2})` 
        : `rgba(15, 160, 240, ${Math.random() * 0.7 + 0.3})`
    }));

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.fillStyle = type === 'defeat' ? 'rgba(10, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      if (type === 'tornado') {
        // Render 3D Tornado Funnel
        particles.forEach((p) => {
          p.angle += p.speed;
          p.y += 1.2;
          if (p.y > canvas.height / 2) p.y = -canvas.height / 2;

          const currentRadius = (p.y + canvas.height / 2) * 0.6 + 20;
          const px = cx + Math.cos(p.angle) * currentRadius;
          const py = cy + p.y;

          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#0fa0f0';
          ctx.fill();
        });

        // Center glow
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 350);
        grad.addColorStop(0, 'rgba(15, 160, 240, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

      } else if (type === 'defeat') {
        // Render Intrusion Red Glitch Net
        ctx.strokeStyle = 'rgba(255, 30, 30, 0.15)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Glitch pulse
        if (Math.random() > 0.85) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.08)';
          ctx.fillRect(0, Math.random() * canvas.height, canvas.width, Math.random() * 40);
        }

        particles.forEach((p) => {
          p.x += Math.sin(time + p.angle) * 1.5;
          p.y += Math.cos(time + p.angle) * 1.5;

          ctx.beginPath();
          ctx.arc(cx + p.x, cy + p.y, p.size * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ff2222';
          ctx.fill();
        });

      } else if (type === 'radar') {
        // Render Spinning Radar Scope
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * 0.8);

        const radarGrad = ctx.createConicGradient(0, 0, 0);
        radarGrad.addColorStop(0, 'rgba(0, 200, 255, 0.3)');
        radarGrad.addColorStop(0.2, 'rgba(0, 200, 255, 0.0)');
        radarGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(0, 0, Math.min(cx, cy) * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = radarGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();

      } else {
        // Ambient Cyber Nodes
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          p1.x += Math.cos(p1.angle) * 0.4;
          p1.y += Math.sin(p1.angle) * 0.4;

          if (Math.abs(p1.x) > cx) p1.x = (Math.random() - 0.5) * canvas.width;
          if (Math.abs(p1.y) > cy) p1.y = (Math.random() - 0.5) * canvas.height;

          const px1 = cx + p1.x;
          const py1 = cy + p1.y;

          ctx.beginPath();
          ctx.arc(px1, py1, p1.size, 0, Math.PI * 2);
          ctx.fillStyle = p1.color;
          ctx.fill();

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (dist < 120) {
              ctx.beginPath();
              ctx.moveTo(px1, py1);
              ctx.lineTo(cx + p2.x, cy + p2.y);
              ctx.strokeStyle = `rgba(15, 160, 240, ${1 - dist / 120})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type]);

  return <canvas ref={canvasRef} className={`w-full h-full block ${className}`} />;
}
