"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ToolShell } from "@/components/tool-shell";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const accent = "#00FFFF";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(Math.floor(s % 60)).toString().padStart(2, "0")}.${(Math.floor((s % 1) * 10))}`;
}

export default function AudioTrimPage() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "trimming" | "done" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);

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

  const handleFile = (f: File) => {
    setFile(f);
    setDownloadUrl(null);
    setStatus("idle");
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    const url = URL.createObjectURL(f);
    previewUrl.current = url;
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      setStart(0);
      setEnd(audio.duration);
    };
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("audio/")) handleFile(f);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.currentTime = start;
      audio.play();
      setIsPlaying(true);
      const check = setInterval(() => {
        if (audio.currentTime >= end) {
          audio.pause();
          setIsPlaying(false);
          clearInterval(check);
        }
      }, 100);
    }
  };

  const trim = async () => {
    if (!file) return;
    try {
      setStatus("loading");
      const ffmpeg = await loadFFmpeg();
      setStatus("trimming");
      const ext = file.name.split(".").pop() ?? "mp3";
      const inputName = `input.${ext}`;
      const out = file.name.replace(/\.[^.]+$/, "") + `_trim.${ext}`;
      setOutputName(out);
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      await ffmpeg.exec(["-i", inputName, "-ss", String(start), "-to", String(end), "-c", "copy", out]);
      const data = await ffmpeg.readFile(out);
      const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : (data as Uint8Array).slice(0);
      const blob = new Blob([uint8], { type: file.type });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    audioRef.current = new Audio();
    return () => { audioRef.current?.pause(); if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); };
  }, []);

  const trimDuration = end - start;

  return (
    <ToolShell category="Audio & Music" categoryHref="/tools/audio" accent={accent} title="Audio Trimmer" description="Cut any audio file to a precise range — no uploads, no quality loss on lossless formats.">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !file && fileInputRef.current?.click()}
        className="border border-dashed rounded transition-all duration-200 p-8 text-center mb-6 cursor-pointer"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}
      >
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {file ? (
          <div className="font-mono text-sm text-[#e4e4e7]">{file.name} <span className="text-[#71717a]">— {formatTime(duration)}</span></div>
        ) : (
          <>
            <div className="text-sm text-[#71717a] font-mono">drop audio file or click to browse</div>
          </>
        )}
      </div>

      {file && duration > 0 && (
        <div className="space-y-6">
          {/* Waveform-style range display */}
          <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
            <div className="flex justify-between text-[10px] text-[#71717a] font-mono mb-3">
              <span>0:00</span>
              <span className="text-[#00FFFF]">{formatTime(start)} → {formatTime(end)} ({formatTime(trimDuration)})</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Visual range bar */}
            <div className="relative h-10 bg-[#0d0d0d] rounded overflow-hidden border border-[#2a2a2a] mb-4">
              <div className="absolute inset-y-0 bg-[#00FFFF]/10 border-x border-[#00FFFF]/60 transition-all"
                style={{ left: `${(start / duration) * 100}%`, right: `${100 - (end / duration) * 100}%` }} />
              {/* Mini waveform bars */}
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} className="absolute bottom-0 w-px bg-[#2a2a2a]"
                  style={{ left: `${(i / 80) * 100}%`, height: `${30 + Math.random() * 70}%` }} />
              ))}
            </div>

            {/* Start slider */}
            <div className="mb-3">
              <label className="text-[10px] text-[#71717a] font-mono tracking-widest uppercase block mb-1">start — {formatTime(start)}</label>
              <input type="range" min={0} max={duration} step={0.1} value={start}
                onChange={(e) => setStart(Math.min(Number(e.target.value), end - 0.5))}
                className="w-full accent-[#00FFFF] bg-[#2a2a2a] h-1 rounded appearance-none cursor-pointer" />
            </div>

            {/* End slider */}
            <div>
              <label className="text-[10px] text-[#71717a] font-mono tracking-widest uppercase block mb-1">end — {formatTime(end)}</label>
              <input type="range" min={0} max={duration} step={0.1} value={end}
                onChange={(e) => setEnd(Math.max(Number(e.target.value), start + 0.5))}
                className="w-full accent-[#00FFFF] bg-[#2a2a2a] h-1 rounded appearance-none cursor-pointer" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button onClick={togglePlay} className="px-4 py-2.5 text-xs font-mono border rounded border-[#2a2a2a] text-[#71717a] hover:border-[#00FFFF] hover:text-[#00FFFF] transition-all">
              {isPlaying ? "⏸ pause" : "▶ preview"}
            </button>
            <button onClick={trim} disabled={status === "loading" || status === "trimming"}
              className="flex-1 py-2.5 text-xs font-mono rounded border transition-all disabled:opacity-30"
              style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
              {status === "loading" ? "loading engine..." : status === "trimming" ? "trimming..." : status === "done" ? "trimmed ✓" : "trim audio"}
            </button>
          </div>

          {downloadUrl && (
            <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
              <div>
                <div className="text-xs font-mono text-[#e4e4e7]">{outputName}</div>
                <div className="text-[10px] text-[#71717a] mt-0.5">{formatTime(trimDuration)} trimmed</div>
              </div>
              <a href={downloadUrl} download={outputName} className="px-4 py-2 text-xs font-mono rounded tracking-widest" style={{ backgroundColor: accent, color: "#0d0d0d" }}>
                download
              </a>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
