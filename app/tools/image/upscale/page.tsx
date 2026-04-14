"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#A855F7";

type Scale = 2 | 4 | 8;
type Method = "lanczos" | "nearest" | "bilinear";

// Bilinear upscaling via canvas
function upscaleCanvas(src: HTMLCanvasElement, scale: number, method: Method): HTMLCanvasElement {
  const dst = document.createElement("canvas");
  dst.width = src.width * scale;
  dst.height = src.height * scale;
  const ctx = dst.getContext("2d")!;

  if (method === "nearest") {
    ctx.imageSmoothingEnabled = false;
  } else {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = method === "lanczos" ? "high" : "medium";
  }

  ctx.drawImage(src, 0, 0, dst.width, dst.height);

  // For "lanczos" equivalent: apply a mild unsharp mask to enhance edges
  if (method === "lanczos") {
    const imgData = ctx.getImageData(0, 0, dst.width, dst.height);
    const data = imgData.data;
    const w = dst.width;
    // Sharpen: simple 3x3 unsharp kernel
    const kernel = [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0];
    const temp = new Uint8ClampedArray(data);
    for (let y = 1; y < dst.height - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          let val = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              val += temp[((y + ky) * w + (x + kx)) * 4 + c] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          data[idx + c] = Math.min(255, Math.max(0, val));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return dst;
}

export default function UpscalePage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [origDims, setOrigDims] = useState<[number, number]>([0, 0]);
  const [scale, setScale] = useState<Scale>(2);
  const [method, setMethod] = useState<Method>("lanczos");
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [status, setStatus] = useState<"idle" | "upscaling" | "done">("idle");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = (f: File) => {
    setFile(f);
    setOutputUrl(null);
    setStatus("idle");
    const url = URL.createObjectURL(f);
    setOriginalUrl(url);
    const img = new Image();
    img.src = url;
    img.onload = () => setOrigDims([img.naturalWidth, img.naturalHeight]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) loadFile(f);
  }, []);

  const upscale = async () => {
    if (!originalUrl) return;
    setStatus("upscaling");
    try {
      const img = new Image();
      img.src = originalUrl;
      await new Promise(r => { img.onload = r; });
      const src = document.createElement("canvas");
      src.width = img.naturalWidth;
      src.height = img.naturalHeight;
      src.getContext("2d")!.drawImage(img, 0, 0);
      const result = upscaleCanvas(src, scale, method);
      const blob = await new Promise<Blob>(r => result.toBlob(b => r(b!), `image/${format}`, 0.95));
      setOutputUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch { setStatus("idle"); }
  };

  const download = () => {
    if (!outputUrl || !file) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `${file.name.replace(/\.[^.]+$/, "")}_${scale}x.${format}`;
    a.click();
  };

  const outDims = origDims[0] ? `${origDims[0] * scale} × ${origDims[1] * scale}px` : "";

  return (
    <ToolShell category="Image & Art" categoryHref="/tools/image" accent={accent} title="AI Upscaler" description="Upscale images 2×, 4×, or 8× using high-quality resampling and edge sharpening — no upload required.">
      <div className="space-y-5">
        <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed rounded p-8 text-center cursor-pointer transition-all"
          style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
          {file
            ? <div className="font-mono text-sm text-[#e4e4e7]">{file.name} · {origDims[0]}×{origDims[1]}px · {(file.size / 1024).toFixed(0)} KB</div>
            : <><div className="text-2xl mb-2 opacity-20">◈</div>
              <div className="text-sm text-[#71717a] font-mono">drop image or click to browse</div></>}
        </div>

        {file && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">scale</label>
                <div className="flex gap-2">
                  {([2, 4, 8] as Scale[]).map(s => (
                    <button key={s} onClick={() => setScale(s)}
                      className="flex-1 py-2 text-sm font-mono rounded border font-bold transition-all"
                      style={scale === s ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">method</label>
                <div className="flex gap-2">
                  {(["lanczos", "bilinear", "nearest"] as Method[]).map(m => (
                    <button key={m} onClick={() => setMethod(m)}
                      className="flex-1 py-2 text-[10px] font-mono rounded border capitalize transition-all"
                      style={method === m ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">output</label>
                <div className="flex gap-2">
                  {(["png", "jpeg"] as const).map(f => (
                    <button key={f} onClick={() => setFormat(f)}
                      className="flex-1 py-2 text-xs font-mono rounded border uppercase transition-all"
                      style={format === f ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {origDims[0] > 0 && (
              <div className="flex items-center gap-3 text-xs font-mono text-[#71717a]">
                <span>{origDims[0]}×{origDims[1]}</span>
                <span>→</span>
                <span style={{ color: accent }}>{outDims}</span>
              </div>
            )}

            <button onClick={upscale} disabled={status === "upscaling"}
              className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
              style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
              {status === "upscaling" ? "upscaling..." : status === "done" ? `upscaled ${scale}× ✓` : `upscale ${scale}×`}
            </button>
          </>
        )}

        {/* Before / After */}
        {outputUrl && originalUrl && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest mb-2">original · {origDims[0]}×{origDims[1]}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalUrl} alt="original" className="w-full rounded border border-[#2a2a2a] object-contain max-h-48 bg-[#141414]" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: accent }}>upscaled {scale}× · {outDims}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={outputUrl} alt="upscaled" className="w-full rounded border border-[#2a2a2a] object-contain max-h-48 bg-[#141414]" />
              </div>
            </div>
            <button onClick={download} className="w-full py-2.5 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>
              download upscaled image
            </button>
          </div>
        )}

        <div className="text-[10px] text-[#3f3f46] font-mono text-center">
          Lanczos = high-quality + edge sharpening · Bilinear = smooth · Nearest = pixel-perfect (pixel art)
        </div>
      </div>
    </ToolShell>
  );
}
