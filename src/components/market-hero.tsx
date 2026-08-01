import { useEffect, useRef } from "react";

type Candle = { open: number; close: number; high: number; low: number; volume: number };

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
    const candleWidth = 18;
    const gap = 10;
    const slot = candleWidth + gap;

    let candles: Candle[] = [];
    let price = 94;
    let offset = 0;
    let last = performance.now();
    let raf = 0;

    // Swing-leg generator: price travels in sustained impulse legs with
    // shallow pullbacks, producing visible higher-highs / lower-lows waves
    // and candles of widely varying body size (like a real chart).
    let legDirection: 1 | -1 = 1;
    let legRemaining = 0;
    let legStrength = 1;

    const startLeg = (forced?: 1 | -1) => {
      // Impulse legs run longer than pullbacks.
      const impulse = forced ?? (Math.random() > 0.34 ? legDirection : (-legDirection as 1 | -1));
      legDirection = impulse;
      legRemaining = 4 + Math.floor(Math.random() * 9);
      legStrength = 1.6 + Math.random() * 2.6;
    };

    startLeg(1);

    const makeCandle = (): Candle => {
      if (legRemaining <= 0) startLeg();
      legRemaining -= 1;

      const momentum = legDirection * legStrength * (0.45 + Math.random() * 1.15);
      const noise = (Math.random() - 0.5) * 1.6;
      const open = price;
      let close = open + momentum + noise;

      // Keep the wave inside the frame by flipping the leg at the extremes.
      if (close > 156) {
        startLeg(-1);
        close = open - Math.abs(momentum);
      } else if (close < 44) {
        startLeg(1);
        close = open + Math.abs(momentum);
      }
      close = Math.max(42, Math.min(158, close));

      const range = Math.abs(close - open);
      const high = Math.max(open, close) + Math.random() * (1.5 + range * 0.6) + 0.6;
      const low = Math.min(open, close) - Math.random() * (1.5 + range * 0.6) - 0.6;
      const volume = 18 + range * 9 + Math.random() * 22;
      price = close;
      return { open, close, high, low, volume };
    };


    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.ceil(width / slot) + 4;
      while (candles.length < count) candles.push(makeCandle());
      candles = candles.slice(-count);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Auto-scale to the visible window so bodies stay large and legible
    // instead of collapsing into flat ticks.
    let viewLow = 60;
    let viewHigh = 130;

    const updateScale = () => {
      let lo = Infinity;
      let hi = -Infinity;
      for (const c of candles) {
        if (c.low < lo) lo = c.low;
        if (c.high > hi) hi = c.high;
      }
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) return;
      const span = Math.max(hi - lo, 12);
      const targetLow = lo - span * 0.08;
      const targetHigh = hi + span * 0.08;
      viewLow += (targetLow - viewLow) * 0.08;
      viewHigh += (targetHigh - viewHigh) * 0.08;
    };

    const yFor = (v: number) => {
      const pad = height * 0.14;
      const range = Math.max(viewHigh - viewLow, 1);
      return height - pad - ((v - viewLow) / range) * (height - pad * 2);
    };


    const draw = (now: number) => {
      const dt = Math.min(now - last, 60);
      last = now;
      ctx.clearRect(0, 0, width, height);

      const base = ctx.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, "rgba(248,250,252,0.95)");
      base.addColorStop(1, "rgba(240,249,255,0.96)");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(77, 163, 255, 0.12)";
      ctx.lineWidth = 1;
      const step = 40;
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

      if (!reduced) offset += dt * 0.045;
      if (offset >= slot) {
        offset -= slot;
        candles.push(makeCandle());
        candles.shift();
      }

      const lineY = height * 0.72;
      ctx.beginPath();
      candles.forEach((c, i) => {
        const x = i * slot - offset + candleWidth / 2;
        const y = yFor(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "rgba(59, 130, 246, 0.65)";
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 16;
      ctx.shadowColor = "rgba(59, 130, 246, 0.45)";
      ctx.stroke();
      ctx.shadowBlur = 0;

      candles.forEach((c, i) => {
        const x = i * slot - offset;
        const up = c.close >= c.open;
        const wick = up ? "rgba(34, 197, 94, 0.45)" : "rgba(248, 113, 113, 0.5)";
        const body = up ? "rgba(74, 222, 128, 0.88)" : "rgba(248, 113, 113, 0.82)";
        ctx.strokeStyle = wick;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, yFor(c.high));
        ctx.lineTo(x + candleWidth / 2, yFor(c.low));
        ctx.stroke();

        const top = yFor(Math.max(c.open, c.close));
        const bottom = yFor(Math.min(c.open, c.close));
        const bodyH = Math.max(3, bottom - top);
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.roundRect(x, top, candleWidth, bodyH, 3);
        ctx.fill();

        const barHeight = Math.max(4, (c.volume / 60) * 24);
        ctx.fillStyle = up ? "rgba(59,130,246,0.35)" : "rgba(14,165,233,0.3)";
        ctx.fillRect(x + candleWidth / 2 - 3, lineY + 8, 6, barHeight);
      });

      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(width, lineY);
      ctx.strokeStyle = "rgba(59,130,246,0.16)";
      ctx.stroke();

      ctx.fillStyle = "rgba(59,130,246,0.08)";
      ctx.beginPath();
      ctx.moveTo(0, height);
      candles.forEach((c, i) => {
        const x = i * slot - offset + candleWidth / 2;
        const y = yFor(c.close);
        ctx.lineTo(x, y);
      });
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`h-full w-full ${className}`} />;
}
