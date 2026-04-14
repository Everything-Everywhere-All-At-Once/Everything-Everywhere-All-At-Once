"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#FB923C";

const GRID_SIZES = [8, 16, 24, 32] as const;
const PALETTE = [
  "#000000", "#ffffff", "#EF4444", "#F97316", "#FACC15", "#22C55E",
  "#00E5FF", "#6366F1", "#A855F7", "#EC4899", "#94A3B8", "#78716C",
];

type Tool = "pencil" | "fill" | "eraser";

export default function PixelPage() {
  const [gridSize, setGridSize] = useState<typeof GRID_SIZES[number]>(16);
  const [pixels, setPixels] = useState<string[]>(() => Array(16 * 16).fill("transparent"));
  const [color, setColor] = useState("#000000");
  const [tool, setTool] = useState<Tool>("pencil");
  const [drawing, setDrawing] = useState(false);
  const [scale, setScale] = useState(20);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const changeGrid = (size: typeof GRID_SIZES[number]) => {
    setGridSize(size);
    setPixels(Array(size * size).fill("transparent"));
  };

  const fill = (grid: string[], idx: number, target: string, replacement: string): string[] => {
    if (target === replacement || grid[idx] !== target) return grid;
    const result = [...grid];
    const stack = [idx];
    const cols = gridSize;
    while (stack.length) {
      const i = stack.pop()!;
      if (result[i] !== target) continue;
      result[i] = replacement;
      if (i % cols > 0) stack.push(i - 1);
      if (i % cols < cols - 1) stack.push(i + 1);
      if (i >= cols) stack.push(i - cols);
      if (i < result.length - cols) stack.push(i + cols);
    }
    return result;
  };

  const paint = useCallback((idx: number) => {
    setPixels(prev => {
      if (tool === "fill") return fill(prev, idx, prev[idx], color);
      if (tool === "eraser") { const n = [...prev]; n[idx] = "transparent"; return n; }
      const n = [...prev]; n[idx] = color; return n;
    });
  }, [tool, color, gridSize]);

  const exportPng = () => {
    const canvas = canvasRef.current!;
    canvas.width = gridSize;
    canvas.height = gridSize;
    const ctx = canvas.getContext("2d")!;
    pixels.forEach((c, i) => {
      const x = i % gridSize, y = Math.floor(i / gridSize);
      ctx.fillStyle = c === "transparent" ? "rgba(0,0,0,0)" : c;
      ctx.fillRect(x, y, 1, 1);
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `pixel-art-${gridSize}x${gridSize}.png`;
    a.click();
  };

  const exportScaled = (upscale: number) => {
    const canvas = canvasRef.current!;
    canvas.width = gridSize * upscale;
    canvas.height = gridSize * upscale;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    pixels.forEach((c, i) => {
      const x = (i % gridSize) * upscale, y = Math.floor(i / gridSize) * upscale;
      ctx.fillStyle = c === "transparent" ? "rgba(0,0,0,0)" : c;
      ctx.fillRect(x, y, upscale, upscale);
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `pixel-art-${gridSize * upscale}x${gridSize * upscale}.png`;
    a.click();
  };

  return (
    <ToolShell category="Creative & Art" categoryHref="/tools/creative" accent={accent} title="Pixel Art Maker" description="Draw pixel art in the browser — multiple grid sizes, fill tool, export PNG at any scale.">
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {(["pencil", "fill", "eraser"] as Tool[]).map(t => (
              <button key={t} onClick={() => setTool(t)}
                className="px-3 py-1.5 text-xs font-mono rounded border transition-all capitalize"
                style={tool === t ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {t === "pencil" ? "✏ draw" : t === "fill" ? "⬛ fill" : "◻ erase"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {GRID_SIZES.map(s => (
              <button key={s} onClick={() => changeGrid(s)}
                className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                style={gridSize === s ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {s}×{s}
              </button>
            ))}
          </div>
          <button onClick={() => setPixels(Array(gridSize * gridSize).fill("transparent"))}
            className="px-3 py-1.5 text-xs font-mono rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#EF4444]">
            clear
          </button>
        </div>

        {/* Color palette */}
        <div className="flex flex-wrap gap-2 items-center">
          {PALETTE.map(c => (
            <button key={c} onClick={() => { setColor(c); setTool("pencil"); }}
              className="w-7 h-7 rounded border-2 transition-all"
              style={{ backgroundColor: c, borderColor: color === c ? accent : "transparent" }} />
          ))}
          <input type="color" value={color} onChange={e => { setColor(e.target.value); setTool("pencil"); }}
            className="w-7 h-7 rounded cursor-pointer border-0" title="custom color" />
          <span className="text-xs font-mono text-[#71717a]">{color}</span>
        </div>

        {/* Canvas */}
        <div className="overflow-auto">
          <div
            className="inline-grid border border-[#2a2a2a] rounded cursor-crosshair select-none"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridSize}, ${scale}px)`,
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='10' height='10' fill='%23ccc'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23ccc'/%3E%3Crect x='10' y='0' width='10' height='10' fill='%23eee'/%3E%3Crect x='0' y='10' width='10' height='10' fill='%23eee'/%3E%3C/svg%3E\")",
            }}
            onMouseLeave={() => setDrawing(false)}
          >
            {pixels.map((c, i) => (
              <div key={i}
                style={{ width: scale, height: scale, backgroundColor: c === "transparent" ? undefined : c }}
                onMouseDown={() => { setDrawing(true); paint(i); }}
                onMouseEnter={() => { if (drawing) paint(i); }}
                onMouseUp={() => setDrawing(false)}
              />
            ))}
          </div>
        </div>

        {/* Scale slider */}
        <div>
          <label className="block text-[10px] font-mono text-[#71717a] uppercase tracking-widest mb-1">canvas zoom — {scale}px/cell</label>
          <input type="range" min={8} max={40} value={scale} onChange={e => setScale(Number(e.target.value))}
            className="w-full cursor-pointer" style={{ accentColor: accent }} />
        </div>

        {/* Export */}
        <div className="flex gap-2">
          {[1, 2, 4, 8].map(s => (
            <button key={s} onClick={() => exportScaled(s)}
              className="flex-1 py-2 text-xs font-mono rounded border transition-all"
              style={{ borderColor: accent, color: accent, backgroundColor: `${accent}15` }}>
              export {s === 1 ? `${gridSize}px` : `${gridSize * s}px`}
            </button>
          ))}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </ToolShell>
  );
}
