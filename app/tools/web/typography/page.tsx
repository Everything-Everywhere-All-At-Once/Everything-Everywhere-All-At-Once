"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#EC4899";

const PAIRS = [
  { heading: "Playfair Display", body: "Source Sans Pro", tags: ["elegant", "editorial"] },
  { heading: "Montserrat", body: "Merriweather", tags: ["modern", "readable"] },
  { heading: "Raleway", body: "Lato", tags: ["clean", "geometric"] },
  { heading: "Oswald", body: "Open Sans", tags: ["bold", "versatile"] },
  { heading: "Libre Baskerville", body: "Lato", tags: ["classic", "serif"] },
  { heading: "Josefin Sans", body: "Josefin Slab", tags: ["matching", "vintage"] },
  { heading: "Bebas Neue", body: "Roboto", tags: ["impact", "display"] },
  { heading: "Cormorant Garamond", body: "Proza Libre", tags: ["luxury", "fashion"] },
  { heading: "Space Grotesk", body: "Space Mono", tags: ["tech", "mono"] },
  { heading: "Fraunces", body: "Epilogue", tags: ["editorial", "contrast"] },
  { heading: "DM Serif Display", body: "DM Sans", tags: ["balanced", "modern"] },
  { heading: "Abril Fatface", body: "Poppins", tags: ["bold", "playful"] },
];

export default function TypographyPage() {
  const [selected, setSelected] = useState(0);
  const [sampleText, setSampleText] = useState("The quick brown fox\njumps over the lazy dog.");
  const [headingSize, setHeadingSize] = useState(36);
  const [bodySize, setBodySize] = useState(16);
  const [search, setSearch] = useState("");
  const [loadedFonts, setLoadedFonts] = useState<Set<number>>(new Set());

  const filtered = PAIRS.map((p, i) => ({ ...p, i })).filter(p =>
    !search || p.heading.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.includes(search.toLowerCase()))
  );

  const loadFonts = (i: number) => {
    if (loadedFonts.has(i)) return;
    const pair = PAIRS[i];
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${pair.heading.replace(/ /g, "+")}:wght@400;700&family=${pair.body.replace(/ /g, "+")}:wght@400;400i&display=swap`;
    document.head.appendChild(link);
    setLoadedFonts(s => new Set([...s, i]));
  };

  const selectPair = (i: number) => {
    setSelected(i);
    loadFonts(i);
  };

  const pair = PAIRS[selected];

  return (
    <ToolShell category="Web Design" categoryHref="/tools/webdesign" accent={accent} title="Typography Pairer" description="Browse curated font combinations — preview with your own text, export CSS.">
      <div className="space-y-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none"
          placeholder="search pairs..." />

        <div className="grid grid-cols-3 gap-2">
          {filtered.map(({ heading, body, tags, i }) => (
            <button key={i} onClick={() => selectPair(i)}
              className="p-3 rounded border text-left transition-all"
              style={selected === i ? { borderColor: accent, backgroundColor: `${accent}08` } : { borderColor: "#2a2a2a" }}>
              <div className="text-xs font-semibold text-[#e4e4e7] truncate">{heading}</div>
              <div className="text-[10px] text-[#71717a] truncate">{body}</div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {tags.map(t => <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${accent}15`, color: accent }}>{t}</span>)}
              </div>
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="border border-[#2a2a2a] rounded overflow-hidden">
          <div className="px-4 py-2 bg-[#141414] border-b border-[#2a2a2a] flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">preview — {pair.heading} + {pair.body}</span>
            <div className="flex gap-3">
              <label className="flex items-center gap-1 text-[10px] font-mono text-[#71717a]">
                H: <input type="number" value={headingSize} onChange={e => setHeadingSize(Number(e.target.value))} className="w-10 bg-transparent text-center font-mono text-[#e4e4e7] focus:outline-none" />px
              </label>
              <label className="flex items-center gap-1 text-[10px] font-mono text-[#71717a]">
                B: <input type="number" value={bodySize} onChange={e => setBodySize(Number(e.target.value))} className="w-10 bg-transparent text-center font-mono text-[#e4e4e7] focus:outline-none" />px
              </label>
            </div>
          </div>
          <div className="p-8 bg-white">
            <h2 style={{ fontFamily: `'${pair.heading}', serif`, fontSize: `${headingSize}px`, lineHeight: 1.2, color: "#111", marginBottom: "12px", fontWeight: 700 }}>
              {sampleText.split("\n")[0]}
            </h2>
            <p style={{ fontFamily: `'${pair.body}', sans-serif`, fontSize: `${bodySize}px`, lineHeight: 1.7, color: "#333" }}>
              {sampleText.split("\n").slice(1).join(" ") || "Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789"}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">sample text</label>
          <textarea value={sampleText} onChange={e => setSampleText(e.target.value)} rows={2}
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none resize-none" />
        </div>

        {/* CSS */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
          <div className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest mb-2">CSS</div>
          <pre className="text-xs font-mono text-[#e4e4e7] leading-relaxed">{`@import url('https://fonts.googleapis.com/css2?family=${pair.heading.replace(/ /g, "+")}:wght@400;700&family=${pair.body.replace(/ /g, "+")}:wght@400;400i&display=swap');

h1, h2, h3, h4 {
  font-family: '${pair.heading}', serif;
}

body, p {
  font-family: '${pair.body}', sans-serif;
}`}</pre>
        </div>
      </div>
    </ToolShell>
  );
}
