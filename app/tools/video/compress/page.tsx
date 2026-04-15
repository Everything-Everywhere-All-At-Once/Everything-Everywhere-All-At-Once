"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const accent = "#F97316";

const PRESETS = [
  { label: "Max Compression", crf: "32", desc: "Smallest file, lower quality" },
  { label: "Balanced",        crf: "26", desc: "Good compression, good quality" },
  { label: "High Quality",    crf: "20", desc: "Minimal compression, best quality" },
];

export default function VideoCompressPage() {
  const [file, setFile] = useState<File|null>(null);
  const [preset, setPreset] = useState(PRESETS[1]);
  const [crf, setCrf] = useState(26);
  const [status, setStatus] = useState<"idle"|"loading"|"compressing"|"done"|"error">("idle");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string|null>(null);
  const [resultSize, setResultSize] = useState<number|null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const ffmpegRef = useRef<FFmpeg|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (m: string) => setLog(p => [...p.slice(-5), m]);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = new FFmpeg();
    ffmpeg.on("log", ({ message }) => addLog(message));
    ffmpeg.on("progress", ({ progress: p }) => setProgress(Math.round(p * 100)));
    const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("video/")) { setFile(f); setDownloadUrl(null); setStatus("idle"); }
  }, []);

  const compress = async () => {
    if (!file) return;
    try {
      setStatus("loading"); setLog([]); addLog("loading engine...");
      const ffmpeg = await loadFFmpeg();
      setStatus("compressing"); addLog(`compressing at CRF ${crf}...`);
      const ext = file.name.split(".").pop() ?? "mp4";
      const input = `input.${ext}`;
      const out = file.name.replace(/\.[^.]+$/, "") + "_compressed.mp4";
      await ffmpeg.writeFile(input, await fetchFile(file));
      await ffmpeg.exec(["-i", input, "-c:v", "libx264", "-crf", String(crf), "-preset", "fast", "-c:a", "aac", "-b:a", "128k", out]);
      const data = await ffmpeg.readFile(out);
      const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : (data as Uint8Array).slice(0);
      const blob = new Blob([uint8], { type: "video/mp4" });
      setResultSize(blob.size);
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("done"); addLog("done.");
    } catch { setStatus("error"); addLog("error."); }
  };

  const savings = file && resultSize ? Math.round((1 - resultSize / file.size) * 100) : 0;

  return (
    <ToolShell category="Video" categoryHref="/tools/video" accent={accent} title="Video Compressor" description="Reduce video file size using H.264 encoding with adjustable quality — outputs MP4.">
      <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed rounded p-8 text-center mb-6 cursor-pointer transition-all"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setDownloadUrl(null); setStatus("idle"); } }} />
        {file ? (
          <div><div className="font-mono text-sm text-[#e4e4e7]">{file.name}</div><div className="text-xs text-[#71717a] font-mono mt-1">{(file.size/1024/1024).toFixed(1)} MB</div></div>
        ) : <><div className="text-sm text-[#71717a] font-mono">drop video or click to browse</div></>}
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {PRESETS.map(p => (
          <button key={p.crf} onClick={() => { setPreset(p); setCrf(Number(p.crf)); }}
            className="p-3 rounded border text-left transition-all"
            style={preset.crf === p.crf ? { borderColor: accent, backgroundColor: `${accent}10` } : { borderColor: "#2a2a2a", backgroundColor: "#141414" }}>
            <div className="text-xs font-mono" style={{ color: preset.crf === p.crf ? accent : "#e4e4e7" }}>{p.label}</div>
            <div className="text-[10px] text-[#3f3f46] font-mono mt-0.5">CRF {p.crf}</div>
          </button>
        ))}
      </div>

      {/* Fine CRF control */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 mb-6">
        <div className="flex justify-between text-[10px] text-[#71717a] font-mono mb-2">
          <span>higher quality (larger)</span>
          <span style={{ color: accent }}>CRF {crf}</span>
          <span>smaller file (lower quality)</span>
        </div>
        <input type="range" min={16} max={36} step={1} value={crf}
          onChange={e => setCrf(Number(e.target.value))}
          className="w-full cursor-pointer" style={{ accentColor: accent }} />
      </div>

      <button onClick={compress} disabled={!file || status === "loading" || status === "compressing"}
        className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30 mb-4"
        style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
        {status === "loading" ? "loading engine..." : status === "compressing" ? `compressing... ${progress}%` : status === "done" ? "compressed ✓" : "compress"}
      </button>

      {(status === "compressing" || status === "loading") && (
        <div className="mb-4 h-px bg-[#2a2a2a] rounded overflow-hidden">
          <div className="h-full transition-all duration-300 rounded" style={{ width: `${status === "loading" ? 5 : progress}%`, backgroundColor: accent }} />
        </div>
      )}

      {downloadUrl && resultSize && (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[{ label: "original", value: `${(file!.size/1024/1024).toFixed(1)} MB` }, { label: "compressed", value: `${(resultSize/1024/1024).toFixed(1)} MB`, color: accent }, { label: "saved", value: `${savings}%`, color: "#22C55E" }].map(s => (
              <div key={s.label} className="p-3 rounded border border-[#2a2a2a] bg-[#141414]">
                <div className="text-[10px] text-[#71717a] font-mono uppercase tracking-widest mb-1">{s.label}</div>
                <div className="text-sm font-mono font-bold" style={{ color: s.color ?? "#e4e4e7" }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
            <div className="text-xs font-mono text-[#e4e4e7]">{file?.name.replace(/\.[^.]+$/, "")}_compressed.mp4</div>
            <a href={downloadUrl} download className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>download</a>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 font-mono text-[11px] text-[#71717a] space-y-1">
          {log.map((l, i) => <div key={i} className="flex gap-2"><span style={{ color: accent }} className="opacity-60">$</span><span>{l}</span></div>)}
        </div>
      )}
    </ToolShell>
  );
}
