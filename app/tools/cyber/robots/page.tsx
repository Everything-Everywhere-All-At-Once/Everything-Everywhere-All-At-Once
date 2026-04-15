"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#22C55E";

type Rule = { userAgent: string; allows: string[]; disallows: string[]; crawlDelay?: number };
type Parsed = { rules: Rule[]; sitemaps: string[]; host?: string; raw: string };

function parseRobots(text: string): Parsed {
  const lines = text.split(/\r?\n/);
  const rules: Rule[] = [];
  const sitemaps: string[] = [];
  let host: string | undefined;
  let current: Rule | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [field, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    const key = field.trim().toLowerCase();

    if (key === "user-agent") {
      if (current && (current.allows.length || current.disallows.length || current.crawlDelay !== undefined)) {
        rules.push(current);
      }
      current = { userAgent: value, allows: [], disallows: [] };
    } else if (key === "allow" && current) {
      if (value) current.allows.push(value);
    } else if (key === "disallow" && current) {
      if (value) current.disallows.push(value);
    } else if (key === "crawl-delay" && current) {
      current.crawlDelay = parseFloat(value);
    } else if (key === "sitemap") {
      sitemaps.push(value);
    } else if (key === "host") {
      host = value;
    }
  }
  if (current && (current.allows.length || current.disallows.length || current.crawlDelay !== undefined)) {
    rules.push(current);
  }
  return { rules, sitemaps, host, raw: text };
}

export default function RobotsPage() {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mode, setMode] = useState<"fetch" | "paste">("fetch");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const analyze = async () => {
    setStatus("loading");
    setError("");
    setParsed(null);
    try {
      let content = text;
      if (mode === "fetch") {
        let base = url.trim();
        if (!base.startsWith("http")) base = "https://" + base;
        const robotsUrl = new URL("/robots.txt", base).toString();
        const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(robotsUrl)}`;
        const res = await fetch(proxy);
        const data = await res.json();
        if (!data.contents) throw new Error("could not fetch robots.txt");
        content = data.contents;
      }
      setParsed(parseRobots(content));
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
      setStatus("error");
    }
  };

  return (
    <ToolShell category="Cybersecurity" categoryHref="/tools/cyber" accent={accent} title="robots.txt Analyzer" description="Fetch or paste a robots.txt and see exactly what each user-agent is allowed or blocked from.">
      <div className="space-y-5">
        {/* Mode */}
        <div className="flex rounded border border-[#2a2a2a] overflow-hidden">
          {(["fetch", "paste"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setStatus("idle"); setParsed(null); }}
              className="flex-1 py-2.5 text-xs font-mono capitalize transition-all"
              style={mode === m ? { backgroundColor: `${accent}20`, color: accent } : { color: "#71717a" }}>
              {m === "fetch" ? "fetch from URL" : "paste content"}
            </button>
          ))}
        </div>

        {mode === "fetch" ? (
          <div className="flex gap-2">
            <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && analyze()}
              placeholder="example.com"
              className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] placeholder:text-[#3f3f46] focus:outline-none focus:border-[#3f3f46] transition-colors" />
            <button onClick={analyze} disabled={!url.trim() || status === "loading"}
              className="px-5 py-2.5 text-xs font-mono tracking-widest rounded border transition-all disabled:opacity-30"
              style={{ borderColor: accent, color: accent, backgroundColor: `${accent}15` }}>
              {status === "loading" ? "fetching..." : "fetch"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder={"User-agent: *\nDisallow: /admin/\nAllow: /\nSitemap: https://example.com/sitemap.xml"}
              className="w-full h-40 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none placeholder:text-[#3f3f46]" />
            <button onClick={analyze} disabled={!text.trim() || status === "loading"}
              className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
              style={{ borderColor: accent, color: accent, backgroundColor: `${accent}15` }}>
              analyze
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-xs font-mono text-[#EF4444] p-3 bg-[#EF4444]/08 border border-[#EF4444]/20 rounded">{error}</div>
        )}

        {parsed && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[["user-agents", parsed.rules.length], ["sitemaps", parsed.sitemaps.length], ["lines", parsed.raw.split("\n").filter(l => l.trim() && !l.startsWith("#")).length]].map(([label, val]) => (
                <div key={label} className="bg-[#141414] border border-[#2a2a2a] rounded p-3 text-center">
                  <div className="text-lg font-bold font-mono" style={{ color: accent }}>{val}</div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-[#52525b] mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Host */}
            {parsed.host && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-3 flex justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#52525b]">preferred host</span>
                <span className="text-xs font-mono text-[#e4e4e7]">{parsed.host}</span>
              </div>
            )}

            {/* Rules */}
            {parsed.rules.map((rule, i) => (
              <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-mono font-bold" style={{ color: accent }}>
                    User-agent: {rule.userAgent}
                  </div>
                  {rule.crawlDelay !== undefined && (
                    <span className="text-[9px] font-mono text-[#71717a]">crawl-delay: {rule.crawlDelay}s</span>
                  )}
                </div>
                <div className="space-y-1">
                  {rule.disallows.map((path, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-[#EF4444] shrink-0">disallow</span>
                      <span className="text-[#e4e4e7]">{path}</span>
                    </div>
                  ))}
                  {rule.allows.map((path, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs font-mono">
                      <span style={{ color: accent }} className="shrink-0">allow</span>
                      <span className="text-[#e4e4e7]">{path}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Sitemaps */}
            {parsed.sitemaps.length > 0 && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest mb-2 text-[#52525b]">sitemaps</div>
                <div className="space-y-1">
                  {parsed.sitemaps.map((s, i) => (
                    <a key={i} href={s} target="_blank" rel="noopener noreferrer"
                      className="block text-xs font-mono hover:underline" style={{ color: accent }}>{s}</a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
