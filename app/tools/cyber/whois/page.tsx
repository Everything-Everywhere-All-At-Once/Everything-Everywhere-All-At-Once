"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#22C55E";

type RdapResult = {
  ldhName?: string;
  status?: string[];
  events?: { eventAction: string; eventDate: string }[];
  entities?: { vcardArray?: unknown[][]; roles?: string[] }[];
  nameservers?: { ldhName: string }[];
  secureDNS?: { delegationSigned?: boolean };
  notices?: { title: string; description: string[] }[];
};

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return d; }
}

function getContact(entities: RdapResult["entities"], role: string) {
  const e = entities?.find(en => en.roles?.includes(role));
  if (!e?.vcardArray) return null;
  const card = e.vcardArray[1] as [string, Record<string, unknown>, string, string][];
  const name = card?.find(f => f[0] === "fn")?.[3];
  const org  = card?.find(f => f[0] === "org")?.[3];
  const email= card?.find(f => f[0] === "email")?.[3];
  return { name, org, email };
}

export default function WhoisPage() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<RdapResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const lookup = async () => {
    const raw = domain.trim().replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
    if (!raw) return;
    setStatus("loading");
    setResult(null);
    setError("");
    try {
      // Try RDAP — use the IANA bootstrap to find the right server
      const tld = raw.split(".").slice(-1)[0];
      const bootstrap = await fetch("https://data.iana.org/rdap/dns.json").then(r => r.json());
      const services: [string[], string[]][] = bootstrap.services;
      let rdapBase = "https://rdap.org/domain/";
      for (const [tlds, urls] of services) {
        if (tlds.includes(tld) && urls.length) { rdapBase = urls[0] + "domain/"; break; }
      }
      const res = await fetch(`${rdapBase}${raw}`);
      if (!res.ok) throw new Error(`RDAP returned ${res.status}`);
      const data: RdapResult = await res.json();
      setResult(data);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "lookup failed");
      setStatus("error");
    }
  };

  const registrar = getContact(result?.entities, "registrar");
  const registrant = getContact(result?.entities, "registrant");
  const created  = result?.events?.find(e => e.eventAction === "registration")?.eventDate;
  const expires  = result?.events?.find(e => e.eventAction === "expiration")?.eventDate;
  const updated  = result?.events?.find(e => e.eventAction === "last changed")?.eventDate;

  return (
    <ToolShell category="Cybersecurity" categoryHref="/tools/cyber" accent={accent} title="WHOIS Lookup" description="Domain registration info via RDAP — registrar, dates, nameservers, DNSSEC status.">
      <div className="space-y-5">
        <div className="flex gap-2">
          <input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === "Enter" && lookup()}
            placeholder="example.com"
            className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] placeholder:text-[#3f3f46] focus:outline-none focus:border-[#3f3f46] transition-colors"
          />
          <button onClick={lookup} disabled={!domain.trim() || status === "loading"}
            className="px-5 py-2.5 text-xs font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
            {status === "loading" ? "looking up..." : "lookup"}
          </button>
        </div>

        {status === "error" && (
          <div className="text-xs font-mono text-[#EF4444] p-3 bg-[#EF4444]/08 border border-[#EF4444]/20 rounded">{error}</div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Domain + status */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: accent }}>domain</div>
              <div className="text-lg font-bold text-[#e4e4e7] mb-2">{result.ldhName ?? domain}</div>
              <div className="flex flex-wrap gap-1.5">
                {result.status?.map(s => (
                  <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${accent}15`, color: accent }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-3">
              {[["created", created], ["expires", expires], ["updated", updated]].map(([label, val]) => (
                <div key={label} className="bg-[#141414] border border-[#2a2a2a] rounded p-3">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-[#52525b] mb-1">{label}</div>
                  <div className="text-xs font-mono text-[#e4e4e7]">{val ? formatDate(val) : "—"}</div>
                </div>
              ))}
            </div>

            {/* Registrar */}
            {registrar && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest mb-2 text-[#52525b]">registrar</div>
                <div className="text-sm text-[#e4e4e7]">{registrar.name as string ?? registrar.org as string ?? "—"}</div>
                {registrar.email && <div className="text-xs text-[#71717a] mt-1">{registrar.email as string}</div>}
              </div>
            )}

            {/* Registrant */}
            {registrant && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest mb-2 text-[#52525b]">registrant</div>
                <div className="text-sm text-[#e4e4e7]">{registrant.name as string ?? registrant.org as string ?? "—"}</div>
                {registrant.email && <div className="text-xs text-[#71717a] mt-1">{registrant.email as string}</div>}
              </div>
            )}

            {/* Nameservers */}
            {result.nameservers && result.nameservers.length > 0 && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest mb-2 text-[#52525b]">nameservers</div>
                <div className="space-y-1">
                  {result.nameservers.map(ns => (
                    <div key={ns.ldhName} className="text-xs font-mono text-[#e4e4e7]">{ns.ldhName}</div>
                  ))}
                </div>
              </div>
            )}

            {/* DNSSEC */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b]">DNSSEC</div>
              <div className="text-xs font-mono" style={{ color: result.secureDNS?.delegationSigned ? accent : "#EF4444" }}>
                {result.secureDNS?.delegationSigned ? "signed" : "unsigned"}
              </div>
            </div>
          </div>
        )}

        <div className="text-[10px] font-mono text-[#3f3f46] text-center">data via RDAP (Registration Data Access Protocol) · no queries stored</div>
      </div>
    </ToolShell>
  );
}
