"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#22C55E";

// LSB steganography: encode text into the least significant bit of each R, G, B channel
function encodeMessage(imageData: ImageData, message: string): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const encoded = new TextEncoder().encode(message + "\0"); // null terminator
  const bits: number[] = [];
  for (const byte of encoded) {
    for (let b = 7; b >= 0; b--) bits.push((byte >> b) & 1);
  }
  if (bits.length > (data.length / 4) * 3) throw new Error("message too large for this image");
  let bitIdx = 0;
  for (let i = 0; i < data.length && bitIdx < bits.length; i++) {
    if ((i + 1) % 4 === 0) continue; // skip alpha
    data[i] = (data[i] & 0xFE) | bits[bitIdx++];
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function decodeMessage(imageData: ImageData): string {
  const data = imageData.data;
  const bits: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if ((i + 1) % 4 === 0) continue;
    bits.push(data[i] & 1);
  }
  const bytes: number[] = [];
  for (let i = 0; i + 7 < bits.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i + b];
    if (byte === 0) break; // null terminator
    bytes.push(byte);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export default function StegoPage() {
  const [mode, setMode] = useState<"hide" | "reveal">("hide");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [decoded, setDecoded] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [capacity, setCapacity] = useState(0);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImage = (f: File) => {
    setFile(f);
    setOutputUrl(null);
    setDecoded("");
    setStatus("idle");
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const cap = Math.floor((img.width * img.height * 3) / 8) - 1;
      setCapacity(cap);
    };
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) loadImage(f);
  }, []);

  const process = async () => {
    if (!file || !previewUrl) return;
    setStatus("working");
    setErrorMsg("");
    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise(r => { img.onload = r; });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (mode === "hide") {
        if (!message.trim()) { setErrorMsg("enter a message to hide"); setStatus("error"); return; }
        const encoded = encodeMessage(imgData, message);
        ctx.putImageData(encoded, 0, 0);
        const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), "image/png"));
        setOutputUrl(URL.createObjectURL(blob));
        setStatus("done");
      } else {
        const msg = decodeMessage(imgData);
        if (!msg) { setErrorMsg("no hidden message found in this image"); setStatus("error"); return; }
        setDecoded(msg);
        setStatus("done");
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "processing failed");
      setStatus("error");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(decoded).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  return (
    <ToolShell category="Cybersecurity" categoryHref="/tools/cyber" accent={accent} title="Steganography" description="Hide secret messages inside images using LSB steganography — invisible to the eye, all in browser.">
      <div className="space-y-5">
        <div className="flex rounded border border-[#2a2a2a] overflow-hidden">
          {(["hide", "reveal"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setStatus("idle"); setDecoded(""); setOutputUrl(""); }}
              className="flex-1 py-2.5 text-xs font-mono capitalize transition-all"
              style={mode === m ? { backgroundColor: `${accent}20`, color: accent } : { color: "#71717a" }}>
              {m === "hide" ? "hide message" : "reveal message"}
            </button>
          ))}
        </div>

        <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed rounded p-6 text-center cursor-pointer transition-all"
          style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadImage(f); }} />
          {file
            ? <div className="font-mono text-sm text-[#e4e4e7]">{file.name} · {(file.size / 1024).toFixed(0)} KB{capacity > 0 ? ` · ${capacity} chars capacity` : ""}</div>
            : <><div className="text-2xl mb-2 opacity-20">⬡</div><div className="text-sm text-[#71717a] font-mono">drop PNG or JPG image</div><div className="text-xs text-[#3f3f46] mt-1">PNG recommended — JPEG compression destroys hidden data</div></>}
        </div>

        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="preview" className="w-full max-h-40 object-contain rounded border border-[#2a2a2a] bg-[#141414]" />
        )}

        {mode === "hide" && file && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] tracking-widest text-[#71717a] uppercase font-mono">secret message</label>
              {capacity > 0 && <span className="text-[10px] font-mono text-[#3f3f46]">{message.length}/{capacity}</span>}
            </div>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              className="w-full h-24 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none"
              placeholder="enter the message to hide..." />
          </div>
        )}

        {file && (
          <button onClick={process} disabled={status === "working"}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
            {status === "working" ? "processing..." : status === "done" ? (mode === "hide" ? "encoded ✓" : "decoded ✓") : mode === "hide" ? "hide message in image" : "reveal hidden message"}
          </button>
        )}

        {status === "error" && <div className="text-xs text-center text-[#EF4444] font-mono">{errorMsg}</div>}

        {outputUrl && mode === "hide" && (
          <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
            <div className="text-xs font-mono text-[#e4e4e7]">image with hidden message (PNG)</div>
            <a href={outputUrl} download="stego_output.png" className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>download</a>
          </div>
        )}

        {decoded && mode === "reveal" && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>hidden message</span>
              <button onClick={copy} className="text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">{copied ? "copied ✓" : "copy"}</button>
            </div>
            <div className="text-sm font-mono text-[#e4e4e7] whitespace-pre-wrap break-all">{decoded}</div>
          </div>
        )}

        <div className="text-[10px] text-[#3f3f46] font-mono text-center">LSB steganography — modifies least significant bits · output must be saved as PNG to preserve data</div>
      </div>
    </ToolShell>
  );
}
