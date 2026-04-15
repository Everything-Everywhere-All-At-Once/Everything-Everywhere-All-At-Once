"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { PDFDocument } from "pdf-lib";

const accent = "#94A3B8";

type ImageFile = { file: File; url: string; id: string };

const PAGE_SIZES = {
  "Auto": null,
  "A4": [595, 842],
  "Letter": [612, 792],
  "A3": [842, 1191],
} as const;

export default function ImageToPdfPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pageSize, setPageSize] = useState<keyof typeof PAGE_SIZES>("Auto");
  const [margin, setMargin] = useState(20);
  const [status, setStatus] = useState<"idle"|"converting"|"done"|"error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string|null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImages = (files: FileList | File[]) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith("image/"));
    const newImgs: ImageFile[] = imgs.map(f => ({ file: f, url: URL.createObjectURL(f), id: Math.random().toString(36).slice(2) }));
    setImages(prev => [...prev, ...newImgs]);
    setDownloadUrl(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    addImages(e.dataTransfer.files);
  }, []);

  const moveUp = (i: number) => setImages(p => { const a = [...p]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
  const moveDown = (i: number) => setImages(p => { const a = [...p]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });
  const remove = (id: string) => setImages(p => p.filter(img => img.id !== id));

  const convert = async () => {
    if (!images.length) return;
    setStatus("converting");
    try {
      const pdf = await PDFDocument.create();
      for (const { file, url } of images) {
        const bytes = await fetch(url).then(r => r.arrayBuffer());
        let img;
        if (file.type === "image/jpeg" || file.type === "image/jpg") img = await pdf.embedJpg(bytes);
        else {
          // Convert to PNG via canvas for unsupported formats
          const canvas = document.createElement("canvas");
          const image = new Image(); image.src = url;
          await new Promise(r => { image.onload = r; });
          canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
          canvas.getContext("2d")!.drawImage(image, 0, 0);
          const pngBytes = await new Promise<ArrayBuffer>(r => canvas.toBlob(b => b!.arrayBuffer().then(r), "image/png"));
          img = await pdf.embedPng(pngBytes);
        }
        const size = PAGE_SIZES[pageSize];
        const pw = size ? size[0] : img.width + margin * 2;
        const ph = size ? size[1] : img.height + margin * 2;
        const page = pdf.addPage([pw, ph]);
        const scale = Math.min((pw - margin * 2) / img.width, (ph - margin * 2) / img.height);
        const w = img.width * scale, h = img.height * scale;
        page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
      }
      const bytes = await pdf.save();
      const blob = new Blob([(bytes as Uint8Array).slice(0)], { type: "application/pdf" });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch { setStatus("error"); }
  };

  return (
    <ToolShell category="Documents & PDF" categoryHref="/tools/docs" accent={accent} title="Image → PDF" description="Combine one or more images into a single PDF — reorder, set page size, adjust margins.">
      <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed rounded p-8 text-center mb-6 cursor-pointer transition-all"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) addImages(e.target.files); }} />
        <div className="text-sm text-[#71717a] font-mono">drop images here or click to browse</div>
        <div className="text-xs text-[#3f3f46] mt-1">PNG · JPG · WebP · multiple files supported</div>
      </div>

      {images.length > 0 && (
        <div className="space-y-5">
          {/* Image list */}
          <div className="border border-[#2a2a2a] rounded overflow-hidden">
            <div className="px-4 py-2 bg-[#141414] border-b border-[#2a2a2a] flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">{images.length} image{images.length !== 1 ? "s" : ""} — drag to reorder</span>
              <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7] transition-colors">+ add more</button>
            </div>
            {images.map(({ url, file, id }, i) => (
              <div key={id} className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] last:border-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={file.name} className="w-10 h-10 object-cover rounded border border-[#2a2a2a] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-[#e4e4e7] truncate">{file.name}</div>
                  <div className="text-[10px] text-[#3f3f46] font-mono">{(file.size/1024).toFixed(0)} KB</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => i > 0 && moveUp(i)} disabled={i === 0} className="w-6 h-6 text-xs text-[#71717a] hover:text-[#e4e4e7] disabled:opacity-20">↑</button>
                  <button onClick={() => i < images.length-1 && moveDown(i)} disabled={i === images.length-1} className="w-6 h-6 text-xs text-[#71717a] hover:text-[#e4e4e7] disabled:opacity-20">↓</button>
                  <button onClick={() => remove(id)} className="w-6 h-6 text-xs text-[#71717a] hover:text-[#EF4444]">✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">page size</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PAGE_SIZES) as (keyof typeof PAGE_SIZES)[]).map(s => (
                  <button key={s} onClick={() => setPageSize(s)}
                    className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                    style={pageSize === s ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">margin — {margin}px</label>
              <input type="range" min={0} max={60} step={5} value={margin} onChange={e => setMargin(Number(e.target.value))}
                className="w-full cursor-pointer" style={{ accentColor: accent }} />
            </div>
          </div>

          <button onClick={convert} disabled={status === "converting"}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
            {status === "converting" ? "creating pdf..." : status === "done" ? "pdf ready ✓" : `create pdf (${images.length} page${images.length !== 1 ? "s" : ""})`}
          </button>

          {downloadUrl && (
            <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
              <div className="text-xs font-mono text-[#e4e4e7]">output.pdf · {images.length} page{images.length !== 1 ? "s" : ""}</div>
              <div className="flex gap-2">
                <a href={downloadUrl} download="output.pdf" className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>download</a>
                <button onClick={() => { setImages([]); setDownloadUrl(null); setStatus("idle"); }} className="px-4 py-2 text-xs font-mono rounded border border-[#2a2a2a] text-[#71717a]">reset</button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
