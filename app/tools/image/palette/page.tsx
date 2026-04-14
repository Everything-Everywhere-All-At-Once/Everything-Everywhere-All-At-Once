"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#A855F7";

type Color = { r: number; g: number; b: number };

function toHex(c: Color) {
  return "#" + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function toRgb(c: Color) { return `rgb(${c.r}, ${c.g}, ${c.b})`; }
function toHsl(c: Color) {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function extractPalette(imageData: ImageData, count: number): Color[] {
  const pixels: Color[] = [];
  for (let i = 0; i < imageData.data.length; i += 16) {
    const a = imageData.data[i + 3];
    if (a < 128) continue;
    pixels.push({ r: imageData.data[i], g: imageData.data[i + 1], b: imageData.data[i + 2] });
  }

  // k-means clustering
  let centroids: Color[] = Array.from({ length: count }, (_, i) => pixels[Math.floor((i / count) * pixels.length)]);
  for (let iter = 0; iter < 20; iter++) {
    const clusters: Color[][] = Array.from({ length: count }, () => []);
    for (const px of pixels) {
      let best = 0, bestDist = Infinity;
      centroids.forEach((c, i) => {
        const d = (px.r - c.r) ** 2 + (px.g - c.g) ** 2 + (px.b - c.b) ** 2;
        if (d < bestDist) { bestDist = d; best = i; }
      });
      clusters[best].push(px);
    }
    centroids = clusters.map((cl, i) => {
      if (cl.length === 0) return centroids[i];
      return { r: Math.round(cl.reduce((s, p) => s + p.r, 0) / cl.length), g: Math.round(cl.reduce((s, p) => s + p.g, 0) / cl.length), b: Math.round(cl.reduce((s, p) => s + p.b, 0) / cl.length) };
    });
  }
  return centroids.sort((a, b) => (b.r + b.g + b.b) - (a.r + a.g + a.b));
}

export default function PalettePage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [palette, setPalette] = useState<Color[]>([]);
  const [colorCount, setColorCount] = useState(6);
  const [copied, setCopied] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [format, setFormat] = useState<"hex" | "rgb" | "hsl">("hex");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    const url = URL.createObjectURL(f);
    setPreview(url);
    setPalette([]);
    setExtracting(true);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 200 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setPalette(extractPalette(data, colorCount));
      setExtracting(false);
    };
  }, [colorCount]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(f);
  }, [handleFile]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const getColorString = (c: Color) => format === "hex" ? toHex(c) : format === "rgb" ? toRgb(c) : toHsl(c);

  return (
    <ToolShell category="Image & Art" categoryHref="/tools/image" accent={accent} title="Color Palette Extractor" description="Extract a dominant color palette from any image using k-means clustering.">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed rounded transition-all p-8 text-center mb-6 cursor-pointer"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}
      >
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {preview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={preview} alt="preview" className="max-h-40 mx-auto rounded object-contain border border-[#2a2a2a]" />
        ) : (
          <>
            <div className="text-3xl mb-2 opacity-20">◈</div>
            <div className="text-sm text-[#71717a] font-mono">drop image or click to browse</div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#71717a] font-mono uppercase tracking-widest">colors</span>
          {[4, 6, 8, 10, 12].map((n) => (
            <button key={n} onClick={() => setColorCount(n)}
              className="w-7 h-7 text-xs font-mono rounded border transition-all"
              style={colorCount === n ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
              {n}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#71717a] font-mono uppercase tracking-widest">format</span>
          {(["hex", "rgb", "hsl"] as const).map((f) => (
            <button key={f} onClick={() => setFormat(f)}
              className="px-2 py-1 text-xs font-mono rounded border transition-all"
              style={format === f ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {extracting && <div className="text-center py-8 text-sm font-mono text-[#71717a] animate-pulse">extracting palette...</div>}

      {palette.length > 0 && (
        <div className="space-y-3">
          {/* Color bar */}
          <div className="flex h-12 rounded overflow-hidden border border-[#2a2a2a]">
            {palette.map((c, i) => (
              <div key={i} className="flex-1 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: toHex(c) }}
                onClick={() => copy(getColorString(c))}
                title={`copy ${getColorString(c)}`} />
            ))}
          </div>

          {/* Color swatches */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {palette.map((c, i) => (
              <button key={i} onClick={() => copy(getColorString(c))}
                className="flex items-center gap-3 p-3 rounded border border-[#2a2a2a] bg-[#141414] hover:border-[#3f3f46] transition-all text-left group">
                <div className="w-8 h-8 rounded shrink-0 border border-black/20" style={{ backgroundColor: toHex(c) }} />
                <div>
                  <div className="text-xs font-mono text-[#e4e4e7] group-hover:text-white transition-colors">{getColorString(c)}</div>
                  <div className="text-[10px] text-[#3f3f46] font-mono mt-0.5">{copied === getColorString(c) ? "copied!" : "click to copy"}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Copy all */}
          <button onClick={() => copy(palette.map(getColorString).join("\n"))}
            className="w-full py-2.5 text-xs font-mono tracking-widest rounded border border-[#2a2a2a] text-[#71717a] hover:border-[#3f3f46] transition-all">
            {copied === palette.map(getColorString).join("\n") ? "copied all!" : "copy all colors"}
          </button>
        </div>
      )}
    </ToolShell>
  );
}
