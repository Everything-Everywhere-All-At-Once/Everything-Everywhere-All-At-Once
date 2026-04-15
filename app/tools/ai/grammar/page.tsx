"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#FACC15";

interface Issue {
  type: "spelling" | "grammar" | "style";
  message: string;
  original: string;
  suggestion: string;
  index: number;
  length: number;
}

// Common misspellings dictionary
const MISSPELLINGS: Record<string, string> = {
  teh: "the", hte: "the", thier: "their", recieve: "receive", beleive: "believe",
  seperate: "separate", occured: "occurred", definately: "definitely", alot: "a lot",
  goverment: "government", beggining: "beginning", buisness: "business",
  calender: "calendar", cemetary: "cemetery", concious: "conscious",
  convienent: "convenient", existance: "existence", foriegn: "foreign",
  freind: "friend", grammer: "grammar", harrass: "harass", humourous: "humorous",
  ignorence: "ignorance", independance: "independence", indispensible: "indispensable",
  liason: "liaison", maintainance: "maintenance", millenium: "millennium",
  mispell: "misspell", neccessary: "necessary", noticable: "noticeable",
  occassion: "occasion", occurance: "occurrence", ommit: "omit",
  persistance: "persistence", posession: "possession", priviledge: "privilege",
  recomend: "recommend", refered: "referred", relevent: "relevant",
  remberber: "remember", repitition: "repetition", resturaunt: "restaurant",
  rythm: "rhythm", sargent: "sergeant", similer: "similar", sucess: "success",
  suprise: "surprise", tendancy: "tendency", truely: "truly", untill: "until",
  usualy: "usually", vaccum: "vacuum", visious: "vicious", wierd: "weird",
  writting: "writing", tommorrow: "tomorrow", yesturday: "yesterday",
  wich: "which", becuase: "because", doesnt: "doesn't", dont: "don't",
  cant: "can't", wont: "won't", youre: "you're", theyre: "they're",
  its: "it's", /* only flag unambiguous */ wouldnt: "wouldn't",
};

// Grammar patterns [regex, message, suggestion-template]
type GrammarRule = [RegExp, string, string];
const GRAMMAR_RULES: GrammarRule[] = [
  [/\ba\s+[aeiou]/gi, 'Use "an" before vowel sounds', 'an'],
  [/\s{2,}/g, "Extra whitespace", " "],
  [/([.!?])\s*([a-z])/g, "Sentence should start with a capital letter", ""],
  [/\bi\b(?!\s*[''])/g, 'The pronoun "I" should be capitalized', "I"],
  [/\b(very|really|extremely|quite|rather)\s+(very|really|extremely)\b/gi, "Redundant intensifiers", ""],
  [/\b(in order to)\b/gi, '"in order to" can be simplified to "to"', "to"],
  [/\b(due to the fact that)\b/gi, 'Wordy — use "because"', "because"],
  [/\b(at this point in time)\b/gi, 'Wordy — use "now"', "now"],
  [/\b(the fact that)\b/gi, '"the fact that" is often unnecessary', ""],
  [/\b(utilize)\b/gi, '"utilize" — consider using "use"', "use"],
  [/[,]{2,}/g, "Multiple commas", ","],
  [/\.\./g, "Double period", "."],
];

function analyze(text: string): Issue[] {
  const issues: Issue[] = [];

  // Spelling check — word by word
  const wordRe = /\b([a-zA-Z]+)\b/g;
  let m;
  while ((m = wordRe.exec(text)) !== null) {
    const word = m[1];
    const lower = word.toLowerCase();
    if (MISSPELLINGS[lower]) {
      issues.push({
        type: "spelling",
        message: `Possible misspelling: "${word}"`,
        original: word,
        suggestion: MISSPELLINGS[lower],
        index: m.index,
        length: word.length,
      });
    }
  }

  // Grammar rules
  for (const [pattern, message, suggestion] of GRAMMAR_RULES) {
    const re = new RegExp(pattern.source, pattern.flags);
    let gm;
    while ((gm = re.exec(text)) !== null) {
      issues.push({
        type: "grammar",
        message,
        original: gm[0],
        suggestion,
        index: gm.index,
        length: gm[0].length,
      });
    }
  }

  // Style: passive voice hint (rough heuristic)
  const passiveRe = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi;
  while ((m = passiveRe.exec(text)) !== null) {
    issues.push({
      type: "style",
      message: "Possible passive voice — consider rephrasing actively",
      original: m[0],
      suggestion: "",
      index: m.index,
      length: m[0].length,
    });
  }

  // Deduplicate overlapping
  issues.sort((a, b) => a.index - b.index);
  const deduped: Issue[] = [];
  let lastEnd = -1;
  for (const iss of issues) {
    if (iss.index >= lastEnd) {
      deduped.push(iss);
      lastEnd = iss.index + iss.length;
    }
  }

  return deduped;
}

const TYPE_COLOR: Record<Issue["type"], string> = {
  spelling: "#EF4444",
  grammar: "#FACC15",
  style: "#60A5FA",
};

export default function GrammarPage() {
  const [input, setInput] = useState("");
  const [issues, setIssues] = useState<Issue[] | null>(null);

  const check = () => setIssues(analyze(input));
  const clear = () => { setInput(""); setIssues(null); };

  const wordCount = input.trim().split(/\s+/).filter(Boolean).length;

  return (
    <ToolShell category="AI Tools" categoryHref="/tools/ai" accent={accent} title="Grammar Checker" description="Catch spelling mistakes, grammar issues, and style suggestions — runs entirely in your browser. No data sent anywhere.">
      <div className="space-y-5">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">your text</label>
            <span className="text-[10px] font-mono text-[#52525b]">{wordCount} words</span>
          </div>
          <textarea value={input} onChange={e => { setInput(e.target.value); setIssues(null); }}
            placeholder="paste or type your text here..."
            className="w-full h-48 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none focus:border-[#3f3f46] placeholder:text-[#3f3f46] transition-colors" />
        </div>

        <div className="flex gap-2">
          <button onClick={check} disabled={!input.trim()}
            className="flex-1 py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-40"
            style={{ borderColor: accent, color: "#0d0d0d", backgroundColor: accent }}>
            check grammar
          </button>
          {issues !== null && (
            <button onClick={clear}
              className="px-5 py-3 text-sm font-mono rounded border border-[#2a2a2a] text-[#71717a] hover:border-[#3f3f46] hover:text-[#a1a1aa] transition-all">
              clear
            </button>
          )}
        </div>

        {issues !== null && (
          <>
            {/* Summary bar */}
            <div className="flex gap-4 flex-wrap">
              {(["spelling", "grammar", "style"] as const).map(type => {
                const count = issues.filter(i => i.type === type).length;
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLOR[type] }} />
                    <span className="text-xs font-mono" style={{ color: count > 0 ? TYPE_COLOR[type] : "#52525b" }}>
                      {count} {type}
                    </span>
                  </div>
                );
              })}
              {issues.length === 0 && (
                <span className="text-xs font-mono text-[#22C55E]">no issues found — looks good!</span>
              )}
            </div>

            {/* Issues list */}
            {issues.length > 0 && (
              <div className="space-y-2">
                {issues.map((iss, i) => (
                  <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${TYPE_COLOR[iss.type]}20`, color: TYPE_COLOR[iss.type] }}>
                            {iss.type}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-[#a1a1aa]">{iss.message}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-mono text-[#EF4444] line-through opacity-70">"{iss.original}"</span>
                          {iss.suggestion && (
                            <>
                              <span className="text-[10px] text-[#3f3f46]">→</span>
                              <span className="text-xs font-mono text-[#22C55E]">"{iss.suggestion}"</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="text-[10px] font-mono text-[#3f3f46] text-center">rule-based analysis · 100% local · no data sent anywhere</div>
      </div>
    </ToolShell>
  );
}
