import { useEffect, useRef } from "react";

type Candle = { open: number; close: number; high: number; low: number };

/**
 * Decorative animated market visual. Branding only — no live data, no controls.
 */
export function MarketHeroCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    const candleWidth = 14;
    const gap = 8;
    const slot = candleWidth + gap;

    let candles: Candle[] = [];
    let price = 100;
    let particles: { x: number; y: number; r: number; vy: number; a: number }[] = [];

    const makeCandle = (): Candle => {
      const open = price;
      const drift = 0.35;
      const close = Math.max(35, Math.min(165, open + (Math.random() - 0.5) * 9 + drift));
      const high = Math.max(open, close) + Math.random() * 4;
      const low = Math.min(open, close) - Math.random() * 4;
      price = close;
      return { open, close, high, low };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.ceil(width / slot) + 2;
      while (candles.length < count) candles.push(makeCandle());
      candles = candles.slice(-count);

      particles = Array.from({ length: Math.round(width / 40) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1 + Math.random() * 2,
        vy: 0.08 + Math.random() * 0.25,
        a: 0.15 + Math.random() * 0.35,
      }));
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let offset = 0;
    let last = performance.now();
    let raf = 0;

    const yFor = (v: number) => {
      const min = 25;
      const max = 175;
      const pad = height * 0.12;
      return height - pad - ((v - min) / (max - min)) * (height - pad * 2);
    };

    const draw = (now: number) => {
      const dt = Math.min(now - last, 60);
      last = now;

      ctx.clearRect(0, 0, width, height);

      // grid
      ctx.strokeStyle = "rgba(77, 163, 255, 0.10)";
      ctx.lineWidth = 1;
      const step = 44;
      for (let x = -((offset % step) | 0); x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // particles
      for (const p of particles) {
        p.y -= p.vy * (dt / 16);
        if (p.y < -4) {
          p.y = height + 4;
          p.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(124, 200, 255, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) offset += dt * 0.045;
      if (offset >= slot) {
        offset -= slot;
        candles.push(makeCandle());
        candles.shift();
      }

      // closing-price glow line
      ctx.beginPath();
      candles.forEach((c, i) => {
        const x = i * slot - offset + candleWidth / 2;
        const y = yFor(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "rgba(77, 163, 255, 0.55)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(77, 163, 255, 0.7)";
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // candles
      candles.forEach((c, i) => {
        const x = i * slot - offset;
        const up = c.close >= c.open;
        const body = up ? "rgba(34, 197, 94, 0.85)" : "rgba(239, 68, 68, 0.8)";
        const wick = up ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.45)";

        ctx.strokeStyle = wick;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, yFor(c.high));
        ctx.lineTo(x + candleWidth / 2, yFor(c.low));
        ctx.stroke();

        const top = yFor(Math.max(c.open, c.close));
        const bottom = yFor(Math.min(c.open, c.close));
        ctx.fillStyle = body;
        const h = Math.max(2, bottom - top);
        const r = 3;
        ctx.beginPath();
        ctx.roundRect(x, top, candleWidth, h, r);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`h-full w-full ${className}`}
    />
  );
}
