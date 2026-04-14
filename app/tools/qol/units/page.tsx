"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

type Category = { label: string; units: { name: string; factor: number; offset?: number }[] };

const CATEGORIES: Record<string, Category> = {
  length: {
    label: "Length",
    units: [
      { name: "mm", factor: 0.001 }, { name: "cm", factor: 0.01 }, { name: "m", factor: 1 },
      { name: "km", factor: 1000 }, { name: "inch", factor: 0.0254 }, { name: "foot", factor: 0.3048 },
      { name: "yard", factor: 0.9144 }, { name: "mile", factor: 1609.344 }, { name: "nautical mile", factor: 1852 },
    ],
  },
  weight: {
    label: "Weight",
    units: [
      { name: "mg", factor: 0.000001 }, { name: "g", factor: 0.001 }, { name: "kg", factor: 1 },
      { name: "tonne", factor: 1000 }, { name: "oz", factor: 0.028349 }, { name: "lb", factor: 0.453592 },
      { name: "stone", factor: 6.35029 }, { name: "US ton", factor: 907.185 },
    ],
  },
  temperature: {
    label: "Temperature",
    units: [
      { name: "°C", factor: 1, offset: 0 },
      { name: "°F", factor: 5 / 9, offset: -32 },
      { name: "K", factor: 1, offset: -273.15 },
    ],
  },
  area: {
    label: "Area",
    units: [
      { name: "mm²", factor: 0.000001 }, { name: "cm²", factor: 0.0001 }, { name: "m²", factor: 1 },
      { name: "km²", factor: 1000000 }, { name: "hectare", factor: 10000 }, { name: "acre", factor: 4046.86 },
      { name: "ft²", factor: 0.092903 }, { name: "mi²", factor: 2589988 },
    ],
  },
  volume: {
    label: "Volume",
    units: [
      { name: "ml", factor: 0.001 }, { name: "L", factor: 1 }, { name: "m³", factor: 1000 },
      { name: "fl oz", factor: 0.0295735 }, { name: "cup", factor: 0.236588 }, { name: "pint", factor: 0.473176 },
      { name: "quart", factor: 0.946353 }, { name: "gallon", factor: 3.78541 },
    ],
  },
  speed: {
    label: "Speed",
    units: [
      { name: "m/s", factor: 1 }, { name: "km/h", factor: 0.277778 }, { name: "mph", factor: 0.44704 },
      { name: "knot", factor: 0.514444 }, { name: "ft/s", factor: 0.3048 },
    ],
  },
  data: {
    label: "Data",
    units: [
      { name: "bit", factor: 1 }, { name: "byte", factor: 8 }, { name: "KB", factor: 8192 },
      { name: "MB", factor: 8388608 }, { name: "GB", factor: 8589934592 }, { name: "TB", factor: 8796093022208 },
    ],
  },
  time: {
    label: "Time",
    units: [
      { name: "ms", factor: 0.001 }, { name: "s", factor: 1 }, { name: "min", factor: 60 },
      { name: "hour", factor: 3600 }, { name: "day", factor: 86400 }, { name: "week", factor: 604800 },
      { name: "month", factor: 2629800 }, { name: "year", factor: 31557600 },
    ],
  },
};

function convertTemp(value: number, from: string, to: string): number {
  let celsius: number;
  if (from === "°C") celsius = value;
  else if (from === "°F") celsius = (value - 32) * 5 / 9;
  else celsius = value - 273.15;
  if (to === "°C") return celsius;
  if (to === "°F") return celsius * 9 / 5 + 32;
  return celsius + 273.15;
}

export default function UnitsPage() {
  const [cat, setCat] = useState("length");
  const [value, setValue] = useState("1");
  const [fromUnit, setFromUnit] = useState(CATEGORIES.length.units[2].name);

  const category = CATEGORIES[cat];

  const convert = (toUnit: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return "—";
    if (cat === "temperature") return convertTemp(num, fromUnit, toUnit).toPrecision(6).replace(/\.?0+$/, "");
    const from = category.units.find(u => u.name === fromUnit);
    const to = category.units.find(u => u.name === toUnit);
    if (!from || !to) return "—";
    const result = (num * from.factor) / to.factor;
    if (Math.abs(result) >= 1e6 || (Math.abs(result) < 0.001 && result !== 0)) return result.toExponential(4);
    return parseFloat(result.toPrecision(8)).toString();
  };

  const handleCatChange = (c: string) => {
    setCat(c);
    setFromUnit(CATEGORIES[c].units[0].name);
    setValue("1");
  };

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="Unit Converter" description="Convert between hundreds of units — length, weight, temperature, area, volume, speed, data, time.">
      <div className="space-y-5">
        {/* Category */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <button key={k} onClick={() => handleCatChange(k)}
              className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
              style={cat === k ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
              {v.label}
            </button>
          ))}
        </div>

        {/* Input + from unit */}
        <div className="flex gap-3">
          <input type="number" value={value} onChange={e => setValue(e.target.value)}
            className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded px-4 py-3 text-lg font-mono text-[#e4e4e7] focus:outline-none"
            placeholder="0" />
          <select value={fromUnit} onChange={e => setFromUnit(e.target.value)}
            className="bg-[#141414] border border-[#2a2a2a] rounded px-3 py-3 text-sm font-mono text-[#e4e4e7] focus:outline-none cursor-pointer"
            style={{ color: accent }}>
            {category.units.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
          </select>
        </div>

        {/* Results grid */}
        <div className="border border-[#2a2a2a] rounded overflow-hidden">
          <div className="px-4 py-2 bg-[#141414] border-b border-[#2a2a2a]">
            <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">{category.label} — {value || "0"} {fromUnit}</span>
          </div>
          <div className="divide-y divide-[#1a1a1a]">
            {category.units.filter(u => u.name !== fromUnit).map(u => (
              <div key={u.name} className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-mono text-[#71717a]">{u.name}</span>
                <span className="text-sm font-mono text-[#e4e4e7]">{convert(u.name)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
