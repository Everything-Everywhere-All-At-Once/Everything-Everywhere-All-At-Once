"use client";

import Link from "next/link";
import HeroAscii from "@/components/ui/hero-ascii";
import { categories, totalTools } from "@/lib/tools";

export default function Home() {
  const liveCount = categories.reduce(
    (acc, cat) => acc + cat.tools.filter((t) => t.status === "live").length,
    0
  );

  return (
    <div className="min-h-screen text-[#e4e4e7]">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#0d0d0d]/98 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-5 h-12 flex items-center gap-6">
          <Link href="/" className="text-eeaao font-black text-sm tracking-[0.2em] font-mono shrink-0">
            EEAAO
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <Link href="/library"    className="px-3 py-1.5 text-[#a1a1aa] hover:text-[#e4e4e7] transition-colors tracking-widest">/library</Link>
            <Link href="/community"  className="px-3 py-1.5 text-[#a1a1aa] hover:text-[#00E5FF] transition-colors tracking-widest">/community</Link>
            <a
              href="https://github.com/Everything-Everywhere-All-At-Once/fuzzy-goggles"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-3 py-1.5 text-[#a1a1aa] hover:text-[#e4e4e7] transition-colors"
              title="View on GitHub"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <HeroAscii />

      {/* ── Category grid ── */}
      <section id="tools" className="max-w-7xl mx-auto px-5 py-16">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-4 h-px bg-[#FF2D87]/60" />
            <div className="w-4 h-px bg-[#00E5FF]/60" />
            <div className="w-4 h-px bg-[#FFD60A]/60" />
          </div>
          <p className="text-[#71717a] text-xs font-mono tracking-widest">
            {liveCount} tools &nbsp;·&nbsp; {categories.length} categories &nbsp;·&nbsp; 100% browser-native
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const live = cat.tools.filter((t) => t.status === "live").length;
            return (
              <Link
                key={cat.id}
                href={`/tools/${cat.id}`}
                className="group relative overflow-hidden rounded-lg border border-[#1e1e1e] bg-[#111111] p-6 transition-all duration-200 hover:border-opacity-50"
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = `${cat.accent}55`;
                  el.style.backgroundColor = `${cat.accent}08`;
                  el.style.boxShadow = `0 0 28px ${cat.accent}18, inset 0 0 20px ${cat.accent}06`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "#1e1e1e";
                  el.style.backgroundColor = "#111111";
                  el.style.boxShadow = "none";
                }}
              >
                {/* Accent strip */}
                <div
                  className="absolute inset-y-0 left-0 w-[3px] rounded-l opacity-30 group-hover:opacity-60 transition-opacity duration-200"
                  style={{ backgroundColor: cat.accent }}
                />

                {/* Icon + count */}
                <div className="flex items-start justify-between mb-4 pl-1">
                  <span className="text-2xl leading-none" style={{ color: cat.accent }}>
                    {cat.icon}
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${cat.accent}15`, color: cat.accent }}
                  >
                    {live} tools
                  </span>
                </div>

                {/* Label */}
                <h2 className="text-sm font-bold text-[#e4e4e7] mb-2 pl-1 leading-tight">
                  {cat.label}
                </h2>

                {/* Description */}
                <p className="text-[11px] text-[#52525b] leading-relaxed pl-1">
                  {cat.description}
                </p>

                {/* Arrow */}
                <div
                  className="mt-4 pl-1 text-[10px] font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ color: cat.accent }}
                >
                  explore →
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1a1a1a] py-6 px-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <span className="text-eeaao font-black">EEAAO</span>
            <span>—</span>
            <span>everything everywhere all at once · {totalTools} tools · no uploads · no accounts</span>
          </div>
          <div className="flex gap-5">
            <Link href="/library"   className="hover:text-[#52525b] transition-colors">/library</Link>
            <Link href="/community" className="hover:text-[#52525b] transition-colors">/community</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
