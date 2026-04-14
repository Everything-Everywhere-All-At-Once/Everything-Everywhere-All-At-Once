"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#FB923C";

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
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

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const v = max;
  const s = max === 0 ? 0 : (max - min) / max;
  let h = 0;
  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / (max - min) + 2) / 6; break;
      case b: h = ((r - g) / (max - min) + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
}

function hexToCmyk(hex: string): [number, number, number, number] {
  const [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return [0, 0, 0, 100];
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)];
}

function contrastRatio(hex1: string, hex2: string): string {
  const lum = (hex: string) => {
    const [r, g, b] = hexToRgb(hex).map(v => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(hex1), l2 = lum(hex2);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return ratio.toFixed(2);
}

export default function ColorPickerPage() {
  const [color, setColor] = useState("#FB923C");
  const [copied, setCopied] = useState<string | null>(null);

  const [r, g, b] = hexToRgb(color);
  const [h, sl, l] = rgbToHsl(r, g, b);
  const [, sv, v] = rgbToHsv(r, g, b);
  const [c, m, y, k] = hexToCmyk(color);
  const contrast = contrastRatio(color, "#ffffff");
  const contrastDark = contrastRatio(color, "#000000");

  const formats = [
    { label: "HEX", value: color.toUpperCase() },
    { label: "RGB", value: `rgb(${r}, ${g}, ${b})` },
    { label: "HSL", value: `hsl(${h}, ${sl}%, ${l}%)` },
    { label: "HSV", value: `hsv(${h}, ${sv}%, ${v}%)` },
    { label: "CMYK", value: `cmyk(${c}%, ${m}%, ${y}%, ${k}%)` },
    { label: "CSS var", value: `--color: ${color};` },
  ];

  const copy = (val: string) => {
    navigator.clipboard.writeText(val).then(() => { setCopied(val); setTimeout(() => setCopied(null), 1500); });
  };

  return (
    <ToolShell category="Creative & Art" categoryHref="/tools/creative" accent={accent} title="Color Picker" description="Pick any color and get HEX, RGB, HSL, HSV, CMYK values — plus contrast ratios and tints.">
      <div className="space-y-5">
        {/* Big color picker */}
        <div className="flex gap-6 items-center">
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-24 h-24 rounded-xl cursor-pointer border-0 shrink-0" />
          <div className="flex-1">
            <input type="text" value={color} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setColor(e.target.value); }}
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-4 py-3 text-2xl font-mono text-[#e4e4e7] focus:outline-none uppercase tracking-widest" />
            <div className="flex gap-2 mt-2">
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                <span className="text-[#71717a]">vs white: <span style={{ color: Number(contrast) >= 4.5 ? "#22C55E" : "#EF4444" }}>{contrast}:1</span></span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <span className="text-[#71717a]">vs black: <span style={{ color: Number(contrastDark) >= 4.5 ? "#22C55E" : "#EF4444" }}>{contrastDark}:1</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Formats */}
        <div className="grid grid-cols-2 gap-2">
          {formats.map(({ label, value }) => (
            <button key={label} onClick={() => copy(value)}
              className="flex items-center justify-between bg-[#141414] border border-[#2a2a2a] rounded px-4 py-3 text-left hover:border-[#3f3f46] transition-colors">
              <div>
                <div className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">{label}</div>
                <div className="text-xs font-mono text-[#e4e4e7] mt-0.5">{value}</div>
              </div>
              <span className="text-[10px] font-mono shrink-0 ml-2" style={{ color: copied === value ? accent : "#3f3f46" }}>
                {copied === value ? "✓" : "copy"}
              </span>
            </button>
          ))}
        </div>

        {/* Tints and shades */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">tints & shades</label>
          <div className="grid grid-cols-10 gap-1">
            {[95, 85, 75, 65, 55, 45, 35, 25, 15, 5].map(lightness => {
              const hex = `hsl(${h}, ${sl}%, ${lightness}%)`;
              return (
                <button key={lightness} onClick={() => copy(hex)} title={`${lightness}% lightness`}
                  className="h-10 rounded transition-transform hover:scale-110"
                  style={{ backgroundColor: hex }} />
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] font-mono text-[#3f3f46] mt-1">
            <span>lightest</span><span>darkest</span>
          </div>
        </div>

        {/* Preview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-lg" style={{ backgroundColor: color }}>
            <div className="text-xs font-mono font-bold" style={{ color: "#ffffff" }}>White text</div>
            <div className="text-[10px] font-mono mt-1" style={{ color: "#ffffff", opacity: 0.7 }}>on your color</div>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: color }}>
            <div className="text-xs font-mono font-bold" style={{ color: "#000000" }}>Black text</div>
            <div className="text-[10px] font-mono mt-1" style={{ color: "#000000", opacity: 0.7 }}>on your color</div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
