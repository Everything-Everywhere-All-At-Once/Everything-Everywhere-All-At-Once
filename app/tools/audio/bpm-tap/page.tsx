"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#00FFFF";

export default function BpmTapPage() {
  const [taps, setTaps]     = useState<number[]>([]);
  const [bpm, setBpm]       = useState<number | null>(null);
  const [key, setKey]       = useState(0);
  const timeoutRef          = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tap = useCallback(() => {
    const now = performance.now();

    setTaps(prev => {
      // Reset if gap > 3 seconds
      const next = prev.length > 0 && now - prev[prev.length - 1] > 3000 ? [now] : [...prev, now];

      if (next.length >= 2) {
        const intervals = next.slice(1).map((t, i) => t - next[i]);
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        setBpm(Math.round(60000 / avg));
      }

      return next.slice(-32); // keep last 32 taps
    });

    // Auto-reset after 3s of inactivity
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setTaps([]);
      setBpm(null);
      setKey(k => k + 1);
    }, 3000);
  }, []);

  const reset = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTaps([]);
    setBpm(null);
    setKey(k => k + 1);
  };

  const confidence = taps.length >= 8 ? "high" : taps.length >= 4 ? "medium" : taps.length >= 2 ? "low" : null;
  const confColor = confidence === "high" ? accent : confidence === "medium" ? "#FACC15" : "#EF4444";

  const musicalRef = bpm ? [
    { label: "half time", bpm: Math.round(bpm / 2) },
    { label: "double time", bpm: Math.round(bpm * 2) },
    { label: "3/4", bpm: Math.round(bpm * 0.75) },
  ] : [];

  return (
    <ToolShell category="Audio & Music" categoryHref="/tools/audio" accent={accent} title="BPM Tap Counter" description="Tap the button or spacebar to measure beats per minute. Resets automatically after 3 seconds of inactivity.">
      <div className="space-y-6">
        {/* Big tap button */}
        <div className="flex flex-col items-center gap-4 py-4">
          <button
            key={key}
            onClick={tap}
            onKeyDown={e => e.key === " " && (e.preventDefault(), tap())}
            className="w-48 h-48 rounded-full border-2 font-mono text-lg tracking-widest transition-all duration-75 active:scale-95 focus:outline-none select-none"
            style={{ borderColor: accent, color: accent, backgroundColor: `${accent}08` }}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.backgroundColor = `${accent}20`; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.backgroundColor = `${accent}08`; }}
            tabIndex={0}
          >
            TAP
          </button>
          <p className="text-[10px] font-mono text-[#3f3f46] tracking-widest">or press spacebar</p>
        </div>

        {/* BPM display */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6 text-center">
          <div className="text-6xl font-black font-mono mb-2" style={{ color: bpm ? accent : "#2a2a2a" }}>
            {bpm ?? "—"}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b]">beats per minute</div>
          {confidence && (
            <div className="mt-2 text-[9px] font-mono tracking-widest" style={{ color: confColor }}>
              {taps.length} tap{taps.length !== 1 ? "s" : ""} · {confidence} confidence
            </div>
          )}
        </div>

        {/* Related tempos */}
        {musicalRef.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {musicalRef.map(({ label, bpm: b }) => (
              <div key={label} className="bg-[#141414] border border-[#2a2a2a] rounded p-3 text-center">
                <div className="text-xl font-bold font-mono text-[#e4e4e7]">{b}</div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#52525b] mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tempo name */}
        {bpm && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded p-3 flex justify-between items-center">
            <span className="text-[10px] font-mono text-[#52525b] uppercase tracking-widest">tempo</span>
            <span className="text-xs font-mono" style={{ color: accent }}>
              {bpm < 60 ? "Largo" : bpm < 66 ? "Larghetto" : bpm < 76 ? "Adagio" : bpm < 108 ? "Andante" : bpm < 120 ? "Moderato" : bpm < 156 ? "Allegro" : bpm < 176 ? "Vivace" : bpm < 200 ? "Presto" : "Prestissimo"}
              {" "}({bpm} BPM)
            </span>
          </div>
        )}

        <button onClick={reset} className="w-full py-2.5 text-xs font-mono tracking-widest rounded border border-[#2a2a2a] text-[#52525b] hover:text-[#a1a1aa] hover:border-[#3f3f46] transition-all">
          reset
        </button>
      </div>
    </ToolShell>
  );
}
