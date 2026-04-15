"use client";

import { useState, useRef } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#FACC15";

export default function CaptionPage() {
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"running"|"done"|"error">("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeRef = useRef<any>(null);

  const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setImage(e.target?.result as string ?? null);
    reader.readAsDataURL(file);
    setCaption("");
    setStatus("idle");
    setError("");
  };

  const run = async () => {
    if (!image) return;
    setStatus("loading");
    setCaption("");
    setError("");
    try {
      if (!pipeRef.current) {
        setProgress("downloading model (~90 MB, cached after first use)...");
        const { pipeline, env } = await import("@xenova/transformers");
        env.allowLocalModels = false;
        pipeRef.current = await pipeline("image-to-text", "Xenova/vit-gpt2-image-captioning", {
          progress_callback: (info: { status: string; progress?: number }) => {
            if (info.status === "progress" && info.progress !== undefined)
              setProgress(`downloading... ${info.progress.toFixed(0)}%`);
            else if (info.status === "ready") setProgress("model ready");
          },
        });
      }
      setStatus("running");
      setProgress("generating caption...");
      const result = await pipeRef.current(image);
      setCaption(result[0]?.generated_text ?? "no caption generated");
      setStatus("done");
      setProgress("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
      setStatus("error");
      setProgress("");
    }
  };

  return (
    <ToolShell category="AI Tools" categoryHref="/tools/ai" accent={accent} title="Image Captioner" description="Generate a natural-language description of any image — runs entirely in your browser using a local AI model. No data sent anywhere.">
      <div className="space-y-5">
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith("image/")) loadImage(f); }}
          className="border border-dashed rounded-lg cursor-pointer transition-all overflow-hidden"
          style={{ borderColor: image ? `${accent}60` : "#2a2a2a" }}>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) loadImage(f); }} />
          {image ? (
            <img src={image} alt="uploaded" className="w-full max-h-64 object-contain bg-[#0d0d0d]" />
          ) : (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <div className="text-2xl opacity-20">+</div>
              <div className="text-sm font-mono text-[#71717a]">drop an image or click to browse</div>
              <div className="text-xs font-mono text-[#3f3f46]">PNG, JPG, WEBP, GIF supported</div>
            </div>
          )}
        </div>

        <button onClick={run} disabled={!image || status === "loading" || status === "running"}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-40"
          style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
          {status === "loading" ? "loading model..." : status === "running" ? "generating..." : "caption image"}
        </button>

        {progress && <div className="text-[11px] font-mono text-center" style={{ color: accent }}>{progress}</div>}

        {status === "error" && (
          <div className="text-xs font-mono text-[#EF4444] p-3 bg-[#EF4444]/08 border border-[#EF4444]/20 rounded">{error}</div>
        )}

        {caption && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: accent }}>caption</div>
            <p className="text-sm text-[#e4e4e7] leading-relaxed">{caption}</p>
          </div>
        )}

        <div className="text-[10px] font-mono text-[#3f3f46] text-center">model: ViT-GPT2 · 100% local · image never leaves your device</div>
      </div>
    </ToolShell>
  );
}
