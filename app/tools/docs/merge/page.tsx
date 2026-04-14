"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { PDFDocument } from "pdf-lib";

const accent = "#94A3B8";
type PdfFile = { file: File; id: string; pages: number };

export default function PdfMergePage() {
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [status, setStatus] = useState<"idle"|"merging"|"done"|"error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string|null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addPdfs = async (files: FileList | File[]) => {
    const pdfsArr = Array.from(files).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    const withPages = await Promise.all(pdfsArr.map(async (file) => {
      try {
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        return { file, id: Math.random().toString(36).slice(2), pages: doc.getPageCount() };
      } catch { return { file, id: Math.random().toString(36).slice(2), pages: 0 }; }
    }));
    setPdfs(prev => [...prev, ...withPages]);
    setDownloadUrl(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    addPdfs(e.dataTransfer.files);
  }, []);

  const moveUp = (i: number) => setPdfs(p => { const a=[...p]; [a[i-1],a[i]]=[a[i],a[i-1]]; return a; });
  const moveDown = (i: number) => setPdfs(p => { const a=[...p]; [a[i],a[i+1]]=[a[i+1],a[i]]; return a; });
  const remove = (id: string) => setPdfs(p => p.filter(f => f.id !== id));

  const merge = async () => {
    setStatus("merging");
    try {
      const merged = await PDFDocument.create();
      for (const { file } of pdfs) {
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const copied = await merged.copyPages(doc, doc.getPageIndices());
        copied.forEach(p => merged.addPage(p));
      }
      const bytes = await merged.save();
      const blob = new Blob([(bytes as Uint8Array).slice(0)], { type: "application/pdf" });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch { setStatus("error"); }
  };

  const totalPages = pdfs.reduce((a, p) => a + p.pages, 0);

  return (
    <ToolShell category="Documents & PDF" categoryHref="/tools/docs" accent={accent} title="PDF Merger" description="Combine multiple PDFs into one — drag to reorder pages before merging.">
      <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed rounded p-8 text-center mb-6 cursor-pointer transition-all"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
        <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" multiple className="hidden" onChange={e => { if (e.target.files) addPdfs(e.target.files); }} />
        <div className="text-2xl mb-2 opacity-20">⬡</div>
        <div className="text-sm text-[#71717a] font-mono">drop PDF files or click to browse</div>
      </div>

      {pdfs.length > 0 && (
        <div className="space-y-5">
          <div className="border border-[#2a2a2a] rounded overflow-hidden">
            <div className="px-4 py-2 bg-[#141414] border-b border-[#2a2a2a] flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">{pdfs.length} files · {totalPages} total pages</span>
              <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">+ add more</button>
            </div>
            {pdfs.map(({ file, id, pages }, i) => (
              <div key={id} className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] last:border-0">
                <div className="w-8 h-8 rounded border border-[#2a2a2a] bg-[#0d0d0d] flex items-center justify-center text-[10px] font-mono shrink-0" style={{ color: accent }}>{i+1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-[#e4e4e7] truncate">{file.name}</div>
                  <div className="text-[10px] text-[#3f3f46] font-mono">{pages} page{pages !== 1 ? "s" : ""} · {(file.size/1024).toFixed(0)} KB</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => i > 0 && moveUp(i)} disabled={i===0} className="w-6 h-6 text-xs text-[#71717a] hover:text-[#e4e4e7] disabled:opacity-20">↑</button>
                  <button onClick={() => i < pdfs.length-1 && moveDown(i)} disabled={i===pdfs.length-1} className="w-6 h-6 text-xs text-[#71717a] hover:text-[#e4e4e7] disabled:opacity-20">↓</button>
                  <button onClick={() => remove(id)} className="w-6 h-6 text-xs text-[#71717a] hover:text-[#EF4444]">✕</button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={merge} disabled={pdfs.length < 2 || status === "merging"}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
            {status === "merging" ? "merging..." : status === "done" ? "merged ✓" : `merge ${pdfs.length} pdfs → ${totalPages} pages`}
          </button>

          {pdfs.length < 2 && <div className="text-[10px] text-center text-[#3f3f46] font-mono">add at least 2 PDF files to merge</div>}

          {downloadUrl && (
            <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
              <div className="text-xs font-mono text-[#e4e4e7]">merged.pdf · {totalPages} pages</div>
              <a href={downloadUrl} download="merged.pdf" className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>download</a>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
