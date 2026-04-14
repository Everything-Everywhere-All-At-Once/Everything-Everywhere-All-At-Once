"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#EC4899";

type Harmony = "analogous" | "complementary" | "triadic" | "tetradic" | "split-complementary" | "monochromatic";

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generatePalette(base: string, harmony: Harmony): { hex: string; label: string }[] {
  const [h, s, l] = hexToHsl(base);
  const mk = (hue: number, sat = s, lig = l) => hslToHex(((hue % 360) + 360) % 360, Math.min(100, sat), Math.min(95, Math.max(5, lig)));

  switch (harmony) {
    case "analogous":
      return [mk(h - 30), mk(h - 15), mk(h), mk(h + 15), mk(h + 30)].map((hex, i) => ({ hex, label: ["−30°", "−15°", "base", "+15°", "+30°"][i] }));
    case "complementary":
      return [mk(h), mk(h, s, l + 15), mk(h, s, l - 15), mk(h + 180), mk(h + 180, s, l + 15)].map((hex, i) => ({ hex, label: ["base", "light", "dark", "complement", "comp light"][i] }));
    case "triadic":
      return [mk(h), mk(h + 120), mk(h + 240), mk(h, s, l + 20), mk(h, s, l - 20)].map((hex, i) => ({ hex, label: ["base", "+120°", "+240°", "light", "dark"][i] }));
    case "tetradic":
      return [mk(h), mk(h + 90), mk(h + 180), mk(h + 270), mk(h, s, l - 15)].map((hex, i) => ({ hex, label: ["base", "+90°", "+180°", "+270°", "dark"][i] }));
    case "split-complementary":
      return [mk(h), mk(h + 150), mk(h + 210), mk(h, s, l + 20), mk(h, s, l - 20)].map((hex, i) => ({ hex, label: ["base", "+150°", "+210°", "light", "dark"][i] }));
    case "monochromatic":
      return [mk(h, s, 20), mk(h, s, 35), mk(h, s, l), mk(h, s, 70), mk(h, s, 85)].map((hex, i) => ({ hex, label: ["darkest", "dark", "base", "light", "lightest"][i] }));
  }
}

export default function ColorsPage() {
  const [base, setBase] = useState("#6366F1");
  const [harmony, setHarmony] = useState<Harmony>("analogous");
  const [copied, setCopied] = useState<string | null>(null);

  const palette = generatePalette(base, harmony);

  const copy = (val: string) => {
    navigator.clipboard.writeText(val).then(() => { setCopied(val); setTimeout(() => setCopied(null), 1500); });
  };

  return (
    <ToolShell category="Web Design" categoryHref="/tools/webdesign" accent={accent} title="Color Scheme Generator" description="Generate harmonious color palettes from any base color — analogous, complementary, triadic, and more.">
      <div className="space-y-5">
        {/* Base color */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">base color</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={base} onChange={e => setBase(e.target.value)} className="w-12 h-12 rounded cursor-pointer border-0" />
            <input type="text" value={base} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setBase(e.target.value); }}
              className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none uppercase" />
            <div className="text-xs font-mono text-[#3f3f46]">HSL({hexToHsl(base).join(", ")})</div>
          </div>
        </div>

        {/* Harmony */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">harmony</label>
          <div className="flex flex-wrap gap-2">
            {(["analogous", "complementary", "triadic", "tetradic", "split-complementary", "monochromatic"] as Harmony[]).map(h => (
              <button key={h} onClick={() => setHarmony(h)}
                className="px-3 py-1.5 text-xs font-mono rounded border transition-all capitalize"
                style={harmony === h ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Palette */}
        <div className="grid grid-cols-5 gap-2">
          {palette.map(({ hex, label }) => (
            <div key={hex} className="flex flex-col gap-2">
              <button onClick={() => copy(hex)} className="w-full rounded-lg border border-[#2a2a2a] transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: hex, height: "80px" }} title={hex} />
              <div className="text-center">
                <div className="text-xs font-mono text-[#e4e4e7]">{copied === hex ? "copied!" : hex.toUpperCase()}</div>
                <div className="text-[10px] font-mono text-[#3f3f46]">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CSS output */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">CSS variables</label>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 relative">
            <button onClick={() => copy(`:root {\n${palette.map(({ hex, label }) => `  --color-${label.replace(/[^a-z0-9]/gi, "-").toLowerCase()}: ${hex};`).join("\n")}\n}`)}
              className="absolute top-3 right-3 text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">copy</button>
            <pre className="text-xs font-mono text-[#e4e4e7] leading-relaxed">{`:root {\n${palette.map(({ hex, label }) => `  --color-${label.replace(/[^a-z0-9]/gi, "-").toLowerCase()}: ${hex};`).join("\n")}\n}`}</pre>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
