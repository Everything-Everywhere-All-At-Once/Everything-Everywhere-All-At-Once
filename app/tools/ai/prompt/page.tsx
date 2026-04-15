"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#FACC15";

const ROLES = ["assistant", "expert", "teacher", "analyst", "writer", "developer", "designer", "researcher", "coach", "critic"] as const;
const TONES = ["professional", "casual", "concise", "detailed", "friendly", "formal", "creative", "technical"] as const;
const FORMATS = ["plain text", "bullet points", "numbered list", "markdown", "JSON", "table", "step-by-step", "code"] as const;

interface PromptConfig {
  role: string;
  task: string;
  context: string;
  tone: string;
  format: string;
  constraints: string;
  examples: string;
  customRole: string;
}

function buildPrompt(cfg: PromptConfig): string {
  const role = cfg.role === "custom" ? cfg.customRole : cfg.role;
  const parts: string[] = [];

  if (role) parts.push(`You are a ${role}.`);

  if (cfg.task.trim()) parts.push(cfg.task.trim());

  if (cfg.context.trim()) parts.push(`\nContext:\n${cfg.context.trim()}`);

  const style: string[] = [];
  if (cfg.tone) style.push(`tone: ${cfg.tone}`);
  if (cfg.format) style.push(`format: ${cfg.format}`);
  if (style.length) parts.push(`\nRespond with a ${style.join(", ")} style.`);

  if (cfg.constraints.trim()) {
    parts.push(`\nConstraints:\n${cfg.constraints.trim()}`);
  }

  if (cfg.examples.trim()) {
    parts.push(`\nExamples:\n${cfg.examples.trim()}`);
  }

  return parts.join(" ");
}

export default function PromptPage() {
  const [cfg, setCfg] = useState<PromptConfig>({
    role: "assistant",
    task: "",
    context: "",
    tone: "professional",
    format: "plain text",
    constraints: "",
    examples: "",
    customRole: "",
  });
  const [copied, setCopied] = useState(false);

  const update = (key: keyof PromptConfig) => (val: string) =>
    setCfg(prev => ({ ...prev, [key]: val }));

  const prompt = buildPrompt(cfg);
  const hasContent = cfg.task.trim().length > 0;

  const copy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const reset = () => setCfg({
    role: "assistant", task: "", context: "", tone: "professional",
    format: "plain text", constraints: "", examples: "", customRole: "",
  });

  return (
    <ToolShell category="AI Tools" categoryHref="/tools/ai" accent={accent} title="Prompt Builder" description="Craft structured prompts for any AI model using a guided template — copy and paste anywhere.">
      <div className="space-y-5">

        {/* Role */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">role / persona</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ROLES.map(r => (
              <button key={r} onClick={() => update("role")(r)}
                className="px-2.5 py-1 text-[10px] font-mono rounded border transition-all"
                style={cfg.role === r
                  ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` }
                  : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {r}
              </button>
            ))}
            <button onClick={() => update("role")("custom")}
              className="px-2.5 py-1 text-[10px] font-mono rounded border transition-all"
              style={cfg.role === "custom"
                ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` }
                : { borderColor: "#2a2a2a", color: "#71717a" }}>
              custom
            </button>
          </div>
          {cfg.role === "custom" && (
            <input value={cfg.customRole} onChange={e => update("customRole")(e.target.value)}
              placeholder="e.g. senior penetration tester"
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-3 py-2 text-sm font-mono text-[#e4e4e7] placeholder:text-[#3f3f46] focus:outline-none focus:border-[#3f3f46] transition-colors" />
          )}
        </div>

        {/* Task */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">task / instruction <span className="text-[#3f3f46] normal-case tracking-normal">(required)</span></label>
          <textarea value={cfg.task} onChange={e => update("task")(e.target.value)}
            placeholder="What should the AI do? Be specific."
            rows={3}
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded p-3 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none focus:border-[#3f3f46] placeholder:text-[#3f3f46] transition-colors" />
        </div>

        {/* Context */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">context <span className="text-[#3f3f46] normal-case tracking-normal">(optional)</span></label>
          <textarea value={cfg.context} onChange={e => update("context")(e.target.value)}
            placeholder="Background information, relevant data, or situation..."
            rows={2}
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded p-3 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none focus:border-[#3f3f46] placeholder:text-[#3f3f46] transition-colors" />
        </div>

        {/* Tone + Format */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">tone</label>
            <div className="flex flex-wrap gap-1">
              {TONES.map(t => (
                <button key={t} onClick={() => update("tone")(t)}
                  className="px-2 py-0.5 text-[9px] font-mono rounded border transition-all"
                  style={cfg.tone === t
                    ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` }
                    : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">output format</label>
            <div className="flex flex-wrap gap-1">
              {FORMATS.map(f => (
                <button key={f} onClick={() => update("format")(f)}
                  className="px-2 py-0.5 text-[9px] font-mono rounded border transition-all"
                  style={cfg.format === f
                    ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` }
                    : { borderColor: "#2a2a2a", color: "#71717a" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Constraints */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">constraints <span className="text-[#3f3f46] normal-case tracking-normal">(optional)</span></label>
          <textarea value={cfg.constraints} onChange={e => update("constraints")(e.target.value)}
            placeholder="e.g. max 200 words, no jargon, must include a summary..."
            rows={2}
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded p-3 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none focus:border-[#3f3f46] placeholder:text-[#3f3f46] transition-colors" />
        </div>

        {/* Examples */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">examples <span className="text-[#3f3f46] normal-case tracking-normal">(optional, few-shot)</span></label>
          <textarea value={cfg.examples} onChange={e => update("examples")(e.target.value)}
            placeholder="Input: ...\nOutput: ..."
            rows={2}
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded p-3 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none focus:border-[#3f3f46] placeholder:text-[#3f3f46] transition-colors" />
        </div>

        {/* Preview */}
        {hasContent && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e1e1e]">
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>generated prompt</span>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-[#3f3f46]">{prompt.length} chars</span>
                <button onClick={copy} className="text-[10px] font-mono transition-colors" style={{ color: copied ? accent : "#52525b" }}>
                  {copied ? "copied!" : "copy"}
                </button>
              </div>
            </div>
            <div className="p-4">
              <pre className="text-xs font-mono text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">{prompt}</pre>
            </div>
          </div>
        )}

        {!hasContent && (
          <div className="text-center text-xs font-mono text-[#3f3f46] py-4">fill in the task field to preview your prompt</div>
        )}

        <div className="flex gap-2">
          <button onClick={copy} disabled={!hasContent}
            className="flex-1 py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: "#0d0d0d", backgroundColor: accent }}>
            {copied ? "copied!" : "copy prompt"}
          </button>
          <button onClick={reset}
            className="px-5 py-3 text-sm font-mono rounded border border-[#2a2a2a] text-[#71717a] hover:border-[#3f3f46] hover:text-[#a1a1aa] transition-all">
            reset
          </button>
        </div>

        <div className="text-[10px] font-mono text-[#3f3f46] text-center">works with Claude, GPT, Gemini, Llama, or any LLM · no data sent anywhere</div>
      </div>
    </ToolShell>
  );
}
