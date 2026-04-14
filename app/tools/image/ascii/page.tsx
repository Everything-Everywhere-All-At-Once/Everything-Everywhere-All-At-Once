"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#A855F7";

const CHAR_SETS = {
  standard: "@%#*+=-:. ",
  blocks:   "█▓▒░ ",
  minimal:  "#. ",
  detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
};

export default function AsciiPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [ascii, setAscii] = useState<string>("");
  const [cols, setCols] = useState(80);
  const [charSet, setCharSet] = useState<keyof typeof CHAR_SETS>("standard");
  const [inverted, setInverted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateAscii = useCallback((src: string, columns: number, set: keyof typeof CHAR_SETS, inv: boolean) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const aspect = 0.5;
      const rows = Math.round((img.height / img.width) * columns * aspect);
      const canvas = document.createElement("canvas");
      canvas.width = columns;
      canvas.height = rows;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, columns, rows);
      const data = ctx.getImageData(0, 0, columns, rows).data;
      const chars = CHAR_SETS[set];
      let result = "";
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const i = (y * columns + x) * 4;
          const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
          const idx = inv
            ? Math.floor(brightness * (chars.length - 1))
            : Math.floor((1 - brightness) * (chars.length - 1));
          result += chars[idx];
        }
        result += "\n";
      }
      setAscii(result);
    };
  }, []);

  const handleFile = useCallback((f: File) => {
    const url = URL.createObjectURL(f);
    setPreview(url);
    generateAscii(url, cols, charSet, inverted);
  }, [cols, charSet, inverted, generateAscii]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(f);
  }, [handleFile]);

  const regen = (c = cols, s = charSet, i = inverted) => {
    if (preview) generateAscii(preview, c, s, i);
  };

  const copy = () => {
    navigator.clipboard.writeText(ascii);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([ascii], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ascii-art.txt";
    a.click();
  };

  return (
    <ToolShell category="Image & Art" categoryHref="/tools/image" accent={accent} title="Image → ASCII Art" description="Convert any image to ASCII art with custom character sets and density.">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !preview && fileInputRef.current?.click()}
        className="border border-dashed rounded transition-all p-8 text-center mb-6 cursor-pointer"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}
      >
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {preview ? (
          <div className="flex items-center gap-4 justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="source" className="max-h-24 rounded border border-[#2a2a2a] object-contain" />
            <span className="text-[#71717a]">→</span>
            <span className="text-sm font-mono" style={{ color: accent }}>ASCII art</span>
            <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="text-[10px] font-mono text-[#3f3f46] hover:text-[#71717a]">change</button>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-2 opacity-20">▦</div>
            <div className="text-sm text-[#71717a] font-mono">drop image or click to browse</div>
          </>
        )}
      </div>

      {/* Controls */}
      {preview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">columns — {cols}</label>
            <input type="range" min={40} max={160} step={5} value={cols}
              onChange={(e) => { setCols(Number(e.target.value)); regen(Number(e.target.value)); }}
              className="w-full accent-purple-500 cursor-pointer" />
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">character set</label>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(CHAR_SETS) as (keyof typeof CHAR_SETS)[]).map((s) => (
                <button key={s} onClick={() => { setCharSet(s); regen(cols, s); }}
                  className="px-2 py-1 text-[10px] font-mono rounded border transition-all"
                  style={charSet === s ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {s}
                </button>
              ))}
              <button onClick={() => { setInverted(!inverted); regen(cols, charSet, !inverted); }}
                className="px-2 py-1 text-[10px] font-mono rounded border transition-all"
                style={inverted ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                invert
              </button>
            </div>
          </div>
        </div>
      )}

      {ascii && (
        <div className="space-y-3">
          <div className="flex justify-end gap-2">
            <button onClick={copy} className="px-3 py-1.5 text-[10px] font-mono rounded border border-[#2a2a2a] text-[#71717a] hover:border-[#3f3f46] transition-all">
              {copied ? "copied!" : "copy"}
            </button>
            <button onClick={download} className="px-3 py-1.5 text-[10px] font-mono rounded transition-all" style={{ backgroundColor: accent, color: "#fff" }}>
              download .txt
            </button>
          </div>
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-4 overflow-auto max-h-96">
            <pre className="text-[7px] leading-tight font-mono text-[#e4e4e7] whitespace-pre">{ascii}</pre>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
