"use client";

import { useState, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#22C55E";

const SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

function generatePassword(length: number, options: Record<string, boolean>, exclude: string): string {
  let chars = "";
  if (options.uppercase) chars += SETS.uppercase;
  if (options.lowercase) chars += SETS.lowercase;
  if (options.numbers) chars += SETS.numbers;
  if (options.symbols) chars += SETS.symbols;
  if (!chars) chars = SETS.lowercase;
  // Remove excluded characters
  for (const ch of exclude) chars = chars.split(ch).join("");
  if (!chars) return "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(n => chars[n % chars.length]).join("");
}

function entropy(password: string): number {
  const uniq = new Set(password.split("")).size;
  return password.length * Math.log2(uniq || 1);
}

function strength(e: number): { label: string; color: string; width: string } {
  if (e < 28) return { label: "weak", color: "#EF4444", width: "20%" };
  if (e < 50) return { label: "fair", color: "#F97316", width: "45%" };
  if (e < 70) return { label: "good", color: "#FACC15", width: "70%" };
  return { label: "strong", color: "#22C55E", width: "100%" };
}

export default function PasswordPage() {
  const [length, setLength] = useState(20);
  const [options, setOptions] = useState({ uppercase: true, lowercase: true, numbers: true, symbols: true });
  const [exclude, setExclude] = useState("0Ol1I");
  const [passwords, setPasswords] = useState<string[]>([]);
  const [count, setCount] = useState(5);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = useCallback(() => {
    setPasswords(Array.from({ length: count }, () => generatePassword(length, options, exclude)));
  }, [length, options, exclude, count]);

  const toggle = (key: string) => setOptions(o => ({ ...o, [key]: !o[key as keyof typeof o] }));

  const copy = (pw: string, i: number) => {
    navigator.clipboard.writeText(pw).then(() => { setCopied(i); setTimeout(() => setCopied(null), 1500); });
  };

  return (
    <ToolShell category="Cybersecurity" categoryHref="/tools/cyber" accent={accent} title="Password Generator" description="Generate cryptographically strong passwords — using the Web Crypto API, nothing is logged or sent.">
      <div className="space-y-5">
        {/* Length */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">length — {length} characters</label>
          <input type="range" min={8} max={128} step={1} value={length} onChange={e => setLength(Number(e.target.value))}
            className="w-full cursor-pointer" style={{ accentColor: accent }} />
          <div className="flex justify-between text-[10px] text-[#3f3f46] font-mono mt-1"><span>8</span><span>128</span></div>
        </div>

        {/* Character sets */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">character sets</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(SETS) as [string, string][]).map(([key]) => (
              <button key={key} onClick={() => toggle(key)}
                className="py-2 text-xs font-mono rounded border transition-all capitalize text-left px-3"
                style={options[key as keyof typeof options] ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {key} <span className="opacity-40 text-[10px]">({SETS[key as keyof typeof SETS].slice(0, 8)}...)</span>
              </button>
            ))}
          </div>
        </div>

        {/* Exclude chars */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">exclude characters</label>
          <input type="text" value={exclude} onChange={e => setExclude(e.target.value)}
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none"
            placeholder="characters to exclude..." />
        </div>

        {/* Count */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">generate — {count} passwords</label>
          <div className="flex gap-2">
            {[1, 5, 10, 20].map(n => (
              <button key={n} onClick={() => setCount(n)}
                className="px-4 py-1.5 text-xs font-mono rounded border transition-all"
                style={count === n ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all"
          style={{ borderColor: accent, color: "#0d0d0d", backgroundColor: accent }}>
          generate
        </button>

        {/* Results */}
        {passwords.length > 0 && (
          <div className="space-y-2">
            {passwords.map((pw, i) => {
              const e = entropy(pw);
              const s = strength(e);
              return (
                <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <code className="flex-1 text-xs font-mono text-[#e4e4e7] break-all">{pw}</code>
                    <button onClick={() => copy(pw, i)} className="shrink-0 px-3 py-1.5 text-[10px] font-mono rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7]">
                      {copied === i ? "✓" : "copy"}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: s.width, backgroundColor: s.color }} />
                    </div>
                    <span className="text-[10px] font-mono w-12 text-right" style={{ color: s.color }}>{s.label}</span>
                    <span className="text-[10px] font-mono text-[#3f3f46]">{e.toFixed(0)} bits</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
