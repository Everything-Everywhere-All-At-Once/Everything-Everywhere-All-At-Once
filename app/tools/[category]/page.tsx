import { notFound } from "next/navigation";
import { categories } from "@/lib/tools";
import Link from "next/link";
import { CategoryContent } from "./category-content";

export function generateStaticParams() {
  return categories.map((cat) => ({ category: cat.id }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: id } = await params;
  const cat = categories.find((c) => c.id === id);
  if (!cat) notFound();

  return (
    <div className="min-h-screen text-[#e4e4e7]">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#0d0d0d]/98 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 h-12 flex items-center gap-3">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="EEAAO" className="h-6 w-6 rounded-sm object-cover" />
          </Link>
          <span className="text-[#2a2a2a] font-mono">/</span>
          <span className="text-[11px] font-mono tracking-widest" style={{ color: cat.accent }}>
            {cat.label}
          </span>
          <div className="flex-1" />
          <Link href="/" className="text-[10px] font-mono text-[#52525b] hover:text-[#a1a1aa] transition-colors tracking-widest">
            ← all categories
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-5 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-px" style={{ backgroundColor: cat.accent }} />
            <span className="text-[10px] font-mono tracking-widest" style={{ color: `${cat.accent}80` }}>
              {cat.tools.filter((t) => t.status === "live").length} tools available
            </span>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-3xl" style={{ color: cat.accent }}>{cat.icon}</span>
            <h1 className="text-2xl font-bold tracking-tight">{cat.label}</h1>
          </div>
          <p className="text-sm text-[#52525b] max-w-xl leading-relaxed">{cat.description}</p>
        </div>
      </header>

      <CategoryContent cat={cat} />

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-5 px-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[10px] font-mono text-[#2a2a2a]">
          <img src="/logo.png" alt="EEAAO" className="h-5 w-5 rounded-sm object-cover opacity-40" />
          <Link href="/" className="hover:text-[#52525b] transition-colors">← all categories</Link>
        </div>
      </footer>
    </div>
  );
}
