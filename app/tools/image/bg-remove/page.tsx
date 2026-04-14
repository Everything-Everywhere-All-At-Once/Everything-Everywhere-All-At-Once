"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#A855F7";

export default function BgRemovePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResultUrl(null);
    setStatus("idle");
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(f);
  }, []);

  const removeBackground = async () => {
    if (!file) return;
    setStatus("loading");
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        model: "isnet",
        output: { format: "image/png", quality: 1 },
      });
      setResultUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const outputName = file ? file.name.replace(/\.[^.]+$/, "") + "_nobg.png" : "";

  return (
    <ToolShell category="Image & Art" categoryHref="/tools/image" accent={accent} title="Background Remover" description="AI-powered background removal — runs entirely in your browser. No uploads, no API keys.">
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
            <div className="text-xs font-mono text-[#71717a]">{file?.name}</div>
            <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="text-[10px] font-mono text-[#3f3f46] hover:text-[#71717a]">change image</button>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-2 opacity-20">◈</div>
            <div className="text-sm text-[#71717a] font-mono">drop image or click to browse</div>
            <div className="text-xs text-[#3f3f46] mt-1">works best with photos of people, objects, products</div>
          </>
        )}
      </div>

      {file && status === "idle" && (
        <button onClick={removeBackground}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all mb-6"
          style={{ borderColor: accent, color: accent, backgroundColor: `${accent}15` }}>
          remove background
        </button>
      )}

      {status === "loading" && (
        <div className="text-center py-8 mb-6">
          <div className="text-[#71717a] font-mono text-sm mb-2 animate-pulse">running AI model...</div>
          <div className="text-xs text-[#3f3f46] font-mono">first run downloads the model (~30MB) — subsequent runs are instant</div>
          <div className="mt-4 h-1 bg-[#1a1a1a] rounded overflow-hidden">
            <div className="h-full rounded animate-pulse" style={{ width: "60%", backgroundColor: accent }} />
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="p-4 rounded border border-[#EF4444]/30 bg-[#EF4444]/08 text-xs font-mono text-[#EF4444] mb-6">
          Failed to process image. Try a smaller image or different format.
          <button onClick={removeBackground} className="ml-3 underline">retry</button>
        </div>
      )}

      {resultUrl && (
        <div className="space-y-4">
          {/* Before/after toggle */}
          <div className="flex gap-2 mb-2">
            <button onClick={() => setShowOriginal(false)}
              className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
              style={!showOriginal ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
              result
            </button>
            <button onClick={() => setShowOriginal(true)}
              className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
              style={showOriginal ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
              original
            </button>
          </div>

          {/* Result preview with checkerboard for transparency */}
          <div className="rounded border border-[#2a2a2a] overflow-hidden flex items-center justify-center p-4"
            style={{ backgroundImage: !showOriginal ? "repeating-conic-gradient(#1a1a1a 0% 25%, #141414 0% 50%) 0 0 / 16px 16px" : undefined, backgroundColor: showOriginal ? "#141414" : undefined }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={showOriginal ? preview! : resultUrl} alt="result" className="max-h-64 max-w-full object-contain" />
          </div>

          <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
            <div className="text-xs font-mono text-[#e4e4e7]">{outputName}</div>
            <div className="flex gap-2">
              <a href={resultUrl} download={outputName} className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#fff" }}>
                download PNG
              </a>
              <button onClick={() => { setFile(null); setPreview(null); setResultUrl(null); setStatus("idle"); }}
                className="px-4 py-2 text-xs font-mono rounded border border-[#2a2a2a] text-[#71717a]">reset</button>
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
