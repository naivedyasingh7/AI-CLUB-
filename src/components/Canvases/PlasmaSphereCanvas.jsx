import React, { useEffect, useRef } from 'react';

export default function PlasmaSphereCanvas({ className = '', speed = 1.0, scale = 1.0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let time = 0;

    // Tendril paths
    const tendrilCount = 14;
    const tendrils = Array.from({ length: tendrilCount }, (_, i) => ({
      angle: (i / tendrilCount) * Math.PI * 2,
      speed: (Math.random() * 0.02 + 0.01) * (i % 2 === 0 ? 1 : -1),
      nodes: Array.from({ length: 8 }, () => Math.random() * 0.8 + 0.2),
      phase: Math.random() * Math.PI * 2
    }));

    const render = () => {
      time += 0.02 * speed;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.32 * scale;

      // 1. Dark outer space background vignette
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // 2. Outer Atmospheric Blue Aura / Glow
      const auraGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.6, cx, cy, baseRadius * 1.8);
      auraGrad.addColorStop(0, 'rgba(50, 110, 255, 0.4)');
      auraGrad.addColorStop(0.4, 'rgba(20, 70, 220, 0.25)');
      auraGrad.addColorStop(0.7, 'rgba(10, 40, 160, 0.1)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = auraGrad;
      ctx.fill();
      ctx.restore();

      // 3. Electric Plasma Sphere Base Body
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.clip(); // Restrict plasma to inside the sphere

      // Inner sphere gradient
      const sphereGrad = ctx.createRadialGradient(
        cx + Math.cos(time) * 20, 
        cy + Math.sin(time) * 20, 
        10, 
        cx, 
        cy, 
        baseRadius
      );
      sphereGrad.addColorStop(0, '#7bb8ff');
      sphereGrad.addColorStop(0.3, '#2a66f0');
      sphereGrad.addColorStop(0.7, '#0b2680');
      sphereGrad.addColorStop(1, '#020926');

      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // Swirling Plasma Clouds
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 6; i++) {
        const cloudTime = time * (0.8 + i * 0.2);
        const radiusOffset = Math.sin(cloudTime + i) * 15;
        const subRadius = baseRadius * (0.4 + (i % 3) * 0.2) + radiusOffset;

        const subCx = cx + Math.cos(cloudTime * 0.7 + i) * (baseRadius * 0.3);
        const subCy = cy + Math.sin(cloudTime * 0.5 + i) * (baseRadius * 0.3);

        const cloudGrad = ctx.createRadialGradient(subCx, subCy, 5, subCx, subCy, subRadius);
        cloudGrad.addColorStop(0, 'rgba(180, 220, 255, 0.6)');
        cloudGrad.addColorStop(0.5, 'rgba(50, 130, 255, 0.3)');
        cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.arc(subCx, subCy, subRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Swirling Electric Lightning Tendrils
      ctx.lineWidth = 2;
      tendrils.forEach((t, idx) => {
        t.angle += t.speed;
        const startAng = t.angle;
        
        ctx.beginPath();
        let currR = baseRadius * 0.1;
        let currX = cx + Math.cos(startAng) * currR;
        let currY = cy + Math.sin(startAng) * currR;
        ctx.moveTo(currX, currY);

        for (let step = 1; step <= 6; step++) {
          const progress = step / 6;
          const targetR = baseRadius * (0.2 + progress * 0.75);
          const wobble = Math.sin(time * 4 + idx * 2 + step) * 18;
          const stepAng = startAng + (step * 0.3) + (wobble * 0.02);

          const nextX = cx + Math.cos(stepAng) * targetR + (Math.random() - 0.5) * 8;
          const nextY = cy + Math.sin(stepAng) * targetR + (Math.random() - 0.5) * 8;

          ctx.lineTo(nextX, nextY);
        }

        ctx.strokeStyle = idx % 2 === 0 ? 'rgba(230, 245, 255, 0.85)' : 'rgba(100, 180, 255, 0.7)';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#60b0ff';
        ctx.stroke();
      });

      ctx.restore();

      // 4. Bright Electric Rim / Plasma Boundary Ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(180, 220, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#50a0ff';
      ctx.stroke();
      ctx.restore();

      // Outer faint thin dark shell ring (matching user's screenshot)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.08, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [speed, scale]);

  return <canvas ref={canvasRef} className={`w-full h-full block ${className}`} />;
}
