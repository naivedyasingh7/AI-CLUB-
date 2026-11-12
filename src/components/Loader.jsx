import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './Loader.css';
import { markLoaderPlayed } from '../utils/loaderSession';

// CSS pixels and seconds. No frame-rate-dependent physics.
const LOADER_CONFIG = Object.freeze({
  desktopParticles: 5000, mobileParticles: 2000, mobileWidth: 768, maxDpr: 2,
  minSize: 0.6, maxSize: 1.8, alphaThreshold: 100, gridStep: 1.8,
  stiffness: 900, damping: 36, drift: 14, delaySpread: 0.24,
  pointerRadius: 100, pointerForce: 1600, burstSpeed: 620,
  minimumMs: 2000, maximumMs: 8000,
  progressEase: 'power1.out', finishEase: 'power2.out',
  hold: 0.3, wave: 0.4, burst: 0.65, fade: 0.55,
  slowFrameMs: 22, profileFrames: 30, minimumParticles: 1200,
  paletteVariables: ['--color-text', '--color-white'],
});
const LOGO = '/img/svg/ai-club-logo-custom.svg';

export default function Loader({ onBurst, onComplete }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const counterRef = useRef(null);
  const logoRef = useRef(null);
  const callbacks = useRef({ onBurst, onComplete });
  useEffect(() => { callbacks.current = { onBurst, onComplete }; }, [onBurst, onComplete]);

  useEffect(() => {
    const c = LOADER_CONFIG;
    const root = rootRef.current, canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    const abort = new AbortController(), { signal } = abort;
    const html = document.documentElement, body = document.body;
    const saved = { overflow: body.style.overflow, htmlOverflow: html.style.overflow,
      padding: body.style.paddingRight, gutter: html.style.scrollbarGutter };
    const gutter = innerWidth - html.clientWidth;
    if (gutter > 0) html.style.scrollbarGutter = 'stable';
    if (getComputedStyle(html).scrollbarGutter !== 'stable' && gutter) {
      body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gutter}px`;
    }
    body.style.overflow = html.style.overflow = 'hidden';
    const unlock = () => {
      body.style.overflow = saved.overflow; html.style.overflow = saved.htmlOverflow;
      body.style.paddingRight = saved.padding; html.style.scrollbarGutter = saved.gutter;
    };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const simple = reduced || !ctx;
    root.dataset.mode = reduced ? 'reduced' : !ctx ? 'fallback' : 'particles';
    let disposed = false, finished = false, bursting = false, raf = 0;
    let progressTween, finishTimeline;
    let width = 0, height = 0, logoSize = 0, cx = 0, cy = 0, targetCount = 0;
    let budget = innerWidth < c.mobileWidth ? c.mobileParticles : c.desktopParticles;
    let count = budget;
    // x, y, vx, vy, tx, ty, size, alpha, delay, palette index, wave hit.
    const stride = 11, data = new Float32Array(c.desktopParticles * stride);
    const state = { progress: 0, wave: 0, opacity: 1, pulse: 0 };
    const style = getComputedStyle(html);
    const palette = c.paletteVariables.map(name => style.getPropertyValue(name).trim());
    const image = new Image(), offscreen = document.createElement('canvas');
    const sample = offscreen.getContext('2d', { willReadFrequently: true });
    let imageReady = false, pointerX = -10000, pointerY = -10000;
    let lastTime = 0, profileTotal = 0, profileCount = 0;
    const start = performance.now(), minimum = c.minimumMs;
    const reveal = () => {
      if (bursting || disposed) return;
      bursting = true; callbacks.current.onBurst?.();
    };
    const complete = () => {
      if (disposed || finished) return;
      finished = true; reveal(); cancelAnimationFrame(raf); abort.abort();
      clearTimeout(deadline); clearTimeout(assetDeadline); unlock();
      markLoaderPlayed();
      callbacks.current.onComplete?.();
    };
    const deadline = setTimeout(complete, c.maximumMs);
    const assetDeadline = setTimeout(() => {
      root.dataset.timedOut = 'true';
      settled = total;
      updateProgress();
    }, c.maximumMs - (c.hold + c.wave + c.burst + 0.5) * 1000);
    const gsapContext = gsap.context(() => {}, root);

    function resize() {
      width = innerWidth; height = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, c.maxDpr);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      logoSize = Math.min(340, width * 0.68, height * 0.46);
      cx = width / 2; cy = height * 0.43;
      root.style.setProperty('--loader-logo-size', `${logoSize}px`);
      root.style.setProperty('--loader-center-y', `${cy}px`);
      budget = Math.min(budget, width < c.mobileWidth ? c.mobileParticles : c.desktopParticles);
      count = budget; targetCount = 0;
      if (imageReady && sample) {
        offscreen.width = offscreen.height = Math.ceil(logoSize);
        sample.drawImage(image, 0, 0, logoSize, logoSize);
        // Rasterize the existing SVG; its alpha defines the targets.
        const pixels = sample.getImageData(0, 0, offscreen.width, offscreen.height).data;
        const points = [];
        let step = c.gridStep;
        do {
          points.length = 0;
          for (let y = 0; y < logoSize; y += step) for (let x = 0; x < logoSize; x += step) {
            if (pixels[(Math.floor(y) * offscreen.width + Math.floor(x)) * 4 + 3] > c.alphaThreshold) {
              points.push(x + cx - logoSize / 2, y + cy - logoSize / 2);
            }
          }
          step *= 1.12;
        } while (points.length / 2 > count * 0.88);
        targetCount = points.length / 2;
        // Unique random assignments; extras remain ambient dust.
        for (let i = targetCount - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1)), x = points[i * 2], y = points[i * 2 + 1];
          points[i * 2] = points[j * 2]; points[i * 2 + 1] = points[j * 2 + 1];
          points[j * 2] = x; points[j * 2 + 1] = y;
        }
        for (let i = 0; i < targetCount; i++) {
          data[i * stride + 4] = points[i * 2]; data[i * stride + 5] = points[i * 2 + 1];
        }
      }
      for (let i = 0; i < count; i++) {
        const p = i * stride;
        data[p] = Math.random() * width; data[p + 1] = Math.random() * height;
        data[p + 2] = data[p + 3] = 0;
        data[p + 6] = c.minSize + Math.random() * (c.maxSize - c.minSize);
        data[p + 7] = 0.4 + Math.random() * 0.6;
        data[p + 8] = Math.random() * c.delaySpread;
        data[p + 9] = Math.floor(Math.random() * palette.length); data[p + 10] = 0;
      }
      root.dataset.particles = String(count); root.dataset.targets = String(targetCount);
    }
    function finish() {
      if (finishTimeline || disposed || finished) return;
      gsapContext.add(() => {
        finishTimeline = gsap.timeline({ defaults: { ease: c.finishEase }, onComplete: complete });
        finishTimeline.addLabel('hold');
        if (simple) {
          finishTimeline.addLabel('burst', 0).call(reveal, [], 'burst')
            .to(root, { opacity: 0, duration: c.fade }, 'burst');
        } else {
          finishTimeline.to(logoRef.current, { opacity: 1, duration: 0.12 }, 'hold')
            .to(logoRef.current, { filter: `drop-shadow(0 0 8px ${palette[0]})`, duration: c.hold / 2, yoyo: true, repeat: 1 }, 'hold')
            .to(state, { pulse: 1, duration: c.hold / 2, yoyo: true, repeat: 1 }, 'hold')
            .addLabel('shockwave', c.hold)
            .to(state, { wave: Math.hypot(width, height), duration: c.wave }, 'shockwave')
            .to(logoRef.current, { opacity: 0, duration: 0.18 }, 'shockwave')
            .addLabel('textExit', c.hold + c.wave - 0.16)
            .to(root.querySelector('.particle-loader__readout'), { y: -18, opacity: 0, duration: 0.16 }, 'textExit')
            .addLabel('burst', c.hold + c.wave).call(reveal, [], 'burst')
            .to(state, { opacity: 0, duration: c.burst }, 'burst')
            .to(root, { opacity: 0, duration: c.fade }, 'burst+=0.1');
        }
      });
    }
    function draw(now) {
      if (disposed || finished) return;
      const elapsed = lastTime ? now - lastTime : 16.67, dt = Math.min(elapsed / 1000, 1 / 30);
      lastTime = now;
      if (!finishTimeline && elapsed < 100) {
        profileTotal += elapsed; profileCount++;
        if (profileCount === c.profileFrames) {
          const average = profileTotal / profileCount;
          root.dataset.frameMs = average.toFixed(2);
          if (average > c.slowFrameMs && budget > c.minimumParticles) {
            budget = Math.max(c.minimumParticles, Math.floor(budget * 0.75)); resize();
          }
          profileCount = profileTotal = 0;
        }
      }
      const progress = state.progress / 100;
      ctx.clearRect(0, 0, width, height);
      const damping = Math.exp(-c.damping * dt);
      for (let i = 0; i < count; i++) {
        const p = i * stride;
        let x = data[p], y = data[p + 1], vx = data[p + 2], vy = data[p + 3];
        const attraction = Math.min(1, Math.max(0, (progress - data[p + 8]) / (0.72 - data[p + 8])));
        const isTarget = i < targetCount;
        // Analytic divergence-free curl field: derivatives of sin(x)*sin(y).
        const time = now * 0.00025;
        vx += Math.sin(x * 0.006 + time) * Math.cos(y * 0.006 - time) * c.drift * dt * (1 - attraction);
        vy -= Math.cos(x * 0.006 + time) * Math.sin(y * 0.006 - time) * c.drift * dt * (1 - attraction);
        if (bursting) {
          const dx = x - cx, dy = y - cy, distance = Math.max(1, Math.hypot(dx, dy));
          vx += dx / distance * c.burstSpeed * dt; vy += dy / distance * c.burstSpeed * dt;
        } else {
          if (isTarget) {
            vx += (data[p + 4] - x) * c.stiffness * attraction * dt;
            vy += (data[p + 5] - y) * c.stiffness * attraction * dt;
            vx *= damping; vy *= damping;
          }
          const dx = x - pointerX, dy = y - pointerY, distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < c.pointerRadius && progress < 0.97) {
            const force = (1 - distance / c.pointerRadius) ** 2 * c.pointerForce * dt;
            vx += dx / distance * force; vy += dy / distance * force;
          }
          const rx = x - cx, ry = y - cy, radial = Math.max(1, Math.hypot(rx, ry));
          if (state.wave > radial && !data[p + 10]) {
            vx += rx / radial * 180; vy += ry / radial * 180; data[p + 10] = 1;
          }
        }
        x += vx * dt; y += vy * dt;
        if (isTarget && progress > 0.85 && !finishTimeline) {
          const settle = 1 - Math.exp(-((progress - 0.85) / 0.15) * 32 * dt);
          x += (data[p + 4] - x) * settle; y += (data[p + 5] - y) * settle;
          if (progress >= 0.999) { x = data[p + 4]; y = data[p + 5]; }
        }
        if (!isTarget && !bursting) { x = (x + width) % width; y = (y + height) % height; }
        data[p] = x; data[p + 1] = y; data[p + 2] = vx; data[p + 3] = vy;
        ctx.fillStyle = palette[data[p + 9]];
        ctx.globalAlpha = data[p + 7] * state.opacity * (isTarget ? 1 : 0.22);
        const size = data[p + 6] * (1 + state.pulse * 0.25);
        ctx.fillRect(x, y, size, size);
      }
      if (state.wave > 0) {
        ctx.globalAlpha = Math.max(0, 0.5 * (1 - state.wave / Math.hypot(width, height)));
        ctx.strokeStyle = palette[0]; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, state.wave, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }
    let settled = 0, total = 0;
    function updateProgress() {
      if (disposed || finished) return;
      const target = total ? Math.min(100, settled / total * 100) : 0;
      const remainingMinimum = Math.max(0, (minimum - (performance.now() - start)) / 1000);
      progressTween?.kill();
      gsapContext.add(() => {
        progressTween = gsap.to(state, {
          progress: Math.max(state.progress, target),
          duration: Math.max(0.3, remainingMinimum), ease: c.progressEase,
          onUpdate: () => {
            if (disposed || finished || !counterRef.current) return;
            const value = Math.floor(state.progress);
            counterRef.current.textContent = String(value).padStart(3, '0');
            root.setAttribute('aria-valuenow', String(value));
            // Source silhouette overlay gives exact, crisp edges at completion.
            if (!simple && value >= 95) logoRef.current.style.opacity = String((value - 95) / 5);
          },
          onComplete: () => { if (settled >= total) finish(); },
        });
      });
    }
    const tasks = [];
    tasks.push(new Promise(resolve => {
      if (document.readyState === 'complete' || performance.getEntriesByType('navigation')[0]?.domContentLoadedEventStart > 0) resolve();
      else document.addEventListener('DOMContentLoaded', resolve, { once: true, signal });
    }));
    tasks.push(document.fonts?.ready || Promise.resolve());
    tasks.push(new Promise(resolve => {
      image.onload = () => {
        if (disposed || finished) return;
        imageReady = true;
        try { resize(); } catch { root.dataset.mode = 'fallback'; }
        resolve();
      };
      image.onerror = resolve; image.src = LOGO;
    }));
    document.querySelectorAll('img, video').forEach(media => {
      if (root.contains(media)) return;
      const rect = media.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= innerHeight || !rect.width || !rect.height || media.closest('.menu')) return;
      tasks.push(new Promise(resolve => {
        const video = media.tagName === 'VIDEO';
        if (video ? media.readyState >= 2 || media.error : media.complete) { resolve(); return; }
        media.addEventListener(video ? 'loadeddata' : 'load', resolve, { once: true, signal });
        media.addEventListener('error', resolve, { once: true, signal });
        if (video) media.querySelectorAll('source').forEach(source => source.addEventListener('error', resolve, { once: true, signal }));
      }));
    });
    total = tasks.length;
    tasks.forEach(task => task.catch(() => {}).then(() => {
      if (settled < total) { settled++; updateProgress(); }
    }));
    resize();
    window.addEventListener('resize', resize, { signal });
    window.addEventListener('orientationchange', resize, { signal });
    if (!simple && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.addEventListener('pointermove', event => { pointerX = event.clientX; pointerY = event.clientY; }, { passive: true, signal });
      window.addEventListener('pointerout', () => { pointerX = pointerY = -10000; }, { signal });
    }
    if (simple) logoRef.current.style.opacity = '1';
    else raf = requestAnimationFrame(draw);
    return () => {
      disposed = true; cancelAnimationFrame(raf); clearTimeout(deadline); clearTimeout(assetDeadline); abort.abort();
      image.onload = image.onerror = null; gsapContext.revert(); unlock();
    };
  }, []);

  return (
    <div ref={rootRef} className="particle-loader" role="progressbar" aria-label="Loading AI Club" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <canvas ref={canvasRef} aria-hidden="true" />
      <div ref={logoRef} className="particle-loader__logo" aria-hidden="true" />
      <div className="particle-loader__readout">
        <div className="particle-loader__count"><span ref={counterRef}>000</span><span className="particle-loader__percent">%</span></div>
        <div className="particle-loader__status">LOADING <span>AI CLUB</span></div>
      </div>
    </div>
  );
}
