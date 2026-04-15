"use client";

import { useMemo } from "react";
import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

function analyze(text: string) {
  const chars      = text.length;
  const charsNoSp  = text.replace(/\s/g, "").length;
  const words      = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const sentences  = text.trim() === "" ? 0 : (text.match(/[.!?]+/g) ?? []).length || (text.trim() ? 1 : 0);
  const paragraphs = text.trim() === "" ? 0 : text.split(/\n\s*\n/).filter(p => p.trim()).length || (text.trim() ? 1 : 0);
  const lines      = text === "" ? 0 : text.split("\n").length;
  const readingMin = Math.ceil(words / 200);
  const speakingMin= Math.ceil(words / 130);

  // Frequency
  const freq: Record<string, number> = {};
  for (const w of text.toLowerCase().match(/\b[a-z']{2,}\b/g) ?? []) freq[w] = (freq[w] ?? 0) + 1;
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const avgWordLen = words === 0 ? 0 : (charsNoSp / words).toFixed(1);

  return { chars, charsNoSp, words, sentences, paragraphs, lines, readingMin, speakingMin, top, avgWordLen };
}

export default function WordCountPage() {
  const [text, setText] = useState("");
  const stats = useMemo(() => analyze(text), [text]);

  const statRows = [
    ["Words",           stats.words],
    ["Characters",      stats.chars],
    ["Chars (no spaces)", stats.charsNoSp],
    ["Sentences",       stats.sentences],
    ["Paragraphs",      stats.paragraphs],
    ["Lines",           stats.lines],
    ["Avg word length", stats.avgWordLen],
    ["Reading time",    `~${stats.readingMin} min`],
    ["Speaking time",   `~${stats.speakingMin} min`],
  ];

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="Word Counter" description="Paste any text — instantly see word count, character count, reading time, and top words.">
      <div className="space-y-5">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="paste or type your text here..."
          className="w-full h-52 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none focus:border-[#3f3f46] placeholder:text-[#3f3f46] transition-colors"
        />

        {/* Main stats */}
        <div className="grid grid-cols-3 gap-3">
          {[["words", stats.words], ["chars", stats.chars], ["~read", `${stats.readingMin}m`]].map(([label, val]) => (
            <div key={label} className="bg-[#141414] border border-[#2a2a2a] rounded p-4 text-center">
              <div className="text-3xl font-black font-mono" style={{ color: accent }}>{val}</div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-[#52525b] mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* All stats */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
          {statRows.map(([label, val], i) => (
            <div key={label} className={`flex items-center justify-between px-4 py-2.5 text-xs font-mono ${i !== statRows.length - 1 ? "border-b border-[#1e1e1e]" : ""}`}>
              <span className="text-[#52525b]">{label}</span>
              <span className="text-[#e4e4e7]">{val}</span>
            </div>
          ))}
        </div>

        {/* Top words */}
        {stats.top.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b] mb-3">top words</div>
            <div className="flex flex-wrap gap-2">
              {stats.top.map(([word, count]) => (
                <div key={word} className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#1e1e1e] bg-[#111111]">
                  <span className="text-xs font-mono text-[#e4e4e7]">{word}</span>
                  <span className="text-[9px] font-mono px-1 rounded" style={{ backgroundColor: `${accent}20`, color: accent }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
