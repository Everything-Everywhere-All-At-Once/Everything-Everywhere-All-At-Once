"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#EC4899";

type Shadow = {
  id: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
};

function shadowToCSS(s: Shadow): string {
  const hex = s.color;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const color = `rgba(${r}, ${g}, ${b}, ${(s.opacity / 100).toFixed(2)})`;
  return `${s.inset ? "inset " : ""}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${color}`;
}

export default function ShadowPage() {
  const [shadows, setShadows] = useState<Shadow[]>([
    { id: "a", x: 0, y: 4, blur: 16, spread: 0, color: "#000000", opacity: 25, inset: false },
  ]);
  const [active, setActive] = useState("a");
  const [bgColor, setBgColor] = useState("#141414");
  const [boxColor, setBoxColor] = useState("#1e1e2e");
  const [copied, setCopied] = useState(false);

  const css = shadows.map(shadowToCSS).join(",\n  ");
  const cssRule = `box-shadow: ${shadows.map(shadowToCSS).join(",\n            ")};`;

  const shadow = shadows.find(s => s.id === active)!;
  const update = (key: keyof Shadow, val: number | boolean | string) =>
    setShadows(ss => ss.map(s => s.id === active ? { ...s, [key]: val } : s));

  const addShadow = () => {
    const id = Math.random().toString(36).slice(2);
    setShadows(ss => [...ss, { id, x: 4, y: 8, blur: 24, spread: 0, color: "#000000", opacity: 20, inset: false }]);
    setActive(id);
  };

  const removeShadow = (id: string) => {
    setShadows(ss => ss.filter(s => s.id !== id));
    setActive(shadows.find(s => s.id !== id)?.id ?? "");
  };

  const copy = () => {
    navigator.clipboard.writeText(cssRule).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const Slider = ({ label, field, min, max }: { label: string; field: keyof Shadow; min: number; max: number }) => (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">{label}</label>
        <span className="text-[10px] font-mono text-[#e4e4e7]">{shadow[field] as number}px</span>
      </div>
      <input type="range" min={min} max={max} value={shadow[field] as number}
        onChange={e => update(field, Number(e.target.value))}
        className="w-full cursor-pointer" style={{ accentColor: accent }} />
    </div>
  );

  return (
    <ToolShell category="Web Design" categoryHref="/tools/webdesign" accent={accent} title="Box Shadow Generator" description="Build CSS box shadows visually — multiple layers, inset, opacity, full control.">
      <div className="space-y-5">
        {/* Preview */}
        <div className="w-full h-48 rounded-lg flex items-center justify-center" style={{ backgroundColor: bgColor }}>
          <div className="w-32 h-32 rounded-lg" style={{ backgroundColor: boxColor, boxShadow: css }} />
        </div>

        {/* Background colors */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono text-[#71717a]">bg</label>
            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono text-[#71717a]">box</label>
            <input type="color" value={boxColor} onChange={e => setBoxColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" />
          </div>
        </div>

        {/* Shadow layers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] tracking-widest text-[#71717a] uppercase font-mono">layers</label>
            <button onClick={addShadow} className="text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">+ add layer</button>
          </div>
          <div className="flex gap-2">
            {shadows.map((s, i) => (
              <div key={s.id} className="relative group">
                <button onClick={() => setActive(s.id)}
                  className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                  style={active === s.id ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  layer {i + 1}
                </button>
                {shadows.length > 1 && (
                  <button onClick={() => removeShadow(s.id)} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] hidden group-hover:flex items-center justify-center">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        {shadow && (
          <div className="space-y-4">
            <Slider label="X offset" field="x" min={-50} max={50} />
            <Slider label="Y offset" field="y" min={-50} max={50} />
            <Slider label="blur radius" field="blur" min={0} max={100} />
            <Slider label="spread radius" field="spread" min={-50} max={50} />
            <div>
              <label className="block text-[10px] font-mono text-[#71717a] uppercase tracking-widest mb-1">opacity — {shadow.opacity}%</label>
              <input type="range" min={0} max={100} value={shadow.opacity} onChange={e => update("opacity", Number(e.target.value))}
                className="w-full cursor-pointer" style={{ accentColor: accent }} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-mono text-[#71717a]">color</label>
                <input type="color" value={shadow.color} onChange={e => update("color", e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={shadow.inset} onChange={e => update("inset", e.target.checked)} className="accent-pink-500" />
                <span className="text-xs font-mono text-[#71717a]">inset</span>
              </label>
            </div>
          </div>
        )}

        {/* CSS */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 relative">
          <button onClick={copy} className="absolute top-3 right-3 text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">
            {copied ? "copied ✓" : "copy"}
          </button>
          <pre className="text-xs font-mono text-[#e4e4e7] leading-relaxed whitespace-pre-wrap break-all pr-16">{cssRule}</pre>
        </div>
      </div>
    </ToolShell>
  );
}
