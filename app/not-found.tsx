import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen text-[#e4e4e7] flex flex-col items-center justify-center px-6">

      {/* Corner accents */}
      <div className="fixed top-0 left-0 w-8 h-8 border-t border-l border-[#00E5FF]/20" />
      <div className="fixed top-0 right-0 w-8 h-8 border-t border-r border-[#00E5FF]/20" />
      <div className="fixed bottom-0 left-0 w-8 h-8 border-b border-l border-[#00E5FF]/20" />
      <div className="fixed bottom-0 right-0 w-8 h-8 border-b border-r border-[#00E5FF]/20" />

      <div className="text-center max-w-sm">
        {/* Glitchy 404 */}
        <div className="relative mb-6 select-none">
          <div className="text-[80px] font-bold font-mono leading-none text-[#1a1a1a]">404</div>
          <div
            className="absolute inset-0 text-[80px] font-bold font-mono leading-none text-[#00E5FF] opacity-60"
            style={{ clipPath: "inset(30% 0 40% 0)", transform: "translateX(-3px)" }}
          >
            404
          </div>
          <div
            className="absolute inset-0 text-[80px] font-bold font-mono leading-none text-[#EF4444] opacity-40"
            style={{ clipPath: "inset(60% 0 10% 0)", transform: "translateX(3px)" }}
          >
            404
          </div>
        </div>

        <div className="flex items-center gap-2 justify-center mb-3">
          <div className="w-4 h-px bg-[#00E5FF]/40" />
          <span className="text-[10px] font-mono text-[#00E5FF]/60 tracking-widest">NOT FOUND</span>
          <div className="w-4 h-px bg-[#00E5FF]/40" />
        </div>

        <p className="text-xs text-[#52525b] font-mono mb-8 leading-relaxed">
          this tool or page doesn&apos;t exist — yet
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 text-[11px] font-mono tracking-widest border border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/08 transition-all rounded"
          >
            ← all tools
          </Link>
          <Link
            href="/community"
            className="px-6 py-2.5 text-[11px] font-mono tracking-widest border border-[#2a2a2a] text-[#52525b] hover:border-[#3f3f46] hover:text-[#a1a1aa] transition-all rounded"
          >
            suggest it
          </Link>
        </div>
      </div>

      {/* Bottom label */}
      <div className="fixed bottom-6 text-[9px] font-mono text-[#2a2a2a] tracking-widest">
        EEAAO · EVERYTHING EVERYWHERE ALL AT ONCE
      </div>
    </div>
  );
}
