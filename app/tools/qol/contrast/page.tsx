"use client";

import { useState, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  if (full.length !== 6) return null;
  const n = parseInt(full, 16);
  if (isNaN(n)) return null;
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function luminance([r, g, b]: [number, number, number]): number {
  const srgb = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(fg: string, bg: string): number | null {
  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);
  if (!fgRgb || !bgRgb) return null;
  const L1 = luminance(fgRgb);
  const L2 = luminance(bgRgb);
  const lighter = Math.max(L1, L2);
  const darker  = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

type Level = { label: string; min: number; what: string };
const LEVELS: Level[] = [
  { label: "AA Large", min: 3.0,  what: "large text (18pt+ or 14pt bold)" },
  { label: "AA",       min: 4.5,  what: "normal text" },
  { label: "AAA Large",min: 4.5,  what: "enhanced large text" },
  { label: "AAA",      min: 7.0,  what: "enhanced normal text" },
];

export default function ContrastPage() {
  const [fg, setFg] = useState("#ffffff");
  const [bg, setBg] = useState("#0d0d0d");

  const ratio = contrastRatio(fg, bg);
  const ratioStr = ratio ? ratio.toFixed(2) + ":1" : "—";

  const swatch = useCallback((color: string) => ({
    width: 32, height: 32, borderRadius: 4,
    backgroundColor: color,
    border: "1px solid #2a2a2a",
    cursor: "pointer",
    flexShrink: 0 as const,
  }), []);

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="Color Contrast Checker" description="Check WCAG AA and AAA accessibility contrast ratios between any two colors.">
      <div className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4">
          {([["Foreground", fg, setFg], ["Background", bg, setBg]] as [string, string, (v: string) => void][]).map(([label, val, set]) => (
            <div key={label}>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">{label}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={val} onChange={e => set(e.target.value)} style={swatch(val)} />
                <input value={val} onChange={e => set(e.target.value)}
                  className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded px-3 py-2 text-sm font-mono text-[#e4e4e7] focus:outline-none focus:border-[#3f3f46] transition-colors uppercase"
                  maxLength={7} placeholder="#ffffff" />
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="rounded-lg p-8 flex flex-col gap-3 border border-[#2a2a2a]" style={{ backgroundColor: bg }}>
          <div style={{ color: fg, fontSize: "1.5rem", fontWeight: 700, fontFamily: "monospace" }}>Large text sample</div>
          <div style={{ color: fg, fontSize: "1rem", fontFamily: "monospace" }}>Normal body text sample — the quick brown fox jumps over the lazy dog.</div>
          <div style={{ color: fg, fontSize: "0.75rem", fontFamily: "monospace" }}>Small caption text — harder to read at low contrast ratios.</div>
        </div>

        {/* Ratio */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-5 text-center">
          <div className="text-4xl font-black font-mono mb-1" style={{ color: ratio && ratio >= 4.5 ? accent : ratio && ratio >= 3 ? "#FACC15" : "#EF4444" }}>{ratioStr}</div>
          <div className="text-[10px] font-mono text-[#52525b] uppercase tracking-widest">contrast ratio</div>
        </div>

        {/* WCAG levels */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b] mb-3">WCAG 2.1 compliance</div>
          {LEVELS.map(({ label, min, what }) => {
            const pass = ratio !== null && ratio >= min;
            return (
              <div key={label} className="flex items-center justify-between px-4 py-3 rounded border border-[#1e1e1e] bg-[#111111]">
                <div>
                  <div className="text-xs font-mono font-bold text-[#e4e4e7]">{label}</div>
                  <div className="text-[10px] font-mono text-[#52525b] mt-0.5">{what} · min {min}:1</div>
                </div>
                <div className="text-xs font-mono font-bold px-2 py-1 rounded" style={{
                  color: pass ? accent : "#EF4444",
                  backgroundColor: pass ? `${accent}15` : "#EF444415",
                }}>
                  {pass ? "pass" : "fail"}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[10px] font-mono text-[#3f3f46] text-center">WCAG 2.1 · all calculations client-side</div>
      </div>
    </ToolShell>
  );
}
