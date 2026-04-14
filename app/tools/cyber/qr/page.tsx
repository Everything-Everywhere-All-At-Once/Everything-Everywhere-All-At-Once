"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#22C55E";

type QrMode = "generate" | "read";

export default function QrPage() {
  const [mode, setMode] = useState<QrMode>("generate");
  // Generate state
  const [text, setText] = useState("");
  const [size, setSize] = useState(300);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [fgColor, setFgColor] = useState("#0d0d0d");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  // Read state
  const [readResult, setReadResult] = useState("");
  const [readError, setReadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = async () => {
    if (!text.trim()) return;
    setGenerating(true);
    try {
      const QRCode = await import("qrcode");
      const canvas = canvasRef.current!;
      await QRCode.toCanvas(canvas, text, {
        width: size,
        errorCorrectionLevel: errorLevel,
        color: { dark: fgColor, light: bgColor },
        margin: 2,
      });
      setQrUrl(canvas.toDataURL("image/png"));
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const readQr = async (file: File) => {
    setReadError("");
    setReadResult("");
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const jsQR = (await import("jsqr")).default;
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (result) setReadResult(result.data);
      else setReadError("no QR code found in image — try a clearer or larger image");
    } catch { setReadError("could not read image"); }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) readQr(f);
  }, []);

  const download = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl; a.download = "qrcode.png"; a.click();
  };

  return (
    <ToolShell category="Cybersecurity" categoryHref="/tools/cyber" accent={accent} title="QR Generator" description="Generate QR codes from any text or URL, and decode QR codes from images — fully offline.">
      <div className="space-y-5">
        {/* Mode */}
        <div className="flex rounded border border-[#2a2a2a] overflow-hidden">
          {(["generate", "read"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 py-2.5 text-xs font-mono capitalize transition-all"
              style={mode === m ? { backgroundColor: `${accent}20`, color: accent } : { color: "#71717a" }}>
              {m === "generate" ? "generate QR" : "read QR"}
            </button>
          ))}
        </div>

        {mode === "generate" ? (
          <>
            <div>
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">content</label>
              <textarea value={text} onChange={e => setText(e.target.value)}
                className="w-full h-24 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none"
                placeholder="https://example.com or any text..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">size — {size}px</label>
                <div className="flex gap-2">
                  {[200, 300, 400, 512].map(s => (
                    <button key={s} onClick={() => setSize(s)}
                      className="flex-1 py-1.5 text-xs font-mono rounded border transition-all"
                      style={size === s ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">error correction</label>
                <div className="flex gap-2">
                  {(["L", "M", "Q", "H"] as const).map(l => (
                    <button key={l} onClick={() => setErrorLevel(l)}
                      className="flex-1 py-1.5 text-xs font-mono rounded border transition-all"
                      style={errorLevel === l ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">foreground</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                  <code className="text-xs font-mono text-[#e4e4e7]">{fgColor}</code>
                </div>
              </div>
              <div>
                <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                  <code className="text-xs font-mono text-[#e4e4e7]">{bgColor}</code>
                </div>
              </div>
            </div>

            <button onClick={generate} disabled={!text.trim() || generating}
              className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
              style={{ borderColor: accent, color: qrUrl ? "#0d0d0d" : accent, backgroundColor: qrUrl ? accent : `${accent}15` }}>
              {generating ? "generating..." : qrUrl ? "generated ✓" : "generate QR code"}
            </button>

            <canvas ref={canvasRef} className="hidden" />

            {qrUrl && (
              <div className="flex flex-col items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="QR code" className="rounded border border-[#2a2a2a]" style={{ maxWidth: "240px" }} />
                <button onClick={download} className="px-6 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>
                  download PNG
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed rounded p-10 text-center cursor-pointer transition-all"
              style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) readQr(f); }} />
              <div className="text-2xl mb-2 opacity-20">⬡</div>
              <div className="text-sm text-[#71717a] font-mono">drop QR code image or click to browse</div>
            </div>

            {readError && <div className="text-xs text-center text-[#EF4444] font-mono">{readError}</div>}

            {readResult && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>decoded content</div>
                <div className="text-sm font-mono text-[#e4e4e7] break-all">{readResult}</div>
                {(readResult.startsWith("http://") || readResult.startsWith("https://")) && (
                  <a href={readResult} target="_blank" rel="noopener noreferrer"
                    className="inline-block px-4 py-2 text-xs font-mono rounded"
                    style={{ backgroundColor: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>
                    open link →
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ToolShell>
  );
}
