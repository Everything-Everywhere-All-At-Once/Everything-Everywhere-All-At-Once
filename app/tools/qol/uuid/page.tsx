"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function uuidv7(): string {
  const now = Date.now();
  const msHex = now.toString(16).padStart(12, "0");
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  const uuid = `${msHex.slice(0, 8)}-${msHex.slice(8)}-7${rand.slice(0, 3)}-${((parseInt(rand[3], 16) & 0x3) | 0x8).toString(16)}${rand.slice(4, 7)}-${rand.slice(7, 19)}`;
  return uuid;
}

function toNoBraces(u: string) { return u.replace(/-/g, ""); }
function toUrn(u: string) { return `urn:uuid:${u}`; }

export default function UuidPage() {
  const [count, setCount] = useState(5);
  const [version, setVersion] = useState<"v4" | "v7">("v4");
  const [format, setFormat] = useState<"standard" | "no-hyphens" | "urn">("standard");
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | "all" | null>(null);

  const generate = () => {
    const raw = Array.from({ length: count }, () => version === "v4" ? uuidv4() : uuidv7());
    setUuids(raw);
  };

  const applyFormat = (u: string) => {
    if (format === "no-hyphens") return toNoBraces(u);
    if (format === "urn") return toUrn(u);
    return u;
  };

  const copy = (u: string, i: number | "all") => {
    navigator.clipboard.writeText(u).then(() => { setCopied(i); setTimeout(() => setCopied(null), 1500); });
  };

  const copyAll = () => copy(uuids.map(applyFormat).join("\n"), "all");

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="UUID Generator" description="Generate cryptographically random UUIDs (v4) or time-ordered UUIDs (v7) — in bulk, multiple formats.">
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">version</label>
            <div className="flex gap-2">
              {(["v4", "v7"] as const).map(v => (
                <button key={v} onClick={() => setVersion(v)}
                  className="flex-1 py-2 text-xs font-mono rounded border transition-all"
                  style={version === v ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">format</label>
            <div className="flex gap-1">
              {(["standard", "no-hyphens", "urn"] as const).map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className="flex-1 py-2 text-[10px] font-mono rounded border transition-all"
                  style={format === f ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {f === "standard" ? "std" : f === "no-hyphens" ? "hex" : "URN"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">count</label>
            <div className="flex gap-1">
              {[1, 5, 10, 25].map(n => (
                <button key={n} onClick={() => setCount(n)}
                  className="flex-1 py-2 text-xs font-mono rounded border transition-all"
                  style={count === n ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={generate}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all"
          style={{ borderColor: accent, color: "#0d0d0d", backgroundColor: accent }}>
          generate {count} UUID{count !== 1 ? "s" : ""}
        </button>

        {uuids.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">{uuids.length} generated · {version.toUpperCase()}</span>
              <button onClick={copyAll} className="text-[10px] font-mono px-3 py-1 rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7]">
                {copied === "all" ? "copied ✓" : "copy all"}
              </button>
            </div>
            <div className="border border-[#2a2a2a] rounded overflow-hidden">
              {uuids.map((u, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a] last:border-0 group">
                  <code className="text-xs font-mono text-[#e4e4e7] break-all">{applyFormat(u)}</code>
                  <button onClick={() => copy(applyFormat(u), i)} className="ml-3 shrink-0 text-[10px] font-mono text-[#3f3f46] hover:text-[#e4e4e7] transition-colors">
                    {copied === i ? "✓" : "copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-[10px] text-[#3f3f46] font-mono">v4 — random · v7 — time-ordered (sortable, ideal for database primary keys)</div>
      </div>
    </ToolShell>
  );
}
