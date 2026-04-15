"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#94A3B8";

type OcrStatus = "idle" | "loading" | "recognizing" | "done" | "error";

export default function OcrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<OcrStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [lang, setLang] = useState("eng");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const LANGS = [
    { code: "eng", label: "English" },
    { code: "fra", label: "French" },
    { code: "deu", label: "German" },
    { code: "spa", label: "Spanish" },
    { code: "ita", label: "Italian" },
    { code: "por", label: "Portuguese" },
    { code: "chi_sim", label: "Chinese (Simplified)" },
    { code: "jpn", label: "Japanese" },
    { code: "kor", label: "Korean" },
    { code: "ara", label: "Arabic" },
  ];

  const loadFile = (f: File) => {
    setFile(f);
    setText("");
    setStatus("idle");
    setProgress(0);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith("image/") || f.type === "application/pdf")) loadFile(f);
  }, []);

  const recognize = async () => {
    if (!file) return;
    setStatus("loading");
    setProgress(0);
    setText("");
    try {
      const Tesseract = await import("tesseract.js");
      setStatus("recognizing");
      const result = await Tesseract.recognize(file, lang, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round((m.progress || 0) * 100));
          }
        },
      });
      setText(result.data.text.trim());
      setStatus("done");
    } catch { setStatus("error"); }
  };

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (file?.name.replace(/\.[^.]+$/, "") ?? "ocr") + ".txt";
    a.click();
  };

  return (
    <ToolShell category="Documents & PDF" categoryHref="/tools/docs" accent={accent} title="OCR" description="Extract text from images and scanned PDFs — powered by Tesseract, runs entirely in browser.">
      <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed rounded p-8 text-center mb-6 cursor-pointer transition-all"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
        {file
          ? <div className="font-mono text-sm text-[#e4e4e7]">{file.name} · {(file.size / 1024).toFixed(0)} KB</div>
          : <><div className="text-sm text-[#71717a] font-mono">drop image or PDF or click to browse</div>
            <div className="text-xs text-[#3f3f46] mt-1">PNG · JPG · WebP · TIFF · BMP · PDF</div></>}
      </div>

      {file && (
        <div className="space-y-5">
          {/* Preview */}
          {previewUrl && file.type.startsWith("image/") && (
            <div className="border border-[#2a2a2a] rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="preview" className="w-full max-h-48 object-contain bg-[#141414]" />
            </div>
          )}

          {/* Language selector */}
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">language</label>
            <div className="flex flex-wrap gap-2">
              {LANGS.map(l => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                  style={lang === l.code ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recognize button */}
          <button onClick={recognize} disabled={status === "loading" || status === "recognizing"}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
            {status === "loading" ? "loading engine..." :
              status === "recognizing" ? `recognizing... ${progress}%` :
              status === "done" ? "recognized ✓" : "extract text"}
          </button>

          {/* Progress bar */}
          {(status === "loading" || status === "recognizing") && (
            <div className="h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${status === "loading" ? 5 : progress}%`, backgroundColor: accent }} />
            </div>
          )}

          {/* Result */}
          {status === "done" && text && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">{text.length} characters · {text.split(/\s+/).filter(Boolean).length} words</span>
                <div className="flex gap-2">
                  <button onClick={copy} className="px-3 py-1.5 text-[10px] font-mono rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7] transition-colors">
                    {copied ? "copied ✓" : "copy"}
                  </button>
                  <button onClick={download} className="px-3 py-1.5 text-[10px] font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>
                    download .txt
                  </button>
                </div>
              </div>
              <textarea readOnly value={text}
                className="w-full h-64 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed"
                style={{ color: "#e4e4e7" }} />
            </div>
          )}

          {status === "error" && (
            <div className="text-xs text-center text-[#EF4444] font-mono">recognition failed — try a clearer image</div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
