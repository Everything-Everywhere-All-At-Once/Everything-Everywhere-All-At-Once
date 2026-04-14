"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#A855F7";

type ExifData = Record<string, string | number | boolean | null>;

export default function ExifPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [exif, setExif] = useState<ExifData | null>(null);
  const [stripped, setStripped] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setExif(null);
    setStripped(null);
    setPreview(URL.createObjectURL(f));
    setLoading(true);
    try {
      const exifr = await import("exifr");
      const data = await exifr.parse(f, { tiff: true, exif: true, gps: true, iptc: true });
      if (data) {
        const clean: ExifData = {};
        for (const [k, v] of Object.entries(data)) {
          if (v instanceof Uint8Array || ArrayBuffer.isView(v)) continue;
          if (Array.isArray(v) && v.length > 6) continue;
          clean[k] = v instanceof Date ? v.toLocaleString() : (v as string | number | boolean | null);
        }
        setExif(clean);
      } else {
        setExif({});
      }
    } catch {
      setExif({});
    }
    setLoading(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(f);
  }, [handleFile]);

  const stripExif = async () => {
    if (!file) return;
    // Draw to canvas (naturally strips EXIF) and export
    const img = new Image();
    img.src = preview!;
    await new Promise((r) => { img.onload = r; });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) setStripped(URL.createObjectURL(blob));
    }, "image/jpeg", 0.97);
  };

  const SENSITIVE_KEYS = ["GPSLatitude", "GPSLongitude", "GPSAltitude", "Make", "Model", "SerialNumber", "LensSerialNumber", "OwnerName", "CameraOwnerName", "Author"];

  return (
    <ToolShell category="Image & Art" categoryHref="/tools/image" accent={accent} title="EXIF Viewer / Remover" description="View all metadata embedded in your image, then strip it for privacy before sharing.">
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
          <img src={preview} alt="preview" className="max-h-36 mx-auto rounded object-contain border border-[#2a2a2a]" />
        ) : (
          <>
            <div className="text-3xl mb-2 opacity-20">⬡</div>
            <div className="text-sm text-[#71717a] font-mono">drop image or click to browse</div>
          </>
        )}
      </div>

      {loading && <div className="text-center py-6 text-sm font-mono text-[#71717a] animate-pulse">reading metadata...</div>}

      {exif && (
        <div className="space-y-4">
          {Object.keys(exif).length === 0 ? (
            <div className="p-4 rounded border border-[#22C55E]/30 bg-[#22C55E]/08 text-xs font-mono text-[#22C55E]">
              ✓ No EXIF metadata found in this image.
            </div>
          ) : (
            <>
              {/* Sensitive fields warning */}
              {SENSITIVE_KEYS.some((k) => exif[k] != null) && (
                <div className="p-4 rounded border border-[#EF4444]/30 bg-[#EF4444]/08 text-xs font-mono text-[#EF4444] space-y-1">
                  <div className="font-bold mb-2">⚠ sensitive data detected:</div>
                  {SENSITIVE_KEYS.filter((k) => exif[k] != null).map((k) => (
                    <div key={k}>{k}: <span className="text-[#e4e4e7]">{String(exif[k])}</span></div>
                  ))}
                </div>
              )}

              {/* All fields */}
              <div className="border border-[#2a2a2a] rounded overflow-hidden">
                <div className="px-4 py-2 bg-[#141414] border-b border-[#2a2a2a] text-[10px] font-mono text-[#71717a] tracking-widest uppercase">
                  {Object.keys(exif).length} metadata fields found
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-[#1a1a1a]">
                  {Object.entries(exif).map(([k, v]) => (
                    <div key={k} className="flex gap-4 px-4 py-2">
                      <div className="text-[11px] font-mono text-[#71717a] w-40 shrink-0 truncate"
                        style={{ color: SENSITIVE_KEYS.includes(k) ? "#EF4444" : undefined }}>{k}</div>
                      <div className="text-[11px] font-mono text-[#e4e4e7] truncate">{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strip button */}
              {!stripped ? (
                <button onClick={stripExif}
                  className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all"
                  style={{ borderColor: accent, color: accent, backgroundColor: `${accent}15` }}>
                  strip all EXIF data
                </button>
              ) : (
                <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
                  <div className="text-xs font-mono text-[#e4e4e7]">EXIF stripped — ready to download</div>
                  <a href={stripped} download={file?.name.replace(/\.[^.]+$/, "_clean.jpg")}
                    className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#fff" }}>
                    download clean
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ToolShell>
  );
}
