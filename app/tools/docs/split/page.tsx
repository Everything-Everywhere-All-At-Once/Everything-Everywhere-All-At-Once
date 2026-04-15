"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { PDFDocument } from "pdf-lib";

const accent = "#94A3B8";

type SplitMode = "all" | "range" | "every";

export default function PdfSplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [mode, setMode] = useState<SplitMode>("all");
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(1);
  const [everyN, setEveryN] = useState(1);
  const [status, setStatus] = useState<"idle" | "splitting" | "done" | "error">("idle");
  const [downloadUrls, setDownloadUrls] = useState<{ name: string; url: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfBytesRef = useRef<ArrayBuffer | null>(null);

  const loadPdf = async (f: File) => {
    setFile(f);
    setDownloadUrls([]);
    setStatus("idle");
    try {
      const bytes = await f.arrayBuffer();
      pdfBytesRef.current = bytes;
      const doc = await PDFDocument.load(bytes);
      const n = doc.getPageCount();
      setTotalPages(n);
      setRangeFrom(1);
      setRangeTo(n);
    } catch {
      setTotalPages(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf" || f?.name.endsWith(".pdf")) loadPdf(f);
  }, []);

  const split = async () => {
    if (!pdfBytesRef.current || !totalPages) return;
    setStatus("splitting");
    setDownloadUrls([]);
    try {
      const srcDoc = await PDFDocument.load(pdfBytesRef.current);
      const results: { name: string; url: string }[] = [];

      if (mode === "all") {
        // Each page as its own PDF
        for (let i = 0; i < totalPages; i++) {
          const newDoc = await PDFDocument.create();
          const [page] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(page);
          const bytes = await newDoc.save();
          const blob = new Blob([(bytes as Uint8Array).slice(0)], { type: "application/pdf" });
          results.push({ name: `page_${i + 1}.pdf`, url: URL.createObjectURL(blob) });
        }
      } else if (mode === "range") {
        // Extract specific page range (1-indexed)
        const from = Math.max(1, rangeFrom) - 1;
        const to = Math.min(totalPages, rangeTo) - 1;
        const indices = Array.from({ length: to - from + 1 }, (_, k) => from + k);
        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, indices);
        copied.forEach(p => newDoc.addPage(p));
        const bytes = await newDoc.save();
        const blob = new Blob([(bytes as Uint8Array).slice(0)], { type: "application/pdf" });
        results.push({ name: `pages_${rangeFrom}-${rangeTo}.pdf`, url: URL.createObjectURL(blob) });
      } else if (mode === "every") {
        // Split into chunks of N pages
        const n = Math.max(1, everyN);
        for (let start = 0; start < totalPages; start += n) {
          const end = Math.min(start + n - 1, totalPages - 1);
          const indices = Array.from({ length: end - start + 1 }, (_, k) => start + k);
          const newDoc = await PDFDocument.create();
          const copied = await newDoc.copyPages(srcDoc, indices);
          copied.forEach(p => newDoc.addPage(p));
          const bytes = await newDoc.save();
          const blob = new Blob([(bytes as Uint8Array).slice(0)], { type: "application/pdf" });
          results.push({ name: `chunk_${start + 1}-${end + 1}.pdf`, url: URL.createObjectURL(blob) });
        }
      }

      setDownloadUrls(results);
      setStatus("done");
    } catch { setStatus("error"); }
  };

  const downloadAll = () => {
    downloadUrls.forEach(({ name, url }, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = url; a.download = name; a.click();
      }, i * 100);
    });
  };

  const expectedOutputs = () => {
    if (!totalPages) return 0;
    if (mode === "all") return totalPages;
    if (mode === "range") return 1;
    if (mode === "every") return Math.ceil(totalPages / Math.max(1, everyN));
    return 0;
  };

  return (
    <ToolShell category="Documents & PDF" categoryHref="/tools/docs" accent={accent} title="PDF Splitter" description="Split a PDF into individual pages, a page range, or equal-sized chunks — all in browser.">
      <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed rounded p-8 text-center mb-6 cursor-pointer transition-all"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
        <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) loadPdf(f); }} />
        {file
          ? <div className="font-mono text-sm text-[#e4e4e7]">{file.name} · {totalPages} pages · {(file.size / 1024).toFixed(0)} KB</div>
          : <><div className="text-sm text-[#71717a] font-mono">drop PDF or click to browse</div></>}
      </div>

      {file && totalPages > 0 && (
        <div className="space-y-5">
          {/* Mode selector */}
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">split mode</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "all", label: "every page", sub: `${totalPages} files` },
                { id: "range", label: "page range", sub: "extract range" },
                { id: "every", label: "every N pages", sub: "equal chunks" },
              ] as const).map(({ id, label, sub }) => (
                <button key={id} onClick={() => setMode(id)}
                  className="py-3 text-xs font-mono rounded border transition-all text-left px-3"
                  style={mode === id ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  <div>{label}</div>
                  <div className="text-[10px] mt-0.5 opacity-60">{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific controls */}
          {mode === "range" && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
              <div className="text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-3">page range (1–{totalPages})</div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-[#3f3f46] font-mono block mb-1">from</label>
                  <input type="number" min={1} max={rangeTo} value={rangeFrom}
                    onChange={e => setRangeFrom(Math.max(1, Math.min(rangeTo, Number(e.target.value))))}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm font-mono text-[#e4e4e7] focus:outline-none"
                    style={{ borderColor: "#2a2a2a" }} />
                </div>
                <div className="text-[#3f3f46] font-mono mt-4">→</div>
                <div className="flex-1">
                  <label className="text-[10px] text-[#3f3f46] font-mono block mb-1">to</label>
                  <input type="number" min={rangeFrom} max={totalPages} value={rangeTo}
                    onChange={e => setRangeTo(Math.max(rangeFrom, Math.min(totalPages, Number(e.target.value))))}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm font-mono text-[#e4e4e7] focus:outline-none"
                    style={{ borderColor: "#2a2a2a" }} />
                </div>
              </div>
              <div className="text-[10px] text-[#3f3f46] font-mono mt-2">{rangeTo - rangeFrom + 1} pages will be extracted</div>
            </div>
          )}

          {mode === "every" && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
              <div className="text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-3">pages per chunk</div>
              <div className="flex gap-2 mb-3">
                {[1, 2, 5, 10].map(n => (
                  <button key={n} onClick={() => setEveryN(n)}
                    className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                    style={everyN === n ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                    {n}
                  </button>
                ))}
                <input type="number" min={1} max={totalPages} value={everyN}
                  onChange={e => setEveryN(Math.max(1, Math.min(totalPages, Number(e.target.value))))}
                  className="w-16 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1 text-xs font-mono text-[#e4e4e7] focus:outline-none" />
              </div>
              <div className="text-[10px] text-[#3f3f46] font-mono">{expectedOutputs()} chunk{expectedOutputs() !== 1 ? "s" : ""} will be created</div>
            </div>
          )}

          <button onClick={split} disabled={status === "splitting"}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
            {status === "splitting" ? "splitting..." : status === "done" ? `split ✓ — ${downloadUrls.length} files` : `split → ${expectedOutputs()} file${expectedOutputs() !== 1 ? "s" : ""}`}
          </button>

          {downloadUrls.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">{downloadUrls.length} files ready</span>
                {downloadUrls.length > 1 && (
                  <button onClick={downloadAll} className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>
                    download all
                  </button>
                )}
              </div>
              <div className="border border-[#2a2a2a] rounded overflow-hidden">
                {downloadUrls.map(({ name, url }) => (
                  <div key={name} className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] last:border-0">
                    <span className="text-xs font-mono text-[#e4e4e7]">{name}</span>
                    <a href={url} download={name} className="px-3 py-1.5 text-[10px] font-mono rounded" style={{ backgroundColor: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>
                      download
                    </a>
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
