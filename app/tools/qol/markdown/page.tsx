"use client";

import { useState, useEffect, useRef } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

const STARTER = `# Markdown Editor

Write **bold**, *italic*, or \`inline code\`.

## Lists

- Item one
- Item two
  - Nested item

1. First
2. Second

## Code Block

\`\`\`js
const hello = "world";
console.log(hello);
\`\`\`

## Blockquote

> The best tools are invisible.

---

[Link example](https://example.com) | **Bold** | *Italic* | ~~Strikethrough~~
`;

export default function MarkdownPage() {
  const [source, setSource] = useState(STARTER);
  const [html, setHtml] = useState("");
  const [tab, setTab] = useState<"split" | "write" | "preview">("split");
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    import("marked").then(({ marked }) => {
      if (!cancelled) setHtml(marked.parse(source) as string);
    });
    return () => { cancelled = true; };
  }, [source]);

  const wordCount = source.trim() ? source.trim().split(/\s+/).length : 0;
  const charCount = source.length;

  const copyHtml = () => {
    navigator.clipboard.writeText(html).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const download = (type: "md" | "html") => {
    const blob = new Blob([type === "md" ? source : `<!DOCTYPE html><html><body>${html}</body></html>`], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `document.${type}`;
    a.click();
  };

  const Preview = () => (
    <div ref={previewRef}
      className="w-full h-full overflow-auto bg-[#141414] rounded p-6 text-sm text-[#e4e4e7] leading-relaxed"
      style={{ fontFamily: "system-ui, sans-serif", minHeight: "400px" }}
      dangerouslySetInnerHTML={{ __html: html }} />
  );

  const Editor = () => (
    <textarea value={source} onChange={e => setSource(e.target.value)}
      className="w-full h-full bg-[#141414] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed border border-[#2a2a2a]"
      style={{ minHeight: "400px" }} />
  );

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="Markdown Editor" description="Write Markdown with live preview — export as .md or .html.">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex border-b border-[#2a2a2a] gap-1">
            {(["write", "split", "preview"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-3 py-1.5 text-xs font-mono capitalize transition-colors"
                style={tab === t ? { color: accent, borderBottom: `1px solid ${accent}` } : { color: "#71717a" }}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-[#3f3f46]">{wordCount}w · {charCount}c</span>
            <button onClick={copyHtml} className="text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">{copied ? "copied ✓" : "copy html"}</button>
            <button onClick={() => download("md")} className="text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">.md</button>
            <button onClick={() => download("html")} className="text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">.html</button>
          </div>
        </div>

        {tab === "split" ? (
          <div className="grid grid-cols-2 gap-4">
            <Editor />
            <Preview />
          </div>
        ) : tab === "write" ? (
          <Editor />
        ) : (
          <div className="border border-[#2a2a2a] rounded overflow-hidden">
            <Preview />
          </div>
        )}
      </div>
    </ToolShell>
  );
}
