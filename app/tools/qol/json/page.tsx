"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

export default function JsonPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState(false);
  const [sortKeys, setSortKeys] = useState(false);

  const format = (mode: "pretty" | "minify" | "validate") => {
    setError("");
    setOutput("");
    try {
      const parsed = JSON.parse(input);
      if (mode === "validate") {
        setOutput("✓ valid JSON");
        return;
      }
      const sortReplacer = (_: string, val: unknown) => {
        if (val && typeof val === "object" && !Array.isArray(val)) {
          return Object.fromEntries(Object.entries(val as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)));
        }
        return val;
      };
      const replacer = sortKeys ? sortReplacer : undefined;
      if (mode === "pretty") setOutput(JSON.stringify(parsed, replacer, indent));
      else setOutput(JSON.stringify(parsed, replacer));
    } catch (e) {
      setError(e instanceof Error ? e.message : "invalid JSON");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const stats = () => {
    try {
      const parsed = JSON.parse(input);
      const count = (obj: unknown): { keys: number; arrays: number; nulls: number } => {
        let keys = 0, arrays = 0, nulls = 0;
        const walk = (v: unknown) => {
          if (v === null) { nulls++; return; }
          if (Array.isArray(v)) { arrays++; v.forEach(walk); return; }
          if (typeof v === "object") { const entries = Object.entries(v as Record<string, unknown>); keys += entries.length; entries.forEach(([, val]) => walk(val)); }
        };
        walk(obj);
        return { keys, arrays, nulls };
      };
      return count(parsed);
    } catch { return null; }
  };

  const s = input ? stats() : null;

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="JSON Formatter" description="Validate, format, and minify JSON — sort keys, adjust indent, all in browser.">
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] tracking-widest text-[#71717a] uppercase font-mono">input JSON</label>
            {s && <span className="text-[10px] font-mono text-[#3f3f46]">{s.keys} keys · {s.arrays} arrays · {s.nulls} nulls</span>}
          </div>
          <textarea value={input} onChange={e => { setInput(e.target.value); setError(""); setOutput(""); }}
            className="w-full h-48 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-xs font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed"
            placeholder='{"hello": "world"}' />
        </div>

        {error && <div className="text-xs text-[#EF4444] font-mono bg-[#EF444410] border border-[#EF444430] rounded px-4 py-2">{error}</div>}

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            <span className="text-[10px] font-mono text-[#71717a] self-center">indent</span>
            {[2, 4, "\t"].map(v => (
              <button key={String(v)} onClick={() => setIndent(v === "\t" ? 1 : Number(v))}
                className="px-2.5 py-1 text-xs font-mono rounded border transition-all"
                style={indent === (v === "\t" ? 1 : Number(v)) ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {v === "\t" ? "tab" : `${v}sp`}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs font-mono text-[#71717a] cursor-pointer">
            <input type="checkbox" checked={sortKeys} onChange={e => setSortKeys(e.target.checked)} className="accent-indigo-500" />
            sort keys
          </label>
        </div>

        <div className="flex gap-2">
          {(["pretty", "minify", "validate"] as const).map(m => (
            <button key={m} onClick={() => format(m)} disabled={!input.trim()}
              className="flex-1 py-2.5 text-xs font-mono capitalize rounded border transition-all disabled:opacity-30"
              style={{ borderColor: accent, color: accent, backgroundColor: `${accent}15` }}>
              {m}
            </button>
          ))}
        </div>

        {output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">{output.startsWith("✓") ? "" : `${output.length} chars`}</span>
              {!output.startsWith("✓") && (
                <button onClick={copy} className="text-[10px] font-mono px-3 py-1 rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7]">
                  {copied ? "copied ✓" : "copy"}
                </button>
              )}
            </div>
            <textarea readOnly value={output}
              className="w-full h-48 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-xs font-mono resize-none focus:outline-none leading-relaxed"
              style={{ color: output.startsWith("✓") ? accent : "#e4e4e7" }} />
          </div>
        )}
      </div>
    </ToolShell>
  );
}
