"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { DEVICES } from "@/lib/dj/devices";
import { analyzeFiles, type FileReport } from "@/lib/dj/analyze";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const accent = "#EF4444";

type Step = "device" | "files" | "results";

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function StatusBadge({ status }: { status: FileReport["status"] }) {
  const map = {
    pass: { color: "#22C55E", label: "PASS" },
    warn: { color: "#FACC15", label: "WARN" },
    fail: { color: "#EF4444", label: "FAIL" },
  };
  const { color, label } = map[status];
  return (
    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
      style={{ borderColor: `${color}60`, color, backgroundColor: `${color}15` }}>
      {label}
    </span>
  );
}

export default function USBCheckPage() {
  const [step, setStep] = useState<Step>("device");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [reports, setReports] = useState<FileReport[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fixingIndex, setFixingIndex] = useState<number | null>(null);
  const [fixedUrls, setFixedUrls] = useState<Record<number, string>>({});
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const device = DEVICES.find((d) => d.id === selectedDevice);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("audio/") || /\.(mp3|wav|flac|aac|ogg|aiff|aif|m4a|wma)$/i.test(f.name));
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...arr.filter((f) => !names.has(f.name))];
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const runAnalysis = async () => {
    if (!device || files.length === 0) return;
    setAnalyzing(true);
    const results = await analyzeFiles(files, device);
    setReports(results);
    setAnalyzing(false);
    setStep("results");
    setFixedUrls({});
  };

  const fixFile = async (index: number) => {
    const report = reports[index];
    if (!report || !device) return;
    setFixingIndex(index);
    try {
      const ffmpeg = await loadFFmpeg();
      const ext = report.ext;
      const inputName = `input.${ext}`;
      const outExt = device.formats.includes("mp3") ? "mp3" : "wav";
      const outName = report.name.replace(/\.[^.]+$/, "") + `_fixed.${outExt}`;

      await ffmpeg.writeFile(inputName, await fetchFile(report.file));

      const args = ["-i", inputName];

      // Fix sample rate if needed
      const targetSR = device.sampleRates[0]; // 44100
      if (!device.sampleRates.includes(report.sampleRate)) {
        args.push("-ar", String(targetSR));
      }

      // Fix bitrate for lossy output
      if (outExt === "mp3") {
        args.push("-b:a", `${device.maxBitrateKbps}k`);
        args.push("-codec:a", "libmp3lame");
      } else {
        args.push("-codec:a", "pcm_s16le");
      }

      args.push(outName);
      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outName);
      const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : (data as Uint8Array).slice(0);
      const blob = new Blob([uint8], { type: outExt === "mp3" ? "audio/mpeg" : "audio/wav" });
      const url = URL.createObjectURL(blob);
      setFixedUrls((prev) => ({ ...prev, [index]: url }));
    } catch (err) {
      console.error(err);
    }
    setFixingIndex(null);
  };

  const summary = {
    pass: reports.filter((r) => r.status === "pass").length,
    warn: reports.filter((r) => r.status === "warn").length,
    fail: reports.filter((r) => r.status === "fail").length,
  };

  return (
    <ToolShell
      category="DJ Tools"
      categoryHref="/tools/dj"
      accent={accent}
      title="USB Compatibility Checker"
      description="Upload your tracks, select your device — we'll tell you exactly what plays and what won't, and fix it."
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-xs font-mono">
        {(["device", "files", "results"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => { if (s !== "results" || reports.length > 0) setStep(s); }}
              className="flex items-center gap-2 transition-colors"
              style={{ color: step === s ? accent : s === "results" && reports.length === 0 ? "#3f3f46" : "#71717a" }}
            >
              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]"
                style={{ borderColor: step === s ? accent : "#2a2a2a", backgroundColor: step === s ? `${accent}20` : "transparent" }}>
                {i + 1}
              </span>
              {s}
            </button>
            {i < 2 && <div className="w-8 h-px bg-[#2a2a2a]" />}
          </div>
        ))}
      </div>

      {/* STEP 1: Device selection */}
      {step === "device" && (
        <div>
          <h2 className="text-xs tracking-widest text-[#71717a] font-mono uppercase mb-4">select your device</h2>

          {/* Pioneer */}
          <div className="mb-6">
            <div className="text-[10px] tracking-widest text-[#EF4444]/60 font-mono uppercase mb-3">Pioneer</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEVICES.filter((d) => d.brand === "Pioneer").map((d) => (
                <button key={d.id} onClick={() => setSelectedDevice(d.id)}
                  className="p-3 rounded border text-left transition-all group"
                  style={selectedDevice === d.id
                    ? { borderColor: accent, backgroundColor: `${accent}10` }
                    : { borderColor: "#2a2a2a", backgroundColor: "#141414" }}>
                  <div className="font-mono text-sm font-bold" style={{ color: selectedDevice === d.id ? accent : "#e4e4e7" }}>
                    {d.shortName}
                  </div>
                  <div className="text-[10px] text-[#3f3f46] font-mono mt-1">
                    {d.flac ? "FLAC ✓" : "no FLAC"} · {d.fat32Required ? "FAT32" : "FAT32/exFAT"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Denon */}
          <div className="mb-8">
            <div className="text-[10px] tracking-widest text-[#EF4444]/60 font-mono uppercase mb-3">Denon</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEVICES.filter((d) => d.brand === "Denon").map((d) => (
                <button key={d.id} onClick={() => setSelectedDevice(d.id)}
                  className="p-3 rounded border text-left transition-all"
                  style={selectedDevice === d.id
                    ? { borderColor: accent, backgroundColor: `${accent}10` }
                    : { borderColor: "#2a2a2a", backgroundColor: "#141414" }}>
                  <div className="font-mono text-sm font-bold" style={{ color: selectedDevice === d.id ? accent : "#e4e4e7" }}>
                    {d.shortName}
                  </div>
                  <div className="text-[10px] text-[#3f3f46] font-mono mt-1">
                    FLAC ✓ · OGG ✓ · {d.maxFilesPerFolder}+ files
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Device spec preview */}
          {device && (
            <div className="p-4 rounded border border-[#2a2a2a] bg-[#141414] mb-6 font-mono text-xs space-y-2">
              <div className="text-[#EF4444] font-bold mb-3">{device.brand} {device.model} — specs</div>
              <div className="grid grid-cols-2 gap-2 text-[#71717a]">
                <div>formats: <span className="text-[#e4e4e7]">{device.formats.map((f) => f.toUpperCase()).join(", ")}</span></div>
                <div>max bitrate: <span className="text-[#e4e4e7]">{device.maxBitrateKbps} kbps</span></div>
                <div>sample rates: <span className="text-[#e4e4e7]">{device.sampleRates.map((s) => s / 1000 + "k").join(", ")}</span></div>
                <div>max file size: <span className="text-[#e4e4e7]">{device.maxFileSizeMB >= 4096 ? "4 GB" : "2 GB"}</span></div>
                <div>USB format: <span className="text-[#e4e4e7]">{device.fat32Required ? "FAT32 only" : "FAT32 / exFAT"}</span></div>
                <div>FLAC: <span style={{ color: device.flac ? "#22C55E" : "#EF4444" }}>{device.flac ? "supported" : "not supported"}</span></div>
              </div>
              {device.notes.map((n, i) => (
                <div key={i} className="text-[#3f3f46] flex gap-2"><span className="text-[#EF4444]/40">!</span>{n}</div>
              ))}
            </div>
          )}

          <button onClick={() => setStep("files")} disabled={!selectedDevice}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: "#0d0d0d", backgroundColor: selectedDevice ? accent : "transparent" }}>
            continue →
          </button>
        </div>
      )}

      {/* STEP 2: File upload */}
      {step === "files" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs tracking-widest text-[#71717a] font-mono uppercase">upload your tracks</h2>
            <span className="text-xs font-mono" style={{ color: accent }}>{device?.shortName}</span>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed rounded cursor-pointer transition-all duration-200 p-10 text-center mb-4"
            style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
            <input ref={fileInputRef} type="file" accept="audio/*" multiple className="hidden"
              onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }} />
            <div className="text-3xl mb-3 opacity-20">⏺</div>
            <div className="text-sm text-[#71717a] font-mono">drop your USB tracks here or click to browse</div>
            <div className="text-xs text-[#3f3f46] mt-2">select all files from your USB — multiple files supported</div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="border border-[#2a2a2a] rounded overflow-hidden mb-6">
              <div className="px-4 py-2 bg-[#141414] border-b border-[#2a2a2a] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#71717a] tracking-widest uppercase">{files.length} file{files.length !== 1 ? "s" : ""} queued</span>
                <button onClick={() => setFiles([])} className="text-[10px] text-[#3f3f46] hover:text-[#EF4444] font-mono transition-colors">clear all</button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a] last:border-0">
                    <div>
                      <div className="text-xs font-mono text-[#e4e4e7] truncate max-w-[280px]">{f.name}</div>
                      <div className="text-[10px] text-[#3f3f46] font-mono">{(f.size / 1024 / 1024).toFixed(1)} MB · {f.name.split(".").pop()?.toUpperCase()}</div>
                    </div>
                    <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="text-[#3f3f46] hover:text-[#EF4444] text-xs font-mono transition-colors ml-4">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={runAnalysis} disabled={files.length === 0 || analyzing}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: "#0d0d0d", backgroundColor: files.length > 0 ? accent : "transparent" }}>
            {analyzing ? "analyzing files..." : `analyze ${files.length} file${files.length !== 1 ? "s" : ""} →`}
          </button>
        </div>
      )}

      {/* STEP 3: Results */}
      {step === "results" && reports.length > 0 && (
        <div>
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "pass", count: summary.pass, color: "#22C55E" },
              { label: "warnings", count: summary.warn, color: "#FACC15" },
              { label: "fail", count: summary.fail, color: "#EF4444" },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded border border-[#2a2a2a] bg-[#141414] text-center">
                <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.count}</div>
                <div className="text-[10px] text-[#71717a] font-mono tracking-widest mt-1 uppercase">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Overall verdict */}
          {summary.fail === 0 && summary.warn === 0 && (
            <div className="p-4 rounded border border-[#22C55E]/30 bg-[#22C55E]/08 text-sm font-mono text-[#22C55E] mb-6">
              ✓ All {reports.length} files are fully compatible with the {device?.shortName}. Your USB is ready.
            </div>
          )}
          {summary.fail > 0 && (
            <div className="p-4 rounded border border-[#EF4444]/30 bg-[#EF4444]/08 text-sm font-mono text-[#EF4444] mb-6">
              ✗ {summary.fail} file{summary.fail !== 1 ? "s" : ""} will NOT play on the {device?.shortName}. Use the fix button to convert them.
            </div>
          )}

          {/* File reports */}
          <div className="space-y-3">
            {reports.map((report, i) => (
              <div key={i} className="border border-[#2a2a2a] rounded overflow-hidden">
                {/* File header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#141414] border-b border-[#2a2a2a]">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={report.status} />
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-[#e4e4e7] truncate">{report.name}</div>
                      <div className="text-[10px] text-[#3f3f46] font-mono mt-0.5">
                        {report.ext.toUpperCase()} · {report.sizeMB.toFixed(1)} MB
                        {report.duration > 0 && ` · ${formatDuration(report.duration)}`}
                        {report.estimatedBitrateKbps > 0 && ` · ~${report.estimatedBitrateKbps} kbps`}
                        {report.sampleRate > 0 && ` · ${report.sampleRate / 1000} kHz`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {report.status !== "pass" && !fixedUrls[i] && (
                      <button
                        onClick={() => fixFile(i)}
                        disabled={fixingIndex !== null}
                        className="px-3 py-1.5 text-[10px] font-mono rounded border transition-all disabled:opacity-40"
                        style={{ borderColor: `${accent}60`, color: accent, backgroundColor: `${accent}10` }}>
                        {fixingIndex === i ? "fixing..." : "auto-fix"}
                      </button>
                    )}
                    {fixedUrls[i] && (
                      <a href={fixedUrls[i]} download={report.name.replace(/\.[^.]+$/, "_fixed.mp3")}
                        className="px-3 py-1.5 text-[10px] font-mono rounded"
                        style={{ backgroundColor: "#22C55E", color: "#0d0d0d" }}>
                        download
                      </a>
                    )}
                  </div>
                </div>

                {/* Issues */}
                {report.issues.length > 0 && (
                  <div className="divide-y divide-[#1a1a1a]">
                    {report.issues.map((issue, j) => (
                      <div key={j} className="px-4 py-2.5 flex items-start gap-3">
                        <span className="text-[10px] font-mono shrink-0 mt-0.5"
                          style={{ color: issue.level === "error" ? "#EF4444" : "#FACC15" }}>
                          {issue.level === "error" ? "!" : "!"}
                        </span>
                        <div>
                          <span className="text-[10px] text-[#71717a] font-mono">[{issue.field}] </span>
                          <span className="text-[11px] text-[#e4e4e7] font-mono">{issue.message}</span>
                          {issue.fixHint && (
                            <div className="text-[10px] text-[#3f3f46] font-mono mt-0.5">→ {issue.fixHint}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {report.status === "pass" && (
                  <div className="px-4 py-2.5 text-[11px] font-mono text-[#22C55E]/60">✓ no issues found</div>
                )}
              </div>
            ))}
          </div>

          {/* Re-analyze */}
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setStep("files"); setReports([]); setFixedUrls({}); }}
              className="flex-1 py-2.5 text-xs font-mono tracking-widest rounded border border-[#2a2a2a] text-[#71717a] hover:border-[#3f3f46] transition-all">
              ← add more files
            </button>
            <button onClick={() => { setStep("device"); setFiles([]); setReports([]); setFixedUrls({}); setSelectedDevice(null); }}
              className="flex-1 py-2.5 text-xs font-mono tracking-widest rounded border transition-all"
              style={{ borderColor: accent, color: accent, backgroundColor: `${accent}10` }}>
              start over
            </button>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
