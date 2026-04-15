"use client";

import { useState, useRef } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#FACC15";

export default function SummarizePage() {
  const [input, setInput]   = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"running"|"done"|"error">("idle");
  const [progress, setProgress] = useState("");
  const [error, setError]   = useState("");
  const pipeRef = useRef<((text: string, opts: Record<string, unknown>) => Promise<{ summary_text: string }[]>) | null>(null);

  const run = async () => {
    if (!input.trim()) return;
    setStatus("loading");
    setOutput("");
    setError("");
    try {
      if (!pipeRef.current) {
        setProgress("downloading model (~90 MB, cached after first use)...");
        const { pipeline, env } = await import("@xenova/transformers");
        env.allowLocalModels = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = await (pipeline as any)("summarization", "Xenova/distilbart-cnn-6-6", {
          progress_callback: (info: { status: string; progress?: number }) => {
            if (info.status === "progress" && info.progress !== undefined)
              setProgress(`downloading... ${info.progress.toFixed(0)}%`);
            else if (info.status === "ready") setProgress("model ready");
          },
        });
        pipeRef.current = p;
      }
      setStatus("running");
      setProgress("summarizing...");
      const trimmed = input.trim().split(/\s+/).slice(0, 750).join(" ");
      const result = await pipeRef.current!(trimmed, { max_new_tokens: 130, min_length: 30 });
      setOutput(result[0].summary_text);
      setStatus("done");
      setProgress("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
      setStatus("error");
      setProgress("");
    }
  };

  return (
    <ToolShell category="AI Tools" categoryHref="/tools/ai" accent={accent} title="Text Summarizer" description="Condense long articles into a short summary — runs entirely in your browser using a local AI model. No data sent anywhere.">
      <div className="space-y-5">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">text to summarize</label>
            <span className="text-[10px] font-mono text-[#52525b]">{input.trim().split(/\s+/).filter(Boolean).length} words</span>
          </div>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            placeholder="paste an article, document, or any long text..."
            className="w-full h-48 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none focus:border-[#3f3f46] placeholder:text-[#3f3f46] transition-colors" />
        </div>

        <button onClick={run} disabled={!input.trim() || status === "loading" || status === "running"}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-40"
          style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
          {status === "loading" ? "loading model..." : status === "running" ? "summarizing..." : "summarize"}
        </button>

        {progress && <div className="text-[11px] font-mono text-center" style={{ color: accent }}>{progress}</div>}

        {status === "error" && (
          <div className="text-xs font-mono text-[#EF4444] p-3 bg-[#EF4444]/08 border border-[#EF4444]/20 rounded">{error}</div>
        )}

        {output && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: accent }}>summary</div>
            <p className="text-sm text-[#e4e4e7] leading-relaxed">{output}</p>
          </div>
        )}

        <div className="text-[10px] font-mono text-[#3f3f46] text-center">model: DistilBART-CNN · 100% local · cached after first load</div>
      </div>
    </ToolShell>
  );
}
