"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const accent = "#00FFFF";

type Tags = {
  title: string;
  artist: string;
  album: string;
  year: string;
  genre: string;
  track: string;
  comment: string;
};

const TAG_FIELDS: { key: keyof Tags; label: string; placeholder: string }[] = [
  { key: "title",   label: "Title",   placeholder: "Song title" },
  { key: "artist",  label: "Artist",  placeholder: "Artist name" },
  { key: "album",   label: "Album",   placeholder: "Album name" },
  { key: "year",    label: "Year",    placeholder: "2024" },
  { key: "genre",   label: "Genre",   placeholder: "Electronic" },
  { key: "track",   label: "Track #", placeholder: "1" },
  { key: "comment", label: "Comment", placeholder: "Notes..." },
];

export default function MetadataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<Tags>({ title: "", artist: "", album: "", year: "", genre: "", track: "", comment: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "done" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const handleFile = (f: File) => {
    setFile(f);
    setDownloadUrl(null);
    setStatus("idle");
    // Pre-fill title from filename
    const name = f.name.replace(/\.[^.]+$/, "");
    setTags((prev) => ({ ...prev, title: name }));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("audio/")) handleFile(f);
  }, []);

  const save = async () => {
    if (!file) return;
    try {
      setStatus("loading");
      const ffmpeg = await loadFFmpeg();
      setStatus("saving");
      const ext = file.name.split(".").pop() ?? "mp3";
      const inputName = `input.${ext}`;
      const outName = file.name.replace(/\.[^.]+$/, "") + `_tagged.${ext}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const metaArgs: string[] = [];
      if (tags.title)   metaArgs.push("-metadata", `title=${tags.title}`);
      if (tags.artist)  metaArgs.push("-metadata", `artist=${tags.artist}`);
      if (tags.album)   metaArgs.push("-metadata", `album=${tags.album}`);
      if (tags.year)    metaArgs.push("-metadata", `date=${tags.year}`);
      if (tags.genre)   metaArgs.push("-metadata", `genre=${tags.genre}`);
      if (tags.track)   metaArgs.push("-metadata", `track=${tags.track}`);
      if (tags.comment) metaArgs.push("-metadata", `comment=${tags.comment}`);

      await ffmpeg.exec(["-i", inputName, ...metaArgs, "-c", "copy", outName]);

      const data = await ffmpeg.readFile(outName);
      const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : (data as Uint8Array).slice(0);
      const blob = new Blob([uint8], { type: file.type });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <ToolShell category="Audio & Music" categoryHref="/tools/audio" accent={accent} title="Metadata Editor" description="Edit ID3 tags (title, artist, album, genre, year, track) on any audio file — in browser.">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !file && fileInputRef.current?.click()}
        className="border border-dashed rounded transition-all duration-200 p-8 text-center mb-6 cursor-pointer"
        style={{ borderColor: isDragging ? accent : "#2a2a2a", backgroundColor: isDragging ? `${accent}08` : "transparent" }}
      >
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {file ? (
          <div className="font-mono text-sm text-[#e4e4e7]">{file.name}</div>
        ) : (
          <>
            <div className="text-sm text-[#71717a] font-mono">drop audio file or click to browse</div>
            <div className="text-xs text-[#3f3f46] mt-1">MP3 · FLAC · M4A · OGG</div>
          </>
        )}
      </div>

      {file && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TAG_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className={key === "comment" ? "sm:col-span-2" : ""}>
                <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-1.5">{label}</label>
                <input
                  value={tags[key]}
                  onChange={(e) => setTags((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-3 py-2 text-sm font-mono text-[#e4e4e7] placeholder:text-[#3f3f46] focus:outline-none focus:border-[#00FFFF] transition-colors"
                />
              </div>
            ))}
          </div>

          <button onClick={save} disabled={status === "loading" || status === "saving"}
            className="w-full py-3 text-sm font-mono tracking-widest rounded border transition-all disabled:opacity-30"
            style={{ borderColor: accent, color: status === "done" ? "#0d0d0d" : accent, backgroundColor: status === "done" ? accent : `${accent}15` }}>
            {status === "loading" ? "loading engine..." : status === "saving" ? "saving tags..." : status === "done" ? "saved ✓" : "save tags"}
          </button>

          {downloadUrl && (
            <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
              <div className="text-xs font-mono text-[#e4e4e7]">tags saved — ready to download</div>
              <div className="flex gap-2">
                <a href={downloadUrl} download={file.name.replace(/\.[^.]+$/, "") + `_tagged.${file.name.split(".").pop()}`}
                  className="px-4 py-2 text-xs font-mono rounded" style={{ backgroundColor: accent, color: "#0d0d0d" }}>
                  download
                </a>
                <button onClick={() => { setFile(null); setDownloadUrl(null); setStatus("idle"); }}
                  className="px-4 py-2 text-xs font-mono rounded border border-[#2a2a2a] text-[#71717a]">
                  reset
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
