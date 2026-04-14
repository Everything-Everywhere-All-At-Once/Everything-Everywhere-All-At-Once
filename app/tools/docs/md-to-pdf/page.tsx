"use client";

import { useState, useRef } from "react";
import { ToolShell } from "@/components/tool-shell";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const accent = "#94A3B8";

const THEMES = {
  dark: { bg: [13, 13, 13], text: [228, 228, 231], heading: [148, 163, 184], code: [71, 71, 82] },
  light: { bg: [255, 255, 255], text: [24, 24, 27], heading: [63, 63, 70], code: [228, 228, 231] },
  sepia: { bg: [253, 246, 227], text: [101, 74, 36], heading: [88, 110, 117], code: [238, 232, 213] },
} as const;

type Theme = keyof typeof THEMES;

const PAGE_CONFIGS = {
  A4: { width: 595, height: 842 },
  Letter: { width: 612, height: 792 },
  A3: { width: 842, height: 1191 },
} as const;

type PageSize = keyof typeof PAGE_CONFIGS;

const SAMPLE = `# Document Title

This is a paragraph with some **bold text** and *italic text* inline.

## Section One

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Subsection

- Item one
- Item two
- Item three

## Code Example

\`\`\`
const hello = "world";
console.log(hello);
\`\`\`

## Numbered List

1. First item
2. Second item
3. Third item

> This is a blockquote with important information.

---

Footer content goes here.`;

export default function MdToPdfPage() {
  const [markdown, setMarkdown] = useState(SAMPLE);
  const [theme, setTheme] = useState<Theme>("light");
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [fontSize, setFontSize] = useState(11);
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const previewRef = useRef<HTMLDivElement>(null);

  const generatePdf = async () => {
    setStatus("generating");
    try {
      const { marked } = await import("marked");
      const colors = THEMES[theme];
      const { width, height } = PAGE_CONFIGS[pageSize];
      const margin = 60;
      const contentWidth = width - margin * 2;

      const pdf = await PDFDocument.create();
      const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
      const italicFont = await pdf.embedFont(StandardFonts.HelveticaOblique);
      const monoFont = await pdf.embedFont(StandardFonts.Courier);

      const bgColor = rgb(colors.bg[0] / 255, colors.bg[1] / 255, colors.bg[2] / 255);
      const textColor = rgb(colors.text[0] / 255, colors.text[1] / 255, colors.text[2] / 255);
      const headingColor = rgb(colors.heading[0] / 255, colors.heading[1] / 255, colors.heading[2] / 255);
      const codeColor = rgb(colors.code[0] / 255, colors.code[1] / 255, colors.code[2] / 255);
      const accentRgb = rgb(148 / 255, 163 / 255, 184 / 255);

      let page = pdf.addPage([width, height]);
      page.drawRectangle({ x: 0, y: 0, width, height, color: bgColor });
      let y = height - margin;

      const newPage = () => {
        page = pdf.addPage([width, height]);
        page.drawRectangle({ x: 0, y: 0, width, height, color: bgColor });
        y = height - margin;
      };

      const ensureSpace = (needed: number) => {
        if (y - needed < margin) newPage();
      };

      const wrapText = (text: string, font: typeof regularFont, size: number, maxWidth: number): string[] => {
        const words = text.split(" ");
        const lines: string[] = [];
        let current = "";
        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
            lines.push(current);
            current = word;
          } else {
            current = test;
          }
        }
        if (current) lines.push(current);
        return lines;
      };

      const drawLines = (lines: string[], font: typeof regularFont, size: number, color: typeof textColor, lineHeight = 1.5, indent = 0) => {
        for (const line of lines) {
          ensureSpace(size * lineHeight);
          y -= size * lineHeight;
          page.drawText(line, { x: margin + indent, y, font, size, color });
        }
      };

      // Parse markdown to tokens
      const tokens = marked.lexer(markdown);

      for (const token of tokens) {
        if (token.type === "heading") {
          const sizes = { 1: fontSize + 8, 2: fontSize + 5, 3: fontSize + 3, 4: fontSize + 1, 5: fontSize, 6: fontSize };
          const sz = sizes[token.depth as 1 | 2 | 3 | 4 | 5 | 6] ?? fontSize;
          ensureSpace(sz * 2.5);
          y -= sz * 1.2;
          // Strip inline markdown from heading text
          const headingText = token.text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/`(.*?)`/g, "$1");
          const lines = wrapText(headingText, boldFont, sz, contentWidth);
          for (const line of lines) {
            page.drawText(line, { x: margin, y, font: boldFont, size: sz, color: token.depth === 1 ? accentRgb : headingColor });
            y -= sz * 1.4;
          }
          // Underline for h1
          if (token.depth === 1) {
            page.drawLine({ start: { x: margin, y: y + sz * 0.8 }, end: { x: margin + contentWidth, y: y + sz * 0.8 }, thickness: 0.5, color: accentRgb });
            y -= 4;
          }
          y -= 4;
        } else if (token.type === "paragraph") {
          const rawText = token.text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/`(.*?)`/g, "$1").replace(/\n/g, " ");
          const lines = wrapText(rawText, regularFont, fontSize, contentWidth);
          drawLines(lines, regularFont, fontSize, textColor);
          y -= 6;
        } else if (token.type === "list") {
          for (const item of token.items) {
            const rawText = item.text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
            const bullet = token.ordered ? "" : "•";
            const lines = wrapText(rawText, regularFont, fontSize, contentWidth - 16);
            ensureSpace(fontSize * 1.5 * lines.length);
            for (let i = 0; i < lines.length; i++) {
              y -= fontSize * 1.5;
              if (i === 0) {
                const prefix = token.ordered ? `${token.items.indexOf(item) + 1}.` : bullet;
                page.drawText(prefix, { x: margin, y, font: regularFont, size: fontSize, color: textColor });
              }
              page.drawText(lines[i], { x: margin + 14, y, font: regularFont, size: fontSize, color: textColor });
            }
          }
          y -= 6;
        } else if (token.type === "code") {
          const codeLines = token.text.split("\n");
          const codeFontSize = fontSize - 1;
          const codeBlockHeight = codeLines.length * codeFontSize * 1.6 + 16;
          ensureSpace(codeBlockHeight);
          page.drawRectangle({ x: margin - 8, y: y - codeBlockHeight + 8, width: contentWidth + 16, height: codeBlockHeight, color: codeColor, opacity: 0.3 });
          for (const line of codeLines) {
            y -= codeFontSize * 1.6;
            const trimmed = line.length > 80 ? line.slice(0, 77) + "..." : line;
            if (trimmed) page.drawText(trimmed, { x: margin, y, font: monoFont, size: codeFontSize, color: textColor });
          }
          y -= 12;
        } else if (token.type === "blockquote") {
          const rawText = token.text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/`(.*?)`/g, "$1").replace(/\n/g, " ");
          const lines = wrapText(rawText, italicFont, fontSize, contentWidth - 20);
          const blockHeight = lines.length * fontSize * 1.6 + 8;
          ensureSpace(blockHeight);
          page.drawRectangle({ x: margin, y: y - blockHeight + 4, width: 3, height: blockHeight, color: accentRgb });
          for (const line of lines) {
            y -= fontSize * 1.6;
            page.drawText(line, { x: margin + 12, y, font: italicFont, size: fontSize, color: headingColor });
          }
          y -= 8;
        } else if (token.type === "hr") {
          ensureSpace(16);
          y -= 8;
          page.drawLine({ start: { x: margin, y }, end: { x: margin + contentWidth, y }, thickness: 0.5, color: headingColor, opacity: 0.3 });
          y -= 8;
        } else if (token.type === "space") {
          y -= fontSize * 0.8;
        }
      }

      const bytes = await pdf.save();
      const blob = new Blob([(bytes as Uint8Array).slice(0)], { type: "application/pdf" });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  const renderPreview = async () => {
    if (!previewRef.current) return;
    try {
      const { marked } = await import("marked");
      previewRef.current.innerHTML = await marked.parse(markdown);
    } catch { /* ignore */ }
  };

  const handleTabChange = (t: "write" | "preview") => {
    setTab(t);
    if (t === "preview") setTimeout(renderPreview, 50);
  };

  return (
    <ToolShell category="Documents & PDF" categoryHref="/tools/docs" accent={accent} title="Markdown → PDF" description="Write or paste Markdown and export it as a styled PDF — rendered entirely in browser.">
      <div className="space-y-5">
        {/* Controls row */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">theme</label>
            <div className="flex gap-2">
              {(Object.keys(THEMES) as Theme[]).map(t => (
                <button key={t} onClick={() => setTheme(t)}
                  className="px-3 py-1.5 text-xs font-mono rounded border transition-all capitalize"
                  style={theme === t ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">page size</label>
            <div className="flex gap-2">
              {(Object.keys(PAGE_CONFIGS) as PageSize[]).map(s => (
                <button key={s} onClick={() => setPageSize(s)}
                  className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                  style={pageSize === s ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">font size — {fontSize}pt</label>
            <div className="flex gap-2">
              {[9, 11, 13, 15].map(s => (
                <button key={s} onClick={() => setFontSize(s)}
                  className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                  style={fontSize === s ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {s}pt
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[#2a2a2a]">
          {(["write", "preview"] as const).map(t => (
            <button key={t} onClick={() => handleTabChange(t)}
              className="px-4 py-2 text-xs font-mono capitalize transition-colors"
              style={tab === t ? { color: accent, borderBottom: `1px solid ${accent}` } : { color: "#71717a" }}>
              {t}
            </button>
          ))}
        </div>

        {/* Editor / Preview */}
        {tab === "write" ? (
          <textarea value={markdown} onChange={e => setMarkdown(e.target.value)}
            className="w-full h-80 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed"
            placeholder="# Your Markdown here..." />
        ) : (
          <div ref={previewRef}
            className="w-full min-h-80 bg-[#141414] border border-[#2a2a2a] rounded p-6 text-sm text-[#e4e4e7] leading-relaxed prose prose-invert max-w-none"
            style={{ fontFamily: "system-ui, sans-serif" }} />
        )}

        {/* Generate button */}
        <button onClick={generatePdf} disabled={!markdown.trim() || status === "generating"}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
          style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
          {status === "generating" ? "generating pdf..." : status === "done" ? "pdf ready ✓" : "generate pdf"}
        </button>

        {downloadUrl && (
          <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
            <div className="text-xs font-mono text-[#e4e4e7]">document.pdf · {theme} theme · {pageSize}</div>
            <div className="flex gap-2">
              <a href={downloadUrl} download="document.pdf" className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>download</a>
              <button onClick={() => { setDownloadUrl(null); setStatus("idle"); }} className="px-4 py-2 text-xs font-mono rounded border border-[#2a2a2a] text-[#71717a]">reset</button>
            </div>
          </div>
        )}

        {status === "error" && <div className="text-xs text-center text-[#EF4444] font-mono">generation failed — check your markdown</div>}
      </div>
    </ToolShell>
  );
}
