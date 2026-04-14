"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const PALETTE = [
  { r: 255, g: 45,  b: 135 }, // hot pink
  { r: 0,   g: 229, b: 255 }, // electric cyan
  { r: 255, g: 214, b: 10  }, // acid gold
  { r: 192, g: 85,  b: 255 }, // vivid purple
  { r: 255, g: 107, b: 53  }, // orange
  { r: 6,   g: 214, b: 160 }, // teal
  { r: 255, g: 255, b: 80  }, // yellow-green
  { r: 255, g: 60,  b: 60  }, // red
];

type Blob = {
  dx: number;
  dy: number;
  scale: number;
  alphaMult: number;
};

type Burst = {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  born: number;
  life: number;
  maxRadius: number;
  blobs: Blob[];
};

function createBurst(width: number, height: number, now: number): Burst {
  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  const blobCount = 4 + Math.floor(Math.random() * 4);
  const blobs: Blob[] = Array.from({ length: blobCount }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist  = 0.2 + Math.random() * 0.65;
    return {
      dx:        Math.cos(angle) * dist,
      dy:        Math.sin(angle) * dist,
      scale:     0.55 + Math.random() * 0.7,
      alphaMult: 0.5 + Math.random() * 0.5,
    };
  });
  return {
    x: width  * (0.05 + Math.random() * 0.9),
    y: height * (0.05 + Math.random() * 0.9),
    ...color,
    born: now,
    life: 3800 + Math.random() * 2400,   // slower in global mode
    maxRadius: 260 + Math.random() * 380,
    blobs,
  };
}

function drawBurst(
  ctx: CanvasRenderingContext2D,
  burst: Burst,
  now: number,
  maxAlpha: number,
) {
  const age = now - burst.born;
  const t   = age / burst.life;
  if (t >= 1) return;

  const { x, y, r, g, b, maxRadius, blobs } = burst;

  const expand = Math.pow(t, 0.35);
  const radius = maxRadius * expand;

  const alpha =
    t < 0.2  ? (t / 0.2) * maxAlpha :
    t < 0.6  ? maxAlpha :
    (1 - t) / 0.4 * maxAlpha;

  // Central core
  const coreR = radius * 0.35;
  if (coreR > 1) {
    const cg = ctx.createRadialGradient(x, y, 0, x, y, coreR);
    cg.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
    cg.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.5})`);
    cg.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(x, y, coreR, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();
  }

  // Drifting sub-blobs
  for (const blob of blobs) {
    const bx = x + blob.dx * radius * 0.75;
    const by = y + blob.dy * radius * 0.75;
    const br = radius * blob.scale * 0.7;
    if (br < 1) continue;

    const a  = alpha * blob.alphaMult;
    const bg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    bg.addColorStop(0,    `rgba(${r},${g},${b},${a})`);
    bg.addColorStop(0.45, `rgba(${r},${g},${b},${a * 0.55})`);
    bg.addColorStop(1,    `rgba(${r},${g},${b},0)`);

    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();
  }

  // Birth flash
  if (t < 0.18) {
    const ft = t / 0.18;
    const fa = (1 - ft) * maxAlpha * 1.4;
    const fr = maxRadius * 0.1 * ft;
    if (fr > 1) {
      const fg = ctx.createRadialGradient(x, y, 0, x, y, fr);
      fg.addColorStop(0,   `rgba(255,255,255,${fa})`);
      fg.addColorStop(0.5, `rgba(${r},${g},${b},${fa * 0.4})`);
      fg.addColorStop(1,   `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(x, y, fr, 0, Math.PI * 2);
      ctx.fillStyle = fg;
      ctx.fill();
    }
  }
}

interface HeroBackgroundProps {
  /** When true: fixed, full-page, subtle ambient mode */
  global?: boolean;
}

export function HeroBackground({ global: isGlobal = false }: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // Homepage: visible and punchy. Inner pages: barely perceptible color wash.
    const maxBursts  = isGlobal ? (isHomepage ? 5 : 2)    : 7;
    const spawnEvery = isGlobal ? (isHomepage ? 1400 : 6000) : 650;
    const maxAlpha   = isGlobal ? (isHomepage ? 0.32 : 0.04) : 0.65;

    let bursts: Burst[] = [];
    let raf: number;
    let lastSpawn = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Pre-seed staggered bursts
    const t0    = performance.now();
    const seeds = isGlobal ? 5 : 5;
    for (let i = 0; i < seeds; i++) {
      const bst = createBurst(canvas.width, canvas.height, t0);
      bst.born  = t0 - bst.life * (i / seeds) * 0.6;
      bursts.push(bst);
    }

    const loop = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "screen";

      if (bursts.length < maxBursts && now - lastSpawn > spawnEvery) {
        bursts.push(createBurst(canvas.width, canvas.height, now));
        lastSpawn = now;
      }

      bursts = bursts.filter(b => now - b.born < b.life);
      bursts.forEach(b => drawBurst(ctx, b, now, maxAlpha));

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [isGlobal, pathname]);

  if (isGlobal) {
    return (
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0, opacity: 1 }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
}
