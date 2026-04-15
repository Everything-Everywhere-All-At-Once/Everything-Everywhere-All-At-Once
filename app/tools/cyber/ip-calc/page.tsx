"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#22C55E";

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}

function intToIp(n: number): string {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(".");
}

function calcSubnet(cidr: string) {
  const [ip, prefix] = cidr.trim().split("/");
  const bits = parseInt(prefix, 10);
  if (!ip || isNaN(bits) || bits < 0 || bits > 32) return null;

  const octs = ip.split(".");
  if (octs.length !== 4 || octs.some(o => isNaN(+o) || +o < 0 || +o > 255)) return null;

  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  const ipInt = ipToInt(ip);
  const network = (ipInt & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const firstHost = bits < 31 ? (network + 1) >>> 0 : network;
  const lastHost  = bits < 31 ? (broadcast - 1) >>> 0 : broadcast;
  const hosts     = bits >= 31 ? Math.pow(2, 32 - bits) : Math.max(0, broadcast - network - 1);
  const wildcard  = (~mask) >>> 0;
  const ipClass   = ipInt >>> 24 < 128 ? "A" : ipInt >>> 24 < 192 ? "B" : ipInt >>> 24 < 224 ? "C" : ipInt >>> 24 < 240 ? "D" : "E";
  const isPrivate = (
    (ipInt >>> 24 === 10) ||
    (ipInt >>> 24 === 172 && ((ipInt >>> 16) & 0xff) >= 16 && ((ipInt >>> 16) & 0xff) <= 31) ||
    (ipInt >>> 24 === 192 && ((ipInt >>> 16) & 0xff) === 168)
  );

  return {
    ip, prefix: bits,
    subnetMask: intToIp(mask),
    wildcard: intToIp(wildcard),
    networkAddress: intToIp(network),
    broadcastAddress: intToIp(broadcast),
    firstHost: intToIp(firstHost),
    lastHost: intToIp(lastHost),
    usableHosts: hosts.toLocaleString(),
    totalAddresses: Math.pow(2, 32 - bits).toLocaleString(),
    ipClass,
    isPrivate,
    binary: {
      ip: octs.map(o => parseInt(o).toString(2).padStart(8, "0")).join("."),
      mask: [(mask>>>24)&0xff,(mask>>>16)&0xff,(mask>>>8)&0xff,mask&0xff].map(o => o.toString(2).padStart(8,"0")).join("."),
    },
  };
}

export default function IpCalcPage() {
  const [input, setInput] = useState("192.168.1.0/24");
  const [result, setResult] = useState<ReturnType<typeof calcSubnet>>(null);
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    const r = calcSubnet(input);
    if (!r) { setError("invalid CIDR notation (e.g. 192.168.1.0/24)"); setResult(null); }
    else { setResult(r); }
  };

  const rows = result ? [
    ["IP address", result.ip],
    ["Subnet mask", result.subnetMask],
    ["Wildcard mask", result.wildcard],
    ["Network address", result.networkAddress],
    ["Broadcast address", result.broadcastAddress],
    ["First usable host", result.firstHost],
    ["Last usable host", result.lastHost],
    ["Usable hosts", result.usableHosts],
    ["Total addresses", result.totalAddresses],
    ["IP class", result.ipClass],
    ["Private range", result.isPrivate ? "yes" : "no"],
  ] : [];

  return (
    <ToolShell category="Cybersecurity" categoryHref="/tools/cyber" accent={accent} title="IP / CIDR Calculator" description="Calculate subnet mask, broadcast, host range, wildcard and binary from any CIDR block.">
      <div className="space-y-5">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && calculate()}
            placeholder="192.168.1.0/24"
            className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] placeholder:text-[#3f3f46] focus:outline-none focus:border-[#3f3f46] transition-colors"
          />
          <button onClick={calculate}
            className="px-5 py-2.5 text-xs font-mono tracking-widest rounded border transition-all"
            style={{ borderColor: accent, color: "#0d0d0d", backgroundColor: accent }}>
            calculate
          </button>
        </div>

        {error && <div className="text-xs font-mono text-[#EF4444]">{error}</div>}

        {result && (
          <div className="space-y-4">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ["prefix", `/${result.prefix}`],
                ["hosts", result.usableHosts],
                ["class", result.ipClass],
                ["private", result.isPrivate ? "yes" : "no"],
              ].map(([label, val]) => (
                <div key={label} className="bg-[#141414] border border-[#2a2a2a] rounded p-3 text-center">
                  <div className="text-base font-bold font-mono" style={{ color: accent }}>{val}</div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-[#52525b] mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Full table */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
              {rows.map(([label, val], i) => (
                <div key={label} className={`flex items-center justify-between px-4 py-2.5 text-xs font-mono ${i !== rows.length - 1 ? "border-b border-[#1e1e1e]" : ""}`}>
                  <span className="text-[#52525b]">{label}</span>
                  <span className="text-[#e4e4e7]">{val}</span>
                </div>
              ))}
            </div>

            {/* Binary */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b] mb-2">binary representation</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-[#52525b] w-10 shrink-0">IP</span>
                  <span className="text-[#e4e4e7] break-all">{result.binary.ip}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-[#52525b] w-10 shrink-0">mask</span>
                  <span className="break-all" style={{ color: accent }}>{result.binary.mask}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
