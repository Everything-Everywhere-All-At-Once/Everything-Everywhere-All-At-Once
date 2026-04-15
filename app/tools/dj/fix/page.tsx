"use client";

import { useState, useRef } from "react";
import { ToolShell } from "@/components/tool-shell";
import { DEVICES } from "@/lib/dj/devices";
import { analyzeFile } from "@/lib/dj/analyze";

const accent = "#EF4444";

type FileJob = {
  id: string;
  file: File;
  status: "pending" | "analyzing" | "converting" | "done" | "error" | "ok";
  issues: string[];
  outputUrl?: string;
  outputName?: string;
};

export default function DjFixPage() {
  const [deviceId, setDeviceId] = useState(DEVICES[0].id);
  const [jobs, setJobs] = useState<FileJob[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<import("@ffmpeg/ffmpeg").FFmpeg | null>(null);

  const device = DEVICES.find(d => d.id === deviceId)!;

  const addFiles = (files: FileList | File[]) => {
    const newJobs: FileJob[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      status: "pending",
      issues: [],
    }));
    setJobs(prev => [...prev, ...newJobs]);
  };

  const loadFfmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
    const ff = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ff.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ff;
    // Store fetchFile for later use
    (ffmpegRef as unknown as { fetchFile: typeof fetchFile }).fetchFile = fetchFile;
    return ff;
  };

  const fixAll = async () => {
    setRunning(true);
    const ff = await loadFfmpeg();
    const { fetchFile } = await import("@ffmpeg/util");

    for (const job of jobs.filter(j => j.status === "pending")) {
      // Analyze first
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: "analyzing" } : j));
      const report = await analyzeFile(job.file, device);
      const issues = report.issues.filter(c => c.level === "error" || c.level === "warn").map(c => c.message);

      if (report.status === "pass") {
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: "ok", issues: [] } : j));
        continue;
      }

      // Convert to MP3 320k (safe for all devices)
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: "converting", issues } : j));
      try {
        await ff.writeFile(job.file.name, await fetchFile(job.file));
        const outputName = job.file.name.replace(/\.[^.]+$/, "_fixed.mp3");
        await ff.exec(["-i", job.file.name, "-b:a", "320k", "-ar", "44100", "-ac", "2", outputName]);
        const data = await ff.readFile(outputName);
        const blob = new Blob([(data as Uint8Array).slice(0)], { type: "audio/mpeg" });
        setJobs(prev => prev.map(j => j.id === job.id ? {
          ...j, status: "done", issues,
          outputUrl: URL.createObjectURL(blob),
          outputName,
        } : j));
        await ff.deleteFile(job.file.name);
        await ff.deleteFile(outputName);
      } catch {
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: "error", issues } : j));
      }
    }
    setRunning(false);
  };

  const statusIcon = (s: FileJob["status"]) => {
    if (s === "ok" || s === "done") return { icon: "✓", color: "#22C55E" };
    if (s === "error") return { icon: "✕", color: "#EF4444" };
    if (s === "converting" || s === "analyzing") return { icon: "⟳", color: accent };
    return { icon: "—", color: "#3f3f46" };
  };

  return (
    <ToolShell category="DJ Tools" categoryHref="/tools/dj" accent={accent} title="Auto-Fix & Convert" description="Automatically detect and fix incompatible audio files for your device — converts to MP3 320k where needed.">
      <div className="space-y-5">
        {/* Device selector */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">target device</label>
          <div className="flex flex-wrap gap-2">
            {DEVICES.map(d => (
              <button key={d.id} onClick={() => setDeviceId(d.id)}
                className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                style={deviceId === d.id ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {d.shortName}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-[#3f3f46] mt-2">
            Supported: {device.formats.join(", ")} · Max {device.maxBitrateKbps}kbps · {device.sampleRates.map(s => s / 1000 + "kHz").join("/")}
          </div>
        </div>

        {/* Drop zone */}
        <div onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed rounded p-8 text-center cursor-pointer transition-all"
          style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
          <input ref={fileInputRef} type="file" accept="audio/*" multiple className="hidden"
            onChange={e => { if (e.target.files) addFiles(e.target.files); }} />
          <div className="text-sm text-[#71717a] font-mono">drop audio files or click to browse</div>
        </div>

        {jobs.length > 0 && (
          <>
            <div className="border border-[#2a2a2a] rounded overflow-hidden">
              <div className="px-4 py-2 bg-[#141414] border-b border-[#2a2a2a] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">{jobs.length} files</span>
                <button onClick={() => setJobs([])} className="text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">clear</button>
              </div>
              {jobs.map(job => {
                const { icon, color } = statusIcon(job.status);
                return (
                  <div key={job.id} className="px-4 py-3 border-b border-[#1a1a1a] last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm shrink-0 font-mono" style={{ color }}>{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-[#e4e4e7] truncate">{job.file.name}</div>
                        <div className="text-[10px] font-mono text-[#3f3f46]">
                          {job.status === "analyzing" ? "analyzing..." :
                           job.status === "converting" ? "converting to MP3 320k..." :
                           job.status === "ok" ? "no issues — already compatible" :
                           job.status === "done" ? "fixed & ready" :
                           job.status === "error" ? "conversion failed" :
                           `${(job.file.size / 1024).toFixed(0)} KB`}
                        </div>
                        {job.issues.length > 0 && (
                          <div className="text-[10px] font-mono text-[#71717a] mt-0.5">{job.issues.join(" · ")}</div>
                        )}
                      </div>
                      {job.outputUrl && (
                        <a href={job.outputUrl} download={job.outputName}
                          className="px-3 py-1 text-[10px] font-mono rounded shrink-0"
                          style={{ backgroundColor: "#22C55E", color: "#0d0d0d" }}>
                          download
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={fixAll} disabled={running || jobs.every(j => j.status !== "pending")}
              className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
              style={{ borderColor: accent, color: accent, backgroundColor: `${accent}15` }}>
              {running ? "processing..." : `auto-fix ${jobs.filter(j => j.status === "pending").length} files`}
            </button>

            <div className="text-[10px] text-[#3f3f46] font-mono text-center">
              incompatible files → MP3 320kbps 44.1kHz stereo · compatible for all Pioneer/Denon devices
            </div>
          </>
        )}
      </div>
    </ToolShell>
  );
}
