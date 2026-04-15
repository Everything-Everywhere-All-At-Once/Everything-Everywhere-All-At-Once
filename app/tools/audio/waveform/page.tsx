"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#00FFFF";

export default function WaveformPage() {
  const [file, setFile]     = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError]   = useState("");
  const [duration, setDuration] = useState(0);
  const [sampleRate, setSampleRate] = useState(0);
  const [channels, setChannels] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  const draw = useCallback((data: Float32Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const mid   = H / 2;
    const step  = Math.ceil(data.length / W);

    // Background
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, W, H);

    // Center line
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();

    // Waveform — filled bars
    for (let x = 0; x < W; x++) {
      let max = 0;
      for (let s = 0; s < step; s++) {
        const idx = x * step + s;
        if (idx < data.length) max = Math.max(max, Math.abs(data[idx]));
      }
      const h = max * mid * 0.95;

      // gradient fill
      const grad = ctx.createLinearGradient(x, mid - h, x, mid + h);
      grad.addColorStop(0,   "rgba(0,255,255,0.9)");
      grad.addColorStop(0.5, "rgba(255,51,153,0.7)");
      grad.addColorStop(1,   "rgba(0,255,255,0.9)");

      ctx.fillStyle = grad;
      ctx.fillRect(x, mid - h, 1, h * 2 || 1);
    }
  }, []);

  const handleFile = async (f: File) => {
    setFile(f);
    setStatus("loading");
    setError("");
    try {
      const buf = await f.arrayBuffer();
      const ac  = new AudioContext();
      const decoded = await ac.decodeAudioData(buf);
      setDuration(decoded.duration);
      setSampleRate(decoded.sampleRate);
      setChannels(decoded.numberOfChannels);

      // Mix down to mono
      const len   = decoded.length;
      const mixed = new Float32Array(len);
      for (let c = 0; c < decoded.numberOfChannels; c++) {
        const ch = decoded.getChannelData(c);
        for (let i = 0; i < len; i++) mixed[i] += ch[i] / decoded.numberOfChannels;
      }

      draw(mixed);
      setStatus("done");
      await ac.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to decode audio");
      setStatus("error");
    }
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <ToolShell category="Audio & Music" categoryHref="/tools/audio" accent={accent} title="Waveform Visualizer" description="Drop any audio file and see its waveform rendered with channel info and duration — no upload.">
      <div className="space-y-5">
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all"
          style={{ borderColor: file ? `${accent}60` : "#2a2a2a" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${accent}60`}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = file ? `${accent}60` : "#2a2a2a"}
        >
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          {file
            ? <div className="font-mono text-sm text-[#e4e4e7]">{file.name} <span className="text-[#71717a]">· {(file.size / 1024 / 1024).toFixed(2)} MB</span></div>
            : <div className="text-sm text-[#71717a] font-mono">drop audio file or click to browse</div>
          }
          <div className="text-xs text-[#3f3f46] mt-1">MP3 · WAV · FLAC · OGG · AAC</div>
        </div>

        {status === "loading" && (
          <div className="text-xs font-mono text-center" style={{ color: accent }}>decoding audio...</div>
        )}

        {status === "error" && (
          <div className="text-xs font-mono text-[#EF4444] p-3 bg-[#EF4444]/08 border border-[#EF4444]/20 rounded">{error}</div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full rounded-lg border border-[#2a2a2a]"
          style={{ display: status === "done" ? "block" : "none", imageRendering: "pixelated" }}
        />

        {status === "done" && (
          <div className="grid grid-cols-3 gap-3">
            {[
              ["duration", fmtTime(duration)],
              ["sample rate", `${(sampleRate / 1000).toFixed(1)} kHz`],
              ["channels", channels === 1 ? "mono" : channels === 2 ? "stereo" : `${channels}ch`],
            ].map(([label, val]) => (
              <div key={label} className="bg-[#141414] border border-[#2a2a2a] rounded p-3 text-center">
                <div className="text-base font-bold font-mono" style={{ color: accent }}>{val}</div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#52525b] mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
