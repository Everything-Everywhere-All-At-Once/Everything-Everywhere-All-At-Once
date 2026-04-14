"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const accent = "#94A3B8";

type PageSize = "A4" | "Letter" | "A3";
const PAGE_CONFIGS: Record<PageSize, [number, number]> = {
  A4: [595, 842], Letter: [612, 792], A3: [842, 1191],
};

type Theme = "light" | "dark";

export default function DocxToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "converting" | "done" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [theme, setTheme] = useState<Theme>("light");
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = async (f: File) => {
    setFile(f);
    setStatus("idle");
    setDownloadUrl(null);
    setPreview("");
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
      const htmlContent = result.value;
      setPreview(htmlContent);

      // Parse HTML to extract text with basic structure
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");

      const [width, height] = PAGE_CONFIGS[pageSize];
      const margin = 60;
      const contentWidth = width - margin * 2;
      const isDark = theme === "dark";

      const pdf = await PDFDocument.create();
      const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
      const italicFont = await pdf.embedFont(StandardFonts.HelveticaOblique);

      const bgColor = isDark ? rgb(0.05, 0.05, 0.05) : rgb(1, 1, 1);
      const textColor = isDark ? rgb(0.9, 0.9, 0.9) : rgb(0.1, 0.1, 0.1);
      const headingColor = isDark ? rgb(0.58, 0.64, 0.72) : rgb(0.2, 0.2, 0.4);

      let page = pdf.addPage([width, height]);
      page.drawRectangle({ x: 0, y: 0, width, height, color: bgColor });
      let y = height - margin;

      const newPage = () => {
        page = pdf.addPage([width, height]);
        page.drawRectangle({ x: 0, y: 0, width, height, color: bgColor });
        y = height - margin;
      };

      const ensureSpace = (needed: number) => { if (y - needed < margin) newPage(); };

      const wrapText = (text: string, font: typeof regularFont, size: number): string[] => {
        const words = text.split(" ");
        const lines: string[] = [];
        let current = "";
        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          if (font.widthOfTextAtSize(test, size) > contentWidth && current) {
            lines.push(current); current = word;
          } else current = test;
        }
        if (current) lines.push(current);
        return lines;
      };

      const drawBlock = (text: string, font: typeof regularFont, size: number, color: typeof textColor, spacing = 1.5, indent = 0) => {
        const lines = wrapText(text, font, size);
        for (const line of lines) {
          ensureSpace(size * spacing);
          y -= size * spacing;
          if (line.trim()) page.drawText(line, { x: margin + indent, y, font, size, color });
        }
      };

      // Walk DOM nodes
      const walk = (node: Element) => {
        const tag = node.tagName?.toLowerCase();
        const text = node.textContent?.trim() ?? "";
        if (!text) { node.childNodes.forEach(c => { if (c.nodeType === 1) walk(c as Element); }); return; }

        if (/^h[1-3]$/.test(tag)) {
          const sizes: Record<string, number> = { h1: 20, h2: 16, h3: 13 };
          y -= 8;
          drawBlock(text, boldFont, sizes[tag] ?? 13, headingColor, 1.4);
          y -= 4;
        } else if (tag === "p") {
          // Check for bold/italic children
          const hasBold = node.querySelector("strong, b");
          const hasItalic = node.querySelector("em, i");
          const font = hasBold ? boldFont : hasItalic ? italicFont : regularFont;
          drawBlock(text, font, 11, textColor);
          y -= 3;
        } else if (tag === "li") {
          drawBlock(`• ${text}`, regularFont, 11, textColor, 1.4, 8);
          y -= 2;
        } else if (tag === "table") {
          // Simple table: just render each cell as text
          node.querySelectorAll("tr").forEach(row => {
            const cells = Array.from(row.querySelectorAll("td, th")).map(c => c.textContent?.trim() ?? "");
            const cellText = cells.join("  |  ");
            const isHeader = row.querySelector("th");
            drawBlock(cellText, isHeader ? boldFont : regularFont, 10, textColor, 1.4);
            y -= 2;
          });
          y -= 4;
        } else {
          node.childNodes.forEach(c => { if (c.nodeType === 1) walk(c as Element); });
        }
      };

      doc.body.childNodes.forEach(n => { if (n.nodeType === 1) walk(n as Element); });

      const bytes = await pdf.save();
      const blob = new Blob([(bytes as Uint8Array).slice(0)], { type: "application/pdf" });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  return (
    <ToolShell category="Documents & PDF" categoryHref="/tools/docs" accent={accent} title="DOCX → PDF" description="Convert Word documents to PDF — preserves headings, paragraphs, lists, and tables. All in browser.">
      <div className="space-y-5">
        <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed rounded p-8 text-center mb-0 cursor-pointer transition-all"
          style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}>
          <input ref={fileInputRef} type="file" accept=".docx,.doc" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
          {file
            ? <div className="font-mono text-sm text-[#e4e4e7]">{file.name} · {(file.size / 1024).toFixed(0)} KB</div>
            : <><div className="text-2xl mb-2 opacity-20">⬡</div>
              <div className="text-sm text-[#71717a] font-mono">drop .docx file or click to browse</div>
              <div className="text-xs text-[#3f3f46] mt-1">.docx and .doc formats supported</div></>}
        </div>

        {file && (
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
                {(["light", "dark"] as Theme[]).map(t => (
                  <button key={t} onClick={() => setTheme(t)}
                    className="flex-1 py-1.5 text-xs font-mono rounded border capitalize transition-all"
                    style={theme === t ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {file && (
          <button onClick={convert} disabled={status === "converting"}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
            {status === "converting" ? "converting..." : status === "done" ? "converted ✓" : "convert to PDF"}
          </button>
        )}

        {status === "error" && <div className="text-xs text-center text-[#EF4444] font-mono">conversion failed — ensure the file is a valid .docx</div>}

        {/* HTML Preview */}
        {preview && (
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">document preview</label>
            <div className="bg-white rounded border border-[#2a2a2a] p-6 max-h-64 overflow-auto text-sm text-gray-900 leading-relaxed"
              style={{ fontFamily: "system-ui, sans-serif" }}
              dangerouslySetInnerHTML={{ __html: preview }} />
          </div>
        )}

        {downloadUrl && (
          <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
            <div className="text-xs font-mono text-[#e4e4e7]">{file?.name.replace(/\.[^.]+$/, "")}.pdf · {pageSize}</div>
            <a href={downloadUrl} download={`${file?.name.replace(/\.[^.]+$/, "")}.pdf`}
              className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>
              download
            </a>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
