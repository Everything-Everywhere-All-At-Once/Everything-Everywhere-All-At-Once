"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

type AudioInfo = {
  filename: string;
  size: number;
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  format: string;
  quality: "lossless" | "high" | "medium" | "low";
};

function getQuality(bitrate: number, format: string): AudioInfo["quality"] {
  const lossless = ["wav", "flac", "aiff", "aif"];
  if (lossless.includes(format)) return "lossless";
  if (bitrate >= 256) return "high";
  if (bitrate >= 128) return "medium";
  return "low";
}

const QUALITY_META = {
  lossless: { label: "Lossless", color: "#00FFFF", desc: "Perfect quality, no compression loss" },
  high:     { label: "High",     color: "#22C55E", desc: "Excellent quality, minimal loss" },
  medium:   { label: "Medium",   color: "#FACC15", desc: "Good quality, some compression" },
  low:      { label: "Low",      color: "#EF4444", desc: "Noticeable quality loss" },
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number) {
  if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + " MB";
  return (bytes / 1024).toFixed(1) + " KB";
}

export default function BitrateAnalyzerPage() {
  const [info, setInfo] = useState<AudioInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accent = "#00FFFF";

  const analyze = useCallback((file: File) => {
    setError(null);
    setInfo(null);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.src = url;
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      // Bitrate estimation: (filesize in bits) / duration
      const bitrate = Math.round((file.size * 8) / duration / 1000);
      const losslessFormats = ["wav", "flac", "aiff", "aif"];
      // For lossless formats show actual bit depth context
      const displayBitrate = losslessFormats.includes(ext)
        ? Math.round(file.size / duration / 1000) // kB/s
        : bitrate;

      // Try to get sample rate from AudioContext
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      file.arrayBuffer().then((buf) => {
        ctx.decodeAudioData(buf, (decoded) => {
          setInfo({
            filename: file.name,
            size: file.size,
            duration,
            bitrate: losslessFormats.includes(ext) ? displayBitrate : bitrate,
            sampleRate: decoded.sampleRate,
            channels: decoded.numberOfChannels,
            format: ext,
            quality: getQuality(bitrate, ext),
          });
          ctx.close();
          URL.revokeObjectURL(url);
        }, () => {
          // Fallback without decoded audio
          setInfo({
            filename: file.name,
            size: file.size,
            duration,
            bitrate,
            sampleRate: 44100,
            channels: 2,
            format: ext,
            quality: getQuality(bitrate, ext),
          });
          ctx.close();
          URL.revokeObjectURL(url);
        });
      });
    };

    audio.onerror = () => {
      setError("Could not read this file. Make sure it's a valid audio file.");
      URL.revokeObjectURL(url);
    };
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) analyze(f);
  }, [analyze]);

  return (
    <ToolShell
      category="Audio & Music"
      categoryHref="/tools/audio"
      accent={accent}
      title="Bitrate Analyzer"
      description="Check the bitrate, sample rate, duration, and quality of any audio file instantly."
    >
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
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
        <div className="text-sm text-[#71717a] font-mono">drop audio file here or click to browse</div>
        <div className="text-xs text-[#3f3f46] mt-2">MP3 · WAV · FLAC · OGG · AAC · M4A · AIFF</div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded border border-[#EF4444]/30 bg-[#EF4444]/08 text-xs text-[#EF4444] font-mono">
          {error}
        </div>
      )}

      {/* Results */}
      {info && (() => {
        const q = QUALITY_META[info.quality];
        const lossless = ["wav", "flac", "aiff", "aif"].includes(info.format);
        return (
          <div className="space-y-4">
            {/* Quality badge */}
            <div
              className="flex items-center gap-4 p-5 rounded border"
              style={{ borderColor: `${q.color}40`, backgroundColor: `${q.color}08` }}
            >
              <div
                className="w-12 h-12 rounded flex items-center justify-center text-lg font-bold font-mono shrink-0"
                style={{ backgroundColor: `${q.color}20`, color: q.color }}
              >
                {info.quality === "lossless" ? "∞" : info.bitrate + "k"}
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: q.color }}>{q.label} Quality</div>
                <div className="text-xs text-[#71717a] mt-0.5">{q.desc}</div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "filename", value: info.filename, full: true },
                { label: "format", value: info.format.toUpperCase() },
                { label: "file size", value: formatBytes(info.size) },
                { label: "duration", value: formatDuration(info.duration) },
                {
                  label: lossless ? "throughput" : "bitrate",
                  value: lossless ? `${info.bitrate} kB/s` : `${info.bitrate} kbps`,
                },
                { label: "sample rate", value: `${(info.sampleRate / 1000).toFixed(1)} kHz` },
                {
                  label: "channels",
                  value: info.channels === 1 ? "Mono" : info.channels === 2 ? "Stereo" : `${info.channels}ch`,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`p-3 rounded border border-[#2a2a2a] bg-[#141414] ${stat.full ? "col-span-2 sm:col-span-3" : ""}`}
                >
                  <div className="text-[10px] text-[#71717a] tracking-widest uppercase font-mono mb-1">{stat.label}</div>
                  <div className="text-sm text-[#e4e4e7] font-mono truncate">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Bitrate bar */}
            {!lossless && (
              <div>
                <div className="flex justify-between text-[10px] text-[#71717a] font-mono mb-2">
                  <span>0 kbps</span>
                  <span>320 kbps</span>
                </div>
                <div className="h-2 bg-[#1a1a1a] rounded overflow-hidden border border-[#2a2a2a]">
                  <div
                    className="h-full rounded transition-all duration-700"
                    style={{
                      width: `${Math.min((info.bitrate / 320) * 100, 100)}%`,
                      backgroundColor: q.color,
                    }}
                  />
                </div>
                <div className="text-[10px] text-[#71717a] font-mono mt-1 text-right">
                  {Math.round((info.bitrate / 320) * 100)}% of max (320 kbps)
                </div>
              </div>
            )}

            {/* Analyze another */}
            <button
              onClick={() => { setInfo(null); fileInputRef.current?.click(); }}
              className="w-full py-2.5 text-xs font-mono tracking-widest rounded border border-[#2a2a2a] text-[#71717a] hover:border-[#3f3f46] transition-all"
            >
              analyze another file
            </button>
          </div>
        );
      })()}

      {/* Info footer */}
      {!info && (
        <div className="mt-8 pt-6 border-t border-[#2a2a2a] grid grid-cols-3 gap-4 text-center text-[10px] text-[#3f3f46] font-mono">
          <div><div className="text-[#71717a] mb-1">privacy</div><div>files never uploaded</div></div>
          <div><div className="text-[#71717a] mb-1">engine</div><div>web audio api</div></div>
          <div><div className="text-[#71717a] mb-1">cost</div><div>free forever</div></div>
        </div>
      )}
    </ToolShell>
  );
}
