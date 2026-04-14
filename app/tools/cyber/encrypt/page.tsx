"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#22C55E";

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const pwBytes = enc.encode(password);
  const keyMaterial = await crypto.subtle.importKey("raw", pwBytes.slice(0), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt.slice(0), iterations: 250000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export default function EncryptPage() {
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const process = async () => {
    if (!input.trim() || !password) return;
    setStatus("working");
    setOutput("");
    setErrorMsg("");
    try {
      if (mode === "encrypt") {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(password, salt);
        const enc = new TextEncoder();
        const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(input));
        const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
        combined.set(salt, 0);
        combined.set(iv, 16);
        combined.set(new Uint8Array(ciphertext), 28);
        setOutput(btoa(String.fromCharCode(...combined)));
        setStatus("done");
      } else {
        const combined = Uint8Array.from(atob(input.trim()), c => c.charCodeAt(0));
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const ciphertext = combined.slice(28);
        const key = await deriveKey(password, salt);
        const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
        setOutput(new TextDecoder().decode(plaintext));
        setStatus("done");
      }
    } catch {
      setErrorMsg(mode === "decrypt" ? "decryption failed — wrong password or corrupted data" : "encryption failed");
      setStatus("error");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  return (
    <ToolShell category="Cybersecurity" categoryHref="/tools/cyber" accent={accent} title="Text Encryptor" description="AES-256-GCM encryption with PBKDF2 key derivation — runs entirely in your browser, nothing leaves your device.">
      <div className="space-y-5">
        {/* Mode toggle */}
        <div className="flex rounded border border-[#2a2a2a] overflow-hidden">
          {(["encrypt", "decrypt"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setOutput(""); setStatus("idle"); }}
              className="flex-1 py-2.5 text-xs font-mono capitalize transition-all"
              style={mode === m ? { backgroundColor: `${accent}20`, color: accent } : { color: "#71717a" }}>
              {m}
            </button>
          ))}
        </div>

        {/* Input */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">
            {mode === "encrypt" ? "plaintext" : "encrypted text (base64)"}
          </label>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            className="w-full h-32 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed"
            placeholder={mode === "encrypt" ? "enter text to encrypt..." : "paste encrypted base64 here..."} />
        </div>

        {/* Password */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none"
            placeholder="enter encryption password..." />
        </div>

        {/* Action */}
        <button onClick={process} disabled={!input.trim() || !password || status === "working"}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
          style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
          {status === "working" ? "processing..." : status === "done" ? `${mode}ed ✓` : mode}
        </button>

        {status === "error" && <div className="text-xs text-center text-[#EF4444] font-mono">{errorMsg}</div>}

        {/* Output */}
        {output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] tracking-widest text-[#71717a] uppercase font-mono">output</label>
              <button onClick={copy} className="text-[10px] font-mono px-3 py-1 rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7]">
                {copied ? "copied ✓" : "copy"}
              </button>
            </div>
            <textarea readOnly value={output}
              className="w-full h-32 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none leading-relaxed"
              style={{ color: accent }} />
          </div>
        )}

        <div className="text-[10px] text-[#3f3f46] font-mono text-center">AES-256-GCM · PBKDF2 · 250,000 iterations · SHA-256 · all processing local</div>
      </div>
    </ToolShell>
  );
}
