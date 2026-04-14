"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const accent = "#00E5FF";

const PRESETS = [
  { label: "Streaming", value: "-14", desc: "Spotify / Apple Music standard" },
  { label: "YouTube",   value: "-13", desc: "YouTube recommended" },
  { label: "Broadcast", value: "-23", desc: "EBU R128 broadcast standard" },
  { label: "CD",        value: "-9",  desc: "CD mastering level" },
];

export default function NormalizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLUFS, setTargetLUFS] = useState("-14");
  const [status, setStatus] = useState<"idle" | "loading" | "processing" | "done" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => setLog((p) => [...p.slice(-5), msg]);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = new FFmpeg();
    ffmpeg.on("log", ({ message }) => addLog(message));
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const handleFile = (f: File) => { setFile(f); setDownloadUrl(null); setStatus("idle"); setLog([]); };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("audio/")) handleFile(f);
  }, []);

  const normalize = async () => {
    if (!file) return;
    try {
      setStatus("loading");
      setLog([]);
      addLog("loading ffmpeg...");
      const ffmpeg = await loadFFmpeg();
      setStatus("processing");
      addLog(`normalizing to ${targetLUFS} LUFS...`);

      const ext = file.name.split(".").pop() ?? "mp3";
      const inputName = `input.${ext}`;
      const outName = file.name.replace(/\.[^.]+$/, "") + `_normalized.${ext}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Two-pass loudnorm normalization
      await ffmpeg.exec([
        "-i", inputName,
        "-af", `loudnorm=I=${targetLUFS}:TP=-1.5:LRA=11`,
        outName,
      ]);

      const data = await ffmpeg.readFile(outName);
      const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : (data as Uint8Array).slice(0);
      const blob = new Blob([uint8], { type: file.type });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("done");
      addLog("done.");
    } catch {
      setStatus("error");
      addLog("error: normalization failed.");
    }
  };

  return (
    <ToolShell category="Audio & Music" categoryHref="/tools/audio" accent={accent} title="Audio Normalizer" description="Normalize audio loudness to streaming, broadcast, or custom LUFS targets using ffmpeg loudnorm.">
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
          <div className="font-mono text-sm text-[#e4e4e7]">{file.name}</div>
        ) : (
          <>
            <div className="text-2xl mb-2 opacity-20">≋</div>
            <div className="text-sm text-[#71717a] font-mono">drop audio file or click to browse</div>
          </>
        )}
      </div>

      {/* Presets */}
      <div className="mb-4">
        <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">target loudness</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {PRESETS.map((p) => (
            <button key={p.value} onClick={() => setTargetLUFS(p.value)}
              className="p-3 rounded border text-left transition-all"
              style={targetLUFS === p.value
                ? { borderColor: accent, backgroundColor: `${accent}10` }
                : { borderColor: "#2a2a2a", backgroundColor: "#141414" }}>
              <div className="text-xs font-mono" style={{ color: targetLUFS === p.value ? accent : "#e4e4e7" }}>{p.label}</div>
              <div className="text-[10px] text-[#3f3f46] font-mono mt-0.5">{p.value} LUFS</div>
            </button>
          ))}
        </div>

        {/* Custom slider */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
          <div className="flex justify-between text-[10px] text-[#71717a] font-mono mb-2">
            <span>-30 LUFS (quiet)</span>
            <span style={{ color: accent }}>{targetLUFS} LUFS</span>
            <span>-6 LUFS (loud)</span>
          </div>
          <input type="range" min={-30} max={-6} step={0.5} value={targetLUFS}
            onChange={(e) => setTargetLUFS(e.target.value)}
            className="w-full accent-[#00E5FF] cursor-pointer" />
          <div className="text-[10px] text-[#3f3f46] font-mono mt-2">
            {PRESETS.find((p) => p.value === targetLUFS)?.desc ?? "custom level"}
          </div>
        </div>
      </div>

      <button onClick={normalize} disabled={!file || status === "loading" || status === "processing"}
        className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30 mb-4"
        style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
        {status === "loading" ? "loading engine..." : status === "processing" ? "normalizing..." : status === "done" ? "normalized ✓" : "normalize"}
      </button>

      {downloadUrl && (
        <div className="flex items-center justify-between p-4 rounded border mb-4" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
          <div>
            <div className="text-xs font-mono text-[#e4e4e7]">{file?.name.replace(/\.[^.]+$/, "")}_normalized</div>
            <div className="text-[10px] text-[#71717a] mt-0.5">normalized to {targetLUFS} LUFS</div>
          </div>
          <a href={downloadUrl} download className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>download</a>
        </div>
      )}

      {log.length > 0 && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 font-mono text-[11px] text-[#71717a] space-y-1">
          {log.map((line, i) => <div key={i} className="flex gap-2"><span style={{ color: accent }} className="opacity-60">$</span><span>{line}</span></div>)}
        </div>
      )}
    </ToolShell>
  );
}
