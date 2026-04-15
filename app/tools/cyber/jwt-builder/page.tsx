"use client";

import { useState, useMemo } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#22C55E";

function b64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlBuf(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signHS256(header: string, payload: string, secret: string): Promise<string> {
  const enc  = new TextEncoder();
  const data = enc.encode(`${header}.${payload}`);
  const key  = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig  = await crypto.subtle.sign("HMAC", key, data);
  return b64urlBuf(sig);
}

const DEFAULT_PAYLOAD = JSON.stringify({ sub: "1234567890", name: "Jane Doe", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 }, null, 2);

export default function JwtBuilderPage() {
  const [alg, setAlg]       = useState<"HS256" | "none">("HS256");
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [token, setToken]   = useState("");
  const [copied, setCopied] = useState(false);
  const [payloadErr, setPayloadErr] = useState("");
  const [building, setBuilding] = useState(false);

  const header = useMemo(() => b64url(JSON.stringify({ alg, typ: "JWT" })), [alg]);

  const validatePayload = (v: string) => {
    try { JSON.parse(v); setPayloadErr(""); } catch { setPayloadErr("invalid JSON"); }
  };

  const build = async () => {
    try { JSON.parse(payload); } catch { setPayloadErr("invalid JSON"); return; }
    setBuilding(true);
    try {
      const p = b64url(payload.trim());
      const sig = alg === "HS256" ? await signHS256(header, p, secret) : "";
      setToken(alg === "none" ? `${header}.${p}.` : `${header}.${p}.${sig}`);
    } finally { setBuilding(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const addClaim = (key: string, value: unknown) => {
    try {
      const obj = JSON.parse(payload);
      setPayload(JSON.stringify({ ...obj, [key]: value }, null, 2));
      setPayloadErr("");
    } catch {}
  };

  const now = Math.floor(Date.now() / 1000);

  return (
    <ToolShell category="Cybersecurity" categoryHref="/tools/cyber" accent={accent} title="JWT Builder" description="Build and sign JSON Web Tokens with HS256 or unsigned — all computation in browser.">
      <div className="space-y-5">
        {/* Algorithm */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">algorithm</label>
          <div className="flex rounded border border-[#2a2a2a] overflow-hidden w-fit">
            {(["HS256", "none"] as const).map(a => (
              <button key={a} onClick={() => setAlg(a)}
                className="px-5 py-2.5 text-xs font-mono transition-all"
                style={alg === a ? { backgroundColor: `${accent}20`, color: accent } : { color: "#71717a" }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Header preview */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">header (auto)</label>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-xs font-mono text-[#52525b]">
            {`{"alg":"${alg}","typ":"JWT"}`}
          </div>
        </div>

        {/* Payload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">payload</label>
            <div className="flex gap-2">
              {[["iat", now], ["exp", now + 3600], ["nbf", now]].map(([k, v]) => (
                <button key={k} onClick={() => addClaim(k as string, v)}
                  className="text-[9px] font-mono px-2 py-0.5 rounded border border-[#2a2a2a] text-[#52525b] hover:text-[#a1a1aa] hover:border-[#3f3f46] transition-all">
                  +{k}
                </button>
              ))}
            </div>
          </div>
          <textarea value={payload}
            onChange={e => { setPayload(e.target.value); validatePayload(e.target.value); }}
            rows={8}
            className="w-full bg-[#141414] border rounded p-4 text-sm font-mono text-[#e4e4e7] resize-y focus:outline-none transition-colors"
            style={{ borderColor: payloadErr ? "#EF4444" : "#2a2a2a" }} />
          {payloadErr && <div className="text-[10px] font-mono text-[#EF4444] mt-1">{payloadErr}</div>}
        </div>

        {/* Secret */}
        {alg === "HS256" && (
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-2">secret</label>
            <input value={secret} onChange={e => setSecret(e.target.value)}
              type="text"
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none focus:border-[#3f3f46] transition-colors" />
          </div>
        )}

        <button onClick={build} disabled={!!payloadErr || building}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
          style={{ borderColor: accent, color: "#0d0d0d", backgroundColor: accent }}>
          {building ? "building..." : "build JWT"}
        </button>

        {/* Token output */}
        {token && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>token</label>
              <button onClick={copy} className="text-[10px] font-mono" style={{ color: copied ? accent : "#52525b" }}>
                {copied ? "copied" : "copy"}
              </button>
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 text-xs font-mono break-all leading-relaxed">
              {(() => {
                const parts = token.split(".");
                return (
                  <>
                    <span style={{ color: "#FF3399" }}>{parts[0]}</span>
                    <span className="text-[#3f3f46]">.</span>
                    <span style={{ color: "#FACC15" }}>{parts[1]}</span>
                    <span className="text-[#3f3f46]">.</span>
                    <span style={{ color: accent }}>{parts[2]}</span>
                  </>
                );
              })()}
            </div>
            <div className="text-[10px] font-mono text-[#3f3f46] mt-2 text-center">
              header (pink) · payload (yellow) · signature (green)
            </div>
          </div>
        )}

        <div className="text-[10px] font-mono text-[#3f3f46] text-center">signing uses Web Crypto API · secret never leaves browser</div>
      </div>
    </ToolShell>
  );
}
