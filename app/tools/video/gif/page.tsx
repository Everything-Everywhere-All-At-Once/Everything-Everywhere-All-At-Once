"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const accent = "#F97316";

const FPS_OPTIONS = [10, 15, 24];
const WIDTH_OPTIONS = [320, 480, 640, 800];

function fmt(s: number) {
  return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`;
}

export default function GifMakerPage() {
  const [file, setFile] = useState<File|null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(5);
  const [fps, setFps] = useState(15);
  const [width, setWidth] = useState(480);
  const [status, setStatus] = useState<"idle"|"loading"|"making"|"done"|"error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string|null>(null);
  const [gifSize, setGifSize] = useState<number|null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const ffmpegRef = useRef<FFmpeg|null>(null);
  const videoRef = useRef<HTMLVideoElement|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const url = URL.createObjectURL(f);
    const video = document.createElement("video");
    video.src = url;
    video.onloadedmetadata = () => { setDuration(video.duration); setEnd(Math.min(5, video.duration)); };
    videoRef.current = video;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("video/")) handleFile(f);
  }, []);

  const makeGif = async () => {
    if (!file) return;
    try {
      setStatus("loading");
      const ffmpeg = await loadFFmpeg();
      setStatus("making");
      const ext = file.name.split(".").pop() ?? "mp4";
      const input = `input.${ext}`;
      await ffmpeg.writeFile(input, await fetchFile(file));
      // Two-pass GIF: palette then render
      await ffmpeg.exec(["-ss", String(start), "-t", String(end-start), "-i", input, "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`, "palette.png"]);
      await ffmpeg.exec(["-ss", String(start), "-t", String(end-start), "-i", input, "-i", "palette.png", "-lavfi", `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse`, "out.gif"]);
      const data = await ffmpeg.readFile("out.gif");
      const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : (data as Uint8Array).slice(0);
      const blob = new Blob([uint8], { type: "image/gif" });
      setGifSize(blob.size);
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch { setStatus("error"); }
  };

  const clipDuration = Math.min(end - start, 10);

  return (
    <ToolShell category="Video" categoryHref="/tools/video" accent={accent} title="GIF Maker" description="Convert any video clip to an optimized GIF — two-pass palette for best quality.">
      <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
        onClick={() => !file && fileInputRef.current?.click()}
        className="border border-dashed rounded p-8 text-center mb-6 cursor-pointer transition-all"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {file ? <div className="font-mono text-sm text-[#e4e4e7]">{file.name}</div>
          : <><div className="text-2xl mb-2 opacity-20">⚡</div><div className="text-sm text-[#71717a] font-mono">drop video or click to browse</div><div className="text-xs text-[#3f3f46] mt-1">recommended: clips under 10 seconds</div></>}
      </div>

      {file && duration > 0 && (
        <div className="space-y-5">
          {/* Clip range */}
          <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 space-y-3">
            <div className="flex justify-between text-xs font-mono text-[#71717a]">
              <span>clip</span>
              <span style={{ color: accent }}>{fmt(start)} → {fmt(end)} ({clipDuration.toFixed(1)}s)</span>
              <span>{fmt(duration)}</span>
            </div>
            <div>
              <label className="text-[10px] text-[#71717a] font-mono uppercase tracking-widest">start — {fmt(start)}</label>
              <input type="range" min={0} max={duration} step={0.1} value={start}
                onChange={e => setStart(Math.min(Number(e.target.value), end - 0.5))}
                className="w-full mt-1 cursor-pointer" style={{ accentColor: accent }} />
            </div>
            <div>
              <label className="text-[10px] text-[#71717a] font-mono uppercase tracking-widest">end — {fmt(end)}</label>
              <input type="range" min={0} max={duration} step={0.1} value={end}
                onChange={e => setEnd(Math.max(Number(e.target.value), start + 0.5))}
                className="w-full mt-1 cursor-pointer" style={{ accentColor: accent }} />
            </div>
            {end - start > 10 && <div className="text-[10px] text-[#FACC15] font-mono">⚠ clips over 10s produce large GIFs — consider trimming</div>}
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">fps</label>
              <div className="flex gap-2">
                {FPS_OPTIONS.map(f => (
                  <button key={f} onClick={() => setFps(f)}
                    className="flex-1 py-1.5 text-xs font-mono rounded border transition-all"
                    style={fps === f ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">width</label>
              <div className="flex gap-2">
                {WIDTH_OPTIONS.map(w => (
                  <button key={w} onClick={() => setWidth(w)}
                    className="flex-1 py-1 text-xs font-mono rounded border transition-all"
                    style={width === w ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={makeGif} disabled={status === "loading" || status === "making"}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
            {status === "loading" ? "loading engine..." : status === "making" ? `creating gif... ${progress}%` : status === "done" ? "gif ready ✓" : "create gif"}
          </button>

          {(status === "making" || status === "loading") && (
            <div className="h-px bg-[#2a2a2a] rounded overflow-hidden">
              <div className="h-full transition-all duration-300 rounded" style={{ width: `${status === "loading" ? 5 : progress}%`, backgroundColor: accent }} />
            </div>
          )}

          {downloadUrl && (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={downloadUrl} alt="gif preview" className="w-full rounded border border-[#2a2a2a] max-h-48 object-contain bg-[#0a0a0a]" />
              <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
                <div>
                  <div className="text-xs font-mono text-[#e4e4e7]">output.gif</div>
                  {gifSize && <div className="text-[10px] text-[#71717a] mt-0.5">{(gifSize/1024).toFixed(0)} KB · {clipDuration.toFixed(1)}s · {fps}fps · {width}px</div>}
                </div>
                <a href={downloadUrl} download="output.gif" className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>download</a>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
