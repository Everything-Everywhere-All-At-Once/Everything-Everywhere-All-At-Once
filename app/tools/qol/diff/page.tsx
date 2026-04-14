"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

type DiffLine = { type: "same" | "add" | "remove"; text: string; lineA?: number; lineB?: number };

function computeDiff(a: string, b: string): DiffLine[] {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const m = aLines.length, n = bLines.length;
  // LCS-based diff using DP
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = aLines[i] === bLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const result: DiffLine[] = [];
  let i = 0, j = 0, lineA = 1, lineB = 1;
  while (i < m || j < n) {
    if (i < m && j < n && aLines[i] === bLines[j]) {
      result.push({ type: "same", text: aLines[i], lineA: lineA++, lineB: lineB++ });
      i++; j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ type: "add", text: bLines[j], lineB: lineB++ });
      j++;
    } else {
      result.push({ type: "remove", text: aLines[i], lineA: lineA++ });
      i++;
    }
  }
  return result;
}

export default function DiffPage() {
  const [left, setLeft] = useState("The quick brown fox\njumps over the lazy dog.\nHello world!\nLine four.");
  const [right, setRight] = useState("The quick brown fox\nleaps over the lazy cat.\nHello world!\nLine five.\nNew line added.");
  const [mode, setMode] = useState<"split" | "unified">("unified");

  const diff = computeDiff(left, right);
  const added = diff.filter(l => l.type === "add").length;
  const removed = diff.filter(l => l.type === "remove").length;

  const lineStyle = (type: DiffLine["type"]) => {
    if (type === "add") return { backgroundColor: "#22C55E10", color: "#22C55E", borderLeft: "2px solid #22C55E" };
    if (type === "remove") return { backgroundColor: "#EF444410", color: "#EF4444", borderLeft: "2px solid #EF4444" };
    return { color: "#71717a", borderLeft: "2px solid transparent" };
  };

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="Diff Checker" description="Compare two blocks of text line-by-line — see additions, removals, and unchanged lines.">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">original</label>
            <textarea value={left} onChange={e => setLeft(e.target.value)}
              className="w-full h-40 bg-[#141414] border border-[#2a2a2a] rounded p-3 text-xs font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed" />
          </div>
          <div>
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">modified</label>
            <textarea value={right} onChange={e => setRight(e.target.value)}
              className="w-full h-40 bg-[#141414] border border-[#2a2a2a] rounded p-3 text-xs font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed" />
          </div>
        </div>

        {/* Stats + mode */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-xs font-mono">
            <span style={{ color: "#22C55E" }}>+{added} added</span>
            <span style={{ color: "#EF4444" }}>-{removed} removed</span>
            <span className="text-[#3f3f46]">{diff.filter(l => l.type === "same").length} unchanged</span>
          </div>
          <div className="flex gap-2">
            {(["unified", "split"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="px-3 py-1 text-[10px] font-mono rounded border capitalize transition-all"
                style={mode === m ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Diff output */}
        {mode === "unified" ? (
          <div className="border border-[#2a2a2a] rounded overflow-hidden">
            <div className="px-4 py-2 bg-[#141414] border-b border-[#2a2a2a]">
              <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">unified diff</span>
            </div>
            <div className="overflow-x-auto">
              {diff.map((line, i) => (
                <div key={i} className="flex text-xs font-mono px-3 py-0.5" style={lineStyle(line.type)}>
                  <span className="w-8 shrink-0 text-[#3f3f46] select-none">{line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}</span>
                  <span className="w-10 shrink-0 text-[#3f3f46] select-none text-right mr-3">
                    {line.type !== "add" ? line.lineA : ""}{line.type !== "remove" && line.type !== "add" ? "," : ""}{line.type !== "remove" ? line.lineB : ""}
                  </span>
                  <span className="whitespace-pre">{line.text || " "}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {["remove", "add"].map(side => (
              <div key={side} className="border border-[#2a2a2a] rounded overflow-hidden">
                <div className="px-3 py-1.5 bg-[#141414] border-b border-[#2a2a2a]">
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: side === "add" ? "#22C55E" : "#EF4444" }}>
                    {side === "add" ? "modified" : "original"}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  {diff.filter(l => l.type === "same" || l.type === side).map((line, i) => (
                    <div key={i} className="flex text-xs font-mono px-2 py-0.5" style={lineStyle(line.type)}>
                      <span className="w-8 shrink-0 text-[#3f3f46] select-none text-right mr-2">
                        {side === "remove" ? line.lineA : line.lineB}
                      </span>
                      <span className="whitespace-pre">{line.text || " "}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
