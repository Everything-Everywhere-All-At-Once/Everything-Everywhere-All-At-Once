"use client";

import { useState, useRef } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#22C55E";

export default function Base64Page() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [inputType, setInputType] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [urlSafe, setUrlSafe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const process = async () => {
    setErrorMsg("");
    try {
      if (mode === "encode") {
        let result = "";
        if (inputType === "text") {
          const bytes = new TextEncoder().encode(text);
          result = btoa(String.fromCharCode(...bytes));
        } else if (file) {
          const bytes = new Uint8Array(await file.arrayBuffer());
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          result = btoa(binary);
        }
        if (urlSafe) result = result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
        setOutput(result);
        setStatus("done");
      } else {
        let input = text.trim();
        if (urlSafe) input = input.replace(/-/g, "+").replace(/_/g, "/");
        const decoded = atob(input);
        setOutput(decoded);
        setStatus("done");
      }
    } catch {
      setErrorMsg("invalid input — check your base64 string");
      setStatus("error");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `output.${mode === "encode" ? "b64" : "txt"}`;
    a.click();
  };

  return (
    <ToolShell category="Cybersecurity" categoryHref="/tools/cyber" accent={accent} title="Base64 Encoder" description="Encode text or binary files to Base64 and decode back — supports URL-safe variant.">
      <div className="space-y-5">
        {/* Mode */}
        <div className="flex rounded border border-[#2a2a2a] overflow-hidden">
          {(["encode", "decode"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setOutput(""); setStatus("idle"); }}
              className="flex-1 py-2.5 text-xs font-mono capitalize transition-all"
              style={mode === m ? { backgroundColor: `${accent}20`, color: accent } : { color: "#71717a" }}>
              {m}
            </button>
          ))}
        </div>

        {/* Input type (only for encode) */}
        {mode === "encode" && (
          <div className="flex gap-2">
            {(["text", "file"] as const).map(t => (
              <button key={t} onClick={() => setInputType(t)}
                className="px-3 py-1.5 text-xs font-mono rounded border transition-all capitalize"
                style={inputType === t ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        {(mode === "decode" || inputType === "text") ? (
          <textarea value={text} onChange={e => { setText(e.target.value); setStatus("idle"); }}
            className="w-full h-32 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed"
            placeholder={mode === "encode" ? "enter text to encode..." : "paste base64 to decode..."} />
        ) : (
          <div onClick={() => fileInputRef.current?.click()}
            className="border border-dashed rounded p-6 text-center cursor-pointer transition-all"
            style={{ borderColor: "#2a2a2a" }}>
            <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
            {file ? <div className="text-sm font-mono text-[#e4e4e7]">{file.name} · {(file.size / 1024).toFixed(0)} KB</div>
              : <div className="text-sm text-[#71717a] font-mono">drop any file or click to browse</div>}
          </div>
        )}

        {/* URL-safe toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-[#71717a]">URL-safe (replaces +/= with -_)</span>
          <button onClick={() => setUrlSafe(s => !s)}
            className="w-10 h-5 rounded-full border transition-all relative"
            style={{ borderColor: urlSafe ? accent : "#3f3f46", backgroundColor: urlSafe ? `${accent}30` : "transparent" }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
              style={{ backgroundColor: urlSafe ? accent : "#3f3f46", left: urlSafe ? "calc(100% - 18px)" : "2px" }} />
          </button>
        </div>

        <button onClick={process} disabled={mode === "encode" ? (!text.trim() && !file) : !text.trim()}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
          style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
          {mode}
        </button>

        {status === "error" && <div className="text-xs text-center text-[#EF4444] font-mono">{errorMsg}</div>}

        {output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">{output.length} characters</span>
              <div className="flex gap-2">
                <button onClick={downloadOutput} className="text-[10px] font-mono px-3 py-1 rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7]">download</button>
                <button onClick={copy} className="text-[10px] font-mono px-3 py-1 rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7]">
                  {copied ? "copied ✓" : "copy"}
                </button>
              </div>
            </div>
            <textarea readOnly value={output}
              className="w-full h-32 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono resize-none focus:outline-none leading-relaxed break-all"
              style={{ color: accent }} />
          </div>
        )}
      </div>
    </ToolShell>
  );
}
