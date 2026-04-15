"use client";

import { useState, useRef } from "react";
import { ToolShell } from "@/components/tool-shell";
import { analyzeAudio } from "@/lib/audio/analyze";

const accent = "#EF4444";

const CAMELOT: Record<string, string> = {
  "C major": "8B", "G major": "9B", "D major": "10B", "A major": "11B",
  "E major": "12B", "B major": "1B", "F# major": "2B", "Db major": "3B",
  "Ab major": "4B", "Eb major": "5B", "Bb major": "6B", "F major": "7B",
  "A minor": "8A", "E minor": "9A", "B minor": "10A", "F# minor": "11A",
  "C# minor": "12A", "G# minor": "1A", "D# minor": "2A", "Bb minor": "3A",
  "F minor": "4A", "C minor": "5A", "G minor": "6A", "D minor": "7A",
};

type TagResult = {
  id: string;
  file: File;
  status: "pending" | "analyzing" | "done" | "error";
  key?: string;
  bpm?: number;
  camelot?: string;
  confidence?: number;
};

export default function DjTagPage() {
  const [results, setResults] = useState<TagResult[]>([]);
  const [running, setRunning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const items: TagResult[] = Array.from(files)
      .filter(f => f.type.startsWith("audio/") || /\.(mp3|wav|flac|aac|ogg|m4a|aiff)$/i.test(f.name))
      .map(file => ({ id: Math.random().toString(36).slice(2), file, status: "pending" as const }));
    setResults(prev => [...prev, ...items]);
  };

  const analyzeAll = async () => {
    setRunning(true);
    for (const item of results.filter(r => r.status === "pending")) {
      setResults(prev => prev.map(r => r.id === item.id ? { ...r, status: "analyzing" } : r));
      try {
        const result = await analyzeAudio(item.file);
        const camelot = CAMELOT[result.key] ?? "?";
        setResults(prev => prev.map(r => r.id === item.id ? {
          ...r, status: "done",
          key: result.key,
          bpm: Math.round(result.bpm),
          camelot,
          confidence: result.confidence,
        } : r));
      } catch {
        setResults(prev => prev.map(r => r.id === item.id ? { ...r, status: "error" } : r));
      }
    }
    setRunning(false);
  };

  const exportCsv = () => {
    const done = results.filter(r => r.status === "done");
    if (!done.length) return;
    const header = "filename,key,camelot,bpm,confidence";
    const rows = done.map(r => `"${r.file.name}","${r.key}","${r.camelot}",${r.bpm},${r.confidence?.toFixed(2)}`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "library_tags.csv";
    a.click();
  };

  const done = results.filter(r => r.status === "done");

  return (
    <ToolShell category="DJ Tools" categoryHref="/tools/dj" accent={accent} title="BPM & Key Tagger" description="Batch analyze your entire library — detect BPM and musical key for every track, export as CSV.">
      <div className="space-y-5">
        <div onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed rounded p-8 text-center cursor-pointer transition-all"
          style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
          <input ref={fileInputRef} type="file" accept="audio/*" multiple className="hidden"
            onChange={e => { if (e.target.files) addFiles(e.target.files); }} />
          <div className="text-sm text-[#71717a] font-mono">drop audio files or click to browse</div>
          <div className="text-xs text-[#3f3f46] mt-1">MP3 · WAV · FLAC · AIFF · OGG — batch supported</div>
        </div>

        {results.length > 0 && (
          <>
            <div className="flex gap-2">
              <button onClick={analyzeAll} disabled={running || results.every(r => r.status !== "pending")}
                className="flex-1 py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
                style={{ borderColor: accent, color: accent, backgroundColor: `${accent}15` }}>
                {running ? `analyzing... ${done.length}/${results.length}` : `analyze ${results.filter(r => r.status === "pending").length} tracks`}
              </button>
              {done.length > 0 && (
                <button onClick={exportCsv}
                  className="px-6 py-3 text-sm font-mono tracking-widest rounded border transition-all"
                  style={{ borderColor: "#22C55E", color: "#22C55E", backgroundColor: "#22C55E15" }}>
                  export CSV
                </button>
              )}
            </div>

            {/* Summary stats */}
            {done.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "analyzed", value: done.length },
                  { label: "avg BPM", value: Math.round(done.reduce((a, r) => a + (r.bpm ?? 0), 0) / done.length) },
                  { label: "pending", value: results.filter(r => r.status === "pending").length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#141414] border border-[#2a2a2a] rounded p-3 text-center">
                    <div className="text-xl font-mono font-bold" style={{ color: accent }}>{value}</div>
                    <div className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest mt-1">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Results table */}
            <div className="border border-[#2a2a2a] rounded overflow-hidden">
              <div className="px-4 py-2 bg-[#141414] border-b border-[#2a2a2a] grid grid-cols-12 gap-2">
                <span className="col-span-5 text-[10px] font-mono text-[#71717a] uppercase tracking-widest">file</span>
                <span className="col-span-3 text-[10px] font-mono text-[#71717a] uppercase tracking-widest">key</span>
                <span className="col-span-2 text-[10px] font-mono text-[#71717a] uppercase tracking-widest">camelot</span>
                <span className="col-span-2 text-[10px] font-mono text-[#71717a] uppercase tracking-widest">bpm</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {results.map(r => (
                  <div key={r.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[#1a1a1a] last:border-0 items-center">
                    <div className="col-span-5 min-w-0">
                      <div className="text-xs font-mono text-[#e4e4e7] truncate">{r.file.name}</div>
                      <div className="text-[10px] font-mono text-[#3f3f46]">{(r.file.size / 1024).toFixed(0)} KB</div>
                    </div>
                    <div className="col-span-3">
                      {r.status === "analyzing" && <span className="text-[10px] font-mono text-[#71717a]">analyzing...</span>}
                      {r.status === "done" && <span className="text-xs font-mono text-[#e4e4e7]">{r.key}</span>}
                      {r.status === "error" && <span className="text-[10px] font-mono text-[#EF4444]">error</span>}
                      {r.status === "pending" && <span className="text-[10px] font-mono text-[#3f3f46]">pending</span>}
                    </div>
                    <div className="col-span-2">
                      {r.camelot && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${accent}20`, color: accent }}>
                          {r.camelot}
                        </span>
                      )}
                    </div>
                    <div className="col-span-2">
                      {r.bpm && <span className="text-sm font-mono font-bold" style={{ color: accent }}>{r.bpm}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setResults([])} className="text-[10px] font-mono text-[#3f3f46] hover:text-[#71717a] w-full text-center">
              clear all
            </button>
          </>
        )}
      </div>
    </ToolShell>
  );
}
