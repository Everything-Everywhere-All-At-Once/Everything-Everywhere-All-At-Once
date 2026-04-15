"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#22C55E";

const RECORD_TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "CAA"] as const;
type RecordType = typeof RECORD_TYPES[number];

type DnsAnswer = { name: string; type: number; TTL: number; data: string };
type DnsResult = { Status: number; Answer?: DnsAnswer[]; Authority?: DnsAnswer[] };

const TYPE_NUMS: Record<RecordType, number> = { A:1, AAAA:28, MX:15, TXT:16, NS:2, CNAME:5, SOA:6, CAA:257 };

function typeFromNum(n: number): string {
  const map: Record<number, string> = { 1:"A",28:"AAAA",15:"MX",16:"TXT",2:"NS",5:"CNAME",6:"SOA",257:"CAA" };
  return map[n] ?? String(n);
}

const STATUS: Record<number, string> = { 0:"NOERROR",1:"FORMERR",2:"SERVFAIL",3:"NXDOMAIN",4:"NOTIMP",5:"REFUSED" };

export default function DnsPage() {
  const [domain, setDomain] = useState("");
  const [types, setTypes]   = useState<RecordType[]>(["A","MX","TXT","NS"]);
  const [results, setResults] = useState<Partial<Record<RecordType, DnsResult>>>({});
  const [status, setStatus] = useState<"idle"|"loading"|"done"|"error">("idle");
  const [error, setError]   = useState("");

  const toggleType = (t: RecordType) =>
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const lookup = async () => {
    const host = domain.trim().replace(/^https?:\/\//, "").split("/")[0];
    if (!host) return;
    setStatus("loading");
    setError("");
    setResults({});
    try {
      const fetches = types.map(async t => {
        const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=${TYPE_NUMS[t]}`);
        const data: DnsResult = await res.json();
        return [t, data] as [RecordType, DnsResult];
      });
      const entries = await Promise.all(fetches);
      setResults(Object.fromEntries(entries));
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "lookup failed");
      setStatus("error");
    }
  };

  const hasResults = Object.values(results).some(r => r?.Answer?.length);

  return (
    <ToolShell category="Cybersecurity" categoryHref="/tools/cyber" accent={accent} title="DNS Lookup" description="Query A, AAAA, MX, TXT, NS, CNAME and more via Google's public DNS-over-HTTPS API.">
      <div className="space-y-5">
        <div className="flex gap-2">
          <input value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === "Enter" && lookup()}
            placeholder="example.com"
            className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] placeholder:text-[#3f3f46] focus:outline-none focus:border-[#3f3f46] transition-colors" />
          <button onClick={lookup} disabled={!domain.trim() || status === "loading"}
            className="px-5 py-2.5 text-xs font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: "#0d0d0d", backgroundColor: accent }}>
            {status === "loading" ? "..." : "lookup"}
          </button>
        </div>

        {/* Record type selector */}
        <div className="flex flex-wrap gap-2">
          {RECORD_TYPES.map(t => (
            <button key={t} onClick={() => toggleType(t)}
              className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
              style={types.includes(t) ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
              {t}
            </button>
          ))}
        </div>

        {status === "error" && (
          <div className="text-xs font-mono text-[#EF4444] p-3 bg-[#EF4444]/08 border border-[#EF4444]/20 rounded">{error}</div>
        )}

        {/* Results */}
        {status === "done" && (
          hasResults ? (
            <div className="space-y-4">
              {(Object.entries(results) as [RecordType, DnsResult][]).map(([type, result]) => {
                const records = result.Answer ?? [];
                if (!records.length && result.Status !== 0) return null;
                return (
                  <div key={type} className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e1e1e]">
                      <span className="text-xs font-mono font-bold" style={{ color: accent }}>{type}</span>
                      <span className="text-[9px] font-mono text-[#52525b]">{STATUS[result.Status] ?? result.Status}</span>
                    </div>
                    {records.length === 0 ? (
                      <div className="px-4 py-3 text-xs font-mono text-[#3f3f46]">no records found</div>
                    ) : (
                      records.map((r, i) => (
                        <div key={i} className={`flex gap-4 px-4 py-2.5 text-xs font-mono ${i !== records.length - 1 ? "border-b border-[#1e1e1e]" : ""}`}>
                          <span className="text-[#52525b] shrink-0 w-12 text-right">{r.TTL}s</span>
                          <span className="text-[#e4e4e7] break-all">{r.data}</span>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-sm font-mono text-[#3f3f46] py-8">no DNS records found</div>
          )
        )}

        <div className="text-[10px] font-mono text-[#3f3f46] text-center">queries via dns.google (DNS-over-HTTPS) · no data stored</div>
      </div>
    </ToolShell>
  );
}
