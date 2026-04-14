"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#94A3B8";

export default function PdfToImagePage() {
  const [file, setFile] = useState<File|null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<"idle"|"rendering"|"done"|"error">("idle");
  const [scale, setScale] = useState(2);
  const [format, setFormat] = useState<"jpeg"|"png">("jpeg");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") { setFile(f); setPages([]); setStatus("idle"); }
  }, []);

  const render = async () => {
    if (!file) return;
    setStatus("rendering"); setPages([]);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);
      const rendered: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width; canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: ctx as any, viewport, canvas }).promise;
        rendered.push(canvas.toDataURL(`image/${format}`, 0.92));
      }
      setPages(rendered);
      setStatus("done");
    } catch { setStatus("error"); }
  };

  const download = (url: string, i: number) => {
    const a = document.createElement("a"); a.href = url;
    a.download = `page_${i+1}.${format}`; a.click();
  };

  const downloadAll = () => pages.forEach((url, i) => setTimeout(() => download(url, i), i * 100));

  return (
    <ToolShell category="Documents & PDF" categoryHref="/tools/docs" accent={accent} title="PDF → Image" description="Convert each page of a PDF to a high-resolution image — rendered entirely in browser.">
      <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed rounded p-8 text-center mb-6 cursor-pointer transition-all"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
        <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setPages([]); setStatus("idle"); } }} />
        {file ? <div className="font-mono text-sm text-[#e4e4e7]">{file.name} · {(file.size/1024).toFixed(0)} KB</div>
          : <><div className="text-2xl mb-2 opacity-20">⬡</div><div className="text-sm text-[#71717a] font-mono">drop PDF or click to browse</div></>}
      </div>

      {file && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">output format</label>
              <div className="flex gap-2">
                {(["jpeg","png"] as const).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    className="flex-1 py-1.5 text-xs font-mono rounded border transition-all uppercase"
                    style={format === f ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">resolution — {scale}x</label>
              <div className="flex gap-2">
                {[1, 1.5, 2, 3].map(s => (
                  <button key={s} onClick={() => setScale(s)}
                    className="flex-1 py-1.5 text-xs font-mono rounded border transition-all"
                    style={scale === s ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={render} disabled={status === "rendering"}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
            {status === "rendering" ? `rendering pages... ${pages.length}/${totalPages}` : status === "done" ? `${pages.length} pages rendered ✓` : "render pages"}
          </button>

          {pages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">{pages.length} pages</span>
                <button onClick={downloadAll} className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>
                  download all
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {pages.map((url, i) => (
                  <div key={i} className="group relative cursor-pointer rounded border border-[#2a2a2a] overflow-hidden bg-[#141414]"
                    onClick={() => download(url, i)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`page ${i+1}`} className="w-full object-top" style={{ maxHeight: "160px", objectFit: "cover" }} />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] font-mono text-white">download</span>
                    </div>
                    <div className="absolute bottom-1 left-1 text-[9px] font-mono bg-black/70 px-1 rounded text-white">pg {i+1}</div>
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
