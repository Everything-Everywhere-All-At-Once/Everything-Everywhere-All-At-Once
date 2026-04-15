"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const accent = "#00FFFF";

type Project = {
  id: string;
  title: string;
  description: string;
  url: string;
  repo: string;
  tags: string[];
  author: string;
  authorUrl: string;
  tech: string;
  votes: number;
  voters: string[];
  createdAt: number;
};

const TAGS = [
  "Audio", "DJ / Music", "Image", "Video", "PDF / Docs", "Cybersecurity",
  "AI / ML", "Web Design", "Developer Tool", "Productivity", "Creative", "Game", "Other",
];

const STORAGE_KEY = "eeaao_projects_v1";
const VOTER_KEY   = "eeaao_voter_id";

function getVoterId(): string {
  let id = localStorage.getItem(VOTER_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(VOTER_KEY, id);
  }
  return id;
}

function load(): Project[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

function save(p: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}


export default function CommunityPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [voterId, setVoterId]   = useState("");
  const [sort, setSort]         = useState<"top" | "new">("top");
  const [tag, setTag]           = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [flash, setFlash]       = useState("");
  const [form, setForm]         = useState<Omit<Project, "id" | "votes" | "voters" | "createdAt">>({
    title: "", description: "", url: "", repo: "", tags: [], author: "", authorUrl: "", tech: "",
  });
  const [err, setErr] = useState("");

  useEffect(() => {
    setVoterId(getVoterId());
    setProjects(load());
  }, []);

  const visible = [...projects]
    .filter((p) => !tag || p.tags.includes(tag))
    .sort((a, b) => sort === "top" ? b.votes - a.votes : b.createdAt - a.createdAt);

  const vote = (id: string) => {
    setProjects((prev) => {
      const next = prev.map((p) => {
        if (p.id !== id) return p;
        const voted = p.voters.includes(voterId);
        return { ...p, votes: voted ? p.votes - 1 : p.votes + 1, voters: voted ? p.voters.filter((v) => v !== voterId) : [...p.voters, voterId] };
      });
      save(next);
      return next;
    });
  };

  const toggleTag = (t: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t],
    }));
  };

  const submit = () => {
    setErr("");
    if (!form.title.trim()) return setErr("title required");
    if (!form.description.trim()) return setErr("description required");
    if (!form.url && !form.repo) return setErr("at least a live URL or repo link required");
    if (form.url && !form.url.startsWith("http")) return setErr("URL must start with http");
    if (form.repo && !form.repo.startsWith("http")) return setErr("repo URL must start with http");

    const p: Project = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      author: form.author.trim() || "anonymous",
      tech: form.tech.trim(),
      votes: 1,
      voters: [voterId],
      createdAt: Date.now(),
    };
    const next = [p, ...projects];
    setProjects(next);
    save(next);
    setForm({ title: "", description: "", url: "", repo: "", tags: [], author: "", authorUrl: "", tech: "" });
    setShowForm(false);
    setFlash("Project posted!");
    setTimeout(() => setFlash(""), 4000);
  };

  const usedTags = [...new Set(projects.flatMap((p) => p.tags))];

  return (
    <div className="min-h-screen text-[#e4e4e7]">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#0d0d0d]/98 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-5 h-12 flex items-center gap-4">
          <Link href="/" className="shrink-0">
            <img src="/logo.png" alt="EEAAO" className="h-7 w-7 rounded-sm object-cover" />
          </Link>
          <div className="w-px h-4 bg-[#2a2a2a] shrink-0" />
          <span className="text-[10px] font-mono text-[#71717a] tracking-widest">/community</span>
          <div className="flex-1" />
          <Link href="/" className="text-[10px] font-mono text-[#71717a] hover:text-[#a1a1aa] transition-colors tracking-widest">← back</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-px bg-[#00FFFF]/50" />
            <span className="text-[10px] font-mono text-[#00FFFF]/50 tracking-widest">COMMUNITY</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Show your project</h1>
          <p className="text-sm text-[#52525b] leading-relaxed max-w-lg">
            Built something cool? Share it here. Tools, apps, experiments, scripts — anything goes.
            Upvote what you find interesting.
          </p>
        </div>

        {/* Flash */}
        {flash && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded border text-sm font-mono"
            style={{ borderColor: "#22C55E40", backgroundColor: "#22C55E08", color: "#22C55E" }}>
            ✓ {flash}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* Sort */}
          {(["top", "new"] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)}
              className="px-3 py-1.5 text-[10px] font-mono tracking-widest rounded border transition-all uppercase"
              style={sort === s
                ? { borderColor: `${accent}40`, color: accent, backgroundColor: `${accent}10` }
                : { borderColor: "#2a2a2a", color: "#52525b" }}>
              {s}
            </button>
          ))}

          {/* Tag filter */}
          {usedTags.map((t) => (
            <button key={t} onClick={() => setTag(tag === t ? null : t)}
              className="px-2 py-1 text-[9px] font-mono tracking-wider rounded border transition-all"
              style={tag === t
                ? { borderColor: "#71717a", color: "#e4e4e7", backgroundColor: "#2a2a2a" }
                : { borderColor: "#1e1e1e", color: "#3f3f46" }}>
              {t}
            </button>
          ))}

          <div className="flex-1" />

          <button onClick={() => setShowForm((v) => !v)}
            className="px-4 py-1.5 text-[10px] font-mono tracking-widest rounded border transition-all"
            style={{ borderColor: `${accent}40`, color: accent, backgroundColor: `${accent}10` }}>
            {showForm ? "cancel" : "+ post your project"}
          </button>
        </div>

        {/* Submit form */}
        {showForm && (
          <div className="mb-8 border border-[#2a2a2a] rounded-lg p-6 bg-[#111111]">
            <div className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest mb-5">new project</div>
            <div className="space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">project name *</label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="My Awesome Tool"
                    className="field-input" />
                </div>
                <div>
                  <label className="field-label">your name</label>
                  <input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                    placeholder="anonymous"
                    className="field-input" />
                </div>
              </div>

              <div>
                <label className="field-label">description *</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What does it do? What problem does it solve? What's interesting about it?"
                  rows={3} className="field-input resize-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">live URL</label>
                  <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    placeholder="https://myproject.com"
                    className="field-input" />
                </div>
                <div>
                  <label className="field-label">repo / source</label>
                  <input value={form.repo} onChange={(e) => setForm((f) => ({ ...f, repo: e.target.value }))}
                    placeholder="https://github.com/you/repo"
                    className="field-input" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">tech stack</label>
                  <input value={form.tech} onChange={(e) => setForm((f) => ({ ...f, tech: e.target.value }))}
                    placeholder="React, Node.js, Python..."
                    className="field-input" />
                </div>
                <div>
                  <label className="field-label">your profile / link (optional)</label>
                  <input value={form.authorUrl} onChange={(e) => setForm((f) => ({ ...f, authorUrl: e.target.value }))}
                    placeholder="https://github.com/you"
                    className="field-input" />
                </div>
              </div>

              <div>
                <label className="field-label">tags</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {TAGS.map((t) => (
                    <button key={t} type="button" onClick={() => toggleTag(t)}
                      className="px-2.5 py-1 text-[10px] font-mono rounded border transition-all"
                      style={form.tags.includes(t)
                        ? { borderColor: `${accent}50`, color: accent, backgroundColor: `${accent}12` }
                        : { borderColor: "#2a2a2a", color: "#52525b" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {err && <div className="text-[10px] font-mono text-[#EF4444]">{err}</div>}

              <button onClick={submit}
                className="px-6 py-2.5 text-[11px] font-mono tracking-widest rounded border transition-all"
                style={{ borderColor: `${accent}40`, color: accent, backgroundColor: `${accent}10` }}>
                post project
              </button>
            </div>
          </div>
        )}

        {/* Projects list */}
        {visible.length === 0 ? (
          <div className="text-center py-20 text-[#3f3f46] text-sm font-mono">
            no projects yet — be the first to post
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((p, idx) => {
              const voted = p.voters.includes(voterId);
              return (
                <article key={p.id}
                  className="flex gap-4 p-5 rounded-lg border border-[#1e1e1e] bg-[#111111] hover:border-[#2a2a2a] transition-colors">

                  {/* Rank */}
                  <div className="shrink-0 text-[10px] font-mono text-[#2a2a2a] w-5 text-right pt-1">
                    {idx + 1}
                  </div>

                  {/* Vote */}
                  <button onClick={() => vote(p.id)}
                    className="shrink-0 flex flex-col items-center gap-0.5 w-10 rounded border py-2 transition-all"
                    style={voted
                      ? { borderColor: `${accent}40`, backgroundColor: `${accent}10`, color: accent }
                      : { borderColor: "#1e1e1e", color: "#3f3f46" }}
                    title={voted ? "remove vote" : "upvote"}>
                    <span className="text-[10px] leading-none">▲</span>
                    <span className="text-sm font-mono font-bold leading-none">{p.votes}</span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                      <h2 className="text-sm font-semibold text-[#e4e4e7]">{p.title}</h2>
                      <div className="flex gap-1.5 flex-wrap">
                        {p.tags.map((t) => (
                          <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#52525b]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#71717a] leading-relaxed mb-3">{p.description}</p>

                    <div className="flex items-center gap-4 flex-wrap">
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] font-mono text-[#52525b] hover:text-[#00FFFF] transition-colors"
                          onClick={(e) => e.stopPropagation()}>
                          ↗ live
                        </a>
                      )}
                      {p.repo && (
                        <a href={p.repo} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] font-mono text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                          onClick={(e) => e.stopPropagation()}>
                          ⌥ source
                        </a>
                      )}
                      {p.tech && (
                        <span className="text-[10px] font-mono text-[#3f3f46]">{p.tech}</span>
                      )}
                      <span className="text-[10px] font-mono text-[#2a2a2a]">
                        by {p.authorUrl
                          ? <a href={p.authorUrl} target="_blank" rel="noopener noreferrer"
                              className="hover:text-[#52525b] transition-colors">{p.author}</a>
                          : p.author
                        }
                        {" "}· {timeAgo(p.createdAt)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-[10px] font-mono text-[#2a2a2a] text-center">
          posts & votes stored in your browser
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-[#1a1a1a] py-5 px-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-[10px] font-mono text-[#2a2a2a]">
          <span className="text-[#00FFFF]/40">EEAAO</span>
          <Link href="/" className="hover:text-[#52525b] transition-colors">← all tools</Link>
        </div>
      </footer>

      <style jsx global>{`
        .field-label {
          display: block;
          font-size: 10px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #52525b;
          margin-bottom: 4px;
        }
        .field-input {
          width: 100%;
          padding: 8px 12px;
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          font-size: 12px;
          font-family: ui-monospace, monospace;
          color: #e4e4e7;
          outline: none;
          transition: border-color 0.15s;
        }
        .field-input:focus { border-color: rgba(0,255,255,0.35); }
        .field-input::placeholder { color: #3f3f46; }
      `}</style>
    </div>
  );
}

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
