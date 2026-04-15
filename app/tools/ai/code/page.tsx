"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#FACC15";

const LANGUAGES = ["auto-detect", "JavaScript", "TypeScript", "Python", "Rust", "Go", "Java", "C", "C++", "SQL", "Bash", "Other"] as const;

function detectLanguage(code: string): string {
  if (/^\s*def |^\s*import |^\s*class |print\(|\.py\b/.test(code)) return "Python";
  if (/\bfn\s+\w+|let\s+mut\b|println!\(/.test(code)) return "Rust";
  if (/\bfunc\s+\w+|\bpackage\s+main\b|fmt\./.test(code)) return "Go";
  if (/\bpublic\s+class|\bSystem\.out\.print/.test(code)) return "Java";
  if (/\bSELECT\b|\bFROM\b|\bWHERE\b/i.test(code)) return "SQL";
  if (/\bconst\b|\blet\b|\bfunction\b|\b=>\b|\.ts\b/.test(code) && /:\s*\w+/.test(code)) return "TypeScript";
  if (/\bconst\b|\blet\b|\bfunction\b|\b=>\b|console\.log/.test(code)) return "JavaScript";
  if (/^#!\/bin\/(ba)?sh|echo\s|grep\s|awk\s/.test(code)) return "Bash";
  return "Unknown";
}

interface Section {
  label: string;
  content: string;
}

function explainCode(code: string, lang: string): Section[] {
  const lines = code.trim().split("\n");
  const lineCount = lines.length;
  const charCount = code.length;

  // Detect features
  const hasLoop = /\bfor\b|\bwhile\b|\bloop\b/.test(code);
  const hasConditional = /\bif\b|\belse\b|\bswitch\b|\bmatch\b/.test(code);
  const hasFunctions = /\bfunction\b|\bdef\b|\bfn\b|\bfunc\b|\b=>\b/.test(code);
  const hasClasses = /\bclass\b|\bstruct\b|\binterface\b/.test(code);
  const hasAsync = /\basync\b|\bawait\b|\bPromise\b|async def/.test(code);
  const hasImports = /\bimport\b|\brequire\b|\buse\b/.test(code);
  const hasError = /\btry\b|\bcatch\b|\bexcept\b|\bthrow\b|\bResult\b|\bOption\b/.test(code);
  const hasComments = /\/\/|\/\*|#\s|"""/.test(code);

  const features: string[] = [];
  if (hasImports) features.push("imports/dependencies");
  if (hasFunctions) features.push("function definitions");
  if (hasClasses) features.push("class/struct definitions");
  if (hasLoop) features.push("iteration (loops)");
  if (hasConditional) features.push("conditional logic (if/else)");
  if (hasAsync) features.push("asynchronous operations");
  if (hasError) features.push("error handling");
  if (hasComments) features.push("inline comments");

  // Complexity guess
  const complexity = lineCount < 10 ? "low" : lineCount < 50 ? "medium" : "high";
  const complexityNote = lineCount < 10
    ? "short, focused snippet"
    : lineCount < 50
    ? "moderate length — likely a single function or module"
    : "larger codebase section — may span multiple responsibilities";

  const sections: Section[] = [
    {
      label: "overview",
      content: `${lineCount} lines of ${lang} code (${charCount} characters). Complexity: ${complexity} — ${complexityNote}.`,
    },
    {
      label: "features detected",
      content: features.length > 0 ? features.join(", ") : "No specific patterns detected — may be a simple expression or data literal.",
    },
  ];

  // Per-line annotations (first 20 lines)
  const annotated = lines.slice(0, 20).map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) return null;

    let note = "";
    if (/^import |^from .+ import|^use |^require/.test(trimmed)) note = "imports a dependency or module";
    else if (/^(export )?(default )?(async )?function |^(const|let|var)\s+\w+\s*=\s*(async\s*)?\(/.test(trimmed)) note = "defines a function";
    else if (/^(export )?(abstract )?class |^(pub )?struct |^interface /.test(trimmed)) note = "defines a class, struct, or interface";
    else if (/^(const|let|var)\s+/.test(trimmed)) note = "declares a variable";
    else if (/\breturn\b/.test(trimmed)) note = "returns a value from this scope";
    else if (/\bif\s*\(|if\s+/.test(trimmed)) note = "conditional branch";
    else if (/\bfor\s*\(|for\s+|\.map\(|\.forEach\(|\.filter\(/.test(trimmed)) note = "iteration or data transformation";
    else if (/\btry\s*\{|\bcatch\s*\(|\bexcept\s/.test(trimmed)) note = "error handling block";
    else if (/\bawait\b/.test(trimmed)) note = "waits for an async operation";
    else if (/console\.|print\(|println!\(|fmt\.Print/.test(trimmed)) note = "outputs/logs a value";

    if (!note) return null;
    return { lineNum: i + 1, code: line, note };
  }).filter(Boolean) as { lineNum: number; code: string; note: string }[];

  if (annotated.length > 0) {
    sections.push({
      label: "line-by-line highlights",
      content: annotated.map(a => `L${a.lineNum}: ${a.note}`).join("\n"),
    });
  }

  // Suggestions
  const suggestions: string[] = [];
  if (!hasComments && lineCount > 5) suggestions.push("Add comments to document intent, especially for complex logic.");
  if (hasAsync && !hasError) suggestions.push("Async operations without error handling can cause unhandled rejections — consider wrapping with try/catch.");
  if (/\beval\(/.test(code)) suggestions.push("eval() is a security risk — avoid if possible.");
  if (/var\s+/.test(code) && lang.includes("Script")) suggestions.push("Prefer 'const' or 'let' over 'var' for clearer scoping.");
  if (/console\.log/.test(code)) suggestions.push("Remove console.log statements before production.");
  if (suggestions.length > 0) {
    sections.push({ label: "suggestions", content: suggestions.join("\n") });
  }

  return sections;
}

export default function CodePage() {
  const [input, setInput] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("auto-detect");
  const [sections, setSections] = useState<Section[] | null>(null);

  const lang = selectedLang === "auto-detect" ? detectLanguage(input) : selectedLang;

  const run = () => {
    if (!input.trim()) return;
    setSections(explainCode(input, lang));
  };

  const lineCount = input.split("\n").length;

  return (
    <ToolShell category="AI Tools" categoryHref="/tools/ai" accent={accent} title="Code Explainer" description="Paste any code snippet and get a plain-English breakdown — runs entirely in your browser. No data sent anywhere.">
      <div className="space-y-5">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">code snippet</label>
            <span className="text-[10px] font-mono text-[#52525b]">{lineCount} lines</span>
          </div>
          <textarea value={input} onChange={e => { setInput(e.target.value); setSections(null); }}
            placeholder="paste your code here..."
            className="w-full h-56 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none focus:border-[#3f3f46] placeholder:text-[#3f3f46] transition-colors" />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">language</label>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map(l => (
              <button key={l} onClick={() => setSelectedLang(l)}
                className="px-2.5 py-1 text-[10px] font-mono rounded border transition-all"
                style={selectedLang === l
                  ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` }
                  : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {l === "auto-detect" && input ? `auto (${lang})` : l}
              </button>
            ))}
          </div>
        </div>

        <button onClick={run} disabled={!input.trim()}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-40"
          style={{ borderColor: accent, color: sections ? "#0d0d0d" : accent, backgroundColor: sections ? accent : `${accent}15` }}>
          explain code
        </button>

        {sections && (
          <div className="space-y-3">
            {sections.map((s, i) => (
              <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: accent }}>{s.label}</div>
                <pre className="text-xs font-mono text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">{s.content}</pre>
              </div>
            ))}
          </div>
        )}

        <div className="text-[10px] font-mono text-[#3f3f46] text-center">static analysis · 100% local · no data sent anywhere</div>
      </div>
    </ToolShell>
  );
}
