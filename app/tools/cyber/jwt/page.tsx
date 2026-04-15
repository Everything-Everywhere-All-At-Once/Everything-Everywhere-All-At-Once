"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#22C55E";

type JwtPayload = Record<string, unknown>;

function decodeJwt(token: string): { header: JwtPayload; payload: JwtPayload; signature: string } | null {
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3) return null;
    const decode = (s: string) => JSON.parse(atob(s.replace(/-/g, "+").replace(/_/g, "/")));
    return { header: decode(parts[0]), payload: decode(parts[1]), signature: parts[2] };
  } catch { return null; }
}

function formatDate(ts: unknown): string {
  if (typeof ts !== "number") return String(ts);
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

function isExpired(exp: unknown): boolean {
  if (typeof exp !== "number") return false;
  return Date.now() / 1000 > exp;
}

const FIELD_DESCRIPTIONS: Record<string, string> = {
  iss: "issuer",
  sub: "subject",
  aud: "audience",
  exp: "expires at",
  nbf: "not before",
  iat: "issued at",
  jti: "JWT ID",
  alg: "algorithm",
  typ: "type",
};

export default function JwtPage() {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<ReturnType<typeof decodeJwt>>(null);
  const [error, setError] = useState("");

  const decode = () => {
    const result = decodeJwt(token);
    if (result) { setDecoded(result); setError(""); }
    else { setDecoded(null); setError("invalid JWT — expected 3 base64-encoded parts separated by dots"); }
  };

  const expired = decoded ? isExpired(decoded.payload.exp) : false;
  const timeFields = new Set(["exp", "nbf", "iat"]);

  const renderValue = (key: string, val: unknown): string => {
    if (timeFields.has(key) && typeof val === "number") return `${formatDate(val)} (${val})`;
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    return String(val);
  };

  return (
    <ToolShell category="Cybersecurity" categoryHref="/tools/cyber" accent={accent} title="JWT Decoder" description="Decode and inspect JSON Web Tokens — view header, payload, claims, and expiry status.">
      <div className="space-y-5">
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">JWT token</label>
          <textarea value={token} onChange={e => { setToken(e.target.value); setDecoded(null); setError(""); }}
            className="w-full h-28 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-xs font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed break-all"
            placeholder="paste your JWT here..." />
        </div>

        <button onClick={decode} disabled={!token.trim()}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
          style={{ borderColor: accent, color: decoded ? "#0d0d0d" : accent, backgroundColor: decoded ? accent : `${accent}15` }}>
          {decoded ? "decoded ✓" : "decode"}
        </button>

        {error && <div className="text-xs text-center text-[#EF4444] font-mono">{error}</div>}

        {decoded && (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-3 p-3 rounded border" style={{ borderColor: expired ? "#EF444440" : `${accent}40`, backgroundColor: expired ? "#EF444408" : `${accent}08` }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: expired ? "#EF4444" : accent }} />
              <span className="text-xs font-mono" style={{ color: expired ? "#EF4444" : accent }}>
                {expired ? "token expired" : "token valid"}
              </span>
              {typeof decoded.payload.exp === "number" && (
                <span className="text-[10px] text-[#71717a] font-mono ml-auto">{expired ? "expired" : "expires"} {formatDate(decoded.payload.exp)}</span>
              )}
            </div>

            {/* Header */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
              <div className="px-4 py-2 border-b border-[#2a2a2a] flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>header</span>
                <span className="text-[10px] text-[#3f3f46] font-mono">— algorithm & type</span>
              </div>
              <div className="divide-y divide-[#1a1a1a]">
                {Object.entries(decoded.header).map(([k, v]) => (
                  <div key={k} className="px-4 py-2.5 flex items-start gap-4">
                    <div className="w-24 shrink-0">
                      <div className="text-[10px] font-mono text-[#e4e4e7]">{k}</div>
                      {FIELD_DESCRIPTIONS[k] && <div className="text-[9px] text-[#3f3f46] font-mono">{FIELD_DESCRIPTIONS[k]}</div>}
                    </div>
                    <div className="text-xs font-mono text-[#a1a1aa] break-all">{renderValue(k, v)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payload */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
              <div className="px-4 py-2 border-b border-[#2a2a2a] flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>payload</span>
                <span className="text-[10px] text-[#3f3f46] font-mono">— claims ({Object.keys(decoded.payload).length})</span>
              </div>
              <div className="divide-y divide-[#1a1a1a]">
                {Object.entries(decoded.payload).map(([k, v]) => (
                  <div key={k} className="px-4 py-2.5 flex items-start gap-4">
                    <div className="w-24 shrink-0">
                      <div className="text-[10px] font-mono text-[#e4e4e7]">{k}</div>
                      {FIELD_DESCRIPTIONS[k] && <div className="text-[9px] text-[#3f3f46] font-mono">{FIELD_DESCRIPTIONS[k]}</div>}
                    </div>
                    <div className="text-xs font-mono break-all" style={{ color: k === "exp" && expired ? "#EF4444" : "#a1a1aa" }}>
                      {renderValue(k, v)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: accent }}>signature</div>
              <div className="text-[10px] font-mono text-[#3f3f46] break-all">{decoded.signature}</div>
              <div className="text-[10px] text-[#3f3f46] font-mono mt-2">! signature verification requires the secret key — this tool only decodes, does not verify</div>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
