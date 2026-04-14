"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#EC4899";

const SIZES = [16, 32, 48, 64, 96, 128, 180, 192, 512];

export default function FaviconPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ size: number; url: string }[]>([]);
  const [status, setStatus] = useState<"idle" | "generating" | "done">("idle");
  const [selectedSizes, setSelectedSizes] = useState<number[]>([16, 32, 48, 180, 192]);
  const [isDragging, setIsDragging] = useState(false);
  const [bg, setBg] = useState("transparent");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = (f: File) => {
    setFile(f);
    setGenerated([]);
    setStatus("idle");
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) loadFile(f);
  }, []);

  const toggleSize = (s: number) => setSelectedSizes(ss => ss.includes(s) ? ss.filter(x => x !== s) : [...ss, s].sort((a, b) => a - b));

  const generate = async () => {
    if (!previewUrl) return;
    setStatus("generating");
    const img = new Image();
    img.src = previewUrl;
    await new Promise(r => { img.onload = r; });

    const results: { size: number; url: string }[] = [];
    for (const size of selectedSizes) {
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      if (bg !== "transparent") {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, size, size);
      }
      ctx.drawImage(img, 0, 0, size, size);
      results.push({ size, url: canvas.toDataURL("image/png") });
    }
    setGenerated(results);
    setStatus("done");
  };

  const download = (url: string, size: number) => {
    const a = document.createElement("a");
    a.href = url; a.download = `favicon-${size}x${size}.png`; a.click();
  };

  const downloadAll = () => generated.forEach(({ url, size }, i) => setTimeout(() => download(url, size), i * 100));

  const htmlSnippet = `<!-- Favicon -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />`;

  return (
    <ToolShell category="Web Design" categoryHref="/tools/webdesign" accent={accent} title="Favicon Generator" description="Generate favicons in all standard sizes from any image — PNG, square, Apple touch icons.">
      <div className="space-y-5">
        <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed rounded p-8 text-center cursor-pointer transition-all"
          style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
          {file
            ? <div className="font-mono text-sm text-[#e4e4e7]">{file.name}</div>
            : <><div className="text-2xl mb-2 opacity-20">⬡</div><div className="text-sm text-[#71717a] font-mono">drop image or click to browse</div><div className="text-xs text-[#3f3f46] mt-1">PNG · SVG · JPG · square images work best</div></>}
        </div>

        {previewUrl && (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="preview" className="w-16 h-16 object-contain rounded border border-[#2a2a2a] bg-[#141414]" />
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-mono text-[#71717a]">background</label>
              <button onClick={() => setBg("transparent")} className="px-2 py-1 text-[10px] font-mono rounded border transition-all" style={bg === "transparent" ? { borderColor: accent, color: accent } : { borderColor: "#2a2a2a", color: "#71717a" }}>none</button>
              <button onClick={() => setBg("#ffffff")} className="px-2 py-1 text-[10px] font-mono rounded border transition-all" style={bg === "#ffffff" ? { borderColor: accent, color: accent } : { borderColor: "#2a2a2a", color: "#71717a" }}>white</button>
              <button onClick={() => setBg("#000000")} className="px-2 py-1 text-[10px] font-mono rounded border transition-all" style={bg === "#000000" ? { borderColor: accent, color: accent } : { borderColor: "#2a2a2a", color: "#71717a" }}>black</button>
              <input type="color" value={bg === "transparent" ? "#ffffff" : bg} onChange={e => setBg(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" />
            </div>
          </div>
        )}

        {file && (
          <>
            <div>
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">sizes (px)</label>
              <div className="flex flex-wrap gap-2">
                {SIZES.map(s => (
                  <button key={s} onClick={() => toggleSize(s)}
                    className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                    style={selectedSizes.includes(s) ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                    {s}×{s}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generate} disabled={!selectedSizes.length || status === "generating"}
              className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
              style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
              {status === "generating" ? "generating..." : status === "done" ? "generated ✓" : `generate ${selectedSizes.length} sizes`}
            </button>
          </>
        )}

        {generated.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">{generated.length} favicons ready</span>
              <button onClick={downloadAll} className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>download all</button>
            </div>
            <div className="flex flex-wrap gap-3">
              {generated.map(({ size, url }) => (
                <button key={size} onClick={() => download(url, size)} title={`${size}×${size} — click to download`}
                  className="flex flex-col items-center gap-1.5 p-2 rounded border border-[#2a2a2a] hover:border-[#3f3f46] transition-colors">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${size}px`} style={{ width: Math.min(size, 64), height: Math.min(size, 64) }} className="rounded" />
                  <span className="text-[9px] font-mono text-[#3f3f46]">{size}px</span>
                </button>
              ))}
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
              <div className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest mb-2">HTML snippet</div>
              <pre className="text-xs font-mono text-[#e4e4e7] leading-relaxed whitespace-pre-wrap">{htmlSnippet}</pre>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
