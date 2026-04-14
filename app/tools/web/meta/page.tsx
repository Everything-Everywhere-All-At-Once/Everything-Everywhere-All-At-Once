"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#EC4899";

export default function MetaPage() {
  const [title, setTitle] = useState("My Awesome Page");
  const [description, setDescription] = useState("A brief description of my page for search engines and social sharing.");
  const [url, setUrl] = useState("https://example.com");
  const [image, setImage] = useState("https://example.com/og-image.jpg");
  const [author, setAuthor] = useState("");
  const [keywords, setKeywords] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("@example");
  const [copied, setCopied] = useState(false);

  const output = `<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}" />
<meta name="description" content="${description}" />${author ? `\n<meta name="author" content="${author}" />` : ""}${keywords ? `\n<meta name="keywords" content="${keywords}" />` : ""}

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />${image ? `\n<meta property="og:image" content="${image}" />` : ""}

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="${url}" />
<meta property="twitter:title" content="${title}" />${twitterHandle ? `\n<meta property="twitter:site" content="${twitterHandle}" />` : ""}
<meta property="twitter:description" content="${description}" />${image ? `\n<meta property="twitter:image" content="${image}" />` : ""}`;

  const copy = () => {
    navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const descLen = description.length;
  const titleLen = title.length;

  return (
    <ToolShell category="Web Design" categoryHref="/tools/webdesign" accent={accent} title="Meta Tag Generator" description="Generate SEO and Open Graph meta tags for any page — preview how it looks in Google and social sharing.">
      <div className="space-y-5">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] tracking-widest text-[#71717a] uppercase font-mono">title</label>
              <span className="text-[10px] font-mono" style={{ color: titleLen > 60 ? "#EF4444" : "#3f3f46" }}>{titleLen}/60</span>
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] tracking-widest text-[#71717a] uppercase font-mono">description</label>
              <span className="text-[10px] font-mono" style={{ color: descLen > 160 ? "#EF4444" : "#3f3f46" }}>{descLen}/160</span>
            </div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-1">URL</label>
              <input value={url} onChange={e => setUrl(e.target.value)}
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-3 py-2 text-xs font-mono text-[#e4e4e7] focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-1">OG Image URL</label>
              <input value={image} onChange={e => setImage(e.target.value)}
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-3 py-2 text-xs font-mono text-[#e4e4e7] focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-1">author</label>
              <input value={author} onChange={e => setAuthor(e.target.value)}
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-3 py-2 text-xs font-mono text-[#e4e4e7] focus:outline-none" placeholder="optional" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-1">Twitter handle</label>
              <input value={twitterHandle} onChange={e => setTwitterHandle(e.target.value)}
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-3 py-2 text-xs font-mono text-[#e4e4e7] focus:outline-none" placeholder="@handle" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-1">keywords (comma-separated)</label>
              <input value={keywords} onChange={e => setKeywords(e.target.value)}
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-3 py-2 text-xs font-mono text-[#e4e4e7] focus:outline-none" placeholder="optional" />
            </div>
          </div>
        </div>

        {/* Google preview */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
          <div className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest mb-3">Google preview</div>
          <div className="text-xs text-[#3f3f46] font-mono mb-1">{url}</div>
          <div className="text-base font-semibold" style={{ color: "#8ab4f8" }}>{title || "Page Title"}</div>
          <div className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">{description || "Page description..."}</div>
        </div>

        {/* Output */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 relative">
          <button onClick={copy} className="absolute top-3 right-3 px-3 py-1 text-[10px] font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>
            {copied ? "copied ✓" : "copy all"}
          </button>
          <pre className="text-xs font-mono text-[#e4e4e7] leading-relaxed overflow-x-auto whitespace-pre pr-20">{output}</pre>
        </div>
      </div>
    </ToolShell>
  );
}
