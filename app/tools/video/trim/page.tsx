"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ToolShell } from "@/components/tool-shell";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const accent = "#F97316";

function fmt(s: number) {
  return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}.${Math.floor((s%1)*10)}`;
}

export default function VideoTrimPage() {
  const [file, setFile] = useState<File|null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [status, setStatus] = useState<"idle"|"loading"|"trimming"|"done"|"error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string|null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef<FFmpeg|null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string|null>(null);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress: p }) => setProgress(Math.round(p * 100)));
    const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const handleFile = (f: File) => {
    setFile(f); setDownloadUrl(null); setStatus("idle");
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    const url = URL.createObjectURL(f);
    previewUrl.current = url;
    if (videoRef.current) { videoRef.current.src = url; videoRef.current.load(); }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("video/")) handleFile(f);
  }, []);

  useEffect(() => {
    return () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); };
  }, []);

  const trim = async () => {
    if (!file) return;
    try {
      setStatus("loading");
      const ffmpeg = await loadFFmpeg();
      setStatus("trimming");
      const ext = file.name.split(".").pop() ?? "mp4";
      const input = `input.${ext}`;
      const out = file.name.replace(/\.[^.]+$/, "") + `_trim.${ext}`;
      await ffmpeg.writeFile(input, await fetchFile(file));
      await ffmpeg.exec(["-i", input, "-ss", String(start), "-to", String(end), "-c", "copy", out]);
      const data = await ffmpeg.readFile(out);
      const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : (data as Uint8Array).slice(0);
      setDownloadUrl(URL.createObjectURL(new Blob([uint8], { type: file.type })));
      setStatus("done");
    } catch { setStatus("error"); }
  };

  return (
    <ToolShell category="Video" categoryHref="/tools/video" accent={accent} title="Video Trimmer" description="Cut any video to a precise start/end point — no re-encoding, no quality loss.">
      <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
        onClick={() => !file && fileInputRef.current?.click()}
        className="border border-dashed rounded p-8 text-center mb-6 cursor-pointer transition-all"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {file ? <div className="font-mono text-sm text-[#e4e4e7]">{file.name}</div>
          : <><div className="text-sm text-[#71717a] font-mono">drop video or click to browse</div></>}
      </div>

      {file && (
        <div className="space-y-5">
          {/* Video preview */}
          <video ref={videoRef} controls className="w-full rounded border border-[#2a2a2a] bg-black max-h-48"
            onLoadedMetadata={e => { const d = (e.target as HTMLVideoElement).duration; setDuration(d); setEnd(d); }} />

          {/* Range sliders */}
          <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 space-y-4">
            <div className="flex justify-between text-xs font-mono text-[#71717a]">
              <span>0:00</span>
              <span style={{ color: accent }}>{fmt(start)} → {fmt(end)} ({fmt(end - start)})</span>
              <span>{fmt(duration)}</span>
            </div>
            {/* Visual range */}
            <div className="relative h-8 bg-[#0d0d0d] rounded border border-[#2a2a2a] overflow-hidden">
              <div className="absolute inset-y-0 border-x-2 bg-orange-500/10 transition-all"
                style={{ left: `${(start/duration)*100}%`, right: `${100-(end/duration)*100}%`, borderColor: accent }} />
            </div>
            <div>
              <label className="text-[10px] text-[#71717a] font-mono uppercase tracking-widest">start — {fmt(start)}</label>
              <input type="range" min={0} max={duration} step={0.1} value={start}
                onChange={e => { const v = Math.min(Number(e.target.value), end - 0.5); setStart(v); if (videoRef.current) videoRef.current.currentTime = v; }}
                className="w-full mt-1 cursor-pointer" style={{ accentColor: accent }} />
            </div>
            <div>
              <label className="text-[10px] text-[#71717a] font-mono uppercase tracking-widest">end — {fmt(end)}</label>
              <input type="range" min={0} max={duration} step={0.1} value={end}
                onChange={e => setEnd(Math.max(Number(e.target.value), start + 0.5))}
                className="w-full mt-1 cursor-pointer" style={{ accentColor: accent }} />
            </div>
          </div>

          <button onClick={trim} disabled={status === "loading" || status === "trimming"}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
            {status === "loading" ? "loading engine..." : status === "trimming" ? `trimming... ${progress}%` : status === "done" ? "trimmed ✓" : "trim video"}
          </button>

          {downloadUrl && (
            <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
              <div className="text-xs font-mono text-[#e4e4e7]">{file.name.replace(/\.[^.]+$/, "")}_trim</div>
              <a href={downloadUrl} download className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>download</a>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
