"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#EC4899";

// Basic SVG optimization: remove comments, whitespace, unnecessary attributes
function optimizeSvg(input: string): { output: string; savings: number } {
  let out = input;

  // Remove XML declaration
  out = out.replace(/<\?xml[^?]*\?>/g, "");
  // Remove comments
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  // Remove doctype
  out = out.replace(/<!DOCTYPE[^>]*>/gi, "");
  // Remove unnecessary whitespace between tags
  out = out.replace(/>\s+</g, "><");
  // Trim leading/trailing whitespace
  out = out.trim();
  // Remove empty attributes
  out = out.replace(/\s+\w+=""/g, "");
  // Collapse multiple spaces in attributes
  out = out.replace(/\s{2,}/g, " ");
  // Remove unnecessary xmlns:xlink if no xlink: attributes present
  if (!out.includes("xlink:")) {
    out = out.replace(/\s+xmlns:xlink="[^"]*"/g, "");
  }
  // Remove inkscape/sodipodi namespaces
  out = out.replace(/\s+xmlns:(?:inkscape|sodipodi|dc|cc|rdf)[^"]*"[^"]*"/g, "");
  // Remove inkscape/sodipodi elements
  out = out.replace(/<(?:inkscape|sodipodi):[^>]*\/>/g, "");
  out = out.replace(/<(?:inkscape|sodipodi):[^>]*>[\s\S]*?<\/(?:inkscape|sodipodi):[^>]*>/g, "");
  // Remove metadata
  out = out.replace(/<metadata[\s\S]*?<\/metadata>/g, "");
  // Remove title (optional)
  // Remove defs if empty
  out = out.replace(/<defs\s*\/>/g, "");
  out = out.replace(/<defs>\s*<\/defs>/g, "");
  // Trim again
  out = out.trim();

  const savings = Math.max(0, input.length - out.length);
  return { output: out, savings };
}

export default function SvgPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [savings, setSavings] = useState(0);
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const [tab, setTab] = useState<"code" | "preview">("code");
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const optimize = () => {
    if (!input.trim()) return;
    const result = optimizeSvg(input);
    setOutput(result.output);
    setSavings(result.savings);
    setStatus("done");
  };

  const loadFile = async (f: File) => {
    const text = await f.text();
    setInput(text);
    setOutput("");
    setStatus("idle");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "image/svg+xml" || f?.name.endsWith(".svg")) loadFile(f);
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const download = () => {
    const blob = new Blob([output], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "optimized.svg";
    a.click();
  };

  const pct = input.length > 0 ? Math.round((savings / input.length) * 100) : 0;

  return (
    <ToolShell category="Web Design" categoryHref="/tools/webdesign" accent={accent} title="SVG Optimizer" description="Clean and compress SVG files — removes comments, metadata, whitespace, and editor bloat.">
      <div className="space-y-5">
        {/* File drop */}
        <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed rounded p-4 text-center cursor-pointer transition-all"
          style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
          <input ref={fileInputRef} type="file" accept=".svg,image/svg+xml" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
          <div className="text-xs text-[#71717a] font-mono">drop .svg file or click to browse</div>
        </div>

        {/* Input editor */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">SVG source — {input.length} bytes</label>
          <textarea value={input} onChange={e => { setInput(e.target.value); setOutput(""); setStatus("idle"); }}
            className="w-full h-40 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-xs font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed"
            placeholder="<svg xmlns='http://www.w3.org/2000/svg' ...>...</svg>" />
        </div>

        <button onClick={optimize} disabled={!input.trim()}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
          style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
          {status === "done" ? `optimized — saved ${pct}% (${savings} bytes) ✓` : "optimize SVG"}
        </button>

        {output && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "original", value: `${input.length}B` },
                { label: "optimized", value: `${output.length}B` },
                { label: "savings", value: `${pct}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#141414] border border-[#2a2a2a] rounded p-3 text-center">
                  <div className="text-lg font-mono font-bold" style={{ color: accent }}>{value}</div>
                  <div className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Output tabs */}
            <div className="flex border-b border-[#2a2a2a]">
              {(["code", "preview"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-4 py-1.5 text-xs font-mono capitalize transition-colors"
                  style={tab === t ? { color: accent, borderBottom: `1px solid ${accent}` } : { color: "#71717a" }}>
                  {t}
                </button>
              ))}
              <div className="ml-auto flex gap-2 pb-1">
                <button onClick={copy} className="px-3 py-1 text-[10px] font-mono rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7]">{copied ? "copied ✓" : "copy"}</button>
                <button onClick={download} className="px-3 py-1 text-[10px] font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>download</button>
              </div>
            </div>

            {tab === "code" ? (
              <textarea readOnly value={output}
                className="w-full h-40 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-xs font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed" />
            ) : (
              <div className="w-full h-40 bg-white rounded border border-[#2a2a2a] flex items-center justify-center p-4"
                dangerouslySetInnerHTML={{ __html: output }} />
            )}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
