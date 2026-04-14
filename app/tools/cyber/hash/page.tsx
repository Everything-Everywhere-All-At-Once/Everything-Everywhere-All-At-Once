"use client";

import { useState, useRef } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#22C55E";

const ALGORITHMS = ["MD5", "SHA-1", "SHA-256", "SHA-512"] as const;
type Algorithm = typeof ALGORITHMS[number];

// MD5 implementation (not natively in SubtleCrypto)
function md5(input: string): string {
  const rotateLeft = (n: number, s: number) => (n << s) | (n >>> (32 - s));
  const addUnsigned = (a: number, b: number) => {
    const lsw = (a & 0xFFFF) + (b & 0xFFFF);
    const msw = (a >> 16) + (b >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  };
  const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
  const G = (x: number, y: number, z: number) => (x & z) | (y & ~z);
  const H = (x: number, y: number, z: number) => x ^ y ^ z;
  const I = (x: number, y: number, z: number) => y ^ (x | ~z);
  const FF = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, F(b, c, d)), addUnsigned(x, t)), s), b);
  const GG = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, G(b, c, d)), addUnsigned(x, t)), s), b);
  const HH = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, H(b, c, d)), addUnsigned(x, t)), s), b);
  const II = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, I(b, c, d)), addUnsigned(x, t)), s), b);

  const enc = new TextEncoder();
  const bytes = enc.encode(input);
  const len = bytes.length;
  const nBlocks = Math.ceil((len + 9) / 64);
  const words = new Uint32Array(nBlocks * 16);
  for (let i = 0; i < len; i++) words[i >> 2] |= bytes[i] << ((i % 4) * 8);
  words[len >> 2] |= 0x80 << ((len % 4) * 8);
  words[nBlocks * 16 - 2] = len * 8;

  let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
  for (let i = 0; i < nBlocks * 16; i += 16) {
    const [aa, bb, cc, dd] = [a, b, c, d];
    const M = (j: number) => words[i + j];
    a = FF(a,b,c,d,M(0),7,-680876936); d=FF(d,a,b,c,M(1),12,-389564586); c=FF(c,d,a,b,M(2),17,606105819); b=FF(b,c,d,a,M(3),22,-1044525330);
    a = FF(a,b,c,d,M(4),7,-176418897); d=FF(d,a,b,c,M(5),12,1200080426); c=FF(c,d,a,b,M(6),17,-1473231341); b=FF(b,c,d,a,M(7),22,-45705983);
    a = FF(a,b,c,d,M(8),7,1770035416); d=FF(d,a,b,c,M(9),12,-1958414417); c=FF(c,d,a,b,M(10),17,-42063); b=FF(b,c,d,a,M(11),22,-1990404162);
    a = FF(a,b,c,d,M(12),7,1804603682); d=FF(d,a,b,c,M(13),12,-40341101); c=FF(c,d,a,b,M(14),17,-1502002290); b=FF(b,c,d,a,M(15),22,1236535329);
    a = GG(a,b,c,d,M(1),5,-165796510); d=GG(d,a,b,c,M(6),9,-1069501632); c=GG(c,d,a,b,M(11),14,643717713); b=GG(b,c,d,a,M(0),20,-373897302);
    a = GG(a,b,c,d,M(5),5,-701558691); d=GG(d,a,b,c,M(10),9,38016083); c=GG(c,d,a,b,M(15),14,-660478335); b=GG(b,c,d,a,M(4),20,-405537848);
    a = GG(a,b,c,d,M(9),5,568446438); d=GG(d,a,b,c,M(14),9,-1019803690); c=GG(c,d,a,b,M(3),14,-187363961); b=GG(b,c,d,a,M(8),20,1163531501);
    a = GG(a,b,c,d,M(13),5,-1444681467); d=GG(d,a,b,c,M(2),9,-51403784); c=GG(c,d,a,b,M(7),14,1735328473); b=GG(b,c,d,a,M(12),20,-1926607734);
    a = HH(a,b,c,d,M(5),4,-378558); d=HH(d,a,b,c,M(8),11,-2022574463); c=HH(c,d,a,b,M(11),16,1839030562); b=HH(b,c,d,a,M(14),23,-35309556);
    a = HH(a,b,c,d,M(1),4,-1530992060); d=HH(d,a,b,c,M(4),11,1272893353); c=HH(c,d,a,b,M(7),16,-155497632); b=HH(b,c,d,a,M(10),23,-1094730640);
    a = HH(a,b,c,d,M(13),4,681279174); d=HH(d,a,b,c,M(0),11,-358537222); c=HH(c,d,a,b,M(3),16,-722521979); b=HH(b,c,d,a,M(6),23,76029189);
    a = HH(a,b,c,d,M(9),4,-640364487); d=HH(d,a,b,c,M(12),11,-421815835); c=HH(c,d,a,b,M(15),16,530742520); b=HH(b,c,d,a,M(2),23,-995338651);
    a = II(a,b,c,d,M(0),6,-198630844); d=II(d,a,b,c,M(7),10,1126891415); c=II(c,d,a,b,M(14),15,-1416354905); b=II(b,c,d,a,M(5),21,-57434055);
    a = II(a,b,c,d,M(12),6,1700485571); d=II(d,a,b,c,M(3),10,-1894986606); c=II(c,d,a,b,M(10),15,-1051523); b=II(b,c,d,a,M(1),21,-2054922799);
    a = II(a,b,c,d,M(8),6,1873313359); d=II(d,a,b,c,M(15),10,-30611744); c=II(c,d,a,b,M(6),15,-1560198380); b=II(b,c,d,a,M(13),21,1309151649);
    a = II(a,b,c,d,M(4),6,-145523070); d=II(d,a,b,c,M(11),10,-1120210379); c=II(c,d,a,b,M(2),15,718787259); b=II(b,c,d,a,M(9),21,-343485551);
    a=addUnsigned(a,aa); b=addUnsigned(b,bb); c=addUnsigned(c,cc); d=addUnsigned(d,dd);
  }
  const toHex = (n: number) => {
    let s = "";
    for (let i = 0; i < 4; i++) { s += ("0" + ((n >> (i * 8)) & 0xFF).toString(16)).slice(-2); }
    return s;
  };
  return toHex(a) + toHex(b) + toHex(c) + toHex(d);
}

async function subtleHash(algo: string, text: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest(algo, enc.encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function HashPage() {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"text" | "file">("text");
  const [results, setResults] = useState<Record<Algorithm, string>>({} as Record<Algorithm, string>);
  const [selected, setSelected] = useState<Algorithm[]>(["SHA-256"]);
  const [status, setStatus] = useState<"idle" | "hashing" | "done">("idle");
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggle = (algo: Algorithm) => setSelected(s => s.includes(algo) ? s.filter(a => a !== algo) : [...s, algo]);

  const hash = async () => {
    setStatus("hashing");
    const out: Partial<Record<Algorithm, string>> = {};
    try {
      let text = input;
      if (mode === "file" && file) {
        const bytes = await file.arrayBuffer();
        text = new TextDecoder().decode(bytes);
      }
      for (const algo of selected) {
        if (algo === "MD5") out["MD5"] = md5(text);
        else if (algo === "SHA-1") out["SHA-1"] = await subtleHash("SHA-1", text);
        else if (algo === "SHA-256") out["SHA-256"] = await subtleHash("SHA-256", text);
        else if (algo === "SHA-512") out["SHA-512"] = await subtleHash("SHA-512", text);
      }
      setResults(out as Record<Algorithm, string>);
      setStatus("done");
    } catch { setStatus("idle"); }
  };

  const copy = (val: string, algo: string) => {
    navigator.clipboard.writeText(val).then(() => { setCopied(algo); setTimeout(() => setCopied(null), 1500); });
  };

  return (
    <ToolShell category="Cybersecurity" categoryHref="/tools/cyber" accent={accent} title="Hash Generator" description="Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text or files — all in browser.">
      <div className="space-y-5">
        {/* Mode */}
        <div className="flex rounded border border-[#2a2a2a] overflow-hidden">
          {(["text", "file"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setResults({} as Record<Algorithm, string>); setStatus("idle"); }}
              className="flex-1 py-2.5 text-xs font-mono capitalize transition-all"
              style={mode === m ? { backgroundColor: `${accent}20`, color: accent } : { color: "#71717a" }}>
              {m} input
            </button>
          ))}
        </div>

        {/* Input */}
        {mode === "text" ? (
          <textarea value={input} onChange={e => { setInput(e.target.value); setStatus("idle"); }}
            className="w-full h-28 bg-[#141414] border border-[#2a2a2a] rounded p-4 text-sm font-mono text-[#e4e4e7] resize-none focus:outline-none"
            placeholder="enter text to hash..." />
        ) : (
          <div onClick={() => fileInputRef.current?.click()}
            className="border border-dashed rounded p-6 text-center cursor-pointer transition-all"
            style={{ borderColor: "#2a2a2a" }}>
            <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setStatus("idle"); } }} />
            {file ? <div className="text-sm font-mono text-[#e4e4e7]">{file.name} · {(file.size / 1024).toFixed(0)} KB</div>
              : <div className="text-sm text-[#71717a] font-mono">drop file or click to browse</div>}
          </div>
        )}

        {/* Algorithm selector */}
        <div>
          <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">algorithms</label>
          <div className="flex gap-2">
            {ALGORITHMS.map(a => (
              <button key={a} onClick={() => toggle(a)}
                className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                style={selected.includes(a) ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <button onClick={hash} disabled={(!input.trim() && mode === "text") || (!file && mode === "file") || !selected.length || status === "hashing"}
          className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
          style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
          {status === "hashing" ? "hashing..." : status === "done" ? "hashed ✓" : "generate hashes"}
        </button>

        {/* Results */}
        {Object.entries(results).length > 0 && (
          <div className="space-y-3">
            {(Object.entries(results) as [Algorithm, string][]).map(([algo, hash]) => (
              <div key={algo} className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>{algo}</span>
                  <button onClick={() => copy(hash, algo)} className="text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">
                    {copied === algo ? "copied ✓" : "copy"}
                  </button>
                </div>
                <div className="text-xs font-mono text-[#e4e4e7] break-all leading-relaxed">{hash}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
