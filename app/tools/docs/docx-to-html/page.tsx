"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#94A3B8";

export default function DocxToHtmlPage() {
  const [file, setFile] = useState<File | null>(null);
  const [html, setHtml] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "converting" | "done" | "error">("idle");
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = (f: File) => {
    setFile(f); setHtml(""); setStatus("idle"); setMessages([]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".docx") || f.name.endsWith(".doc"))) loadFile(f);
  }, []);

  const convert = async () => {
    if (!file) return;
    setStatus("converting");
    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      // Clean and format the HTML
      const raw = result.value;
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, "text/html");

      // Remove empty paragraphs
      doc.querySelectorAll("p").forEach(p => {
        if (!p.textContent?.trim()) p.remove();
      });

      const cleanHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${file.name.replace(/\.[^.]+$/, "")}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.7; color: #1a1a1a; }
    h1, h2, h3, h4 { margin-top: 1.5em; margin-bottom: 0.5em; }
    p { margin-bottom: 1em; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    td, th { border: 1px solid #ccc; padding: 0.5rem 0.75rem; }
    th { background: #f5f5f5; font-weight: 600; }
    ul, ol { padding-left: 1.5rem; margin-bottom: 1em; }
    li { margin-bottom: 0.25em; }
  </style>
</head>
<body>
${doc.body.innerHTML}
</body>
</html>`;

      setHtml(cleanHtml);
      setMessages(result.messages.map(m => m.message));
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(html).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const download = (type: "html" | "txt") => {
    const content = type === "html" ? html : html.replace(/<[^>]+>/g, "").replace(/\s{2,}/g, "\n").trim();
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${file?.name.replace(/\.[^.]+$/, "")}.${type}`;
    a.click();
  };

  // Extract just body HTML for preview
  const previewHtml = html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? html;

  return (
    <ToolShell category="Documents & PDF" categoryHref="/tools/docs" accent={accent} title="DOCX → HTML" description="Convert Word documents to clean, semantic HTML — ready to paste into any website or CMS.">
      <div className="space-y-5">
        <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed rounded p-8 text-center cursor-pointer transition-all"
          style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
          <input ref={fileInputRef} type="file" accept=".docx,.doc" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
          {file
            ? <div className="font-mono text-sm text-[#e4e4e7]">{file.name} · {(file.size / 1024).toFixed(0)} KB</div>
            : <><div className="text-sm text-[#71717a] font-mono">drop .docx file or click to browse</div></>}
        </div>

        {file && (
          <button onClick={convert} disabled={status === "converting"}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
            {status === "converting" ? "converting..." : status === "done" ? "converted ✓" : "convert to HTML"}
          </button>
        )}

        {status === "error" && <div className="text-xs text-center text-[#EF4444] font-mono">conversion failed — ensure the file is a valid .docx</div>}

        {messages.length > 0 && (
          <div className="text-[10px] font-mono text-[#71717a] bg-[#141414] border border-[#2a2a2a] rounded p-3 space-y-1">
            {messages.map((m, i) => <div key={i}>{m}</div>)}
          </div>
        )}

        {html && (
          <div className="space-y-3">
            {/* Tabs + actions */}
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-0">
              <div className="flex">
                {(["preview", "code"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className="px-4 py-1.5 text-xs font-mono capitalize transition-colors"
                    style={tab === t ? { color: accent, borderBottom: `1px solid ${accent}` } : { color: "#71717a" }}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pb-1">
                <button onClick={copy} className="text-[10px] font-mono px-3 py-1 rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7]">
                  {copied ? "copied ✓" : "copy html"}
                </button>
                <button onClick={() => download("html")} className="text-[10px] font-mono px-3 py-1 rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7]">.html</button>
                <button onClick={() => download("txt")} className="text-[10px] font-mono px-3 py-1 rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>.txt</button>
              </div>
            </div>

            {tab === "preview" ? (
              <div className="bg-white rounded border border-[#2a2a2a] p-6 max-h-96 overflow-auto text-sm text-gray-900 leading-relaxed"
                style={{ fontFamily: "system-ui, sans-serif" }}
                dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <textarea readOnly value={html}
                className="w-full h-80 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-xs font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed" />
            )}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
