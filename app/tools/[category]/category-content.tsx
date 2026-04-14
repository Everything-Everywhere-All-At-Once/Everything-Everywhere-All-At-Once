"use client";

import Link from "next/link";
import { type Category } from "@/lib/tools";

export function CategoryContent({ cat }: { cat: Category }) {
  const live = cat.tools.filter((t) => t.status === "live");
  const soon = cat.tools.filter((t) => t.status === "soon");

  return (
    <main className="max-w-5xl mx-auto px-5 py-10">
      {live.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {live.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative overflow-hidden rounded-lg border border-[#1e1e1e] bg-[#111111] p-5 transition-all duration-150"
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = `${cat.accent}50`;
                el.style.backgroundColor = `${cat.accent}07`;
                el.style.boxShadow = `0 0 24px ${cat.accent}15`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "#1e1e1e";
                el.style.backgroundColor = "#111111";
                el.style.boxShadow = "none";
              }}
            >
              <div
                className="absolute inset-y-0 left-0 w-[3px] rounded-l opacity-25 group-hover:opacity-50 transition-opacity"
                style={{ backgroundColor: cat.accent }}
              />
              <div className="flex items-start justify-between gap-2 mb-3 pl-1">
                <h2 className="text-sm font-semibold text-[#e4e4e7] leading-snug">{tool.name}</h2>
                <div
                  className="w-2 h-2 rounded-full shrink-0 mt-1 animate-pulse"
                  style={{ backgroundColor: cat.accent, opacity: 0.5 }}
                />
              </div>
              <p className="text-xs text-[#52525b] leading-relaxed pl-1 mb-4">{tool.description}</p>
              <div
                className="pl-1 text-[10px] font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: cat.accent }}
              >
                open →
              </div>
            </Link>
          ))}
        </div>
      )}

      {soon.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-[#3f3f46] uppercase tracking-widest mb-4">coming soon</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {soon.map((tool) => (
              <div
                key={tool.href}
                className="relative overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-5 opacity-40"
              >
                <div
                  className="absolute inset-y-0 left-0 w-[3px] rounded-l opacity-10"
                  style={{ backgroundColor: cat.accent }}
                />
                <h2 className="text-sm font-semibold text-[#71717a] pl-1 mb-2">{tool.name}</h2>
                <p className="text-xs text-[#3f3f46] leading-relaxed pl-1">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
