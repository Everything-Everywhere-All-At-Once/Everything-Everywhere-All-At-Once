"use client";

import { useState, useEffect } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

const FORMATS = [
  { label: "Local",    fn: (d: Date) => d.toLocaleString() },
  { label: "UTC",      fn: (d: Date) => d.toUTCString() },
  { label: "ISO 8601", fn: (d: Date) => d.toISOString() },
  { label: "Date only",fn: (d: Date) => d.toLocaleDateString() },
  { label: "Time only",fn: (d: Date) => d.toLocaleTimeString() },
];

export default function TimestampPage() {
  const [now, setNow] = useState(Date.now());
  const [tsInput, setTsInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [live]);

  const parsed: Date | null = (() => {
    if (tsInput.trim()) {
      const n = Number(tsInput.trim());
      if (!isNaN(n)) return new Date(n > 1e10 ? n : n * 1000);
    }
    if (dateInput.trim()) {
      const d = new Date(dateInput.trim());
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  })();

  const liveDate = new Date(now);
  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key); setTimeout(() => setCopied(null), 1500);
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e1e1e] last:border-0">
      <span className="text-[10px] font-mono text-[#52525b] uppercase tracking-widest w-24 shrink-0">{label}</span>
      <span className="text-xs font-mono text-[#e4e4e7] flex-1 text-right mr-3 truncate">{value}</span>
      <button onClick={() => copy(value, label)} className="text-[9px] font-mono shrink-0" style={{ color: copied === label ? accent : "#3f3f46" }}>
        {copied === label ? "copied" : "copy"}
      </button>
    </div>
  );

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="Timestamp Converter" description="Convert Unix timestamps to readable dates and vice versa — milliseconds and seconds supported.">
      <div className="space-y-6">
        {/* Live clock */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#52525b]">current time</span>
            <button onClick={() => setLive(l => !l)} className="text-[9px] font-mono tracking-widest px-2 py-0.5 rounded border"
              style={{ borderColor: live ? `${accent}50` : "#2a2a2a", color: live ? accent : "#52525b" }}>
              {live ? "live" : "paused"}
            </button>
          </div>
          <div className="text-3xl font-black font-mono mb-1" style={{ color: accent }}>{Math.floor(now / 1000)}</div>
          <div className="text-xs font-mono text-[#52525b]">{now} ms</div>
          <div className="mt-3 space-y-0 bg-[#0d0d0d] rounded border border-[#1e1e1e]">
            {FORMATS.map(f => <Row key={f.label} label={f.label} value={f.fn(liveDate)} />)}
          </div>
        </div>

        {/* Convert timestamp */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">unix timestamp to date</label>
          <input value={tsInput} onChange={e => { setTsInput(e.target.value); setDateInput(""); }}
            placeholder="1700000000  or  1700000000000"
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] placeholder:text-[#3f3f46] focus:outline-none focus:border-[#3f3f46] transition-colors" />
        </div>

        {/* Convert date */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">date / string to unix</label>
          <input value={dateInput} onChange={e => { setDateInput(e.target.value); setTsInput(""); }}
            placeholder="2024-01-15  or  Jan 15 2024 09:00:00"
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] placeholder:text-[#3f3f46] focus:outline-none focus:border-[#3f3f46] transition-colors" />
        </div>

        {/* Result */}
        {parsed && !isNaN(parsed.getTime()) && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
            <div className="px-4 py-2 border-b border-[#1e1e1e]">
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>result</span>
            </div>
            <Row label="Unix (s)"  value={String(Math.floor(parsed.getTime() / 1000))} />
            <Row label="Unix (ms)" value={String(parsed.getTime())} />
            {FORMATS.map(f => <Row key={f.label} label={f.label} value={f.fn(parsed)} />)}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
