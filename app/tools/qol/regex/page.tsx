"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

const PRESETS = [
  { name: "email", pattern: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}" },
  { name: "URL", pattern: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)" },
  { name: "IPv4", pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b" },
  { name: "hex color", pattern: "#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b" },
  { name: "phone (US)", pattern: "\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}" },
  { name: "date (YYYY-MM-DD)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])" },
  { name: "UUID", pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" },
];

export default function RegexPage() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState({ g: true, i: false, m: false });
  const [testStr, setTestStr] = useState("The quick brown fox jumps over the lazy dog.\nContact: hello@example.com\nVisit: https://example.com");
  const [error, setError] = useState("");

  const flagStr = Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join("");

  let matches: RegExpMatchArray[] = [];
  try {
    if (pattern) {
      const re = new RegExp(pattern, flagStr);
      matches = [...testStr.matchAll(new RegExp(pattern, flagStr.includes("g") ? flagStr : flagStr + "g"))];
      setError("");
      void re; // suppress unused warning
    }
  } catch (e) {
    setError(e instanceof Error ? e.message : "invalid regex");
  }

  const highlightedHtml = (() => {
    if (!pattern || error || !matches.length) return testStr.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    try {
      const re = new RegExp(pattern, "g" + flagStr.replace("g", ""));
      return testStr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(re, m =>
        `<mark style="background:${accent}30;color:${accent};border-radius:2px;padding:0 1px">${m.replace(/</g, "&lt;")}</mark>`
      );
    } catch { return testStr; }
  })();

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="Regex Tester" description="Test regular expressions with live highlighting — flags, match details, and common presets.">
      <div className="space-y-5">
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => setPattern(p.pattern)}
              className="px-3 py-1 text-[10px] font-mono rounded border transition-all"
              style={{ borderColor: "#2a2a2a", color: "#71717a" }}>
              {p.name}
            </button>
          ))}
        </div>

        {/* Pattern input */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">pattern</label>
          <div className="flex items-center bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden" style={{ borderColor: error ? "#EF4444" : "#2a2a2a" }}>
            <span className="px-3 text-[#3f3f46] font-mono text-lg">/</span>
            <input value={pattern} onChange={e => setPattern(e.target.value)}
              className="flex-1 bg-transparent py-3 text-sm font-mono text-[#e4e4e7] focus:outline-none"
              placeholder="your regex pattern..." />
            <span className="px-3 text-[#3f3f46] font-mono text-lg">/{flagStr}</span>
          </div>
          {error && <div className="text-[10px] text-[#EF4444] font-mono mt-1">{error}</div>}
        </div>

        {/* Flags */}
        <div className="flex gap-3">
          {(["g", "i", "m"] as const).map(f => (
            <label key={f} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={flags[f]} onChange={e => setFlags(fl => ({ ...fl, [f]: e.target.checked }))} className="accent-indigo-500" />
              <span className="text-xs font-mono" style={{ color: flags[f] ? accent : "#71717a" }}>/{f} — {f === "g" ? "global" : f === "i" ? "case-insensitive" : "multiline"}</span>
            </label>
          ))}
        </div>

        {/* Stats */}
        {pattern && !error && (
          <div className="flex gap-4 text-[10px] font-mono">
            <span style={{ color: accent }}>{matches.length} match{matches.length !== 1 ? "es" : ""}</span>
            {matches.length > 0 && <span className="text-[#3f3f46]">first at index {matches[0].index}</span>}
          </div>
        )}

        {/* Test string */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">test string</label>
          <textarea value={testStr} onChange={e => setTestStr(e.target.value)}
            className="w-full h-28 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed" />
        </div>

        {/* Highlighted result */}
        {pattern && !error && (
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">matches highlighted</label>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] leading-relaxed whitespace-pre-wrap break-all"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
          </div>
        )}

        {/* Match list */}
        {matches.length > 0 && (
          <div className="border border-[#2a2a2a] rounded overflow-hidden">
            <div className="px-4 py-2 bg-[#141414] border-b border-[#2a2a2a]">
              <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">match details</span>
            </div>
            {matches.slice(0, 20).map((m, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-2.5 border-b border-[#1a1a1a] last:border-0">
                <span className="text-[10px] font-mono text-[#3f3f46] w-6">#{i + 1}</span>
                <code className="flex-1 text-xs font-mono break-all" style={{ color: accent }}>{m[0]}</code>
                <span className="text-[10px] font-mono text-[#3f3f46]">idx {m.index}</span>
              </div>
            ))}
            {matches.length > 20 && <div className="px-4 py-2 text-[10px] font-mono text-[#3f3f46]">+{matches.length - 20} more matches</div>}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
