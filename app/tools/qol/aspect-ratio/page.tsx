"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

const PRESETS = [
  { label: "16:9",    w: 16,   h: 9,    note: "HD video, YouTube, monitors" },
  { label: "4:3",     w: 4,    h: 3,    note: "old TV, photography" },
  { label: "1:1",     w: 1,    h: 1,    note: "square, Instagram" },
  { label: "21:9",    w: 21,   h: 9,    note: "ultrawide" },
  { label: "9:16",    w: 9,    h: 16,   note: "portrait / TikTok / Reels" },
  { label: "3:2",     w: 3,    h: 2,    note: "35mm, DSLRs" },
  { label: "4:5",     w: 4,    h: 5,    note: "Instagram portrait" },
  { label: "1.85:1",  w: 1.85, h: 1,    note: "widescreen cinema" },
  { label: "2.39:1",  w: 2.39, h: 1,    note: "anamorphic cinema" },
];

export default function AspectRatioPage() {
  const [rw, setRw] = useState(16);
  const [rh, setRh] = useState(9);
  const [lockW, setLockW] = useState("");
  const [lockH, setLockH] = useState("");

  const calcH = lockW !== "" ? Math.round((+lockW / rw) * rh) : null;
  const calcW = lockH !== "" ? Math.round((+lockH / rh) * rw) : null;

  const simplify = (w: number, h: number) => {
    const d = gcd(Math.round(w * 100), Math.round(h * 100));
    return `${Math.round(w * 100) / d}:${Math.round(h * 100) / d}`;
  };

  const commonSizes = [320, 480, 640, 720, 1080, 1280, 1440, 1920, 2560, 3840].map(w => ({
    w, h: Math.round((w / rw) * rh),
  }));

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="Aspect Ratio Calculator" description="Calculate dimensions from any ratio — lock width or height and get the other side instantly.">
      <div className="space-y-6">
        {/* Ratio input */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">ratio</label>
          <div className="flex items-center gap-3">
            <input type="number" value={rw} min={0.1} step={0.01}
              onChange={e => setRw(+e.target.value)}
              className="w-24 bg-[#141414] border border-[#2a2a2a] rounded px-3 py-2.5 text-sm font-mono text-[#e4e4e7] text-center focus:outline-none focus:border-[#3f3f46] transition-colors" />
            <span className="text-[#52525b] font-mono text-lg">:</span>
            <input type="number" value={rh} min={0.1} step={0.01}
              onChange={e => setRh(+e.target.value)}
              className="w-24 bg-[#141414] border border-[#2a2a2a] rounded px-3 py-2.5 text-sm font-mono text-[#e4e4e7] text-center focus:outline-none focus:border-[#3f3f46] transition-colors" />
            <span className="text-xs font-mono text-[#52525b]">= {simplify(rw, rh)}</span>
          </div>
        </div>

        {/* Lock one dimension */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">lock width</label>
            <input type="number" value={lockW} onChange={e => { setLockW(e.target.value); setLockH(""); }}
              placeholder="e.g. 1920"
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-3 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none focus:border-[#3f3f46] transition-colors placeholder:text-[#3f3f46]" />
            {calcH !== null && <div className="text-xs font-mono mt-2" style={{ color: accent }}>height = {calcH}px</div>}
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">lock height</label>
            <input type="number" value={lockH} onChange={e => { setLockH(e.target.value); setLockW(""); }}
              placeholder="e.g. 1080"
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-3 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none focus:border-[#3f3f46] transition-colors placeholder:text-[#3f3f46]" />
            {calcW !== null && <div className="text-xs font-mono mt-2" style={{ color: accent }}>width = {calcW}px</div>}
          </div>
        </div>

        {/* Visual preview */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 flex items-center justify-center" style={{ height: 120 }}>
          <div className="border-2 flex items-center justify-center text-[10px] font-mono"
            style={{
              borderColor: accent,
              width: Math.min(240, (120 * rw) / rh),
              height: Math.min(120, (240 * rh) / rw),
              color: accent,
            }}>
            {rw}:{rh}
          </div>
        </div>

        {/* Presets */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b] mb-3">common ratios</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => { setRw(p.w); setRh(p.h); setLockW(""); setLockH(""); }}
                className="flex flex-col px-3 py-2 rounded border text-left transition-all"
                style={{ borderColor: rw === p.w && rh === p.h ? `${accent}60` : "#1e1e1e", backgroundColor: rw === p.w && rh === p.h ? `${accent}08` : "#111111" }}>
                <span className="text-xs font-mono font-bold" style={{ color: accent }}>{p.label}</span>
                <span className="text-[9px] font-mono text-[#52525b] mt-0.5">{p.note}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Common sizes table */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b] mb-3">sizes at {rw}:{rh}</div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
            {commonSizes.map(({ w, h }, i) => (
              <div key={w} className={`flex justify-between px-4 py-2 text-xs font-mono ${i !== commonSizes.length - 1 ? "border-b border-[#1e1e1e]" : ""}`}>
                <span className="text-[#52525b]">{w}px wide</span>
                <span className="text-[#e4e4e7]">{w} × {h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
