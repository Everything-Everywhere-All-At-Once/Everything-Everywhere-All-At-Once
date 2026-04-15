"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { analyzeAudio } from "@/lib/audio/analyze";

type Result = {
  bpm: number;
  key: string;
  mode: "major" | "minor";
  confidence: number;
  duration: number;
  sampleRate: number;
  channels: number;
  filename: string;
};

// Camelot wheel mapping for DJs
const CAMELOT: Record<string, Record<string, string>> = {
  major: {
    C: "8B", G: "9B", D: "10B", A: "11B", E: "12B", B: "1B",
    "F#": "2B", "C#": "3B", "G#": "4B", "D#": "5B", "A#": "6B", F: "7B",
  },
  minor: {
    A: "8A", E: "9A", B: "10A", "F#": "11A", "C#": "12A", "G#": "1A",
    "D#": "2A", "A#": "3A", F: "4A", C: "5A", G: "6A", D: "7A",
  },
};

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

const accent = "#00FFFF";

export default function KeyBPMPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyze = useCallback(async (file: File) => {
    setStatus("analyzing");
    setResult(null);
    setErrorMsg("");
    try {
      const data = await analyzeAudio(file);
      setResult({ ...data, filename: file.name });
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMsg("Could not analyze this file. Make sure it's a valid audio file.");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) analyze(f);
  }, [analyze]);

  const camelot = result
    ? CAMELOT[result.mode]?.[result.key] ?? "—"
    : null;

  return (
    <ToolShell
      category="Audio & Music"
      categoryHref="/tools/audio"
      accent={accent}
      title="Key & BPM Detector"
      description="Detect the musical key, BPM, and Camelot wheel position of any audio file — in your browser, no uploads."
    >
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => status !== "analyzing" && fileInputRef.current?.click()}
        className="relative border border-dashed rounded cursor-pointer transition-all duration-200 p-10 text-center mb-6"
        style={{
          borderColor: isDragging ? accent : "#2a2a2a",
          backgroundColor: isDragging ? `${accent}08` : "transparent",
          boxShadow: isDragging ? `0 0 20px ${accent}20` : "none",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) analyze(f); }}
        />
        {status === "analyzing" ? (
          <div>
            <div className="text-[#00FFFF] font-mono text-sm mb-2 animate-pulse">analyzing audio...</div>
            <div className="text-xs text-[#71717a]">detecting key and BPM — this may take a few seconds</div>
          </div>
        ) : (
          <div>
            <div className="text-sm text-[#71717a] font-mono">drop audio file here or click to browse</div>
            <div className="text-xs text-[#3f3f46] mt-2">MP3 · WAV · FLAC · OGG · AAC · M4A</div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded border border-[#EF4444]/30 bg-[#EF4444]/08 text-xs text-[#EF4444] font-mono">
          {errorMsg}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Key + BPM hero */}
          <div className="grid grid-cols-2 gap-3">
            {/* Key */}
            <div
              className="p-6 rounded border text-center"
              style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}
            >
              <div className="text-[10px] tracking-widest text-[#71717a] font-mono uppercase mb-2">key</div>
              <div className="text-5xl font-bold font-mono" style={{ color: accent }}>
                {result.key}
              </div>
              <div className="text-sm text-[#71717a] font-mono mt-1">{result.mode}</div>
            </div>

            {/* BPM */}
            <div className="p-6 rounded border border-[#2a2a2a] bg-[#141414] text-center">
              <div className="text-[10px] tracking-widest text-[#71717a] font-mono uppercase mb-2">bpm</div>
              <div className="text-5xl font-bold font-mono text-[#e4e4e7]">
                {result.bpm}
              </div>
              <div className="text-sm text-[#71717a] font-mono mt-1">beats / min</div>
            </div>
          </div>

          {/* Camelot + confidence */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded border border-[#2a2a2a] bg-[#141414]">
              <div className="text-[10px] tracking-widest text-[#71717a] font-mono uppercase mb-1">camelot wheel</div>
              <div className="text-2xl font-bold font-mono text-[#A855F7]">{camelot}</div>
              <div className="text-[10px] text-[#3f3f46] font-mono mt-1">for harmonic mixing</div>
            </div>
            <div className="p-4 rounded border border-[#2a2a2a] bg-[#141414]">
              <div className="text-[10px] tracking-widest text-[#71717a] font-mono uppercase mb-2">key confidence</div>
              <div className="h-1.5 bg-[#2a2a2a] rounded overflow-hidden mb-1">
                <div
                  className="h-full rounded transition-all duration-700"
                  style={{ width: `${result.confidence}%`, backgroundColor: accent }}
                />
              </div>
              <div className="text-xs font-mono" style={{ color: accent }}>{result.confidence}%</div>
            </div>
          </div>

          {/* File info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "duration", value: formatDuration(result.duration) },
              { label: "sample rate", value: `${(result.sampleRate / 1000).toFixed(1)} kHz` },
              { label: "channels", value: result.channels === 1 ? "Mono" : "Stereo" },
              { label: "file", value: result.filename.split(".").pop()?.toUpperCase() ?? "—" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded border border-[#2a2a2a] bg-[#141414]">
                <div className="text-[10px] text-[#71717a] tracking-widest uppercase font-mono mb-1">{s.label}</div>
                <div className="text-sm text-[#e4e4e7] font-mono">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Harmonic mixing tip */}
          <div className="p-4 rounded border border-[#2a2a2a] bg-[#141414] text-xs font-mono text-[#71717a] leading-relaxed">
            <span style={{ color: accent }}>// harmonic mixing tip</span>
            <br />
            compatible keys: <span className="text-[#e4e4e7]">{result.key} {result.mode}</span> mixes well with adjacent
            Camelot positions ({camelot?.replace(/\d+/, (n) => String(((parseInt(n) - 2 + 12) % 12) + 1))} and{" "}
            {camelot?.replace(/\d+/, (n) => String((parseInt(n) % 12) + 1))}) and the parallel{" "}
            {result.mode === "major" ? "minor" : "major"} ({camelot?.replace(/[AB]$/, result.mode === "major" ? "A" : "B")}).
          </div>

          {/* Analyze another */}
          <button
            onClick={() => { setResult(null); setStatus("idle"); fileInputRef.current?.click(); }}
            className="w-full py-2.5 text-xs font-mono tracking-widest rounded border border-[#2a2a2a] text-[#71717a] hover:border-[#3f3f46] transition-all"
          >
            analyze another file
          </button>
        </div>
      )}

      {!result && status === "idle" && (
        <div className="mt-8 pt-6 border-t border-[#2a2a2a] grid grid-cols-3 gap-4 text-center text-[10px] text-[#3f3f46] font-mono">
          <div><div className="text-[#71717a] mb-1">key detection</div><div>Krumhansl-Schmuckler</div></div>
          <div><div className="text-[#71717a] mb-1">bpm detection</div><div>autocorrelation</div></div>
          <div><div className="text-[#71717a] mb-1">privacy</div><div>100% in-browser</div></div>
        </div>
      )}
    </ToolShell>
  );
}
