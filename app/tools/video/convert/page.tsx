"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const accent = "#F97316";

const FORMATS = [
  { value: "mp4",  label: "MP4",  mime: "video/mp4",       codec: ["-c:v", "libx264", "-c:a", "aac"] },
  { value: "webm", label: "WebM", mime: "video/webm",      codec: ["-c:v", "libvpx-vp9", "-c:a", "libopus"] },
  { value: "mov",  label: "MOV",  mime: "video/quicktime", codec: ["-c:v", "libx264", "-c:a", "aac"] },
  { value: "avi",  label: "AVI",  mime: "video/x-msvideo", codec: ["-c:v", "mpeg4", "-c:a", "mp3"] },
  { value: "mkv",  label: "MKV",  mime: "video/x-matroska",codec: ["-c:v", "libx264", "-c:a", "aac"] },
];

const QUALITIES = [
  { label: "High",   crf: "18", desc: "Large file, best quality" },
  { label: "Medium", crf: "23", desc: "Balanced (recommended)" },
  { label: "Low",    crf: "28", desc: "Small file, lower quality" },
];

export default function VideoConvertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState(FORMATS[0]);
  const [quality, setQuality] = useState(QUALITIES[1]);
  const [status, setStatus] = useState<"idle"|"loading"|"converting"|"done"|"error">("idle");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string|null>(null);
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

  const convert = async () => {
    if (!file) return;
    try {
      setStatus("loading"); setLog([]); addLog("loading engine...");
      const ffmpeg = await loadFFmpeg();
      setStatus("converting");
      const ext = file.name.split(".").pop() ?? "mp4";
      const input = `input.${ext}`;
      const out = file.name.replace(/\.[^.]+$/, "") + "." + outputFormat.value;
      await ffmpeg.writeFile(input, await fetchFile(file));
      await ffmpeg.exec(["-i", input, ...outputFormat.codec, "-crf", quality.crf, "-preset", "fast", out]);
      const data = await ffmpeg.readFile(out);
      const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : (data as Uint8Array).slice(0);
      setDownloadUrl(URL.createObjectURL(new Blob([uint8], { type: outputFormat.mime })));
      setStatus("done"); addLog("done.");
    } catch { setStatus("error"); addLog("error: conversion failed."); }
  };

  return (
    <ToolShell category="Video" categoryHref="/tools/video" accent={accent} title="Video Converter" description="Convert video between MP4, WebM, MOV, AVI, and MKV — in-browser via ffmpeg.wasm.">
      <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed rounded p-10 text-center mb-6 cursor-pointer transition-all"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setDownloadUrl(null); setStatus("idle"); } }} />
        {file ? (
          <div className="font-mono text-sm text-[#e4e4e7]">{file.name} <span className="text-[#71717a]">· {(file.size/1024/1024).toFixed(1)} MB</span></div>
        ) : (
          <><div className="text-3xl mb-2 opacity-20">▶</div><div className="text-sm text-[#71717a] font-mono">drop video or click to browse</div><div className="text-xs text-[#3f3f46] mt-1">MP4 · MOV · AVI · WebM · MKV · FLV</div></>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">output format</label>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map(f => (
              <button key={f.value} onClick={() => setOutputFormat(f)}
                className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                style={outputFormat.value === f.value ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">quality</label>
          <div className="flex gap-2">
            {QUALITIES.map(q => (
              <button key={q.crf} onClick={() => setQuality(q)}
                className="flex-1 px-2 py-1.5 text-xs font-mono rounded border transition-all"
                style={quality.crf === q.crf ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {q.label}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-[#3f3f46] font-mono mt-1">{quality.desc}</div>
        </div>
      </div>

      <button onClick={convert} disabled={!file || status === "loading" || status === "converting"}
        className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30 mb-4"
        style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
        {status === "loading" ? "loading engine..." : status === "converting" ? `converting... ${progress}%` : status === "done" ? "converted ✓" : "convert"}
      </button>

      {(status === "converting" || status === "loading") && (
        <div className="mb-4 h-px bg-[#2a2a2a] rounded overflow-hidden">
          <div className="h-full transition-all duration-300 rounded" style={{ width: `${status === "loading" ? 5 : progress}%`, backgroundColor: accent }} />
        </div>
      )}

      {downloadUrl && (
        <div className="flex items-center justify-between p-4 rounded border mb-4" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
          <div className="text-xs font-mono text-[#e4e4e7]">{file?.name.replace(/\.[^.]+$/, "") + "." + outputFormat.value}</div>
          <a href={downloadUrl} download={file?.name.replace(/\.[^.]+$/, "") + "." + outputFormat.value}
            className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>download</a>
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
