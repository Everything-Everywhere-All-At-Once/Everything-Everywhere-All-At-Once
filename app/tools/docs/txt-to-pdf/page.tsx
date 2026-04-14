"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const accent = "#94A3B8";

type PageSize = "A4" | "Letter" | "A3";
const PAGE_CONFIGS: Record<PageSize, [number, number]> = {
  A4: [595, 842], Letter: [612, 792], A3: [842, 1191],
};

const FONTS = ["Helvetica", "Courier", "Times-Roman"] as const;
type FontName = typeof FONTS[number];

export default function TxtToPdfPage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [fontName, setFontName] = useState<FontName>("Helvetica");
  const [fontSize, setFontSize] = useState(11);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [margin, setMargin] = useState(60);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = async (f: File) => {
    setFile(f);
    const t = await f.text();
    setText(t);
    setStatus("idle");
    setDownloadUrl(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) loadFile(f);
  }, []);

  const generate = async () => {
    if (!text.trim()) return;
    setStatus("generating");
    try {
      const [width, height] = PAGE_CONFIGS[pageSize];
      const contentWidth = width - margin * 2;
      const isDark = theme === "dark";

      const pdf = await PDFDocument.create();
      const standardFontMap: Record<FontName, string> = {
        "Helvetica": StandardFonts.Helvetica,
        "Courier": StandardFonts.Courier,
        "Times-Roman": StandardFonts.TimesRoman,
      };
      const font = await pdf.embedFont(standardFontMap[fontName]);

      const bgColor = isDark ? rgb(0.05, 0.05, 0.05) : rgb(1, 1, 1);
      const textColor = isDark ? rgb(0.9, 0.9, 0.9) : rgb(0.1, 0.1, 0.1);

      let page = pdf.addPage([width, height]);
      page.drawRectangle({ x: 0, y: 0, width, height, color: bgColor });
      let y = height - margin;

      const wrapLine = (line: string): string[] => {
        if (!line.trim()) return [""];
        const words = line.split(" ");
        const lines: string[] = [];
        let cur = "";
        for (const word of words) {
          const test = cur ? `${cur} ${word}` : word;
          if (font.widthOfTextAtSize(test, fontSize) > contentWidth && cur) {
            lines.push(cur); cur = word;
          } else cur = test;
        }
        if (cur !== undefined) lines.push(cur);
        return lines;
      };

      const inputLines = text.split("\n");
      for (const inputLine of inputLines) {
        const wrapped = wrapLine(inputLine);
        for (const line of wrapped) {
          if (y - fontSize * lineHeight < margin) {
            page = pdf.addPage([width, height]);
            page.drawRectangle({ x: 0, y: 0, width, height, color: bgColor });
            y = height - margin;
          }
          y -= fontSize * lineHeight;
          if (line.trim()) {
            page.drawText(line, { x: margin, y, font, size: fontSize, color: textColor });
          }
        }
      }

      const bytes = await pdf.save();
      const blob = new Blob([(bytes as Uint8Array).slice(0)], { type: "application/pdf" });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch { setStatus("error"); }
  };

  const lineCount = text.split("\n").length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <ToolShell category="Documents & PDF" categoryHref="/tools/docs" accent={accent} title="TXT / CSV → PDF" description="Convert plain text or CSV files to a clean PDF — choose font, page size, margins, and theme.">
      <div className="space-y-5">
        {/* Drop zone */}
        <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed rounded p-4 text-center cursor-pointer transition-all"
          style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
          <input ref={fileInputRef} type="file" accept=".txt,.csv,.tsv,.log,.md,.json,.xml" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
          <div className="text-xs font-mono text-[#71717a]">
            {file ? `${file.name} loaded` : "drop .txt / .csv / any text file — or paste below"}
          </div>
        </div>

        {/* Text area */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[10px] tracking-widest text-[#71717a] uppercase font-mono">content</label>
            <span className="text-[10px] font-mono text-[#3f3f46]">{wordCount}w · {lineCount} lines</span>
          </div>
          <textarea value={text} onChange={e => { setText(e.target.value); setStatus("idle"); setDownloadUrl(null); }}
            className="w-full h-48 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-xs font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed"
            placeholder="paste text here or drop a file above..." />
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">page size</label>
            <div className="flex gap-2">
              {(["A4", "Letter", "A3"] as PageSize[]).map(s => (
                <button key={s} onClick={() => setPageSize(s)}
                  className="flex-1 py-1.5 text-xs font-mono rounded border transition-all"
                  style={pageSize === s ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">theme</label>
            <div className="flex gap-2">
              {(["light", "dark"] as const).map(t => (
                <button key={t} onClick={() => setTheme(t)}
                  className="flex-1 py-1.5 text-xs font-mono rounded border capitalize transition-all"
                  style={theme === t ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">font</label>
            <div className="flex gap-2">
              {FONTS.map(f => (
                <button key={f} onClick={() => setFontName(f)}
                  className="flex-1 py-1.5 text-xs font-mono rounded border transition-all"
                  style={fontName === f ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {f === "Times-Roman" ? "Times" : f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">font size — {fontSize}pt</label>
            <div className="flex gap-2">
              {[9, 11, 13, 15].map(s => (
                <button key={s} onClick={() => setFontSize(s)}
                  className="flex-1 py-1.5 text-xs font-mono rounded border transition-all"
                  style={fontSize === s ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">line height — {lineHeight}×</label>
            <input type="range" min={1.2} max={2.4} step={0.1} value={lineHeight} onChange={e => setLineHeight(Number(e.target.value))}
              className="w-full cursor-pointer" style={{ accentColor: accent }} />
          </div>
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">margin — {margin}pt</label>
            <input type="range" min={20} max={100} step={5} value={margin} onChange={e => setMargin(Number(e.target.value))}
              className="w-full cursor-pointer" style={{ accentColor: accent }} />
          </div>
        </div>

        <button onClick={generate} disabled={!text.trim() || status === "generating"}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
          style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
          {status === "generating" ? "generating..." : status === "done" ? "pdf ready ✓" : "generate PDF"}
        </button>

        {status === "error" && <div className="text-xs text-center text-[#EF4444] font-mono">generation failed</div>}

        {downloadUrl && (
          <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
            <div className="text-xs font-mono text-[#e4e4e7]">{file ? file.name.replace(/\.[^.]+$/, "") : "document"}.pdf · {pageSize} · {fontName}</div>
            <a href={downloadUrl} download={`${file ? file.name.replace(/\.[^.]+$/, "") : "document"}.pdf`}
              className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>download</a>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
