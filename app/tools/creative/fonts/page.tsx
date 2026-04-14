"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#FB923C";

const FONTS = [
  { name: "Inter", category: "sans-serif", tags: ["clean", "ui", "modern"] },
  { name: "Roboto", category: "sans-serif", tags: ["google", "ui", "neutral"] },
  { name: "Open Sans", category: "sans-serif", tags: ["readable", "friendly", "body"] },
  { name: "Lato", category: "sans-serif", tags: ["humanist", "body", "clean"] },
  { name: "Poppins", category: "sans-serif", tags: ["geometric", "heading", "modern"] },
  { name: "Nunito", category: "sans-serif", tags: ["rounded", "friendly", "ui"] },
  { name: "Montserrat", category: "sans-serif", tags: ["geometric", "heading", "bold"] },
  { name: "Raleway", category: "sans-serif", tags: ["elegant", "thin", "heading"] },
  { name: "Oswald", category: "sans-serif", tags: ["condensed", "heading", "bold"] },
  { name: "Source Sans Pro", category: "sans-serif", tags: ["body", "readable", "neutral"] },
  { name: "Playfair Display", category: "serif", tags: ["editorial", "elegant", "heading"] },
  { name: "Merriweather", category: "serif", tags: ["readable", "body", "traditional"] },
  { name: "Lora", category: "serif", tags: ["elegant", "body", "editorial"] },
  { name: "Georgia", category: "serif", tags: ["classic", "readable", "body"] },
  { name: "Libre Baskerville", category: "serif", tags: ["classic", "heading", "traditional"] },
  { name: "Cormorant Garamond", category: "serif", tags: ["luxury", "heading", "fashion"] },
  { name: "JetBrains Mono", category: "monospace", tags: ["code", "terminal", "developer"] },
  { name: "Fira Code", category: "monospace", tags: ["code", "ligatures", "developer"] },
  { name: "Source Code Pro", category: "monospace", tags: ["code", "neutral", "developer"] },
  { name: "Space Mono", category: "monospace", tags: ["tech", "display", "retro"] },
  { name: "Courier New", category: "monospace", tags: ["classic", "typewriter", "code"] },
  { name: "Dancing Script", category: "display", tags: ["script", "handwriting", "elegant"] },
  { name: "Pacifico", category: "display", tags: ["retro", "fun", "display"] },
  { name: "Bebas Neue", category: "display", tags: ["condensed", "bold", "impact"] },
  { name: "Abril Fatface", category: "display", tags: ["bold", "display", "contrast"] },
];

const CATEGORIES = ["all", "sans-serif", "serif", "monospace", "display"] as const;

export default function FontsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("all");
  const [sampleText, setSampleText] = useState("The quick brown fox");
  const [fontSize, setFontSize] = useState(24);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = FONTS.filter(f => {
    const matchCat = category === "all" || f.category === category;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.tags.some(t => t.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const loadFont = (name: string) => {
    if (loadedFonts.has(name)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}:wght@400;700&display=swap`;
    document.head.appendChild(link);
    setLoadedFonts(s => new Set([...s, name]));
  };

  const copy = (val: string) => {
    navigator.clipboard.writeText(val).then(() => { setCopied(val); setTimeout(() => setCopied(null), 1500); });
  };

  return (
    <ToolShell category="Creative & Art" categoryHref="/tools/creative" accent={accent} title="Font Finder" description="Browse and preview free Google Fonts — filter by category, search by name or style.">
      <div className="space-y-5">
        <div className="flex gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none"
            placeholder="search fonts..." />
          <input value={sampleText} onChange={e => setSampleText(e.target.value)}
            className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none"
            placeholder="preview text..." />
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className="px-3 py-1.5 text-xs font-mono rounded border transition-all capitalize"
              style={category === c ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
              {c}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-[10px] font-mono text-[#71717a]">size</label>
            <input type="range" min={12} max={60} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
              className="w-24 cursor-pointer" style={{ accentColor: accent }} />
            <span className="text-[10px] font-mono text-[#71717a]">{fontSize}px</span>
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map(font => (
            <div key={font.name}
              className="border border-[#2a2a2a] rounded overflow-hidden"
              onMouseEnter={() => loadFont(font.name)}>
              <div className="px-4 py-3 bg-[#141414] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#e4e4e7]">{font.name}</span>
                  <span className="text-[10px] font-mono text-[#3f3f46]">{font.category}</span>
                  <div className="flex gap-1">
                    {font.tags.map(t => (
                      <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${accent}15`, color: accent }}>{t}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => copy(`@import url('https://fonts.googleapis.com/css2?family=${font.name.replace(/ /g, "+")}:wght@400;700&display=swap');`)}
                  className="text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7] shrink-0">
                  {copied?.includes(font.name.replace(/ /g, "+")) ? "copied ✓" : "copy import"}
                </button>
              </div>
              <div className="px-4 py-4 bg-[#0d0d0d]">
                <div style={{ fontFamily: `'${font.name}', ${font.category}`, fontSize, color: "#e4e4e7", lineHeight: 1.3 }}>
                  {sampleText || font.name}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && <div className="text-center text-xs font-mono text-[#3f3f46] py-8">no fonts match your search</div>}
      </div>
    </ToolShell>
  );
}
