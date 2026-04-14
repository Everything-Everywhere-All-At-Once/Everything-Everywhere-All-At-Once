"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#A855F7";

const FORMATS = [
  { value: "image/png",  ext: "png",  label: "PNG"  },
  { value: "image/jpeg", ext: "jpg",  label: "JPG"  },
  { value: "image/webp", ext: "webp", label: "WebP" },
  { value: "image/avif", ext: "avif", label: "AVIF" },
];

const QUALITIES = [60, 75, 85, 95, 100];

export default function ImageConvertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState(FORMATS[0]);
  const [quality, setQuality] = useState(90);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [converting, setConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setDownloadUrl(null);
    setOutputSize(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(f);
  }, []);

  const convert = async () => {
    if (!file || !preview) return;
    setConverting(true);
    const img = new Image();
    img.src = preview;
    await new Promise((res) => { img.onload = res; });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setOutputSize(blob.size);
      setDownloadUrl(URL.createObjectURL(blob));
      setConverting(false);
    }, outputFormat.value, quality / 100);
  };

  const outputName = file ? file.name.replace(/\.[^.]+$/, "") + "." + outputFormat.ext : "";

  return (
    <ToolShell category="Image & Art" categoryHref="/tools/image" accent={accent} title="Image Converter" description="Convert images between PNG, JPG, WebP, and AVIF — instantly, in your browser.">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !file && fileInputRef.current?.click()}
        className="border border-dashed rounded transition-all duration-200 p-8 text-center mb-6 cursor-pointer"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}
      >
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {preview ? (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="preview" className="max-h-48 max-w-full rounded object-contain border border-[#2a2a2a]" />
            <div className="text-xs font-mono text-[#71717a]">{file?.name} · {((file?.size ?? 0) / 1024).toFixed(0)} KB</div>
            <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="text-[10px] font-mono text-[#3f3f46] hover:text-[#71717a] transition-colors">change image</button>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-2 opacity-20">◈</div>
            <div className="text-sm text-[#71717a] font-mono">drop image or click to browse</div>
            <div className="text-xs text-[#3f3f46] mt-1">PNG · JPG · WebP · AVIF · GIF · BMP</div>
          </>
        )}
      </div>

      {file && (
        <div className="space-y-5">
          {/* Format */}
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">output format</label>
            <div className="flex gap-2">
              {FORMATS.map((fmt) => (
                <button key={fmt.value} onClick={() => { setOutputFormat(fmt); setDownloadUrl(null); }}
                  className="px-4 py-2 text-xs font-mono rounded border transition-all"
                  style={outputFormat.value === fmt.value ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality (not for PNG) */}
          {outputFormat.value !== "image/png" && (
            <div>
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">quality — {quality}%</label>
              <div className="flex gap-2 flex-wrap">
                {QUALITIES.map((q) => (
                  <button key={q} onClick={() => setQuality(q)}
                    className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                    style={quality === q ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                    {q}%
                  </button>
                ))}
              </div>
              <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full mt-3 accent-purple-500 cursor-pointer" />
            </div>
          )}

          <button onClick={convert} disabled={converting}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-40"
            style={{ borderColor: accent, color: downloadUrl ? "#0d0d0d" : accent, backgroundColor: downloadUrl ? accent : `${accent}15` }}>
            {converting ? "converting..." : downloadUrl ? "converted ✓" : "convert"}
          </button>

          {downloadUrl && (
            <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
              <div>
                <div className="text-xs font-mono text-[#e4e4e7]">{outputName}</div>
                <div className="text-[10px] text-[#71717a] mt-0.5">
                  {outputSize ? `${(outputSize / 1024).toFixed(0)} KB` : ""}
                  {file && outputSize ? ` (${Math.round((1 - outputSize / file.size) * 100)}% smaller)` : ""}
                </div>
              </div>
              <a href={downloadUrl} download={outputName} className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#fff" }}>
                download
              </a>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
