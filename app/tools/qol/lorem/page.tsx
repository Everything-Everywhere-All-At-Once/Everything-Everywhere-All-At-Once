"use client";

import { useState, useMemo } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");

function sentence(rng: () => number): string {
  const len = 8 + Math.floor(rng() * 12);
  const words = Array.from({ length: len }, (_, i) => {
    const w = WORDS[Math.floor(rng() * WORDS.length)];
    return i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w;
  });
  return words.join(" ") + (rng() > 0.85 ? "." : rng() > 0.7 ? "!" : ".");
}

function paragraph(rng: () => number): string {
  const count = 3 + Math.floor(rng() * 4);
  return Array.from({ length: count }, () => sentence(rng)).join(" ");
}

// Simple seeded rng so output is stable per seed
function makeRng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

export default function LoremPage() {
  const [type, setType]   = useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const [count, setCount] = useState(3);
  const [startLorem, setStartLorem] = useState(true);
  const [seed, setSeed]   = useState(42);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    const rng = makeRng(seed);
    let text = "";
    if (type === "paragraphs") {
      const paras = Array.from({ length: count }, () => paragraph(rng));
      if (startLorem) paras[0] = "Lorem ipsum dolor sit amet, " + paras[0].charAt(0).toLowerCase() + paras[0].slice(1);
      text = paras.join("\n\n");
    } else if (type === "sentences") {
      const sents = Array.from({ length: count }, () => sentence(rng));
      if (startLorem) sents[0] = "Lorem ipsum dolor sit amet.";
      text = sents.join(" ");
    } else {
      const words = Array.from({ length: count }, () => WORDS[Math.floor(rng() * WORDS.length)]);
      if (startLorem) words.splice(0, 2, "lorem", "ipsum");
      text = words.join(" ");
    }
    return text;
  }, [type, count, startLorem, seed]);

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="Lorem Ipsum Generator" description="Generate placeholder text by paragraphs, sentences, or words — instantly copy to clipboard.">
      <div className="space-y-5">
        {/* Type */}
        <div className="flex rounded border border-[#2a2a2a] overflow-hidden">
          {(["paragraphs", "sentences", "words"] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className="flex-1 py-2.5 text-xs font-mono capitalize transition-all"
              style={type === t ? { backgroundColor: `${accent}20`, color: accent } : { color: "#71717a" }}>
              {t}
            </button>
          ))}
        </div>

        {/* Count */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">
            count — {count} {type}
          </label>
          <input type="range" min={1} max={type === "words" ? 200 : type === "sentences" ? 20 : 10}
            value={count} onChange={e => setCount(+e.target.value)}
            className="w-full cursor-pointer" style={{ accentColor: accent }} />
        </div>

        {/* Options */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div onClick={() => setStartLorem(v => !v)}
              className="w-8 h-4 rounded-full relative transition-colors"
              style={{ backgroundColor: startLorem ? accent : "#2a2a2a" }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                style={{ left: startLorem ? "calc(100% - 14px)" : "2px" }} />
            </div>
            <span className="text-xs font-mono text-[#71717a]">start with &quot;Lorem ipsum&quot;</span>
          </label>
          <button onClick={() => setSeed(s => s + 1)} className="text-[10px] font-mono text-[#52525b] hover:text-[#a1a1aa] transition-colors">
            regenerate
          </button>
        </div>

        {/* Output */}
        <div className="relative">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm text-[#a1a1aa] leading-relaxed font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
            {output}
          </div>
          <button onClick={copy}
            className="absolute top-2 right-2 px-2.5 py-1 text-[10px] font-mono rounded border transition-all"
            style={copied ? { borderColor: `${accent}60`, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#52525b" }}>
            {copied ? "copied" : "copy"}
          </button>
        </div>

        <div className="text-[10px] font-mono text-[#3f3f46] text-center">
          {output.split(/\s+/).length} words · {output.length} chars
        </div>
      </div>
    </ToolShell>
  );
}
