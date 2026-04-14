"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import imageCompression from "browser-image-compression";

const accent = "#A855F7";

export default function ImageCompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [maxSizeMB, setMaxSizeMB] = useState(1);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [status, setStatus] = useState<"idle" | "compressing" | "done" | "error">("idle");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResultUrl(null);
    setResultSize(null);
    setStatus("idle");
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(f);
  }, []);

  const compress = async () => {
    if (!file) return;
    setStatus("compressing");
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB,
        maxWidthOrHeight: maxWidth,
        useWebWorker: true,
        fileType: "image/jpeg",
      });
      setResultSize(compressed.size);
      setResultUrl(URL.createObjectURL(compressed));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const savings = file && resultSize ? Math.round((1 - resultSize / file.size) * 100) : 0;

  return (
    <ToolShell category="Image & Art" categoryHref="/tools/image" accent={accent} title="Image Compressor" description="Compress images to a target file size while preserving quality — browser-only.">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !file && fileInputRef.current?.click()}
        className="border border-dashed rounded transition-all p-8 text-center mb-6 cursor-pointer"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}
      >
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {preview ? (
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="preview" className="max-h-40 rounded object-contain border border-[#2a2a2a]" />
            <div className="text-xs font-mono text-[#71717a]">{file?.name} · {((file?.size ?? 0) / 1024).toFixed(0)} KB</div>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-2 opacity-20">◈</div>
            <div className="text-sm text-[#71717a] font-mono">drop image or click to browse</div>
          </>
        )}
      </div>

      {file && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">max size — {maxSizeMB} MB</label>
              <input type="range" min={0.1} max={5} step={0.1} value={maxSizeMB} onChange={(e) => setMaxSizeMB(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer" />
              <div className="flex justify-between text-[10px] text-[#3f3f46] font-mono mt-1"><span>0.1 MB</span><span>5 MB</span></div>
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">max dimension — {maxWidth}px</label>
              <input type="range" min={400} max={4000} step={100} value={maxWidth} onChange={(e) => setMaxWidth(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer" />
              <div className="flex justify-between text-[10px] text-[#3f3f46] font-mono mt-1"><span>400px</span><span>4000px</span></div>
            </div>
          </div>

          <button onClick={compress} disabled={status === "compressing"}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-40"
            style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
            {status === "compressing" ? "compressing..." : status === "done" ? "compressed ✓" : "compress"}
          </button>

          {resultUrl && resultSize && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "original", value: `${((file?.size ?? 0) / 1024).toFixed(0)} KB` },
                  { label: "compressed", value: `${(resultSize / 1024).toFixed(0)} KB`, accent: true },
                  { label: "saved", value: `${savings}%`, green: true },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded border border-[#2a2a2a] bg-[#141414]">
                    <div className="text-[10px] text-[#71717a] font-mono uppercase tracking-widest mb-1">{s.label}</div>
                    <div className="text-sm font-mono font-bold" style={{ color: s.green ? "#22C55E" : s.accent ? accent : "#e4e4e7" }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
                <div className="text-xs font-mono text-[#e4e4e7]">{file?.name.replace(/\.[^.]+$/, "_compressed.jpg")}</div>
                <a href={resultUrl} download={file?.name.replace(/\.[^.]+$/, "_compressed.jpg")}
                  className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#fff" }}>
                  download
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
