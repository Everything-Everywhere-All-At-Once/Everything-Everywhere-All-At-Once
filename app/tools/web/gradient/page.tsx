"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#EC4899";

type GradientType = "linear" | "radial" | "conic";

type Stop = { id: string; color: string; position: number };

export default function GradientPage() {
  const [type, setType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<Stop[]>([
    { id: "a", color: "#6366F1", position: 0 },
    { id: "b", color: "#EC4899", position: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  const stopsStr = stops.map(s => `${s.color} ${s.position}%`).join(", ");

  const css = type === "linear"
    ? `linear-gradient(${angle}deg, ${stopsStr})`
    : type === "radial"
    ? `radial-gradient(circle, ${stopsStr})`
    : `conic-gradient(from ${angle}deg, ${stopsStr})`;

  const cssRule = `background: ${css};`;

  const addStop = () => {
    const mid = stops.length >= 2 ? Math.round((stops[stops.length - 2].position + stops[stops.length - 1].position) / 2) : 50;
    setStops(s => [...s, { id: Math.random().toString(36).slice(2), color: "#FACC15", position: mid }]);
  };

  const updateStop = (id: string, key: keyof Stop, val: string | number) =>
    setStops(s => s.map(stop => stop.id === id ? { ...stop, [key]: val } : stop));

  const removeStop = (id: string) => setStops(s => s.filter(stop => stop.id !== id));

  const copy = () => {
    navigator.clipboard.writeText(cssRule).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  return (
    <ToolShell category="Web Design" categoryHref="/tools/webdesign" accent={accent} title="Gradient Generator" description="Build CSS gradients visually — linear, radial, conic, unlimited color stops.">
      <div className="space-y-5">
        {/* Preview */}
        <div className="w-full h-40 rounded-lg border border-[#2a2a2a]" style={{ background: css }} />

        {/* Type + angle */}
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">type</label>
            <div className="flex gap-2">
              {(["linear", "radial", "conic"] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className="px-3 py-1.5 text-xs font-mono rounded border transition-all capitalize"
                  style={type === t ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {(type === "linear" || type === "conic") && (
            <div className="flex-1">
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">angle — {angle}°</label>
              <input type="range" min={0} max={360} value={angle} onChange={e => setAngle(Number(e.target.value))}
                className="w-full cursor-pointer" style={{ accentColor: accent }} />
            </div>
          )}
        </div>

        {/* Color stops */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] tracking-widest text-[#71717a] uppercase font-mono">color stops</label>
            <button onClick={addStop} className="text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">+ add stop</button>
          </div>
          <div className="space-y-2">
            {stops.map(stop => (
              <div key={stop.id} className="flex items-center gap-3">
                <input type="color" value={stop.color} onChange={e => updateStop(stop.id, "color", e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 shrink-0" />
                <code className="text-xs font-mono text-[#71717a] w-20 shrink-0">{stop.color}</code>
                <input type="range" min={0} max={100} value={stop.position} onChange={e => updateStop(stop.id, "position", Number(e.target.value))}
                  className="flex-1 cursor-pointer" style={{ accentColor: stop.color }} />
                <span className="text-xs font-mono text-[#71717a] w-10 text-right shrink-0">{stop.position}%</span>
                {stops.length > 2 && (
                  <button onClick={() => removeStop(stop.id)} className="text-xs text-[#71717a] hover:text-[#EF4444] shrink-0">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CSS output */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 relative">
          <button onClick={copy} className="absolute top-3 right-3 text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">
            {copied ? "copied ✓" : "copy"}
          </button>
          <pre className="text-xs font-mono text-[#e4e4e7] leading-relaxed whitespace-pre-wrap break-all pr-16">{cssRule}</pre>
        </div>

        {/* Angle presets for linear */}
        {type === "linear" && (
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">quick angles</label>
            <div className="flex flex-wrap gap-2">
              {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
                <button key={a} onClick={() => setAngle(a)}
                  className="px-3 py-1.5 text-[10px] font-mono rounded border transition-all"
                  style={angle === a ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {a}°
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
