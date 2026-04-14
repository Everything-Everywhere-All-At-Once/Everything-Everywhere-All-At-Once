"use client";

import Link from "next/link";

interface ToolShellProps {
  category: string;
  categoryHref: string;
  accent: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ToolShell({
  category,
  categoryHref,
  accent,
  title,
  description,
  children,
}: ToolShellProps) {
  return (
    <div className="min-h-screen text-[#e4e4e7]">
      {/* Nav */}
      <nav className="border-b border-[#2a2a2a] px-6 py-4 flex items-center gap-3 sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-sm">
        <Link href="/" className="text-eeaao font-black tracking-widest text-sm hover:opacity-80 transition-opacity">
          EEAAO
        </Link>
        <span className="text-[#3f3f46]">/</span>
        <Link href={categoryHref} className="text-[#a1a1aa] text-xs tracking-wider hover:text-[#e4e4e7] transition-colors">
          {category}
        </Link>
        <span className="text-[#3f3f46]">/</span>
        <span className="text-xs tracking-wider" style={{ color: accent }}>{title}</span>
      </nav>

      {/* Header */}
      <header className="border-b border-[#2a2a2a] px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 rounded-full" style={{ backgroundColor: accent }} />
            <span className="text-[10px] tracking-[0.3em] uppercase font-mono" style={{ color: accent }}>
              {category}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#e4e4e7] tracking-tight mb-1">{title}</h1>
          <p className="text-sm text-[#a1a1aa]">{description}</p>
        </div>
      </header>

      {/* Tool Content */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}
