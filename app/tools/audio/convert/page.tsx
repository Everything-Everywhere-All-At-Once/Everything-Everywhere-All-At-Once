"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const OUTPUT_FORMATS = [
  { value: "mp3", label: "MP3", mime: "audio/mpeg" },
  { value: "wav", label: "WAV", mime: "audio/wav" },
  { value: "flac", label: "FLAC", mime: "audio/flac" },
  { value: "ogg", label: "OGG", mime: "audio/ogg" },
  { value: "aac", label: "AAC", mime: "audio/aac" },
  { value: "m4a", label: "M4A", mime: "audio/mp4" },
];

const BITRATES = ["64k", "128k", "192k", "256k", "320k"];

type Status = "idle" | "loading" | "converting" | "done" | "error";

export default function AudioConvertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState("mp3");
  const [bitrate, setBitrate] = useState("192k");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => setLog((prev) => [...prev.slice(-6), msg]);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = new FFmpeg();
    ffmpeg.on("log", ({ message }) => addLog(message));
    ffmpeg.on("progress", ({ progress: p }) => setProgress(Math.round(p * 100)));
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
    setLog([]);
    setProgress(0);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("audio/")) handleFile(f);
  }, []);

  const convert = async () => {
    if (!file) return;
    try {
      setStatus("loading");
      setLog([]);
      addLog("loading ffmpeg engine...");
      const ffmpeg = await loadFFmpeg();

      setStatus("converting");
      addLog(`converting to ${outputFormat.toUpperCase()}...`);

      const inputName = "input." + file.name.split(".").pop();
      const outName = file.name.replace(/\.[^.]+$/, "") + "." + outputFormat;
      setOutputName(outName);

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const args = ["-i", inputName];
      if (["mp3", "aac", "ogg"].includes(outputFormat)) {
        args.push("-b:a", bitrate);
      }
      args.push(outName);

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outName);
      const fmt = OUTPUT_FORMATS.find((f) => f.value === outputFormat);
      // .slice() copies into a plain ArrayBuffer, avoiding SharedArrayBuffer type conflict
      const uint8 = typeof data === "string"
        ? new TextEncoder().encode(data)
        : (data as Uint8Array).slice(0);
      const blob = new Blob([uint8], { type: fmt?.mime ?? "audio/mpeg" });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("done");
      addLog("done.");
    } catch (err) {
      console.error(err);
      setStatus("error");
      addLog("error: conversion failed.");
    }
  };

  const reset = () => {
    setFile(null);
    setDownloadUrl(null);
    setStatus("idle");
    setLog([]);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const accent = "#00FFFF";

  return (
    <ToolShell
      category="Audio & Music"
      categoryHref="/tools/audio"
      accent={accent}
      title="Format Converter"
      description="Convert audio files between MP3, WAV, FLAC, OGG, AAC, and M4A — entirely in your browser. Files never leave your device."
    >
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className="relative border border-dashed rounded cursor-pointer transition-all duration-200 p-10 text-center mb-6"
        style={{
          borderColor: isDragging ? accent : file ? "#2a2a2a" : "#2a2a2a",
          backgroundColor: isDragging ? `${accent}08` : "transparent",
          boxShadow: isDragging ? `0 0 20px ${accent}20` : "none",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <div>
            <div className="text-sm text-[#e4e4e7] font-mono mb-1">{file.name}</div>
            <div className="text-xs text-[#71717a]">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
          </div>
        ) : (
          <div>
            <div className="text-sm text-[#71717a] font-mono">drop audio file here or click to browse</div>
            <div className="text-xs text-[#3f3f46] mt-2">MP3 · WAV · FLAC · OGG · AAC · M4A · AIFF</div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Output format */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase mb-2 font-mono">
            output format
          </label>
          <div className="flex flex-wrap gap-2">
            {OUTPUT_FORMATS.map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => setOutputFormat(fmt.value)}
                className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                style={
                  outputFormat === fmt.value
                    ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` }
                    : { borderColor: "#2a2a2a", color: "#71717a" }
                }
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bitrate (only for lossy formats) */}
        {["mp3", "aac", "ogg"].includes(outputFormat) && (
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase mb-2 font-mono">
              bitrate
            </label>
            <div className="flex flex-wrap gap-2">
              {BITRATES.map((b) => (
                <button
                  key={b}
                  onClick={() => setBitrate(b)}
                  className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                  style={
                    bitrate === b
                      ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` }
                      : { borderColor: "#2a2a2a", color: "#71717a" }
                  }
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Convert button */}
      <button
        onClick={convert}
        disabled={!file || status === "loading" || status === "converting"}
        className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30 disabled:cursor-not-allowed mb-6"
        style={{
          borderColor: accent,
          color: status === "done" ? "#0d0d0d" : accent,
          backgroundColor: status === "done" ? accent : `${accent}15`,
        }}
      >
        {status === "loading" && "loading engine..."}
        {status === "converting" && `converting... ${progress}%`}
        {status === "done" && "converted ✓"}
        {status === "idle" && "convert"}
        {status === "error" && "retry"}
      </button>

      {/* Progress bar */}
      {(status === "converting" || status === "loading") && (
        <div className="mb-6 h-px bg-[#2a2a2a] rounded overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded"
            style={{ width: `${status === "loading" ? 10 : progress}%`, backgroundColor: accent }}
          />
        </div>
      )}

      {/* Download */}
      {downloadUrl && (
        <div
          className="flex items-center justify-between p-4 rounded border mb-6"
          style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}
        >
          <div>
            <div className="text-xs font-mono text-[#e4e4e7]">{outputName}</div>
            <div className="text-[10px] text-[#71717a] mt-0.5">ready to download</div>
          </div>
          <div className="flex gap-2">
            <a
              href={downloadUrl}
              download={outputName}
              className="px-4 py-2 text-xs font-mono rounded tracking-widest transition-all"
              style={{ backgroundColor: accent, color: "#0d0d0d" }}
            >
              download
            </a>
            <button
              onClick={reset}
              className="px-4 py-2 text-xs font-mono rounded border tracking-widest transition-all"
              style={{ borderColor: "#2a2a2a", color: "#71717a" }}
            >
              reset
            </button>
          </div>
        </div>
      )}

      {/* Terminal log */}
      {log.length > 0 && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 font-mono text-[11px] text-[#71717a] space-y-1">
          {log.map((line, i) => (
            <div key={i} className="flex gap-2">
              <span style={{ color: accent }} className="opacity-60">$</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 pt-6 border-t border-[#2a2a2a] grid grid-cols-3 gap-4 text-center text-[10px] text-[#3f3f46] font-mono">
        <div>
          <div className="text-[#71717a] mb-1">privacy</div>
          <div>files never uploaded</div>
        </div>
        <div>
          <div className="text-[#71717a] mb-1">engine</div>
          <div>ffmpeg.wasm</div>
        </div>
        <div>
          <div className="text-[#71717a] mb-1">cost</div>
          <div>free forever</div>
        </div>
      </div>
    </ToolShell>
  );
}
