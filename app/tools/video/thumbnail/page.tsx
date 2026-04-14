"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#F97316";

function fmt(s: number) {
  return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}.${Math.floor((s%1)*10)}`;
}

export default function ThumbnailPage() {
  const [file, setFile] = useState<File|null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [frameCount, setFrameCount] = useState(6);
  const [format, setFormat] = useState<"jpeg"|"png">("jpeg");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f); setFrames([]);
    const url = URL.createObjectURL(f);
    if (videoRef.current) { videoRef.current.src = url; videoRef.current.load(); }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("video/")) handleFile(f);
  }, []);

  const captureFrame = (time?: number): Promise<string> => new Promise((resolve) => {
    const video = videoRef.current!;
    const t = time ?? currentTime;
    video.currentTime = t;
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);
      resolve(canvas.toDataURL(`image/${format}`, 0.92));
    };
  });

  const captureCurrentFrame = async () => {
    const url = await captureFrame();
    const a = document.createElement("a");
    a.href = url;
    a.download = `frame_${fmt(currentTime).replace(/[:. ]/g,"_")}.${format}`;
    a.click();
  };

  const captureMultiple = async () => {
    const captured: string[] = [];
    const interval = duration / (frameCount + 1);
    for (let i = 1; i <= frameCount; i++) {
      const url = await captureFrame(interval * i);
      captured.push(url);
    }
    setFrames(captured);
  };

  const downloadFrame = (url: string, i: number) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `frame_${i + 1}.${format}`;
    a.click();
  };

  return (
    <ToolShell category="Video" categoryHref="/tools/video" accent={accent} title="Thumbnail Extractor" description="Scrub through any video and extract frames as high-quality images — no uploads.">
      <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
        onClick={() => !file && fileInputRef.current?.click()}
        className="border border-dashed rounded p-8 text-center mb-6 cursor-pointer transition-all"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {file ? <div className="font-mono text-sm text-[#e4e4e7]">{file.name}</div>
          : <><div className="text-2xl mb-2 opacity-20">⬡</div><div className="text-sm text-[#71717a] font-mono">drop video or click to browse</div></>}
      </div>

      {file && (
        <div className="space-y-5">
          {/* Video player */}
          <video ref={videoRef} controls className="w-full rounded border border-[#2a2a2a] bg-black max-h-56"
            onLoadedMetadata={e => { const v = e.target as HTMLVideoElement; setDuration(v.duration); }}
            onTimeUpdate={e => setCurrentTime((e.target as HTMLVideoElement).currentTime)} />

          {/* Current time display */}
          <div className="flex items-center justify-between bg-[#141414] border border-[#2a2a2a] rounded px-4 py-3">
            <div>
              <div className="text-[10px] text-[#71717a] font-mono uppercase tracking-widest">current position</div>
              <div className="text-lg font-mono font-bold" style={{ color: accent }}>{fmt(currentTime)}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {(["jpeg", "png"] as const).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    className="px-2 py-1 text-[10px] font-mono rounded border transition-all uppercase"
                    style={format === f ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                    {f}
                  </button>
                ))}
              </div>
              <button onClick={captureCurrentFrame}
                className="px-4 py-2 text-xs font-mono rounded border transition-all"
                style={{ borderColor: accent, color: accent, backgroundColor: `${accent}15` }}>
                capture frame
              </button>
            </div>
          </div>

          {/* Batch extract */}
          <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] text-[#71717a] font-mono uppercase tracking-widest mb-1">batch extract — {frameCount} frames</div>
                <div className="text-[10px] text-[#3f3f46] font-mono">evenly spaced across entire video</div>
              </div>
              <button onClick={captureMultiple}
                className="px-4 py-2 text-xs font-mono rounded transition-all"
                style={{ backgroundColor: accent, color: "#0d0d0d" }}>
                extract all
              </button>
            </div>
            <div className="flex gap-2">
              {[3, 6, 9, 12].map(n => (
                <button key={n} onClick={() => setFrameCount(n)}
                  className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                  style={frameCount === n ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Extracted frames grid */}
          {frames.length > 0 && (
            <div>
              <div className="text-[10px] text-[#71717a] font-mono uppercase tracking-widest mb-3">{frames.length} frames extracted</div>
              <div className="grid grid-cols-3 gap-2">
                {frames.map((url, i) => (
                  <div key={i} className="relative group cursor-pointer rounded overflow-hidden border border-[#2a2a2a]"
                    onClick={() => downloadFrame(url, i)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`frame ${i+1}`} className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] font-mono text-white">download</span>
                    </div>
                    <div className="absolute bottom-1 left-1 text-[9px] font-mono bg-black/70 px-1 rounded text-white">#{i+1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
