"use client";

import { useState, useMemo } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

const PRESETS = [
  { label: "every minute",      expr: "* * * * *" },
  { label: "every hour",        expr: "0 * * * *" },
  { label: "every day at midnight", expr: "0 0 * * *" },
  { label: "every day at noon", expr: "0 12 * * *" },
  { label: "every Monday 9am",  expr: "0 9 * * 1" },
  { label: "every weekday 8am", expr: "0 8 * * 1-5" },
  { label: "every Sunday midnight", expr: "0 0 * * 0" },
  { label: "1st of month midnight", expr: "0 0 1 * *" },
  { label: "every 15 minutes",  expr: "*/15 * * * *" },
  { label: "every 6 hours",     expr: "0 */6 * * *" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function describeField(val: string, unit: string, names?: string[]): string {
  if (val === "*") return `every ${unit}`;
  if (val.startsWith("*/")) return `every ${val.slice(2)} ${unit}s`;
  if (val.includes("-")) {
    const [a, b] = val.split("-");
    const aLabel = names ? names[parseInt(a)] ?? a : a;
    const bLabel = names ? names[parseInt(b)] ?? b : b;
    return `${unit}s ${aLabel} to ${bLabel}`;
  }
  if (val.includes(",")) {
    const parts = val.split(",").map(p => names ? names[parseInt(p)] ?? p : p);
    return `${unit}s ${parts.join(", ")}`;
  }
  const n = parseInt(val);
  if (names && names[n]) return names[n];
  return `${unit} ${val}`;
}

function explain(expr: string): { human: string; parts: string[]; valid: boolean } {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return { human: "invalid — must have 5 fields", parts: [], valid: false };
  const [min, hour, dom, mon, dow] = parts;
  try {
    const p = [
      describeField(min,  "minute"),
      describeField(hour, "hour"),
      describeField(dom,  "day-of-month"),
      describeField(mon,  "month", MONTHS),
      describeField(dow,  "day",   DAYS),
    ];
    const segments: string[] = [];
    if (min === "*" && hour === "*") segments.push("every minute");
    else if (min === "0" && hour === "*") segments.push("at the start of every hour");
    else segments.push(`at ${hour === "*" ? "every hour" : hour.padStart(2,"0")}:${min.padStart(2,"0")}`);
    if (dom !== "*") segments.push(`on day ${dom} of the month`);
    if (mon !== "*") segments.push(`in ${describeField(mon, "month", MONTHS)}`);
    if (dow !== "*") segments.push(`on ${describeField(dow, "day", DAYS)}`);
    return { human: segments.join(", "), parts: p, valid: true };
  } catch {
    return { human: "invalid expression", parts: [], valid: false };
  }
}

function nextRuns(expr: string, count = 5): Date[] {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return [];
  const [minP, hourP, domP, monP, dowP] = parts;

  const matches = (val: string, n: number, max: number): boolean => {
    if (val === "*") return true;
    if (val.startsWith("*/")) return n % parseInt(val.slice(2)) === 0;
    if (val.includes("-")) { const [a, b] = val.split("-").map(Number); return n >= a && n <= b; }
    if (val.includes(",")) return val.split(",").map(Number).includes(n);
    return parseInt(val) === n;
  };

  const results: Date[] = [];
  const now = new Date();
  now.setSeconds(0, 0);
  const d = new Date(now.getTime() + 60000);

  for (let i = 0; i < 525600 && results.length < count; i++) {
    if (
      matches(monP, d.getMonth() + 1, 12) &&
      matches(domP, d.getDate(), 31) &&
      matches(dowP, d.getDay(), 6) &&
      matches(hourP, d.getHours(), 23) &&
      matches(minP, d.getMinutes(), 59)
    ) results.push(new Date(d));
    d.setMinutes(d.getMinutes() + 1);
  }
  return results;
}

export default function CronPage() {
  const [expr, setExpr] = useState("0 9 * * 1-5");

  const { human, parts, valid } = useMemo(() => explain(expr), [expr]);
  const runs = useMemo(() => valid ? nextRuns(expr) : [], [expr, valid]);

  const FIELD_LABELS = ["minute", "hour", "day of month", "month", "day of week"];

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="Cron Expression Builder" description="Write a cron expression and see it explained in plain English with upcoming run times.">
      <div className="space-y-5">
        {/* Input */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">expression</label>
          <input value={expr} onChange={e => setExpr(e.target.value)}
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-4 py-3 text-base font-mono text-[#e4e4e7] focus:outline-none focus:border-[#3f3f46] transition-colors tracking-widest"
            placeholder="* * * * *" spellCheck={false} />
          <div className="flex gap-4 mt-1 px-1">
            {FIELD_LABELS.map(f => <span key={f} className="text-[9px] font-mono text-[#3f3f46] flex-1 text-center">{f}</span>)}
          </div>
        </div>

        {/* Human description */}
        <div className="bg-[#141414] border rounded p-4" style={{ borderColor: valid ? `${accent}40` : "#EF444440" }}>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: valid ? accent : "#EF4444" }}>
            {valid ? "runs" : "invalid"}
          </div>
          <div className="text-sm font-mono text-[#e4e4e7]">{human}</div>
        </div>

        {/* Field breakdown */}
        {valid && parts.length === 5 && (
          <div className="grid grid-cols-5 gap-2">
            {parts.map((p, i) => (
              <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded p-2.5 text-center">
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#52525b] mb-1">{FIELD_LABELS[i]}</div>
                <div className="text-[10px] font-mono text-[#e4e4e7] leading-tight">{p}</div>
              </div>
            ))}
          </div>
        )}

        {/* Next runs */}
        {runs.length > 0 && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b] mb-3">next {runs.length} runs</div>
            <div className="space-y-1.5">
              {runs.map((d, i) => (
                <div key={i} className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-[#3f3f46] w-4">{i + 1}</span>
                  <span className="text-[#e4e4e7]">{d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Presets */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b] mb-3">common presets</div>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(p => (
              <button key={p.expr} onClick={() => setExpr(p.expr)}
                className="flex items-center justify-between px-3 py-2 rounded border border-[#1e1e1e] bg-[#111111] text-left transition-all"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${accent}40`}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e"}>
                <span className="text-[10px] font-mono text-[#71717a]">{p.label}</span>
                <span className="text-[10px] font-mono" style={{ color: accent }}>{p.expr}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
