"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#FB923C";

type PatternType = "dots" | "grid" | "lines" | "diagonal" | "crosshatch" | "hexagons" | "triangles" | "waves";

function generateSvgPattern(type: PatternType, color: string, bg: string, size: number, opacity: number): string {
  const op = opacity / 100;
  const col = color + Math.round(op * 255).toString(16).padStart(2, "0");
  switch (type) {
    case "dots":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bg}"/><circle cx="${size/2}" cy="${size/2}" r="${size/8}" fill="${col}"/></svg>`;
    case "grid":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bg}"/><path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${col}" stroke-width="0.5"/></svg>`;
    case "lines":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bg}"/><line x1="0" y1="${size/2}" x2="${size}" y2="${size/2}" stroke="${col}" stroke-width="1"/></svg>`;
    case "diagonal":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bg}"/><line x1="0" y1="${size}" x2="${size}" y2="0" stroke="${col}" stroke-width="1"/></svg>`;
    case "crosshatch":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bg}"/><line x1="0" y1="0" x2="${size}" y2="${size}" stroke="${col}" stroke-width="0.5"/><line x1="${size}" y1="0" x2="0" y2="${size}" stroke="${col}" stroke-width="0.5"/></svg>`;
    case "hexagons": {
      const w = size, h = size * 0.866;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bg}"/><polygon points="${w/2},2 ${w-2},${h/4} ${w-2},${h*3/4} ${w/2},${h-2} 2,${h*3/4} 2,${h/4}" fill="none" stroke="${col}" stroke-width="0.8"/></svg>`;
    }
    case "triangles":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bg}"/><polygon points="${size/2},2 ${size-2},${size-2} 2,${size-2}" fill="none" stroke="${col}" stroke-width="0.8"/></svg>`;
    case "waves":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size*2}" height="${size}"><rect width="${size*2}" height="${size}" fill="${bg}"/><path d="M 0 ${size/2} Q ${size/2} 0 ${size} ${size/2} Q ${size*1.5} ${size} ${size*2} ${size/2}" fill="none" stroke="${col}" stroke-width="1"/></svg>`;
  }
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default function PatternPage() {
  const [type, setType] = useState<PatternType>("dots");
  const [color, setColor] = useState("#FB923C");
  const [bg, setBg] = useState("#0d0d0d");
  const [size, setSize] = useState(20);
  const [opacity, setOpacity] = useState(80);
  const [copied, setCopied] = useState(false);

  const svg = generateSvgPattern(type, color, bg, size, opacity);
  const dataUrl = svgToDataUrl(svg);
  const cssValue = `url("${dataUrl}")`;
  const cssRule = `background-color: ${bg};\nbackground-image: ${cssValue};`;

  const copy = () => {
    navigator.clipboard.writeText(cssRule).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const download = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pattern-${type}.svg`;
    a.click();
  };

  const PATTERNS: PatternType[] = ["dots", "grid", "lines", "diagonal", "crosshatch", "hexagons", "triangles", "waves"];

  return (
    <ToolShell category="Creative & Art" categoryHref="/tools/creative" accent={accent} title="Pattern Generator" description="Generate tileable CSS & SVG background patterns — customize colors, size, opacity.">
      <div className="space-y-5">
        {/* Pattern types */}
        <div className="flex flex-wrap gap-2">
          {PATTERNS.map(p => (
            <button key={p} onClick={() => setType(p)}
              className="px-3 py-1.5 text-xs font-mono rounded border transition-all capitalize"
              style={type === p ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
              {p}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="w-full h-48 rounded-lg border border-[#2a2a2a]"
          style={{ backgroundColor: bg, backgroundImage: `url("${dataUrl}")` }} />

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-mono text-[#71717a] shrink-0">pattern color</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <code className="text-xs font-mono text-[#71717a]">{color}</code>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-mono text-[#71717a] shrink-0">background</label>
            <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <code className="text-xs font-mono text-[#71717a]">{bg}</code>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">tile size — {size}px</label>
          </div>
          <input type="range" min={8} max={80} value={size} onChange={e => setSize(Number(e.target.value))}
            className="w-full cursor-pointer" style={{ accentColor: accent }} />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">opacity — {opacity}%</label>
          </div>
          <input type="range" min={10} max={100} value={opacity} onChange={e => setOpacity(Number(e.target.value))}
            className="w-full cursor-pointer" style={{ accentColor: accent }} />
        </div>

        {/* CSS output */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 relative">
          <div className="flex gap-2 absolute top-3 right-3">
            <button onClick={download} className="text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">svg</button>
            <button onClick={copy} className="text-[10px] font-mono px-3 py-1 rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>
              {copied ? "copied ✓" : "copy css"}
            </button>
          </div>
          <div className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest mb-2">CSS</div>
          <pre className="text-xs font-mono text-[#e4e4e7] leading-relaxed pr-24 whitespace-pre-wrap break-all">{cssRule}</pre>
        </div>
      </div>
    </ToolShell>
  );
}
